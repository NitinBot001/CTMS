from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import OnboardingStatus, OrganizationStatus, OrganizationType


class OrganizationBase(BaseModel):
    name: str
    organization_type: OrganizationType
    registration_number: str | None = None
    website: str | None = None
    phone: str | None = None
    email: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: str | None = None
    registration_number: str | None = None
    website: str | None = None
    phone: str | None = None
    email: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None


class OrganizationRead(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    status: OrganizationStatus
    created_at: datetime.datetime
    updated_at: datetime.datetime


class OnboardingApplicationBase(BaseModel):
    organization_id: uuid.UUID


class OnboardingApplicationCreate(OnboardingApplicationBase):
    pass


class OnboardingApplicationRead(OnboardingApplicationBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    status: OnboardingStatus
    submitted_at: datetime.datetime | None = None
    reviewed_at: datetime.datetime | None = None
    reviewed_by: uuid.UUID | None = None
    review_notes: str | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
