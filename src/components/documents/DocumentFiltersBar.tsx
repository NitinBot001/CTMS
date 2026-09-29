import React from 'react';
import { Search, X, RotateCcw, Plus } from 'lucide-react';
import {
  DocumentFilters,
  DocumentCategory,
  DocumentType,
  DocumentStatus,
} from '../../types';

interface DocumentFiltersBarProps {
  filters: DocumentFilters;
  onFilterChange: (newFilters: DocumentFilters) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  teamMembers?: { id: string; displayName: string; designation?: string }[];
  onCreateDocumentClick?: () => void;
}

export const DocumentFiltersBar: React.FC<DocumentFiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  teamMembers = [],
  onCreateDocumentClick,
}) => {
  const isFiltered =
    Boolean(filters.search && filters.search.trim().length > 0) ||
    Boolean(filters.category && filters.category !== 'ALL') ||
    Boolean(filters.documentType && filters.documentType !== 'ALL') ||
    Boolean(filters.status && filters.status !== 'ALL') ||
    Boolean(filters.expiryFilter && filters.expiryFilter !== 'ALL') ||
    (filters.isRequired !== undefined && filters.isRequired !== 'ALL') ||
    Boolean(filters.ownerUserId && filters.ownerUserId !== 'ALL');

  const categories: { value: DocumentCategory; label: string }[] = [
    { value: 'REGULATORY', label: 'Regulatory' },
    { value: 'ETHICS', label: 'Ethics' },
    { value: 'PROTOCOL', label: 'Protocol' },
    { value: 'INFORMED_CONSENT', label: 'Informed Consent' },
    { value: 'SITE', label: 'Site' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'PHARMACY', label: 'Pharmacy' },
    { value: 'LABORATORY', label: 'Laboratory' },
    { value: 'STUDY_REPORT', label: 'Study Report' },
    { value: 'OTHER', label: 'Other' },
  ];

  const documentTypes: DocumentType[] = [
    'Protocol',
    'Protocol Amendment',
    'Investigator Document',
    'Ethics Approval',
    'Site Approval',
    'Consent Form',
    'Training Certificate',
    'Safety Report',
    'Pharmacy Record',
    'Laboratory Certification',
    'Monitoring Report',
    'Study Report',
    'Other',
  ];

  const statuses: { value: DocumentStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'ARCHIVED', label: 'Archived' },
  ];

  const expiryOptions = [
    { value: 'ALL', label: 'All Expiry States' },
    { value: 'ACTIVE', label: 'Valid / Active' },
    { value: 'EXPIRING_SOON', label: 'Expiring Soon (≤30d)' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'NO_EXPIRY', label: 'No Expiry Date' },
    { value: 'NEXT_7_DAYS', label: 'Expires in Next 7 Days' },
    { value: 'NEXT_30_DAYS', label: 'Expires in Next 30 Days' },
  ];

  return (
    <div className="bg-surface border border-border rounded-sm shadow-subtle p-3 space-y-3">
      {/* Top row: Search input + Actions */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents by ID, title, type, category, owner, or filename..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-9 py-2 text-xs bg-surface-soft/50 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-ink placeholder:text-ink-muted/70"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-ink-muted hover:text-ink bg-surface-soft border border-border rounded-sm hover:bg-surface-soft/80 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}

          {onCreateDocumentClick && (
            <button
              onClick={onCreateDocumentClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-sm shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Selectors Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-border/60">
        {/* Category */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-ink-muted mb-1">
            Category
          </label>
          <select
            value={filters.category || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                category: e.target.value as DocumentCategory | 'ALL',
              })
            }
            className="w-full text-xs py-1.5 px-2 bg-surface-soft/40 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Document Type */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-ink-muted mb-1">
            Document Type
          </label>
          <select
            value={filters.documentType || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                documentType: e.target.value as DocumentType | 'ALL',
              })
            }
            className="w-full text-xs py-1.5 px-2 bg-surface-soft/40 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
          >
            <option value="ALL">All Types</option>
            {documentTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-ink-muted mb-1">
            Status
          </label>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value as DocumentStatus | 'ALL',
              })
            }
            className="w-full text-xs py-1.5 px-2 bg-surface-soft/40 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Expiry State */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-ink-muted mb-1">
            Expiry Horizon
          </label>
          <select
            value={filters.expiryFilter || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                expiryFilter: e.target.value as any,
              })
            }
            className="w-full text-xs py-1.5 px-2 bg-surface-soft/40 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
          >
            {expiryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Required */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-ink-muted mb-1">
            Obligation
          </label>
          <select
            value={
              filters.isRequired === undefined
                ? 'ALL'
                : filters.isRequired === true
                ? 'REQUIRED'
                : 'OPTIONAL'
            }
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange({
                ...filters,
                isRequired: val === 'ALL' ? 'ALL' : val === 'REQUIRED',
              });
            }}
            className="w-full text-xs py-1.5 px-2 bg-surface-soft/40 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
          >
            <option value="ALL">All Documents</option>
            <option value="REQUIRED">Required Only</option>
            <option value="OPTIONAL">Optional / Non-Mandatory</option>
          </select>
        </div>

        {/* Owner */}
        <div>
          <label className="block text-[10px] uppercase font-semibold text-ink-muted mb-1">
            Owner / Staff
          </label>
          <select
            value={filters.ownerUserId || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                ownerUserId: e.target.value,
              })
            }
            className="w-full text-xs py-1.5 px-2 bg-surface-soft/40 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
          >
            <option value="ALL">All Staff</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results counter indicator */}
      <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
        <span>
          Showing <strong className="text-ink">{filteredCount}</strong> of{' '}
          <strong className="text-ink">{totalCount}</strong> documents
        </span>
        {isFiltered && (
          <span className="text-primary font-medium">Filters active</span>
        )}
      </div>
    </div>
  );
};
