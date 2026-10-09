import { apiClient } from './client'
import type {
  UserRead,
  UserCreate,
  RoleRead,
  PermissionRead,
} from '@/types/api'

export interface UserListParams {
  status?: string
  skip?: number
  limit?: number
}

export const adminApi = {
  listUsers: (params?: UserListParams) => {
    return apiClient.get<UserRead[]>('/users', {
      params: params as Record<string, string | number | boolean | undefined>,
    })
  },

  getUser: (id: string) => {
    return apiClient.get<UserRead>(`/users/${id}`)
  },

  createUser: (data: UserCreate) => {
    return apiClient.post<UserRead>('/users', data)
  },

  listRoles: () => {
    return apiClient.get<RoleRead[]>('/roles')
  },

  listPermissions: () => {
    return apiClient.get<PermissionRead[]>('/permissions')
  },
}
