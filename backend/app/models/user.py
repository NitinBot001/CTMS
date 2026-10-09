from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import ScopeLevel, UserStatus

if TYPE_CHECKING:
    from app.models.audit import AuditLog
    from app.models.compliance import CAPARecord
    from app.models.document import Document
    from app.models.organization import OnboardingApplication, OrganizationMember
    from app.models.safety import AdverseEvent
    from app.models.study import StudyTeamMember


class User(BaseModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(sa.String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(sa.String(200))
    phone: Mapped[str | None] = mapped_column(sa.String(50))
    status: Mapped[UserStatus] = mapped_column(
        sa.Enum(UserStatus, name="user_status", create_constraint=True)
    )
    hashed_password: Mapped[str] = mapped_column(sa.String(255))
    must_change_password: Mapped[bool] = mapped_column(sa.Boolean, default=False)
    password_changed_at: Mapped[datetime.datetime | None] = mapped_column(sa.DateTime)
    last_login_at: Mapped[datetime.datetime | None] = mapped_column(sa.DateTime)

    # Relationships
    memberships: Mapped[list[OrganizationMember]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    study_team_assignments: Mapped[list[StudyTeamMember]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    audit_logs: Mapped[list[AuditLog]] = relationship(back_populates="user")
    documents_uploaded: Mapped[list[Document]] = relationship(
        back_populates="uploaded_by_user", foreign_keys="Document.uploaded_by"
    )
    documents_approved: Mapped[list[Document]] = relationship(
        back_populates="approved_by_user", foreign_keys="Document.approved_by"
    )
    adverse_events_reported: Mapped[list[AdverseEvent]] = relationship(back_populates="reporter")
    applications_reviewed: Mapped[list[OnboardingApplication]] = relationship(
        back_populates="reviewer"
    )
    capas_assigned: Mapped[list[CAPARecord]] = relationship(back_populates="assignee")
    super_admin_profile: Mapped[SuperAdminProfile] = relationship(back_populates="user", uselist=False)


class Role(BaseModel):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(sa.String(100), unique=True)
    description: Mapped[str | None] = mapped_column(sa.Text)
    scope_level: Mapped[ScopeLevel] = mapped_column(
        sa.Enum(ScopeLevel, name="scope_level", create_constraint=True)
    )
    is_system_role: Mapped[bool] = mapped_column(sa.Boolean, default=False)

    # Relationships
    permissions: Mapped[list[RolePermission]] = relationship(
        back_populates="role", cascade="all, delete-orphan"
    )
    organization_members: Mapped[list[OrganizationMember]] = relationship(back_populates="role")
    study_team_members: Mapped[list[StudyTeamMember]] = relationship(back_populates="role")


class Permission(BaseModel):
    __tablename__ = "permissions"

    codename: Mapped[str] = mapped_column(sa.String(100), unique=True)
    description: Mapped[str | None] = mapped_column(sa.Text)
    resource: Mapped[str] = mapped_column(sa.String(100))
    action: Mapped[str] = mapped_column(sa.String(50))

    # Relationships
    roles: Mapped[list[RolePermission]] = relationship(
        back_populates="permission", cascade="all, delete-orphan"
    )


class RolePermission(BaseModel):
    __tablename__ = "role_permissions"

    # Make these primary keys too for composite PK
    role_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("roles.id"), primary_key=True)
    permission_id: Mapped[uuid.UUID] = mapped_column(
        sa.ForeignKey("permissions.id"), primary_key=True
    )

    # Relationships
    role: Mapped[Role] = relationship(back_populates="permissions")
    permission: Mapped[Permission] = relationship(back_populates="roles")


class SuperAdminProfile(BaseModel):
    __tablename__ = "super_admin_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("users.id"), unique=True)
    is_active: Mapped[bool] = mapped_column(sa.Boolean, default=True)
    bootstrapped_at: Mapped[datetime.datetime] = mapped_column(sa.DateTime, default=sa.func.now())

    user: Mapped[User] = relationship(back_populates="super_admin_profile")


class InvitationToken(BaseModel):
    __tablename__ = "invitation_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("users.id"))
    token_hash: Mapped[str] = mapped_column(sa.String(255))
    expires_at: Mapped[datetime.datetime] = mapped_column(sa.DateTime)
    is_used: Mapped[bool] = mapped_column(sa.Boolean, default=False)

    user: Mapped[User] = relationship()

