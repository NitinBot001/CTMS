import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ExternalLink, AlertTriangle, Clock, Layers } from 'lucide-react';
import { Notification } from '../../types';
import { NotificationPriorityBadge } from './NotificationPriorityBadge';
import { NotificationTypeBadge } from './NotificationTypeBadge';
import {
  formatRelativeTime,
  getDefaultActionRoute,
  getPriorityColorClasses,
} from '../../utils/notificationCalculations';

interface NotificationMobileCardProps {
  notification: Notification;
  isSourceEntityAvailable?: boolean;
  onMarkAsRead: (notificationId: string) => void;
  onDismiss: (notificationId: string) => void;
}

export const NotificationMobileCard: React.FC<NotificationMobileCardProps> = ({
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
      className={`border rounded-sm p-3.5 space-y-2.5 transition-all ${priorityColors.border} ${
        isUnread
          ? 'bg-surface border-border shadow-subtle'
          : isDismissed
          ? 'bg-surface-soft/60 border-border-light opacity-60'
          : 'bg-surface border-border-light'
      }`}
    >
      {/* Top line: Badges & Time & Dismiss */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isUnread && (
            <span
              className="w-2 h-2 rounded-full bg-accent animate-pulse"
              title="Unread"
            />
          )}
          <NotificationTypeBadge type={notification.type} />
          <NotificationPriorityBadge priority={notification.priority} />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-ink-muted flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(notification.createdAt)}
          </span>
          {!isDismissed && (
            <button
              type="button"
              onClick={() => onDismiss(notification.id)}
              className="p-1 text-ink-muted hover:text-rose-600 rounded-sm"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Title & Message */}
      <div>
        <h4
          className={`text-xs ${
            isUnread ? 'font-bold text-ink' : 'font-semibold text-ink-secondary'
          }`}
        >
          {notification.title}
        </h4>
        <p className="text-[11px] text-ink-muted leading-relaxed mt-0.5">
          {notification.message}
        </p>
      </div>

      {/* Entity Link & Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-light text-[11px]">
        {notification.sourceEntityId ? (
          <div className="flex items-center gap-1 text-ink-muted">
            <Layers className="w-3 h-3" />
            <span className="font-mono text-ink font-medium">
              {notification.sourceEntityId}
            </span>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1.5">
          {isUnread && (
            <button
              type="button"
              onClick={() => onMarkAsRead(notification.id)}
              className="px-2 py-1 text-[11px] text-ink-muted hover:text-ink bg-surface border border-border rounded-sm flex items-center gap-1"
            >
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Read</span>
            </button>
          )}

          {actionRoute && (
            <>
              {isSourceEntityAvailable ? (
                <Link
                  to={actionRoute}
                  onClick={handleActionClick}
                  className="px-2.5 py-1 text-[11px] font-medium text-accent bg-accent/10 border border-accent/20 rounded-sm flex items-center gap-1"
                >
                  <span>{notification.actionLabel || 'View'}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              ) : (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Unavailable
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
