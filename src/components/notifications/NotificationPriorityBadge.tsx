import React from 'react';
import { NotificationPriority } from '../../types';

interface NotificationPriorityBadgeProps {
  priority: NotificationPriority;
  size?: 'sm' | 'md';
}

export const NotificationPriorityBadge: React.FC<NotificationPriorityBadgeProps> = ({
  priority,
  size = 'sm',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  switch (priority) {
    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-xs border bg-rose-50 text-rose-800 border-rose-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          <span>HIGH</span>
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-xs border bg-amber-50 text-amber-800 border-amber-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>MEDIUM</span>
        </span>
      );
    case 'NORMAL':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-xs border bg-slate-100 text-slate-700 border-slate-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>NORMAL</span>
        </span>
      );
  }
};
