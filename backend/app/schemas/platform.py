from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import OnboardingRequestStatus, OrganizationType
from app.schemas.user import UserRead


class OnboardingRequestBase(BaseModel):
    applicant_name: str
    organization_name: str
    organization_type: OrganizationType
    email: str
    phone: str | None = None
    website: str | None = None
    description: str | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None


class OnboardingRequestCreate(OnboardingRequestBase):
    pass


class OnboardingRequestRead(OnboardingRequestBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    status: OnboardingRequestStatus
    review_notes: str | None = None
    reviewed_by: uuid.UUID | None = None
    reviewed_at: datetime.datetime | None = None
    provisioned_organization_id: uuid.UUID | None = None
    provisioned_user_id: uuid.UUID | None = None
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
