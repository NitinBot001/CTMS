import React from 'react'
import { cn } from '@/lib/utils'
import { formatEnumLabel } from '@/lib/format'
import { Icon, type IconName } from '@/components/primitives/Icon'

import { type StatusCategory, getStatusCategory } from './statusUtils'


const categoryStyles: Record<
  StatusCategory,
  { bg: string; text: string; border: string; dot: string; icon: IconName }
> = {
  success: {
    bg: 'bg-[#EDF6F1]',
    text: 'text-[#1F5C3F]',
    border: 'border-[#BDDCCB]',
    dot: 'bg-[#1F5C3F]',
    icon: 'success',
  },
  warning: {
    bg: 'bg-[#FBF7EE]',
    text: 'text-[#B8862E]',
    border: 'border-[#E9D6A9]',
    dot: 'bg-[#B8862E]',
    icon: 'clock',
  },
  danger: {
    bg: 'bg-[#FDF2F2]',
    text: 'text-[#9B2C2C]',
    border: 'border-[#F5C6C6]',
    dot: 'bg-[#9B2C2C]',
    icon: 'error',
  },
  info: {
    bg: 'bg-[#EFF5F9]',
    text: 'text-[#315A78]',
    border: 'border-[#BFD7E7]',
    dot: 'bg-[#315A78]',
    icon: 'info',
  },
  neutral: {
    bg: 'bg-[#F8F6F2]',
    text: 'text-[#5A5347]',
    border: 'border-[#E4DED3]',
    dot: 'bg-[#726B5C]',
    icon: 'activity',
  },
}

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string | null | undefined
  category?: StatusCategory
  label?: string
  showDot?: boolean
  showIcon?: boolean
  size?: 'sm' | 'md'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  category,
  label: customLabel,
  showDot = false,
  showIcon = false,
  size = 'md',
  className,
  ...props
}) => {
  if (!status && !customLabel) return <span className="text-xs text-[#726B5C]">—</span>

  const cat = category || (status ? getStatusCategory(status) : 'neutral')
  const config = categoryStyles[cat]
  const displayLabel = customLabel || (status ? formatEnumLabel(status) : '')

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider rounded-xs border select-none',
        config.bg,
        config.text,
        config.border,
        sizeClasses,
        className
      )}
      {...props}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />}
      {showIcon && <Icon name={config.icon} size="xs" />}
      <span>{displayLabel}</span>
    </span>
  )
}

export const StatusDot: React.FC<{ status: string; className?: string }> = ({
  status,
  className,
}) => {
  const cat = getStatusCategory(status)
  const config = categoryStyles[cat]
  return (
    <span
      className={cn('inline-block w-2 h-2 rounded-full', config.dot, className)}
      title={formatEnumLabel(status)}
    />
  )
}
