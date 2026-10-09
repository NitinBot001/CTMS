import React from 'react'
import { cn } from '@/lib/utils'

export interface PageContainerProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  className?: string
}

const maxWidthMap = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-none',
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = '2xl',
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full mx-auto px-4 sm:px-6 lg:px-8 py-6',
        maxWidthMap[maxWidth],
        className
      )}
    >
      {children}
    </div>
  )
}
