import React from 'react'
import { cn } from '@/lib/utils'

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'soft' | 'borderless'
  elevation?: 'none' | 'xs' | 'sm' | 'md'
}

export const Surface: React.FC<SurfaceProps> = ({
  variant = 'white',
  elevation = 'xs',
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    white: 'bg-white border border-[#E4DED3]',
    soft: 'bg-[#F8F6F2] border border-[#E4DED3]',
    borderless: 'bg-white border-0',
  }[variant]

  const elevationStyles = {
    none: '',
    xs: 'shadow-xs',
    sm: 'shadow-sm',
    md: 'shadow-md',
  }[elevation]

  return (
    <div
      className={cn('rounded-xs', variantStyles, elevationStyles, className)}
      {...props}
    >
      {children}
    </div>
  )
}

export const SurfaceHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn('px-5 py-4 border-b border-[#E4DED3] flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  )
}
