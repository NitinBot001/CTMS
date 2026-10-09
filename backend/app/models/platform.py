from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import OnboardingRequestStatus, OrganizationType

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class OnboardingRequest(BaseModel):
    __tablename__ = "onboarding_requests"

    applicant_name: Mapped[str] = mapped_column(sa.String(255))
    organization_name: Mapped[str] = mapped_column(sa.String(255))
    organization_type: Mapped[OrganizationType] = mapped_column(
        sa.Enum(OrganizationType, name="organization_type", create_constraint=False)
    )
    email: Mapped[str] = mapped_column(sa.String(255))
    phone: Mapped[str | None] = mapped_column(sa.String(50))
    website: Mapped[str | None] = mapped_column(sa.String(500))
    description: Mapped[str | None] = mapped_column(sa.Text)
    
    country: Mapped[str | None] = mapped_column(sa.String(100))
    state: Mapped[str | None] = mapped_column(sa.String(100))
    city: Mapped[str | None] = mapped_column(sa.String(100))
    
    status: Mapped[OnboardingRequestStatus] = mapped_column(
        sa.Enum(OnboardingRequestStatus, name="onboarding_request_status", create_constraint=True),
        default=OnboardingRequestStatus.pending
    )
    
    review_notes: Mapped[str | None] = mapped_column(sa.Text)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("users.id"))
    reviewed_at: Mapped[datetime.datetime | None] = mapped_column(sa.DateTime)
    
    provisioned_organization_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("organizations.id"))
    provisioned_user_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("users.id"))
    
    reviewer: Mapped[User | None] = relationship(foreign_keys=[reviewed_by])
    provisioned_organization: Mapped[Organization | None] = relationship(foreign_keys=[provisioned_organization_id])
    provisioned_user: Mapped[User | None] = relationship(foreign_keys=[provisioned_user_id])
