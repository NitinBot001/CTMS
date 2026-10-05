from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import ParticipantStatus

if TYPE_CHECKING:
    from app.models.compliance import ProtocolDeviation
    from app.models.safety import AdverseEvent
    from app.models.site import Site
    from app.models.study import Study


class Participant(BaseModel):
    __tablename__ = "participants"

    participant_code: Mapped[str] = mapped_column(sa.String(50), unique=True, index=True)
    study_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("studies.id"), index=True)
    site_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("sites.id"), index=True)

    status: Mapped[ParticipantStatus] = mapped_column(
        sa.Enum(ParticipantStatus, name="participant_status", create_constraint=True)
    )

    screening_date: Mapped[date | None] = mapped_column(sa.Date)
    enrollment_date: Mapped[date | None] = mapped_column(sa.Date)
    randomization_date: Mapped[date | None] = mapped_column(sa.Date)
    completion_date: Mapped[date | None] = mapped_column(sa.Date)
    withdrawal_date: Mapped[date | None] = mapped_column(sa.Date)

    withdrawal_reason: Mapped[str | None] = mapped_column(sa.Text)

    # Relationships
    study: Mapped[Study] = relationship(back_populates="participants")
    site: Mapped[Site | None] = relationship(back_populates="participants")

    adverse_events: Mapped[list[AdverseEvent]] = relationship(
        back_populates="participant", cascade="all, delete-orphan"
    )
    protocol_deviations: Mapped[list[ProtocolDeviation]] = relationship(
        back_populates="participant", cascade="all, delete-orphan"
    )
