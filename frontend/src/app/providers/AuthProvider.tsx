import React, { useState, useEffect, useCallback } from 'react'
import { authApi } from '@/api/auth.api'
import { apiClient } from '@/api/client'
import { AuthContext } from './authContext'
import type { UserProfileRead, LoginRequest } from '@/types/api'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfileRead | null>(null)
  const [token, setToken] = useState<string | null>(() => apiClient.getToken())
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(apiClient.getToken()))

  const logout = useCallback(() => {
    apiClient.setToken(null)
    setToken(null)
    setUser(null)
    setIsLoading(false)
  }, [])

  const refreshProfile = useCallback(async () => {
    const currentToken = apiClient.getToken()
    if (!currentToken) {
      setUser(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const profile = await authApi.getMe()
      setUser(profile)
    } catch (err) {
      console.warn('[AuthProvider] Failed to fetch user profile:', err)
      logout()
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  useEffect(() => {
    if (apiClient.getToken()) {
      void refreshProfile()
    }

    // Listen for unauthorized 401 event from API client
    const handleUnauthorized = () => {
      logout()
    }

    window.addEventListener('unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized)
    }
  }, [refreshProfile, logout])

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setIsLoading(true)
      try {
        const tokenResponse = await authApi.login(credentials)
        apiClient.setToken(tokenResponse.access_token)
        setToken(tokenResponse.access_token)
        const profile = await authApi.getMe()
        setUser(profile)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false
      if (user.is_system_admin) return true
      if (user.permissions.includes('*')) return true
      return user.permissions.includes(permission)
    },
    [user]
  )

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!user) return false
      if (user.is_system_admin) return true
      if (user.permissions.includes('*')) return true
      return permissions.some((p) => user.permissions.includes(p))
    },
    [user]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isSuperAdmin: Boolean(user?.is_super_admin),
        mustChangePassword: Boolean(user?.user?.must_change_password),
        login,
        logout,
        refreshProfile,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
