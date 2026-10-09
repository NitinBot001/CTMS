import React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressBarProps {
  value: number
  max?: number
  variant?: 'primary' | 'secondary' | 'accent' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'secondary',
  size = 'md',
  showLabel = false,
  className,
}) => {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100)

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size]

  const variantStyles = {
    primary: 'bg-[#7A2A12]',
    secondary: 'bg-[#1F5C3F]',
    accent: 'bg-[#B8862E]',
    danger: 'bg-[#9B2C2C]',
  }[variant]

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-[11px] text-[#5A5347] font-medium mb-1">
          <span>{value} / {max}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div
        className={cn('w-full bg-[#E4DED3] rounded-full overflow-hidden', sizeStyles)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn('h-full transition-all duration-300 rounded-full', variantStyles)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
