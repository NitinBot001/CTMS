import React from 'react'
import { cn } from '@/lib/utils'
import { Icon, type IconName } from '@/components/primitives/Icon'

export interface MetricCardProps {
  label: string
  value: string | number
  subtext?: string
  trend?: string
  trendPositive?: boolean
  icon?: IconName
  accentColor?: 'primary' | 'secondary' | 'accent' | 'danger'
  className?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  trend,
  trendPositive = true,
  icon,
  accentColor = 'primary',
  className,
}) => {
  const accentBorder = {
    primary: 'border-l-4 border-l-[#7A2A12]',
    secondary: 'border-l-4 border-l-[#1F5C3F]',
    accent: 'border-l-4 border-l-[#B8862E]',
    danger: 'border-l-4 border-l-[#9B2C2C]',
  }[accentColor]

  const iconColor = {
    primary: 'text-[#7A2A12]',
    secondary: 'text-[#1F5C3F]',
    accent: 'text-[#B8862E]',
    danger: 'text-[#9B2C2C]',
  }[accentColor]

  return (
    <div
      className={cn(
        'bg-white border border-[#E4DED3] p-4 rounded-xs shadow-xs',
        accentBorder,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#5A5347]">
          {label}
        </span>
        {icon && <Icon name={icon} size="md" className={iconColor} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-serif text-2xl font-bold text-[#1C1A17]">{value}</span>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trendPositive ? 'text-[#1F5C3F]' : 'text-[#9B2C2C]'
            )}
          >
            {trend}
          </span>
        )}
      </div>
      {subtext && <p className="text-[11px] text-[#726B5C] mt-1">{subtext}</p>}
    </div>
  )
}

export const Stat = MetricCard

