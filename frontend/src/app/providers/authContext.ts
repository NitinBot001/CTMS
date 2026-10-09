import { createContext, useContext } from 'react'
import type { UserProfileRead, LoginRequest } from '@/types/api'

export interface AuthContextType {
  user: UserProfileRead | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isSuperAdmin: boolean
  mustChangePassword: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
