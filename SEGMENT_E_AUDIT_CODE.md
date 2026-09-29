# AIIA CTMS — Segment E Audit Code

This file contains source code required for auditing
Phase 1 — Segment E: Protocol Compliance & Deviations.

Generated automatically for code audit.

Generated: Tue Sep 29 10:46:06 IST 2026

---

## PROJECT STRUCTURE — RELEVANT SOURCE FILES

```text
src/components/compliance/ComplianceDeviationMobileCard.tsx
src/components/compliance/ComplianceDeviationTable.tsx
src/components/compliance/ComplianceFiltersBar.tsx
src/components/compliance/ComplianceSummaryCards.tsx
src/components/compliance/DeviationCapaBadge.tsx
src/components/compliance/DeviationClassificationBadge.tsx
src/components/compliance/DeviationReviewBadge.tsx
src/components/compliance/DeviationScopeBadge.tsx
src/components/compliance/DeviationStatusBadge.tsx
src/components/dashboard/SafetyAndComplianceCards.tsx
src/components/dashboard/StudyContextHeader.tsx
src/context/StudyContext.tsx
src/data/mockData.ts
src/pages/ComplianceDeviationDetailPage.tsx
src/pages/ComplianceManagementPage.tsx
src/pages/ParticipantDetailPage.tsx
src/pages/VisitDetailPage.tsx
src/repositories/interfaces.ts
src/repositories/mockComplianceRepository.ts
src/routes/index.tsx
src/services/complianceService.ts
src/tests/services.test.ts
src/types/index.ts
```

---

## FILE: src/components/compliance/ComplianceDeviationMobileCard.tsx

```typescript
import React from 'react';
import { ProtocolDeviation } from '../../types';
import { DeviationClassificationBadge } from './DeviationClassificationBadge';
import { DeviationStatusBadge } from './DeviationStatusBadge';
import { DeviationCapaBadge } from './DeviationCapaBadge';
import { DeviationReviewBadge } from './DeviationReviewBadge';
import { DeviationScopeBadge } from './DeviationScopeBadge';
import { Card } from '../ui/Card';
import { ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComplianceDeviationMobileCardProps {
  deviation: ProtocolDeviation;
}

export const ComplianceDeviationMobileCard: React.FC<ComplianceDeviationMobileCardProps> = ({
  deviation,
}) => {
  const isCritical = deviation.classification === 'CRITICAL';

  return (
    <Card
      className={`p-4 border transition-all ${
        isCritical ? 'bg-red-50/20 border-red-200' : 'bg-surface border-border'
      }`}
    >
      <div className="space-y-3">
        {/* Top Header: ID, Scope, Classification */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
              {deviation.id}
            </span>
            <DeviationScopeBadge scope={deviation.scope} size="xs" />
          </div>
          <DeviationClassificationBadge classification={deviation.classification} size="sm" />
        </div>

        {/* Title */}
        <div>
          <h4 className="text-sm font-semibold font-heading text-ink leading-snug">
            {deviation.title}
          </h4>
          <p className="text-xs text-ink-muted line-clamp-2 mt-1">{deviation.description}</p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60 text-ink-secondary">
          {deviation.participantId && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                Subject
              </span>
              <Link
                to={`/pi/patients/${deviation.participantId}`}
                className="font-mono font-bold text-primary hover:underline"
              >
                {deviation.participantId}
              </Link>
            </div>
          )}

          <div>
            <span className="text-[10px] uppercase font-semibold text-ink-muted block">
              Occurred
            </span>
            <span className="font-mono flex items-center gap-1 mt-0.5 text-xs">
              <Calendar className="w-3 h-3 text-ink-muted" />
              {deviation.occurrenceDate}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-ink-muted block">
              Status
            </span>
            <div className="mt-0.5">
              <DeviationStatusBadge status={deviation.status} size="xs" />
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-ink-muted block">
              CAPA
            </span>
            <div className="mt-0.5">
              <DeviationCapaBadge
                status={deviation.capaStatus}
                targetDate={deviation.capaTargetDate}
                size="xs"
              />
            </div>
          </div>
        </div>

        {/* Bottom Review & Action Link */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
          <DeviationReviewBadge status={deviation.reviewStatus} size="sm" />

          <Link
            to={`/pi/compliance/${deviation.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark"
          >
            <span>Review Deviation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
};

```

---

## FILE: src/components/compliance/ComplianceDeviationTable.tsx

```typescript
import React from 'react';
import { ProtocolDeviation } from '../../types';
import { DeviationClassificationBadge } from './DeviationClassificationBadge';
import { DeviationStatusBadge } from './DeviationStatusBadge';
import { DeviationCapaBadge } from './DeviationCapaBadge';
import { DeviationReviewBadge } from './DeviationReviewBadge';
import { DeviationScopeBadge } from './DeviationScopeBadge';
import { ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComplianceDeviationTableProps {
  deviations: ProtocolDeviation[];
}

export const ComplianceDeviationTable: React.FC<ComplianceDeviationTableProps> = ({
  deviations,
}) => {
  return (
    <div className="bg-surface border border-border rounded-sm shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className="w-full text-left border-collapse text-xs"
          aria-label="Protocol Compliance and Deviations Log"
        >
          <thead>
            <tr className="bg-surface-soft border-b border-border text-ink-muted uppercase font-semibold text-[11px] tracking-wider">
              <th scope="col" className="py-3 px-4">Deviation ID & Title</th>
              <th scope="col" className="py-3 px-3">Scope</th>
              <th scope="col" className="py-3 px-3">Subject</th>
              <th scope="col" className="py-3 px-3">Category</th>
              <th scope="col" className="py-3 px-3">Classification</th>
              <th scope="col" className="py-3 px-3">Occurred</th>
              <th scope="col" className="py-3 px-3">Status</th>
              <th scope="col" className="py-3 px-3">CAPA</th>
              <th scope="col" className="py-3 px-3">PI Review</th>
              <th scope="col" className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deviations.map((d) => {
              const isCritical = d.classification === 'CRITICAL';

              return (
                <tr
                  key={d.id}
                  className={`hover:bg-surface-soft/80 transition-colors group cursor-pointer ${
                    isCritical ? 'bg-red-50/20' : ''
                  }`}
                >
                  {/* Deviation ID & Title */}
                  <td className="py-3.5 px-4 max-w-[240px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
                        {d.id}
                      </span>
                      {d.visitId && (
                        <span className="text-[10px] font-mono text-ink-muted bg-stone-100 px-1 py-0.2 rounded-sm border border-border">
                          {d.visitId}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-ink block truncate leading-tight mt-1">
                      {d.title}
                    </span>
                  </td>

                  {/* Scope */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <DeviationScopeBadge scope={d.scope} size="xs" />
                  </td>

                  {/* Participant */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {d.participantId ? (
                      <Link
                        to={`/pi/patients/${d.participantId}`}
                        className="inline-flex items-center gap-1 font-mono font-bold text-ink hover:text-primary hover:underline"
                        title="View Participant Profile"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {d.participantId}
                      </Link>
                    ) : (
                      <span className="text-ink-muted italic font-mono">—</span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-ink-secondary text-[11px]">
                    {d.category.replace(/_/g, ' ')}
                  </td>

                  {/* Classification */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <DeviationClassificationBadge classification={d.classification} size="sm" />
                  </td>

                  {/* Occurrence Date */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-ink-secondary">
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="w-3 h-3 text-ink-muted" />
                      <span>{d.occurrenceDate}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <DeviationStatusBadge status={d.status} size="sm" />
                  </td>

                  {/* CAPA Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <DeviationCapaBadge
                      status={d.capaStatus}
                      targetDate={d.capaTargetDate}
                      size="sm"
                    />
                  </td>

                  {/* PI Review */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <DeviationReviewBadge status={d.reviewStatus} size="sm" />
                  </td>

                  {/* Action Link */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      to={`/pi/compliance/${d.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark group-hover:underline"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

```

---

## FILE: src/components/compliance/ComplianceFiltersBar.tsx

```typescript
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2 border-t border-border/60">
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
                status: e.target.value as DeviationStatus | 'ALL' | 'OPEN',
              })
            }
            className="w-full text-xs p-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open (All Unresolved)</option>
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
                capaStatus: e.target.value as CapaStatus | 'ALL' | 'PENDING_OR_ACTIVE',
              })
            }
            className="w-full text-xs p-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All CAPA States</option>
            <option value="PENDING_OR_ACTIVE">Pending / In Progress</option>
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
                reviewStatus: e.target.value as ComplianceReviewStatus | 'ALL' | 'REVIEW_REQUIRED',
              })
            }
            className="w-full text-xs p-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Review States</option>
            <option value="REVIEW_REQUIRED">Review Required (Pending/Sign-off)</option>
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

        {/* Date Range */}
        <div>
          <label className="block text-[10px] font-semibold uppercase text-ink-muted mb-1">
            Date Range
          </label>
          <select
            value={filters.dateRange || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                dateRange: e.target.value as 'ALL' | 'LAST_7_DAYS' | 'LAST_30_DAYS',
              })
            }
            className="w-full text-xs p-1.5 bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All Dates</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
          </select>
        </div>
      </div>
    </div>
  );
};

```

---

## FILE: src/components/compliance/ComplianceSummaryCards.tsx

```typescript
import React from 'react';
import { Card } from '../ui/Card';
import { ComplianceSummaryMetrics } from '../../types';
import {
  FileText,
  AlertOctagon,
  AlertTriangle,
  FileCheck2,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface ComplianceSummaryCardsProps {
  metrics: ComplianceSummaryMetrics;
  activeFilter?: string;
  onFilterClick?: (filterKey: string) => void;
}

export const ComplianceSummaryCards: React.FC<ComplianceSummaryCardsProps> = ({
  metrics,
  activeFilter,
  onFilterClick,
}) => {
  const cards = [
    {
      label: 'Open Deviations',
      value: metrics.open,
      subtext: `${metrics.total} total recorded at site`,
      icon: FileText,
      iconBg: 'bg-stone-100',
      iconColor: 'text-ink-secondary',
      filterKey: 'STATUS_OPEN',
      alert: false,
    },
    {
      label: 'Critical Deviations',
      value: metrics.critical,
      subtext: metrics.critical > 0 ? 'Action & review required' : 'Zero critical logged',
      icon: AlertOctagon,
      iconBg: metrics.critical > 0 ? 'bg-red-50' : 'bg-stone-100',
      iconColor: metrics.critical > 0 ? 'text-semantic-danger' : 'text-ink-muted',
      filterKey: 'CLASS_CRITICAL',
      alert: metrics.critical > 0,
    },
    {
      label: 'Major Deviations',
      value: metrics.major,
      subtext: 'Potential trial integrity impact',
      icon: AlertTriangle,
      iconBg: metrics.major > 0 ? 'bg-amber-50' : 'bg-stone-100',
      iconColor: metrics.major > 0 ? 'text-amber-800' : 'text-ink-muted',
      filterKey: 'CLASS_MAJOR',
      alert: false,
    },
    {
      label: 'PI Review Required',
      value: metrics.piReviewRequired,
      subtext: metrics.piReviewRequired > 0 ? 'Pending investigator review' : 'All reviews completed',
      icon: FileCheck2,
      iconBg: metrics.piReviewRequired > 0 ? 'bg-red-50' : 'bg-stone-100',
      iconColor: metrics.piReviewRequired > 0 ? 'text-semantic-danger' : 'text-ink-muted',
      filterKey: 'REVIEW_REQUIRED',
      alert: metrics.piReviewRequired > 0,
    },
    {
      label: 'CAPA Pending',
      value: metrics.capaPending,
      subtext: 'Corrective actions underway',
      icon: Clock,
      iconBg: metrics.capaPending > 0 ? 'bg-blue-50' : 'bg-stone-100',
      iconColor: metrics.capaPending > 0 ? 'text-blue-800' : 'text-ink-muted',
      filterKey: 'CAPA_PENDING',
      alert: false,
    },
    {
      label: 'CAPA Overdue',
      value: metrics.capaOverdue,
      subtext: metrics.capaOverdue > 0 ? 'Exceeded remediation deadline' : 'Zero overdue milestones',
      icon: AlertCircle,
      iconBg: metrics.capaOverdue > 0 ? 'bg-red-50' : 'bg-stone-100',
      iconColor: metrics.capaOverdue > 0 ? 'text-semantic-danger' : 'text-ink-muted',
      filterKey: 'CAPA_OVERDUE',
      alert: metrics.capaOverdue > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.filterKey;

        return (
          <Card
            key={idx}
            className={`p-3 flex flex-col justify-between transition-all ${
              onFilterClick ? 'cursor-pointer hover:border-border-strong hover:shadow-card' : ''
            } ${isSelected ? 'ring-2 ring-primary border-primary bg-stone-50/50' : ''}`}
            onClick={() => onFilterClick && onFilterClick(card.filterKey)}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted truncate">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-sm ${card.iconBg}`}>
                <Icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-bold font-mono ${
                    card.alert ? 'text-semantic-danger font-extrabold' : 'text-ink'
                  }`}
                >
                  {card.value}
                </span>
              </div>
              <p className="text-[10px] text-ink-muted truncate mt-0.5">{card.subtext}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

```

---

## FILE: src/components/compliance/DeviationCapaBadge.tsx

```typescript
import React from 'react';
import { CapaStatus } from '../../types';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface DeviationCapaBadgeProps {
  status: CapaStatus;
  targetDate?: string;
  size?: 'xs' | 'sm' | 'md';
}

export const DeviationCapaBadge: React.FC<DeviationCapaBadgeProps> = ({
  status,
  targetDate,
  size = 'xs',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  switch (status) {
    case 'OVERDUE':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-sm border bg-red-50 text-semantic-danger border-red-300 ${sizeClasses[size]}`}
          title={targetDate ? `CAPA Overdue: target was ${targetDate}` : 'CAPA Overdue'}
        >
          <AlertCircle className="w-3 h-3 text-semantic-danger" />
          <span>CAPA Overdue</span>
        </span>
      );
    case 'PENDING':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-sm border bg-amber-50 text-amber-800 border-amber-200 ${sizeClasses[size]}`}
        >
          <Clock className="w-3 h-3 text-amber-600" />
          <span>CAPA Pending</span>
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-blue-50 text-blue-800 border-blue-200 ${sizeClasses[size]}`}
        >
          <Clock className="w-3 h-3 text-blue-600" />
          <span>CAPA Active</span>
        </span>
      );
    case 'COMPLETED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-emerald-50 text-secondary border-emerald-200 ${sizeClasses[size]}`}
        >
          <CheckCircle2 className="w-3 h-3 text-secondary" />
          <span>CAPA Complete</span>
        </span>
      );
    case 'NOT_REQUIRED':
    default:
      return (
        <span
          className={`inline-flex items-center font-normal rounded-sm border bg-surface-soft text-ink-muted border-border ${sizeClasses[size]}`}
        >
          Not Required
        </span>
      );
  }
};

```

---

## FILE: src/components/compliance/DeviationClassificationBadge.tsx

```typescript
import React from 'react';
import { DeviationClassification } from '../../types';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';

interface DeviationClassificationBadgeProps {
  classification: DeviationClassification;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
}

export const DeviationClassificationBadge: React.FC<DeviationClassificationBadgeProps> = ({
  classification,
  size = 'xs',
  showIcon = true,
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  switch (classification) {
    case 'CRITICAL':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-sm border bg-red-50 text-semantic-danger border-red-200 ${sizeClasses[size]}`}
          title="Critical Protocol Deviation: Significant variance impacting participant safety or trial data integrity"
        >
          {showIcon && <AlertOctagon className={iconSizes[size]} />}
          <span>Critical</span>
        </span>
      );
    case 'MAJOR':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-sm border bg-amber-50 text-amber-800 border-amber-200 ${sizeClasses[size]}`}
          title="Major Protocol Deviation: Variance with potential impact on study evaluations or protocol procedures"
        >
          {showIcon && <AlertTriangle className={iconSizes[size]} />}
          <span>Major</span>
        </span>
      );
    case 'MINOR':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-slate-50 text-slate-700 border-slate-200 ${sizeClasses[size]}`}
          title="Minor Protocol Deviation: Procedural variance with minimal operational impact"
        >
          {showIcon && <Info className={iconSizes[size]} />}
          <span>Minor</span>
        </span>
      );
  }
};

```

---

## FILE: src/components/compliance/DeviationReviewBadge.tsx

```typescript
import React from 'react';
import { ComplianceReviewStatus } from '../../types';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface DeviationReviewBadgeProps {
  status: ComplianceReviewStatus;
  size?: 'xs' | 'sm' | 'md';
}

export const DeviationReviewBadge: React.FC<DeviationReviewBadgeProps> = ({
  status,
  size = 'xs',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  switch (status) {
    case 'SIGN_OFF_REQUIRED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-sm border bg-red-50 text-semantic-danger border-red-300 ${sizeClasses[size]}`}
          title="Principal Investigator review pending"
        >
          <AlertTriangle className="w-3 h-3 text-semantic-danger" />
          <span>Sign-off Required</span>
        </span>
      );
    case 'NOT_REVIEWED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-stone-100 text-ink-secondary border-border ${sizeClasses[size]}`}
        >
          <Clock className="w-3 h-3 text-ink-muted" />
          <span>Pending Review</span>
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-sky-50 text-sky-800 border-sky-200 ${sizeClasses[size]}`}
        >
          <Clock className="w-3 h-3 text-sky-600" />
          <span>Under Review</span>
        </span>
      );
    case 'REVIEWED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-emerald-50 text-secondary border-emerald-200 ${sizeClasses[size]}`}
        >
          <CheckCircle2 className="w-3 h-3 text-secondary" />
          <span>Reviewed</span>
        </span>
      );
    default:
      return null;
  }
};

```

---

## FILE: src/components/compliance/DeviationScopeBadge.tsx

```typescript
import React from 'react';
import { DeviationScope } from '../../types';
import { User, Building2, BookOpen } from 'lucide-react';

interface DeviationScopeBadgeProps {
  scope: DeviationScope;
  size?: 'xs' | 'sm';
}

export const DeviationScopeBadge: React.FC<DeviationScopeBadgeProps> = ({
  scope,
  size = 'xs',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
  };

  switch (scope) {
    case 'PARTICIPANT':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-purple-50 text-purple-800 border-purple-200 ${sizeClasses[size]}`}
          title="Participant-scoped Deviation: Specific subject protocol variance"
        >
          <User className="w-2.5 h-2.5" />
          <span>Participant</span>
        </span>
      );
    case 'SITE':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-indigo-50 text-indigo-800 border-indigo-200 ${sizeClasses[size]}`}
          title="Site-scoped Deviation: Operational facility, staffing or equipment variance"
        >
          <Building2 className="w-2.5 h-2.5" />
          <span>Site Facility</span>
        </span>
      );
    case 'STUDY':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-cyan-50 text-cyan-800 border-cyan-200 ${sizeClasses[size]}`}
          title="Study-scoped Deviation: Trial-wide documentation or versioning variance"
        >
          <BookOpen className="w-2.5 h-2.5" />
          <span>Study Level</span>
        </span>
      );
    default:
      return null;
  }
};

```

---

## FILE: src/components/compliance/DeviationStatusBadge.tsx

```typescript
import React from 'react';
import { DeviationStatus } from '../../types';

interface DeviationStatusBadgeProps {
  status: DeviationStatus;
  size?: 'xs' | 'sm' | 'md';
}

export const DeviationStatusBadge: React.FC<DeviationStatusBadgeProps> = ({
  status,
  size = 'xs',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const statusConfigs: Record<
    DeviationStatus,
    { label: string; className: string }
  > = {
    REPORTED: {
      label: 'Reported',
      className: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      className: 'bg-blue-50 text-blue-800 border-blue-200 font-medium',
    },
    ACTION_REQUIRED: {
      label: 'Action Required',
      className: 'bg-rose-50 text-semantic-danger border-rose-300 font-bold',
    },
    CAPA_IN_PROGRESS: {
      label: 'CAPA In Progress',
      className: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
    },
    RESOLVED: {
      label: 'Resolved',
      className: 'bg-emerald-50 text-secondary border-emerald-200 font-medium',
    },
    CLOSED: {
      label: 'Closed',
      className: 'bg-surface-soft text-ink-muted border-border font-medium',
    },
  };

  const config = statusConfigs[status] || {
    label: status,
    className: 'bg-surface-soft text-ink border-border',
  };

  return (
    <span
      className={`inline-flex items-center rounded-sm border ${config.className} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
};

```

---

## FILE: src/components/dashboard/SafetyAndComplianceCards.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { SafetySummary, ComplianceSummary, ComplianceSummaryMetrics } from '../../types';
import { useStudy } from '../../context/StudyContext';
import { complianceService } from '../../services/complianceService';
import { AlertTriangle, ArrowRight, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SafetyAndComplianceProps {
  safety: SafetySummary;
  compliance: ComplianceSummary;
}

export const SafetyAndComplianceCards: React.FC<SafetyAndComplianceProps> = ({
  safety,
  compliance,
}) => {
  const { activeStudyId, activeSiteId } = useStudy();
  const [liveCompliance, setLiveCompliance] = useState<ComplianceSummaryMetrics | null>(null);

  useEffect(() => {
    if (activeStudyId && activeSiteId) {
      complianceService
        .getComplianceSummary({ studyId: activeStudyId, siteId: activeSiteId })
        .then(setLiveCompliance)
        .catch(() => {});
    }
  }, [activeStudyId, activeSiteId]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Section 6: Safety Summary */}
      <Card className="flex flex-col justify-between">
        <div>
          <CardHeader
            title="Trial Safety Vigilance"
            subtitle="Adverse events and safety reports requiring investigator oversight"
            action={
              safety.seriousAdverseEvents > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 bg-red-50 text-semantic-danger border border-red-200 rounded-sm">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {safety.seriousAdverseEvents} SAE Logged
                </span>
              ) : null
            }
          />
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-surface-soft border border-border rounded-sm text-center">
                <span className="text-[11px] font-semibold text-ink-muted uppercase block">Total AEs</span>
                <span className="text-xl font-bold font-heading text-ink">{safety.adverseEvents}</span>
                <span className="text-[10px] text-ink-muted block">Non-serious</span>
              </div>

              <div className="p-3 bg-red-50/70 border border-red-200 rounded-sm text-center">
                <span className="text-[11px] font-semibold text-semantic-danger uppercase block">SAE Events</span>
                <span className="text-xl font-bold font-heading text-semantic-danger">
                  {safety.seriousAdverseEvents}
                </span>
                <span className="text-[10px] text-semantic-danger font-medium block">Expedited</span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-sm text-center">
                <span className="text-[11px] font-semibold text-accent-dark uppercase block">Pending Sign-off</span>
                <span className="text-xl font-bold font-heading text-accent-dark">{safety.pendingReview}</span>
                <span className="text-[10px] text-accent-dark font-medium block">Requires PI</span>
              </div>

              <div className="p-3 bg-surface-soft border border-border rounded-sm text-center">
                <span className="text-[11px] font-semibold text-ink-muted uppercase block">Follow-up Req.</span>
                <span className="text-xl font-bold font-heading text-ink">{safety.followUpRequired}</span>
                <span className="text-[10px] text-ink-muted block">In progress</span>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="p-3 border-t border-border bg-surface-soft flex items-center justify-between text-xs">
          <span className="text-ink-secondary">ICH-GCP E6(R2) expedited reporting</span>
          <Link
            to="/pi/safety"
            className="text-primary font-semibold hover:underline inline-flex items-center gap-1 group"
          >
            <span>Open Safety Log</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Card>

      {/* Section 7: Protocol Compliance Summary */}
      <Card className="flex flex-col justify-between">
        <div>
          <CardHeader
            title="Protocol Compliance & Deviations"
            subtitle="Adherence tracking, deviations and corrective action plans (CAPA)"
            action={
              (liveCompliance ? liveCompliance.critical : compliance.criticalDeviations) === 0 ? (
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-secondary border border-emerald-200 rounded-sm">
                  0 Critical
                </span>
              ) : (
                <span className="text-xs font-bold px-2 py-0.5 bg-red-50 text-semantic-danger border border-red-200 rounded-sm flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" />
                  {liveCompliance ? liveCompliance.critical : compliance.criticalDeviations} Critical
                </span>
              )
            }
          />
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-surface-soft border border-border rounded-sm text-center">
                <span className="text-[11px] font-semibold text-ink-muted uppercase block">Open Deviations</span>
                <span className="text-xl font-bold font-heading text-ink">
                  {liveCompliance ? liveCompliance.open : compliance.openDeviations}
                </span>
                <span className="text-[10px] text-ink-muted block">Minor / Major</span>
              </div>

              <div className="p-3 bg-surface-soft border border-border rounded-sm text-center">
                <span className="text-[11px] font-semibold text-ink-muted uppercase block">Critical Deviations</span>
                <span className="text-xl font-bold font-heading text-semantic-danger">
                  {liveCompliance ? liveCompliance.critical : compliance.criticalDeviations}
                </span>
                <span className="text-[10px] text-secondary font-medium block">Zero Tolerance</span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-sm text-center">
                <span className="text-[11px] font-semibold text-accent-dark uppercase block">Pending CAPA</span>
                <span className="text-xl font-bold font-heading text-accent-dark">
                  {liveCompliance ? liveCompliance.capaPending : compliance.pendingCorrectiveActions}
                </span>
                <span className="text-[10px] text-accent-dark font-medium block">
                  {liveCompliance && liveCompliance.capaOverdue > 0
                    ? `${liveCompliance.capaOverdue} Overdue (!)`
                    : 'Action required'}
                </span>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="p-3 border-t border-border bg-surface-soft flex items-center justify-between text-xs">
          <span className="text-ink-secondary">
            Last site audit: <strong>{compliance.lastAuditDate}</strong>
          </span>
          <Link
            to="/pi/compliance"
            className="text-primary font-semibold hover:underline inline-flex items-center gap-1 group"
          >
            <span>Review Compliance</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Card>
    </div>
  );
};

```

---

## FILE: src/pages/ComplianceDeviationDetailPage.tsx

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { complianceService } from '../services/complianceService';
import {
  ProtocolDeviation,
  DeviationStatus,
} from '../types';
import { DeviationClassificationBadge } from '../components/compliance/DeviationClassificationBadge';
import { DeviationStatusBadge } from '../components/compliance/DeviationStatusBadge';
import { DeviationCapaBadge } from '../components/compliance/DeviationCapaBadge';
import { DeviationReviewBadge } from '../components/compliance/DeviationReviewBadge';
import { DeviationScopeBadge } from '../components/compliance/DeviationScopeBadge';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  FileCheck2,
  Play,
  Check,
} from 'lucide-react';

export const ComplianceDeviationDetailPage: React.FC = () => {
  const { deviationId } = useParams<{ deviationId: string }>();
  const { activeStudy, activeSite, activeStudyId, activeSiteId, isLoading: isStudyLoading } =
    useStudy();

  const [deviation, setDeviation] = useState<ProtocolDeviation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadDeviation = useCallback(async () => {
    if (!activeStudyId || !activeSiteId || !deviationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const data = await complianceService.getDeviationById(context, deviationId);
      setDeviation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve deviation detail.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, deviationId]);

  useEffect(() => {
    loadDeviation();
  }, [loadDeviation]);

  // Handle PI Review Sign-Off
  const handlePISignOff = async () => {
    if (!activeStudyId || !activeSiteId || !deviationId) return;

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await complianceService.updateReviewStatus(
        context,
        deviationId,
        'REVIEWED',
        'Dr. Ananya Sharma (PI)'
      );

      if (updated) {
        setDeviation(updated);
        setFeedbackMessage('Principal Investigator sign-off successfully recorded in audit metadata.');
        setTimeout(() => setFeedbackMessage(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record PI review sign-off.');
    }
  };

  // Handle CAPA Start Action
  const handleStartCapa = async () => {
    if (!activeStudyId || !activeSiteId || !deviationId) return;

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await complianceService.updateCapaStatus(
        context,
        deviationId,
        'IN_PROGRESS',
        'CAPA action plan activated and assigned to clinical research team.'
      );

      // If deviation was in ACTION_REQUIRED, update status to CAPA_IN_PROGRESS
      if (updated && updated.status === 'ACTION_REQUIRED') {
        const withStatus = await complianceService.updateDeviationStatus(
          context,
          deviationId,
          'CAPA_IN_PROGRESS'
        );
        if (withStatus) setDeviation(withStatus);
      } else if (updated) {
        setDeviation(updated);
      }

      setFeedbackMessage('CAPA remediation status updated to In Progress.');
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch {
      setError('Failed to update CAPA status.');
    }
  };

  // Handle CAPA Complete Action
  const handleCompleteCapa = async () => {
    if (!activeStudyId || !activeSiteId || !deviationId) return;

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await complianceService.updateCapaStatus(
        context,
        deviationId,
        'COMPLETED',
        'CAPA remediation actions fully verified and completed.'
      );

      if (updated) {
        setDeviation(updated);
        setFeedbackMessage('CAPA marked as Completed. Deviation moved to Resolved status.');
        setTimeout(() => setFeedbackMessage(null), 5000);
      }
    } catch {
      setError('Failed to complete CAPA.');
    }
  };

  // Handle Closure Action
  const handleCloseDeviation = async () => {
    if (!activeStudyId || !activeSiteId || !deviationId) return;

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await complianceService.updateDeviationStatus(
        context,
        deviationId,
        'CLOSED'
      );

      if (updated) {
        setDeviation(updated);
        setFeedbackMessage('Protocol deviation formally closed.');
        setTimeout(() => setFeedbackMessage(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close deviation.');
    }
  };

  if (isStudyLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorState
          title="Error Loading Deviation Record"
          message={error}
          onRetry={loadDeviation}
        />
      </div>
    );
  }

  if (!deviation) {
    return (
      <div className="py-8">
        <EmptyState
          title="Protocol Deviation Record Not Found"
          description={`No deviation matching ID "${deviationId}" was found under the currently active study (${activeStudy?.code}) and site (${activeSite?.name}).`}
          actionLabel="Return to Compliance Directory"
          onAction={() => {}}
          icon={<AlertCircle className="w-6 h-6 text-semantic-danger" />}
        />
        <div className="mt-4 text-center">
          <Link to="/pi/compliance">
            <Button variant="primary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Compliance Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Lifecycle step tracker configuration
  const lifecycleSteps: { status: DeviationStatus; label: string }[] = [
    { status: 'REPORTED', label: '1. Reported' },
    { status: 'UNDER_REVIEW', label: '2. Under Review' },
    { status: 'ACTION_REQUIRED', label: '3. Action Required' },
    { status: 'CAPA_IN_PROGRESS', label: '4. CAPA Active' },
    { status: 'RESOLVED', label: '5. Resolved' },
    { status: 'CLOSED', label: '6. Closed' },
  ];

  const currentStepIdx = lifecycleSteps.findIndex((s) => s.status === deviation.status);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/pi/compliance"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Protocol Compliance Directory</span>
        </Link>

        <span className="text-xs text-ink-muted">
          Active Site: <strong className="text-ink">{activeSite?.name}</strong>
        </span>
      </div>

      {/* Confirmation / Feedback Message */}
      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-sm text-xs text-secondary-dark flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header Clinical Summary Card */}
      <div
        className={`p-5 rounded-sm border ${
          deviation.classification === 'CRITICAL'
            ? 'bg-red-50/20 border-red-200'
            : 'bg-surface border-border'
        } shadow-subtle`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-sm bg-surface border border-border px-2 py-0.5 rounded-sm text-ink">
                {deviation.id}
              </span>
              <DeviationScopeBadge scope={deviation.scope} size="sm" />
              <DeviationClassificationBadge
                classification={deviation.classification}
                size="md"
              />
              <DeviationStatusBadge status={deviation.status} size="md" />
            </div>

            <h1 className="text-xl font-heading font-bold text-ink leading-snug">
              {deviation.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-ink-secondary" />
                Occurred: <strong className="font-mono text-ink">{deviation.occurrenceDate}</strong>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-ink-secondary" />
                Detected: <strong className="font-mono text-ink">{deviation.detectionDate}</strong>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-ink-secondary" />
                Study: <strong className="text-ink">{activeStudy?.code}</strong> ({deviation.protocolVersion})
              </span>
            </div>
          </div>

          {/* Quick Status Badges */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                PI Oversight
              </span>
              <div className="mt-0.5">
                <DeviationReviewBadge status={deviation.reviewStatus} size="sm" />
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                Remediation
              </span>
              <div className="mt-0.5">
                <DeviationCapaBadge
                  status={deviation.capaStatus}
                  targetDate={deviation.capaTargetDate}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle Progress Track */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-[11px] font-semibold text-ink-muted mb-2">
            <span>Protocol Deviation Lifecycle</span>
            <span className="font-mono text-ink">
              Current: {deviation.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {lifecycleSteps.map((step, idx) => {
              const isCurrent = step.status === deviation.status;
              const isPast = idx < currentStepIdx;

              let stepBg = 'bg-surface-soft border-border text-ink-muted';
              if (isCurrent) {
                stepBg = 'bg-primary text-white border-primary font-bold shadow-sm';
              } else if (isPast) {
                stepBg = 'bg-emerald-50 text-secondary border-emerald-200 font-medium';
              }

              return (
                <div
                  key={step.status}
                  className={`p-2 rounded-sm border text-center text-xs transition-colors ${stepBg}`}
                >
                  <span className="block truncate">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Clinical & Protocol Context */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Protocol Context & Entity Linkage */}
          <Card>
            <CardHeader
              title="Protocol Context & Entity Linkage"
              subtitle="Protocol version, affected sections, and related trial records"
            />
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-surface-soft border border-border rounded-sm">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                    Protocol Version
                  </span>
                  <span className="font-bold text-sm text-ink block mt-0.5">
                    {deviation.protocolVersion}
                  </span>
                  <span className="text-[11px] text-ink-muted mt-1 block">
                    Active Study Protocol
                  </span>
                </div>

                <div className="p-3 bg-surface-soft border border-border rounded-sm">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                    Deviation Category
                  </span>
                  <span className="font-bold text-sm text-ink block mt-0.5">
                    {deviation.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-ink-muted mt-1 block">
                    Operational Classification
                  </span>
                </div>

                <div className="p-3 bg-surface-soft border border-border rounded-sm sm:col-span-2">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                    Protocol Section
                  </span>
                  <span className="font-semibold text-xs text-ink block mt-0.5">
                    {deviation.protocolSection || 'Not explicitly specified'}
                  </span>
                </div>

                {/* Entity Linkage: Participant & Visit */}
                <div className="p-3 bg-surface-soft border border-border rounded-sm">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                    Subject Association
                  </span>
                  {deviation.participantId ? (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-ink">
                        {deviation.participantId}
                      </span>
                      <Link
                        to={`/pi/patients/${deviation.participantId}`}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        View Profile &rarr;
                      </Link>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-muted italic block mt-1">
                      No specific subject (Facility / Study-scoped)
                    </span>
                  )}
                </div>

                <div className="p-3 bg-surface-soft border border-border rounded-sm">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                    Related Visit
                  </span>
                  {deviation.visitId ? (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-ink">
                        {deviation.visitId}
                      </span>
                      <Link
                        to={`/pi/visits/${deviation.visitId}`}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        View Visit &rarr;
                      </Link>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-muted italic block mt-1">
                      Not tied to a scheduled visit
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Narrative & Event Description */}
          <Card>
            <CardHeader
              title="Event Narrative & Circumstances"
              subtitle="Full narrative description recorded by site personnel"
            />
            <CardContent className="space-y-4 p-4 sm:p-5 text-xs">
              <div className="p-4 bg-surface-soft border border-border rounded-sm leading-relaxed text-ink font-body whitespace-pre-line">
                {deviation.description}
              </div>

              {/* Immediate Containment Action */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block mb-1">
                  Immediate Action Taken
                </span>
                {deviation.immediateAction ? (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-sm text-ink-secondary text-xs">
                    {deviation.immediateAction}
                  </div>
                ) : (
                  <p className="text-ink-muted italic">No immediate containment action recorded.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Root Cause Analysis */}
          <Card>
            <CardHeader
              title="Root Cause Analysis"
              subtitle="Investigator root cause categorization and systemic analysis"
            />
            <CardContent className="space-y-3 p-4 sm:p-5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase text-ink-muted">
                  Root Cause Category:
                </span>
                <span className="font-mono font-bold text-xs bg-stone-100 text-ink px-2 py-0.5 rounded-sm border border-border">
                  {deviation.rootCauseCategory.replace(/_/g, ' ')}
                </span>
              </div>

              {deviation.rootCauseDescription && (
                <div className="p-3 bg-surface-soft border border-border rounded-sm text-ink leading-relaxed">
                  {deviation.rootCauseDescription}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Actions, CAPA, Oversight & Audit */}
        <div className="space-y-6">
          {/* Classification & Regulatory Note */}
          <Card className="border-border">
            <CardHeader
              title="Deviation Classification"
              subtitle="Clinical & protocol impact categorization"
            />
            <CardContent className="space-y-3 p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Assigned Level:</span>
                <DeviationClassificationBadge
                  classification={deviation.classification}
                  size="md"
                />
              </div>

              <div className="p-3 bg-stone-50 border border-border rounded-sm text-[11px] text-ink-muted leading-relaxed">
                <span className="font-bold text-ink block mb-0.5">Clinical Protocol Note:</span>
                Classification is an operational compliance categorization for this prototype and
                should not be interpreted as a universal regulatory definition.
              </div>
            </CardContent>
          </Card>

          {/* CAPA Remediation Card */}
          <Card className="border-border">
            <CardHeader
              title="Corrective & Preventive Action"
              subtitle="CAPA plan and execution status"
            />
            <CardContent className="space-y-3.5 p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">CAPA Required:</span>
                <span className="font-bold text-ink">
                  {deviation.capaRequired ? 'Yes (Mandatory)' : 'No (Isolated Event)'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-muted">CAPA Status:</span>
                <DeviationCapaBadge
                  status={deviation.capaStatus}
                  targetDate={deviation.capaTargetDate}
                  size="sm"
                />
              </div>

              {deviation.capaTargetDate && (
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Remediation Target:</span>
                  <span className="font-mono font-bold text-ink">
                    {deviation.capaTargetDate}
                  </span>
                </div>
              )}

              {deviation.capaActionSummary && (
                <div className="p-2.5 bg-surface-soft border border-border rounded-sm">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block mb-0.5">
                    Action Summary:
                  </span>
                  <p className="text-ink text-xs">{deviation.capaActionSummary}</p>
                </div>
              )}

              {/* Interactive CAPA Controls */}
              {deviation.capaRequired && (
                <div className="pt-2 border-t border-border flex flex-col gap-2">
                  {deviation.capaStatus === 'PENDING' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartCapa}
                      icon={<Play className="w-3.5 h-3.5 text-blue-600" />}
                      className="w-full justify-center"
                    >
                      Start CAPA Remediation
                    </Button>
                  )}

                  {deviation.capaStatus === 'IN_PROGRESS' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCompleteCapa}
                      icon={<Check className="w-3.5 h-3.5" />}
                      className="w-full justify-center"
                    >
                      Mark CAPA Completed
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* PI Review & Medical Sign-Off Card */}
          <Card className="border-border">
            <CardHeader
              title="Investigator Review & Sign-Off"
              subtitle="Principal Investigator clinical oversight"
            />
            <CardContent className="space-y-3.5 p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Review Status:</span>
                <DeviationReviewBadge status={deviation.reviewStatus} size="sm" />
              </div>

              {deviation.reviewedBy ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm space-y-1">
                  <div className="flex items-center gap-1.5 text-secondary font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Signed Off by PI</span>
                  </div>
                  <p className="font-mono text-ink text-[11px]">{deviation.reviewedBy}</p>
                  {deviation.reviewedAt && (
                    <p className="text-[10px] text-ink-muted">
                      Timestamp: {new Date(deviation.reviewedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-sm text-accent-dark flex items-start gap-2 text-[11px]">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      This protocol deviation requires formal review and acknowledgement by the Principal Investigator.
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePISignOff}
                    icon={<ClipboardCheck className="w-4 h-4" />}
                    className="w-full justify-center"
                  >
                    Sign Off as Principal Investigator
                  </Button>
                </div>
              )}

              {/* Closure Control */}
              {deviation.status === 'RESOLVED' && (
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCloseDeviation}
                    icon={<FileCheck2 className="w-3.5 h-3.5 text-secondary" />}
                    className="w-full justify-center"
                  >
                    Final Closure of Deviation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Metadata Card */}
          <Card className="border-border">
            <CardHeader
              title="Audit Metadata"
              subtitle="System record & tracking metadata"
            />
            <CardContent className="space-y-2.5 p-4 text-xs font-mono text-ink-secondary">
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="font-sans text-ink-muted text-[11px]">Reported By</span>
                <span className="font-bold text-ink">{deviation.reportedBy}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="font-sans text-ink-muted text-[11px]">Reported At</span>
                <span className="text-[11px]">
                  {new Date(deviation.reportedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="font-sans text-ink-muted text-[11px]">Last Updated</span>
                <span className="text-[11px]">
                  {new Date(deviation.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {deviation.resolvedAt && (
                <div className="flex justify-between items-center py-1 border-b border-border/60">
                  <span className="font-sans text-ink-muted text-[11px]">Resolved At</span>
                  <span className="text-[11px] text-secondary">
                    {new Date(deviation.resolvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {deviation.closedAt && (
                <div className="flex justify-between items-center py-1">
                  <span className="font-sans text-ink-muted text-[11px]">Closed At</span>
                  <span className="text-[11px] text-ink-muted">
                    {new Date(deviation.closedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

```

---

## FILE: src/pages/ComplianceManagementPage.tsx

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useStudy } from '../context/StudyContext';
import { complianceService } from '../services/complianceService';
import { participantService } from '../services/participantService';
import {
  ProtocolDeviation,
  DeviationFilters,
  ComplianceSummaryMetrics,
} from '../types';
import { ComplianceSummaryCards } from '../components/compliance/ComplianceSummaryCards';
import { ComplianceFiltersBar } from '../components/compliance/ComplianceFiltersBar';
import { ComplianceDeviationTable } from '../components/compliance/ComplianceDeviationTable';
import { ComplianceDeviationMobileCard } from '../components/compliance/ComplianceDeviationMobileCard';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { RefreshCw, FileCheck2, CheckCircle2 } from 'lucide-react';

export const ComplianceManagementPage: React.FC = () => {
  const { activeStudy, activeSite, activeStudyId, activeSiteId, isLoading: isStudyLoading } =
    useStudy();

  const [deviations, setDeviations] = useState<ProtocolDeviation[]>([]);
  const [totalSiteCount, setTotalSiteCount] = useState<number>(0);
  const [participantsList, setParticipantsList] = useState<
    { id: string; participantCode: string; initials: string }[]
  >([]);

  const [metrics, setMetrics] = useState<ComplianceSummaryMetrics>({
    total: 0,
    open: 0,
    critical: 0,
    major: 0,
    minor: 0,
    piReviewRequired: 0,
    capaPending: 0,
    capaOverdue: 0,
    resolvedOrClosed: 0,
  });

  const [filters, setFilters] = useState<DeviationFilters>({
    search: '',
    scope: 'ALL',
    classification: 'ALL',
    status: 'ALL',
    capaStatus: 'ALL',
    reviewStatus: 'ALL',
    category: 'ALL',
    participantId: undefined,
    dateRange: 'ALL',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // QA simulation state for Definition of Done verification
  const [simulatedError, setSimulatedError] = useState<boolean>(false);
  const [simulatedEmpty, setSimulatedEmpty] = useState<boolean>(false);

  const loadComplianceData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (simulatedError) {
        throw new Error('Simulated repository error: unable to load protocol deviations log.');
      }

      if (simulatedEmpty) {
        setDeviations([]);
        setTotalSiteCount(0);
        setMetrics({
          total: 0,
          open: 0,
          critical: 0,
          major: 0,
          minor: 0,
          piReviewRequired: 0,
          capaPending: 0,
          capaOverdue: 0,
          resolvedOrClosed: 0,
        });
        setIsLoading(false);
        return;
      }

      const context = { studyId: activeStudyId, siteId: activeSiteId };

      // Parallel fetch for filtered deviations, summary metrics, and site participants
      const [filteredData, summary, allSiteDeviations, siteParticipants] = await Promise.all([
        complianceService.getDeviations(context, filters),
        complianceService.getComplianceSummary(context),
        complianceService.getDeviations(context), // All deviations for total site count
        participantService.getParticipants(context),
      ]);

      setDeviations(filteredData);
      setMetrics(summary);
      setTotalSiteCount(allSiteDeviations.length);
      setParticipantsList(
        siteParticipants.map((p) => ({
          id: p.id,
          participantCode: p.participantCode,
          initials: p.initials,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve protocol deviations.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, filters, simulatedError, simulatedEmpty]);

  useEffect(() => {
    loadComplianceData();
  }, [loadComplianceData]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      scope: 'ALL',
      classification: 'ALL',
      status: 'ALL',
      capaStatus: 'ALL',
      reviewStatus: 'ALL',
      category: 'ALL',
      participantId: undefined,
      dateRange: 'ALL',
    });
  };

  const handleSummaryCardFilter = (filterKey: string) => {
    if (filterKey === 'STATUS_OPEN') {
      setFilters((prev) => ({
        ...prev,
        status: prev.status === 'OPEN' ? 'ALL' : 'OPEN',
      }));
    } else if (filterKey === 'CLASS_CRITICAL') {
      setFilters((prev) => ({
        ...prev,
        classification: prev.classification === 'CRITICAL' ? 'ALL' : 'CRITICAL',
      }));
    } else if (filterKey === 'CLASS_MAJOR') {
      setFilters((prev) => ({
        ...prev,
        classification: prev.classification === 'MAJOR' ? 'ALL' : 'MAJOR',
      }));
    } else if (filterKey === 'REVIEW_REQUIRED') {
      setFilters((prev) => ({
        ...prev,
        reviewStatus: prev.reviewStatus === 'REVIEW_REQUIRED' ? 'ALL' : 'REVIEW_REQUIRED',
      }));
    } else if (filterKey === 'CAPA_PENDING') {
      setFilters((prev) => ({
        ...prev,
        capaStatus: prev.capaStatus === 'PENDING_OR_ACTIVE' ? 'ALL' : 'PENDING_OR_ACTIVE',
      }));
    } else if (filterKey === 'CAPA_OVERDUE') {
      setFilters((prev) => ({
        ...prev,
        capaStatus: prev.capaStatus === 'OVERDUE' ? 'ALL' : 'OVERDUE',
      }));
    }
  };

  const getActiveFilterKey = (): string | undefined => {
    if (filters.status === 'OPEN') return 'STATUS_OPEN';
    if (filters.classification === 'CRITICAL') return 'CLASS_CRITICAL';
    if (filters.classification === 'MAJOR') return 'CLASS_MAJOR';
    if (filters.reviewStatus === 'REVIEW_REQUIRED') return 'REVIEW_REQUIRED';
    if (filters.capaStatus === 'PENDING_OR_ACTIVE') return 'CAPA_PENDING';
    if (filters.capaStatus === 'OVERDUE') return 'CAPA_OVERDUE';
    return undefined;
  };

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

  return (
    <div className="space-y-6">
      {/* Context Header with QA Simulation Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 border border-border rounded-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-heading font-bold text-ink">
              Protocol Compliance & Deviations
            </h1>
            <span className="text-xs px-2 py-0.5 bg-stone-100 text-ink-secondary border border-border rounded-sm font-mono">
              Protocol Compliance Oversight
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Site-level operational variance tracking, corrective/preventive action (CAPA) remediation, and PI oversight for{' '}
            <strong className="text-ink">{activeStudy?.code}</strong> at{' '}
            <strong className="text-ink">{activeSite?.name}</strong>.
          </p>
        </div>

        {/* QA Testing Simulation Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs bg-surface-soft p-1.5 border border-border rounded-sm">
          <span className="text-[10px] uppercase font-bold text-ink-muted px-1.5">QA Simulation:</span>
          <button
            type="button"
            onClick={() => {
              setSimulatedError((prev) => !prev);
              setSimulatedEmpty(false);
            }}
            className={`px-2 py-1 rounded-sm border transition-colors ${
              simulatedError
                ? 'bg-semantic-danger text-white border-semantic-danger font-semibold'
                : 'bg-surface text-ink hover:bg-stone-100 border-border'
            }`}
          >
            {simulatedError ? 'Error Active' : 'Simulate Error'}
          </button>

          <button
            type="button"
            onClick={() => {
              setSimulatedEmpty((prev) => !prev);
              setSimulatedError(false);
            }}
            className={`px-2 py-1 rounded-sm border transition-colors ${
              simulatedEmpty
                ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                : 'bg-surface text-ink hover:bg-stone-100 border-border'
            }`}
          >
            {simulatedEmpty ? 'Empty Active' : 'Simulate Empty'}
          </button>

          <button
            type="button"
            onClick={() => {
              setSimulatedError(false);
              setSimulatedEmpty(false);
              loadComplianceData();
            }}
            title="Reload live dataset"
            className="p-1 text-ink-muted hover:text-ink hover:bg-stone-100 rounded-sm border border-border"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary KPI Metric Cards */}
      {isStudyLoading || (isLoading && !simulatedError) ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <ComplianceSummaryCards
          metrics={metrics}
          activeFilter={getActiveFilterKey()}
          onFilterClick={handleSummaryCardFilter}
        />
      )}

      {/* Filter Controls Bar */}
      <ComplianceFiltersBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        totalCount={totalSiteCount}
        filteredCount={deviations.length}
        participants={participantsList}
      />

      {/* State Transitions: Error, Loading, Empty, or Table */}
      {error ? (
        <ErrorState
          title="Error Loading Protocol Deviations"
          message={error}
          onRetry={loadComplianceData}
        />
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : totalSiteCount === 0 ? (
        <EmptyState
          title="No Protocol Deviations Recorded"
          description={`There are currently zero protocol deviations or compliance variances registered for ${activeStudy?.code} at ${activeSite?.name}.`}
          actionLabel="Refresh Records"
          onAction={loadComplianceData}
          icon={<CheckCircle2 className="w-8 h-8 text-secondary" />}
        />
      ) : deviations.length === 0 && isFiltered ? (
        <EmptyState
          title="No Deviations Match the Selected Filters"
          description="Adjust your search query, scope, classification, or status criteria to inspect recorded protocol events."
          actionLabel="Clear All Filters"
          onAction={handleResetFilters}
          icon={<FileCheck2 className="w-8 h-8 text-ink-muted" />}
        />
      ) : (
        <>
          {/* Desktop Table View (>= lg) */}
          <div className="hidden lg:block">
            <ComplianceDeviationTable deviations={deviations} />
          </div>

          {/* Mobile & Tablet Card View (< lg) */}
          <div className="lg:hidden space-y-3">
            {deviations.map((d) => (
              <ComplianceDeviationMobileCard key={d.id} deviation={d} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

```

---

## FILE: src/repositories/mockComplianceRepository.ts

```typescript
import { IComplianceRepository, ParticipantQueryContext } from './interfaces';
import {
  ProtocolDeviation,
  DeviationFilters,
  ComplianceSummaryMetrics,
  DeviationStatus,
  ComplianceReviewStatus,
  CapaStatus,
  isValidDeviationStatusTransition,
} from '../types';
import { MOCK_PROTOCOL_DEVIATIONS } from '../data/mockData';
import { getReferenceDate, parseDateISO } from '../utils/visitCalculations';

export class MockComplianceRepository implements IComplianceRepository {
  private deviationStore: Record<string, Record<string, ProtocolDeviation[]>>;

  constructor() {
    this.deviationStore = structuredClone(MOCK_PROTOCOL_DEVIATIONS);
  }

  async getDeviations(
    context: ParticipantQueryContext,
    filters?: DeviationFilters
  ): Promise<ProtocolDeviation[]> {
    await new Promise((resolve) => setTimeout(resolve, 40));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return [];

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return [];

    let results = [...siteDeviations];
    const refDateStr = getReferenceDate();

    if (filters) {
      // 1. Search filter: ID, title, description, participantId, protocolSection, category, reportedBy
      if (filters.search && filters.search.trim().length > 0) {
        const query = filters.search.trim().toLowerCase();
        results = results.filter(
          (d) =>
            d.id.toLowerCase().includes(query) ||
            d.title.toLowerCase().includes(query) ||
            d.description.toLowerCase().includes(query) ||
            (d.participantId && d.participantId.toLowerCase().includes(query)) ||
            (d.protocolSection && d.protocolSection.toLowerCase().includes(query)) ||
            d.category.toLowerCase().includes(query) ||
            d.reportedBy.toLowerCase().includes(query)
        );
      }

      // 2. Scope filter: PARTICIPANT, SITE, STUDY
      if (filters.scope && filters.scope !== 'ALL') {
        results = results.filter((d) => d.scope === filters.scope);
      }

      // 3. Classification filter: MINOR, MAJOR, CRITICAL
      if (filters.classification && filters.classification !== 'ALL') {
        results = results.filter((d) => d.classification === filters.classification);
      }

      // 4. Status filter
      if (filters.status && filters.status !== 'ALL') {
        if (filters.status === 'OPEN') {
          results = results.filter((d) => d.status !== 'RESOLVED' && d.status !== 'CLOSED');
        } else {
          results = results.filter((d) => d.status === filters.status);
        }
      }

      // 5. CAPA status filter
      if (filters.capaStatus && filters.capaStatus !== 'ALL') {
        if (filters.capaStatus === 'PENDING_OR_ACTIVE') {
          results = results.filter((d) => d.capaStatus === 'PENDING' || d.capaStatus === 'IN_PROGRESS');
        } else {
          results = results.filter((d) => d.capaStatus === filters.capaStatus);
        }
      }

      // 6. Review status filter
      if (filters.reviewStatus && filters.reviewStatus !== 'ALL') {
        if (filters.reviewStatus === 'REVIEW_REQUIRED') {
          results = results.filter(
            (d) => d.reviewStatus === 'SIGN_OFF_REQUIRED' || d.reviewStatus === 'NOT_REVIEWED'
          );
        } else {
          results = results.filter((d) => d.reviewStatus === filters.reviewStatus);
        }
      }

      // 7. Category filter
      if (filters.category && filters.category !== 'ALL') {
        results = results.filter((d) => d.category === filters.category);
      }

      // 8. Participant filter
      if (filters.participantId && filters.participantId !== 'ALL') {
        results = results.filter(
          (d) => d.participantId && d.participantId.toLowerCase() === filters.participantId!.toLowerCase()
        );
      }

      // 9. Date Range filter
      if (filters.dateRange && filters.dateRange !== 'ALL') {
        const refParsed = parseDateISO(refDateStr);

        if (filters.dateRange === 'LAST_7_DAYS') {
          const sevenDaysPrior = new Date(refParsed.getTime());
          sevenDaysPrior.setUTCDate(sevenDaysPrior.getUTCDate() - 7);
          const sevenDaysPriorStr = sevenDaysPrior.toISOString().slice(0, 10);
          results = results.filter(
            (d) => d.occurrenceDate >= sevenDaysPriorStr && d.occurrenceDate <= refDateStr
          );
        } else if (filters.dateRange === 'LAST_30_DAYS') {
          const thirtyDaysPrior = new Date(refParsed.getTime());
          thirtyDaysPrior.setUTCDate(thirtyDaysPrior.getUTCDate() - 30);
          const thirtyDaysPriorStr = thirtyDaysPrior.toISOString().slice(0, 10);
          results = results.filter(
            (d) => d.occurrenceDate >= thirtyDaysPriorStr && d.occurrenceDate <= refDateStr
          );
        }
      }
    }

    // Sort: CRITICAL first, then MAJOR, then MINOR, and within each by occurrenceDate descending
    const classificationOrder: Record<string, number> = {
      CRITICAL: 0,
      MAJOR: 1,
      MINOR: 2,
    };

    results.sort((a, b) => {
      const orderA = classificationOrder[a.classification] ?? 3;
      const orderB = classificationOrder[b.classification] ?? 3;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return b.occurrenceDate.localeCompare(a.occurrenceDate);
    });

    return structuredClone(results);
  }

  async getDeviationById(
    context: ParticipantQueryContext,
    deviationId: string
  ): Promise<ProtocolDeviation | null> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return null;

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return null;

    const found = siteDeviations.find((d) => d.id.toLowerCase() === deviationId.toLowerCase());
    return found ? structuredClone(found) : null;
  }

  async getParticipantDeviations(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<ProtocolDeviation[]> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return [];

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return [];

    const participantDeviations = siteDeviations
      .filter(
        (d) => d.participantId && d.participantId.toLowerCase() === participantId.toLowerCase()
      )
      .sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate));

    return structuredClone(participantDeviations);
  }

  async getVisitDeviations(
    context: ParticipantQueryContext,
    visitId: string
  ): Promise<ProtocolDeviation[]> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return [];

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return [];

    const visitDeviations = siteDeviations
      .filter((d) => d.visitId && d.visitId.toLowerCase() === visitId.toLowerCase())
      .sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate));

    return structuredClone(visitDeviations);
  }

  async getComplianceSummary(
    context: ParticipantQueryContext
  ): Promise<ComplianceSummaryMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) {
      return {
        total: 0,
        open: 0,
        critical: 0,
        major: 0,
        minor: 0,
        piReviewRequired: 0,
        capaPending: 0,
        capaOverdue: 0,
        resolvedOrClosed: 0,
      };
    }

    const siteDeviations = studyDeviations[context.siteId] || [];

    const total = siteDeviations.length;
    const open = siteDeviations.filter(
      (d) => d.status !== 'RESOLVED' && d.status !== 'CLOSED'
    ).length;
    const critical = siteDeviations.filter((d) => d.classification === 'CRITICAL').length;
    const major = siteDeviations.filter((d) => d.classification === 'MAJOR').length;
    const minor = siteDeviations.filter((d) => d.classification === 'MINOR').length;
    const piReviewRequired = siteDeviations.filter(
      (d) => d.reviewStatus === 'SIGN_OFF_REQUIRED' || d.reviewStatus === 'NOT_REVIEWED'
    ).length;
    const capaPending = siteDeviations.filter(
      (d) => d.capaStatus === 'PENDING' || d.capaStatus === 'IN_PROGRESS'
    ).length;
    const capaOverdue = siteDeviations.filter((d) => d.capaStatus === 'OVERDUE').length;
    const resolvedOrClosed = siteDeviations.filter(
      (d) => d.status === 'RESOLVED' || d.status === 'CLOSED'
    ).length;

    return {
      total,
      open,
      critical,
      major,
      minor,
      piReviewRequired,
      capaPending,
      capaOverdue,
      resolvedOrClosed,
    };
  }

  async updateDeviationStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    status: DeviationStatus
  ): Promise<ProtocolDeviation | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return null;

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return null;

    const deviation = siteDeviations.find((d) => d.id.toLowerCase() === deviationId.toLowerCase());
    if (!deviation) return null;

    if (deviation.status !== status && !isValidDeviationStatusTransition(deviation.status, status)) {
      throw new Error(
        `Invalid deviation status transition: cannot transition from ${deviation.status} to ${status}.`
      );
    }

    deviation.status = status;
    deviation.updatedAt = new Date().toISOString();

    if (status === 'RESOLVED') {
      deviation.resolvedAt = deviation.updatedAt;
    } else if (status === 'CLOSED') {
      if (!deviation.resolvedAt) deviation.resolvedAt = deviation.updatedAt;
      deviation.closedAt = deviation.updatedAt;
    }

    return structuredClone(deviation);
  }

  async updateReviewStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    reviewStatus: ComplianceReviewStatus,
    reviewedBy: string = 'Dr. Ananya Sharma (PI)'
  ): Promise<ProtocolDeviation | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return null;

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return null;

    const deviation = siteDeviations.find((d) => d.id.toLowerCase() === deviationId.toLowerCase());
    if (!deviation) return null;

    deviation.reviewStatus = reviewStatus;
    deviation.updatedAt = new Date().toISOString();

    if (reviewStatus === 'REVIEWED') {
      deviation.reviewedBy = reviewedBy;
      deviation.reviewedAt = deviation.updatedAt;
    }

    return structuredClone(deviation);
  }

  async updateCapaStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    capaStatus: CapaStatus,
    summary?: string
  ): Promise<ProtocolDeviation | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return null;

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return null;

    const deviation = siteDeviations.find((d) => d.id.toLowerCase() === deviationId.toLowerCase());
    if (!deviation) return null;

    deviation.capaStatus = capaStatus;
    if (summary) {
      deviation.capaActionSummary = summary;
    }
    deviation.updatedAt = new Date().toISOString();

    // If CAPA is moved to COMPLETED, allow deviation to be moved to RESOLVED if currently in CAPA_IN_PROGRESS
    if (capaStatus === 'COMPLETED' && deviation.status === 'CAPA_IN_PROGRESS') {
      deviation.status = 'RESOLVED';
      deviation.resolvedAt = deviation.updatedAt;
    }

    return structuredClone(deviation);
  }
}

export const mockComplianceRepository = new MockComplianceRepository();

```

---

## FILE: src/services/complianceService.ts

```typescript
import { IComplianceRepository, ParticipantQueryContext } from '../repositories/interfaces';
import { mockComplianceRepository } from '../repositories/mockComplianceRepository';
import {
  ProtocolDeviation,
  DeviationFilters,
  ComplianceSummaryMetrics,
  DeviationStatus,
  ComplianceReviewStatus,
  CapaStatus,
  ParticipantComplianceSummary,
  isValidDeviationStatusTransition,
} from '../types';

export class ComplianceService {
  private repo: IComplianceRepository;

  constructor(repository: IComplianceRepository = mockComplianceRepository) {
    this.repo = repository;
  }

  async getDeviations(
    context: ParticipantQueryContext,
    filters?: DeviationFilters
  ): Promise<ProtocolDeviation[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.getDeviations(context, filters);
  }

  async getDeviationById(
    context: ParticipantQueryContext,
    deviationId: string
  ): Promise<ProtocolDeviation | null> {
    if (!context.studyId || !context.siteId || !deviationId) {
      return null;
    }
    return this.repo.getDeviationById(context, deviationId);
  }

  async getParticipantDeviations(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<ProtocolDeviation[]> {
    if (!context.studyId || !context.siteId || !participantId) {
      return [];
    }
    return this.repo.getParticipantDeviations(context, participantId);
  }

  async getParticipantComplianceSummary(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<ParticipantComplianceSummary> {
    const deviations = await this.getParticipantDeviations(context, participantId);
    const totalDeviations = deviations.length;
    const criticalCount = deviations.filter((d) => d.classification === 'CRITICAL').length;
    const majorCount = deviations.filter((d) => d.classification === 'MAJOR').length;
    const minorCount = deviations.filter((d) => d.classification === 'MINOR').length;
    const openCount = deviations.filter((d) => d.status !== 'RESOLVED' && d.status !== 'CLOSED').length;

    return {
      totalDeviations,
      criticalCount,
      majorCount,
      minorCount,
      openCount,
      deviations,
    };
  }

  async getVisitDeviations(
    context: ParticipantQueryContext,
    visitId: string
  ): Promise<ProtocolDeviation[]> {
    if (!context.studyId || !context.siteId || !visitId) {
      return [];
    }
    return this.repo.getVisitDeviations(context, visitId);
  }

  async getComplianceSummary(
    context: ParticipantQueryContext
  ): Promise<ComplianceSummaryMetrics> {
    if (!context.studyId || !context.siteId) {
      return {
        total: 0,
        open: 0,
        critical: 0,
        major: 0,
        minor: 0,
        piReviewRequired: 0,
        capaPending: 0,
        capaOverdue: 0,
        resolvedOrClosed: 0,
      };
    }
    return this.repo.getComplianceSummary(context);
  }

  isValidStatusTransition(
    currentStatus: DeviationStatus,
    targetStatus: DeviationStatus
  ): boolean {
    return isValidDeviationStatusTransition(currentStatus, targetStatus);
  }

  async updateDeviationStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    status: DeviationStatus
  ): Promise<ProtocolDeviation | null> {
    if (!context.studyId || !context.siteId || !deviationId) {
      return null;
    }
    return this.repo.updateDeviationStatus(context, deviationId, status);
  }

  async updateReviewStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    reviewStatus: ComplianceReviewStatus,
    reviewedBy?: string
  ): Promise<ProtocolDeviation | null> {
    if (!context.studyId || !context.siteId || !deviationId) {
      return null;
    }
    return this.repo.updateReviewStatus(context, deviationId, reviewStatus, reviewedBy);
  }

  async updateCapaStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    capaStatus: CapaStatus,
    summary?: string
  ): Promise<ProtocolDeviation | null> {
    if (!context.studyId || !context.siteId || !deviationId) {
      return null;
    }
    return this.repo.updateCapaStatus(context, deviationId, capaStatus, summary);
  }

  /**
   * Deterministic attention calculation:
   * A deviation requires operational attention by the PI when:
   * 1. classification === 'CRITICAL'
   * 2. reviewStatus === 'SIGN_OFF_REQUIRED'
   * 3. status === 'ACTION_REQUIRED'
   * 4. capaStatus === 'OVERDUE'
   */
  isAttentionRequired(deviation: ProtocolDeviation): boolean {
    return (
      deviation.classification === 'CRITICAL' ||
      deviation.reviewStatus === 'SIGN_OFF_REQUIRED' ||
      deviation.status === 'ACTION_REQUIRED' ||
      deviation.capaStatus === 'OVERDUE'
    );
  }
}

export const complianceService = new ComplianceService();

```

---

## FILE: src/tests/services.test.ts

```typescript
import { studyService } from '../services/studyService';
import { dashboardService } from '../services/dashboardService';
import { participantService } from '../services/participantService';
import { visitService } from '../services/visitService';
import { safetyService } from '../services/safetyService';
import { complianceService } from '../services/complianceService';
import {
  calculateVisitWindow,
  deriveVisitStatus,
  calculateActivityMetrics,
} from '../utils/visitCalculations';

function assert(condition: unknown, message: string = 'Assertion condition was false'): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertStrictEqual<T>(actual: T, expected: T, message: string = 'Values are not strictly equal') {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message} (expected: ${expected}, got: ${actual})`);
  }
}

async function runTests() {
  console.log('--- STARTING CTMS SERVICE & DATA TESTS (SEGMENTS A & B) ---');

  // Test 1: Study Service retrieves studies
  console.log('Test 1: studyService.getStudies()');
  const studies = await studyService.getStudies();
  assert(Array.isArray(studies), 'Studies should be an array');
  assert(studies.length >= 2, 'Should have at least 2 fictional studies');
  assertStrictEqual(studies[0].code, 'AYU-CT-001', 'First study should be AYU-CT-001');
  console.log('✓ Test 1 passed: Studies retrieved successfully.');

  // Test 2: Study Service retrieves sites for a study
  console.log('Test 2: studyService.getSites("STUDY-001")');
  const sites = await studyService.getSites('STUDY-001');
  assert(Array.isArray(sites), 'Sites should be an array');
  assert(sites.length >= 2, 'STUDY-001 should have at least 2 sites');
  assertStrictEqual(sites[0].id, 'SITE-001', 'First site should be SITE-001');
  assertStrictEqual(sites[0].siteCode, 'SITE-001', 'First site code should be SITE-001');
  console.log('✓ Test 2 passed: Sites retrieved successfully.');

  // Test 3: Study Context model
  console.log('Test 3: studyService.getCurrentContext("STUDY-001", "SITE-001")');
  const context = await studyService.getCurrentContext('STUDY-001', 'SITE-001');
  assert(context !== null, 'Context should not be null');
  assertStrictEqual(context?.studyCode, 'AYU-CT-001', 'Context studyCode matches');
  assertStrictEqual(context?.siteCode, 'SITE-001', 'Context siteCode matches');
  assertStrictEqual(context?.piName, 'Dr. Ananya Sharma', 'Context PI matches');
  assertStrictEqual(context?.studyStatus, 'Recruiting', 'Context studyStatus matches');
  console.log('✓ Test 3 passed: Context model valid.');

  // Test 4: Dashboard Overview Data consistency & math
  console.log('Test 4: dashboardService.getOverview("STUDY-001", "SITE-001")');
  const overview = await dashboardService.getOverview('STUDY-001', 'SITE-001');
  assert(overview !== null, 'Overview should not be null');

  // Verify participant numbers consistency
  const { participantSummary, recruitment, visits, safetySummary, complianceSummary } = overview!;
  assertStrictEqual(participantSummary.enrolled, 124, 'Enrolled participants should be 124');
  assertStrictEqual(recruitment.target, 150, 'Recruitment target should be 150');
  assertStrictEqual(recruitment.enrolled, 124, 'Recruitment enrolled should match participant enrolled');
  assertStrictEqual(recruitment.remaining, 26, 'Remaining should be target - enrolled (150 - 124 = 26)');

  // Verify mathematical calculation of progress: 124 / 150 = 82.666...% -> 82.7%
  const expectedProgress = Math.round((124 / 150) * 1000) / 10;
  assertStrictEqual(recruitment.progressPercent, expectedProgress, 'Recruitment progress percentage must be mathematically calculated');
  assertStrictEqual(recruitment.progressPercent, 82.7, 'Progress should equal 82.7%');

  // Verify participant status breakdown sum: active (98) + completed (21) + withdrawn (5) = 124
  assertStrictEqual(
    participantSummary.active + participantSummary.completed + participantSummary.withdrawn,
    participantSummary.enrolled,
    'Active + Completed + Withdrawn must equal Enrolled participants'
  );

  // Verify visits metrics
  assertStrictEqual(visits.upcoming, 18, 'Upcoming visits should be 18');
  assertStrictEqual(visits.overdue, 3, 'Overdue visits should be 3');

  // Verify safety summary
  assertStrictEqual(safetySummary.adverseEvents, 12, 'Adverse Events should be 12');
  assertStrictEqual(safetySummary.seriousAdverseEvents, 2, 'Serious Adverse Events should be 2');
  assertStrictEqual(safetySummary.pendingReview, 1, 'Pending safety reviews should be 1');

  // Verify compliance summary
  assertStrictEqual(complianceSummary.openDeviations, 3, 'Open deviations should be 3');
  assertStrictEqual(complianceSummary.criticalDeviations, 0, 'Critical deviations should be 0');

  // Verify upcoming activities
  assert(overview!.upcomingActivities.length > 0, 'Upcoming activities should not be empty');
  const hasDueToday = overview!.upcomingActivities.some((a) => a.status === 'Due Today');
  const hasOverdue = overview!.upcomingActivities.some((a) => a.status === 'Overdue');
  assert(hasDueToday, 'Upcoming activities should contain at least one Due Today');
  assert(hasOverdue, 'Upcoming activities should contain at least one Overdue');

  // Verify pending actions
  assert(overview!.pendingActions.length > 0, 'Pending actions should not be empty');
  const hasHighPriority = overview!.pendingActions.some((a) => a.priority === 'High');
  assert(hasHighPriority, 'Pending actions should include high priority actions');

  // Verify recent activities feed
  assert(overview!.recentActivities.length > 0, 'Recent activities should not be empty');
  assert(overview!.recentActivities[0].actor.length > 0, 'Recent activities must include actor');

  console.log('✓ Test 4 passed: Dashboard overview data integrity & calculation confirmed.');

  // Test 5: Non-existent study/site handles gracefully
  console.log('Test 5: Graceful null handling on non-existent study/site');
  const nullOverview = await dashboardService.getOverview('INVALID-STUDY', 'INVALID-SITE');
  assertStrictEqual(nullOverview, null, 'Non-existent study/site should return null');
  console.log('✓ Test 5 passed: Null handling confirmed.');

  // ==========================================
  // SEGMENT B: PARTICIPANT MANAGEMENT TESTS
  // ==========================================

  // Test 6: Participant retrieval & study/site scoping
  console.log('Test 6: participantService.getParticipants() - Study + Site Scoping');
  const ctxSite1 = { studyId: 'STUDY-001', siteId: 'SITE-001' };
  const participantsSite1 = await participantService.getParticipants(ctxSite1);
  assert(Array.isArray(participantsSite1), 'Participants should be an array');
  assertStrictEqual(participantsSite1.length, 10, 'SITE-001 should have 10 participants');
  assert(participantsSite1.every((p) => p.studyId === 'STUDY-001' && p.siteId === 'SITE-001'), 'All participants must belong to STUDY-001 and SITE-001');

  const ctxSite2 = { studyId: 'STUDY-001', siteId: 'SITE-002' };
  const participantsSite2 = await participantService.getParticipants(ctxSite2);
  assertStrictEqual(participantsSite2.length, 3, 'SITE-002 should have 3 participants');
  assert(participantsSite2.every((p) => p.siteId === 'SITE-002'), 'All participants must belong to SITE-002');
  console.log('✓ Test 6 passed: Study/site participant scoping verified.');

  // Test 7: Participant search (case-insensitive for code, screening, initials)
  console.log('Test 7: Participant search filtering');
  const searchByCode = await participantService.getParticipants(ctxSite1, { search: 'pt-1023' });
  assertStrictEqual(searchByCode.length, 1, 'Search for pt-1023 should return 1 result');
  assertStrictEqual(searchByCode[0].participantCode, 'PT-1023');

  const searchByInitials = await participantService.getParticipants(ctxSite1, { search: 'r.k.' });
  assertStrictEqual(searchByInitials.length, 1, 'Search for r.k. should return 1 result');
  assertStrictEqual(searchByInitials[0].initials, 'R.K.');

  const searchByScreening = await participantService.getParticipants(ctxSite1, { search: 'scr-001-042' });
  assertStrictEqual(searchByScreening.length, 1, 'Search for scr-001-042 should return 1 result');
  assertStrictEqual(searchByScreening[0].participantCode, 'PT-1042');
  console.log('✓ Test 7 passed: Case-insensitive search verified.');

  // Test 8: Status & Demographic filtering
  console.log('Test 8: Status and demographic filters');
  const activeParticipants = await participantService.getParticipants(ctxSite1, { status: 'ACTIVE' });
  assertStrictEqual(activeParticipants.length, 4, 'SITE-001 should have 4 ACTIVE participants');
  assert(activeParticipants.every((p) => p.status === 'ACTIVE'));

  const femaleActiveParticipants = await participantService.getParticipants(ctxSite1, {
    status: 'ACTIVE',
    sex: 'F',
  });
  assertStrictEqual(femaleActiveParticipants.length, 2, 'SITE-001 should have 2 active female participants');

  const attentionRequiredList = await participantService.getParticipants(ctxSite1, { attentionRequired: true });
  assertStrictEqual(attentionRequiredList.length, 3, 'SITE-001 should have 3 participants flagged with attention required');
  console.log('✓ Test 8 passed: Status, sex, and attention filtering verified.');

  // Test 9: Participant Summary Calculations
  console.log('Test 9: participantService.getParticipantSummary()');
  const summaryMetrics = await participantService.getParticipantSummary(ctxSite1);
  assertStrictEqual(summaryMetrics.total, 10, 'Total participants should be 10');
  assertStrictEqual(summaryMetrics.active, 4, 'Active count should be 4');
  assertStrictEqual(summaryMetrics.screening, 2, 'Screening/eligible count should be 2');
  assertStrictEqual(summaryMetrics.completed, 1, 'Completed count should be 1');
  assertStrictEqual(summaryMetrics.withdrawn, 2, 'Withdrawn + Lost to follow-up count should be 2');
  assertStrictEqual(summaryMetrics.screenFailed, 1, 'Screen failed count should be 1');
  assertStrictEqual(summaryMetrics.attentionRequired, 3, 'Attention required count should be 3');
  console.log('✓ Test 9 passed: Participant summary metric derivations verified.');

  // Test 10: Participant Detail Retrieval & Invalid Handling
  console.log('Test 10: participantService.getParticipant() detail lookup');
  const detail = await participantService.getParticipant(ctxSite1, 'PT-1023');
  assert(detail !== null, 'Participant PT-1023 should exist');
  assertStrictEqual(detail?.participantCode, 'PT-1023');
  assert(Array.isArray(detail?.recentActivities), 'Participant should include recentActivities');
  assert((detail?.recentActivities?.length ?? 0) >= 3, 'PT-1023 should have recent activities');

  const invalidDetail = await participantService.getParticipant(ctxSite1, 'NON-EXISTENT-ID');
  assertStrictEqual(invalidDetail, null, 'Non-existent participant ID should return null');

  // Verify site isolation on detail: PT-2015 belongs to SITE-002, querying from SITE-001 should return null
  const crossSiteDetail = await participantService.getParticipant(ctxSite1, 'PT-2015');
  assertStrictEqual(crossSiteDetail, null, 'Querying a participant from another site must return null');
  // ==========================================
  // SEGMENT C: VISITS & CLINICAL ACTIVITIES TESTS
  // ==========================================

  // Test 11: Visit Window calculation
  console.log('Test 11: calculateVisitWindow() protocol offsets & window derivation');
  const windowCalc = calculateVisitWindow('2026-08-28', 30, 3, 3);
  assertStrictEqual(windowCalc.targetDate, '2026-09-27', 'Target date should be 2026-08-28 + 30 days = 2026-09-27');
  assertStrictEqual(windowCalc.windowStart, '2026-09-24', 'Window start should be target - 3 days = 2026-09-24');
  assertStrictEqual(windowCalc.windowEnd, '2026-09-30', 'Window end should be target + 3 days = 2026-09-30');
  console.log('✓ Test 11 passed: Protocol window calculation verified.');

  // Test 12: Deterministic Visit Status derivation
  console.log('Test 12: deriveVisitStatus() operational status rules');
  const baseVisitParams = {
    targetDate: '2026-09-27',
    windowStart: '2026-09-24',
    windowEnd: '2026-09-30',
  };

  // Status inside window on reference date (2026-09-29) -> DUE
  const statusDue = deriveVisitStatus({ ...baseVisitParams, referenceDate: '2026-09-29' });
  assertStrictEqual(statusDue, 'DUE', 'Visit inside window on 2026-09-29 should be DUE');

  // Status before window opens (2026-09-20) -> SCHEDULED
  const statusScheduled = deriveVisitStatus({ ...baseVisitParams, referenceDate: '2026-09-20' });
  assertStrictEqual(statusScheduled, 'SCHEDULED', 'Visit before window opens should be SCHEDULED');

  // Status shortly past window closure (2026-10-02) -> OVERDUE
  const statusOverdue = deriveVisitStatus({ ...baseVisitParams, referenceDate: '2026-10-02' });
  assertStrictEqual(statusOverdue, 'OVERDUE', 'Visit 2 days past window end should be OVERDUE');

  // Status >14 days past window closure (2026-10-20) -> MISSED
  const statusMissed = deriveVisitStatus({ ...baseVisitParams, referenceDate: '2026-10-20' });
  assertStrictEqual(statusMissed, 'MISSED', 'Visit >14 days past window end should be MISSED');

  // Completed visit with completion date -> COMPLETED
  const statusCompleted = deriveVisitStatus({
    ...baseVisitParams,
    referenceDate: '2026-10-20',
    completedDate: '2026-09-27',
  });
  assertStrictEqual(statusCompleted, 'COMPLETED', 'Visit with completedDate should always be COMPLETED');

  // Cancelled visit -> CANCELLED
  const statusCancelled = deriveVisitStatus({
    ...baseVisitParams,
    cancelledDate: '2026-09-25',
  });
  assertStrictEqual(statusCancelled, 'CANCELLED', 'Visit with cancelledDate should be CANCELLED');
  console.log('✓ Test 12 passed: Deterministic status derivation verified.');

  // Test 13: Activity metrics calculation
  console.log('Test 13: calculateActivityMetrics() checklist metrics');
  const metricsCalc = calculateActivityMetrics([
    { id: '1', visitId: 'V1', code: 'A1', name: 'Vital Signs', required: true, status: 'COMPLETED' },
    { id: '2', visitId: 'V1', code: 'A2', name: 'Blood Draw', required: true, status: 'PENDING' },
    { id: '3', visitId: 'V1', code: 'A3', name: 'Optional Survey', required: false, status: 'PENDING' },
  ]);
  assertStrictEqual(metricsCalc.total, 3, 'Total activities should be 3');
  assertStrictEqual(metricsCalc.completed, 1, 'Completed activities should be 1');
  assertStrictEqual(metricsCalc.pending, 2, 'Pending activities should be 2');
  assertStrictEqual(metricsCalc.requiredIncomplete, 1, 'Required incomplete should be 1 (only required pending/in_progress)');
  console.log('✓ Test 13 passed: Activity metrics calculations verified.');

  // Test 14: Protocol visit definitions retrieval
  console.log('Test 14: visitService.getProtocolVisits()');
  const protoStudy1 = await visitService.getProtocolVisits('STUDY-001');
  assert(Array.isArray(protoStudy1), 'Protocol visits should be an array');
  assertStrictEqual(protoStudy1.length, 6, 'STUDY-001 should define 6 protocol visits');
  assertStrictEqual(protoStudy1[0].code, 'V1-SCR', 'First visit should be V1-SCR');
  assertStrictEqual(protoStudy1[5].code, 'V6-D90', 'Last visit should be V6-D90');

  const protoStudy2 = await visitService.getProtocolVisits('STUDY-002');
  assertStrictEqual(protoStudy2.length, 4, 'STUDY-002 should define 4 protocol visits');
  console.log('✓ Test 14 passed: Protocol visit definitions verified.');

  // Test 15: Site-level visit retrieval & study/site scoping
  console.log('Test 15: visitService.getVisits() - Site scoping');
  const visitsSite1 = await visitService.getVisits(ctxSite1);
  assert(Array.isArray(visitsSite1), 'Visits should be an array');
  assert(visitsSite1.length >= 10, 'SITE-001 should have at least 10 visits scheduled');
  assert(visitsSite1.every((v) => v.studyId === 'STUDY-001' && v.siteId === 'SITE-001'), 'All visits must belong to SITE-001');

  const visitsSite2 = await visitService.getVisits(ctxSite2);
  assertStrictEqual(visitsSite2.length, 2, 'SITE-002 should have 2 visits scheduled');
  assert(visitsSite2.every((v) => v.siteId === 'SITE-002'), 'All visits must belong to SITE-002');
  console.log('✓ Test 15 passed: Visit scoping verified.');

  // Test 16: Visit filtering
  console.log('Test 16: Visit filtering by status, search, and participant');
  const dueVisits = await visitService.getVisits(ctxSite1, { status: 'DUE' });
  assert(dueVisits.length >= 1, 'SITE-001 should have at least 1 DUE visit');
  assert(dueVisits.every((v) => v.status === 'DUE'), 'All returned visits must be DUE');

  const searchVisits = await visitService.getVisits(ctxSite1, { search: 'pt-1023' });
  assert(searchVisits.length >= 4, 'Search for PT-1023 should return all PT-1023 visits');
  assert(searchVisits.every((v) => v.participantCode === 'PT-1023'));

  const ptVisitsFiltered = await visitService.getVisits(ctxSite1, { participantId: 'PT-1023' });
  assertStrictEqual(ptVisitsFiltered.length, searchVisits.length, 'Filter by participantId should match search count');
  console.log('✓ Test 16 passed: Visit filters verified.');

  // Test 17: Participant visit timeline
  console.log('Test 17: visitService.getParticipantVisits()');
  const pt1023Timeline = await visitService.getParticipantVisits(ctxSite1, 'PT-1023');
  assert(pt1023Timeline.length >= 4, 'PT-1023 should have timeline visits');
  for (let i = 0; i < pt1023Timeline.length - 1; i++) {
    assert(pt1023Timeline[i].sequence <= pt1023Timeline[i + 1].sequence, 'Visits must be sorted by sequence');
  }
  console.log('✓ Test 17 passed: Participant visit timeline verified.');

  // Test 18: Visit detail lookup & cross-site isolation
  console.log('Test 18: visitService.getVisitById()');
  const visitDetail = await visitService.getVisitById(ctxSite1, 'VIS-1023-04');
  assert(visitDetail !== null, 'VIS-1023-04 should exist');
  assertStrictEqual(visitDetail?.visitCode, 'V4-D30');
  assertStrictEqual(visitDetail?.status, 'DUE');
  assert(Array.isArray(visitDetail?.activities), 'Activities should be an array');
  assertStrictEqual(visitDetail?.activities.length, 5, 'VIS-1023-04 should have 5 activities');

  const invalidVisit = await visitService.getVisitById(ctxSite1, 'NON-EXISTENT-VISIT');
  assertStrictEqual(invalidVisit, null, 'Non-existent visit should return null');

  // Cross-site lookup test
  const crossSiteVisit = await visitService.getVisitById(ctxSite1, 'VIS-2015-03');
  assertStrictEqual(crossSiteVisit, null, 'Cross-site visit lookup must return null');
  console.log('✓ Test 18 passed: Visit detail lookup and site isolation verified.');

  // Test 19: Visit summary metrics
  console.log('Test 19: visitService.getVisitSummary()');
  const visitSummary = await visitService.getVisitSummary(ctxSite1);
  assert(visitSummary.total >= 10, 'Total visits at SITE-001 should be >= 10');
  assert(visitSummary.due >= 1, 'Due visits should be >= 1');
  assert(visitSummary.upcoming >= 1, 'Upcoming visits should be >= 1');
  assert(visitSummary.completed >= 3, 'Completed visits should be >= 3');
  assertStrictEqual(
    visitSummary.due + visitSummary.upcoming + visitSummary.overdue + visitSummary.completed + visitSummary.missed,
    visitSummary.total,
    'Sum of visit statuses must equal total visits'
  );
  console.log('✓ Test 19 passed: Visit summary metrics verified.');

  // Test 20: Interactive procedure sign-off & status update
  console.log('Test 20: visitService.updateActivityStatus() checklist sign-off');
  const updatedVisit = await visitService.updateActivityStatus(
    ctxSite1,
    'VIS-1023-04',
    'ACT-V4-5', // Study Medication Reconciliation
    'COMPLETED'
  );
  assert(updatedVisit !== null, 'Updated visit should not be null');
  const updatedActivity = updatedVisit?.activities.find((a) => a.id === 'ACT-V4-5');
  assertStrictEqual(updatedActivity?.status, 'COMPLETED', 'Activity status must be COMPLETED');
  assertStrictEqual(updatedVisit?.completedActivities, 5, 'All 5 activities should now be completed');
  assertStrictEqual(updatedVisit?.requiredIncompleteActivities, 0, 'Zero required activities incomplete');
  assertStrictEqual(updatedVisit?.status, 'COMPLETED', 'Visit status must transition to COMPLETED when all required activities finish');
  console.log('✓ Test 20 passed: Interactive procedure sign-off verified.');

  // ==========================================
  // SEGMENT D: SAFETY & PHARMACOVIGILANCE TESTS
  // ==========================================

  // Test 21: Safety data consistency & structural validity
  console.log('Test 21: Safety data consistency and participant linkage');
  const safetyEventsSite1 = await safetyService.getSafetyEvents(ctxSite1);
  assert(Array.isArray(safetyEventsSite1), 'Safety events should be an array');
  assertStrictEqual(safetyEventsSite1.length, 6, 'SITE-001 should have exactly 6 synthetic safety events');

  for (const event of safetyEventsSite1) {
    assertStrictEqual(event.studyId, 'STUDY-001', `Event ${event.id} must belong to STUDY-001`);
    assertStrictEqual(event.siteId, 'SITE-001', `Event ${event.id} must belong to SITE-001`);

    // Verify participant linkage exists at this site
    const matchingParticipant = participantsSite1.find((p) => p.id === event.participantId);
    assert(Boolean(matchingParticipant), `Event ${event.id} references non-existent participant ${event.participantId}`);
    assertStrictEqual(event.participantCode, matchingParticipant!.participantCode);

    // Verify resolution date rules
    if (event.status === 'RESOLVED' || event.status === 'CLOSED') {
      if (!event.ongoing) {
        assert(event.resolutionDate !== null && event.resolutionDate !== undefined, `Resolved event ${event.id} must have resolutionDate`);
      }
    }
    if (event.ongoing) {
      assertStrictEqual(event.resolutionDate, null, `Ongoing event ${event.id} must have null resolutionDate`);
    }
  }
  console.log('✓ Test 21 passed: Safety data consistency and participant linkage verified.');

  // Test 22: Severity vs Seriousness decoupling
  console.log('Test 22: Severity vs Seriousness conceptual separation');
  const severeNonSerious = safetyEventsSite1.find((e) => e.severity === 'SEVERE' && e.seriousness === 'NONE');
  assert(Boolean(severeNonSerious), 'A SEVERE but Non-Serious event must exist (e.g. AE-005)');
  assertStrictEqual(severeNonSerious?.id, 'AE-005');
  assertStrictEqual(severeNonSerious?.eventType, 'AE');

  const moderateSerious = safetyEventsSite1.find((e) => e.severity === 'MODERATE' && e.seriousness !== 'NONE');
  assert(Boolean(moderateSerious), 'A MODERATE but Serious event must exist (e.g. SAE-003)');
  assertStrictEqual(moderateSerious?.id, 'SAE-003');
  assertStrictEqual(moderateSerious?.eventType, 'SAE');
  assertStrictEqual(moderateSerious?.seriousness, 'OTHER_MEDICALLY_IMPORTANT');
  console.log('✓ Test 22 passed: Severity vs Seriousness independence verified.');

  // Test 23: Study + Site Scoping for Safety Events
  console.log('Test 23: safetyService.getSafetyEvents() - Site Scoping');
  const safetyEventsSite2 = await safetyService.getSafetyEvents(ctxSite2);
  assertStrictEqual(safetyEventsSite2.length, 2, 'SITE-002 should have 2 safety events');
  assert(safetyEventsSite2.every((e) => e.siteId === 'SITE-002'), 'All events must belong to SITE-002');

  const ctxSite3 = { studyId: 'STUDY-002', siteId: 'SITE-003' };
  const safetyEventsSite3 = await safetyService.getSafetyEvents(ctxSite3);
  assertStrictEqual(safetyEventsSite3.length, 2, 'SITE-003 should have 2 safety events');
  assert(safetyEventsSite3.every((e) => e.studyId === 'STUDY-002' && e.siteId === 'SITE-003'), 'All events must belong to STUDY-002 and SITE-003');
  console.log('✓ Test 23 passed: Safety event site scoping verified.');

  // Test 24: Participant Safety History & Summary
  console.log('Test 24: safetyService.getParticipantSafetySummary()');
  const pt1023Safety = await safetyService.getParticipantSafetySummary(ctxSite1, 'PT-1023');
  assertStrictEqual(pt1023Safety.totalEvents, 2, 'PT-1023 should have 2 safety events');
  assertStrictEqual(pt1023Safety.aeCount, 1, 'PT-1023 should have 1 AE');
  assertStrictEqual(pt1023Safety.saeCount, 1, 'PT-1023 should have 1 SAE');
  assertStrictEqual(pt1023Safety.ongoingCount, 0, 'PT-1023 should have 0 ongoing events');
  assertStrictEqual(pt1023Safety.piReviewRequiredCount, 0, 'PT-1023 should have 0 pending review events');

  const pt1011Safety = await safetyService.getParticipantSafetySummary(ctxSite1, 'PT-1011');
  assertStrictEqual(pt1011Safety.totalEvents, 1, 'PT-1011 should have 1 safety event');
  assertStrictEqual(pt1011Safety.saeCount, 1, 'PT-1011 event should be SAE');
  assertStrictEqual(pt1011Safety.ongoingCount, 1, 'PT-1011 event should be ongoing');
  assertStrictEqual(pt1011Safety.piReviewRequiredCount, 1, 'PT-1011 requires PI review');
  console.log('✓ Test 24 passed: Participant safety summary verified.');

  // Test 25: Search filtering across multiple attributes
  console.log('Test 25: Safety event search filtering');
  const searchById = await safetyService.getSafetyEvents(ctxSite1, { search: 'sae-003' });
  assertStrictEqual(searchById.length, 1, 'Search by ID sae-003 should return 1 result');
  assertStrictEqual(searchById[0].id, 'SAE-003');

  const searchBySubject = await safetyService.getSafetyEvents(ctxSite1, { search: 'pt-1042' });
  assertStrictEqual(searchBySubject.length, 1, 'Search by subject PT-1042 should return 1 result');
  assertStrictEqual(searchBySubject[0].participantCode, 'PT-1042');

  const searchByTitle = await safetyService.getSafetyEvents(ctxSite1, { search: 'pyelonephritis' });
  assertStrictEqual(searchByTitle.length, 1, 'Search by title pyelonephritis should return 1 result');
  assertStrictEqual(searchByTitle[0].id, 'SAE-002');

  const searchByReporter = await safetyService.getSafetyEvents(ctxSite1, { search: 'Dr. Vikram Verma' });
  assertStrictEqual(searchByReporter.length, 2, 'Search by reporter Vikram Verma should return 2 results');
  console.log('✓ Test 25 passed: Search filters verified.');

  // Test 26: Combined multi-criteria filtering
  console.log('Test 26: Combined multi-criteria safety filters');
  const combinedSaeReview = await safetyService.getSafetyEvents(ctxSite1, {
    eventType: 'SAE',
    piReviewStatus: 'SIGN_OFF_REQUIRED',
    participantId: 'PT-1011',
  });
  assertStrictEqual(combinedSaeReview.length, 1, 'Combined filter should return exactly 1 event (SAE-003)');
  assertStrictEqual(combinedSaeReview[0].id, 'SAE-003');

  const emptyFilterMatch = await safetyService.getSafetyEvents(ctxSite1, {
    eventType: 'SAE',
    severity: 'MILD', // No mild SAEs exist
  });
  assertStrictEqual(emptyFilterMatch.length, 0, 'No mild SAEs should exist');
  console.log('✓ Test 26 passed: Combined multi-criteria filtering verified.');

  // Test 27: Safety Summary Metrics Calculation
  console.log('Test 27: safetyService.getSafetySummary()');
  const siteSafetySummary = await safetyService.getSafetySummary(ctxSite1);
  assertStrictEqual(siteSafetySummary.total, 6, 'Total safety events should be 6');
  assertStrictEqual(siteSafetySummary.ae, 4, 'Total AEs should be 4');
  assertStrictEqual(siteSafetySummary.sae, 2, 'Total SAEs should be 2');
  assertStrictEqual(siteSafetySummary.ongoing, 2, 'Ongoing events should be 2 (SAE-003, AE-005)');
  assertStrictEqual(siteSafetySummary.resolved, 4, 'Resolved events should be 4 (AE-001, SAE-002, AE-004, AE-006)');
  assertStrictEqual(siteSafetySummary.piReviewRequired, 1, 'PI review required should be 1 (SAE-003)');
  assertStrictEqual(siteSafetySummary.followUpDue, 1, 'Follow-up due should be 1 (AE-005)');
  assertStrictEqual(siteSafetySummary.overdueFollowUp, 1, 'Overdue follow-up should be 1 (SAE-003)');
  assertStrictEqual(siteSafetySummary.ae + siteSafetySummary.sae, siteSafetySummary.total, 'AE + SAE must equal total events');
  console.log('✓ Test 27 passed: Safety summary metrics verified.');

  // Test 28: Event Detail Lookup & Cross-Site Isolation
  console.log('Test 28: safetyService.getSafetyEventById()');
  const eventDetail = await safetyService.getSafetyEventById(ctxSite1, 'SAE-003');
  assert(eventDetail !== null, 'SAE-003 should exist');
  assertStrictEqual(eventDetail?.title, 'Transient Serum Transaminase Elevation (ALT 185 U/L, AST 162 U/L)');
  assertStrictEqual(eventDetail?.severity, 'MODERATE');
  assertStrictEqual(eventDetail?.seriousness, 'OTHER_MEDICALLY_IMPORTANT');
  assertStrictEqual(eventDetail?.causality, 'PROBABLE');
  assertStrictEqual(eventDetail?.actionTaken, 'TREATMENT_DISCONTINUED');

  const invalidEvent = await safetyService.getSafetyEventById(ctxSite1, 'NON-EXISTENT-EVENT');
  assertStrictEqual(invalidEvent, null, 'Non-existent event should return null');

  const crossSiteEvent = await safetyService.getSafetyEventById(ctxSite1, 'AE-201');
  assertStrictEqual(crossSiteEvent, null, 'Cross-site safety event lookup must return null');
  console.log('✓ Test 28 passed: Event detail lookup and site isolation verified.');

  // Test 29: PI Review Status Mutation
  console.log('Test 29: safetyService.updatePIReviewStatus()');
  const reviewedEvent = await safetyService.updatePIReviewStatus(
    ctxSite1,
    'SAE-003',
    'REVIEWED',
    'Dr. Ananya Sharma (PI)'
  );
  assert(reviewedEvent !== null, 'Updated event should not be null');
  assertStrictEqual(reviewedEvent?.piReviewStatus, 'REVIEWED', 'Review status must be REVIEWED');
  assertStrictEqual(reviewedEvent?.reviewedBy, 'Dr. Ananya Sharma (PI)');
  assert(Boolean(reviewedEvent?.reviewedAt), 'reviewedAt timestamp must be populated');

  // Verify that summary metrics reflect the review mutation
  const updatedSummary = await safetyService.getSafetySummary(ctxSite1);
  assertStrictEqual(updatedSummary.piReviewRequired, 0, 'PI review required must decrease to 0');
  console.log('✓ Test 29 passed: PI review mutation and summary recalculation verified.');

  // Test 30: Follow-up Status Mutation
  console.log('Test 30: safetyService.updateFollowUpStatus()');
  const updatedFollowUpEvent = await safetyService.updateFollowUpStatus(
    ctxSite1,
    'AE-005',
    'COMPLETED',
    'Rash fully cleared; no additional intervention required.'
  );
  assert(updatedFollowUpEvent !== null, 'Updated follow-up event should not be null');
  assertStrictEqual(updatedFollowUpEvent?.followUpStatus, 'COMPLETED');
  assertStrictEqual(updatedFollowUpEvent?.followUpNotes, 'Rash fully cleared; no additional intervention required.');

  const postFollowUpSummary = await safetyService.getSafetySummary(ctxSite1);
  assertStrictEqual(postFollowUpSummary.followUpDue, 0, 'Follow-up due must decrease to 0');
  console.log('✓ Test 30 passed: Follow-up status mutation and summary recalculation verified.');

  // ==========================================
  // SEGMENT E: PROTOCOL COMPLIANCE & DEVIATIONS TESTS
  // ==========================================

  // Test 31: Deviation data consistency and relationship verification
  console.log('Test 31: Deviation data consistency');
  const allDevsSite1 = await complianceService.getDeviations(ctxSite1);
  assertStrictEqual(allDevsSite1.length, 6, 'SITE-001 must have exactly 6 protocol deviations');
  for (const dev of allDevsSite1) {
    assert(dev.id.startsWith('DEV-'), `Deviation ID must start with DEV-, got ${dev.id}`);
    assertStrictEqual(dev.studyId, 'STUDY-001', 'StudyId must be STUDY-001');
    assertStrictEqual(dev.siteId, 'SITE-001', 'SiteId must be SITE-001');
    assert(dev.occurrenceDate.length === 10, 'Occurrence date must be ISO YYYY-MM-DD');
    assert(dev.detectionDate.length === 10, 'Detection date must be ISO YYYY-MM-DD');
    assert(dev.title.length > 0, 'Deviation must have a title');
    assert(dev.description.length > 0, 'Deviation must have a description');
    if (dev.scope === 'PARTICIPANT') {
      assert(Boolean(dev.participantId), 'Participant-scoped deviation must have participantId');
    } else {
      assertStrictEqual(dev.participantId, undefined, 'Site/Study-scoped deviation must not have participantId');
    }
  }
  console.log('✓ Test 31 passed: Deviation data consistency and relationship verification verified.');

  // Test 32: Participant/site/study scope verification and isolation
  console.log('Test 32: Participant/site/study scope isolation');
  const participantScoped = await complianceService.getDeviations(ctxSite1, { scope: 'PARTICIPANT' });
  const siteScoped = await complianceService.getDeviations(ctxSite1, { scope: 'SITE' });
  const studyScoped = await complianceService.getDeviations(ctxSite1, { scope: 'STUDY' });
  assertStrictEqual(participantScoped.length, 4, 'Participant-scoped count must be 4');
  assertStrictEqual(siteScoped.length, 1, 'Site-scoped count must be 1 (DEV-002)');
  assertStrictEqual(studyScoped.length, 1, 'Study-scoped count must be 1 (DEV-004)');
  assertStrictEqual(participantScoped.length + siteScoped.length + studyScoped.length, 6, 'All scopes must sum to 6');
  console.log('✓ Test 32 passed: Scope isolation verified.');

  // Test 33: Search by deviation ID
  console.log('Test 33: Search by deviation ID');
  const searchDevById = await complianceService.getDeviations(ctxSite1, { search: 'DEV-003' });
  assertStrictEqual(searchDevById.length, 1, 'Search for DEV-003 should return exactly 1 result');
  assertStrictEqual(searchDevById[0].id, 'DEV-003');
  console.log('✓ Test 33 passed: Search by deviation ID verified.');

  // Test 34: Search by participant
  console.log('Test 34: Search by participant');
  const searchByParticipant = await complianceService.getDeviations(ctxSite1, { search: 'PT-1023' });
  assertStrictEqual(searchByParticipant.length, 1, 'Search for PT-1023 should return DEV-003');
  assertStrictEqual(searchByParticipant[0].id, 'DEV-003');
  const searchByParticipant2 = await complianceService.getDeviations(ctxSite1, { search: 'PT-1011' });
  assertStrictEqual(searchByParticipant2.length, 1, 'Search for PT-1011 should return DEV-001');
  assertStrictEqual(searchByParticipant2[0].id, 'DEV-001');
  console.log('✓ Test 34 passed: Search by participant verified.');

  // Test 35: Combined filters use AND semantics
  console.log('Test 35: Combined filters use AND semantics');
  const combinedMajorAction = await complianceService.getDeviations(ctxSite1, {
    classification: 'MAJOR',
    status: 'ACTION_REQUIRED',
  });
  assertStrictEqual(combinedMajorAction.length, 1, 'Combined filter should return exactly 1 deviation (DEV-001)');
  assertStrictEqual(combinedMajorAction[0].id, 'DEV-001');

  const combinedCriticalClosed = await complianceService.getDeviations(ctxSite1, {
    classification: 'CRITICAL',
    status: 'CLOSED',
  });
  assertStrictEqual(combinedCriticalClosed.length, 0, 'No critical closed deviations should exist at SITE-001');
  console.log('✓ Test 35 passed: Combined multi-criteria AND filtering verified.');

  // Test 36: Classification filtering
  console.log('Test 36: Classification filtering');
  const criticalDevs = await complianceService.getDeviations(ctxSite1, { classification: 'CRITICAL' });
  const majorDevs = await complianceService.getDeviations(ctxSite1, { classification: 'MAJOR' });
  const minorDevs = await complianceService.getDeviations(ctxSite1, { classification: 'MINOR' });
  assertStrictEqual(criticalDevs.length, 1, 'Critical deviations should be 1 (DEV-003)');
  assertStrictEqual(majorDevs.length, 2, 'Major deviations should be 2 (DEV-001, DEV-006)');
  assertStrictEqual(minorDevs.length, 3, 'Minor deviations should be 3 (DEV-002, DEV-004, DEV-005)');
  assertStrictEqual(criticalDevs.length + majorDevs.length + minorDevs.length, 6, 'Classification sum must equal total');
  console.log('✓ Test 36 passed: Classification filtering verified.');

  // Test 37: Status filtering
  console.log('Test 37: Status filtering');
  const resolvedDevs = await complianceService.getDeviations(ctxSite1, { status: 'RESOLVED' });
  const closedDevs = await complianceService.getDeviations(ctxSite1, { status: 'CLOSED' });
  const actionRequiredDevs = await complianceService.getDeviations(ctxSite1, { status: 'ACTION_REQUIRED' });
  const capaInProgressDevs = await complianceService.getDeviations(ctxSite1, { status: 'CAPA_IN_PROGRESS' });
  const underReviewDevs = await complianceService.getDeviations(ctxSite1, { status: 'UNDER_REVIEW' });
  assertStrictEqual(resolvedDevs.length, 2, 'Resolved deviations should be 2 (DEV-002, DEV-005)');
  assertStrictEqual(closedDevs.length, 1, 'Closed deviations should be 1 (DEV-004)');
  assertStrictEqual(actionRequiredDevs.length, 1, 'Action required deviations should be 1 (DEV-001)');
  assertStrictEqual(capaInProgressDevs.length, 1, 'CAPA in progress deviations should be 1 (DEV-003)');
  assertStrictEqual(underReviewDevs.length, 1, 'Under review deviations should be 1 (DEV-006)');

  // Test OPEN filter shortcut
  const openDevs = await complianceService.getDeviations(ctxSite1, { status: 'OPEN' });
  assertStrictEqual(openDevs.length, 3, 'Open deviations should be 3 (DEV-001, DEV-003, DEV-006)');
  assert(openDevs.every((d) => d.status !== 'RESOLVED' && d.status !== 'CLOSED'), 'Open filter must exclude RESOLVED and CLOSED');
  console.log('✓ Test 37 passed: Status filtering and OPEN shortcut verified.');

  // Test 38: CAPA filtering
  console.log('Test 38: CAPA filtering');
  const capaOverdue = await complianceService.getDeviations(ctxSite1, { capaStatus: 'OVERDUE' });
  const capaActive = await complianceService.getDeviations(ctxSite1, { capaStatus: 'IN_PROGRESS' });
  const capaPending = await complianceService.getDeviations(ctxSite1, { capaStatus: 'PENDING' });
  const capaComplete = await complianceService.getDeviations(ctxSite1, { capaStatus: 'COMPLETED' });
  const capaNotReq = await complianceService.getDeviations(ctxSite1, { capaStatus: 'NOT_REQUIRED' });
  assertStrictEqual(capaOverdue.length, 1, 'Overdue CAPA should be 1 (DEV-001)');
  assertStrictEqual(capaActive.length, 1, 'Active CAPA should be 1 (DEV-003)');
  assertStrictEqual(capaPending.length, 1, 'Pending CAPA should be 1 (DEV-006)');
  assertStrictEqual(capaComplete.length, 1, 'Completed CAPA should be 1 (DEV-005)');
  assertStrictEqual(capaNotReq.length, 2, 'Not required CAPA should be 2 (DEV-002, DEV-004)');

  // Test PENDING_OR_ACTIVE composite filter
  const capaPendingOrActive = await complianceService.getDeviations(ctxSite1, { capaStatus: 'PENDING_OR_ACTIVE' });
  assertStrictEqual(capaPendingOrActive.length, 2, 'Pending or active CAPA should be 2 (DEV-003, DEV-006)');
  console.log('✓ Test 38 passed: CAPA status filtering and PENDING_OR_ACTIVE shortcut verified.');

  // Test 39: PI review filtering
  console.log('Test 39: PI review filtering');
  const signOffReq = await complianceService.getDeviations(ctxSite1, { reviewStatus: 'SIGN_OFF_REQUIRED' });
  const pendingReview = await complianceService.getDeviations(ctxSite1, { reviewStatus: 'NOT_REVIEWED' });
  const underReview = await complianceService.getDeviations(ctxSite1, { reviewStatus: 'UNDER_REVIEW' });
  const reviewed = await complianceService.getDeviations(ctxSite1, { reviewStatus: 'REVIEWED' });
  assertStrictEqual(signOffReq.length, 1, 'Sign-off required should be 1 (DEV-001)');
  assertStrictEqual(pendingReview.length, 1, 'Pending review should be 1 (DEV-006)');
  assertStrictEqual(underReview.length, 1, 'Under review should be 1 (DEV-003)');
  assertStrictEqual(reviewed.length, 3, 'Reviewed should be 3 (DEV-002, DEV-004, DEV-005)');

  // Test REVIEW_REQUIRED composite filter
  const reviewRequiredDevs = await complianceService.getDeviations(ctxSite1, { reviewStatus: 'REVIEW_REQUIRED' });
  assertStrictEqual(reviewRequiredDevs.length, 2, 'Review required should be 2 (DEV-001, DEV-006)');

  // Test Date Range filter
  const last30Devs = await complianceService.getDeviations(ctxSite1, { dateRange: 'LAST_30_DAYS' });
  assert(Array.isArray(last30Devs), 'Date range query must return array');
  const allDatesDevs = await complianceService.getDeviations(ctxSite1, { dateRange: 'ALL' });
  assertStrictEqual(allDatesDevs.length, 6, 'ALL date range should return all 6 deviations');
  console.log('✓ Test 39 passed: PI review and date range filtering verified.');

  // Test 40: Compliance summary calculation metrics
  console.log('Test 40: Compliance summary calculations');
  const siteComplianceSummary = await complianceService.getComplianceSummary(ctxSite1);
  assertStrictEqual(siteComplianceSummary.total, 6, 'Total deviations must be 6');
  assertStrictEqual(siteComplianceSummary.open, 3, 'Open deviations must be 3 (DEV-001, DEV-003, DEV-006)');
  assertStrictEqual(siteComplianceSummary.critical, 1, 'Critical deviations must be 1 (DEV-003)');
  assertStrictEqual(siteComplianceSummary.major, 2, 'Major deviations must be 2 (DEV-001, DEV-006)');
  assertStrictEqual(siteComplianceSummary.minor, 3, 'Minor deviations must be 3 (DEV-002, DEV-004, DEV-005)');
  assertStrictEqual(siteComplianceSummary.piReviewRequired, 2, 'PI review required must be 2 (DEV-001, DEV-006)');
  assertStrictEqual(siteComplianceSummary.capaPending, 2, 'CAPA pending must be 2 (DEV-003, DEV-006)');
  assertStrictEqual(siteComplianceSummary.capaOverdue, 1, 'CAPA overdue must be 1 (DEV-001)');
  assertStrictEqual(siteComplianceSummary.resolvedOrClosed, 3, 'Resolved or closed must be 3 (DEV-002, DEV-004, DEV-005)');
  assertStrictEqual(siteComplianceSummary.open + siteComplianceSummary.resolvedOrClosed, siteComplianceSummary.total, 'Open + Resolved/Closed must equal Total');
  console.log('✓ Test 40 passed: Compliance summary calculations verified.');

  // Test 41: Detail lookup
  console.log('Test 41: Detail lookup');
  const devDetail = await complianceService.getDeviationById(ctxSite1, 'DEV-003');
  assert(devDetail !== null, 'DEV-003 should exist');
  assertStrictEqual(devDetail?.classification, 'CRITICAL');
  assertStrictEqual(devDetail?.category, 'PROCEDURE');
  assertStrictEqual(devDetail?.scope, 'PARTICIPANT');
  assertStrictEqual(devDetail?.participantId, 'PT-1023');
  assertStrictEqual(devDetail?.visitId, 'VIS-1023-04');
  console.log('✓ Test 41 passed: Detail lookup verified.');

  // Test 42: Cross-site detail isolation
  console.log('Test 42: Cross-site detail isolation');
  const crossSiteLookup = await complianceService.getDeviationById(ctxSite1, 'DEV-201');
  assertStrictEqual(crossSiteLookup, null, 'DEV-201 belongs to SITE-002 and must not be retrievable from SITE-001');
  const validSite2Lookup = await complianceService.getDeviationById(ctxSite2, 'DEV-201');
  assert(validSite2Lookup !== null, 'DEV-201 must be retrievable from SITE-002');
  console.log('✓ Test 42 passed: Cross-site detail isolation verified.');

  // Test 43: Participant deviation history
  console.log('Test 43: Participant deviation history');
  const pt1011Devs = await complianceService.getParticipantDeviations(ctxSite1, 'PT-1011');
  assertStrictEqual(pt1011Devs.length, 1, 'PT-1011 should have 1 deviation');
  assertStrictEqual(pt1011Devs[0].id, 'DEV-001');

  const pt1023Devs = await complianceService.getParticipantDeviations(ctxSite1, 'PT-1023');
  assertStrictEqual(pt1023Devs.length, 1, 'PT-1023 should have 1 deviation');
  assertStrictEqual(pt1023Devs[0].id, 'DEV-003');

  const ptCleanDevs = await complianceService.getParticipantDeviations(ctxSite1, 'PT-1102');
  assertStrictEqual(ptCleanDevs.length, 0, 'PT-1102 should have 0 deviations');
  console.log('✓ Test 43 passed: Participant deviation history verified.');

  // Test 44: Visit-linked deviation lookup
  console.log('Test 44: Visit-linked deviation lookup');
  const visit1023Devs = await complianceService.getVisitDeviations(ctxSite1, 'VIS-1023-04');
  assertStrictEqual(visit1023Devs.length, 1, 'VIS-1023-04 should have 1 deviation linked');
  assertStrictEqual(visit1023Devs[0].id, 'DEV-003');

  const visitCleanDevs = await complianceService.getVisitDeviations(ctxSite1, 'VIS-1023-01');
  assertStrictEqual(visitCleanDevs.length, 0, 'VIS-1023-01 should have 0 deviations linked');
  console.log('✓ Test 44 passed: Visit-linked deviation lookup verified.');

  // Test 45: CAPA overdue logic & status consistency
  console.log('Test 45: CAPA overdue logic & status consistency');
  const overdueDev = await complianceService.getDeviationById(ctxSite1, 'DEV-001');
  assertStrictEqual(overdueDev?.capaRequired, true, 'DEV-001 must require CAPA');
  assertStrictEqual(overdueDev?.capaStatus, 'OVERDUE', 'DEV-001 CAPA status must be OVERDUE');
  const notReqDev = await complianceService.getDeviationById(ctxSite1, 'DEV-002');
  assertStrictEqual(notReqDev?.capaRequired, false, 'DEV-002 must not require CAPA');
  assertStrictEqual(notReqDev?.capaStatus, 'NOT_REQUIRED', 'DEV-002 CAPA status must be NOT_REQUIRED');
  console.log('✓ Test 45 passed: CAPA overdue logic & consistency verified.');

  // Test 46: PI review mutation and summary recalculation
  console.log('Test 46: PI review mutation and summary recalculation');
  const signOffResult = await complianceService.updateReviewStatus(
    ctxSite1,
    'DEV-001',
    'REVIEWED',
    'Dr. Ananya Sharma (PI)'
  );
  assert(signOffResult !== null, 'Sign off result should not be null');
  assertStrictEqual(signOffResult?.reviewStatus, 'REVIEWED');
  assertStrictEqual(signOffResult?.reviewedBy, 'Dr. Ananya Sharma (PI)');
  assert(Boolean(signOffResult?.reviewedAt), 'reviewedAt timestamp must be recorded');

  const postReviewSummary = await complianceService.getComplianceSummary(ctxSite1);
  assertStrictEqual(postReviewSummary.piReviewRequired, 1, 'PI review required must decrease from 2 to 1');
  console.log('✓ Test 46 passed: PI review mutation and summary recalculation verified.');

  // Test 47: CAPA status mutation and summary recalculation
  console.log('Test 47: CAPA status mutation and summary recalculation');
  const capaUpdateResult = await complianceService.updateCapaStatus(
    ctxSite1,
    'DEV-006',
    'IN_PROGRESS',
    'Old paper forms destroyed.'
  );
  assert(capaUpdateResult !== null, 'CAPA update result should not be null');
  assertStrictEqual(capaUpdateResult?.capaStatus, 'IN_PROGRESS');
  assertStrictEqual(capaUpdateResult?.capaActionSummary, 'Old paper forms destroyed.');

  const capaCompleteResult = await complianceService.updateCapaStatus(
    ctxSite1,
    'DEV-003',
    'COMPLETED',
    'Two-person sign-off checklist verified.'
  );
  assert(capaCompleteResult !== null, 'CAPA completion result should not be null');
  assertStrictEqual(capaCompleteResult?.capaStatus, 'COMPLETED');
  assertStrictEqual(capaCompleteResult?.status, 'RESOLVED', 'Deviation should transition to RESOLVED when CAPA completed');

  const postCapaSummary = await complianceService.getComplianceSummary(ctxSite1);
  assertStrictEqual(postCapaSummary.open, 2, 'Open deviations should decrease to 2 (DEV-001, DEV-006)');
  console.log('✓ Test 47 passed: CAPA mutation and summary recalculation verified.');

  // Test 48: Lifecycle transition behavior & validation
  console.log('Test 48: Lifecycle transition behavior & validation');
  assertStrictEqual(complianceService.isValidStatusTransition('REPORTED', 'UNDER_REVIEW'), true);
  assertStrictEqual(complianceService.isValidStatusTransition('REPORTED', 'CLOSED'), false);
  assertStrictEqual(complianceService.isValidStatusTransition('RESOLVED', 'CLOSED'), true);
  assertStrictEqual(complianceService.isValidStatusTransition('CAPA_IN_PROGRESS', 'CLOSED'), false);

  // Illegal transition attempt must be rejected
  let transitionErrorThrown = false;
  try {
    await complianceService.updateDeviationStatus(ctxSite1, 'DEV-001', 'CLOSED');
  } catch (err) {
    transitionErrorThrown = true;
    assert((err as Error).message.includes('Invalid deviation status transition'), 'Error message must specify invalid transition');
  }
  assertStrictEqual(transitionErrorThrown, true, 'Illegal transition from ACTION_REQUIRED to CLOSED must throw error');

  // Valid transition from RESOLVED to CLOSED
  const closedResult = await complianceService.updateDeviationStatus(ctxSite1, 'DEV-003', 'CLOSED');
  assert(closedResult !== null, 'Closed result should not be null');
  assertStrictEqual(closedResult?.status, 'CLOSED');
  assert(Boolean(closedResult?.closedAt), 'closedAt timestamp must be recorded');
  console.log('✓ Test 48 passed: Lifecycle transition behavior & validation verified.');

  // Test 49: Attention-state calculation
  console.log('Test 49: Attention-state calculation');
  const sampleDev = await complianceService.getDeviationById(ctxSite1, 'DEV-001');
  assert(sampleDev !== null, 'DEV-001 should exist');
  assertStrictEqual(
    complianceService.isAttentionRequired({ ...sampleDev!, classification: 'CRITICAL' }),
    true,
    'Critical deviation must require attention'
  );
  assertStrictEqual(
    complianceService.isAttentionRequired({ ...sampleDev!, classification: 'MINOR', status: 'ACTION_REQUIRED' }),
    true,
    'Action-required deviation must require attention'
  );
  assertStrictEqual(
    complianceService.isAttentionRequired({ ...sampleDev!, classification: 'MINOR', status: 'RESOLVED', reviewStatus: 'REVIEWED', capaStatus: 'NOT_REQUIRED' }),
    false,
    'Resolved minor deviation without actions must not require attention'
  );
  console.log('✓ Test 49 passed: Attention-state calculation verified.');

  // Test 50: Existing Segment A–D regression check
  console.log('Test 50: Existing Segments A-D regression check');
  const regStudies = await studyService.getStudies();
  assert(regStudies.length > 0, 'Studies must be present');
  const regParticipants = await participantService.getParticipants(ctxSite1);
  assertStrictEqual(regParticipants.length, 10, 'SITE-001 must still have 10 participants');
  const regVisits = await visitService.getVisits(ctxSite1);
  assert(regVisits.length > 0, 'Visits must still be present');
  const regSafety = await safetyService.getSafetyEvents(ctxSite1);
  assert(regSafety.length > 0, 'Safety events must still be present');
  const regOverview = await dashboardService.getOverview('STUDY-001', 'SITE-001');
  assert(regOverview !== null, 'Overview must still be present');
  console.log('✓ Test 50 passed: Segments A-D regression check verified.');

  console.log('\n--- ALL SERVICE & DATA TESTS PASSED SUCCESSFULLY (50/50) ---');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  throw err;
});

```

---

## FILE: src/components/dashboard/SafetyAndComplianceCards.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { SafetySummary, ComplianceSummary, ComplianceSummaryMetrics } from '../../types';
import { useStudy } from '../../context/StudyContext';
import { complianceService } from '../../services/complianceService';
import { AlertTriangle, ArrowRight, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SafetyAndComplianceProps {
  safety: SafetySummary;
  compliance: ComplianceSummary;
}

export const SafetyAndComplianceCards: React.FC<SafetyAndComplianceProps> = ({
  safety,
  compliance,
}) => {
  const { activeStudyId, activeSiteId } = useStudy();
  const [liveCompliance, setLiveCompliance] = useState<ComplianceSummaryMetrics | null>(null);

  useEffect(() => {
    if (activeStudyId && activeSiteId) {
      complianceService
        .getComplianceSummary({ studyId: activeStudyId, siteId: activeSiteId })
        .then(setLiveCompliance)
        .catch(() => {});
    }
  }, [activeStudyId, activeSiteId]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Section 6: Safety Summary */}
      <Card className="flex flex-col justify-between">
        <div>
          <CardHeader
            title="Trial Safety Vigilance"
            subtitle="Adverse events and safety reports requiring investigator oversight"
            action={
              safety.seriousAdverseEvents > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 bg-red-50 text-semantic-danger border border-red-200 rounded-sm">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {safety.seriousAdverseEvents} SAE Logged
                </span>
              ) : null
            }
          />
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-surface-soft border border-border rounded-sm text-center">
                <span className="text-[11px] font-semibold text-ink-muted uppercase block">Total AEs</span>
                <span className="text-xl font-bold font-heading text-ink">{safety.adverseEvents}</span>
                <span className="text-[10px] text-ink-muted block">Non-serious</span>
              </div>

              <div className="p-3 bg-red-50/70 border border-red-200 rounded-sm text-center">
                <span className="text-[11px] font-semibold text-semantic-danger uppercase block">SAE Events</span>
                <span className="text-xl font-bold font-heading text-semantic-danger">
                  {safety.seriousAdverseEvents}
                </span>
                <span className="text-[10px] text-semantic-danger font-medium block">Expedited</span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-sm text-center">
                <span className="text-[11px] font-semibold text-accent-dark uppercase block">Pending Sign-off</span>
                <span className="text-xl font-bold font-heading text-accent-dark">{safety.pendingReview}</span>
                <span className="text-[10px] text-accent-dark font-medium block">Requires PI</span>
              </div>

              <div className="p-3 bg-surface-soft border border-border rounded-sm text-center">
                <span className="text-[11px] font-semibold text-ink-muted uppercase block">Follow-up Req.</span>
                <span className="text-xl font-bold font-heading text-ink">{safety.followUpRequired}</span>
                <span className="text-[10px] text-ink-muted block">In progress</span>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="p-3 border-t border-border bg-surface-soft flex items-center justify-between text-xs">
          <span className="text-ink-secondary">ICH-GCP E6(R2) expedited reporting</span>
          <Link
            to="/pi/safety"
            className="text-primary font-semibold hover:underline inline-flex items-center gap-1 group"
          >
            <span>Open Safety Log</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Card>

      {/* Section 7: Protocol Compliance Summary */}
      <Card className="flex flex-col justify-between">
        <div>
          <CardHeader
            title="Protocol Compliance & Deviations"
            subtitle="Adherence tracking, deviations and corrective action plans (CAPA)"
            action={
              (liveCompliance ? liveCompliance.critical : compliance.criticalDeviations) === 0 ? (
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-secondary border border-emerald-200 rounded-sm">
                  0 Critical
                </span>
              ) : (
                <span className="text-xs font-bold px-2 py-0.5 bg-red-50 text-semantic-danger border border-red-200 rounded-sm flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" />
                  {liveCompliance ? liveCompliance.critical : compliance.criticalDeviations} Critical
                </span>
              )
            }
          />
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-surface-soft border border-border rounded-sm text-center">
                <span className="text-[11px] font-semibold text-ink-muted uppercase block">Open Deviations</span>
                <span className="text-xl font-bold font-heading text-ink">
                  {liveCompliance ? liveCompliance.open : compliance.openDeviations}
                </span>
                <span className="text-[10px] text-ink-muted block">Minor / Major</span>
              </div>

              <div className="p-3 bg-surface-soft border border-border rounded-sm text-center">
                <span className="text-[11px] font-semibold text-ink-muted uppercase block">Critical Deviations</span>
                <span className="text-xl font-bold font-heading text-semantic-danger">
                  {liveCompliance ? liveCompliance.critical : compliance.criticalDeviations}
                </span>
                <span className="text-[10px] text-secondary font-medium block">Zero Tolerance</span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-sm text-center">
                <span className="text-[11px] font-semibold text-accent-dark uppercase block">Pending CAPA</span>
                <span className="text-xl font-bold font-heading text-accent-dark">
                  {liveCompliance ? liveCompliance.capaPending : compliance.pendingCorrectiveActions}
                </span>
                <span className="text-[10px] text-accent-dark font-medium block">
                  {liveCompliance && liveCompliance.capaOverdue > 0
                    ? `${liveCompliance.capaOverdue} Overdue (!)`
                    : 'Action required'}
                </span>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="p-3 border-t border-border bg-surface-soft flex items-center justify-between text-xs">
          <span className="text-ink-secondary">
            Last site audit: <strong>{compliance.lastAuditDate}</strong>
          </span>
          <Link
            to="/pi/compliance"
            className="text-primary font-semibold hover:underline inline-flex items-center gap-1 group"
          >
            <span>Review Compliance</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Card>
    </div>
  );
};

```

---

## FILE: src/components/dashboard/StudyContextHeader.tsx

```typescript
import React from 'react';
import { CurrentStudyContext } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { Building2, FileText, UserCheck, ShieldCheck } from 'lucide-react';

interface StudyContextHeaderProps {
  context: CurrentStudyContext;
}

export const StudyContextHeader: React.FC<StudyContextHeaderProps> = ({ context }) => {
  return (
    <div className="bg-surface border border-border rounded-sm p-4 sm:p-5 shadow-subtle mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Study Details */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-rose-50 text-primary-dark border border-rose-200 rounded-sm">
              {context.studyCode}
            </span>
            <StatusBadge label={context.studyStatus} variant="success" size="sm" />
            <span className="text-xs text-ink-muted border-l border-border pl-2 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-accent" />
              Protocol {context.protocolVersion}
            </span>
            <span className="text-xs text-ink-muted border-l border-border pl-2 flex items-center gap-1 hidden sm:flex">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              GCP Active
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-ink font-heading leading-snug">
            {context.studyTitle}
          </h2>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-secondary">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              <span>
                <strong>Site:</strong> {context.siteName} ({context.siteCode})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              <span>
                <strong>PI:</strong> {context.piName}
              </span>
            </div>
          </div>
        </div>

        {/* Action / Context summary badge */}
        <div className="flex sm:items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
          <div className="bg-surface-soft border border-border rounded-sm px-3.5 py-2 text-right">
            <span className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Site Jurisdiction
            </span>
            <span className="text-xs font-bold text-ink">Assigned Site Scope</span>
          </div>
        </div>
      </div>
    </div>
  );
};

```

---

## FILE: src/context/StudyContext.tsx

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Study, Site } from '../types';
import { studyService } from '../services/studyService';

interface StudyContextValue {
  studies: Study[];
  activeStudy: Study | null;
  activeSite: Site | null;
  activeStudyId: string;
  activeSiteId: string;
  isLoading: boolean;
  error: string | null;
  selectStudy: (studyId: string) => void;
  selectSite: (siteId: string) => void;
  refreshStudies: () => Promise<void>;
}

const StudyContext = createContext<StudyContextValue | undefined>(undefined);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [activeStudyId, setActiveStudyId] = useState<string>('');
  const [activeSiteId, setActiveSiteId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await studyService.getStudies();
      setStudies(data);
      if (data.length > 0) {
        // Default to first study and its first site if none selected or invalid
        const initialStudy = data[0];
        setActiveStudyId(initialStudy.id);
        if (initialStudy.sites.length > 0) {
          setActiveSiteId(initialStudy.sites[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load studies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  const selectStudy = useCallback(
    (studyId: string) => {
      setActiveStudyId(studyId);
      const study = studies.find((s) => s.id === studyId);
      if (study && study.sites.length > 0) {
        setActiveSiteId(study.sites[0].id);
      } else {
        setActiveSiteId('');
      }
    },
    [studies]
  );

  const selectSite = useCallback((siteId: string) => {
    setActiveSiteId(siteId);
  }, []);

  const activeStudy = studies.find((s) => s.id === activeStudyId) || null;
  const activeSite = activeStudy?.sites.find((s) => s.id === activeSiteId) || null;

  const value: StudyContextValue = {
    studies,
    activeStudy,
    activeSite,
    activeStudyId,
    activeSiteId,
    isLoading,
    error,
    selectStudy,
    selectSite,
    refreshStudies: fetchStudies,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
};

export const useStudy = (): StudyContextValue => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};

```

---

## FILE: src/pages/ParticipantDetailPage.tsx

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { participantService } from '../services/participantService';
import { visitService } from '../services/visitService';
import { safetyService } from '../services/safetyService';
import { complianceService } from '../services/complianceService';
import { Participant, ParticipantVisit, ParticipantSafetySummary, ParticipantComplianceSummary } from '../types';
import { ParticipantStatusBadge } from '../components/participants/ParticipantStatusBadge';
import { VisitStatusBadge } from '../components/visits/VisitStatusBadge';
import { SafetyEventTypeBadge } from '../components/safety/SafetyEventTypeBadge';
import { SafetySeverityBadge } from '../components/safety/SafetySeverityBadge';
import { SafetyReviewBadge } from '../components/safety/SafetyReviewBadge';
import { DeviationClassificationBadge } from '../components/compliance/DeviationClassificationBadge';
import { DeviationStatusBadge } from '../components/compliance/DeviationStatusBadge';
import { DeviationCapaBadge } from '../components/compliance/DeviationCapaBadge';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';

export const ParticipantDetailPage: React.FC = () => {
  const { participantId } = useParams<{ participantId: string }>();
  const { activeStudy, activeSite, activeStudyId, activeSiteId, isLoading: isStudyLoading } = useStudy();

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participantVisits, setParticipantVisits] = useState<ParticipantVisit[]>([]);
  const [safetySummary, setSafetySummary] = useState<ParticipantSafetySummary | null>(null);
  const [complianceSummary, setComplianceSummary] = useState<ParticipantComplianceSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadParticipant = useCallback(async () => {
    if (!activeStudyId || !activeSiteId || !participantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [data, visitsData, safetyData, complianceData] = await Promise.all([
        participantService.getParticipant(context, participantId),
        visitService.getParticipantVisits(context, participantId),
        safetyService.getParticipantSafetySummary(context, participantId),
        complianceService.getParticipantComplianceSummary(context, participantId),
      ]);
      setParticipant(data);
      setParticipantVisits(visitsData);
      setSafetySummary(safetyData);
      setComplianceSummary(complianceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve participant detail.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, participantId]);

  useEffect(() => {
    loadParticipant();
  }, [loadParticipant]);

  if (isStudyLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="bg-surface p-6 border border-border rounded-sm space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface p-6 border border-border rounded-sm h-48" />
          <div className="bg-surface p-6 border border-border rounded-sm h-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorState
          title="Error Loading Participant Detail"
          message={error}
          onRetry={loadParticipant}
        />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="py-8">
        <EmptyState
          title="Participant Not Found"
          description={`No participant record was found matching ID "${participantId}" under the currently selected study (${activeStudy?.code}) and site (${activeSite?.name}).`}
          actionLabel="Return to Participants Directory"
          onAction={() => {}}
          icon={<AlertCircle className="w-6 h-6 text-semantic-danger" />}
        />
        <div className="mt-4 text-center">
          <Link to="/pi/patients">
            <Button variant="primary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/pi/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Participants Directory</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="font-mono">{activeStudy?.code}</span>
          <span>&bull;</span>
          <span>{activeSite?.siteCode}</span>
        </div>
      </div>

      {/* Participant Header Profile Card */}
      <div className="bg-surface border border-border rounded-sm p-5 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-bold px-2 py-0.5 bg-rose-50 text-primary-dark border border-rose-200 rounded-sm">
                {participant.participantCode}
              </span>
              <ParticipantStatusBadge status={participant.status} size="md" />
              <span className="text-xs text-ink-secondary border-l border-border pl-2 font-medium">
                Initials: <strong>{participant.initials}</strong>
              </span>
              <span className="text-xs text-ink-secondary border-l border-border pl-2">
                {participant.age} Years &bull; {participant.sex === 'M' ? 'Male' : participant.sex === 'F' ? 'Female' : participant.sex}
              </span>
            </div>

            <h2 className="text-xl font-bold font-heading text-ink">
              Subject Overview — {participant.participantCode}
            </h2>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Screening ID: <strong>{participant.screeningCode}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                Site: <strong>{activeSite?.name}</strong>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Coordinator: <strong>{participant.assignedCoordinatorName}</strong>
              </span>
            </div>
          </div>

          <div className="flex sm:items-center gap-2 shrink-0">
            <span className="text-xs bg-surface-soft border border-border px-3 py-1.5 rounded-sm text-ink-secondary font-medium">
              Protocol Phase: <strong>{participant.phase}</strong>
            </span>
          </div>
        </div>

        {/* Attention Banner if flagged */}
        {participant.attentionRequired && participant.attentionReason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-semantic-danger flex items-start gap-2 leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Operational Oversight Alert:</strong>
              <span>{participant.attentionReason}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Identity & Enrollment vs Operational Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity & Enrollment Card */}
        <Card>
          <CardHeader
            title="Screening & Enrollment Information"
            subtitle="Protocol milestones and eligibility verification"
          />
          <CardContent className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3 py-1">
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">Screening Date</span>
                <span className="font-medium text-ink">{participant.screeningDate}</span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">Enrollment Date</span>
                <span className="font-medium text-ink">
                  {participant.enrollmentDate ? participant.enrollmentDate : 'Not Enrolled (In Screening/Pre-screen)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-1 border-t border-border">
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">Current Protocol Phase</span>
                <span className="font-medium text-ink">{participant.phase}</span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">Record Created</span>
                <span className="font-medium text-ink">
                  {new Date(participant.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <span className="text-[11px] text-ink-muted uppercase font-semibold block">Informed Consent Status</span>
              <div className="flex items-center gap-1.5 text-secondary font-medium mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Signed GCP-Compliant Written Informed Consent on Record</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational & Clinical Oversight Card */}
        <Card>
          <CardHeader
            title="Operational & Visit Schedule"
            subtitle="Upcoming appointments and site coordinator assignments"
          />
          <CardContent className="space-y-3.5 text-xs">
            <div className="py-1">
              <span className="text-[11px] text-ink-muted uppercase font-semibold block">Next Scheduled Activity</span>
              {participant.nextActivityName ? (
                <div className="mt-1 p-2.5 bg-surface-soft border border-border rounded-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{participant.nextActivityName}</span>
                    <span className="font-mono text-accent-dark font-medium flex items-center gap-1 shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      {participant.nextActivityDate}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-ink-muted italic block mt-1">No pending visits scheduled.</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 py-1 border-t border-border">
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">Last Recorded Activity</span>
                <span className="font-medium text-ink block mt-0.5">{participant.lastActivityName}</span>
                <span className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {participant.lastActivityDate}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">Assigned Coordinator</span>
                <span className="font-medium text-ink block mt-0.5">{participant.assignedCoordinatorName}</span>
                <span className="text-[11px] text-ink-muted">Clinical Research Team</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protocol Visit Schedule Section (Segment C) */}
      <Card>
        <CardHeader
          title="Protocol Visit Schedule"
          subtitle="Participant-specific timeline of study visits, windows, and procedural checklists"
        />
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {participantVisits && participantVisits.length > 0 ? (
              participantVisits.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-surface-soft/60"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
                        {v.visitCode}
                      </span>
                      <span className="font-semibold text-ink">{v.visitName}</span>
                      <VisitStatusBadge status={v.status} size="sm" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-muted">
                      <span>Target: <strong className="font-mono text-ink-secondary">{v.targetDate}</strong></span>
                      <span>&bull;</span>
                      <span>Window: {v.windowStart} to {v.windowEnd}</span>
                      <span>&bull;</span>
                      <span>Procedures: {v.completedActivities}/{v.totalActivities} completed</span>
                    </div>
                  </div>

                  <Link
                    to={`/pi/visits/${v.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark shrink-0"
                  >
                    <span>View Visit Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-ink-muted text-center flex items-center justify-center gap-2">
                <CalendarDays className="w-4 h-4 text-ink-muted" />
                <span>No protocol visits currently scheduled for this participant.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary Section */}
      <Card>
        <CardHeader
          title="Clinical Activity Log Summary"
          subtitle="Chronological list of visits, procedures, and laboratory evaluations"
        />
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {participant.recentActivities && participant.recentActivities.length > 0 ? (
              participant.recentActivities.map((act) => (
                <div key={act.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-surface-soft/60">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{act.activityName}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded-sm border ${
                          act.status === 'Completed'
                            ? 'bg-emerald-50 text-secondary border-emerald-200'
                            : act.status === 'Overdue'
                            ? 'bg-red-50 text-semantic-danger border-red-200'
                            : 'bg-surface-soft text-ink-secondary border-border'
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>
                    {act.performedBy && (
                      <span className="text-[11px] text-ink-muted flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Performed by: {act.performedBy}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-ink-muted font-mono">{act.date}</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-ink-muted text-center">
                No recent activity records available for this participant.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Safety History & Pharmacovigilance (Segment D) */}
      <Card>
        <CardHeader
          title="Safety History & Pharmacovigilance Log"
          subtitle="Adverse events, serious adverse events, and PI medical oversight for this participant"
        />
        <CardContent className="space-y-4 p-4 sm:p-5">
          {/* Safety Summary Metric Strip */}
          {safetySummary && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pb-3 border-b border-border text-center">
              <div className="bg-surface-soft p-2 rounded-sm border border-border">
                <span className="text-[10px] text-ink-muted uppercase font-semibold block">Total Events</span>
                <span className="font-mono font-bold text-sm text-ink">{safetySummary.totalEvents}</span>
              </div>
              <div className="bg-amber-50/50 p-2 rounded-sm border border-amber-200">
                <span className="text-[10px] text-accent-dark uppercase font-semibold block">AE Count</span>
                <span className="font-mono font-bold text-sm text-ink">{safetySummary.aeCount}</span>
              </div>
              <div className="bg-rose-50/50 p-2 rounded-sm border border-rose-200">
                <span className="text-[10px] text-primary-dark uppercase font-semibold block">SAE Count</span>
                <span className="font-mono font-bold text-sm text-primary-dark">{safetySummary.saeCount}</span>
              </div>
              <div className="bg-sky-50/50 p-2 rounded-sm border border-sky-200">
                <span className="text-[10px] text-sky-800 uppercase font-semibold block">Ongoing</span>
                <span className="font-mono font-bold text-sm text-sky-800">{safetySummary.ongoingCount}</span>
              </div>
              <div className="bg-stone-50 p-2 rounded-sm border border-border">
                <span className="text-[10px] text-ink-muted uppercase font-semibold block">Review Pending</span>
                <span className={`font-mono font-bold text-sm ${safetySummary.piReviewRequiredCount > 0 ? 'text-semantic-danger' : 'text-ink'}`}>
                  {safetySummary.piReviewRequiredCount}
                </span>
              </div>
            </div>
          )}

          {/* Safety Events List */}
          {safetySummary && safetySummary.events.length > 0 ? (
            <div className="space-y-2">
              {safetySummary.events.map((se) => (
                <div
                  key={se.id}
                  className={`p-3 rounded-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    se.eventType === 'SAE' ? 'bg-rose-50/30 border-rose-200' : 'bg-surface-soft border-border'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-ink bg-surface border border-border px-1.5 py-0.5 rounded-sm">
                        {se.id}
                      </span>
                      <SafetyEventTypeBadge type={se.eventType} size="sm" />
                      <SafetySeverityBadge severity={se.severity} size="sm" />
                      <span className="font-semibold text-ink">{se.title}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-muted">
                      <span>Onset: <strong className="font-mono text-ink-secondary">{se.onsetDate}</strong></span>
                      <span>&bull;</span>
                      <span>Status: {se.status.replace(/_/g, ' ')}</span>
                      <span>&bull;</span>
                      <span>Seriousness: {se.seriousness.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <SafetyReviewBadge status={se.piReviewStatus} size="sm" />
                    <Link
                      to={`/pi/safety/${se.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark ml-1"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-secondary bg-emerald-50/50 p-3 rounded-sm border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              <span>No adverse events or safety incidents reported for this subject.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Protocol Compliance & Deviations History (Segment E) */}
      <Card>
        <CardHeader
          title="Protocol Compliance History"
          subtitle="Protocol adherence, variances, and CAPA remediation tracking for this participant"
          action={
            <Link
              to="/pi/compliance"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Compliance Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <CardContent className="space-y-4 p-4 sm:p-5">
          {/* Summary strip if deviations exist */}
          {complianceSummary && complianceSummary.totalDeviations > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-3 border-b border-border text-center">
              <div className="bg-surface-soft p-2 rounded-sm border border-border">
                <span className="text-[10px] text-ink-muted uppercase font-semibold block">Total Deviations</span>
                <span className="font-mono font-bold text-sm text-ink">{complianceSummary.totalDeviations}</span>
              </div>
              <div className="bg-red-50/50 p-2 rounded-sm border border-red-200">
                <span className="text-[10px] text-semantic-danger uppercase font-semibold block">Critical</span>
                <span className="font-mono font-bold text-sm text-semantic-danger">{complianceSummary.criticalCount}</span>
              </div>
              <div className="bg-amber-50/50 p-2 rounded-sm border border-amber-200">
                <span className="text-[10px] text-amber-800 uppercase font-semibold block">Major</span>
                <span className="font-mono font-bold text-sm text-amber-800">{complianceSummary.majorCount}</span>
              </div>
              <div className="bg-stone-50 p-2 rounded-sm border border-border">
                <span className="text-[10px] text-ink-muted uppercase font-semibold block">Open Actions</span>
                <span className="font-mono font-bold text-sm text-ink">{complianceSummary.openCount}</span>
              </div>
            </div>
          )}

          {complianceSummary && complianceSummary.deviations.length > 0 ? (
            <div className="space-y-2">
              {complianceSummary.deviations.map((dev) => (
                <div
                  key={dev.id}
                  className={`p-3 rounded-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    dev.classification === 'CRITICAL' ? 'bg-red-50/20 border-red-200' : 'bg-surface-soft border-border'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-ink bg-surface border border-border px-1.5 py-0.5 rounded-sm">
                        {dev.id}
                      </span>
                      <DeviationClassificationBadge classification={dev.classification} size="sm" />
                      <span className="font-semibold text-ink">{dev.title}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-muted">
                      <span>Category: <strong className="text-ink-secondary">{dev.category.replace(/_/g, ' ')}</strong></span>
                      <span>&bull;</span>
                      <span>Occurred: <strong className="font-mono text-ink-secondary">{dev.occurrenceDate}</strong></span>
                      <span>&bull;</span>
                      <span>Status: {dev.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <DeviationStatusBadge status={dev.status} size="sm" />
                    <DeviationCapaBadge status={dev.capaStatus} targetDate={dev.capaTargetDate} size="sm" />
                    <Link
                      to={`/pi/compliance/${dev.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark ml-1"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-secondary bg-emerald-50/50 p-3 rounded-sm border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>No protocol deviations recorded for this participant.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

```

---

## FILE: src/pages/VisitDetailPage.tsx

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { visitService } from '../services/visitService';
import { complianceService } from '../services/complianceService';
import { ParticipantVisit, ClinicalActivityStatus, ProtocolDeviation } from '../types';
import { VisitStatusBadge } from '../components/visits/VisitStatusBadge';
import { VisitWindowDisplay } from '../components/visits/VisitWindowDisplay';
import { ClinicalActivityList } from '../components/visits/ClinicalActivityList';
import { DeviationClassificationBadge } from '../components/compliance/DeviationClassificationBadge';
import { DeviationStatusBadge } from '../components/compliance/DeviationStatusBadge';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Building2,
  CheckCircle2,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';

export const VisitDetailPage: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const { activeStudy, activeSite, activeStudyId, activeSiteId, isLoading: isStudyLoading } =
    useStudy();

  const [visit, setVisit] = useState<ParticipantVisit | null>(null);
  const [visitDeviations, setVisitDeviations] = useState<ProtocolDeviation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadVisit = useCallback(async () => {
    if (!activeStudyId || !activeSiteId || !visitId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [data, devs] = await Promise.all([
        visitService.getVisitById(context, visitId),
        complianceService.getVisitDeviations(context, visitId),
      ]);
      setVisit(data);
      setVisitDeviations(devs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve visit details.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, visitId]);

  useEffect(() => {
    loadVisit();
  }, [loadVisit]);

  const handleToggleActivityStatus = async (
    activityId: string,
    newStatus: ClinicalActivityStatus
  ) => {
    if (!activeStudyId || !activeSiteId || !visitId) return;

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await visitService.updateActivityStatus(
        context,
        visitId,
        activityId,
        newStatus
      );

      if (updated) {
        setVisit(updated);
        setFeedbackMessage(
          newStatus === 'COMPLETED'
            ? 'Procedure signed off successfully.'
            : 'Procedure status reverted to pending.'
        );
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update procedure status.');
    }
  };

  if (isStudyLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="bg-surface p-6 border border-border rounded-sm space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface p-6 border border-border rounded-sm h-48" />
          <div className="bg-surface p-6 border border-border rounded-sm h-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorState title="Error Loading Visit Details" message={error} onRetry={loadVisit} />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="py-8">
        <EmptyState
          title="Visit Record Not Found"
          description={`No scheduled visit record was found matching ID "${visitId}" under the currently selected study (${activeStudy?.code}) and site (${activeSite?.name}).`}
          actionLabel="Return to Visits Schedule"
          onAction={() => {}}
          icon={<AlertCircle className="w-6 h-6 text-semantic-danger" />}
        />
        <div className="mt-4 text-center">
          <Link to="/pi/visits">
            <Button variant="primary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Schedule
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/pi/visits"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Visits Schedule</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="font-mono">{activeStudy?.code}</span>
          <span>&bull;</span>
          <span>{activeSite?.siteCode}</span>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-secondary-dark px-4 py-2.5 rounded-sm text-xs flex items-center justify-between shadow-subtle animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
            <span className="font-medium">{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-secondary hover:text-secondary-dark font-semibold text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Visit Header Profile Card */}
      <div className="bg-surface border border-border rounded-sm p-5 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-bold px-2 py-0.5 bg-rose-50 text-primary-dark border border-rose-200 rounded-sm">
                {visit.visitCode}
              </span>
              <VisitStatusBadge status={visit.status} size="md" />
              <span className="text-xs text-ink-secondary border-l border-border pl-2 font-medium">
                Sequence: <strong>{visit.sequence}</strong>
              </span>
              <span className="text-xs text-ink-secondary border-l border-border pl-2">
                Participant:{' '}
                <Link
                  to={`/pi/patients/${visit.participantId}`}
                  className="font-mono font-bold text-primary hover:underline"
                >
                  {visit.participantCode} ({visit.participantInitials})
                </Link>
              </span>
            </div>

            <h2 className="text-xl font-bold font-heading text-ink">{visit.visitName}</h2>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Visit ID: <strong className="font-mono">{visit.id}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                Site: <strong>{activeSite?.name}</strong>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Assigned Staff: <strong>{visit.assignedStaff || 'Unassigned'}</strong>
              </span>
            </div>
          </div>

          <div className="flex sm:items-center gap-2 shrink-0">
            <Link to={`/pi/patients/${visit.participantId}`}>
              <Button variant="outline" size="sm" icon={<User className="w-3.5 h-3.5" />}>
                Participant Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Protocol Window & Timing */}
      <VisitWindowDisplay
        targetDate={visit.targetDate}
        windowStart={visit.windowStart}
        windowEnd={visit.windowEnd}
        status={visit.status}
      />

      {/* Main Grid: Procedures vs Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Procedures Checklist (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Required & Optional Clinical Procedures"
              subtitle="Mandated clinical trial evaluations and sample collections for this visit"
            />
            <CardContent className="p-4 sm:p-5">
              <ClinicalActivityList
                activities={visit.activities}
                onToggleStatus={handleToggleActivityStatus}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Metadata & Notes (1 Col) */}
        <div className="space-y-6">
          {/* Visit Completion Metadata */}
          <Card>
            <CardHeader
              title="Operational Overview"
              subtitle="Completion and audit timestamps"
            />
            <CardContent className="space-y-3.5 text-xs">
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                  Target Date
                </span>
                <span className="font-mono font-medium text-ink flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {visit.targetDate}
                </span>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                  Completion Record
                </span>
                {visit.completedDate ? (
                  <span className="font-medium text-secondary-dark flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                    Concluded on {visit.completedDate}
                  </span>
                ) : (
                  <span className="text-ink-muted italic block mt-0.5">Pending completion</span>
                )}
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                  Procedures Summary
                </span>
                <div className="mt-1 flex items-center justify-between text-xs font-mono">
                  <span>Completed:</span>
                  <span className="font-bold text-secondary">
                    {visit.completedActivities} / {visit.totalActivities}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono mt-0.5">
                  <span>Required Incomplete:</span>
                  <span
                    className={
                      visit.requiredIncompleteActivities > 0
                        ? 'font-bold text-semantic-danger'
                        : 'text-ink-muted'
                    }
                  >
                    {visit.requiredIncompleteActivities}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Notes & Protocol Instructions */}
          <Card>
            <CardHeader
              title="Clinical Notes & Observations"
              subtitle="Recorded by site study team"
            />
            <CardContent className="space-y-3 text-xs">
              {visit.notes ? (
                <div className="p-3 bg-surface-soft border border-border rounded-sm text-ink-secondary leading-relaxed">
                  {visit.notes}
                </div>
              ) : (
                <span className="text-ink-muted italic block">
                  No investigator notes recorded for this visit.
                </span>
              )}

              <div className="pt-2 border-t border-border text-[11px] text-ink-muted flex items-start gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-ink-muted shrink-0 mt-0.5" />
                <span>
                  All changes made to procedure checklists and notes are tracked in the study audit trail.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Protocol Deviations Linked to this Visit (Segment E) */}
          <Card>
            <CardHeader
              title="Protocol Deviations"
              subtitle="Operational variances linked to this specific study visit"
              action={
                <Link
                  to="/pi/compliance"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>All Deviations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <CardContent className="space-y-3 text-xs p-4">
              {visitDeviations.length > 0 ? (
                <div className="space-y-2">
                  {visitDeviations.map((dev) => (
                    <div
                      key={dev.id}
                      className={`p-3 rounded-sm border ${
                        dev.classification === 'CRITICAL'
                          ? 'bg-red-50/30 border-red-200'
                          : 'bg-surface-soft border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-ink bg-surface border border-border px-1.5 py-0.5 rounded-sm">
                            {dev.id}
                          </span>
                          <DeviationClassificationBadge classification={dev.classification} size="xs" />
                        </div>
                        <DeviationStatusBadge status={dev.status} size="xs" />
                      </div>
                      <p className="font-semibold text-ink line-clamp-1">{dev.title}</p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/60 text-[11px] text-ink-muted">
                        <span>Category: {dev.category.replace(/_/g, ' ')}</span>
                        <Link
                          to={`/pi/compliance/${dev.id}`}
                          className="font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-sm text-secondary text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No protocol deviations recorded for this visit.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

```

---

## FILE: DESIGN.md

```markdown
# DESIGN.md --- Visual Design System

> **Purpose:** This document defines ONLY the visual design language to
> be used across the application.
>
> **Important:** Do not copy the reference application's page structure,
> navigation, workflows, components, business logic, forms, dashboards,
> or information architecture. The current application's existing
> Next.js architecture, modular components, routes, workflows, APIs,
> state management, permissions, and project-specific UX remain
> authoritative.

------------------------------------------------------------------------

## 1. Design-System Scope

This design system provides only:

-   Typography
-   Color palette
-   Visual hierarchy
-   Spacing principles
-   Border/radius language
-   Surface treatment
-   Button visual language
-   Form visual language
-   Status colors
-   Focus states
-   Icon visual style
-   Motion principles
-   Responsive visual principles
-   Accessibility-related visual rules

It does **NOT** define:

-   Application routes
-   Page layouts
-   Sidebar structure
-   Dashboard structure
-   Database models
-   API contracts
-   Business logic
-   Authentication flow
-   RBAC/permissions
-   Protocol workflow
-   CTMS workflow
-   Component architecture
-   State management
-   Backend architecture
-   Folder structure
-   Data fetching
-   Server/client component decisions

Those must remain defined by the actual project.

------------------------------------------------------------------------

# 2. Core Design Concept

The visual concept should be:

> **Modern institutional + clinical + trustworthy + restrained**

The reference UI establishes this visual direction through:

-   Deep maroon identity color
-   Darker maroon for strong emphasis
-   Muted institutional green
-   Warm gold accent
-   Warm off-white surfaces
-   Dark neutral typography
-   Serif display typography
-   Sans-serif interface typography
-   Thin borders
-   Minimal corner rounding
-   Minimal shadows
-   Restrained animation

The supplied reference uses `#7A2A12` maroon, `#5C1F0D` dark maroon,
`#1F5C3F` green, `#B8862E` gold, `#1C1A17` ink and `#F8F6F2` soft
background. fileciteturn0file0L11-L20

The reference also uses Merriweather for headings and Source Sans 3 for
interface/body text. fileciteturn0file0L25-L35

------------------------------------------------------------------------

# 3. Non-Negotiable Architecture Rule

## Visual design must never dictate application architecture.

When implementing this design system:

### DO

-   Add reusable design tokens.
-   Add reusable visual primitives.
-   Style existing modular components.
-   Preserve existing component APIs where possible.
-   Preserve current routes.
-   Preserve current business logic.
-   Preserve existing state management.
-   Preserve current API integrations.
-   Preserve current data models.
-   Extend components only when required by the actual application.

### DO NOT

-   Rebuild the application based on the reference HTML.
-   Copy the reference landing page structure.
-   Introduce unnecessary components only because they existed in the
    reference.
-   Replace existing navigation without project requirements.
-   Replace an existing dashboard with the reference layout.
-   Create a new architecture solely to match visual styling.
-   Move business logic into UI components.
-   Couple visual tokens to business/domain logic.

------------------------------------------------------------------------

# 4. Design Token Layer

The visual system should be implemented as centralized design tokens.

For a Next.js application, prefer CSS variables as the source of truth.

Example:

``` css
:root {
  /* Brand */
  --color-primary: #7A2A12;
  --color-primary-dark: #5C1F0D;
  --color-secondary: #1F5C3F;
  --color-accent: #B8862E;

  /* Text */
  --color-text: #1C1A17;
  --color-text-secondary: #5A5347;
  --color-text-muted: #726B5C;
  --color-text-inverse: #FFFFFF;

  /* Surfaces */
  --color-background: #FFFFFF;
  --color-surface: #FFFFFF;
  --color-surface-soft: #F8F6F2;

  /* Borders */
  --color-border: #E4DED3;
  --color-border-strong: #C9C2B3;

  /* Semantic */
  --color-success: #1F5C3F;
  --color-warning: #B8862E;
  --color-danger: #9B2C2C;
  --color-info: #315A78;

  /* Focus */
  --color-focus: #B8862E;
}
```

The actual project may extend these tokens when required.

Do not create competing color systems inside individual components.

------------------------------------------------------------------------

# 5. Color Philosophy

## 5.1 Primary --- Maroon

``` text
#7A2A12
```

Use for:

-   Primary actions
-   Important interactive elements
-   Selected states
-   Brand identity
-   Important headings when appropriate
-   Active navigation indicators
-   Primary links

Do not use primary maroon as the background of every card or section.

------------------------------------------------------------------------

## 5.2 Primary Dark

``` text
#5C1F0D
```

Use for:

-   Strong institutional surfaces
-   Footer/header identity areas
-   Hover/pressed states
-   High-emphasis navigation surfaces

------------------------------------------------------------------------

## 5.3 Secondary --- Green

``` text
#1F5C3F
```

Use for:

-   Positive/verified states
-   Success
-   Completion
-   Secondary institutional accents
-   Valid states
-   Positive clinical/status information

Green should not automatically mean "primary button."

------------------------------------------------------------------------

## 5.4 Accent --- Gold

``` text
#B8862E
```

Use sparingly for:

-   Focus indicators
-   Important accents
-   Attention/warning
-   Section dividers
-   Small visual highlights

Gold is an accent, not a dominant UI color.

------------------------------------------------------------------------

## 5.5 Neutral Surfaces

Main background:

``` text
#FFFFFF
```

Soft background:

``` text
#F8F6F2
```

Use the soft background to visually separate sections without
introducing additional colors.

------------------------------------------------------------------------

# 6. Semantic Color Rules

Every status must have a semantic meaning.

  State            Token
  ---------------- -------------------
  Success          `--color-success`
  Warning          `--color-warning`
  Error/Critical   `--color-danger`
  Informational    `--color-info`
  Default          neutral colors

Do not use arbitrary colors such as purple, cyan, pink, neon green, etc.
unless the application's domain requires them.

If the project requires additional categories, add them as named
semantic tokens instead of using random hex values.

------------------------------------------------------------------------

# 7. Typography

## 7.1 Font families

Primary heading font:

``` css
--font-heading: "Merriweather", Georgia, serif;
```

Primary interface font:

``` css
--font-body: "Source Sans 3", system-ui, sans-serif;
```

The reference explicitly uses Merriweather for headings and Source Sans
3 for body/interface text. fileciteturn0file0L7-L9

------------------------------------------------------------------------

# 8. Typography Concept

Use typography to establish hierarchy rather than relying on cards,
colors, or large icons.

### Headings

Serif.

Characteristics:

-   Institutional
-   Editorial
-   Trustworthy
-   Strong

### Interface text

Sans-serif.

Characteristics:

-   Functional
-   Readable
-   Compact
-   Clear

This combination should be consistent throughout the application.

------------------------------------------------------------------------

# 9. Typography Scale

Recommended starting scale:

``` css
--text-xs: 12px;
--text-sm: 13px;
--text-md: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 28px;
--text-4xl: 36px;
```

These are starting tokens, not rigid requirements.

The actual component should choose the appropriate size based on
context.

------------------------------------------------------------------------

# 10. Typography Rules

## Page titles

Use:

-   Merriweather
-   28--36px desktop
-   24--30px mobile
-   Weight 700--900

## Section headings

Use:

-   Merriweather
-   20--28px

## Component headings

Use:

-   Merriweather
-   17--20px

## Body

Use:

-   Source Sans 3
-   15--16px
-   Line-height 1.5--1.65

## Labels

Use:

-   Source Sans 3
-   13--14px
-   Weight 600

## Helper text

Use:

-   Source Sans 3
-   12--14px
-   Muted color

------------------------------------------------------------------------

# 11. Spacing

Use a predictable spacing scale.

``` css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 32px;
--space-8: 40px;
--space-9: 48px;
--space-10: 56px;
--space-11: 64px;
--space-12: 80px;
```

The reference uses generous section spacing and structured internal
spacing. fileciteturn0file0L64-L96

Do not add arbitrary spacing values everywhere.

If a new spacing value is genuinely required, first check whether an
existing token can be reused.

------------------------------------------------------------------------

# 12. Border Language

The design should feel structured rather than floating.

Default border:

``` css
border: 1px solid var(--color-border);
```

Strong border:

``` css
border: 1px solid var(--color-border-strong);
```

Accent border:

``` css
border-left: 4px solid var(--color-secondary);
```

The reference relies heavily on thin borders rather than strong shadows.
fileciteturn0file0L79-L84

------------------------------------------------------------------------

# 13. Border Radius

The reference uses an intentionally restrained radius.

Default:

``` css
--radius-sm: 2px;
```

Optional modern extensions:

``` css
--radius-md: 4px;
--radius-lg: 6px;
```

Use larger rounding only if the current application's UX requires it.

Avoid:

-   Excessive rounded cards
-   Huge 16--24px radius containers
-   Fully rounded buttons everywhere

Pills may be used for:

-   Status badges
-   Tags
-   Compact filters

------------------------------------------------------------------------

# 14. Shadows

Shadows should be subtle.

Default components should generally use borders rather than shadows.

If elevation is required:

``` css
box-shadow: 0 2px 8px rgba(28, 26, 23, 0.08);
```

Use elevation mainly for:

-   Dropdowns
-   Popovers
-   Dialogs
-   Floating menus
-   Temporary overlays

Do not turn every card into a floating object.

------------------------------------------------------------------------

# 15. Surface Hierarchy

Use a small number of surfaces.

Recommended:

``` text
Background
  ↓
Soft section surface
  ↓
White content surface
  ↓
Border
  ↓
Optional elevated overlay
```

Example:

``` text
#FFFFFF
#F8F6F2
#FFFFFF + #E4DED3 border
```

Avoid creating many near-identical gray shades.

------------------------------------------------------------------------

# 16. Buttons

The visual language for buttons comes from the reference's restrained
maroon action buttons. fileciteturn0file0L71-L78

## Primary

``` css
background: var(--color-primary);
color: var(--color-text-inverse);
border: 1px solid var(--color-primary);
```

## Secondary

``` css
background: transparent;
color: var(--color-primary);
border: 1px solid var(--color-primary);
```

## Destructive

Use `--color-danger`.

## Success

Use `--color-success` only when the action genuinely represents a
positive/confirmation operation.

Buttons should be visually clear without becoming oversized.

------------------------------------------------------------------------

# 17. Form Controls

Inputs should use the same restrained visual language.

Recommended:

``` css
border: 1px solid var(--color-border-strong);
background: var(--color-surface);
border-radius: var(--radius-sm);
```

The reference uses approximately 10--12px vertical/horizontal input
padding and a gold focus outline. fileciteturn0file0L114-L120

Focus:

``` css
outline: 2px solid var(--color-focus);
outline-offset: 1px;
border-color: var(--color-primary);
```

Never remove the focus indicator.

------------------------------------------------------------------------

# 18. Component Visual Rules

The application will contain its own modular components.

Each component should consume the shared design tokens.

Example:

``` text
Button
Card
Input
Select
Textarea
Dialog
Tabs
Badge
Tooltip
Dropdown
Table
Pagination
Alert
Toast
```

The visual design system styles these primitives.

The application itself decides:

-   Which components exist
-   Where they are used
-   What data they receive
-   What actions they perform
-   Which pages contain them

------------------------------------------------------------------------

# 19. Existing Modular Architecture Must Be Preserved

When implementing the design in Next.js:

``` text
Existing application architecture
            ↓
Existing components
            ↓
Shared visual tokens
            ↓
Component-level styling
            ↓
Project-specific screens
```

Not:

``` text
Reference HTML
      ↓
Copy page
      ↓
Rewrite application
```

The reference is a **visual source**, not an application blueprint.

------------------------------------------------------------------------

# 20. Next.js Implementation Guidance

The project is built with Next.js.

Therefore the design system should integrate naturally with the existing
stack.

Recommended approach:

``` text
app/
components/
features/
lib/
styles/
```

The exact project structure must remain whatever the project already
uses.

Do not reorganize folders merely to implement this design.

Global tokens can live in the application's existing global stylesheet,
for example:

``` css
:root {
  --color-primary: #7A2A12;
  --color-primary-dark: #5C1F0D;
  --color-secondary: #1F5C3F;
  --color-accent: #B8862E;

  --color-text: #1C1A17;
  --color-text-secondary: #5A5347;
  --color-text-muted: #726B5C;

  --color-background: #FFFFFF;
  --color-surface-soft: #F8F6F2;

  --color-border: #E4DED3;
  --color-border-strong: #C9C2B3;

  --color-success: #1F5C3F;
  --color-warning: #B8862E;
  --color-danger: #9B2C2C;
  --color-info: #315A78;

  --font-heading: "Merriweather", Georgia, serif;
  --font-body: "Source Sans 3", system-ui, sans-serif;
}
```

------------------------------------------------------------------------

# 21. Component Styling Rule

Components should not contain arbitrary brand values.

Avoid:

``` tsx
style={{
  color: "#7A2A12"
}}
```

Prefer the project's established styling mechanism and shared token:

``` css
color: var(--color-primary);
```

or the equivalent token system already used by the application.

This ensures that changing the theme later does not require editing
dozens of components.

------------------------------------------------------------------------

# 22. Responsive Visual Rules

The design system is responsive, but it does not dictate the
application's mobile information architecture.

Use the current application's responsive structure.

Only apply these visual principles:

### Desktop

-   Comfortable whitespace
-   Full typography scale
-   Full navigation labels
-   Multi-column layouts where the application's UX requires them

### Tablet

-   Reduce spacing
-   Preserve readable typography
-   Allow content to stack when required

### Mobile

-   Reduce horizontal padding
-   Preserve hierarchy
-   Keep controls touch-friendly
-   Avoid text becoming unnecessarily small
-   Use horizontal scrolling for genuinely wide data
-   Never simply squeeze desktop layouts into mobile width

The reference itself switches multi-column sections to a single column
at smaller widths. fileciteturn0file0L151-L156

------------------------------------------------------------------------

# 23. Icons

Use one consistent icon family throughout the project.

Preferred visual style:

-   Simple
-   Line-based
-   Minimal
-   Professional
-   16--20px for standard UI
-   20--24px for prominent actions

Do not mix multiple icon libraries/styles unnecessarily.

Icons should support labels.

Do not make critical functionality understandable only through icons.

------------------------------------------------------------------------

# 24. Motion

Motion should be subtle and functional.

Recommended:

``` text
120–200ms
ease / ease-out
```

Use motion for:

-   Hover
-   Focus
-   Dropdown
-   Dialog
-   Toast
-   Expand/collapse
-   Navigation transitions

Avoid decorative motion.

The reference explicitly disables transitions and smooth scrolling when
reduced motion is requested. fileciteturn0file0L156-L156

Implement:

``` css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

------------------------------------------------------------------------

# 25. Accessibility Visual Rules

The visual system must support accessibility.

Required:

-   Visible keyboard focus
-   Sufficient text contrast
-   Labels for form controls
-   Error states that do not rely only on color
-   Status indicators with text/icons
-   Touch-friendly controls
-   Reduced motion support

Color must never be the only indicator.

Bad:

``` text
●
```

Better:

``` text
● Critical
```

------------------------------------------------------------------------

# 26. Status Components

Status should visually follow the same system.

Example:

``` text
ACTIVE
```

Green.

``` text
PENDING
```

Gold.

``` text
ERROR
```

Danger red.

``` text
DRAFT
```

Neutral.

Use status badges only when a status actually exists in the
application's domain.

Do not invent statuses merely for visual decoration.

------------------------------------------------------------------------

# 27. Data Visualization

The reference does not define a complete charting system.

Therefore charts must follow the project's actual data requirements.

Only inherit the visual language:

-   Restrained colors
-   Maroon as primary series
-   Green as positive/secondary series
-   Gold for attention
-   Neutral gridlines
-   Clear typography
-   Minimal decoration

Do not use all brand colors in every chart.

Use colors semantically.

------------------------------------------------------------------------

# 28. Dark Mode

This reference is fundamentally a light institutional visual system.

Do not automatically introduce dark mode.

If the existing application already supports dark mode, map the design
tokens to dark equivalents without changing component architecture.

The light theme remains the reference visual direction.

------------------------------------------------------------------------

# 29. Branding Usage

The visual identity should communicate institutional credibility.

However:

-   Do not invent government logos.
-   Do not invent official seals.
-   Do not imply government ownership unless the actual project has that
    authorization.
-   Do not copy official branding assets without the project's
    permission/licensing.

The design language may be inspired by the reference without falsely
representing institutional affiliation.

------------------------------------------------------------------------

# 30. What Must NOT Be Copied From Reference

The following are explicitly **not part of this design system**:

-   Reference navigation
-   Reference landing page
-   Reference hero
-   Reference portal tabs
-   Patient/Doctor/Inventory role structure
-   Reference registration form
-   Reference footer structure
-   Reference content/copy
-   Reference page hierarchy
-   Reference HTML
-   Reference JavaScript
-   Reference business rules
-   Reference CTMS workflows

Only the visual concepts should be reused.

------------------------------------------------------------------------

# 31. Design Adaptation Rule

When designing a new screen:

### Step 1

Understand the screen's actual purpose.

### Step 2

Use the existing application's information architecture.

### Step 3

Use existing modular components wherever possible.

### Step 4

Apply this design system's:

-   Typography
-   Colors
-   Spacing
-   Borders
-   Surfaces
-   Focus states
-   Semantic states

### Step 5

Add project-specific UX only when required.

### Step 6

Do a responsive and accessibility check.

This prevents the visual reference from overriding product requirements.

------------------------------------------------------------------------

# 32. Priority Order

When there is a conflict, follow this priority:

``` text
1. Functional requirement
2. Existing application architecture
3. Accessibility
4. Existing project UX conventions
5. This visual design system
6. Decorative visual preference
```

Never break functionality merely to match the reference visually.

------------------------------------------------------------------------

# 33. Final Design Direction

The current application should visually feel like:

> **A modern, trustworthy, institutional clinical/research application
> with a subtle Indian/Ayurveda-inspired identity.**

The reference contributes:

``` text
Maroon
+
Green
+
Gold
+
Warm neutrals
+
Serif institutional headings
+
Sans-serif UI text
+
Thin borders
+
Restrained radius
+
Minimal shadows
+
Subtle motion
```

Everything else must be determined by the actual application's
requirements and modular Next.js architecture.

------------------------------------------------------------------------

# 34. One-Line Rule for Developers / AI Agents

> **Use the reference only as a visual design language; never copy its
> structure, workflow, components, pages, content, or architecture.
> Preserve the existing Next.js application and apply these tokens and
> visual principles to its existing modular components.**

```

---

## FILE: package.json

```json
{
  "name": "ctms-mvp",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b",
    "test": "vite build --ssr src/tests/services.test.ts --outDir dist-test && node dist-test/services.test.js && rm -rf dist-test",
    "verify": "npm run typecheck && npm run test && npm run build"
  },
  "dependencies": {
    "lucide-react": "^1.48.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.5"
  },
  "devDependencies": {
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.0.11"
  }
}

```

---

## FILE: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}

```

---

## FILE: vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});

```

---

## EXPORT SUMMARY

Generated: Tue Sep 29 10:46:06 IST 2026

Output file:
SEGMENT_E_AUDIT_CODE.md

Size:
  236274

Included source files:
- src/components/compliance/ComplianceDeviationMobileCard.tsx
- src/components/compliance/ComplianceDeviationTable.tsx
- src/components/compliance/ComplianceFiltersBar.tsx
- src/components/compliance/ComplianceSummaryCards.tsx
- src/components/compliance/DeviationCapaBadge.tsx
- src/components/compliance/DeviationClassificationBadge.tsx
- src/components/compliance/DeviationReviewBadge.tsx
- src/components/compliance/DeviationScopeBadge.tsx
- src/components/compliance/DeviationStatusBadge.tsx
- src/components/dashboard/SafetyAndComplianceCards.tsx
- src/pages/ComplianceDeviationDetailPage.tsx
- src/pages/ComplianceManagementPage.tsx
- src/repositories/mockComplianceRepository.ts
- src/services/complianceService.ts
- src/tests/services.test.ts
- src/components/dashboard/SafetyAndComplianceCards.tsx
- src/components/dashboard/StudyContextHeader.tsx
- src/context/StudyContext.tsx
- src/pages/ParticipantDetailPage.tsx
- src/pages/VisitDetailPage.tsx
- DESIGN.md
- package.json
- tsconfig.json
- vite.config.ts
