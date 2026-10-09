import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/primitives/Icon'

export interface BreadcrumbItemType {
  label: string
  href?: string
  current?: boolean
}

export type BreadcrumbItem = BreadcrumbItemType

export interface BreadcrumbProps {
  items: BreadcrumbItemType[]
  className?: string
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-[#5A5347]', className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link to="/dashboard" className="hover:text-[#7A2A12] transition-colors">
            Home
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.current

          return (
            <li key={item.label} className="flex items-center gap-1.5">
              <Icon name="chevron-right" size="xs" className="text-[#C9C2B3]" />
              {isLast || !item.href ? (
                <span className="font-semibold text-[#7A2A12]" aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="hover:text-[#7A2A12] transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
