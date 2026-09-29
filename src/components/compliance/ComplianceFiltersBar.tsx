import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import {
  DeviationFilters,
  DeviationScope,
  DeviationClassification,
  DeviationStatus,
  CapaStatus,
  ComplianceReviewStatus,
  DeviationCategory,
} from '../../types';

interface ComplianceFiltersBarProps {
  filters: DeviationFilters;
  onFilterChange: (newFilters: DeviationFilters) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  participants?: { id: string; participantCode: string; initials: string }[];
}

export const ComplianceFiltersBar: React.FC<ComplianceFiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  participants = [],
}) => {
  const isFiltered =
    Boolean(filters.search && filters.search.trim().length > 0) ||
    Boolean(filters.scope && filters.scope !== 'ALL') ||
    Boolean(filters.classification && filters.classification !== 'ALL') ||
    Boolean(filters.status && filters.status !== 'ALL') ||
    Boolean(filters.capaStatus && filters.capaStatus !== 'ALL') ||
    Boolean(filters.reviewStatus && filters.reviewStatus !== 'ALL') ||
    Boolean(filters.category && filters.category !== 'ALL') ||
    Boolean(filters.participantId && filters.participantId !== 'ALL') ||
    Boolean(filters.dateRange && filters.dateRange !== 'ALL');

  const categories: { value: DeviationCategory; label: string }[] = [
    { value: 'VISIT_WINDOW', label: 'Visit Window' },
    { value: 'ELIGIBILITY', label: 'Eligibility' },
    { value: 'INFORMED_CONSENT', label: 'Informed Consent' },
    { value: 'PROCEDURE', label: 'Procedure' },
    { value: 'PROTOCOL_PROCEDURE', label: 'Protocol Procedure' },
    { value: 'DOCUMENTATION', label: 'Documentation' },
    { value: 'DATA_ENTRY', label: 'Data Entry' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'INVESTIGATIONAL_PRODUCT', label: 'Investigational Product' },
    { value: 'SAMPLE_COLLECTION', label: 'Sample Collection' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div className="bg-surface border border-border rounded-sm p-4 mb-6 shadow-subtle space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by deviation ID, title, participant, or category..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-xs bg-surface-soft border border-border rounded-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent focus:bg-surface transition-all"
            aria-label="Search protocol deviations"
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

        {/* Counter & Reset Action */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <span className="text-xs text-ink-muted">
            Showing <strong className="text-ink font-mono">{filteredCount}</strong> of{' '}
            <span className="font-mono">{totalCount}</span> deviations
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
        </div>
      </div>

      {/* Structured Multi-Criteria Selectors (AND Logic) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 pt-2 border-t border-border/60">
        {/* Scope */}
        <div>
          <label className="block text-[10px] font-semibold uppercase text-ink-muted mb-1">
            Scope
          </label>
          <select
            value={filters.scope || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                scope: e.target.value as DeviationScope | 'ALL',
              })
            }
            className="w-full text-xs p-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Scopes</option>
            <option value="PARTICIPANT">Participant</option>
            <option value="SITE">Site Facility</option>
            <option value="STUDY">Study Level</option>
          </select>
        </div>

        {/* Classification */}
        <div>
          <label className="block text-[10px] font-semibold uppercase text-ink-muted mb-1">
            Classification
          </label>
          <select
            value={filters.classification || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                classification: e.target.value as DeviationClassification | 'ALL',
              })
            }
            className="w-full text-xs p-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Levels</option>
            <option value="MINOR">Minor</option>
            <option value="MAJOR">Major</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] font-semibold uppercase text-ink-muted mb-1">
            Status
          </label>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value as DeviationStatus | 'ALL',
              })
            }
            className="w-full text-xs p-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ACTION_REQUIRED">Action Required</option>
            <option value="CAPA_IN_PROGRESS">CAPA In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* CAPA Status */}
        <div>
          <label className="block text-[10px] font-semibold uppercase text-ink-muted mb-1">
            CAPA State
          </label>
          <select
            value={filters.capaStatus || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                capaStatus: e.target.value as CapaStatus | 'ALL',
              })
            }
            className="w-full text-xs p-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All CAPA States</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">Active / In Progress</option>
            <option value="OVERDUE">Overdue (!)</option>
            <option value="COMPLETED">Completed</option>
            <option value="NOT_REQUIRED">Not Required</option>
          </select>
        </div>

        {/* PI Review */}
        <div>
          <label className="block text-[10px] font-semibold uppercase text-ink-muted mb-1">
            PI Review
          </label>
          <select
            value={filters.reviewStatus || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                reviewStatus: e.target.value as ComplianceReviewStatus | 'ALL',
              })
            }
            className="w-full text-xs p-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Review States</option>
            <option value="SIGN_OFF_REQUIRED">Sign-off Required</option>
            <option value="NOT_REVIEWED">Pending Review</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="REVIEWED">Reviewed</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-semibold uppercase text-ink-muted mb-1">
            Category
          </label>
          <select
            value={filters.category || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                category: e.target.value as DeviationCategory | 'ALL',
              })
            }
            className="w-full text-xs p-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div>
          <label className="block text-[10px] font-semibold uppercase text-ink-muted mb-1">
            Subject
          </label>
          <select
            value={filters.participantId || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                participantId: e.target.value === 'ALL' ? undefined : e.target.value,
              })
            }
            className="w-full text-xs p-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent truncate"
          >
            <option value="ALL">All Subjects</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.participantCode} ({p.initials})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
