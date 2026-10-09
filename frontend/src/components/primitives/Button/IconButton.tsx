import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { ButtonSpinner, type ButtonSize, type ButtonVariant } from './Button'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon: React.ReactNode
  'aria-label': string
}

const iconSizeStyles: Record<ButtonSize, string> = {
  xs: 'p-1 text-xs rounded-xs',
  sm: 'p-1.5 text-xs rounded-xs',
  md: 'p-2 text-sm rounded-xs',
  lg: 'p-2.5 text-base rounded-sm',
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
    'bg-transparent text-[#7A2A12] hover:underline p-0 h-auto',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'outline',
      size = 'md',
      loading = false,
      disabled,
      className,
      icon,
      'aria-label': ariaLabel,
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
        aria-label={ariaLabel}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center transition-colors duration-150 cursor-pointer select-none',
          'focus:outline-2 focus:outline-[#B8862E] focus:outline-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          iconSizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? <ButtonSpinner size={size} /> : icon}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
