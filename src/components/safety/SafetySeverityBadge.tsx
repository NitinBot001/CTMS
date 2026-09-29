import React from 'react';
import { Severity } from '../../types';

interface SafetySeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
  className?: string;
}

export const SafetySeverityBadge: React.FC<SafetySeverityBadgeProps> = ({
  severity,
  size = 'md',
  className = '',
}) => {
  const getSeverityConfig = () => {
    switch (severity) {
      case 'SEVERE':
        return {
          label: 'Severe',
          bg: 'bg-red-50 text-semantic-danger border-red-200 font-semibold',
          dot: 'bg-semantic-danger',
        };
      case 'MODERATE':
        return {
          label: 'Moderate',
          bg: 'bg-amber-50 text-accent-dark border-amber-300 font-medium',
          dot: 'bg-accent',
        };
      case 'MILD':
      default:
        return {
          label: 'Mild',
          bg: 'bg-stone-50 text-ink-secondary border-stone-200',
          dot: 'bg-stone-400',
        };
    }
  };

  const config = getSeverityConfig();
  const sizeStyles = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-sm tracking-wide shrink-0 ${config.bg} ${sizeStyles} ${className}`}
      title={`Clinical Severity: ${config.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};
