import React, { useState, useEffect, useCallback } from 'react';
import { useStudy } from '../context/StudyContext';
import { safetyService } from '../services/safetyService';
import { participantService } from '../services/participantService';
import {
  SafetyEvent,
  SafetyFilters,
  SafetySummaryMetrics,
} from '../types';
import { SafetySummaryCards } from '../components/safety/SafetySummaryCards';
import { SafetyFiltersBar } from '../components/safety/SafetyFiltersBar';
import { SafetyEventTable } from '../components/safety/SafetyEventTable';
import { SafetyEventMobileCard } from '../components/safety/SafetyEventMobileCard';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';

export const SafetyManagementPage: React.FC = () => {
  const { activeStudy, activeSite, activeStudyId, activeSiteId, isLoading: isStudyLoading } =
    useStudy();

  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [totalSiteCount, setTotalSiteCount] = useState<number>(0);
  const [participantsList, setParticipantsList] = useState<
    { id: string; participantCode: string; initials: string }[]
  >([]);

  const [metrics, setMetrics] = useState<SafetySummaryMetrics>({
    total: 0,
    ae: 0,
    sae: 0,
    ongoing: 0,
    resolved: 0,
    piReviewRequired: 0,
    followUpDue: 0,
    overdueFollowUp: 0,
  });

  const [filters, setFilters] = useState<SafetyFilters>({
    search: '',
    eventType: 'ALL',
    status: 'ALL',
    severity: 'ALL',
    seriousness: 'ALL',
    piReviewStatus: 'ALL',
    followUpStatus: 'ALL',
    participantId: undefined,
    dateRange: 'ALL',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // QA simulation state for Definition of Done verification
  const [simulatedError, setSimulatedError] = useState<boolean>(false);
  const [simulatedEmpty, setSimulatedEmpty] = useState<boolean>(false);

  const loadSafetyData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (simulatedError) {
        throw new Error('Simulated repository error: unable to load pharmacovigilance registry.');
      }

      if (simulatedEmpty) {
        setEvents([]);
        setTotalSiteCount(0);
        setMetrics({
          total: 0,
          ae: 0,
          sae: 0,
          ongoing: 0,
          resolved: 0,
          piReviewRequired: 0,
          followUpDue: 0,
          overdueFollowUp: 0,
        });
        setIsLoading(false);
        return;
      }

      const context = { studyId: activeStudyId, siteId: activeSiteId };

      // Parallel fetch for filtered safety events, summary metrics, and site participants
      const [filteredData, summary, allSiteEvents, siteParticipants] = await Promise.all([
        safetyService.getSafetyEvents(context, filters),
        safetyService.getSafetySummary(context),
        safetyService.getSafetyEvents(context), // All events for total site count
        participantService.getParticipants(context),
      ]);

      setEvents(filteredData);
      setMetrics(summary);
      setTotalSiteCount(allSiteEvents.length);
      setParticipantsList(
        siteParticipants.map((p) => ({
          id: p.id,
          participantCode: p.participantCode,
          initials: p.initials,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve safety events.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, filters, simulatedError, simulatedEmpty]);

  useEffect(() => {
    loadSafetyData();
  }, [loadSafetyData]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      eventType: 'ALL',
      status: 'ALL',
      severity: 'ALL',
      seriousness: 'ALL',
      piReviewStatus: 'ALL',
      followUpStatus: 'ALL',
      participantId: undefined,
      dateRange: 'ALL',
    });
  };

  const handleSummaryCardFilter = (filterKey: string) => {
    if (filterKey === 'ALL') {
      handleResetFilters();
    } else if (filterKey === 'TYPE_AE') {
      setFilters((prev) => ({ ...prev, eventType: 'AE' }));
    } else if (filterKey === 'TYPE_SAE') {
      setFilters((prev) => ({ ...prev, eventType: 'SAE' }));
    } else if (filterKey === 'ONGOING') {
      setFilters((prev) => ({ ...prev, dateRange: 'ONGOING' }));
    } else if (filterKey === 'PI_REVIEW_REQUIRED') {
      setFilters((prev) => ({ ...prev, piReviewStatus: 'SIGN_OFF_REQUIRED' }));
    } else if (filterKey === 'OVERDUE_FOLLOWUP') {
      setFilters((prev) => ({ ...prev, followUpStatus: 'OVERDUE' }));
    } else if (filterKey === 'FOLLOWUP_DUE') {
      setFilters((prev) => ({ ...prev, followUpStatus: 'DUE' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* QA Toolbar */}
      <div className="flex items-center justify-between text-xs bg-surface border border-border rounded-sm p-2 text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">QA Toolbar:</span>
          <span>Test Safety & Pharmacovigilance edge states</span>
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
            onClick={loadSafetyData}
            className="px-2 py-1 rounded-sm border border-border hover:bg-surface-soft inline-flex items-center gap-1"
            title="Reload safety log"
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
          <h2 className="text-xl font-bold font-heading text-ink">
            Safety & Pharmacovigilance Vigilance
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Adverse Event (AE) surveillance, Serious Adverse Event (SAE) management, severity vs seriousness evaluation, and PI review tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-surface-soft border border-border rounded-sm text-ink-secondary">
            Pharmacovigilance Scope
          </span>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <SafetySummaryCards
        metrics={metrics}
        onFilterClick={handleSummaryCardFilter}
      />

      {/* Search and Filters Bar */}
      <SafetyFiltersBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        totalCount={totalSiteCount}
        filteredCount={events.length}
        participants={participantsList}
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
          title="Failed to Load Safety Events"
          message={error}
          onRetry={() => {
            setSimulatedError(false);
            loadSafetyData();
          }}
        />
      ) : totalSiteCount === 0 ? (
        <EmptyState
          title="No Safety Events Recorded at this Site"
          description="There are currently zero adverse events or serious adverse events reported for participants under the active study and site."
          actionLabel="Reset View"
          onAction={() => {
            setSimulatedEmpty(false);
            loadSafetyData();
          }}
          icon={<ShieldCheck className="w-6 h-6 text-secondary" />}
        />
      ) : events.length === 0 ? (
        <EmptyState
          title="No Matching Safety Events"
          description="No safety records match your specified search criteria or active filters. Try resetting the filters."
          actionLabel="Reset All Filters"
          onAction={handleResetFilters}
          icon={<ShieldAlert className="w-6 h-6 text-accent" />}
        />
      ) : (
        <>
          {/* Desktop Table View (>= 1024px) */}
          <div className="hidden lg:block">
            <SafetyEventTable events={events} />
          </div>

          {/* Mobile & Tablet Card List View (< 1024px) */}
          <div className="lg:hidden space-y-3">
            {events.map((e) => (
              <SafetyEventMobileCard key={e.id} event={e} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
