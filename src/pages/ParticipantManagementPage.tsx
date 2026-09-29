import React, { useState, useEffect, useCallback } from 'react';
import { useStudy } from '../context/StudyContext';
import { participantService } from '../services/participantService';
import { Participant, ParticipantFilters, ParticipantSummaryMetrics, ParticipantLifecycleStatus } from '../types';
import { ParticipantSummaryCards } from '../components/participants/ParticipantSummaryCards';
import { ParticipantFiltersBar } from '../components/participants/ParticipantFiltersBar';
import { ParticipantTable } from '../components/participants/ParticipantTable';
import { ParticipantMobileCard } from '../components/participants/ParticipantMobileCard';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { RefreshCw, Users } from 'lucide-react';

export const ParticipantManagementPage: React.FC = () => {
  const { activeStudy, activeSite, activeStudyId, activeSiteId, isLoading: isStudyLoading } = useStudy();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalSiteCount, setTotalSiteCount] = useState<number>(0);
  const [metrics, setMetrics] = useState<ParticipantSummaryMetrics>({
    total: 0,
    screening: 0,
    enrolled: 0,
    active: 0,
    completed: 0,
    withdrawn: 0,
    screenFailed: 0,
    attentionRequired: 0,
  });

  const [filters, setFilters] = useState<ParticipantFilters>({
    search: '',
    status: 'ALL',
    sex: 'ALL',
    attentionRequired: undefined,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // QA simulation state for Definition of Done verification
  const [simulatedError, setSimulatedError] = useState<boolean>(false);
  const [simulatedEmpty, setSimulatedEmpty] = useState<boolean>(false);

  const loadParticipantsData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (simulatedError) {
        throw new Error('Simulated repository error: unable to reach participant registry.');
      }

      if (simulatedEmpty) {
        setParticipants([]);
        setTotalSiteCount(0);
        setMetrics({
          total: 0,
          screening: 0,
          enrolled: 0,
          active: 0,
          completed: 0,
          withdrawn: 0,
          screenFailed: 0,
          attentionRequired: 0,
        });
        setIsLoading(false);
        return;
      }

      const context = { studyId: activeStudyId, siteId: activeSiteId };

      // Parallel fetch for filtered participants & site-level summary metrics
      const [data, summary, allSiteParticipants] = await Promise.all([
        participantService.getParticipants(context, filters),
        participantService.getParticipantSummary(context),
        participantService.getParticipants(context), // To get raw total for this site
      ]);

      setParticipants(data);
      setMetrics(summary);
      setTotalSiteCount(allSiteParticipants.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve participants.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, filters, simulatedError, simulatedEmpty]);

  useEffect(() => {
    loadParticipantsData();
  }, [loadParticipantsData]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      sex: 'ALL',
      attentionRequired: undefined,
    });
  };

  const handleSummaryCardFilter = (filterKey: string) => {
    if (filterKey === 'ALL') {
      handleResetFilters();
    } else if (filterKey === 'ATTENTION') {
      setFilters((prev) => ({
        ...prev,
        attentionRequired: prev.attentionRequired ? undefined : true,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        status: filterKey as ParticipantLifecycleStatus,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* QA Toolbar */}
      <div className="flex items-center justify-between text-xs bg-surface border border-border rounded-sm p-2 text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">QA Toolbar:</span>
          <span>Test Participant Management edge states</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSimulatedError((prev) => !prev)}
            className={`px-2 py-1 rounded-sm border ${
              simulatedError ? 'bg-red-50 text-semantic-danger border-red-300 font-bold' : 'hover:bg-surface-soft border-border'
            }`}
          >
            {simulatedError ? 'Clear Error' : 'Simulate Error'}
          </button>
          <button
            type="button"
            onClick={() => setSimulatedEmpty((prev) => !prev)}
            className={`px-2 py-1 rounded-sm border ${
              simulatedEmpty ? 'bg-amber-50 text-accent-dark border-amber-300 font-bold' : 'hover:bg-surface-soft border-border'
            }`}
          >
            {simulatedEmpty ? 'Restore Data' : 'Simulate Empty'}
          </button>
          <button
            type="button"
            onClick={loadParticipantsData}
            className="px-2 py-1 rounded-sm border border-border hover:bg-surface-soft inline-flex items-center gap-1"
            title="Reload participants"
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
          </div>
          <h2 className="text-xl font-bold font-heading text-ink">Participant Management</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Subject directory, screening status, enrollment progress and scheduled visits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-surface-soft border border-border rounded-sm text-ink-secondary">
            Active Site Scope
          </span>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <ParticipantSummaryCards
        metrics={metrics}
        onFilterClick={handleSummaryCardFilter}
      />

      {/* Search and Filters Bar */}
      <ParticipantFiltersBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        totalCount={totalSiteCount}
        filteredCount={participants.length}
      />

      {/* Content Rendering: Loading, Error, Empty, or Table */}
      {isStudyLoading || isLoading ? (
        <div className="bg-surface border border-border rounded-sm p-6 space-y-4">
          <Skeleton className="h-6 w-48 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-border/50">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36 flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to Load Participants"
          message={error}
          onRetry={() => {
            setSimulatedError(false);
            loadParticipantsData();
          }}
        />
      ) : totalSiteCount === 0 ? (
        <EmptyState
          title="No Participants Registered at this Site"
          description="There are currently no participants screened or enrolled for the selected study and site combination."
          actionLabel="Reset View"
          onAction={() => {
            setSimulatedEmpty(false);
            loadParticipantsData();
          }}
          icon={<Users className="w-6 h-6" />}
        />
      ) : participants.length === 0 ? (
        <EmptyState
          title="No Matching Participants"
          description="No participants match the specified search query or active filter criteria. Try adjusting your search or clearing filters."
          actionLabel="Reset All Filters"
          onAction={handleResetFilters}
          icon={<Users className="w-6 h-6" />}
        />
      ) : (
        <>
          {/* Desktop Table View (>= 1024px) */}
          <div className="hidden lg:block">
            <ParticipantTable participants={participants} />
          </div>

          {/* Mobile & Tablet Card List View (< 1024px) */}
          <div className="lg:hidden space-y-3">
            {participants.map((p) => (
              <ParticipantMobileCard key={p.id} participant={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
