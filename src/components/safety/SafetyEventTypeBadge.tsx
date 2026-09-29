import React from 'react';
import { SafetyEventType } from '../../types';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface SafetyEventTypeBadgeProps {
  type: SafetyEventType;
  size?: 'sm' | 'md';
  className?: string;
}

export const SafetyEventTypeBadge: React.FC<SafetyEventTypeBadgeProps> = ({
  type,
  size = 'md',
  className = '',
}) => {
  const isSae = type === 'SAE';
  const sizeStyles = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold border rounded-sm tracking-wide shrink-0 ${sizeStyles} ${
        isSae
          ? 'bg-rose-50 text-primary-dark border-rose-300 shadow-subtle'
          : 'bg-stone-100 text-ink-secondary border-stone-300'
      } ${className}`}
    >
      {isSae ? (
        <AlertTriangle className="w-3.5 h-3.5 text-primary-dark shrink-0" aria-hidden="true" />
      ) : (
        <ShieldCheck className="w-3.5 h-3.5 text-ink-muted shrink-0" aria-hidden="true" />
      )}
      <span>{type}</span>
    </span>
  );
};
