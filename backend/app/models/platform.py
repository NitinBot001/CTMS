from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import (
    AccessRequestType,
    OnboardingRequestStatus,
    OrganizationType,
    ParticipationDecisionStatus,
    SiteParticipationStatus,
)

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.site import Site, StudySite
    from app.models.study import Study
    from app.models.user import User


class OnboardingRequest(BaseModel):
    __tablename__ = "onboarding_requests"

    request_type: Mapped[AccessRequestType] = mapped_column(
        sa.Enum(AccessRequestType, name="access_request_type", create_constraint=False),
        default=AccessRequestType.research_pi,
    )
    applicant_name: Mapped[str] = mapped_column(sa.String(255))
    organization_name: Mapped[str] = mapped_column(sa.String(255))
    organization_type: Mapped[OrganizationType] = mapped_column(
        sa.Enum(OrganizationType, name="organization_type", create_constraint=False)
    )
    email: Mapped[str] = mapped_column(sa.String(255))
    phone: Mapped[str | None] = mapped_column(sa.String(50))
    website: Mapped[str | None] = mapped_column(sa.String(500))
    description: Mapped[str | None] = mapped_column(sa.Text)

    designation: Mapped[str | None] = mapped_column(sa.String(100))
    qualifications: Mapped[str | None] = mapped_column(sa.String(255))
    requested_role: Mapped[str | None] = mapped_column(sa.String(100))
    declaration_accepted: Mapped[bool] = mapped_column(sa.Boolean, default=True)

    country: Mapped[str | None] = mapped_column(sa.String(100))
    state: Mapped[str | None] = mapped_column(sa.String(100))
    city: Mapped[str | None] = mapped_column(sa.String(100))

    proposed_site_name: Mapped[str | None] = mapped_column(sa.String(255))
    site_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("sites.id"))
    organization_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("organizations.id"))

    status: Mapped[OnboardingRequestStatus] = mapped_column(
        sa.Enum(OnboardingRequestStatus, name="onboarding_request_status", create_constraint=False),
        default=OnboardingRequestStatus.pending,
    )

    review_notes: Mapped[str | None] = mapped_column(sa.Text)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("users.id"))
    reviewed_at: Mapped[datetime.datetime | None] = mapped_column(sa.DateTime)

    provisioned_organization_id: Mapped[uuid.UUID | None] = mapped_column(
        sa.ForeignKey("organizations.id")
    )
    provisioned_user_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("users.id"))
    provisioned_site_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("sites.id"))

    reviewer: Mapped[User | None] = relationship(foreign_keys=[reviewed_by])
    provisioned_organization: Mapped[Organization | None] = relationship(
        foreign_keys=[provisioned_organization_id]
    )
    provisioned_user: Mapped[User | None] = relationship(foreign_keys=[provisioned_user_id])
    site: Mapped[Site | None] = relationship(foreign_keys=[site_id])
    provisioned_site: Mapped[Site | None] = relationship(foreign_keys=[provisioned_site_id])
    organization: Mapped[Organization | None] = relationship(foreign_keys=[organization_id])


class SiteParticipationRequest(BaseModel):
    __tablename__ = "site_participation_requests"

    study_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("studies.id"), index=True)
    site_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("sites.id"), index=True)
    requested_by_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("users.id"))

    # Dual decisions
    government_status: Mapped[ParticipationDecisionStatus] = mapped_column(
        sa.Enum(
            ParticipationDecisionStatus,
            name="participation_decision_status",
            create_constraint=False,
        ),
        default=ParticipationDecisionStatus.pending,
    )
    government_reviewer_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("users.id"))
    government_reviewed_at: Mapped[datetime.datetime | None] = mapped_column(sa.DateTime)
    government_notes: Mapped[str | None] = mapped_column(sa.Text)

    site_status: Mapped[ParticipationDecisionStatus] = mapped_column(
        sa.Enum(
            ParticipationDecisionStatus,
            name="participation_decision_status",
            create_constraint=False,
        ),
        default=ParticipationDecisionStatus.pending,
    )
    site_reviewer_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("users.id"))
    site_reviewed_at: Mapped[datetime.datetime | None] = mapped_column(sa.DateTime)
    site_notes: Mapped[str | None] = mapped_column(sa.Text)

    status: Mapped[SiteParticipationStatus] = mapped_column(
        sa.Enum(SiteParticipationStatus, name="site_participation_status", create_constraint=False),
        default=SiteParticipationStatus.requested,
    )

    study_site_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("study_sites.id"))

    # Relationships
    study: Mapped[Study] = relationship()
    site: Mapped[Site] = relationship()
    requested_by: Mapped[User] = relationship(foreign_keys=[requested_by_id])
    government_reviewer: Mapped[User | None] = relationship(foreign_keys=[government_reviewer_id])
    site_reviewer: Mapped[User | None] = relationship(foreign_keys=[site_reviewer_id])
    study_site: Mapped[StudySite | None] = relationship(foreign_keys=[study_site_id])


class TeamMemberVerificationRequest(BaseModel):
    __tablename__ = "team_member_verification_requests"

    invited_by_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("users.id"))
    full_name: Mapped[str] = mapped_column(sa.String(200))
    email: Mapped[str] = mapped_column(sa.String(255), index=True)
    phone: Mapped[str | None] = mapped_column(sa.String(50))
    designation: Mapped[str | None] = mapped_column(sa.String(100))

    organization_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("organizations.id"))
    study_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("studies.id"))
    site_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("sites.id"))
    requested_role: Mapped[str] = mapped_column(sa.String(100))

    status: Mapped[OnboardingRequestStatus] = mapped_column(
        sa.Enum(OnboardingRequestStatus, name="onboarding_request_status", create_constraint=False),
        default=OnboardingRequestStatus.pending,
    )

    review_notes: Mapped[str | None] = mapped_column(sa.Text)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("users.id"))
    reviewed_at: Mapped[datetime.datetime | None] = mapped_column(sa.DateTime)

    provisioned_user_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("users.id"))

    # Relationships
    invited_by: Mapped[User] = relationship(foreign_keys=[invited_by_id])
    reviewed_by_user: Mapped[User | None] = relationship(foreign_keys=[reviewed_by])
    organization: Mapped[Organization | None] = relationship()
    study: Mapped[Study | None] = relationship()
    site: Mapped[Site | None] = relationship()
    provisioned_user: Mapped[User | None] = relationship(foreign_keys=[provisioned_user_id])
