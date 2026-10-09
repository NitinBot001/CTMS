import React from 'react'
import { cn } from '@/lib/utils'
import { iconRegistry, type IconName } from './registry'

export type { IconName }
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number

export interface IconProps extends React.SVGAttributes<SVGElement> {
  name: IconName
  size?: IconSize
  className?: string
}

const sizeMap: Record<string, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  className,
  ...props
}) => {
  const IconComponent = iconRegistry[name]

  if (!IconComponent) {
    console.warn(`[Icon] Unknown icon name: "${name}"`)
    return null
  }

  const sizeClass = typeof size === 'string' ? sizeMap[size] : undefined
  const customStyle = typeof size === 'number' ? { width: size, height: size } : undefined

  return (
    <IconComponent
      className={cn('shrink-0 stroke-[1.75]', sizeClass, className)}
      style={customStyle}
      aria-hidden="true"
      {...props}
    />
  )
}
