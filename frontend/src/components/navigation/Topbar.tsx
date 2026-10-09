import React from 'react'
import { Icon } from '@/components/primitives/Icon'
import type { UserProfileRead } from '@/types/api'

export interface TopbarProps {
  onOpenMobileSidebar: () => void
  user?: UserProfileRead | null
  onLogout?: () => void
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileSidebar,
  user,
  onLogout,
}) => {
  return (
    <header className="h-16 bg-white border-b border-[#E4DED3] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      {/* Left: Mobile trigger & breadcrumb placeholder */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xs text-[#5A5347] hover:text-[#1C1A17] hover:bg-[#F8F6F2] transition-colors"
          aria-label="Open navigation menu"
        >
          <Icon name="menu" size="md" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="font-serif font-bold text-[#7A2A12]">AIIA Clinical Trial Management</span>
          <span className="text-[#C9C2B3]">/</span>
          <span className="text-[#726B5C]">GCP & New Drugs Rules Compliant</span>
        </div>
      </div>

      {/* Right: Environment status, User info, Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Environment Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-[#EDF6F1] border border-[#BDDCCB] text-[#1F5C3F] text-[11px] font-medium font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1F5C3F]" />
          API v1 Live
        </div>

        {/* User Profile Pill */}
        {user && (
          <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-[#E4DED3]">
            <div className="w-7 h-7 rounded-full bg-[#7A2A12]/10 border border-[#7A2A12]/20 flex items-center justify-center text-[#7A2A12] text-xs font-semibold">
              {user.user.full_name ? user.user.full_name[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-[#1C1A17] leading-tight">
                {user.user.full_name || user.user.email}
              </span>
              <span className="text-[10px] text-[#726B5C] font-mono leading-tight">
                {user.is_system_admin ? 'System Admin' : 'Authorized Staff'}
              </span>
            </div>
          </div>
        )}

        {/* Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Log out"
            className="p-2 rounded-xs text-[#726B5C] hover:text-[#9B2C2C] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
            aria-label="Log out"
          >
            <Icon name="logout" size="sm" />
          </button>
        )}
      </div>
    </header>
  )
}
