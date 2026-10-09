from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import (
    ContractStatus,
    ECStatus,
    MonitoringStatus,
    SiteStatus,
    SiteType,
    StudySiteActivationStatus,
)


class SiteBase(BaseModel):
    site_code: str
    name: str
    site_type: SiteType
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    phone: str | None = None
    email: str | None = None
    organization_id: uuid.UUID | None = None


class SiteCreate(SiteBase):
    pass


class SiteUpdate(BaseModel):
    name: str | None = None
    site_type: SiteType | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    phone: str | None = None
    email: str | None = None
    organization_id: uuid.UUID | None = None
    status: SiteStatus | None = None


class SiteRead(SiteBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    status: SiteStatus
    created_at: datetime.datetime
    updated_at: datetime.datetime


class StudySiteBase(BaseModel):
    site_id: uuid.UUID
    recruitment_target: int | None = None
    monitoring_status: MonitoringStatus | None = None


class StudySiteCreate(StudySiteBase):
    pass


class StudySiteRead(StudySiteBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    study_id: uuid.UUID
    activation_status: StudySiteActivationStatus
    ec_status: ECStatus | None = None
    contract_status: ContractStatus | None = None
    activation_date: datetime.date | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
