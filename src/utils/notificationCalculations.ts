import {
  Notification,
  NotificationFilters,
  NotificationPriority,
  NotificationSourceEntityType,
  NotificationSummaryMetrics,
  NotificationType,
} from '../types';

/**
 * Action-required notification types representing pending operational actions
 */
export const ACTION_REQUIRED_NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set([
  'SAFETY_REVIEW',
  'SAFETY_FOLLOWUP',
  'COMPLIANCE_REVIEW',
  'CAPA_OVERDUE',
  'TASK_ASSIGNED',
  'TASK_REVIEW',
  'TASK_REVISION',
  'TASK_OVERDUE',
  'DOCUMENT_EXPIRING',
  'DOCUMENT_EXPIRED',
  'VISIT_DUE',
  'VISIT_OVERDUE',
]);

/**
 * Evaluates whether a notification constitutes an active action item.
 * Rule: Must be UNREAD and belong to an operational action category.
 */
export function isActionRequiredNotification(notification: Notification): boolean {
  if (notification.status !== 'UNREAD') {
    return false;
  }
  return ACTION_REQUIRED_NOTIFICATION_TYPES.has(notification.type);
}

/**
 * Checks whether a notification's optional expiration date has passed
 */
export function isNotificationExpired(notification: Notification, referenceDateStr?: string): boolean {
  if (!notification.expiresAt) return false;
  const ref = referenceDateStr ? new Date(referenceDateStr).getTime() : Date.now();
  return new Date(notification.expiresAt).getTime() < ref;
}

/**
 * Filters a notification array using composite AND criteria
 */
export function filterNotifications(
  notifications: Notification[],
  filters?: NotificationFilters
): Notification[] {
  if (!filters || Object.keys(filters).length === 0) {
    return [...notifications];
  }

  return notifications.filter((notif) => {
    // 1. Text search across title, message, sourceEntityId
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const matchTitle = notif.title.toLowerCase().includes(q);
      const matchMsg = notif.message.toLowerCase().includes(q);
      const matchSource = notif.sourceEntityId ? notif.sourceEntityId.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchMsg && !matchSource) {
        return false;
      }
    }

    // 2. Notification Type filter
    if (filters.type && notif.type !== filters.type) {
      return false;
    }

    // 3. Priority filter
    if (filters.priority && notif.priority !== filters.priority) {
      return false;
    }

    // 4. Status filter
    if (filters.status && notif.status !== filters.status) {
      return false;
    }

    // 5. Unread only shorthand toggle
    if (filters.unreadOnly && notif.status !== 'UNREAD') {
      return false;
    }

    // 6. Date Range filter (created at)
    if (filters.dateFrom) {
      const notifDate = notif.createdAt.slice(0, 10);
      if (notifDate < filters.dateFrom) {
        return false;
      }
    }

    if (filters.dateTo) {
      const notifDate = notif.createdAt.slice(0, 10);
      if (notifDate > filters.dateTo) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Computes deterministic summary metrics for notifications within scope
 */
export function calculateNotificationSummary(
  notifications: Notification[],
  referenceDateStr?: string
): NotificationSummaryMetrics {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const todayStr = refDate.toISOString().slice(0, 10);

  let unread = 0;
  let highPriority = 0;
  let actionRequired = 0;
  let today = 0;

  for (const n of notifications) {
    if (n.status === 'UNREAD') {
      unread++;
      if (isActionRequiredNotification(n)) {
        actionRequired++;
      }
    }

    // Active (non-dismissed) high-priority notifications
    if (n.priority === 'HIGH' && n.status !== 'DISMISSED') {
      highPriority++;
    }

    if (n.createdAt.slice(0, 10) === todayStr) {
      today++;
    }
  }

  return {
    total: notifications.length,
    unread,
    highPriority,
    actionRequired,
    today,
  };
}

/**
 * Deterministic duplicate notification guard:
 * Prevents active duplicate notifications for the same recipient, source entity, and type.
 */
export function isDuplicateActiveNotification(
  existingNotifications: Notification[],
  candidate: {
    recipientUserId: string;
    type: NotificationType;
    sourceEntityType?: NotificationSourceEntityType;
    sourceEntityId?: string;
  }
): boolean {
  return existingNotifications.some((n) => {
    // Only active UNREAD notifications count toward duplicate prevention
    if (n.status !== 'UNREAD') return false;
    if (n.recipientUserId !== candidate.recipientUserId) return false;
    if (n.type !== candidate.type) return false;

    // Both must match entity ID or both be undefined
    if (candidate.sourceEntityId && n.sourceEntityId) {
      return (
        n.sourceEntityId === candidate.sourceEntityId &&
        n.sourceEntityType === candidate.sourceEntityType
      );
    }
    return !candidate.sourceEntityId && !n.sourceEntityId;
  });
}

/**
 * Determines default action route based on source entity type
 */
export function getDefaultActionRoute(
  sourceEntityType?: NotificationSourceEntityType,
  sourceEntityId?: string
): string | undefined {
  if (!sourceEntityType || !sourceEntityId) return undefined;

  switch (sourceEntityType) {
    case 'SAFETY_EVENT':
      return `/pi/safety/${sourceEntityId}`;
    case 'PROTOCOL_DEVIATION':
      return `/pi/compliance/${sourceEntityId}`;
    case 'TASK':
      return `/pi/tasks/${sourceEntityId}`;
    case 'DOCUMENT':
      return `/pi/documents/${sourceEntityId}`;
    case 'VISIT':
      return `/pi/visits/${sourceEntityId}`;
    case 'PARTICIPANT':
      return `/pi/patients/${sourceEntityId}`;
    case 'TEAM_MEMBER':
      return `/pi/team/${sourceEntityId}`;
    case 'VISIT_DATA_RECORD':
      return `/data-entry/records/${sourceEntityId}`;
    default:
      return undefined;
  }
}

/**
 * Human-readable relative time formatter
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const past = new Date(isoString).getTime();
    const now = Date.now();
    const diffMs = now - past;

    if (diffMs < 5000) return 'Just now';

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;

    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return isoString;
  }
}

/**
 * Priority label and semantic color helpers
 */
export function getPriorityColorClasses(priority: NotificationPriority): {
  badge: string;
  border: string;
  dot: string;
} {
  switch (priority) {
    case 'HIGH':
      return {
        badge: 'bg-rose-50 text-rose-800 border-rose-200',
        border: 'border-l-4 border-l-rose-600',
        dot: 'bg-rose-600',
      };
    case 'MEDIUM':
      return {
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        border: 'border-l-4 border-l-amber-500',
        dot: 'bg-amber-500',
      };
    case 'NORMAL':
    default:
      return {
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        border: 'border-l-4 border-l-slate-400',
        dot: 'bg-slate-400',
      };
  }
}
