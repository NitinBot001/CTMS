import React from 'react';
import { Task } from '../../types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskCategoryBadge } from './TaskCategoryBadge';
import { Card } from '../ui/Card';
import { ArrowRight, Calendar, AlertTriangle, User, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isTaskOverdue, isTaskDueToday } from '../../utils/taskCalculations';

interface TaskMobileCardProps {
  task: Task;
}

export const TaskMobileCard: React.FC<TaskMobileCardProps> = ({ task }) => {
  const overdue = isTaskOverdue(task.dueDate, task.status);
  const dueToday =
    isTaskDueToday(task.dueDate) &&
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED';

  return (
    <Card
      className={`p-4 border transition-all ${
        overdue ? 'bg-rose-50/20 border-rose-200' : 'bg-surface border-border'
      }`}
    >
      <div className="space-y-3">
        {/* Top Header: ID, Priority, Category */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
              {task.id}
            </span>
            <TaskCategoryBadge category={task.category} size="xs" />
          </div>
          <TaskPriorityBadge priority={task.priority} size="xs" />
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="text-sm font-semibold font-heading text-ink leading-snug">
            {task.title}
          </h4>
          <p className="text-xs text-ink-muted line-clamp-2 mt-1">
            {task.description}
          </p>
        </div>

        {/* Entity Link Chip */}
        {task.relatedEntityType && task.relatedEntityId && (
          <div className="text-[11px] font-mono text-ink-muted bg-stone-100 px-2 py-0.5 rounded-sm border border-border inline-block">
            {task.relatedEntityType}: {task.relatedEntityId}
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60 text-ink-secondary">
          <div>
            <span className="text-[10px] uppercase font-semibold text-ink-muted block">
              Assignee
            </span>
            <span className="flex items-center gap-1 font-medium text-ink truncate mt-0.5">
              <User className="w-3 h-3 text-ink-muted shrink-0" />
              {task.assignee ? task.assignee.displayName : 'Unassigned'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-ink-muted block">
              Due Date
            </span>
            <span className="font-mono flex items-center gap-1 mt-0.5 text-xs text-ink">
              <Calendar className="w-3 h-3 text-ink-muted" />
              {task.dueDate}
            </span>
            {overdue && (
              <span className="text-[10px] text-semantic-danger font-bold flex items-center gap-0.5 mt-0.5">
                <AlertTriangle className="w-2.5 h-2.5" /> OVERDUE
              </span>
            )}
            {dueToday && (
              <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                DUE TODAY
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-ink-muted block">
              Status
            </span>
            <div className="mt-0.5">
              <TaskStatusBadge status={task.status} size="xs" />
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-ink-muted block">
              Workflow
            </span>
            <div className="mt-0.5">
              {task.requiresApproval ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-700">
                  <ShieldCheck className="w-3 h-3" /> PI Approval
                </span>
              ) : (
                <span className="text-[10px] text-ink-muted">Direct</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Link Footer */}
        <div className="pt-2 border-t border-border/60 flex justify-end">
          <Link
            to={`/pi/tasks/${task.id}`}
            className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
          >
            <span>View Task Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
};
