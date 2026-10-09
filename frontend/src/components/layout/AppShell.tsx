import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/navigation/Sidebar'
import { Topbar } from '@/components/navigation/Topbar'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { UserProfileRead } from '@/types/api'

export interface AppShellProps {
  user?: UserProfileRead | null
  userPermissions?: string[]
  onLogout?: () => void
  children?: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({
  user: propUser,
  userPermissions: propPermissions,
  onLogout: propLogout,
  children,
}) => {
  const auth = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentUser = propUser !== undefined ? propUser : auth.user
  const currentPermissions = propPermissions !== undefined ? propPermissions : auth.user?.permissions || []
  const handleLogout = propLogout !== undefined ? propLogout : auth.logout

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col font-sans">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        userPermissions={currentPermissions}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-200 ease-in-out',
          collapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        {/* Topbar */}
        <Topbar
          onOpenMobileSidebar={() => setMobileOpen(true)}
          user={currentUser}
          onLogout={handleLogout}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
}
