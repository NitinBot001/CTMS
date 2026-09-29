import React, { useState, useEffect, useCallback } from 'react';
import { useStudy } from '../context/StudyContext';
import { dashboardService } from '../services/dashboardService';
import { DashboardOverviewData } from '../types';
import { StudyContextHeader } from '../components/dashboard/StudyContextHeader';
import { KpiCardsGrid } from '../components/dashboard/KpiCardsGrid';
import { RecruitmentAndStatus } from '../components/dashboard/RecruitmentAndStatus';
import { UpcomingActivityCard } from '../components/dashboard/UpcomingActivityCard';
import { SafetyAndComplianceCards } from '../components/dashboard/SafetyAndComplianceCards';
import { PendingActionsCard } from '../components/dashboard/PendingActionsCard';
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard';
import { DashboardSkeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { RefreshCw } from 'lucide-react';

export const DashboardOverviewPage: React.FC = () => {
  const { activeStudyId, activeSiteId, isLoading: isStudyLoading } = useStudy();

  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dev controls to verify edge states required by Section 36
  const [simulatedError, setSimulatedError] = useState<boolean>(false);
  const [simulatedEmpty, setSimulatedEmpty] = useState<boolean>(false);

  const loadDashboardData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (simulatedError) {
        throw new Error('Simulated network/service error while retrieving site overview.');
      }

      if (simulatedEmpty) {
        setData(null);
        setIsLoading(false);
        return;
      }

      const overview = await dashboardService.getOverview(activeStudyId, activeSiteId);
      setData(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve overview metrics');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, simulatedError, simulatedEmpty]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Loading state
  if (isStudyLoading || isLoading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="py-8">
        <ErrorState
          title="Overview Data Retrieval Failed"
          message={error}
          onRetry={() => {
            setSimulatedError(false);
            loadDashboardData();
          }}
        />
      </div>
    );
  }

  // Empty state
  if (!data) {
    return (
      <div className="py-8">
        <EmptyState
          title="No Operational Data Available"
          description="There is currently no clinical trial activity logged for this selected study and site combination."
          actionLabel="Reset to Default Site Data"
          onAction={() => {
            setSimulatedEmpty(false);
            setSimulatedError(false);
            loadDashboardData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dev / QA State Simulation Toolbar (Restrained) */}
      <div className="flex items-center justify-between text-xs bg-surface border border-border rounded-sm p-2 text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">QA State Toolbar:</span>
          <span>Switch edge states for testing Definition of Done</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSimulatedError((prev) => !prev);
            }}
            className={`px-2 py-1 rounded-sm border ${
              simulatedError ? 'bg-red-50 text-semantic-danger border-red-300 font-bold' : 'hover:bg-surface-soft border-border'
            }`}
          >
            {simulatedError ? 'Clear Error' : 'Simulate Error'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedEmpty((prev) => !prev);
            }}
            className={`px-2 py-1 rounded-sm border ${
              simulatedEmpty ? 'bg-amber-50 text-accent-dark border-amber-300 font-bold' : 'hover:bg-surface-soft border-border'
            }`}
          >
            {simulatedEmpty ? 'Restore Data' : 'Simulate Empty'}
          </button>
          <button
            type="button"
            onClick={loadDashboardData}
            className="px-2 py-1 rounded-sm border border-border hover:bg-surface-soft inline-flex items-center gap-1"
            title="Refresh current overview"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Section 1: Study Context Header */}
      <StudyContextHeader context={data.context} />

      {/* Section 2: Operational KPI Summary Cards */}
      <KpiCardsGrid
        enrolledParticipants={data.participantSummary.enrolled}
        screenedParticipants={data.participantSummary.screened}
        recruitmentPercent={data.recruitment.progressPercent}
        recruitmentEnrolled={data.recruitment.enrolled}
        recruitmentTarget={data.recruitment.target}
        upcomingVisits={data.visits.upcoming}
        overdueVisits={data.visits.overdue}
        pendingActionsCount={data.pendingActions.length}
      />

      {/* Sections 3 & 4: Recruitment Progress & Participant Status */}
      <RecruitmentAndStatus
        recruitment={data.recruitment}
        participantSummary={data.participantSummary}
      />

      {/* Two-Column Middle Grid: Upcoming Activities & Pending Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Section 5: Upcoming Activity */}
        <UpcomingActivityCard activities={data.upcomingActivities} />

        {/* Section 8: My Pending Actions */}
        <PendingActionsCard actions={data.pendingActions} />
      </div>

      {/* Sections 6 & 7: Safety Vigilance & Protocol Compliance */}
      <SafetyAndComplianceCards
        safety={data.safetySummary}
        compliance={data.complianceSummary}
      />

      {/* Section 9: Recent Site Activity Feed */}
      <RecentActivityCard activities={data.recentActivities} />
    </div>
  );
};
