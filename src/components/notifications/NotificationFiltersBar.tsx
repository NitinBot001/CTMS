import React from 'react';
import { Search, X, RotateCcw, CheckCheck } from 'lucide-react';
import {
  NotificationFilters,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from '../../types';

interface NotificationFiltersBarProps {
  filters: NotificationFilters;
  onFilterChange: (newFilters: NotificationFilters) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  unreadCount?: number;
  onMarkAllAsRead?: () => void;
}

export const NotificationFiltersBar: React.FC<NotificationFiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  unreadCount = 0,
  onMarkAllAsRead,
}) => {
  const isFiltered = Boolean(
    (filters.search && filters.search.trim().length > 0) ||
      filters.type ||
      filters.priority ||
      filters.status ||
      filters.unreadOnly
  );

  const notificationTypes: { value: NotificationType; label: string }[] = [
    { value: 'SAFETY_REVIEW', label: 'Safety Review' },
    { value: 'SAFETY_FOLLOWUP', label: 'Safety Follow-up' },
    { value: 'COMPLIANCE_REVIEW', label: 'Compliance Review' },
    { value: 'CAPA_OVERDUE', label: 'CAPA Overdue' },
    { value: 'TASK_ASSIGNED', label: 'Task Assigned' },
    { value: 'TASK_REVIEW', label: 'Task Review' },
    { value: 'TASK_REVISION', label: 'Task Revision' },
    { value: 'TASK_OVERDUE', label: 'Task Overdue' },
    { value: 'DOCUMENT_EXPIRING', label: 'Document Expiring' },
    { value: 'DOCUMENT_EXPIRED', label: 'Document Expired' },
    { value: 'VISIT_DUE', label: 'Visit Due' },
    { value: 'VISIT_OVERDUE', label: 'Visit Overdue' },
    { value: 'TEAM_ASSIGNMENT', label: 'Team Assignment' },
  ];

  return (
    <div className="bg-surface border border-border rounded-sm p-4 mb-6 shadow-subtle space-y-3">
      {/* Top row: Search + Count + Mark All as Read */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notifications by title, message, entity ID..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-xs bg-surface-soft border border-border rounded-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent focus:bg-surface transition-all"
            aria-label="Search notifications"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-0.5"
              aria-label="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Counter & Action */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <span className="text-xs text-ink-muted">
            Showing <strong className="text-ink font-mono">{filteredCount}</strong> of{' '}
            <span className="font-mono">{totalCount}</span>
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-ink-muted hover:text-ink bg-surface border border-border hover:border-ink-muted rounded-sm transition-colors"
              title="Reset all active filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          {onMarkAllAsRead && unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 border border-accent/20 hover:bg-accent/20 rounded-sm transition-colors"
              title="Mark all notifications as read in current scope"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Selectors Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border-light text-xs">
        {/* Type Filter */}
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Category / Type
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                type: (e.target.value || undefined) as NotificationType | undefined,
              })
            }
            className="w-full px-2.5 py-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Types</option>
            {notificationTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Priority
          </label>
          <select
            value={filters.priority || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                priority: (e.target.value || undefined) as NotificationPriority | undefined,
              })
            }
            className="w-full px-2.5 py-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-medium text-ink-muted mb-1">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: (e.target.value || undefined) as NotificationStatus | undefined,
                unreadOnly: e.target.value === 'UNREAD' ? true : false,
              })
            }
            className="w-full px-2.5 py-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Statuses</option>
            <option value="UNREAD">Unread</option>
            <option value="READ">Read</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>

        {/* Unread Only Quick Toggle */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer py-1.5 px-3 bg-surface-soft border border-border rounded-sm hover:bg-surface text-ink text-xs w-full select-none transition-colors">
            <input
              type="checkbox"
              checked={Boolean(filters.unreadOnly || filters.status === 'UNREAD')}
              onChange={(e) => {
                const checked = e.target.checked;
                onFilterChange({
                  ...filters,
                  unreadOnly: checked,
                  status: checked ? 'UNREAD' : undefined,
                });
              }}
              className="rounded border-border text-accent focus:ring-accent"
            />
            <span className="font-medium text-ink">Unread Only</span>
          </label>
        </div>
      </div>
    </div>
  );
};
