import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink, Check, BellOff } from 'lucide-react';
import { Notification } from '../../types';
import { notificationService } from '../../services/notificationService';
import { NotificationPriorityBadge } from './NotificationPriorityBadge';
import { NotificationTypeBadge } from './NotificationTypeBadge';
import { useAuth } from '../../context/AuthContext';
import {
  formatRelativeTime,
  getDefaultActionRoute,
  getPriorityColorClasses,
} from '../../utils/notificationCalculations';

interface NotificationPopoverProps {
  studyId?: string;
  siteId?: string;
  recipientUserId?: string;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  studyId,
  siteId,
  recipientUserId: propRecipientUserId,
}) => {
  const { currentUser } = useAuth();
  const recipientUserId = propRecipientUserId || currentUser?.id || '';
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!studyId || !siteId || !recipientUserId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      const context = { studyId, siteId, recipientUserId };
      const [allNotifs, count] = await Promise.all([
        notificationService.getNotifications(context),
        notificationService.getUnreadCount(context),
      ]);
      setNotifications(allNotifs);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications in popover:', err);
    } finally {
      setLoading(false);
    }
  }, [studyId, siteId, recipientUserId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!studyId || !siteId || !recipientUserId) return;
    try {
      const context = { studyId, siteId, recipientUserId };
      await notificationService.markAsRead(context, id);
      await loadNotifications();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!studyId || !siteId || !recipientUserId) return;
    try {
      const context = { studyId, siteId, recipientUserId };
      await notificationService.markAllAsRead(context);
      await loadNotifications();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const recentNotifications = notifications.slice(0, 6);

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            loadNotifications();
          }
        }}
        className="relative p-2 text-ink-secondary hover:text-ink hover:bg-surface-soft rounded-sm focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-accent text-white text-[10px] font-bold rounded-full font-mono shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-sm shadow-card z-50 overflow-hidden flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="p-3 border-b border-border bg-surface-soft flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-ink text-xs">
                Notifications & Alerts
              </span>
              {unreadCount > 0 ? (
                <span className="px-1.5 py-0.2 text-[10px] font-semibold font-mono rounded bg-accent/15 text-accent border border-accent/20">
                  {unreadCount} Unread
                </span>
              ) : (
                <span className="px-1.5 py-0.2 text-[10px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Caught up
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent-hover transition-colors"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List of items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border-light">
            {loading ? (
              <div className="p-6 text-center text-xs text-ink-muted">
                Loading notifications...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <BellOff className="w-8 h-8 text-ink-muted/50 mx-auto mb-2" />
                <p className="text-xs font-medium text-ink">No notifications</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  No active notifications in this study and site.
                </p>
              </div>
            ) : (
              recentNotifications.map((notif) => {
                const isUnread = notif.status === 'UNREAD';
                const priorityColors = getPriorityColorClasses(notif.priority);
                const actionRoute =
                  notif.actionRoute ||
                  getDefaultActionRoute(notif.sourceEntityType, notif.sourceEntityId);

                return (
                  <div
                    key={notif.id}
                    className={`p-3 text-xs transition-colors hover:bg-surface-soft/80 ${
                      priorityColors.border
                    } ${isUnread ? 'bg-amber-50/20' : 'bg-surface'}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isUnread && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-accent"
                            title="Unread"
                          />
                        )}
                        <NotificationTypeBadge type={notif.type} />
                        <NotificationPriorityBadge priority={notif.priority} />
                      </div>
                      <span className="text-[10px] text-ink-muted whitespace-nowrap">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p
                      className={`text-xs leading-snug ${
                        isUnread ? 'font-bold text-ink' : 'font-medium text-ink-secondary'
                      }`}
                    >
                      {notif.title}
                    </p>

                    <p className="text-[11px] text-ink-muted line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-border-light/60">
                      {actionRoute ? (
                        <Link
                          to={actionRoute}
                          onClick={() => {
                            if (isUnread) handleMarkAsRead(notif.id);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                        >
                          <span>{notif.actionLabel || 'View Record'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <div />
                      )}

                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="inline-flex items-center gap-1 text-[10px] text-ink-muted hover:text-ink px-1.5 py-0.5 rounded border border-border bg-surface"
                          title="Mark read"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Read</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-border bg-surface-soft flex items-center justify-between text-xs">
            <Link
              to="/pi/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-accent hover:underline"
            >
              View All in Action Center &rarr;
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-ink-muted hover:text-ink px-2 py-0.5 rounded hover:bg-surface"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
