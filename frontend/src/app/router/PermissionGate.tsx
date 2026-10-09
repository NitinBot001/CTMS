import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { ErrorState } from '@/components/feedback'

export interface PermissionGateProps {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  showErrorState?: boolean
  children: React.ReactNode
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  showErrorState = false,
  children,
}) => {
  const { can, canAny } = usePermissions()

  const requiredList = permission ? [permission, ...permissions] : permissions

  let hasAccess = true

  if (requiredList.length > 0) {
    if (requireAll) {
      hasAccess = requiredList.every((p) => can(p))
    } else {
      hasAccess = canAny(requiredList)
    }
  }

  if (!hasAccess) {
    if (showErrorState) {
      return (
        <ErrorState
          title="Access Restricted (403)"
          message="Your current institutional role or permissions do not authorize access to this operation."
        />
      )
    }
    return <>{fallback}</>
  }

  return <>{children}</>
}
