from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import AssignmentStatus, ScopeLevel, UserStatus


class UserBase(BaseModel):
    email: str
    full_name: str
    phone: str | None = None


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    status: UserStatus
    created_at: datetime.datetime
    updated_at: datetime.datetime


class RoleBase(BaseModel):
    name: str
    description: str | None = None
    scope_level: ScopeLevel


class RoleCreate(RoleBase):
    pass


class RoleRead(RoleBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    is_system_role: bool
    created_at: datetime.datetime


class PermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    codename: str
    description: str | None = None
    resource: str
    action: str


class OrganizationMemberBase(BaseModel):
    user_id: uuid.UUID
    organization_id: uuid.UUID
    role_id: uuid.UUID


class OrganizationMemberCreate(OrganizationMemberBase):
    pass


class OrganizationMemberRead(OrganizationMemberBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    status: AssignmentStatus
    joined_at: datetime.datetime
    created_at: datetime.datetime
    updated_at: datetime.datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class UserMembershipDetail(BaseModel):
    organization_id: uuid.UUID
    organization_name: str | None = None
    role_name: str | None = None
    scope_level: str | None = None
    status: str


class UserProfileRead(BaseModel):
    user: UserRead
    permissions: list[str]
    is_system_admin: bool
    memberships: list[UserMembershipDetail]

