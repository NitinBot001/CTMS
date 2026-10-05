from __future__ import annotations

import uuid
from datetime import date

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import MilestoneStatus


class StudyMilestone(BaseModel):
    __tablename__ = "study_milestones"

    study_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("studies.id"), index=True)
    title: Mapped[str] = mapped_column(sa.String(300))
    description: Mapped[str | None] = mapped_column(sa.Text)

    planned_date: Mapped[date | None] = mapped_column(sa.Date)
    actual_date: Mapped[date | None] = mapped_column(sa.Date)

    status: Mapped[MilestoneStatus] = mapped_column(
        sa.Enum(MilestoneStatus, name="milestone_status", create_constraint=True)
    )

    # Relationships
    study: Mapped[Study] = relationship(back_populates="milestones")
