import { apiClient } from './client'
import type { LoginRequest, TokenResponse, UserProfileRead } from '@/types/api'

export const authApi = {
  login: (data: LoginRequest) => apiClient.post<TokenResponse>('/auth/login', data),
  getMe: () => apiClient.get<UserProfileRead>('/auth/me'),
}
