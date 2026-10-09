import React from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  badge?: string | number
  icon?: React.ReactNode
  disabled?: boolean
}

export interface TabsProps {
  tabs?: TabItem[]
  items?: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: 'underline' | 'pill'
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  items,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}) => {
  const tabList = tabs || items || []
  return (
    <div
      className={cn(
        'w-full',
        variant === 'underline' && 'border-b border-[#E4DED3]',
        className
      )}
    >
      <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
        {tabList.map((tab) => {
          const isActive = tab.id === activeTab

          if (variant === 'pill') {
            return (
              <button
                key={tab.id}
                type="button"
                disabled={tab.disabled}
                onClick={() => onChange(tab.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors cursor-pointer inline-flex items-center gap-2 select-none',
                  isActive
                    ? 'bg-[#7A2A12] text-white'
                    : 'bg-white text-[#5A5347] hover:bg-[#F8F6F2] hover:text-[#1C1A17]',
                  tab.disabled && 'opacity-50 cursor-not-allowed'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.icon && <span>{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-[#E4DED3] text-[#5A5347]'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          }

          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                'py-2.5 px-1 border-b-2 font-semibold text-xs tracking-tight transition-colors cursor-pointer inline-flex items-center gap-2 whitespace-nowrap select-none',
                isActive
                  ? 'border-[#7A2A12] text-[#7A2A12]'
                  : 'border-transparent text-[#5A5347] hover:text-[#1C1A17] hover:border-[#C9C2B3]',
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                    isActive ? 'bg-[#7A2A12]/10 text-[#7A2A12]' : 'bg-[#E4DED3] text-[#5A5347]'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
