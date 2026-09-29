import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { VisitFilters, VisitStatus } from '../../types';

interface VisitFiltersBarProps {
  filters: VisitFilters;
  onFilterChange: (newFilters: VisitFilters) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  participants?: { id: string; participantCode: string; initials: string }[];
  protocolVisits?: { code: string; name: string }[];
}

export const VisitFiltersBar: React.FC<VisitFiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  participants = [],
  protocolVisits = [],
}) => {
  const isFiltered =
    Boolean(filters.search && filters.search.trim().length > 0) ||
    Boolean(filters.status && filters.status !== 'ALL') ||
    Boolean(filters.participantId && filters.participantId !== 'ALL') ||
    Boolean(filters.visitCode && filters.visitCode !== 'ALL') ||
    Boolean(filters.dateRange && filters.dateRange !== 'ALL');

  const statuses: { label: string; value: VisitStatus | 'ALL' }[] = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Due Now', value: 'DUE' },
    { label: 'Overdue', value: 'OVERDUE' },
    { label: 'Scheduled', value: 'SCHEDULED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Missed', value: 'MISSED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  const dateRanges: { label: string; value: NonNullable<VisitFilters['dateRange']> }[] = [
    { label: 'All Dates', value: 'ALL' },
    { label: 'Due Today', value: 'TODAY' },
    { label: 'Next 7 Days', value: 'NEXT_7_DAYS' },
    { label: 'Overdue Only', value: 'OVERDUE' },
    { label: 'This Month', value: 'THIS_MONTH' },
  ];

  return (
    <div className="bg-surface border border-border rounded-sm p-4 mb-6 shadow-subtle space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by participant ID, visit code, or staff..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-xs bg-surface-soft border border-border rounded-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent focus:bg-surface transition-all"
            aria-label="Search visits"
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

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="visit-status-filter" className="text-ink-muted font-medium hidden sm:inline">
              Status:
            </label>
            <select
              id="visit-status-filter"
              value={filters.status || 'ALL'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  status: e.target.value as VisitStatus | 'ALL',
                })
              }
              className="bg-surface-soft border border-border text-ink text-xs rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date range selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="visit-date-filter" className="text-ink-muted font-medium hidden sm:inline">
              Timeline:
            </label>
            <select
              id="visit-date-filter"
              value={filters.dateRange || 'ALL'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  dateRange: e.target.value as NonNullable<VisitFilters['dateRange']>,
                })
              }
              className="bg-surface-soft border border-border text-ink text-xs rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              {dateRanges.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Participant selector if available */}
          {participants.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <label htmlFor="visit-participant-filter" className="text-ink-muted font-medium hidden sm:inline">
                Participant:
              </label>
              <select
                id="visit-participant-filter"
                value={filters.participantId || 'ALL'}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    participantId: e.target.value === 'ALL' ? undefined : e.target.value,
                  })
                }
                className="bg-surface-soft border border-border text-ink text-xs rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer max-w-[140px] truncate"
              >
                <option value="ALL">All Participants</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.participantCode} ({p.initials})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Protocol Visit definition selector if available */}
          {protocolVisits.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <label htmlFor="visit-code-filter" className="text-ink-muted font-medium hidden sm:inline">
                Protocol Visit:
              </label>
              <select
                id="visit-code-filter"
                value={filters.visitCode || 'ALL'}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    visitCode: e.target.value === 'ALL' ? undefined : e.target.value,
                  })
                }
                className="bg-surface-soft border border-border text-ink text-xs rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer max-w-[140px] truncate"
              >
                <option value="ALL">All Visits</option>
                {protocolVisits.map((pv) => (
                  <option key={pv.code} value={pv.code}>
                    {pv.code} - {pv.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
              aria-label="Reset all active visit filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Showing Count Metadata */}
      <div className="flex items-center justify-between text-xs text-ink-muted pt-1 border-t border-border">
        <span>
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> visits scheduled at this site
        </span>
        {isFiltered && (
          <span className="text-accent font-medium">Filtered results active</span>
        )}
      </div>
    </div>
  );
};
