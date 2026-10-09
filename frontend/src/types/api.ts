import type { components } from '@/api/generated/schema'

export type Schemas = components['schemas']

// Organizations & Onboarding
export type OrganizationRead = Schemas['OrganizationRead']
export type OrganizationCreate = Schemas['OrganizationCreate']
export type OrganizationUpdate = Schemas['OrganizationUpdate']
export type OrganizationMemberRead = Schemas['OrganizationMemberRead']
export type OrganizationMemberCreate = Schemas['OrganizationMemberCreate']
export type OnboardingApplicationRead = Schemas['OnboardingApplicationRead']
export type OrganizationType = Schemas['OrganizationType']
export type OrganizationStatus = Schemas['OrganizationStatus']
export type OnboardingStatus = Schemas['OnboardingStatus']

// Studies, Milestones, Team & Sites
export type StudyRead = Schemas['StudyRead']
export type StudyCreate = Schemas['StudyCreate']
export type StudyUpdate = Schemas['StudyUpdate']
export type StudyMilestoneRead = Schemas['StudyMilestoneRead']
export type StudyTeamMemberRead = Schemas['StudyTeamMemberRead']
export type StudyTeamMemberCreate = Schemas['StudyTeamMemberCreate']
export type StudySiteRead = Schemas['StudySiteRead']
export type StudySiteCreate = Schemas['StudySiteCreate']
export type StudyStatus = Schemas['StudyStatus']
export type StudyType = Schemas['StudyType']
export type StudyPhase = Schemas['StudyPhase']
export type BlindingType = Schemas['BlindingType']
export type CTRIStatus = Schemas['CTRIStatus']
export type StudySiteActivationStatus = Schemas['StudySiteActivationStatus']
export type MilestoneStatus = Schemas['MilestoneStatus']

// Sites Master
export type SiteRead = Schemas['SiteRead']
export type SiteCreate = Schemas['SiteCreate']
export type SiteUpdate = Schemas['SiteUpdate']
export type SiteType = Schemas['SiteType']
export type SiteStatus = Schemas['SiteStatus']

// Participants
export type ParticipantRead = Schemas['ParticipantRead']
export type ParticipantCreate = Schemas['ParticipantCreate']
export type ParticipantStatus = Schemas['ParticipantStatus']

// Safety
export type AdverseEventRead = Schemas['AdverseEventRead']
export type AdverseEventCreate = Schemas['AdverseEventCreate']
export type AdverseEventType = Schemas['AdverseEventType']
export type Seriousness = Schemas['Seriousness']
export type Severity = Schemas['Severity']
export type AEStatus = Schemas['AEStatus']

// Compliance
export type EthicsApprovalRead = Schemas['EthicsApprovalRead']
export type EthicsApprovalCreate = Schemas['EthicsApprovalCreate']
export type RegulatorySubmissionRead = Schemas['RegulatorySubmissionRead']
export type RegulatorySubmissionCreate = Schemas['RegulatorySubmissionCreate']
export type ProtocolDeviationRead = Schemas['ProtocolDeviationRead']
export type ProtocolDeviationCreate = Schemas['ProtocolDeviationCreate']
export type CAPARecordRead = Schemas['CAPARecordRead']
export type CAPARecordCreate = Schemas['CAPARecordCreate']

// Documents
export type DocumentRead = Schemas['DocumentRead']
export type DocumentCreate = Schemas['DocumentCreate']
export type DocumentType = Schemas['DocumentType']
export type DocumentStatus = Schemas['DocumentStatus']

// Portfolio Analytics
export type PortfolioOverviewResponse = Schemas['PortfolioOverviewResponse']
export type PortfolioHealthResponse = Schemas['PortfolioHealthResponse']
export type PortfolioAlertItem = Schemas['PortfolioAlertItem']
export type UpcomingMilestoneItem = Schemas['UpcomingMilestoneItem']
export type EnrollmentTrendPoint = Schemas['EnrollmentTrendPoint']
export type SiteEnrollmentItem = Schemas['SiteEnrollmentItem']
export type StudyMetricsResponse = Schemas['StudyMetricsResponse']

// Audit Trail
export type AuditLogRead = Schemas['AuditLogRead']

// Users, Roles, Permissions & Auth
export type UserRead = Schemas['UserRead']
export type UserCreate = Schemas['UserCreate']
export type RoleRead = Schemas['RoleRead']
export type RoleCreate = Schemas['RoleCreate']
export type PermissionRead = Schemas['PermissionRead']
export type UserProfileRead = Schemas['UserProfileRead']
export type TokenResponse = Schemas['TokenResponse']
export type LoginRequest = Schemas['LoginRequest']

// Transitions
export type StatusTransitionRequest = Schemas['StatusTransitionRequest']

// Platform & Super Admin Onboarding
export type OnboardingRequestRead = Schemas['OnboardingRequestRead']
export type OnboardingRequestCreate = Schemas['OnboardingRequestCreate']
export type OnboardingRequestReview = Schemas['OnboardingRequestReview']
export type OnboardingRequestStatus = Schemas['OnboardingRequestStatus']
export type ActivationRequest = Schemas['ActivationRequest']
export type ActivationResponse = Schemas['ActivationResponse']
export type ChangePasswordRequest = Schemas['ChangePasswordRequest']
export type SuperAdminProfileRead = Schemas['SuperAdminProfileRead']
export type ProvisionResult = Schemas['ProvisionResult']
export type AccessRequestType = Schemas['AccessRequestType']
export type ResearchPIRequestCreate = Schemas['ResearchPIRequestCreate']
export type CROStaffRequestCreate = Schemas['CROStaffRequestCreate']
export type SitePIRequestCreate = Schemas['SitePIRequestCreate']
export type SiteParticipationRequestCreate = Schemas['SiteParticipationRequestCreate']
export type SiteParticipationRequestRead = Schemas['SiteParticipationRequestRead']
export type SiteParticipationDecisionReview = Schemas['SiteParticipationDecisionReview']
export type SiteParticipationStatus = Schemas['SiteParticipationStatus']
export type ParticipationDecisionStatus = Schemas['ParticipationDecisionStatus']
export type TeamMemberInviteCreate = Schemas['TeamMemberInviteCreate']
export type TeamMemberVerificationRequestRead = Schemas['TeamMemberVerificationRequestRead']
export type TeamMemberVerificationReview = Schemas['TeamMemberVerificationReview']
export type VerifierCreateRequest = Schemas['VerifierCreateRequest']
export type FirstLoginSetupRequest = Schemas['FirstLoginSetupRequest']

