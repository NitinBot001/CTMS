import React from 'react';
import { Task } from '../../types';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskCategoryBadge } from './TaskCategoryBadge';
import {
  ArrowRight,
  Calendar,
  AlertTriangle,
  User,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { isTaskOverdue, isTaskDueToday } from '../../utils/taskCalculations';

interface TaskTableProps {
  tasks: Task[];
  onAssignClick?: (task: Task) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onAssignClick,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-surface border border-border rounded-sm shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className="w-full text-left border-collapse text-xs"
          aria-label="Clinical Trial Tasks Directory"
        >
          <thead>
            <tr className="bg-surface-soft border-b border-border text-ink-muted uppercase font-semibold text-[11px] tracking-wider">
              <th scope="col" className="py-3 px-4">Task ID & Link</th>
              <th scope="col" className="py-3 px-3">Title & Action Summary</th>
              <th scope="col" className="py-3 px-3">Category</th>
              <th scope="col" className="py-3 px-3">Priority</th>
              <th scope="col" className="py-3 px-3">Status</th>
              <th scope="col" className="py-3 px-3">Assignee</th>
              <th scope="col" className="py-3 px-3">Due Date</th>
              <th scope="col" className="py-3 px-3">Approval</th>
              <th scope="col" className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => {
              const overdue = isTaskOverdue(task.dueDate, task.status);
              const dueToday = isTaskDueToday(task.dueDate) && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';

              return (
                <tr
                  key={task.id}
                  onClick={() => navigate(`/pi/tasks/${task.id}`)}
                  className={`hover:bg-surface-soft/80 transition-colors group cursor-pointer ${
                    overdue ? 'bg-rose-50/20' : dueToday ? 'bg-amber-50/15' : ''
                  }`}
                >
                  {/* Task ID & Entity */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
                        {task.id}
                      </span>
                    </div>
                    {task.relatedEntityType && task.relatedEntityId && (
                      <div className="mt-1">
                        <span className="text-[10px] font-mono text-ink-muted bg-stone-100 px-1.5 py-0.5 rounded-sm border border-border">
                          {task.relatedEntityType}: {task.relatedEntityId}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Title & Description */}
                  <td className="py-3.5 px-3 max-w-[280px]">
                    <span className="font-semibold text-ink block truncate leading-tight group-hover:text-primary transition-colors">
                      {task.title}
                    </span>
                    <span className="text-ink-muted text-[11px] block truncate mt-0.5">
                      {task.description}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <TaskCategoryBadge category={task.category} size="xs" />
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <TaskPriorityBadge priority={task.priority} size="xs" />
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <TaskStatusBadge status={task.status} size="xs" />
                  </td>

                  {/* Assignee */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {task.assignee ? (
                      <div>
                        <div className="flex items-center gap-1.5 font-medium text-ink">
                          <User className="w-3 h-3 text-ink-muted shrink-0" />
                          <span className="truncate max-w-[130px]">
                            {task.assignee.displayName}
                          </span>
                        </div>
                        <span className="text-[10px] text-ink-muted block pl-4 truncate max-w-[130px]">
                          {task.assignee.roleName || task.assignee.designation}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-ink-muted italic text-[11px]">Unassigned</span>
                        {onAssignClick && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssignClick(task);
                            }}
                            className="text-[10px] text-primary hover:underline font-medium"
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Due Date */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 font-mono text-[11px] text-ink">
                      <Calendar className="w-3 h-3 text-ink-muted" />
                      <span>{task.dueDate}</span>
                    </div>
                    {overdue && (
                      <div className="flex items-center gap-1 text-[10px] text-semantic-danger font-bold mt-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>OVERDUE</span>
                      </div>
                    )}
                    {dueToday && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-700 font-bold mt-0.5">
                        <span>DUE TODAY</span>
                      </div>
                    )}
                  </td>

                  {/* Approval requirement */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {task.requiresApproval ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-sm border border-purple-200">
                        <ShieldCheck className="w-3 h-3" />
                        PI Approval
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-ink-muted bg-surface-soft px-1.5 py-0.5 rounded-sm border border-border">
                        <CheckCircle className="w-3 h-3 text-ink-muted" />
                        Direct
                      </span>
                    )}
                  </td>

                  {/* Action link */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      to={`/pi/tasks/${task.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium transition-colors"
                      title={`View details for ${task.id}`}
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
