import type { UserProfileRead, UserRead } from './api'

export interface OrganizationMembershipInfo {
  organization_id: string
  organization_name: string
  role_name: string
  scope_level: string
  status: string
}

export interface AuthContextType {
  user: UserRead | null
  profile: UserProfileRead | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isSystemAdmin: boolean
  permissions: string[]
  login: (token: string, user: UserRead) => Promise<void>
  logout: () => void
  can: (permission: string) => boolean
  refreshProfile: () => Promise<void>
}
