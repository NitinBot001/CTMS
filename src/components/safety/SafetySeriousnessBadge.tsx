import React from 'react';
import { Seriousness } from '../../types';

interface SafetySeriousnessBadgeProps {
  seriousness: Seriousness;
  size?: 'sm' | 'md';
  className?: string;
}

export const SafetySeriousnessBadge: React.FC<SafetySeriousnessBadgeProps> = ({
  seriousness,
  size = 'md',
  className = '',
}) => {
  const getSeriousnessConfig = () => {
    switch (seriousness) {
      case 'HOSPITALIZATION':
        return {
          label: 'Hospitalization',
          bg: 'bg-rose-100 text-primary-dark border-rose-300 font-semibold',
        };
      case 'LIFE_THREATENING':
        return {
          label: 'Life Threatening',
          bg: 'bg-red-100 text-red-900 border-red-400 font-bold',
        };
      case 'DEATH':
        return {
          label: 'Fatal / Death',
          bg: 'bg-stone-900 text-surface border-stone-700 font-bold',
        };
      case 'DISABILITY':
        return {
          label: 'Disability / Incapacity',
          bg: 'bg-purple-50 text-purple-900 border-purple-300 font-semibold',
        };
      case 'CONGENITAL_ANOMALY':
        return {
          label: 'Congenital Anomaly',
          bg: 'bg-indigo-50 text-indigo-900 border-indigo-300 font-semibold',
        };
      case 'OTHER_MEDICALLY_IMPORTANT':
        return {
          label: 'Medically Important',
          bg: 'bg-orange-50 text-orange-900 border-orange-300 font-medium',
        };
      case 'NONE':
      default:
        return {
          label: 'Non-Serious (None)',
          bg: 'bg-surface-soft text-ink-muted border-border',
        };
    }
  };

  const config = getSeriousnessConfig();
  const sizeStyles = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span
      className={`inline-flex items-center border rounded-sm tracking-wide shrink-0 ${config.bg} ${sizeStyles} ${className}`}
      title={`Seriousness Criterion: ${config.label}`}
    >
      {config.label}
    </span>
  );
};
