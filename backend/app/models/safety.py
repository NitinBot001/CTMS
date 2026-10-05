from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import (
    AdverseEventType,
    AEOutcome,
    AEStatus,
    Causality,
    Expectedness,
    Seriousness,
    Severity,
)

if TYPE_CHECKING:
    from app.models.participant import Participant
    from app.models.site import Site
    from app.models.study import Study
    from app.models.user import User


class AdverseEvent(BaseModel):
    __tablename__ = "adverse_events"

    study_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("studies.id"), index=True)
    participant_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("participants.id"), index=True)
    site_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("sites.id"), index=True)

    event_type: Mapped[AdverseEventType] = mapped_column(
        sa.Enum(AdverseEventType, name="adverse_event_type", create_constraint=True)
    )
    description: Mapped[str] = mapped_column(sa.Text)

    onset_date: Mapped[date] = mapped_column(sa.Date)
    resolution_date: Mapped[date | None] = mapped_column(sa.Date)

    seriousness: Mapped[Seriousness] = mapped_column(
        sa.Enum(Seriousness, name="ae_seriousness", create_constraint=True)
    )
    severity: Mapped[Severity] = mapped_column(
        sa.Enum(Severity, name="ae_severity", create_constraint=True)
    )
    causality: Mapped[Causality | None] = mapped_column(
        sa.Enum(Causality, name="ae_causality", create_constraint=True)
    )
    expectedness: Mapped[Expectedness | None] = mapped_column(
        sa.Enum(Expectedness, name="ae_expectedness", create_constraint=True)
    )

    action_taken: Mapped[str | None] = mapped_column(sa.String(500))
    outcome: Mapped[AEOutcome | None] = mapped_column(
        sa.Enum(AEOutcome, name="ae_outcome", create_constraint=True)
    )
    reporting_deadline: Mapped[date | None] = mapped_column(sa.Date)

    status: Mapped[AEStatus] = mapped_column(
        sa.Enum(AEStatus, name="ae_status", create_constraint=True)
    )
    reported_by: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("users.id"))

    # Relationships
    study: Mapped[Study] = relationship(back_populates="adverse_events")
    participant: Mapped[Participant] = relationship(back_populates="adverse_events")
    site: Mapped[Site | None] = relationship(back_populates="adverse_events")
    reporter: Mapped[User | None] = relationship(back_populates="adverse_events_reported")
