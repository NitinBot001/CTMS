import React from 'react';
import { FollowUpStatus } from '../../types';
import { AlertTriangle, Clock, Check, Calendar } from 'lucide-react';

interface SafetyFollowUpBadgeProps {
  status: FollowUpStatus;
  dueDate?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

export const SafetyFollowUpBadge: React.FC<SafetyFollowUpBadgeProps> = ({
  status,
  dueDate,
  size = 'md',
  className = '',
}) => {
  const getConfig = () => {
    switch (status) {
      case 'OVERDUE':
        return {
          label: 'Overdue Follow-up',
          bg: 'bg-red-50 text-semantic-danger border-red-300 font-bold',
          icon: AlertTriangle,
          iconColor: 'text-semantic-danger',
        };
      case 'DUE':
        return {
          label: 'Follow-up Due',
          bg: 'bg-amber-50 text-accent-dark border-amber-300 font-semibold',
          icon: Calendar,
          iconColor: 'text-accent',
        };
      case 'PENDING':
        return {
          label: 'Follow-up Pending',
          bg: 'bg-sky-50 text-sky-800 border-sky-300',
          icon: Clock,
          iconColor: 'text-sky-600',
        };
      case 'COMPLETED':
        return {
          label: 'Follow-up Complete',
          bg: 'bg-emerald-50 text-secondary-dark border-emerald-300',
          icon: Check,
          iconColor: 'text-secondary',
        };
      case 'NOT_REQUIRED':
      default:
        return {
          label: 'No Follow-up Required',
          bg: 'bg-stone-50 text-ink-muted border-border',
          icon: null,
          iconColor: '',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;
  const sizeStyles = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 border rounded-sm tracking-wide shrink-0 ${config.bg} ${sizeStyles}`}
      >
        {Icon && <Icon className={`w-3 h-3 shrink-0 ${config.iconColor}`} aria-hidden="true" />}
        <span>{config.label}</span>
      </span>
      {dueDate && (status === 'OVERDUE' || status === 'DUE') && (
        <span className="font-mono text-[10px] text-ink-muted">Due: {dueDate}</span>
      )}
    </div>
  );
};
