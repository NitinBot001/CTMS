from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import (
    CAPAStatus,
    CAPAType,
    DeviationSeverity,
    DeviationStatus,
    ECStatus,
    RegulatoryStatus,
)


class EthicsApprovalBase(BaseModel):
    study_id: uuid.UUID
    site_id: uuid.UUID | None = None
    committee_name: str
    approval_number: str | None = None
    status: ECStatus
    submission_date: datetime.date | None = None
    approval_date: datetime.date | None = None
    expiry_date: datetime.date | None = None


class EthicsApprovalCreate(EthicsApprovalBase):
    pass


class EthicsApprovalRead(EthicsApprovalBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime


class RegulatorySubmissionBase(BaseModel):
    study_id: uuid.UUID
    submission_type: str
    authority: str
    reference_number: str | None = None
    status: RegulatoryStatus
    submission_date: datetime.date | None = None
    approval_date: datetime.date | None = None


class RegulatorySubmissionCreate(RegulatorySubmissionBase):
    pass


class RegulatorySubmissionRead(RegulatorySubmissionBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime


class ProtocolDeviationBase(BaseModel):
    study_id: uuid.UUID
    site_id: uuid.UUID | None = None
    participant_id: uuid.UUID | None = None
    category: str
    description: str
    severity: DeviationSeverity
    status: DeviationStatus
    identified_date: datetime.date
    resolution_date: datetime.date | None = None


class ProtocolDeviationCreate(ProtocolDeviationBase):
    pass


class ProtocolDeviationRead(ProtocolDeviationBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime


class CAPARecordBase(BaseModel):
    study_id: uuid.UUID | None = None
    organization_id: uuid.UUID | None = None
    deviation_id: uuid.UUID | None = None
    capa_type: CAPAType
    description: str
    status: CAPAStatus
    due_date: datetime.date | None = None
    completed_date: datetime.date | None = None
    assigned_to: uuid.UUID | None = None


class CAPARecordCreate(CAPARecordBase):
    pass


class CAPARecordRead(CAPARecordBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime
