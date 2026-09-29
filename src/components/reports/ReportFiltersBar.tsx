import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import { ReportType, ReportFilters } from '../../types';

interface ReportFiltersBarProps {
  reportType: ReportType;
  filters: ReportFilters;
  onFilterChange: (newFilters: ReportFilters) => void;
  onReset: () => void;
  totalResults: number;
}

export const ReportFiltersBar: React.FC<ReportFiltersBarProps> = ({
  reportType,
  filters,
  onFilterChange,
  onReset,
  totalResults,
}) => {
  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (!v) return false;
    if (v === 'ALL') return false;
    if (k === 'search' && !v.trim()) return false;
    return true;
  }).length;

  const handleChange = (key: keyof ReportFilters, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="bg-surface border border-border rounded-sm shadow-subtle p-3.5 space-y-3 text-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Search report records (ID, name, term, staff)..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface-soft/40 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink placeholder:text-ink-muted/60"
          />
        </div>

        {/* Filter controls based on domain */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter if applicable */}
          {reportType !== 'OPERATIONAL' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-ink-muted font-medium">Status:</span>
              <select
                value={filters.status || 'ALL'}
                onChange={(e) => handleChange('status', e.target.value)}
                className="text-xs p-1.5 bg-surface border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              >
                <option value="ALL">All Statuses</option>
                {reportType === 'PARTICIPANT' && (
                  <>
                    <option value="SCREENING">Screening</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ENROLLED">Enrolled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </>
                )}
                {reportType === 'VISIT' && (
                  <>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="DUE">Due</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="MISSED">Missed</option>
                  </>
                )}
                {reportType === 'SAFETY' && (
                  <>
                    <option value="PENDING">Review Pending</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="QUERIED">Queried</option>
                  </>
                )}
                {reportType === 'COMPLIANCE' && (
                  <>
                    <option value="REPORTED">Reported</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="ACTION_REQUIRED">Action Required</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </>
                )}
                {reportType === 'TASK' && (
                  <>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="COMPLETED">Completed</option>
                  </>
                )}
                {reportType === 'DOCUMENT' && (
                  <>
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SUPERSEDED">Superseded</option>
                    <option value="ARCHIVED">Archived</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Compliance Classification filter */}
          {reportType === 'COMPLIANCE' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-ink-muted font-medium">Classification:</span>
              <select
                value={filters.classification || 'ALL'}
                onChange={(e) => handleChange('classification', e.target.value)}
                className="text-xs p-1.5 bg-surface border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              >
                <option value="ALL">All Classifications</option>
                <option value="MINOR">Minor</option>
                <option value="MAJOR">Major</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          )}

          {/* Task / Document Category filter */}
          {(reportType === 'TASK' || reportType === 'DOCUMENT') && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-ink-muted font-medium">Category:</span>
              <select
                value={filters.category || 'ALL'}
                onChange={(e) => handleChange('category', e.target.value)}
                className="text-xs p-1.5 bg-surface border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              >
                <option value="ALL">All Categories</option>
                {reportType === 'TASK' ? (
                  <>
                    <option value="SAFETY">Safety</option>
                    <option value="COMPLIANCE">Compliance</option>
                    <option value="PARTICIPANT">Participant</option>
                    <option value="VISIT">Visit</option>
                    <option value="DOCUMENT">Document</option>
                    <option value="PHARMACY">Pharmacy</option>
                    <option value="TRAINING">Training</option>
                    <option value="OTHER">Other</option>
                  </>
                ) : (
                  <>
                    <option value="PROTOCOL">Protocol</option>
                    <option value="REGULATORY">Regulatory</option>
                    <option value="ETHICS">Ethics</option>
                    <option value="INFORMED_CONSENT">Informed Consent</option>
                    <option value="SITE">Site</option>
                    <option value="SAFETY">Safety</option>
                    <option value="PHARMACY">Pharmacy</option>
                    <option value="OTHER">Other</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Date range filter */}
          {reportType !== 'OPERATIONAL' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-ink-muted font-medium">From:</span>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                className="text-xs p-1 bg-surface border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              />
              <span className="text-[11px] text-ink-muted font-medium">To:</span>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleChange('dateTo', e.target.value)}
                className="text-xs p-1 bg-surface border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              />
            </div>
          )}

          {/* Active filter count & reset */}
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-sm transition-colors"
              title="Reset all active report filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset ({activeCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Results summary counter */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px] text-ink-muted">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-ink-muted" />
          <span>Filtered Record Count: <strong className="text-ink">{totalResults}</strong></span>
        </div>
        {activeCount > 0 && (
          <span className="italic">Combined multi-criteria AND semantics applied</span>
        )}
      </div>
    </div>
  );
};
