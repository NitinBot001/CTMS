import {
  INotificationRepository,
  NotificationQueryContext,
} from '../repositories/interfaces';
import { environmentService } from './environmentService';
import {
  Notification,
  NotificationFilters,
  NotificationSummaryMetrics,
} from '../types';
import { safetyService } from './safetyService';
import { complianceService } from './complianceService';
import { taskService } from './taskService';
import { documentService } from './documentService';
import { visitService } from './visitService';
import { participantService } from './participantService';
import { teamService } from './teamService';

export class NotificationService {
  private _customRepo?: INotificationRepository;

  constructor(repo?: INotificationRepository) {
    this._customRepo = repo;
  }

  private get repo(): INotificationRepository {
    return this._customRepo || environmentService.getNotificationRepository();
  }

  /**
   * Retrieves notifications scoped strictly to study, site, and recipient user
   */
  async getNotifications(
    context: NotificationQueryContext,
    filters?: NotificationFilters
  ): Promise<Notification[]> {
    if (!context.studyId || !context.siteId || !context.recipientUserId) {
      return [];
    }
    return this.repo.getNotifications(context, filters);
  }

  /**
   * Retrieves single notification by ID within active scope
   */
  async getNotificationById(
    context: NotificationQueryContext,
    notificationId: string
  ): Promise<Notification | null> {
    if (!context.studyId || !context.siteId || !context.recipientUserId) {
      return null;
    }
    return this.repo.getNotificationById(context, notificationId);
  }

  /**
   * Derives operational summary metrics for active user's notifications
   */
  async getNotificationSummary(
    context: NotificationQueryContext
  ): Promise<NotificationSummaryMetrics> {
    if (!context.studyId || !context.siteId || !context.recipientUserId) {
      return { total: 0, unread: 0, highPriority: 0, actionRequired: 0, today: 0 };
    }
    return this.repo.getNotificationSummary(context);
  }

  /**
   * Retrieves active unread notification count
   */
  async getUnreadCount(context: NotificationQueryContext): Promise<number> {
    if (!context.studyId || !context.siteId || !context.recipientUserId) {
      return 0;
    }
    return this.repo.getUnreadCount(context);
  }

  /**
   * Marks a specific notification as READ
   */
  async markAsRead(
    context: NotificationQueryContext,
    notificationId: string
  ): Promise<Notification> {
    if (!context.studyId || !context.siteId || !context.recipientUserId) {
      throw new Error('Study, site, and recipient user context are required.');
    }
    return this.repo.markAsRead(context, notificationId);
  }

  /**
   * Marks all UNREAD notifications in active scope as READ
   */
  async markAllAsRead(context: NotificationQueryContext): Promise<number> {
    if (!context.studyId || !context.siteId || !context.recipientUserId) {
      return 0;
    }
    return this.repo.markAllAsRead(context);
  }

  /**
   * Dismisses a notification in active scope
   */
  async dismissNotification(
    context: NotificationQueryContext,
    notificationId: string
  ): Promise<Notification> {
    if (!context.studyId || !context.siteId || !context.recipientUserId) {
      throw new Error('Study, site, and recipient user context are required.');
    }
    return this.repo.dismissNotification(context, notificationId);
  }

  /**
   * Checks whether the underlying domain entity referenced by a notification exists
   * Returns false if the entity has been deleted or cannot be found in the current study/site scope.
   */
  async verifySourceEntityAvailable(
    context: NotificationQueryContext,
    notification: Notification
  ): Promise<boolean> {
    if (!notification.sourceEntityType || !notification.sourceEntityId) {
      return true; // No entity attached; not missing
    }

    try {
      const pContext = { studyId: context.studyId, siteId: context.siteId };

      switch (notification.sourceEntityType) {
        case 'SAFETY_EVENT': {
          const events = await safetyService.getSafetyEvents(pContext);
          return events.some((e) => e.id === notification.sourceEntityId);
        }
        case 'PROTOCOL_DEVIATION': {
          const deviations = await complianceService.getDeviations(pContext);
          return deviations.some((d) => d.id === notification.sourceEntityId);
        }
        case 'TASK': {
          const tasks = await taskService.getTasks(pContext);
          return tasks.some((t) => t.id === notification.sourceEntityId);
        }
        case 'DOCUMENT': {
          const docs = await documentService.getDocuments(pContext);
          return docs.some((d) => d.id === notification.sourceEntityId);
        }
        case 'VISIT': {
          const visits = await visitService.getVisits(pContext);
          return visits.some((v) => v.id === notification.sourceEntityId);
        }
        case 'PARTICIPANT': {
          const parts = await participantService.getParticipants(pContext);
          return parts.some((p) => p.id === notification.sourceEntityId);
        }
        case 'TEAM_MEMBER': {
          const members = await teamService.getTeamMembers(pContext);
          return members.some((m) => m.user.id === notification.sourceEntityId);
        }
        default:
          return true;
      }
    } catch {
      return false;
    }
  }
}

export const notificationService = new NotificationService();
