import { apiClient } from './client'
import type {
  OnboardingRequestCreate,
  OnboardingRequestRead,
  OnboardingRequestReview,
  ProvisionResult,
  ActivationRequest,
  ActivationResponse,
  SuperAdminProfileRead,
  ChangePasswordRequest,
} from '@/types/api'

export const platformApi = {
  submitOnboardingRequest: (data: OnboardingRequestCreate) =>
    apiClient.post<OnboardingRequestRead>('/platform/onboarding-requests', data),

  listOnboardingRequests: () =>
    apiClient.get<OnboardingRequestRead[]>('/platform/onboarding-requests'),

  getOnboardingRequest: (requestId: string) =>
    apiClient.get<OnboardingRequestRead>(`/platform/onboarding-requests/${requestId}`),

  reviewOnboardingRequest: (requestId: string, data: OnboardingRequestReview) =>
    apiClient.patch<OnboardingRequestRead>(`/platform/onboarding-requests/${requestId}/review`, data),

  approveOnboardingRequest: (requestId: string) =>
    apiClient.post<ProvisionResult>(`/platform/onboarding-requests/${requestId}/approve`),

  activateAccount: (data: ActivationRequest) =>
    apiClient.post<ActivationResponse>('/platform/activate', data),

  getSuperAdminProfile: () =>
    apiClient.get<SuperAdminProfileRead>('/platform/super-admin/me'),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<{ message: string }>('/platform/change-password', data),
}
