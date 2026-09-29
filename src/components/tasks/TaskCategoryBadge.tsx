import React from 'react';
import { TaskCategory } from '../../types';

interface TaskCategoryBadgeProps {
  category: TaskCategory;
  size?: 'xs' | 'sm' | 'md';
}

export const TaskCategoryBadge: React.FC<TaskCategoryBadgeProps> = ({
  category,
  size = 'xs',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const categoryConfigs: Record<
    TaskCategory,
    { label: string; className: string }
  > = {
    SAFETY: {
      label: 'Safety',
      className: 'bg-rose-50 text-rose-800 border-rose-200 font-medium',
    },
    COMPLIANCE: {
      label: 'Compliance',
      className: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    },
    PARTICIPANT: {
      label: 'Participant',
      className: 'bg-indigo-50 text-indigo-800 border-indigo-200 font-medium',
    },
    VISIT: {
      label: 'Visit',
      className: 'bg-sky-50 text-sky-800 border-sky-200 font-medium',
    },
    DOCUMENT: {
      label: 'Document',
      className: 'bg-purple-50 text-purple-800 border-purple-200 font-medium',
    },
    REPORT: {
      label: 'Report',
      className: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium',
    },
    PHARMACY: {
      label: 'Pharmacy',
      className: 'bg-teal-50 text-teal-800 border-teal-200 font-medium',
    },
    TRAINING: {
      label: 'Training',
      className: 'bg-blue-50 text-blue-800 border-blue-200 font-medium',
    },
    OTHER: {
      label: 'Other',
      className: 'bg-slate-50 text-slate-700 border-slate-200 font-medium',
    },
  };

  const config = categoryConfigs[category] || {
    label: category,
    className: 'bg-surface-soft text-ink border-border font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-sm border ${config.className} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
};
