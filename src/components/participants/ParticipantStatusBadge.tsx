import React from 'react';
import { ParticipantLifecycleStatus } from '../../types';

interface ParticipantStatusBadgeProps {
  status: ParticipantLifecycleStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const ParticipantStatusBadge: React.FC<ParticipantStatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'ACTIVE':
        return {
          label: 'Active',
          bg: 'bg-emerald-50 text-secondary-dark border-emerald-300',
          dot: 'bg-secondary',
        };
      case 'ENROLLED':
        return {
          label: 'Enrolled',
          bg: 'bg-rose-50 text-primary-dark border-rose-300',
          dot: 'bg-primary',
        };
      case 'ELIGIBLE':
        return {
          label: 'Eligible',
          bg: 'bg-amber-50 text-accent-dark border-amber-300',
          dot: 'bg-accent',
        };
      case 'SCREENING':
      case 'SCREENED':
        return {
          label: status === 'SCREENED' ? 'Screened' : 'Screening',
          bg: 'bg-sky-50 text-semantic-info border-sky-300',
          dot: 'bg-semantic-info',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          bg: 'bg-teal-50 text-teal-800 border-teal-300',
          dot: 'bg-teal-600',
        };
      case 'WITHDRAWN':
        return {
          label: 'Withdrawn',
          bg: 'bg-red-50 text-semantic-danger border-red-200',
          dot: 'bg-semantic-danger',
        };
      case 'SCREEN_FAILED':
        return {
          label: 'Screen Failed',
          bg: 'bg-stone-100 text-ink-muted border-stone-300',
          dot: 'bg-stone-400',
        };
      case 'LOST_TO_FOLLOW_UP':
        return {
          label: 'Lost to Follow-up',
          bg: 'bg-orange-50 text-orange-800 border-orange-300',
          dot: 'bg-orange-600',
        };
      default:
        return {
          label: status,
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
