import React, { useState, useEffect, useCallback } from 'react';
import { useStudy } from '../context/StudyContext';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { teamService } from '../services/teamService';
import {
  Task,
  TaskFilters,
  TaskSummaryMetrics,
  TeamMemberSummary,
} from '../types';
import { TaskSummaryCards } from '../components/tasks/TaskSummaryCards';
import { TaskFiltersBar } from '../components/tasks/TaskFiltersBar';
import { TaskTable } from '../components/tasks/TaskTable';
import { TaskMobileCard } from '../components/tasks/TaskMobileCard';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { AssignTaskModal } from '../components/tasks/AssignTaskModal';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { RefreshCw, ListTodo, Plus } from 'lucide-react';

export const TaskManagementPage: React.FC = () => {
  const {
    activeStudy,
    activeSite,
    activeStudyId,
    activeSiteId,
    isLoading: isStudyLoading,
  } = useStudy();
  const { currentUser } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalSiteCount, setTotalSiteCount] = useState<number>(0);
  const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>([]);
  const [metrics, setMetrics] = useState<TaskSummaryMetrics>({
    total: 0,
    myOpen: 0,
    dueToday: 0,
    overdue: 0,
    pendingReview: 0,
    completed: 0,
  });

  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    category: 'ALL',
    assigneeId: 'ALL',
    dueDateFilter: 'ALL',
    requiresApproval: 'ALL',
  });

  const [activeCardFilter, setActiveCardFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);

  // QA simulation state
  const [simulatedError, setSimulatedError] = useState<boolean>(false);
  const [simulatedEmpty, setSimulatedEmpty] = useState<boolean>(false);

  const loadTasksData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (simulatedError) {
        throw new Error('Simulated repository error: unable to load study tasks log.');
      }

      if (simulatedEmpty) {
        setTasks([]);
        setTotalSiteCount(0);
        setMetrics({
          total: 0,
          myOpen: 0,
          dueToday: 0,
          overdue: 0,
          pendingReview: 0,
          completed: 0,
        });
        setIsLoading(false);
        return;
      }

      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const currentUserId = currentUser?.id || '';

      const [filteredData, summary, allTasks, members] = await Promise.all([
        taskService.getTasks(context, filters),
        taskService.getTaskSummary(context, currentUserId),
        taskService.getTasks(context),
        teamService.getTeamMembers(context),
      ]);

      setTasks(filteredData);
      setMetrics(summary);
      setTotalSiteCount(allTasks.length);
      setTeamMembers(members);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while loading clinical trial tasks.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, filters, simulatedError, simulatedEmpty]);

  useEffect(() => {
    loadTasksData();
  }, [loadTasksData]);

  // Handle Card shortcut filtering
  const handleCardFilterClick = (filterKey: string) => {
    setActiveCardFilter(filterKey);

    if (filterKey === 'ALL') {
      setFilters({
        ...filters,
        status: 'ALL',
        assigneeId: 'ALL',
        dueDateFilter: 'ALL',
      });
    } else if (filterKey === 'MY_OPEN') {
      setFilters({
        ...filters,
        status: 'OPEN',
        assigneeId: 'MY_TASKS',
        dueDateFilter: 'ALL',
      });
    } else if (filterKey === 'DUE_TODAY') {
      setFilters({
        ...filters,
        status: 'ALL',
        dueDateFilter: 'TODAY',
      });
    } else if (filterKey === 'OVERDUE') {
      setFilters({
        ...filters,
        status: 'ALL',
        dueDateFilter: 'OVERDUE',
      });
    } else if (filterKey === 'PENDING_REVIEW') {
      setFilters({
        ...filters,
        status: 'UNDER_REVIEW',
        dueDateFilter: 'ALL',
      });
    } else if (filterKey === 'COMPLETED') {
      setFilters({
        ...filters,
        status: 'COMPLETED',
        dueDateFilter: 'ALL',
      });
    }
  };

  const handleResetFilters = () => {
    setActiveCardFilter('ALL');
    setFilters({
      search: '',
      status: 'ALL',
      priority: 'ALL',
      category: 'ALL',
      assigneeId: 'ALL',
      dueDateFilter: 'ALL',
      requiresApproval: 'ALL',
    });
  };

  if (isStudyLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-ink-muted uppercase">
            <span>Clinical Operations</span>
            <span>/</span>
            <span className="text-ink font-semibold">Task Controls</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-ink mt-1">
            Task Management & Approvals
          </h1>
          <p className="text-xs text-ink-secondary mt-1">
            Operational task directory, GCP delegation tracking, and PI review workflow for{' '}
            <strong>{activeSite?.name || activeSiteId}</strong> ({activeStudy?.code || activeStudyId})
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadTasksData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink-secondary bg-surface-soft hover:bg-stone-200 border border-border rounded-sm transition-colors"
            title="Refresh tasks data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <TaskSummaryCards
        metrics={metrics}
        activeFilter={activeCardFilter}
        onFilterClick={handleCardFilterClick}
      />

      {/* Multi-Criteria Filters Bar */}
      <TaskFiltersBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        totalCount={totalSiteCount}
        filteredCount={tasks.length}
        teamMembers={teamMembers.map((m) => ({
          id: m.user.id,
          displayName: m.user.displayName,
          designation: m.user.designation,
        }))}
        onCreateTaskClick={() => setIsCreateModalOpen(true)}
      />

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to Load Study Tasks"
          message={error}
          onRetry={loadTasksData}
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="w-6 h-6" />}
          title="No Study Tasks Found"
          description={
            totalSiteCount === 0
              ? 'No operational clinical trial tasks exist for this site scope.'
              : 'No tasks match the selected search, status, or filter criteria.'
          }
          actionLabel={totalSiteCount > 0 ? 'Clear Filters' : 'Create First Task'}
          onAction={totalSiteCount > 0 ? handleResetFilters : () => setIsCreateModalOpen(true)}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <TaskTable
              tasks={tasks}
              onAssignClick={(task) => setAssigningTask(task)}
            />
          </div>

          {/* Mobile Stacked Card View */}
          <div className="md:hidden space-y-3">
            {tasks.map((task) => (
              <TaskMobileCard key={task.id} task={task} />
            ))}
          </div>
        </>
      )}

      {/* QA Edge-State Toggle Sandbox */}
      <div className="pt-6 border-t border-border/40 text-[11px] text-ink-muted flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink-secondary">QA Edge-State Controls:</span>
          <button
            type="button"
            onClick={() => setSimulatedError(!simulatedError)}
            className={`px-2 py-0.5 rounded-sm border ${
              simulatedError
                ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold'
                : 'bg-surface-soft border-border text-ink-muted hover:text-ink'
            }`}
          >
            {simulatedError ? 'Clear Error State' : 'Simulate Error State'}
          </button>
          <button
            type="button"
            onClick={() => setSimulatedEmpty(!simulatedEmpty)}
            className={`px-2 py-0.5 rounded-sm border ${
              simulatedEmpty
                ? 'bg-amber-100 border-amber-300 text-amber-800 font-bold'
                : 'bg-surface-soft border-border text-ink-muted hover:text-ink'
            }`}
          >
            {simulatedEmpty ? 'Clear Empty State' : 'Simulate Empty State'}
          </button>
        </div>
        <div>
          Reference Date: <strong className="font-mono text-ink">2026-09-29</strong>
        </div>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadTasksData}
        studyId={activeStudyId || ''}
        siteId={activeSiteId || ''}
        teamMembers={teamMembers}
      />

      {assigningTask && (
        <AssignTaskModal
          isOpen={Boolean(assigningTask)}
          onClose={() => setAssigningTask(null)}
          onSuccess={loadTasksData}
          studyId={activeStudyId || ''}
          siteId={activeSiteId || ''}
          task={assigningTask}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
};
