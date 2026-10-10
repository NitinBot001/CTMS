import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Icon, type IconName } from '@/components/primitives/Icon'

export interface NavItem {
  label: string
  path: string
  icon: IconName
  badge?: string | number
  permission?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    ],
  },
  {
    title: 'Clinical Operations',
    items: [
      { label: 'Studies', path: '/studies', icon: 'study' },
      { label: 'Research Sites', path: '/sites', icon: 'site' },
      { label: 'Participants', path: '/participants', icon: 'participants' },
    ],
  },
  {
    title: 'Safety & Governance',
    items: [
      { label: 'Adverse Events', path: '/safety', icon: 'adverseEvent' },
      { label: 'Compliance & CAPA', path: '/compliance', icon: 'compliance' },
      { label: 'Trial Master Files', path: '/documents', icon: 'documents' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Organizations', path: '/organizations', icon: 'organization' },
      { label: 'Cryptographic Audit', path: '/audit', icon: 'audit' },
      { label: 'Access Control', path: '/admin', icon: 'users', permission: 'user:manage' },
    ],
  },
]

export interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
  userPermissions?: string[]
  isSuperAdmin?: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  userPermissions = [],
  isSuperAdmin = false,
}) => {
  const location = useLocation()

  const sections = React.useMemo(() => {
    const list = [...navSections]
    if (isSuperAdmin) {
      list.push({
        title: 'Platform Control',
        items: [
          { label: 'Super Admin', path: '/super-admin', icon: 'shieldCheck' },
        ],
      })
    }
    return list
  }, [isSuperAdmin])

  const hasPermission = (permission?: string) => {
    if (!permission) return true
    if (userPermissions.includes('*')) return true
    return userPermissions.includes(permission)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#1C1A17]/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#141210] border-r border-[#2C2824] text-[#E4DED3] transition-all duration-200 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#2C2824] shrink-0 bg-[#141210]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xs bg-[#7A2A12] border border-[#B8862E]/40 flex items-center justify-center shrink-0 shadow-sm">
              <span className="font-serif font-bold text-white text-base tracking-wider">A</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-serif text-sm font-bold tracking-tight text-white leading-tight truncate">
                  AyuCTMS
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#B8862E]">
                  CRO / Sponsor Ops
                </span>
              </div>
            )}
          </div>

          {/* Collapse toggle (desktop only) */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-xs text-[#726B5C] hover:text-white hover:bg-[#2C2824] transition-colors cursor-pointer"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size="sm" />
          </button>

          {/* Close button (mobile only) */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex lg:hidden p-1.5 rounded-xs text-[#726B5C] hover:text-white hover:bg-[#2C2824] transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <Icon name="close" size="sm" />
          </button>
        </div>

        {/* Navigation Section Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {sections.map((section) => {
            const visibleItems = section.items.filter((item) => hasPermission(item.permission))
            if (visibleItems.length === 0) return null

            return (
              <div key={section.title} className="space-y-1">
                {!collapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider uppercase text-[#726B5C]">
                    {section.title}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path)

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xs text-xs font-medium transition-all group relative',
                        isActive
                          ? 'bg-[#7A2A12] text-white shadow-xs'
                          : 'text-[#C9C2B3] hover:text-white hover:bg-[#201D1A]'
                      )}
                    >
                      <Icon
                        name={item.icon}
                        size="md"
                        className={cn(
                          'shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-[#A09888] group-hover:text-white'
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-[#2C2824] text-[#C9C2B3]">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Footer Info */}
        {!collapsed && (
          <div className="p-3 border-t border-[#2C2824] shrink-0 text-[11px] text-[#726B5C] flex items-center justify-between">
            <span className="font-mono">v1.0.0-rc</span>
            <span className="flex items-center gap-1.5 text-[#1F5C3F]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1F5C3F] animate-pulse" />
              Operational
            </span>
          </div>
        )}
      </aside>
    </>
  )
}
