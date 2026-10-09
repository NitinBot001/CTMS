import { apiClient } from './client'
import type { SiteRead, SiteCreate, SiteUpdate } from '@/types/api'

export const sitesApi = {
  list: (params?: { site_type?: string; status?: string; skip?: number; limit?: number }) =>
    apiClient.get<SiteRead[]>('/sites', { params }),

  get: (siteId: string) => apiClient.get<SiteRead>(`/sites/${siteId}`),
  getById: (siteId: string) => apiClient.get<SiteRead>(`/sites/${siteId}`),

  create: (data: SiteCreate) => apiClient.post<SiteRead>('/sites', data),

  update: (siteId: string, data: SiteUpdate) =>
    apiClient.patch<SiteRead>(`/sites/${siteId}`, data),
}
