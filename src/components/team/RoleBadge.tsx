import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { RoleType } from '../../types';

interface RoleBadgeProps {
  type: RoleType;
  name?: string;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  type,
  name,
  size = 'xs',
  showIcon = true,
}) => {
  const sizeClasses = {
    xs: 'text-[11px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-1.5',
  };

  const isSystem = type === 'SYSTEM';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-sm border ${
        isSystem
          ? 'bg-slate-100 text-slate-800 border-slate-300'
          : 'bg-amber-50 text-amber-900 border-amber-300'
      } ${sizeClasses[size]}`}
      title={isSystem ? 'Standard System Role template' : 'Site-specific Custom Role'}
    >
      {showIcon && (
        isSystem ? (
          <Shield className="w-3 h-3 text-slate-600 flex-shrink-0" />
        ) : (
          <Sparkles className="w-3 h-3 text-amber-700 flex-shrink-0" />
        )
      )}
      <span>{name || (isSystem ? 'SYSTEM' : 'CUSTOM')}</span>
      {name && (
        <span
          className={`text-[9px] uppercase tracking-wider font-semibold px-1 rounded ${
            isSystem ? 'bg-slate-200/80 text-slate-700' : 'bg-amber-200/80 text-amber-800'
          }`}
        >
          {type}
        </span>
      )}
    </span>
  );
};
