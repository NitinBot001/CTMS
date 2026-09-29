import React from 'react';
import { UserStatus } from '../../types';

interface UserStatusBadgeProps {
  status: UserStatus;
  size?: 'xs' | 'sm' | 'md';
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({
  status,
  size = 'xs',
}) => {
  const sizeClasses = {
    xs: 'text-[11px] px-2 py-0.5 gap-1.5',
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-2',
  };

  const isActive = status === 'ACTIVE';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-sm border ${
        isActive
          ? 'bg-emerald-50 text-secondary border-emerald-200'
          : 'bg-surface-soft text-ink-muted border-border'
      } ${sizeClasses[size]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isActive ? 'bg-secondary animate-pulse' : 'bg-gray-400'
        }`}
      />
      <span>{isActive ? 'Active' : 'Inactive'}</span>
    </span>
  );
};
