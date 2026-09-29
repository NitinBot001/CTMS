import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  RefreshCw,
  CheckCheck,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { notificationService } from '../services/notificationService';
import {
  Notification,
  NotificationFilters,
  NotificationSummaryMetrics,
} from '../types';
import { NotificationSummaryCards } from '../components/notifications/NotificationSummaryCards';
import { NotificationFiltersBar } from '../components/notifications/NotificationFiltersBar';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { NotificationEmptyState } from '../components/notifications/NotificationEmptyState';
import { filterNotifications } from '../utils/notificationCalculations';

export const NotificationsActionCenterPage: React.FC = () => {
  const { activeStudy, activeSite } = useStudy();
  const recipientUserId = 'USR-101'; // Dr. Ananya Sharma (Principal Investigator)

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [summary, setSummary] = useState<NotificationSummaryMetrics>({
    total: 0,
    unread: 0,
    highPriority: 0,
    actionRequired: 0,
    today: 0,
  });
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [entityAvailability, setEntityAvailability] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queryContext = useMemo(() => {
    return {
      studyId: activeStudy?.id || '',
      siteId: activeSite?.id || '',
      recipientUserId,
    };
  }, [activeStudy?.id, activeSite?.id, recipientUserId]);

  const loadData = useCallback(async () => {
    if (!queryContext.studyId || !queryContext.siteId || !queryContext.recipientUserId) {
      setNotifications([]);
      setSummary({ total: 0, unread: 0, highPriority: 0, actionRequired: 0, today: 0 });
      setLoading(false);
      return;
    }

    try {
      const [allNotifs, sumMetrics] = await Promise.all([
        notificationService.getNotifications(queryContext),
        notificationService.getNotificationSummary(queryContext),
      ]);

      setNotifications(allNotifs);
      setSummary(sumMetrics);

      // Verify availability of referenced domain entities in background
      const availabilityResults: Record<string, boolean> = {};
      await Promise.all(
        allNotifs.map(async (notif) => {
          if (notif.sourceEntityType && notif.sourceEntityId) {
            const isAvail = await notificationService.verifySourceEntityAvailable(
              queryContext,
              notif
            );
            availabilityResults[notif.id] = isAvail;
          } else {
            availabilityResults[notif.id] = true;
          }
        })
      );
      setEntityAvailability(availabilityResults);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [queryContext]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(queryContext, notificationId);
      await loadData();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      await notificationService.dismissNotification(queryContext, notificationId);
      await loadData();
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(queryContext);
      await loadData();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return filterNotifications(notifications, filters);
  }, [notifications, filters]);

  const isFiltered = Boolean(
    (filters.search && filters.search.trim().length > 0) ||
      filters.type ||
      filters.priority ||
      filters.status ||
      filters.unreadOnly ||
      filters.dateFrom ||
      filters.dateTo
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-surface border border-border rounded-sm p-4 sm:p-6 shadow-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-ink tracking-tight">
                Notifications & Action Center
              </h2>
            </div>
            <p className="text-xs text-ink-muted max-w-2xl leading-relaxed">
              Centralized operational alerts, safety notifications, protocol deviation reviews,
              and pending actions across all clinical trial domains for the Principal Investigator.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 self-start lg:self-center">
            {summary.unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-accent bg-accent/10 border border-accent/20 hover:bg-accent/20 rounded-sm transition-colors shadow-sm"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark All as Read ({summary.unread})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-ink bg-surface border border-border hover:bg-surface-soft rounded-sm transition-colors"
              title="Refresh notifications"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-ink-muted ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Active Context Scope Pill */}
        <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-3 border-t border-border-light text-xs text-ink-muted">
          <span className="font-medium text-ink">Active Scope:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-surface-soft border border-border text-ink font-mono text-[11px]">
            <FileSpreadsheet className="w-3 h-3 text-primary" />
            {activeStudy ? `${activeStudy.title} (${activeStudy.code})` : 'No Study Selected'}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-surface-soft border border-border text-ink font-mono text-[11px]">
            <Building2 className="w-3 h-3 text-secondary" />
            {activeSite ? `${activeSite.name} (${activeSite.siteCode})` : 'No Site Selected'}
          </span>
          <span className="ml-auto text-[11px] text-ink-muted">
            Recipient: <strong className="text-ink">Dr. Ananya Sharma (PI)</strong>
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <NotificationSummaryCards
        metrics={summary}
        activeFilters={filters}
        onFilterChange={setFilters}
        isLoading={loading}
      />

      {/* Filter Controls Bar */}
      <NotificationFiltersBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={() => setFilters({})}
        totalCount={notifications.length}
        filteredCount={filteredNotifications.length}
        unreadCount={summary.unread}
        onMarkAllAsRead={handleMarkAllAsRead}
      />

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-ink-muted bg-surface border border-border rounded-sm">
            <RefreshCw className="w-6 h-6 text-accent animate-spin mx-auto mb-2" />
            <p className="font-medium text-ink">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <NotificationEmptyState
            isFiltered={isFiltered}
            onResetFilters={() => setFilters({})}
          />
        ) : (
          filteredNotifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              isSourceEntityAvailable={entityAvailability[notif.id] ?? true}
              onMarkAsRead={handleMarkAsRead}
              onDismiss={handleDismiss}
            />
          ))
        )}
      </div>

      {/* Institutional Compliance Footer */}
      <div className="p-3 bg-surface-soft border border-border-light rounded-sm text-center text-[11px] text-ink-muted">
        <p>
          AIIA CTMS Notification Engine &bull; Scoped strictly to Dr. Ananya Sharma (PI) at{' '}
          {activeSite?.name || 'Active Site'} &bull; Browser-only synthetic simulation compliant with
          GCP audit criteria.
        </p>
      </div>
    </div>
  );
};
