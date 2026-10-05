from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import (
    AssignmentStatus,
    OnboardingStatus,
    OrganizationStatus,
    OrganizationType,
)


class Organization(BaseModel):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(sa.String(255))
    organization_type: Mapped[OrganizationType] = mapped_column(
        sa.Enum(OrganizationType, name="organization_type", create_constraint=True)
    )
    status: Mapped[OrganizationStatus] = mapped_column(
        sa.Enum(OrganizationStatus, name="organization_status", create_constraint=True)
    )

    registration_number: Mapped[str | None] = mapped_column(sa.String(100))
    website: Mapped[str | None] = mapped_column(sa.String(500))
    phone: Mapped[str | None] = mapped_column(sa.String(50))
    email: Mapped[str | None] = mapped_column(sa.String(255))

    address_line1: Mapped[str | None] = mapped_column(sa.String(255))
    address_line2: Mapped[str | None] = mapped_column(sa.String(255))
    city: Mapped[str | None] = mapped_column(sa.String(100))
    state: Mapped[str | None] = mapped_column(sa.String(100))
    country: Mapped[str | None] = mapped_column(sa.String(100))
    postal_code: Mapped[str | None] = mapped_column(sa.String(20))

    # Relationships
    onboarding_applications: Mapped[list[OnboardingApplication]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    members: Mapped[list[OrganizationMember]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    sponsored_studies: Mapped[list[Study]] = relationship(
        back_populates="sponsor_org", foreign_keys="Study.sponsor_org_id"
    )
    managed_studies: Mapped[list[Study]] = relationship(
        back_populates="cro_org", foreign_keys="Study.cro_org_id"
    )
    affiliated_sites: Mapped[list[Site]] = relationship(back_populates="organization")
    documents: Mapped[list[Document]] = relationship(back_populates="organization")
    capa_records: Mapped[list[CAPARecord]] = relationship(back_populates="organization")


class OnboardingApplication(BaseModel):
    __tablename__ = "onboarding_applications"

    organization_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("organizations.id"))
    status: Mapped[OnboardingStatus] = mapped_column(
        sa.Enum(OnboardingStatus, name="onboarding_status", create_constraint=True)
    )

    submitted_at: Mapped[datetime | None] = mapped_column(sa.DateTime)
    reviewed_at: Mapped[datetime | None] = mapped_column(sa.DateTime)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("users.id"))
    review_notes: Mapped[str | None] = mapped_column(sa.Text)

    # Relationships
    organization: Mapped[Organization] = relationship(back_populates="onboarding_applications")
    reviewer: Mapped[User | None] = relationship(back_populates="applications_reviewed")


class OrganizationMember(BaseModel):
    __tablename__ = "organization_members"
    __table_args__ = (
        sa.UniqueConstraint(
            "user_id", "organization_id", name="uq_organization_members_user_organization"
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("users.id"), index=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        sa.ForeignKey("organizations.id"), index=True
    )
    role_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("roles.id"))

    status: Mapped[AssignmentStatus] = mapped_column(
        sa.Enum(AssignmentStatus, name="assignment_status", create_constraint=True)
    )
    joined_at: Mapped[datetime] = mapped_column(sa.DateTime, default=sa.func.now())

    # Relationships
    user: Mapped[User] = relationship(back_populates="memberships")
    organization: Mapped[Organization] = relationship(back_populates="members")
    role: Mapped[Role] = relationship(back_populates="organization_members")
