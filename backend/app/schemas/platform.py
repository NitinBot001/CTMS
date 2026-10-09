from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    AccessRequestType,
    OnboardingRequestStatus,
    OrganizationType,
    ParticipationDecisionStatus,
    SiteParticipationStatus,
)
from app.schemas.user import UserRead


class OnboardingRequestBase(BaseModel):
    request_type: AccessRequestType = AccessRequestType.research_pi
    applicant_name: str
    organization_name: str
    organization_type: OrganizationType = OrganizationType.sponsor
    email: str
    phone: str | None = None
    website: str | None = None
    description: str | None = None
    designation: str | None = None
    qualifications: str | None = None
    requested_role: str | None = None
    declaration_accepted: bool = True
    proposed_site_name: str | None = None
    site_id: uuid.UUID | None = None
    organization_id: uuid.UUID | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None


class OnboardingRequestCreate(OnboardingRequestBase):
    pass


class ResearchPIRequestCreate(BaseModel):
    applicant_name: str
    email: str
    phone: str | None = None
    designation: str | None = "Principal Investigator"
    organization_name: str
    organization_type: OrganizationType = OrganizationType.sponsor
    requested_role: str = "Principal Investigator"
    qualifications: str | None = None
    declaration_accepted: bool = True
    country: str | None = None
    state: str | None = None
    city: str | None = None
    organization_id: uuid.UUID | None = None
    website: str | None = None
    description: str | None = None


class CROStaffRequestCreate(BaseModel):
    applicant_name: str
    email: str
    phone: str | None = None
    designation: str | None = "Clinical Research Associate"
    organization_name: str
    organization_type: OrganizationType = OrganizationType.cro
    requested_role: str = "Clinical Research Associate"
    qualifications: str | None = None
    declaration_accepted: bool = True
    country: str | None = None
    state: str | None = None
    city: str | None = None
    organization_id: uuid.UUID | None = None
    website: str | None = None
    description: str | None = None


class SitePIRequestCreate(BaseModel):
    applicant_name: str
    email: str
    phone: str | None = None
    designation: str | None = "Site Principal Investigator"
    organization_name: str = "Clinical Site Institution"
    organization_type: OrganizationType = OrganizationType.institution
    requested_role: str = "Site Principal Investigator"
    proposed_site_name: str | None = None
    site_id: uuid.UUID | None = None
    qualifications: str | None = None
    declaration_accepted: bool = True
    country: str | None = None
    state: str | None = None
    city: str | None = None
    website: str | None = None
    description: str | None = None


class OnboardingRequestRead(OnboardingRequestBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: OnboardingRequestStatus
    review_notes: str | None = None
    reviewed_by: uuid.UUID | None = None
    reviewed_at: datetime.datetime | None = None
    provisioned_organization_id: uuid.UUID | None = None
    provisioned_user_id: uuid.UUID | None = None
    provisioned_site_id: uuid.UUID | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime


class OnboardingRequestReview(BaseModel):
    status: OnboardingRequestStatus
    review_notes: str | None = None


class ActivationRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class ActivationResponse(BaseModel):
    message: str
    email: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class FirstLoginSetupRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    full_name: str | None = None
    phone: str | None = None


class SuperAdminProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    is_active: bool
    bootstrapped_at: datetime.datetime
    user: UserRead


class ProvisionResult(BaseModel):
    organization_id: uuid.UUID
    user_email: str
    invitation_sent: bool
    raw_token: str | None = None


# =========================================================================
# SITE PARTICIPATION SCHEMAS
# =========================================================================


class SiteParticipationRequestCreate(BaseModel):
    study_id: uuid.UUID
    site_id: uuid.UUID
    notes: str | None = None


class SiteParticipationRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    study_id: uuid.UUID
    site_id: uuid.UUID
    requested_by_id: uuid.UUID

    government_status: ParticipationDecisionStatus
    government_reviewer_id: uuid.UUID | None = None
    government_reviewed_at: datetime.datetime | None = None
    government_notes: str | None = None

    site_status: ParticipationDecisionStatus
    site_reviewer_id: uuid.UUID | None = None
    site_reviewed_at: datetime.datetime | None = None
    site_notes: str | None = None

    status: SiteParticipationStatus
    study_site_id: uuid.UUID | None = None

    created_at: datetime.datetime
    updated_at: datetime.datetime


class SiteParticipationDecisionReview(BaseModel):
    decision: ParticipationDecisionStatus
    notes: str | None = None


# =========================================================================
# TEAM MEMBER VERIFICATION SCHEMAS
# =========================================================================


class TeamMemberInviteCreate(BaseModel):
    full_name: str
    email: str
    requested_role: str
    phone: str | None = None
    designation: str | None = None
    organization_id: uuid.UUID | None = None
    study_id: uuid.UUID | None = None
    site_id: uuid.UUID | None = None


class TeamMemberVerificationRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    invited_by_id: uuid.UUID
    full_name: str
    email: str
    phone: str | None = None
    designation: str | None = None
    organization_id: uuid.UUID | None = None
    study_id: uuid.UUID | None = None
    site_id: uuid.UUID | None = None
    requested_role: str
    status: OnboardingRequestStatus
    review_notes: str | None = None
    reviewed_by: uuid.UUID | None = None
    reviewed_at: datetime.datetime | None = None
    provisioned_user_id: uuid.UUID | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime


class TeamMemberVerificationReview(BaseModel):
    status: OnboardingRequestStatus
    review_notes: str | None = None


class VerifierCreateRequest(BaseModel):
    email: str
    full_name: str
