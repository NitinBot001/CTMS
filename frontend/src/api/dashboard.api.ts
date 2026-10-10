import { apiClient } from './client'
import type { DashboardSummaryResponse } from '@/types/api'

export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummaryResponse>('/dashboard/summary'),
}
