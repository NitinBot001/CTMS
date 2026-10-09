import React from 'react'
import { Breadcrumb, type BreadcrumbItem } from '@/components/navigation/Breadcrumb'
import { Heading } from '@/components/primitives/Typography'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  badge,
  actions,
  className,
}) => {
  return (
    <div className={`mb-6 space-y-2 ${className || ''}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} className="mb-2" />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Heading level={2} className="font-serif text-xl sm:text-2xl font-bold text-[#1C1A17]">
              {title}
            </Heading>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#5A5347] max-w-2xl">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
