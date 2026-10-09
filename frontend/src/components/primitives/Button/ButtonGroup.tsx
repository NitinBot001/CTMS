import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  attached?: boolean
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  attached = true,
}) => {
  return (
    <div
      role="group"
      className={cn(
        'inline-flex items-center',
        attached
          ? '[&>button]:rounded-none first:[&>button]:rounded-l-xs last:[&>button]:rounded-r-xs [&>button:not(:first-child)]:-ml-[1px]'
          : 'gap-2',
        className
      )}
    >
      {children}
    </div>
  )
}
