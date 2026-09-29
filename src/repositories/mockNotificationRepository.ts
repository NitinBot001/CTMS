import {
  INotificationRepository,
  NotificationQueryContext,
} from './interfaces';
import {
  Notification,
  NotificationFilters,
  NotificationSummaryMetrics,
} from '../types';
import { mockNotifications } from '../data/mockData';
import {
  calculateNotificationSummary,
  filterNotifications,
  isDuplicateActiveNotification,
} from '../utils/notificationCalculations';

export class MockNotificationRepository implements INotificationRepository {
  private notifications: Notification[];

  constructor(initialData?: Notification[]) {
    // Clone synthetic mock notifications into mutable in-memory repository store
    this.notifications = initialData ? [...initialData] : [...mockNotifications];
  }

  /**
   * Helper to strictly enforce study, site, and recipient user isolation
   */
  private getScopedNotifications(context: NotificationQueryContext): Notification[] {
    if (!context.studyId || !context.siteId || !context.recipientUserId) {
      return [];
    }
    return this.notifications.filter(
      (n) =>
        n.studyId === context.studyId &&
        n.siteId === context.siteId &&
        n.recipientUserId === context.recipientUserId
    );
  }

  /**
   * Retrieves all notifications scoped to study, site, and recipient with optional filters
   */
  async getNotifications(
    context: NotificationQueryContext,
    filters?: NotificationFilters
  ): Promise<Notification[]> {
    const scoped = this.getScopedNotifications(context);
    // Sort newest first by default
    const sorted = [...scoped].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return filterNotifications(sorted, filters);
  }

  /**
   * Retrieves a single notification by ID within the active scope
   */
  async getNotificationById(
    context: NotificationQueryContext,
    notificationId: string
  ): Promise<Notification | null> {
    const scoped = this.getScopedNotifications(context);
    return scoped.find((n) => n.id === notificationId) || null;
  }

  /**
   * Retrieves summary metric counters for the active scope
   */
  async getNotificationSummary(
    context: NotificationQueryContext
  ): Promise<NotificationSummaryMetrics> {
    const scoped = this.getScopedNotifications(context);
    return calculateNotificationSummary(scoped);
  }

  /**
   * Marks a specific notification as READ with timestamp recording
   */
  async markAsRead(
    context: NotificationQueryContext,
    notificationId: string
  ): Promise<Notification> {
    const target = this.notifications.find(
      (n) =>
        n.id === notificationId &&
        n.studyId === context.studyId &&
        n.siteId === context.siteId &&
        n.recipientUserId === context.recipientUserId
    );

    if (!target) {
      throw new Error(
        `Notification "${notificationId}" not found in current study/site/user scope.`
      );
    }

    target.status = 'READ';
    target.readAt = new Date().toISOString();
    return { ...target };
  }

  /**
   * Marks all UNREAD notifications in active scope as READ
   */
  async markAllAsRead(context: NotificationQueryContext): Promise<number> {
    const now = new Date().toISOString();
    let count = 0;

    for (const n of this.notifications) {
      if (
        n.studyId === context.studyId &&
        n.siteId === context.siteId &&
        n.recipientUserId === context.recipientUserId &&
        n.status === 'UNREAD'
      ) {
        n.status = 'READ';
        n.readAt = now;
        count++;
      }
    }

    return count;
  }

  /**
   * Dismisses a notification in active scope
   */
  async dismissNotification(
    context: NotificationQueryContext,
    notificationId: string
  ): Promise<Notification> {
    const target = this.notifications.find(
      (n) =>
        n.id === notificationId &&
        n.studyId === context.studyId &&
        n.siteId === context.siteId &&
        n.recipientUserId === context.recipientUserId
    );

    if (!target) {
      throw new Error(
        `Notification "${notificationId}" not found in current study/site/user scope.`
      );
    }

    target.status = 'DISMISSED';
    return { ...target };
  }

  /**
   * Retrieves active unread notification count
   */
  async getUnreadCount(context: NotificationQueryContext): Promise<number> {
    const scoped = this.getScopedNotifications(context);
    return scoped.filter((n) => n.status === 'UNREAD').length;
  }

  /**
   * Adds a notification with duplicate prevention
   */
  async createNotification(
    context: NotificationQueryContext,
    input: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<Notification> {
    // Duplicate prevention rule
    const isDuplicate = isDuplicateActiveNotification(this.notifications, {
      recipientUserId: context.recipientUserId,
      type: input.type,
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: input.sourceEntityId,
    });

    if (isDuplicate) {
      throw new Error(
        `Duplicate active notification exists for entity ${input.sourceEntityId || 'N/A'} of type ${input.type}.`
      );
    }

    const newNotification: Notification = {
      ...input,
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studyId: context.studyId,
      siteId: context.siteId,
      recipientUserId: context.recipientUserId,
      createdAt: new Date().toISOString(),
    };

    this.notifications.unshift(newNotification);
    return { ...newNotification };
  }
}

export const mockNotificationRepository = new MockNotificationRepository();
