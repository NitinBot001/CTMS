import React from 'react';
import { PIReviewStatus } from '../../types';
import { CheckCircle2, AlertCircle, Clock, FileCheck } from 'lucide-react';

interface SafetyReviewBadgeProps {
  status: PIReviewStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const SafetyReviewBadge: React.FC<SafetyReviewBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const getConfig = () => {
    switch (status) {
      case 'SIGN_OFF_REQUIRED':
        return {
          label: 'Sign-off Required',
          bg: 'bg-red-50 text-semantic-danger border-red-300 font-bold',
          icon: AlertCircle,
          iconColor: 'text-semantic-danger',
        };
      case 'NOT_REVIEWED':
        return {
          label: 'Pending Review',
          bg: 'bg-amber-50 text-accent-dark border-amber-300 font-semibold',
          icon: Clock,
          iconColor: 'text-accent',
        };
      case 'UNDER_REVIEW':
        return {
          label: 'Under Review',
          bg: 'bg-sky-50 text-sky-800 border-sky-300',
          icon: Clock,
          iconColor: 'text-sky-600',
        };
      case 'REVIEWED':
      default:
        return {
          label: 'PI Reviewed',
          bg: 'bg-emerald-50 text-secondary-dark border-emerald-300',
          icon: CheckCircle2,
          iconColor: 'text-secondary',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon || FileCheck;
  const sizeStyles = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-sm tracking-wide shrink-0 ${config.bg} ${sizeStyles} ${className}`}
    >
      <Icon className={`w-3 h-3 shrink-0 ${config.iconColor}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};
