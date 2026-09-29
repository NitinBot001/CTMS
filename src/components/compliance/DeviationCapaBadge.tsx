import React from 'react';
import { CapaStatus } from '../../types';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface DeviationCapaBadgeProps {
  status: CapaStatus;
  targetDate?: string;
  size?: 'xs' | 'sm' | 'md';
}

export const DeviationCapaBadge: React.FC<DeviationCapaBadgeProps> = ({
  status,
  targetDate,
  size = 'xs',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  switch (status) {
    case 'OVERDUE':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-sm border bg-red-50 text-semantic-danger border-red-300 ${sizeClasses[size]}`}
          title={targetDate ? `CAPA Overdue: target was ${targetDate}` : 'CAPA Overdue'}
        >
          <AlertCircle className="w-3 h-3 text-semantic-danger" />
          <span>CAPA Overdue</span>
        </span>
      );
    case 'PENDING':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-sm border bg-amber-50 text-amber-800 border-amber-200 ${sizeClasses[size]}`}
        >
          <Clock className="w-3 h-3 text-amber-600" />
          <span>CAPA Pending</span>
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-blue-50 text-blue-800 border-blue-200 ${sizeClasses[size]}`}
        >
          <Clock className="w-3 h-3 text-blue-600" />
          <span>CAPA Active</span>
        </span>
      );
    case 'COMPLETED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-emerald-50 text-secondary border-emerald-200 ${sizeClasses[size]}`}
        >
          <CheckCircle2 className="w-3 h-3 text-secondary" />
          <span>CAPA Complete</span>
        </span>
      );
    case 'NOT_REQUIRED':
    default:
      return (
        <span
          className={`inline-flex items-center font-normal rounded-sm border bg-surface-soft text-ink-muted border-border ${sizeClasses[size]}`}
        >
          Not Required
        </span>
      );
  }
};
