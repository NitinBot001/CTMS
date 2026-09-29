import React, { useState, useEffect, useCallback } from 'react';
import { useStudy } from '../context/StudyContext';
import { teamService } from '../services/teamService';
import {
  TeamMemberSummary,
  Role,
  TeamSummaryMetrics,
  TeamFilters,
} from '../types';
import { TeamSummaryCards } from '../components/team/TeamSummaryCards';
import { TeamFiltersBar } from '../components/team/TeamFiltersBar';
import { TeamMemberTable } from '../components/team/TeamMemberTable';
import { TeamMemberMobileCard } from '../components/team/TeamMemberMobileCard';
import { AssignRoleModal } from '../components/team/AssignRoleModal';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { RefreshCw, Users, ShieldAlert, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TeamManagementPage: React.FC = () => {
  const { activeStudyId, activeSiteId, isLoading: isStudyLoading } = useStudy();

  const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>([]);
  const [totalSiteCount, setTotalSiteCount] = useState<number>(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [metrics, setMetrics] = useState<TeamSummaryMetrics>({
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    systemRolesCount: 0,
    customRolesCount: 0,
    totalAssignments: 0,
  });

  const [filters, setFilters] = useState<TeamFilters>({
    search: '',
    status: 'ALL',
    roleId: 'ALL',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [activeCardFilter, setActiveCardFilter] = useState<string>('ALL');

  // Simulated QA state for Definition of Done testing
  const [simulatedError, setSimulatedError] = useState<boolean>(false);
  const [simulatedEmpty, setSimulatedEmpty] = useState<boolean>(false);

  const loadTeamData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) return;

    if (simulatedError) {
      setError('Simulated failure: unable to retrieve site staff credentials.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };

      if (simulatedEmpty) {
        setTeamMembers([]);
        setTotalSiteCount(0);
        setIsLoading(false);
        return;
      }

      // Fetch team members with filters, all site members, roles, metrics in parallel
      const [filteredMembers, allMembers, rolesList, summaryMetrics] =
        await Promise.all([
          teamService.getTeamMembers(context, filters),
          teamService.getTeamMembers(context),
          teamService.getRoles(context),
          teamService.getTeamSummaryMetrics(context),
        ]);

      setTeamMembers(filteredMembers);
      setTotalSiteCount(allMembers.length);
      setRoles(rolesList);
      setMetrics(summaryMetrics);
    } catch (err) {
      setError(
        (err as Error).message || 'An unexpected error occurred while loading team data.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, filters, simulatedError, simulatedEmpty]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const handleCardFilterClick = (filterKey: string) => {
    setActiveCardFilter(filterKey);
    if (filterKey === 'ALL') {
      setFilters({ search: '', status: 'ALL', roleId: 'ALL' });
    } else if (filterKey === 'STATUS_ACTIVE') {
      setFilters((prev) => ({ ...prev, status: 'ACTIVE' }));
    } else if (filterKey === 'ROLES_SYSTEM') {
      // Find first system role or clear to all
      setFilters((prev) => ({ ...prev, roleId: 'ALL' }));
    } else if (filterKey === 'ROLES_CUSTOM') {
      setFilters((prev) => ({ ...prev, roleId: 'ALL' }));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      roleId: 'ALL',
    });
    setActiveCardFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-sm">
              Segment F · Team & Custom Roles
            </span>
            <span className="text-xs font-mono text-ink-muted">
              {activeSiteId} · {activeStudyId}
            </span>
          </div>
          <h1 className="font-serif font-bold text-2xl text-ink tracking-tight mt-1">
            Site Delegation & Team Directory
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Operational staff management, custom role authoring, and ICH-GCP delegation of authority logs.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadTeamData()}
            disabled={isLoading || isStudyLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-semibold text-ink-secondary bg-surface border border-border hover:bg-surface-soft rounded-sm transition-colors disabled:opacity-50"
            title="Refresh team dataset"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/pi/team/roles"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-serif font-semibold text-ink-secondary bg-surface-soft border border-border hover:border-ink-muted rounded-sm transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            <span>Manage Roles</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-serif font-bold text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Assign Role</span>
          </button>
        </div>
      </div>

      {/* QA Verification Toolbar for Definition of Done */}
      <div className="bg-surface-soft/60 border border-dashed border-border/80 rounded-sm px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-ink-muted">
          <span className="font-mono text-[10px] font-bold uppercase bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
            QA Sandbox
          </span>
          <span className="text-[11px]">Simulate edge conditions for acceptance verification:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSimulatedError((prev) => !prev);
              setSimulatedEmpty(false);
            }}
            className={`px-2 py-0.5 text-[11px] rounded font-mono border transition-colors ${
              simulatedError
                ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                : 'bg-surface text-ink-muted border-border hover:bg-surface-soft'
            }`}
          >
            {simulatedError ? 'Clear Error Sim' : 'Simulate Error'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedEmpty((prev) => !prev);
              setSimulatedError(false);
            }}
            className={`px-2 py-0.5 text-[11px] rounded font-mono border transition-colors ${
              simulatedEmpty
                ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                : 'bg-surface text-ink-muted border-border hover:bg-surface-soft'
            }`}
          >
            {simulatedEmpty ? 'Clear Empty Sim' : 'Simulate Empty'}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <TeamSummaryCards
        metrics={metrics}
        activeFilter={activeCardFilter}
        onFilterClick={handleCardFilterClick}
      />

      {/* Multi-criteria Filter Bar */}
      <TeamFiltersBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        totalCount={totalSiteCount}
        filteredCount={teamMembers.length}
        roles={roles}
        onOpenAssignModal={() => setIsAssignModalOpen(true)}
      />

      {/* Main Content Area / Edge States */}
      {isLoading || isStudyLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Team Data Load Failure"
          message={error}
          onRetry={() => {
            setSimulatedError(false);
            loadTeamData();
          }}
        />
      ) : teamMembers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-ink-muted" />}
          title="No Team Members Found"
          description={
            totalSiteCount === 0
              ? 'No team members are currently assigned to this clinical site.'
              : 'No team members match your active search and status filter criteria.'
          }
          actionLabel={totalSiteCount > 0 ? 'Reset Filters' : 'Assign Staff Member'}
          onAction={
            totalSiteCount > 0
              ? handleResetFilters
              : () => setIsAssignModalOpen(true)
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block">
            <TeamMemberTable members={teamMembers} />
          </div>

          {/* Mobile Stacked Card View (Hidden on desktop) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {teamMembers.map((member) => (
              <TeamMemberMobileCard key={member.user.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {isAssignModalOpen && (
        <AssignRoleModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={() => {
            loadTeamData();
          }}
          studyId={activeStudyId}
          siteId={activeSiteId}
          teamMembers={teamMembers}
          roles={roles}
        />
      )}
    </div>
  );
};
