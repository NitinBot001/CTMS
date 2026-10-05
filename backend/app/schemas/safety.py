from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import (
    AdverseEventType,
    AEOutcome,
    AEStatus,
    Causality,
    Expectedness,
    Seriousness,
    Severity,
)


class AdverseEventBase(BaseModel):
    study_id: uuid.UUID
    participant_id: uuid.UUID
    site_id: uuid.UUID | None = None
    event_type: AdverseEventType
    description: str
    onset_date: datetime.date
    resolution_date: datetime.date | None = None
    seriousness: Seriousness
    severity: Severity
    causality: Causality | None = None
    expectedness: Expectedness | None = None
    action_taken: str | None = None
    outcome: AEOutcome | None = None
    reporting_deadline: datetime.date | None = None


class AdverseEventCreate(AdverseEventBase):
    pass


class AdverseEventRead(AdverseEventBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    status: AEStatus
    reported_by: uuid.UUID | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
