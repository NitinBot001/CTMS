from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import (
    ContractStatus,
    ECStatus,
    MonitoringStatus,
    SiteStatus,
    SiteType,
    StudySiteActivationStatus,
)

if TYPE_CHECKING:
    from app.models.compliance import EthicsApproval, ProtocolDeviation
    from app.models.document import Document
    from app.models.organization import Organization
    from app.models.participant import Participant
    from app.models.safety import AdverseEvent
    from app.models.study import Study, StudyTeamMember


class Site(BaseModel):
    __tablename__ = "sites"

    site_code: Mapped[str] = mapped_column(sa.String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(sa.String(300))
    site_type: Mapped[SiteType] = mapped_column(
        sa.Enum(SiteType, name="site_type", create_constraint=True)
    )

    address_line1: Mapped[str | None] = mapped_column(sa.String(255))
    address_line2: Mapped[str | None] = mapped_column(sa.String(255))
    city: Mapped[str | None] = mapped_column(sa.String(100))
    state: Mapped[str | None] = mapped_column(sa.String(100))
    country: Mapped[str | None] = mapped_column(sa.String(100))
    postal_code: Mapped[str | None] = mapped_column(sa.String(20))
    phone: Mapped[str | None] = mapped_column(sa.String(50))
    email: Mapped[str | None] = mapped_column(sa.String(255))

    organization_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("organizations.id"))
    status: Mapped[SiteStatus] = mapped_column(
        sa.Enum(SiteStatus, name="site_status", create_constraint=True)
    )

    # Relationships
    organization: Mapped[Organization | None] = relationship(back_populates="affiliated_sites")
    study_sites: Mapped[list[StudySite]] = relationship(
        back_populates="site", cascade="all, delete-orphan"
    )
    participants: Mapped[list[Participant]] = relationship(back_populates="site")
    study_team_members: Mapped[list[StudyTeamMember]] = relationship(back_populates="site")
    adverse_events: Mapped[list[AdverseEvent]] = relationship(back_populates="site")
    ethics_approvals: Mapped[list[EthicsApproval]] = relationship(back_populates="site")
    protocol_deviations: Mapped[list[ProtocolDeviation]] = relationship(back_populates="site")
    documents: Mapped[list[Document]] = relationship(back_populates="site")


class StudySite(BaseModel):
    __tablename__ = "study_sites"
    __table_args__ = (sa.UniqueConstraint("study_id", "site_id", name="uq_study_sites_study_site"),)

    study_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("studies.id"), index=True)
    site_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("sites.id"), index=True)

    activation_status: Mapped[StudySiteActivationStatus] = mapped_column(
        sa.Enum(
            StudySiteActivationStatus, name="study_site_activation_status", create_constraint=True
        )
    )
    ec_status: Mapped[ECStatus | None] = mapped_column(
        sa.Enum(ECStatus, name="study_site_ec_status", create_constraint=True)
    )
    contract_status: Mapped[ContractStatus | None] = mapped_column(
        sa.Enum(ContractStatus, name="study_site_contract_status", create_constraint=True)
    )

    recruitment_target: Mapped[int | None] = mapped_column(sa.Integer)
    monitoring_status: Mapped[MonitoringStatus | None] = mapped_column(
        sa.Enum(MonitoringStatus, name="monitoring_status", create_constraint=True)
    )

    activation_date: Mapped[date | None] = mapped_column(sa.Date)

    # Relationships
    study: Mapped[Study] = relationship(back_populates="study_sites")
    site: Mapped[Site] = relationship(back_populates="study_sites")
