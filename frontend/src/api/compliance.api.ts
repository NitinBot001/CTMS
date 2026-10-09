import { apiClient } from './client'
import type {
  EthicsApprovalRead,
  EthicsApprovalCreate,
  RegulatorySubmissionRead,
  RegulatorySubmissionCreate,
  ProtocolDeviationRead,
  ProtocolDeviationCreate,
  CAPARecordRead,
  CAPARecordCreate,
  StatusTransitionRequest,
} from '@/types/api'

export const complianceApi = {
  // Ethics Approvals
  listEthicsApprovals: (params?: { study_id?: string; site_id?: string; skip?: number; limit?: number }) => {
    return apiClient.get<EthicsApprovalRead[]>('/compliance/ethics', {
      params: params as Record<string, string | number | boolean | undefined>,
    })
  },
  createEthicsApproval: (data: EthicsApprovalCreate) => {
    return apiClient.post<EthicsApprovalRead>('/compliance/ethics', data)
  },
  transitionEthicsApproval: (id: string, transition: StatusTransitionRequest) => {
    return apiClient.post<EthicsApprovalRead>(`/compliance/ethics/${id}/transition`, transition)
  },

  // Regulatory Submissions
  listRegulatorySubmissions: (params?: { study_id?: string; skip?: number; limit?: number }) => {
    return apiClient.get<RegulatorySubmissionRead[]>('/compliance/regulatory', {
      params: params as Record<string, string | number | boolean | undefined>,
    })
  },
  createRegulatorySubmission: (data: RegulatorySubmissionCreate) => {
    return apiClient.post<RegulatorySubmissionRead>('/compliance/regulatory', data)
  },
  transitionRegulatorySubmission: (id: string, transition: StatusTransitionRequest) => {
    return apiClient.post<RegulatorySubmissionRead>(`/compliance/regulatory/${id}/transition`, transition)
  },

  // Protocol Deviations
  listProtocolDeviations: (params?: { study_id?: string; site_id?: string; skip?: number; limit?: number }) => {
    return apiClient.get<ProtocolDeviationRead[]>('/compliance/deviations', {
      params: params as Record<string, string | number | boolean | undefined>,
    })
  },
  createProtocolDeviation: (data: ProtocolDeviationCreate) => {
    return apiClient.post<ProtocolDeviationRead>('/compliance/deviations', data)
  },
  transitionProtocolDeviation: (id: string, transition: StatusTransitionRequest) => {
    return apiClient.post<ProtocolDeviationRead>(`/compliance/deviations/${id}/transition`, transition)
  },

  // CAPA Records
  listCAPARecords: (params?: { study_id?: string; organization_id?: string; skip?: number; limit?: number }) => {
    return apiClient.get<CAPARecordRead[]>('/compliance/capa', {
      params: params as Record<string, string | number | boolean | undefined>,
    })
  },
  createCAPARecord: (data: CAPARecordCreate) => {
    return apiClient.post<CAPARecordRead>('/compliance/capa', data)
  },
  transitionCAPARecord: (id: string, transition: StatusTransitionRequest) => {
    return apiClient.post<CAPARecordRead>(`/compliance/capa/${id}/transition`, transition)
  },
}
