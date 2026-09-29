import React from 'react';
import { DeviationScope } from '../../types';
import { User, Building2, BookOpen } from 'lucide-react';

interface DeviationScopeBadgeProps {
  scope: DeviationScope;
  size?: 'xs' | 'sm';
}

export const DeviationScopeBadge: React.FC<DeviationScopeBadgeProps> = ({
  scope,
  size = 'xs',
}) => {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
  };

  switch (scope) {
    case 'PARTICIPANT':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-purple-50 text-purple-800 border-purple-200 ${sizeClasses[size]}`}
          title="Participant-scoped Deviation: Specific subject protocol variance"
        >
          <User className="w-2.5 h-2.5" />
          <span>Participant</span>
        </span>
      );
    case 'SITE':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-indigo-50 text-indigo-800 border-indigo-200 ${sizeClasses[size]}`}
          title="Site-scoped Deviation: Operational facility, staffing or equipment variance"
        >
          <Building2 className="w-2.5 h-2.5" />
          <span>Site Facility</span>
        </span>
      );
    case 'STUDY':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-sm border bg-cyan-50 text-cyan-800 border-cyan-200 ${sizeClasses[size]}`}
          title="Study-scoped Deviation: Trial-wide documentation or versioning variance"
        >
          <BookOpen className="w-2.5 h-2.5" />
          <span>Study Level</span>
        </span>
      );
    default:
      return null;
  }
};
