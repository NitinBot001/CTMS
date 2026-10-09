import { apiClient } from './client'
import type {
  OrganizationRead,
  OrganizationCreate,
  OrganizationUpdate,
  OrganizationMemberRead,
  OrganizationMemberCreate,
  OnboardingApplicationRead,
  StatusTransitionRequest,
} from '@/types/api'

export const organizationsApi = {
  list: (params?: { org_type?: string; org_status?: string; skip?: number; limit?: number }) =>
    apiClient.get<OrganizationRead[]>('/organizations', { params }),

  get: (orgId: string) => apiClient.get<OrganizationRead>(`/organizations/${orgId}`),
  getById: (orgId: string) => apiClient.get<OrganizationRead>(`/organizations/${orgId}`),

  create: (data: OrganizationCreate) =>
    apiClient.post<OrganizationRead>('/organizations', data),

  update: (orgId: string, data: OrganizationUpdate) =>
    apiClient.patch<OrganizationRead>(`/organizations/${orgId}`, data),

  listMembers: (orgId: string) =>
    apiClient.get<OrganizationMemberRead[]>(`/organizations/${orgId}/members`),

  addMember: (orgId: string, data: OrganizationMemberCreate) =>
    apiClient.post<OrganizationMemberRead>(`/organizations/${orgId}/members`, data),

  createOnboarding: (orgId: string) =>
    apiClient.post<OnboardingApplicationRead>(`/organizations/${orgId}/onboarding`),

  transitionOnboarding: (appId: string, data: StatusTransitionRequest) =>
    apiClient.post<OnboardingApplicationRead>(`/organizations/onboarding/${appId}/transition`, data),
}
