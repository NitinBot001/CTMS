import React from 'react';
import { DeviationStatus } from '../../types';

interface DeviationStatusBadgeProps {
  status: DeviationStatus;
  size?: 'xs' | 'sm' | 'md';
}

export const DeviationStatusBadge: React.FC<DeviationStatusBadgeProps> = ({
  status,
  size = 'xs',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const statusConfigs: Record<
    DeviationStatus,
    { label: string; className: string }
  > = {
    REPORTED: {
      label: 'Reported',
      className: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      className: 'bg-blue-50 text-blue-800 border-blue-200 font-medium',
    },
    ACTION_REQUIRED: {
      label: 'Action Required',
      className: 'bg-rose-50 text-semantic-danger border-rose-300 font-bold',
    },
    CAPA_IN_PROGRESS: {
      label: 'CAPA In Progress',
      className: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
    },
    RESOLVED: {
      label: 'Resolved',
      className: 'bg-emerald-50 text-secondary border-emerald-200 font-medium',
    },
    CLOSED: {
      label: 'Closed',
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
