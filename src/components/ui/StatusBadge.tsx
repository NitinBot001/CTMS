import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'maroon';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-50 text-secondary-dark border-emerald-300';
      case 'warning':
        return 'bg-amber-50 text-accent-dark border-amber-300';
      case 'danger':
        return 'bg-red-50 text-semantic-danger border-red-300';
      case 'info':
        return 'bg-sky-50 text-semantic-info border-sky-300';
      case 'maroon':
        return 'bg-rose-50 text-primary-dark border-rose-300';
      case 'neutral':
      default:
        return 'bg-surface-soft text-ink-secondary border-border';
    }
  };

  const getDotStyles = (): string => {
    switch (variant) {
      case 'success':
        return 'bg-secondary';
      case 'warning':
        return 'bg-accent';
      case 'danger':
        return 'bg-semantic-danger';
      case 'info':
        return 'bg-semantic-info';
      case 'maroon':
        return 'bg-primary';
      case 'neutral':
      default:
        return 'bg-ink-muted';
    }
  };

  const sizeStyles = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-sm tracking-wide ${getVariantStyles()} ${sizeStyles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotStyles()}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
