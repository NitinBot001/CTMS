import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { taskService } from '../services/taskService';
import { teamService } from '../services/teamService';
import { Task, TeamMemberSummary } from '../types';
import { TaskStatusBadge } from '../components/tasks/TaskStatusBadge';
import { TaskPriorityBadge } from '../components/tasks/TaskPriorityBadge';
import { TaskCategoryBadge } from '../components/tasks/TaskCategoryBadge';
import { AssignTaskModal } from '../components/tasks/AssignTaskModal';
import { TaskApprovalModal } from '../components/tasks/TaskApprovalModal';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { isTaskOverdue, isTaskDueToday } from '../utils/taskCalculations';
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  User,
  ShieldCheck,
  ExternalLink,
  Play,
  Send,
  UserPlus,
  History,
} from 'lucide-react';

export const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const {
    activeStudy,
    activeSite,
    activeStudyId,
    activeSiteId,
    isLoading: isStudyLoading,
  } = useStudy();

  const [task, setTask] = useState<Task | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const loadTask = useCallback(async () => {
    if (!activeStudyId || !activeSiteId || !taskId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [taskData, members] = await Promise.all([
        taskService.getTaskById(context, taskId),
        teamService.getTeamMembers(context),
      ]);

      setTask(taskData);
      setTeamMembers(members);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to retrieve task details.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, taskId]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  // Status Action Handlers
  const handleStartProgress = async () => {
    if (!activeStudyId || !activeSiteId || !task) return;
    setIsActionLoading(true);
    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await taskService.updateTaskStatus(context, task.id, 'IN_PROGRESS');
      setTask(updated);
      setActionSuccess('Task status updated to In Progress.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task status.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!activeStudyId || !activeSiteId || !task) return;
    setIsActionLoading(true);
    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await taskService.submitTask(context, task.id);
      setTask(updated);
      setActionSuccess('Task submitted for Principal Investigator review.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit task.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCompleteDirect = async () => {
    if (!activeStudyId || !activeSiteId || !task) return;
    setIsActionLoading(true);
    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await taskService.completeTask(context, task.id);
      setTask(updated);
      setActionSuccess('Task marked as COMPLETED.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task.');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isStudyLoading || isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 md:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState
          title="Error Loading Task"
          message={error}
          onRetry={loadTask}
        />
      </div>
    );
  }

  // Cross-site / 404 Guard
  if (!task) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <EmptyState
          icon={<AlertCircle className="w-6 h-6" />}
          title="Task Record Not Found"
          description={`Task "${taskId}" does not exist in the current study/site scope (${activeSite?.name || activeSiteId}). Access across site boundaries is restricted.`}
          actionLabel="Return to Tasks Directory"
          onAction={() => navigate('/pi/tasks')}
        />
      </div>
    );
  }

  const overdue = isTaskOverdue(task.dueDate, task.status);
  const dueToday =
    isTaskDueToday(task.dueDate) &&
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED';

  // Lifecycle Stepper Steps
  const primarySteps = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  const currentStepIndex = primarySteps.findIndex((s) => s.key === task.status);

  // Helper to resolve linked entity route
  const getEntityLink = (type?: string, id?: string) => {
    if (!type || !id) return null;
    switch (type) {
      case 'SAFETY':
        return `/pi/safety/${id}`;
      case 'COMPLIANCE':
        return `/pi/compliance/${id}`;
      case 'VISIT':
        return `/pi/visits/${id}`;
      case 'PARTICIPANT':
        return `/pi/patients/${id}`;
      default:
        return null;
    }
  };

  const entityLink = getEntityLink(task.relatedEntityType, task.relatedEntityId);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
        <Link
          to="/pi/tasks"
          className="hover:text-primary flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Task Controls</span>
        </Link>
        <span>/</span>
        <span className="text-ink font-semibold">{task.id}</span>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Task Header */}
      <div className="bg-surface border border-border rounded-sm p-6 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-ink bg-surface-soft border border-border px-2 py-0.5 rounded-sm">
                {task.id}
              </span>
              <TaskCategoryBadge category={task.category} size="sm" />
              <TaskPriorityBadge priority={task.priority} size="sm" />
              <TaskStatusBadge status={task.status} size="sm" />
              {task.requiresApproval && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-800 bg-purple-50 px-2 py-0.5 rounded-sm border border-purple-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  PI Review Required
                </span>
              )}
            </div>

            <h1 className="text-2xl font-serif font-bold text-ink leading-tight">
              {task.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-ink-secondary pt-1">
              <div className="flex items-center gap-1.5 font-mono">
                <Building2 className="w-3.5 h-3.5 text-ink-muted" />
                <span>
                  {activeStudy?.code || task.studyId} · {activeSite?.name || task.siteId}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                <span>Due Date: <strong>{task.dueDate}</strong></span>
                {overdue && (
                  <span className="text-[10px] text-semantic-danger font-bold bg-rose-50 px-1.5 py-0.5 rounded-sm border border-rose-200">
                    OVERDUE
                  </span>
                )}
                {dueToday && (
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-200">
                    DUE TODAY
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Revision Alert Banner */}
        {task.status === 'REVISION_REQUIRED' && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase">
                Revision Required by Principal Investigator
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {task.approvals.length > 0
                  ? task.approvals[task.approvals.length - 1].comments
                  : 'Please review and amend the task deliverable per reviewer notes.'}
              </p>
            </div>
          </div>
        )}

        {/* Cancelled Banner */}
        {task.status === 'CANCELLED' && (
          <div className="p-4 bg-stone-100 border border-border rounded-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-ink-muted shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-ink-secondary uppercase">
                Task Cancelled / Voided
              </h4>
              <p className="text-xs text-ink-muted mt-0.5">
                This clinical operational task was cancelled or rejected by the Principal Investigator.
              </p>
            </div>
          </div>
        )}

        {/* Visual Lifecycle Stepper */}
        {task.status !== 'CANCELLED' && (
          <div className="pt-4 border-t border-border">
            <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block mb-3 font-semibold">
              Operational Task Progression
            </span>
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {primarySteps.map((step, idx) => {
                const isPassed = currentStepIndex > idx;
                const isCurrent = task.status === step.key;
                const isRevision = task.status === 'REVISION_REQUIRED' && step.key === 'IN_PROGRESS';

                return (
                  <div key={step.key} className="flex items-center flex-1 min-w-[90px]">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                          isRevision
                            ? 'bg-amber-100 border-amber-500 text-amber-900 ring-2 ring-amber-400'
                            : isCurrent
                            ? 'bg-primary text-white border-primary ring-2 ring-primary/30'
                            : isPassed
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-surface-soft text-ink-muted border-border'
                        }`}
                      >
                        {isPassed ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] font-medium mt-1 whitespace-nowrap text-center ${
                          isCurrent
                            ? 'text-primary font-bold'
                            : isRevision
                            ? 'text-amber-800 font-bold'
                            : isPassed
                            ? 'text-ink'
                            : 'text-ink-muted'
                        }`}
                      >
                        {isRevision ? 'Revision (In Prog)' : step.label}
                      </span>
                    </div>
                    {idx < primarySteps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 ${
                          isPassed ? 'bg-emerald-500' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Content + Sidebar Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Details, Related Entity, Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Description Card */}
          <Card className="p-5">
            <div className="pb-3 border-b border-border">
              <h3 className="text-sm font-serif font-bold text-ink flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                Action Narrative & Completion Instructions
              </h3>
            </div>
            <div className="pt-4 space-y-4">
              <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-ink-muted uppercase block">
                    Category
                  </span>
                  <span className="font-medium text-ink mt-0.5 block">
                    {task.category}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-ink-muted uppercase block">
                    Priority Level
                  </span>
                  <span className="font-medium text-ink mt-0.5 block">
                    {task.priority} Priority
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-ink-muted uppercase block">
                    Workflow Rule
                  </span>
                  <span className="font-medium text-ink mt-0.5 block">
                    {task.requiresApproval
                      ? 'Requires PI Sign-off'
                      : 'Direct Staff Sign-off'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Related Clinical Entity Linkage Card */}
          {task.relatedEntityType && task.relatedEntityId && (
            <Card className="p-5 border-l-4 border-l-primary">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-primary uppercase">
                    Cross-Linked Clinical Source Entity
                  </span>
                  <h4 className="text-sm font-bold text-ink mt-0.5">
                    {task.relatedEntityType}: {task.relatedEntityId}
                  </h4>
                  <p className="text-xs text-ink-muted mt-0.5">
                    This task is tied to operational resolution of source record{' '}
                    <strong>{task.relatedEntityId}</strong>.
                  </p>
                </div>

                {entityLink ? (
                  <Link
                    to={entityLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-sm transition-colors self-start sm:self-center"
                  >
                    <span>View Linked {task.relatedEntityType}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="text-xs text-ink-muted font-mono self-start sm:self-center">
                    {task.relatedEntityId}
                  </span>
                )}
              </div>
            </Card>
          )}

          {/* Approval Decision Trail */}
          <Card className="p-5">
            <div className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-ink flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                Principal Investigator Review & Approval Trail
              </h3>
              <span className="text-xs text-ink-muted font-mono">
                {task.approvals.length} records
              </span>
            </div>
            <div className="pt-4">
              {task.approvals.length === 0 ? (
                <p className="text-xs text-ink-muted italic">
                  No approval determinations recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {task.approvals.map((appr) => (
                    <div
                      key={appr.id}
                      className="p-3 bg-surface-soft border border-border rounded-sm space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold border ${
                              appr.decision === 'APPROVED'
                                ? 'bg-emerald-50 text-secondary border-emerald-300'
                                : appr.decision === 'REVISION_REQUIRED'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-rose-50 text-semantic-danger border-rose-300'
                            }`}
                          >
                            {appr.decision}
                          </span>
                          <span className="font-semibold text-ink">
                            {appr.reviewerName || appr.reviewerId}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-ink-muted">
                          {new Date(appr.reviewedAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-ink leading-relaxed pl-1 border-l-2 border-border">
                        {appr.comments}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Delegation Assignment History */}
          <Card className="p-5">
            <div className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-ink flex items-center gap-2">
                <History className="w-4 h-4 text-ink-muted" />
                Delegation of Responsibility History
              </h3>
              <span className="text-xs text-ink-muted font-mono">
                {task.assignments.length} assignments
              </span>
            </div>
            <div className="pt-4">
              {task.assignments.length === 0 ? (
                <p className="text-xs text-ink-muted italic">
                  Task remains in draft state without delegation history.
                </p>
              ) : (
                <div className="space-y-2">
                  {task.assignments.map((asgn) => (
                    <div
                      key={asgn.id}
                      className="flex items-center justify-between p-2.5 bg-surface-soft border border-border rounded-sm text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            asgn.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : 'bg-stone-300'
                          }`}
                        />
                        <span className="font-mono font-bold text-ink">
                          {asgn.userId}
                        </span>
                        <span className="text-ink-muted">
                          assigned by {asgn.assignedBy}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-ink-muted">
                          {new Date(asgn.assignedAt).toLocaleDateString()}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-sm ${
                            asgn.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-secondary'
                              : 'bg-stone-200 text-ink-muted'
                          }`}
                        >
                          {asgn.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (1 col): Assignee, Action Controls, Audit Info */}
        <div className="space-y-6">
          {/* Active Assignee Card */}
          <Card className="p-5">
            <div className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <h3 className="text-xs font-serif font-bold text-ink-secondary uppercase tracking-wider">
                Assigned Staff Member
              </h3>
              {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {task.assignee ? 'Reassign' : 'Assign'}
                </button>
              )}
            </div>
            <div className="pt-4">
              {task.assignee ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink">
                        {task.assignee.displayName}
                      </h4>
                      <p className="text-xs text-ink-secondary">
                        {task.assignee.roleName || task.assignee.designation}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/60 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Email:</span>
                      <span className="font-mono text-ink truncate max-w-[170px]">
                        {task.assignee.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">User ID:</span>
                      <span className="font-mono text-ink">{task.assignee.userId}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <span className="text-xs text-ink-muted block">
                    No staff member delegated to this task.
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIsAssignModalOpen(true)}
                    className="w-full text-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    Assign Site Personnel
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Operational Action Controls Card */}
          <Card className="p-5 border-t-4 border-t-primary">
            <div className="pb-3 border-b border-border">
              <h3 className="text-xs font-serif font-bold text-ink-secondary uppercase tracking-wider">
                Lifecycle Action Controls
              </h3>
            </div>
            <div className="pt-4 space-y-3">
              {/* Draft State */}
              {task.status === 'DRAFT' && (
                <Button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="w-full text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Assign & Activate Task
                </Button>
              )}

              {/* Assigned State */}
              {task.status === 'ASSIGNED' && (
                <Button
                  onClick={handleStartProgress}
                  disabled={isActionLoading}
                  className="w-full text-xs"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  {isActionLoading ? 'Starting...' : 'Mark In Progress'}
                </Button>
              )}

              {/* In Progress State */}
              {task.status === 'IN_PROGRESS' && (
                <>
                  {task.requiresApproval ? (
                    <Button
                      onClick={handleSubmitForReview}
                      disabled={isActionLoading}
                      className="w-full text-xs"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      {isActionLoading ? 'Submitting...' : 'Submit for PI Review'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCompleteDirect}
                      disabled={isActionLoading}
                      className="w-full text-xs bg-secondary hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      {isActionLoading ? 'Completing...' : 'Mark Completed (Direct)'}
                    </Button>
                  )}
                </>
              )}

              {/* Submitted or Under Review State */}
              {(task.status === 'SUBMITTED' || task.status === 'UNDER_REVIEW') && (
                <Button
                  onClick={() => setIsApprovalModalOpen(true)}
                  className="w-full text-xs bg-purple-700 hover:bg-purple-800 text-white"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  Conduct PI Review & Approval
                </Button>
              )}

              {/* Approved State */}
              {task.status === 'APPROVED' && (
                <Button
                  onClick={handleCompleteDirect}
                  disabled={isActionLoading}
                  className="w-full text-xs bg-secondary hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  {isActionLoading ? 'Completing...' : 'Finalize & Mark Completed'}
                </Button>
              )}

              {/* Revision Required State */}
              {task.status === 'REVISION_REQUIRED' && (
                <Button
                  onClick={handleStartProgress}
                  disabled={isActionLoading}
                  className="w-full text-xs bg-amber-700 hover:bg-amber-800 text-white"
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  {isActionLoading ? 'Resuming...' : 'Resume Progress (Address Notes)'}
                </Button>
              )}

              {/* Completed State */}
              {task.status === 'COMPLETED' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-center">
                  <CheckCircle2 className="w-5 h-5 text-secondary mx-auto mb-1" />
                  <span className="text-xs font-bold text-secondary block">
                    Task Successfully Completed
                  </span>
                  <span className="text-[11px] text-ink-muted font-mono block mt-0.5">
                    {task.completedAt
                      ? new Date(task.completedAt).toLocaleString()
                      : 'Recorded'}
                  </span>
                </div>
              )}

              {/* Cancelled State */}
              {task.status === 'CANCELLED' && (
                <div className="p-3 bg-stone-100 border border-border rounded-sm text-center">
                  <span className="text-xs font-bold text-ink-secondary block">
                    Task Cancelled / Inactive
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Audit & Tracking Metadata Card */}
          <Card className="p-5">
            <div className="pb-3 border-b border-border">
              <h3 className="text-xs font-serif font-bold text-ink-secondary uppercase tracking-wider">
                System Record Metadata
              </h3>
            </div>
            <div className="pt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-muted">Created By:</span>
                <span className="text-ink font-medium">{task.createdBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Created At:</span>
                <span className="font-mono text-ink">
                  {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Last Updated:</span>
                <span className="font-mono text-ink">
                  {new Date(task.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {task.submittedAt && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">Submitted At:</span>
                  <span className="font-mono text-ink">
                    {new Date(task.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {task.completedAt && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">Completed At:</span>
                  <span className="font-mono text-ink">
                    {new Date(task.completedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {isAssignModalOpen && (
        <AssignTaskModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={loadTask}
          studyId={activeStudyId || ''}
          siteId={activeSiteId || ''}
          task={task}
          teamMembers={teamMembers}
        />
      )}

      {isApprovalModalOpen && (
        <TaskApprovalModal
          isOpen={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
          onSuccess={loadTask}
          studyId={activeStudyId || ''}
          siteId={activeSiteId || ''}
          task={task}
        />
      )}
    </div>
  );
};
