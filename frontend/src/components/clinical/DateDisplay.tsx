import React from 'react'
import { formatDate, formatDateTime, formatRelativeDate } from '@/lib/date'
import { cn } from '@/lib/utils'

export const DateDisplay: React.FC<{ value: string | null | undefined; className?: string }> = ({
  value,
  className,
}) => {
  return <span className={cn('whitespace-nowrap font-mono text-xs', className)}>{formatDate(value)}</span>
}

export const DateTimeDisplay: React.FC<{ value: string | null | undefined; className?: string }> = ({
  value,
  className,
}) => {
  return <span className={cn('whitespace-nowrap font-mono text-xs', className)}>{formatDateTime(value)}</span>
}

export const RelativeDate: React.FC<{ value: string | null | undefined; className?: string }> = ({
  value,
  className,
}) => {
  return (
    <span className={cn('text-xs text-[#726B5C]', className)} title={formatDateTime(value)}>
      {formatRelativeDate(value)}
    </span>
  )
}

export const DateRangeDisplay: React.FC<{
  start: string | null | undefined
  end: string | null | undefined
  className?: string
}> = ({ start, end, className }) => {
  return (
    <span className={cn('whitespace-nowrap font-mono text-xs', className)}>
      {formatDate(start)} → {formatDate(end)}
    </span>
  )
}
