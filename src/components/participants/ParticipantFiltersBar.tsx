import React from 'react';
import { Search, X, RotateCcw, AlertTriangle } from 'lucide-react';
import { ParticipantFilters, ParticipantLifecycleStatus } from '../../types';

interface ParticipantFiltersBarProps {
  filters: ParticipantFilters;
  onFilterChange: (newFilters: ParticipantFilters) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export const ParticipantFiltersBar: React.FC<ParticipantFiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
}) => {
  const isFiltered =
    Boolean(filters.search && filters.search.trim().length > 0) ||
    Boolean(filters.status && filters.status !== 'ALL') ||
    Boolean(filters.sex && filters.sex !== 'ALL') ||
    Boolean(filters.attentionRequired);

  const statuses: { label: string; value: ParticipantLifecycleStatus | 'ALL' }[] = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Screening', value: 'SCREENING' },
    { label: 'Eligible', value: 'ELIGIBLE' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Withdrawn', value: 'WITHDRAWN' },
    { label: 'Screen Failed', value: 'SCREEN_FAILED' },
    { label: 'Lost to Follow-up', value: 'LOST_TO_FOLLOW_UP' },
  ];

  return (
    <div className="bg-surface border border-border rounded-sm p-4 mb-6 shadow-subtle space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, screening code, or initials..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-xs bg-surface-soft border border-border rounded-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent focus:bg-surface transition-all"
            aria-label="Search participants"
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
            <label htmlFor="status-filter" className="text-ink-muted font-medium hidden sm:inline">
              Status:
            </label>
            <select
              id="status-filter"
              value={filters.status || 'ALL'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  status: e.target.value as ParticipantLifecycleStatus | 'ALL',
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

          {/* Sex selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="sex-filter" className="text-ink-muted font-medium hidden sm:inline">
              Sex:
            </label>
            <select
              id="sex-filter"
              value={filters.sex || 'ALL'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  sex: e.target.value as 'ALL' | 'M' | 'F' | 'Other',
                })
              }
              className="bg-surface-soft border border-border text-ink text-xs rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              <option value="ALL">All Sexes</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Attention Required Toggle Button */}
          <button
            type="button"
            onClick={() =>
              onFilterChange({
                ...filters,
                attentionRequired: filters.attentionRequired ? undefined : true,
              })
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-sm border transition-colors ${
              filters.attentionRequired
                ? 'bg-red-50 text-semantic-danger border-red-300 font-bold'
                : 'bg-surface-soft text-ink-secondary border-border hover:bg-surface'
            }`}
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                filters.attentionRequired ? 'text-semantic-danger' : 'text-ink-muted'
              }`}
            />
            <span>Attention Flagged</span>
          </button>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
              aria-label="Reset all active filters"
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
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> participants at this site
        </span>
        {isFiltered && (
          <span className="text-accent font-medium">Filtered results active</span>
        )}
      </div>
    </div>
  );
};
