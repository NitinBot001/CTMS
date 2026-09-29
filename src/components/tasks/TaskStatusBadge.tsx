import React from 'react';
import { TaskStatus } from '../../types';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: 'xs' | 'sm' | 'md';
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({
  status,
  size = 'xs',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const statusConfigs: Record<
    TaskStatus,
    { label: string; className: string }
  > = {
    DRAFT: {
      label: 'Draft',
      className: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
    },
    ASSIGNED: {
      label: 'Assigned',
      className: 'bg-sky-50 text-sky-800 border-sky-200 font-medium',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      className: 'bg-blue-50 text-blue-800 border-blue-200 font-medium',
    },
    SUBMITTED: {
      label: 'Submitted',
      className: 'bg-purple-50 text-purple-800 border-purple-200 font-medium',
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      className: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
    },
    APPROVED: {
      label: 'Approved',
      className: 'bg-teal-50 text-teal-800 border-teal-200 font-medium',
    },
    COMPLETED: {
      label: 'Completed',
      className: 'bg-emerald-50 text-secondary border-emerald-200 font-medium',
    },
    REVISION_REQUIRED: {
      label: 'Revision Required',
      className: 'bg-rose-50 text-semantic-danger border-rose-300 font-bold',
    },
    CANCELLED: {
      label: 'Cancelled',
      className: 'bg-surface-soft text-ink-muted border-border font-medium',
    },
  };

  const config = statusConfigs[status] || {
    label: status,
    className: 'bg-surface-soft text-ink border-border',
  };

  return (
    <span
      className={`inline-flex items-center rounded-sm border ${config.className} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
};
