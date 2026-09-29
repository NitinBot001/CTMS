import React from 'react';
import { Search, X, RotateCcw, Plus } from 'lucide-react';
import {
  TaskFilters,
  TaskStatus,
  TaskPriority,
  TaskCategory,
} from '../../types';

interface TaskFiltersBarProps {
  filters: TaskFilters;
  onFilterChange: (newFilters: TaskFilters) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  teamMembers?: { id: string; displayName: string; designation: string }[];
  onCreateTaskClick?: () => void;
}

export const TaskFiltersBar: React.FC<TaskFiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  teamMembers = [],
  onCreateTaskClick,
}) => {
  const isFiltered =
    Boolean(filters.search && filters.search.trim().length > 0) ||
    Boolean(filters.status && filters.status !== 'ALL') ||
    Boolean(filters.priority && filters.priority !== 'ALL') ||
    Boolean(filters.category && filters.category !== 'ALL') ||
    Boolean(filters.assigneeId && filters.assigneeId !== 'ALL') ||
    Boolean(filters.dueDateFilter && filters.dueDateFilter !== 'ALL') ||
    (filters.requiresApproval !== undefined && filters.requiresApproval !== 'ALL');

  const categories: { value: TaskCategory; label: string }[] = [
    { value: 'SAFETY', label: 'Safety' },
    { value: 'COMPLIANCE', label: 'Compliance' },
    { value: 'PARTICIPANT', label: 'Participant' },
    { value: 'VISIT', label: 'Visit' },
    { value: 'DOCUMENT', label: 'Document' },
    { value: 'REPORT', label: 'Report' },
    { value: 'PHARMACY', label: 'Pharmacy' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'OTHER', label: 'Other' },
  ];

  const statuses: { value: TaskStatus | 'ALL' | 'OPEN'; label: string }[] = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'OPEN', label: 'Open / Active (Non-terminal)' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'REVISION_REQUIRED', label: 'Revision Required' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="bg-surface border border-border rounded-sm p-4 mb-6 shadow-subtle space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by task ID, title, description, assignee, entity..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-xs bg-surface-soft border border-border rounded-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent focus:bg-surface transition-all"
            aria-label="Search study tasks"
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

        {/* Action Controls & Counter */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <span className="text-xs text-ink-muted">
            Showing <strong className="text-ink font-mono">{filteredCount}</strong> of{' '}
            <span className="font-mono">{totalCount}</span> tasks
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium px-2 py-1 rounded-sm hover:bg-stone-100 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}

          {onCreateTaskClick && (
            <button
              type="button"
              onClick={onCreateTaskClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-sm hover:bg-primary-dark transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Select Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-border/60">
        {/* Status Filter */}
        <div>
          <label className="block text-[10px] font-bold text-ink-secondary mb-1">
            STATUS
          </label>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value as TaskStatus | 'ALL' | 'OPEN',
              })
            }
            className="w-full px-2 py-1.5 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-[10px] font-bold text-ink-secondary mb-1">
            PRIORITY
          </label>
          <select
            value={filters.priority || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                priority: e.target.value as TaskPriority | 'ALL',
              })
            }
            className="w-full px-2 py-1.5 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="NORMAL">Normal Priority</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-[10px] font-bold text-ink-secondary mb-1">
            CATEGORY
          </label>
          <select
            value={filters.category || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                category: e.target.value as TaskCategory | 'ALL',
              })
            }
            className="w-full px-2 py-1.5 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee Filter */}
        <div>
          <label className="block text-[10px] font-bold text-ink-secondary mb-1">
            ASSIGNEE
          </label>
          <select
            value={filters.assigneeId || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                assigneeId: e.target.value,
              })
            }
            className="w-full px-2 py-1.5 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Assignees</option>
            <option value="MY_TASKS">My Assigned Tasks</option>
            <option value="UNASSIGNED">Unassigned (Drafts)</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName} ({m.designation})
              </option>
            ))}
          </select>
        </div>

        {/* Due Date Filter */}
        <div>
          <label className="block text-[10px] font-bold text-ink-secondary mb-1">
            SCHEDULE / DUE
          </label>
          <select
            value={filters.dueDateFilter || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                dueDateFilter: e.target.value as 'ALL' | 'TODAY' | 'OVERDUE' | 'UPCOMING',
              })
            }
            className="w-full px-2 py-1.5 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Due Dates</option>
            <option value="TODAY">Due Today (2026-09-29)</option>
            <option value="OVERDUE">Overdue Tasks</option>
            <option value="UPCOMING">Upcoming Tasks</option>
          </select>
        </div>

        {/* Approval Requirement Filter */}
        <div>
          <label className="block text-[10px] font-bold text-ink-secondary mb-1">
            APPROVAL RULE
          </label>
          <select
            value={
              filters.requiresApproval === undefined || filters.requiresApproval === 'ALL'
                ? 'ALL'
                : filters.requiresApproval
                ? 'YES'
                : 'NO'
            }
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange({
                ...filters,
                requiresApproval: val === 'ALL' ? 'ALL' : val === 'YES',
              });
            }}
            className="w-full px-2 py-1.5 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Workflows</option>
            <option value="YES">Requires PI Approval</option>
            <option value="NO">Direct Completion</option>
          </select>
        </div>
      </div>
    </div>
  );
};
