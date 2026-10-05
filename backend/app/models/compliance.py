from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import (
    CAPAStatus,
    CAPAType,
    DeviationSeverity,
    DeviationStatus,
    ECStatus,
    RegulatoryStatus,
)

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.participant import Participant
    from app.models.site import Site
    from app.models.study import Study
    from app.models.user import User


class EthicsApproval(BaseModel):
    __tablename__ = "ethics_approvals"

    study_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("studies.id"), index=True)
    site_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("sites.id"))

    committee_name: Mapped[str] = mapped_column(sa.String(300))
    approval_number: Mapped[str | None] = mapped_column(sa.String(100))

    status: Mapped[ECStatus] = mapped_column(
        sa.Enum(ECStatus, name="ec_approval_status", create_constraint=True)
    )

    submission_date: Mapped[date | None] = mapped_column(sa.Date)
    approval_date: Mapped[date | None] = mapped_column(sa.Date)
    expiry_date: Mapped[date | None] = mapped_column(sa.Date, index=True)

    # Relationships
    study: Mapped[Study] = relationship(back_populates="ethics_approvals")
    site: Mapped[Site | None] = relationship(back_populates="ethics_approvals")


class RegulatorySubmission(BaseModel):
    __tablename__ = "regulatory_submissions"

    study_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("studies.id"), index=True)

    submission_type: Mapped[str] = mapped_column(sa.String(200))
    authority: Mapped[str] = mapped_column(sa.String(300))
    reference_number: Mapped[str | None] = mapped_column(sa.String(100))

    status: Mapped[RegulatoryStatus] = mapped_column(
        sa.Enum(RegulatoryStatus, name="reg_submission_status", create_constraint=True)
    )

    submission_date: Mapped[date | None] = mapped_column(sa.Date)
    approval_date: Mapped[date | None] = mapped_column(sa.Date)

    # Relationships
    study: Mapped[Study] = relationship(back_populates="regulatory_submissions")


class ProtocolDeviation(BaseModel):
    __tablename__ = "protocol_deviations"

    study_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("studies.id"), index=True)
    site_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("sites.id"))
    participant_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("participants.id"))

    category: Mapped[str] = mapped_column(sa.String(200))
    description: Mapped[str] = mapped_column(sa.Text)

    severity: Mapped[DeviationSeverity] = mapped_column(
        sa.Enum(DeviationSeverity, name="deviation_severity", create_constraint=True)
    )
    status: Mapped[DeviationStatus] = mapped_column(
        sa.Enum(DeviationStatus, name="deviation_status", create_constraint=True)
    )

    identified_date: Mapped[date] = mapped_column(sa.Date)
    resolution_date: Mapped[date | None] = mapped_column(sa.Date)

    # Relationships
    study: Mapped[Study] = relationship(back_populates="protocol_deviations")
    site: Mapped[Site | None] = relationship(back_populates="protocol_deviations")
    participant: Mapped[Participant | None] = relationship(back_populates="protocol_deviations")
    capa_records: Mapped[list[CAPARecord]] = relationship(back_populates="deviation")


class CAPARecord(BaseModel):
    __tablename__ = "capa_records"

    study_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("studies.id"), index=True)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("organizations.id"))
    deviation_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("protocol_deviations.id"))

    capa_type: Mapped[CAPAType] = mapped_column(
        sa.Enum(CAPAType, name="capa_type", create_constraint=True)
    )
    description: Mapped[str] = mapped_column(sa.Text)
    status: Mapped[CAPAStatus] = mapped_column(
        sa.Enum(CAPAStatus, name="capa_status", create_constraint=True)
    )

    due_date: Mapped[date | None] = mapped_column(sa.Date)
    completed_date: Mapped[date | None] = mapped_column(sa.Date)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("users.id"))

    # Relationships
    study: Mapped[Study | None] = relationship(back_populates="capa_records")
    organization: Mapped[Organization | None] = relationship(back_populates="capa_records")
    deviation: Mapped[ProtocolDeviation | None] = relationship(back_populates="capa_records")
    assignee: Mapped[User | None] = relationship(back_populates="capas_assigned")
