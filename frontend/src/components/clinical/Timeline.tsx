import React from 'react'
import { cn } from '@/lib/utils'

export interface TimelineItemProps {
  title: React.ReactNode
  timestamp?: React.ReactNode
  description?: React.ReactNode
  status?: 'completed' | 'active' | 'pending' | 'danger'
  isLast?: boolean
  children?: React.ReactNode
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  title,
  timestamp,
  description,
  status = 'pending',
  isLast = false,
  children,
}) => {
  const dotStyles = {
    completed: 'bg-[#1F5C3F] border-[#1F5C3F]',
    active: 'bg-[#B8862E] border-[#B8862E]',
    pending: 'bg-white border-[#C9C2B3]',
    danger: 'bg-[#9B2C2C] border-[#9B2C2C]',
  }[status]

  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      {/* Connector line */}
      {!isLast && (
        <div
          className="absolute left-[7px] top-3 bottom-0 w-0.5 bg-[#E4DED3]"
          aria-hidden="true"
        />
      )}
      {/* Dot */}
      <div
        className={cn(
          'absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-colors',
          dotStyles
        )}
        aria-hidden="true"
      />
      {/* Content */}
      <div className="text-xs">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold text-[#1C1A17]">{title}</span>
          {timestamp && <span className="text-[11px] text-[#726B5C] font-mono">{timestamp}</span>}
        </div>
        {description && <p className="text-[#5A5347] mt-0.5 leading-relaxed">{description}</p>}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  )
}

export const Timeline: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <div className={cn('relative', className)}>{children}</div>
}
