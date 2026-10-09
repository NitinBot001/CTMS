import React from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading clinical data...',
  className,
}) => {
  return (
    <div
      className={cn(
        'py-12 px-4 flex flex-col items-center justify-center text-center gap-3',
        className
      )}
    >
      <Spinner size="lg" color="primary" />
      <p className="text-xs text-[#5A5347] font-medium">{message}</p>
    </div>
  )
}
