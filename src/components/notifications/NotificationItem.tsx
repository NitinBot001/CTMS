import React from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  X,
  ExternalLink,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';
import { Notification } from '../../types';
import { NotificationPriorityBadge } from './NotificationPriorityBadge';
import { NotificationTypeBadge } from './NotificationTypeBadge';
import {
  formatRelativeTime,
  getDefaultActionRoute,
  getPriorityColorClasses,
} from '../../utils/notificationCalculations';

interface NotificationItemProps {
  notification: Notification;
  isSourceEntityAvailable?: boolean;
  onMarkAsRead: (notificationId: string) => void;
  onDismiss: (notificationId: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  isSourceEntityAvailable = true,
  onMarkAsRead,
  onDismiss,
}) => {
  const isUnread = notification.status === 'UNREAD';
  const isDismissed = notification.status === 'DISMISSED';
  const priorityColors = getPriorityColorClasses(notification.priority);

  const actionRoute =
    notification.actionRoute ||
    getDefaultActionRoute(notification.sourceEntityType, notification.sourceEntityId);

  const handleActionClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`border rounded-sm transition-all duration-150 ${priorityColors.border} ${
        isUnread
          ? 'bg-surface border-border shadow-subtle'
          : isDismissed
          ? 'bg-surface-soft/60 border-border-light opacity-60'
          : 'bg-surface border-border-light'
      }`}
    >
      <div className="p-4 sm:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Main Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header Badges & Time */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {isUnread && (
              <span
                className="w-2 h-2 rounded-full bg-accent animate-pulse"
                title="Unread notification"
                aria-label="Unread"
              />
            )}
            <NotificationTypeBadge type={notification.type} />
            <NotificationPriorityBadge priority={notification.priority} />

            {notification.status === 'DISMISSED' && (
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded-sm bg-slate-100 text-slate-500 border border-slate-200">
                Dismissed
              </span>
            )}

            <div className="flex items-center gap-1 text-[11px] text-ink-muted ml-auto md:ml-0">
              <Clock className="w-3 h-3 text-ink-muted" />
              <span>{formatRelativeTime(notification.createdAt)}</span>
            </div>
          </div>

          {/* Title & Message */}
          <div>
            <h4
              className={`text-sm ${
                isUnread ? 'font-bold text-ink' : 'font-semibold text-ink-secondary'
              }`}
            >
              {notification.title}
            </h4>
            <p className="text-xs text-ink-muted leading-relaxed mt-0.5">
              {notification.message}
            </p>
          </div>

          {/* Source entity reference */}
          {notification.sourceEntityType && notification.sourceEntityId && (
            <div className="flex items-center gap-1.5 text-[11px] text-ink-muted pt-0.5">
              <Layers className="w-3 h-3 text-ink-muted" />
              <span>Linked Entity:</span>
              <span className="font-mono text-ink font-medium">
                {notification.sourceEntityId}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border-light justify-end">
          {/* Navigation Action */}
          {actionRoute && (
            <>
              {isSourceEntityAvailable ? (
                <Link
                  to={actionRoute}
                  onClick={handleActionClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent hover:text-accent-hover bg-accent/5 hover:bg-accent/10 border border-accent/20 rounded-sm transition-colors"
                >
                  <span>{notification.actionLabel || 'View Record'}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              ) : (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-sm cursor-help"
                  title="The referenced source record could not be found in current scope"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Source record unavailable</span>
                </span>
              )}
            </>
          )}

          {/* Mark as Read Button */}
          {isUnread && (
            <button
              type="button"
              onClick={() => onMarkAsRead(notification.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-ink-muted hover:text-ink bg-surface border border-border hover:bg-surface-soft rounded-sm transition-colors"
              title="Mark as read"
            >
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Mark Read</span>
            </button>
          )}

          {/* Dismiss Button */}
          {!isDismissed && (
            <button
              type="button"
              onClick={() => onDismiss(notification.id)}
              className="p-1.5 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-colors"
              title="Dismiss notification"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
