import { apiClient } from './client'
import type {
  ParticipantRead,
  ParticipantCreate,
  ParticipantStatus,
  StatusTransitionRequest,
  ParticipantBulkImportRequest,
  ParticipantBulkImportResponse,
} from '@/types/api'

export interface ParticipantListParams {
  study_id?: string
  site_id?: string
  status?: ParticipantStatus
  skip?: number
  limit?: number
}

export const participantsApi = {
  list: (params?: ParticipantListParams) => {
    return apiClient.get<ParticipantRead[]>('/participants', {
      params: params as Record<string, string | number | boolean | undefined>,
    })
  },

  getById: (id: string) => {
    return apiClient.get<ParticipantRead>(`/participants/${id}`)
  },

  create: (data: ParticipantCreate) => {
    return apiClient.post<ParticipantRead>('/participants', data)
  },

  transition: (id: string, transition: StatusTransitionRequest) => {
    return apiClient.post<ParticipantRead>(`/participants/${id}/transition`, transition)
  },

  bulkImport: (data: ParticipantBulkImportRequest) => {
    return apiClient.post<ParticipantBulkImportResponse>('/participants/bulk-import', data)
  },
}
