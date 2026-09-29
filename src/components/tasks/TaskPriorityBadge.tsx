import React from 'react';
import { TaskPriority } from '../../types';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  size?: 'xs' | 'sm' | 'md';
}

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({
  priority,
  size = 'xs',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const priorityConfigs: Record<
    TaskPriority,
    { label: string; className: string; dotClass: string }
  > = {
    HIGH: {
      label: 'High Priority',
      className: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
      dotClass: 'bg-rose-500',
    },
    MEDIUM: {
      label: 'Medium',
      className: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
      dotClass: 'bg-amber-500',
    },
    NORMAL: {
      label: 'Normal',
      className: 'bg-slate-50 text-slate-700 border-slate-200 font-normal',
      dotClass: 'bg-slate-400',
    },
  };

  const config = priorityConfigs[priority] || {
    label: priority,
    className: 'bg-surface-soft text-ink border-border',
    dotClass: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border ${config.className} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
};
