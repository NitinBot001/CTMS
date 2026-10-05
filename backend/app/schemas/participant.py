from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import ParticipantStatus


class ParticipantBase(BaseModel):
    participant_code: str
    study_id: uuid.UUID
    site_id: uuid.UUID | None = None
    screening_date: datetime.date | None = None


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantRead(ParticipantBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    status: ParticipantStatus
    enrollment_date: datetime.date | None = None
    randomization_date: datetime.date | None = None
    completion_date: datetime.date | None = None
    withdrawal_date: datetime.date | None = None
    withdrawal_reason: str | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
