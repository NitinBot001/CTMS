import React from 'react';
import { ComplianceReviewStatus } from '../../types';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface DeviationReviewBadgeProps {
  status: ComplianceReviewStatus;
  size?: 'xs' | 'sm' | 'md';
}

export const DeviationReviewBadge: React.FC<DeviationReviewBadgeProps> = ({
  status,
  size = 'xs',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  switch (status) {
    case 'SIGN_OFF_REQUIRED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-sm border bg-red-50 text-semantic-danger border-red-300 ${sizeClasses[size]}`}
          title="Principal Investigator review pending"
        >
          <AlertTriangle className="w-3 h-3 text-semantic-danger" />
          <span>Sign-off Required</span>
        </span>
      );
    case 'NOT_REVIEWED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-stone-100 text-ink-secondary border-border ${sizeClasses[size]}`}
        >
          <Clock className="w-3 h-3 text-ink-muted" />
          <span>Pending Review</span>
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-sky-50 text-sky-800 border-sky-200 ${sizeClasses[size]}`}
        >
          <Clock className="w-3 h-3 text-sky-600" />
          <span>Under Review</span>
        </span>
      );
    case 'REVIEWED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-emerald-50 text-secondary border-emerald-200 ${sizeClasses[size]}`}
        >
          <CheckCircle2 className="w-3 h-3 text-secondary" />
          <span>Reviewed</span>
        </span>
      );
    default:
      return null;
  }
};
