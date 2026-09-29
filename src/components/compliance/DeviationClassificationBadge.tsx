import React from 'react';
import { DeviationClassification } from '../../types';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';

interface DeviationClassificationBadgeProps {
  classification: DeviationClassification;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
}

export const DeviationClassificationBadge: React.FC<DeviationClassificationBadgeProps> = ({
  classification,
  size = 'xs',
  showIcon = true,
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  switch (classification) {
    case 'CRITICAL':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-sm border bg-red-50 text-semantic-danger border-red-200 ${sizeClasses[size]}`}
          title="Critical Protocol Deviation: Immediate corrective action and expedited safety/sponsor reporting required"
        >
          {showIcon && <AlertOctagon className={iconSizes[size]} />}
          <span>Critical</span>
        </span>
      );
    case 'MAJOR':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-sm border bg-amber-50 text-amber-800 border-amber-200 ${sizeClasses[size]}`}
          title="Major Protocol Deviation: Potential impact on participant rights, safety, or study data integrity"
        >
          {showIcon && <AlertTriangle className={iconSizes[size]} />}
          <span>Major</span>
        </span>
      );
    case 'MINOR':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-slate-50 text-slate-700 border-slate-200 ${sizeClasses[size]}`}
          title="Minor Protocol Deviation: Logged variance with no significant impact on study safety or integrity"
        >
          {showIcon && <Info className={iconSizes[size]} />}
          <span>Minor</span>
        </span>
      );
  }
};
