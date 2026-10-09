import React from 'react'
import { cn } from '@/lib/utils'

export interface KeyValueProps {
  label: React.ReactNode
  value: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
  className?: string
  valueClassName?: string
}

export const KeyValue: React.FC<KeyValueProps> = ({
  label,
  value,
  orientation = 'vertical',
  className,
  valueClassName,
}) => {
  if (orientation === 'horizontal') {
    return (
      <div className={cn('flex items-baseline justify-between text-xs py-1.5 border-b border-[#E4DED3]/40 last:border-0', className)}>
        <span className="text-[#5A5347] font-medium">{label}</span>
        <span className={cn('font-semibold text-[#1C1A17] text-right', valueClassName)}>
          {value || '—'}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-0.5', className)}>
      <dt className="text-[11px] font-semibold text-[#5A5347] uppercase tracking-wider">
        {label}
      </dt>
      <dd className={cn('text-xs text-[#1C1A17] font-medium leading-relaxed', valueClassName)}>
        {value || '—'}
      </dd>
    </div>
  )
}

export const KeyValueList: React.FC<{
  columns?: 1 | 2 | 3 | 4
  className?: string
  children: React.ReactNode
}> = ({ columns = 2, className, children }) => {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns]

  return (
    <dl className={cn('grid gap-4 bg-white p-4 border border-[#E4DED3] rounded-xs', colClass, className)}>
      {children}
    </dl>
  )
}
