import React from 'react';
import { VisitStatus } from '../../types';

interface VisitStatusBadgeProps {
  status: VisitStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const VisitStatusBadge: React.FC<VisitStatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'DUE':
        return {
          label: 'Due Now',
          bg: 'bg-amber-50 text-accent-dark border-amber-300 font-semibold',
          dot: 'bg-accent animate-pulse',
        };
      case 'OVERDUE':
        return {
          label: 'Overdue',
          bg: 'bg-red-50 text-semantic-danger border-red-300 font-semibold',
          dot: 'bg-semantic-danger',
        };
      case 'MISSED':
        return {
          label: 'Missed',
          bg: 'bg-rose-100 text-primary-dark border-rose-300 font-semibold',
          dot: 'bg-primary-dark',
        };
      case 'IN_PROGRESS':
        return {
          label: 'In Progress',
          bg: 'bg-sky-50 text-sky-800 border-sky-300',
          dot: 'bg-sky-600',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          bg: 'bg-emerald-50 text-secondary-dark border-emerald-300',
          dot: 'bg-secondary',
        };
      case 'SCHEDULED':
        return {
          label: 'Scheduled',
          bg: 'bg-stone-50 text-ink-secondary border-stone-300',
          dot: 'bg-stone-400',
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          bg: 'bg-stone-100 text-ink-muted border-stone-200',
          dot: 'bg-stone-400',
        };
      case 'NOT_APPLICABLE':
      default:
        return {
          label: status.replace('_', ' '),
          bg: 'bg-surface-soft text-ink-secondary border-border',
          dot: 'bg-ink-muted',
        };
    }
  };

  const config = getBadgeConfig();
  const sizeStyles = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-sm tracking-wide shrink-0 ${config.bg} ${sizeStyles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};
