import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-white hover:bg-primary-dark border border-primary-dark focus:ring-accent';
      case 'secondary':
        return 'bg-secondary text-white hover:bg-secondary-dark border border-secondary-dark focus:ring-secondary';
      case 'outline':
        return 'bg-surface text-ink hover:bg-surface-soft border border-border-strong focus:ring-accent';
      case 'ghost':
        return 'bg-transparent text-ink hover:bg-surface-soft border border-transparent focus:ring-accent';
    }
  };

  const getSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2.5 py-1.5 gap-1.5';
      case 'lg':
        return 'text-base px-4 py-2.5 gap-2';
      case 'md':
      default:
        return 'text-sm px-3.5 py-2 gap-2';
    }
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
