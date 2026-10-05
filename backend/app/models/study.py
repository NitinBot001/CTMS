from __future__ import annotations

import uuid
from datetime import date

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
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


class Study(BaseModel):
    __tablename__ = "studies"

    study_code: Mapped[str] = mapped_column(sa.String(50), unique=True, index=True)
    protocol_number: Mapped[str] = mapped_column(sa.String(100), unique=True, index=True)
    title: Mapped[str] = mapped_column(sa.String(500))
    short_title: Mapped[str | None] = mapped_column(sa.String(200))

    study_type: Mapped[StudyType] = mapped_column(
        sa.Enum(StudyType, name="study_type", create_constraint=True)
    )
    phase: Mapped[StudyPhase] = mapped_column(
        sa.Enum(StudyPhase, name="study_phase", create_constraint=True)
    )

    sponsor_org_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("organizations.id"), index=True)
    cro_org_id: Mapped[uuid.UUID | None] = mapped_column(
        sa.ForeignKey("organizations.id"), index=True
    )

    therapeutic_area: Mapped[str] = mapped_column(sa.String(200))
    intervention_type: Mapped[str | None] = mapped_column(sa.String(200))
    study_design: Mapped[str | None] = mapped_column(sa.String(200))

    blinding: Mapped[BlindingType | None] = mapped_column(
        sa.Enum(BlindingType, name="blinding_type", create_constraint=True)
    )
    randomization: Mapped[bool | None] = mapped_column(sa.Boolean)
    planned_sample_size: Mapped[int | None] = mapped_column(sa.Integer)

    start_date: Mapped[date | None] = mapped_column(sa.Date)
    end_date: Mapped[date | None] = mapped_column(sa.Date)
    recruitment_start_date: Mapped[date | None] = mapped_column(sa.Date)
    recruitment_end_date: Mapped[date | None] = mapped_column(sa.Date)

    status: Mapped[StudyStatus] = mapped_column(
        sa.Enum(StudyStatus, name="study_status", create_constraint=True)
    )

    ctri_status: Mapped[CTRIStatus | None] = mapped_column(
        sa.Enum(CTRIStatus, name="ctri_status", create_constraint=True)
    )
    ctri_number: Mapped[str | None] = mapped_column(sa.String(50), index=True)

    ec_approval_status: Mapped[ApprovalStatus | None] = mapped_column(
        sa.Enum(ApprovalStatus, name="study_ec_approval_status", create_constraint=True)
    )
    regulatory_status: Mapped[RegulatoryStatus | None] = mapped_column(
        sa.Enum(RegulatoryStatus, name="study_regulatory_status", create_constraint=True)
    )

    description: Mapped[str | None] = mapped_column(sa.Text)

    # Relationships
    sponsor_org: Mapped[Organization] = relationship(
        back_populates="sponsored_studies", foreign_keys=[sponsor_org_id]
    )
    cro_org: Mapped[Organization | None] = relationship(
        back_populates="managed_studies", foreign_keys=[cro_org_id]
    )

    study_sites: Mapped[list[StudySite]] = relationship(
        back_populates="study", cascade="all, delete-orphan"
    )
    team_members: Mapped[list[StudyTeamMember]] = relationship(
        back_populates="study", cascade="all, delete-orphan"
    )
    participants: Mapped[list[Participant]] = relationship(
        back_populates="study", cascade="all, delete-orphan"
    )
    milestones: Mapped[list[StudyMilestone]] = relationship(
        back_populates="study", cascade="all, delete-orphan"
    )
    adverse_events: Mapped[list[AdverseEvent]] = relationship(
        back_populates="study", cascade="all, delete-orphan"
    )
    ethics_approvals: Mapped[list[EthicsApproval]] = relationship(
        back_populates="study", cascade="all, delete-orphan"
    )
    regulatory_submissions: Mapped[list[RegulatorySubmission]] = relationship(
        back_populates="study", cascade="all, delete-orphan"
    )
    protocol_deviations: Mapped[list[ProtocolDeviation]] = relationship(
        back_populates="study", cascade="all, delete-orphan"
    )
    capa_records: Mapped[list[CAPARecord]] = relationship(
        back_populates="study", cascade="all, delete-orphan"
    )
    documents: Mapped[list[Document]] = relationship(
        back_populates="study", cascade="all, delete-orphan"
    )


class StudyTeamMember(BaseModel):
    __tablename__ = "study_team_members"

    study_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("studies.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("users.id"), index=True)
    role_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("roles.id"))
    site_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("sites.id"))

    assignment_status: Mapped[AssignmentStatus] = mapped_column(
        sa.Enum(AssignmentStatus, name="team_assignment_status", create_constraint=True)
    )
    start_date: Mapped[date | None] = mapped_column(sa.Date)
    end_date: Mapped[date | None] = mapped_column(sa.Date)

    # Relationships
    study: Mapped[Study] = relationship(back_populates="team_members")
    user: Mapped[User] = relationship(back_populates="study_team_assignments")
    role: Mapped[Role] = relationship(back_populates="study_team_members")
    site: Mapped[Site | None] = relationship(back_populates="study_team_members")
