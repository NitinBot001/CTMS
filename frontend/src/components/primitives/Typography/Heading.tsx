import React from 'react'
import { cn } from '@/lib/utils'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel
  as?: `h${HeadingLevel}`
  children: React.ReactNode
}

const levelStyles: Record<HeadingLevel, string> = {
  1: 'text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1A17]',
  2: 'text-xl sm:text-2xl font-bold tracking-tight text-[#1C1A17]',
  3: 'text-lg sm:text-xl font-bold text-[#1C1A17]',
  4: 'text-base sm:text-lg font-semibold text-[#1C1A17]',
  5: 'text-sm sm:text-base font-semibold text-[#1C1A17]',
  6: 'text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#5A5347]',
}

export const Heading: React.FC<HeadingProps> = ({
  level = 2,
  as,
  className,
  children,
  ...props
}) => {
  const Component = as || (`h${level}` as const)

  return (
    <Component
      className={cn('font-serif font-bold text-[#1C1A17]', levelStyles[level], className)}
      {...props}
    >
      {children}
    </Component>
  )
}
