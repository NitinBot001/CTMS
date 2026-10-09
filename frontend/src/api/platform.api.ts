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
  ResearchPIRequestCreate,
  CROStaffRequestCreate,
  SitePIRequestCreate,
  SiteParticipationRequestCreate,
  SiteParticipationRequestRead,
  SiteParticipationDecisionReview,
  TeamMemberInviteCreate,
  TeamMemberVerificationRequestRead,
  TeamMemberVerificationReview,
  VerifierCreateRequest,
  FirstLoginSetupRequest,
} from '@/types/api'

export const platformApi = {
  // Public Onboarding Submissions
  submitOnboardingRequest: (data: OnboardingRequestCreate) =>
    apiClient.post<OnboardingRequestRead>('/platform/onboarding-requests', data),

  submitResearchPIRequest: (data: ResearchPIRequestCreate) =>
    apiClient.post<OnboardingRequestRead>('/platform/requests/research-pi', data),

  submitCROStaffRequest: (data: CROStaffRequestCreate) =>
    apiClient.post<OnboardingRequestRead>('/platform/requests/cro-staff', data),

  submitSitePIRequest: (data: SitePIRequestCreate) =>
    apiClient.post<OnboardingRequestRead>('/platform/requests/site-pi', data),

  // Government Review Queue
  listOnboardingRequests: (params?: { request_type?: string; status?: string }) =>
    apiClient.get<OnboardingRequestRead[]>('/platform/onboarding-requests', { params }),

  getOnboardingRequest: (requestId: string) =>
    apiClient.get<OnboardingRequestRead>(`/platform/onboarding-requests/${requestId}`),

  reviewOnboardingRequest: (requestId: string, data: OnboardingRequestReview) =>
    apiClient.patch<OnboardingRequestRead>(`/platform/onboarding-requests/${requestId}/review`, data),

  approveOnboardingRequest: (requestId: string) =>
    apiClient.post<ProvisionResult>(`/platform/onboarding-requests/${requestId}/approve`),

  // Account Activation & Setup
  activateAccount: (data: ActivationRequest) =>
    apiClient.post<ActivationResponse>('/platform/activate', data),

  getSuperAdminProfile: () =>
    apiClient.get<SuperAdminProfileRead>('/platform/super-admin/me'),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<{ message: string }>('/platform/change-password', data),

  firstLoginSetup: (data: FirstLoginSetupRequest) =>
    apiClient.post<{ message: string }>('/platform/first-login-setup', data),

  // Clinical Site Study Participation (Dual-Approval)
  requestSiteParticipation: (data: SiteParticipationRequestCreate) =>
    apiClient.post<SiteParticipationRequestRead>('/platform/site-participation/request', data),

  listSiteParticipations: () =>
    apiClient.get<SiteParticipationRequestRead[]>('/platform/site-participation'),

  listStudySiteParticipations: (studyId: string) =>
    apiClient.get<SiteParticipationRequestRead[]>(`/platform/site-participation/by-study/${studyId}`),

  listSiteIncomingParticipations: (siteId: string) =>
    apiClient.get<SiteParticipationRequestRead[]>(`/platform/site-participation/by-site/${siteId}`),

  reviewSiteParticipationGovernment: (requestId: string, data: SiteParticipationDecisionReview) =>
    apiClient.post<SiteParticipationRequestRead>(`/platform/site-participation/${requestId}/government-review`, data),

  respondSiteParticipationSite: (requestId: string, data: SiteParticipationDecisionReview) =>
    apiClient.post<SiteParticipationRequestRead>(`/platform/site-participation/${requestId}/site-response`, data),

  // Team Member Verification
  createTeamInvitation: (data: TeamMemberInviteCreate) =>
    apiClient.post<TeamMemberVerificationRequestRead>('/platform/team-invitations', data),

  listTeamVerifications: () =>
    apiClient.get<TeamMemberVerificationRequestRead[]>('/platform/team-verifications'),

  reviewTeamVerification: (requestId: string, data: TeamMemberVerificationReview) =>
    apiClient.post<TeamMemberVerificationRequestRead>(`/platform/team-verifications/${requestId}/review`, data),

  // Government Verifier Management
  provisionVerifier: (data: VerifierCreateRequest) =>
    apiClient.post<{ user_id: string; email: string; invitation_sent: boolean; raw_token: string | null }>(
      '/platform/super-admin/verifiers',
      data
    ),

  listVerifiers: () =>
    apiClient.get<SuperAdminProfileRead[]>('/platform/super-admin/verifiers'),
}
