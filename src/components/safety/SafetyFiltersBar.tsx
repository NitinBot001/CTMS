import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import {
  SafetyFilters,
  SafetyEventType,
  Severity,
  Seriousness,
  PIReviewStatus,
} from '../../types';

interface SafetyFiltersBarProps {
  filters: SafetyFilters;
  onFilterChange: (newFilters: SafetyFilters) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  participants?: { id: string; participantCode: string; initials: string }[];
}

export const SafetyFiltersBar: React.FC<SafetyFiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  participants = [],
}) => {
  const isFiltered =
    Boolean(filters.search && filters.search.trim().length > 0) ||
    Boolean(filters.eventType && filters.eventType !== 'ALL') ||
    Boolean(filters.status && filters.status !== 'ALL') ||
    Boolean(filters.severity && filters.severity !== 'ALL') ||
    Boolean(filters.seriousness && filters.seriousness !== 'ALL') ||
    Boolean(filters.piReviewStatus && filters.piReviewStatus !== 'ALL') ||
    Boolean(filters.followUpStatus && filters.followUpStatus !== 'ALL') ||
    Boolean(filters.participantId && filters.participantId !== 'ALL') ||
    Boolean(filters.dateRange && filters.dateRange !== 'ALL');

  return (
    <div className="bg-surface border border-border rounded-sm p-4 mb-6 shadow-subtle space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by event ID, title, participant, or reporter..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-xs bg-surface-soft border border-border rounded-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent focus:bg-surface transition-all"
            aria-label="Search safety events"
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

        {/* Primary Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Event Type selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="safety-type-filter" className="text-ink-muted font-medium hidden sm:inline">
              Type:
            </label>
            <select
              id="safety-type-filter"
              value={filters.eventType || 'ALL'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  eventType: e.target.value as SafetyEventType | 'ALL',
                })
              }
              className="bg-surface-soft border border-border text-ink text-xs rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              <option value="ALL">All Types (AE + SAE)</option>
              <option value="AE">AE (Adverse Event)</option>
              <option value="SAE">SAE (Serious AE)</option>
            </select>
          </div>

          {/* Severity selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="safety-severity-filter" className="text-ink-muted font-medium hidden sm:inline">
              Severity:
            </label>
            <select
              id="safety-severity-filter"
              value={filters.severity || 'ALL'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  severity: e.target.value as Severity | 'ALL',
                })
              }
              className="bg-surface-soft border border-border text-ink text-xs rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="MILD">Mild</option>
              <option value="MODERATE">Moderate</option>
              <option value="SEVERE">Severe</option>
            </select>
          </div>

          {/* Seriousness selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="safety-seriousness-filter" className="text-ink-muted font-medium hidden sm:inline">
              Seriousness:
            </label>
            <select
              id="safety-seriousness-filter"
              value={filters.seriousness || 'ALL'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  seriousness: e.target.value as Seriousness | 'ALL',
                })
              }
              className="bg-surface-soft border border-border text-ink text-xs rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer max-w-[140px] truncate"
            >
              <option value="ALL">All Criteria</option>
              <option value="NONE">Non-Serious (None)</option>
              <option value="HOSPITALIZATION">Hospitalization</option>
              <option value="LIFE_THREATENING">Life Threatening</option>
              <option value="DEATH">Fatal</option>
              <option value="DISABILITY">Disability</option>
              <option value="CONGENITAL_ANOMALY">Congenital Anomaly</option>
              <option value="OTHER_MEDICALLY_IMPORTANT">Medically Important</option>
            </select>
          </div>

          {/* PI Review selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <label htmlFor="safety-review-filter" className="text-ink-muted font-medium hidden sm:inline">
              Review:
            </label>
            <select
              id="safety-review-filter"
              value={filters.piReviewStatus || 'ALL'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  piReviewStatus: e.target.value as PIReviewStatus | 'ALL',
                })
              }
              className="bg-surface-soft border border-border text-ink text-xs rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              <option value="ALL">All Review States</option>
              <option value="SIGN_OFF_REQUIRED">Sign-off Required</option>
              <option value="NOT_REVIEWED">Pending Review</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="REVIEWED">Reviewed</option>
            </select>
          </div>

          {/* Participant selector */}
          {participants.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <label htmlFor="safety-participant-filter" className="text-ink-muted font-medium hidden sm:inline">
                Subject:
              </label>
              <select
                id="safety-participant-filter"
                value={filters.participantId || 'ALL'}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    participantId: e.target.value === 'ALL' ? undefined : e.target.value,
                  })
                }
                className="bg-surface-soft border border-border text-ink text-xs rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer max-w-[130px] truncate"
              >
                <option value="ALL">All Subjects</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.participantCode} ({p.initials})
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
              aria-label="Reset all active safety filters"
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
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> safety events recorded at this site
        </span>
        {isFiltered && (
          <span className="text-accent font-medium">Filtered results active</span>
        )}
      </div>
    </div>
  );
};
