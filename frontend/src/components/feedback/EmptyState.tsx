import React from 'react'
import { cn } from '@/lib/utils'
import { Icon, type IconName } from '@/components/primitives/Icon'
import { Button } from '@/components/primitives/Button'

export interface EmptyStateProps {
  icon?: IconName
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'database',
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'text-center py-12 px-4 bg-white border border-[#E4DED3] border-dashed rounded-xs flex flex-col items-center justify-center',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-[#F8F6F2] border border-[#E4DED3] flex items-center justify-center text-[#726B5C] mb-3">
        <Icon name={icon} size="lg" />
      </div>
      <h3 className="font-serif text-base font-bold text-[#1C1A17] mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-[#5A5347] max-w-md mb-4 leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
