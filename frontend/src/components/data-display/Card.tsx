import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'accent-primary' | 'accent-secondary' | 'accent-gold' | 'accent-danger'
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className,
  children,
  ...props
}) => {
  const borderLeftClasses = {
    default: 'border-[#E4DED3]',
    'accent-primary': 'border-[#E4DED3] border-l-4 border-l-[#7A2A12]',
    'accent-secondary': 'border-[#E4DED3] border-l-4 border-l-[#1F5C3F]',
    'accent-gold': 'border-[#E4DED3] border-l-4 border-l-[#B8862E]',
    'accent-danger': 'border-[#E4DED3] border-l-4 border-l-[#9B2C2C]',
  }[variant]

  return (
    <div
      className={cn(
        'bg-white border rounded-xs shadow-xs transition-shadow duration-150',
        borderLeftClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('px-5 py-4 border-b border-[#E4DED3] flex items-center justify-between', className)}
    {...props}
  >
    {children}
  </div>
)

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={cn('font-serif text-base font-bold text-[#1C1A17]', className)} {...props}>
    {children}
  </h3>
)

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-xs text-[#5A5347] mt-0.5', className)} {...props}>
    {children}
  </p>
)

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('p-5 text-xs text-[#1C1A17]', className)} {...props}>
    {children}
  </div>
)

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'px-5 py-3 border-t border-[#E4DED3] bg-[#F8F6F2] flex items-center justify-between text-xs',
      className
    )}
    {...props}
  >
    {children}
  </div>
)
