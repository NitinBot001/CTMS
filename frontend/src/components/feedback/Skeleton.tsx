import React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  width?: string | number
  height?: string | number
  circle?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  circle = false,
  style,
  ...props
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-[#E4DED3]/60',
        circle ? 'rounded-full' : 'rounded-xs',
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  )
}

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="w-full space-y-3 p-4 bg-white border border-[#E4DED3] rounded-xs">
      <div className="flex gap-4 pb-3 border-b border-[#E4DED3]">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2 border-b border-[#E4DED3]/40 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 bg-white border border-[#E4DED3] rounded-xs space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  )
}

export const FormSkeleton: React.FC = () => {
  return (
    <div className="p-6 bg-white border border-[#E4DED3] rounded-xs space-y-5 max-w-2xl">
      <Skeleton className="h-6 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  )
}

export const PageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-[#E4DED3]">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <CardSkeleton count={4} />
      <TableSkeleton rows={6} columns={5} />
    </div>
  )
}
