from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import (
    ApprovalStatus,
    AssignmentStatus,
    BlindingType,
    CTRIStatus,
    RegulatoryStatus,
    StudyPhase,
    StudyStatus,
    StudyType,
)


class StudyBase(BaseModel):
    study_code: str
    protocol_number: str
    title: str
    short_title: str | None = None
    study_type: StudyType
    phase: StudyPhase
    sponsor_org_id: uuid.UUID
    cro_org_id: uuid.UUID | None = None
    therapeutic_area: str
    intervention_type: str | None = None
    study_design: str | None = None
    blinding: BlindingType | None = None
    randomization: bool | None = None
    planned_sample_size: int | None = None
    start_date: datetime.date | None = None
    end_date: datetime.date | None = None
    recruitment_start_date: datetime.date | None = None
    recruitment_end_date: datetime.date | None = None
    ctri_status: CTRIStatus | None = None
    ctri_number: str | None = None
    description: str | None = None


class StudyCreate(StudyBase):
    pass


class StudyUpdate(BaseModel):
    title: str | None = None
    short_title: str | None = None
    therapeutic_area: str | None = None
    intervention_type: str | None = None
    study_design: str | None = None
    blinding: BlindingType | None = None
    randomization: bool | None = None
    planned_sample_size: int | None = None
    start_date: datetime.date | None = None
    end_date: datetime.date | None = None
    recruitment_start_date: datetime.date | None = None
    recruitment_end_date: datetime.date | None = None
    ctri_status: CTRIStatus | None = None
    ctri_number: str | None = None
    description: str | None = None


class StudyRead(StudyBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    status: StudyStatus
    ec_approval_status: ApprovalStatus | None = None
    regulatory_status: RegulatoryStatus | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime


class StudyTeamMemberBase(BaseModel):
    study_id: uuid.UUID
    user_id: uuid.UUID
    role_id: uuid.UUID
    site_id: uuid.UUID | None = None
    start_date: datetime.date | None = None
    end_date: datetime.date | None = None


class StudyTeamMemberCreate(StudyTeamMemberBase):
    pass


class StudyTeamMemberRead(StudyTeamMemberBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    assignment_status: AssignmentStatus
    created_at: datetime.datetime
    updated_at: datetime.datetime
