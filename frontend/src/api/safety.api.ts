import { apiClient } from './client'
import type {
  AdverseEventRead,
  AdverseEventCreate,
  Seriousness,
  Severity,
  AEStatus,
  StatusTransitionRequest,
} from '@/types/api'

export interface AdverseEventListParams {
  study_id?: string
  participant_id?: string
  seriousness?: Seriousness
  severity?: Severity
  status?: AEStatus
  skip?: number
  limit?: number
}

export const safetyApi = {
  list: (params?: AdverseEventListParams) => {
    return apiClient.get<AdverseEventRead[]>('/safety/adverse-events', {
      params: params as Record<string, string | number | boolean | undefined>,
    })
  },

  getById: (id: string) => {
    return apiClient.get<AdverseEventRead>(`/safety/adverse-events/${id}`)
  },

  create: (data: AdverseEventCreate) => {
    return apiClient.post<AdverseEventRead>('/safety/adverse-events', data)
  },

  transition: (id: string, transition: StatusTransitionRequest) => {
    return apiClient.post<AdverseEventRead>(`/safety/adverse-events/${id}/transition`, transition)
  },
}
