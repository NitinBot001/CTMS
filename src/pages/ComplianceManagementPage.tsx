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
        status: 'ALL',
        dateRange: 'ALL',
      }));
    } else if (filterKey === 'CLASS_CRITICAL') {
      setFilters((prev) => ({ ...prev, classification: 'CRITICAL' }));
    } else if (filterKey === 'CLASS_MAJOR') {
      setFilters((prev) => ({ ...prev, classification: 'MAJOR' }));
    } else if (filterKey === 'REVIEW_REQUIRED') {
      setFilters((prev) => ({ ...prev, reviewStatus: 'SIGN_OFF_REQUIRED' }));
    } else if (filterKey === 'CAPA_PENDING') {
      setFilters((prev) => ({ ...prev, capaStatus: 'PENDING' }));
    } else if (filterKey === 'CAPA_OVERDUE') {
      setFilters((prev) => ({ ...prev, capaStatus: 'OVERDUE' }));
    }
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
              ICH-GCP E6 Adherence
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
