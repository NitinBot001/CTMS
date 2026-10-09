import { apiClient } from './client'
import type { AuditLogRead } from '@/types/api'

export interface AuditLogListParams {
  resource_type?: string
  resource_id?: string
  action?: string
  skip?: number
  limit?: number
}

export interface AuditVerificationResult {
  valid: boolean
  verified_records: number
  message?: string
  failure_type?: 'chain_broken' | 'payload_tampered'
  index?: number
  record_id?: string
  error?: string
}

export const auditApi = {
  list: (params?: AuditLogListParams) => {
    return apiClient.get<AuditLogRead[]>('/audit/logs', {
      params: params as Record<string, string | number | boolean | undefined>,
    })
  },

  verifyChain: () => {
    return apiClient.get<AuditVerificationResult>('/audit/verify')
  },
}
