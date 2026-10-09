import { apiClient } from './client'
import type {
  DocumentRead,
  DocumentCreate,
  DocumentType,
  DocumentStatus,
  StatusTransitionRequest,
} from '@/types/api'

export interface DocumentListParams {
  study_id?: string
  organization_id?: string
  site_id?: string
  document_type?: DocumentType
  status?: DocumentStatus
  skip?: number
  limit?: number
}

export const documentsApi = {
  list: (params?: DocumentListParams) => {
    return apiClient.get<DocumentRead[]>('/documents', {
      params: params as Record<string, string | number | boolean | undefined>,
    })
  },

  getById: (id: string) => {
    return apiClient.get<DocumentRead>(`/documents/${id}`)
  },

  create: (data: DocumentCreate) => {
    return apiClient.post<DocumentRead>('/documents', data)
  },

  transition: (id: string, transition: StatusTransitionRequest) => {
    return apiClient.post<DocumentRead>(`/documents/${id}/transition`, transition)
  },
}
