import React from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/primitives/Icon'
import { Button } from '@/components/primitives/Button'

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'text-center py-10 px-4 bg-[#FDF2F2] border border-[#F5C6C6] rounded-xs flex flex-col items-center justify-center',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-white border border-[#F5C6C6] flex items-center justify-center text-[#9B2C2C] mb-2.5">
        <Icon name="error" size="md" />
      </div>
      <h3 className="font-semibold text-sm text-[#1C1A17] mb-1">{title}</h3>
      <p className="text-xs text-[#5A5347] max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<Icon name="refresh" size="xs" />}>
          Try Again
        </Button>
      )}
    </div>
  )
}
