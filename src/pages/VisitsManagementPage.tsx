import React, { useState, useEffect, useCallback } from 'react';
import { useStudy } from '../context/StudyContext';
import { visitService } from '../services/visitService';
import { participantService } from '../services/participantService';
import {
  ParticipantVisit,
  VisitFilters,
  VisitSummaryMetrics,
  VisitStatus,
  ProtocolVisitDefinition,
} from '../types';
import { VisitSummaryCards } from '../components/visits/VisitSummaryCards';
import { VisitFiltersBar } from '../components/visits/VisitFiltersBar';
import { VisitTable } from '../components/visits/VisitTable';
import { VisitMobileCard } from '../components/visits/VisitMobileCard';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { RefreshCw, CalendarDays } from 'lucide-react';

export const VisitsManagementPage: React.FC = () => {
  const { activeStudy, activeSite, activeStudyId, activeSiteId, isLoading: isStudyLoading } =
    useStudy();

  const [visits, setVisits] = useState<ParticipantVisit[]>([]);
  const [totalSiteCount, setTotalSiteCount] = useState<number>(0);
  const [protocolVisits, setProtocolVisits] = useState<ProtocolVisitDefinition[]>([]);
  const [participantsList, setParticipantsList] = useState<
    { id: string; participantCode: string; initials: string }[]
  >([]);

  const [metrics, setMetrics] = useState<VisitSummaryMetrics>({
    total: 0,
    due: 0,
    upcoming: 0,
    overdue: 0,
    completed: 0,
    missed: 0,
  });

  const [filters, setFilters] = useState<VisitFilters>({
    search: '',
    status: 'ALL',
    participantId: undefined,
    visitCode: undefined,
    dateRange: 'ALL',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // QA simulation state for Definition of Done verification
  const [simulatedError, setSimulatedError] = useState<boolean>(false);
  const [simulatedEmpty, setSimulatedEmpty] = useState<boolean>(false);

  const loadVisitsData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (simulatedError) {
        throw new Error('Simulated repository error: unable to load visit schedule.');
      }

      if (simulatedEmpty) {
        setVisits([]);
        setTotalSiteCount(0);
        setMetrics({
          total: 0,
          due: 0,
          upcoming: 0,
          overdue: 0,
          completed: 0,
          missed: 0,
        });
        setIsLoading(false);
        return;
      }

      const context = { studyId: activeStudyId, siteId: activeSiteId };

      // Parallel fetch for filtered visits, summary metrics, protocol definitions, and site participants
      const [filteredData, summary, allSiteVisits, protoDefs, siteParticipants] = await Promise.all([
        visitService.getVisits(context, filters),
        visitService.getVisitSummary(context),
        visitService.getVisits(context), // All visits for total count
        visitService.getProtocolVisits(activeStudyId),
        participantService.getParticipants(context),
      ]);

      setVisits(filteredData);
      setMetrics(summary);
      setTotalSiteCount(allSiteVisits.length);
      setProtocolVisits(protoDefs);
      setParticipantsList(
        siteParticipants.map((p) => ({
          id: p.id,
          participantCode: p.participantCode,
          initials: p.initials,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve visit schedule.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, filters, simulatedError, simulatedEmpty]);

  useEffect(() => {
    loadVisitsData();
  }, [loadVisitsData]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      participantId: undefined,
      visitCode: undefined,
      dateRange: 'ALL',
    });
  };

  const handleSummaryCardFilter = (filterKey: VisitStatus | 'ALL') => {
    if (filterKey === 'ALL') {
      handleResetFilters();
    } else {
      setFilters((prev) => ({
        ...prev,
        status: filterKey,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* QA Toolbar */}
      <div className="flex items-center justify-between text-xs bg-surface border border-border rounded-sm p-2 text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">QA Toolbar:</span>
          <span>Test Visits & Schedule edge states</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSimulatedError((prev) => !prev)}
            className={`px-2 py-1 rounded-sm border ${
              simulatedError
                ? 'bg-red-50 text-semantic-danger border-red-300 font-bold'
                : 'hover:bg-surface-soft border-border'
            }`}
          >
            {simulatedError ? 'Clear Error' : 'Simulate Error'}
          </button>
          <button
            type="button"
            onClick={() => setSimulatedEmpty((prev) => !prev)}
            className={`px-2 py-1 rounded-sm border ${
              simulatedEmpty
                ? 'bg-amber-50 text-accent-dark border-amber-300 font-bold'
                : 'hover:bg-surface-soft border-border'
            }`}
          >
            {simulatedEmpty ? 'Restore Data' : 'Simulate Empty'}
          </button>
          <button
            type="button"
            onClick={loadVisitsData}
            className="px-2 py-1 rounded-sm border border-border hover:bg-surface-soft inline-flex items-center gap-1"
            title="Reload visits"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Page Title & Context Header */}
      <div className="bg-surface border border-border rounded-sm p-4 sm:p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-muted mb-1 font-mono">
            <span>{activeStudy?.code || 'STUDY'}</span>
            <span>&bull;</span>
            <span>{activeSite?.name || 'Site'}</span>
            <span>&bull;</span>
            <span>Protocol {activeStudy?.protocolVersion || 'v1.0'}</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-ink">Visits & Clinical Activities</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Operational schedule of protocol visits, allowable window adherence, and procedural activity checklists
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-surface-soft border border-border rounded-sm text-ink-secondary">
            Site-Level Schedule
          </span>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <VisitSummaryCards
        metrics={metrics}
        activeFilter={filters.status}
        onFilterClick={handleSummaryCardFilter}
      />

      {/* Search and Filters Bar */}
      <VisitFiltersBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        totalCount={totalSiteCount}
        filteredCount={visits.length}
        participants={participantsList}
        protocolVisits={protocolVisits}
      />

      {/* Content Rendering: Loading, Error, Empty, or Table */}
      {isStudyLoading || isLoading ? (
        <div className="bg-surface border border-border rounded-sm p-6 space-y-4">
          <Skeleton className="h-6 w-48 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-border/50">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to Load Visits Schedule"
          message={error}
          onRetry={() => {
            setSimulatedError(false);
            loadVisitsData();
          }}
        />
      ) : totalSiteCount === 0 ? (
        <EmptyState
          title="No Visits Scheduled for this Site"
          description="There are currently no visits scheduled for participants under the active study and site context."
          actionLabel="Reset View"
          onAction={() => {
            setSimulatedEmpty(false);
            loadVisitsData();
          }}
          icon={<CalendarDays className="w-6 h-6" />}
        />
      ) : visits.length === 0 ? (
        <EmptyState
          title="No Matching Visits"
          description="No visits match your current search query or timeline filters. Try resetting the filters."
          actionLabel="Reset All Filters"
          onAction={handleResetFilters}
          icon={<CalendarDays className="w-6 h-6" />}
        />
      ) : (
        <>
          {/* Desktop Table View (>= 1024px) */}
          <div className="hidden lg:block">
            <VisitTable visits={visits} />
          </div>

          {/* Mobile & Tablet Card List View (< 1024px) */}
          <div className="lg:hidden space-y-3">
            {visits.map((v) => (
              <VisitMobileCard key={v.id} visit={v} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
