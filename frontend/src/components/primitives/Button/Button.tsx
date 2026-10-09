import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'warning'
  | 'link'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#7A2A12] text-white hover:bg-[#5C1F0D] active:bg-[#451609] border border-transparent shadow-xs',
  secondary:
    'bg-[#1F5C3F] text-white hover:bg-[#16432E] active:bg-[#0E2E1F] border border-transparent shadow-xs',
  outline:
    'bg-white text-[#1C1A17] border border-[#C9C2B3] hover:bg-[#F8F6F2] hover:border-[#7A2A12] active:bg-[#EAE4D9]',
  ghost:
    'bg-transparent text-[#5A5347] hover:bg-[#F8F6F2] hover:text-[#1C1A17] active:bg-[#EAE4D9]',
  danger:
    'bg-[#9B2C2C] text-white hover:bg-[#7D2323] active:bg-[#5F1B1B] border border-transparent shadow-xs',
  success:
    'bg-[#1F5C3F] text-white hover:bg-[#16432E] active:bg-[#0E2E1F] border border-transparent shadow-xs',
  warning:
    'bg-[#B8862E] text-white hover:bg-[#8F661F] active:bg-[#6D4C13] border border-transparent shadow-xs',
  link:
    'bg-transparent text-[#7A2A12] hover:underline p-0 h-auto font-medium',
}

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-[11px] gap-1 rounded-xs',
  sm: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-xs',
  md: 'px-3.5 py-2 text-xs font-semibold gap-2 rounded-xs',
  lg: 'px-4 py-2.5 text-sm font-semibold gap-2 rounded-sm',
}

export const ButtonSpinner = ({ size = 'sm' }: { size?: ButtonSize }) => {
  const dim = size === 'xs' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'
  return (
    <svg
      className={cn('animate-spin text-current', dim)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className,
      children,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-sans tracking-tight transition-colors duration-150 cursor-pointer select-none',
          'focus:outline-2 focus:outline-[#B8862E] focus:outline-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && <ButtonSpinner size={size} />}
        {!loading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {!loading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
