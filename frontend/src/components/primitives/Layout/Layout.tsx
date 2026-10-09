import React from 'react'
import { cn } from '@/lib/utils'

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

export const Box: React.FC<BoxProps> = ({ as: Component = 'div', className, children, ...props }) => (
  <Component className={className} {...props}>
    {children}
  </Component>
)

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse'
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  gap?: number | string
}

export const Flex: React.FC<FlexProps> = ({
  direction = 'row',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className,
  children,
  ...props
}) => {
  const dirClasses = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse',
  }[direction]

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
    stretch: 'items-stretch',
  }[align]

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  }[justify]

  return (
    <div
      className={cn(
        'flex',
        dirClasses,
        alignClasses,
        justifyClasses,
        wrap ? 'flex-wrap' : 'flex-nowrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const HStack: React.FC<React.HTMLAttributes<HTMLDivElement> & { gap?: 1 | 2 | 3 | 4 | 6 | 8 }> = ({
  gap = 2,
  className,
  children,
  ...props
}) => {
  const gapClasses = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  }[gap]

  return (
    <div className={cn('flex flex-row items-center', gapClasses, className)} {...props}>
      {children}
    </div>
  )
}

export const VStack: React.FC<React.HTMLAttributes<HTMLDivElement> & { gap?: 1 | 2 | 3 | 4 | 6 | 8 }> = ({
  gap = 3,
  className,
  children,
  ...props
}) => {
  const gapClasses = {
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  }[gap]

  return (
    <div className={cn('flex flex-col', gapClasses, className)} {...props}>
      {children}
    </div>
  )
}

export const Container: React.FC<React.HTMLAttributes<HTMLDivElement> & { size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' }> = ({
  size = 'xl',
  className,
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  }[size]

  return (
    <div className={cn('w-full mx-auto px-4 sm:px-6 lg:px-8', sizeClasses, className)} {...props}>
      {children}
    </div>
  )
}

export const Divider: React.FC<{ orientation?: 'horizontal' | 'vertical'; className?: string }> = ({
  orientation = 'horizontal',
  className,
}) => {
  return orientation === 'horizontal' ? (
    <hr className={cn('border-t border-[#E4DED3] my-4 w-full', className)} />
  ) : (
    <div className={cn('border-l border-[#E4DED3] h-full mx-2 self-stretch', className)} />
  )
}

export const Spacer: React.FC<{ size?: 1 | 2 | 4 | 6 | 8 }> = ({ size = 4 }) => {
  const dim = {
    1: 'h-1 w-1',
    2: 'h-2 w-2',
    4: 'h-4 w-4',
    6: 'h-6 w-6',
    8: 'h-8 w-8',
  }[size]
  return <div className={dim} aria-hidden="true" />
}
