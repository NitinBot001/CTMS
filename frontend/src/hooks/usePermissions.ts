import { useAuth } from '@/app/providers/authContext'

export function usePermissions() {
  const { user, hasPermission, hasAnyPermission } = useAuth()

  return {
    permissions: user?.permissions || [],
    isSystemAdmin: user?.is_system_admin ?? false,
    can: hasPermission,
    canAny: hasAnyPermission,
  }
}
