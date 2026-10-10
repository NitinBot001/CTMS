from __future__ import annotations

import uuid
from collections.abc import Callable
from typing import Any

import jwt
import sqlalchemy as sa
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.base import NO_VALUE

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.enums import AssignmentStatus, ScopeLevel, UserStatus
from app.models.organization import Organization, OrganizationMember
from app.models.study import Study, StudyTeamMember
from app.models.user import Role, RolePermission, User

# Security scheme: Bearer token
security_bearer = HTTPBearer(auto_error=False)

RESERVED_SYSTEM_ROLE_NAMES: set[str] = {
    "system administrator",
    "system admin",
    "super admin",
    "superadmin",
    "global administrator",
    "platform administrator",
    "platform super admin",
    "government super admin",
    "government verification super admin",
    "global system auditor",
    "global auditor",
}


def _get_membership_organization(membership: OrganizationMember) -> Organization | None:
    """Safely retrieves loaded organization from membership without triggering lazy loads."""
    try:
        insp = sa.inspect(membership)
        val = insp.attrs.organization.loaded_value
        if val is not NO_VALUE and isinstance(val, Organization):
            return val
    except Exception:
        pass
    try:
        val = getattr(membership, "organization", None)
        if isinstance(val, Organization):
            return val
    except Exception:
        pass
    return None


def is_trusted_platform_organization(org: Organization | None) -> bool:
    """
    Determines whether an organization is the genuine, explicitly trusted platform authority.

    Security rules:
    - Never infers authority from organization name, email domain, or applicant-supplied registration numbers.
    - Requires an explicit trusted platform identifier (settings.PLATFORM_ORGANIZATION_ID)
      or a protected database attribute (org.is_platform_authority is True) established
      by platform-controlled bootstrap or migration.
    - If neither is configured or established, fails closed (returns False).
    """
    if not org:
        return False

    # Check 1: Protected database attribute established by platform-controlled bootstrap/migration
    if getattr(org, "is_platform_authority", False) is True:
        return True

    # Check 2: Explicitly configured trusted platform identifier in application settings
    settings = get_settings()
    if settings.PLATFORM_ORGANIZATION_ID:
        try:
            if str(org.id) == str(uuid.UUID(settings.PLATFORM_ORGANIZATION_ID)):
                return True
        except (ValueError, TypeError):
            if str(org.id) == settings.PLATFORM_ORGANIZATION_ID:
                return True

    # Fail closed: ordinary institutions, hospitals, sponsors, and CROs receive no platform authority
    return False


# Backward compatibility alias
_is_central_platform_organization = is_trusted_platform_organization


def is_system_admin(user: User) -> bool:
    """Checks whether the user has a system-level administrator role or super admin profile."""
    if hasattr(user, "super_admin_profile") and user.super_admin_profile and user.super_admin_profile.is_active:
        return True

    for membership in user.memberships:
        if (
            membership.status == AssignmentStatus.active
            and membership.role
            and (membership.role.scope_level == ScopeLevel.system or membership.role.name == "System Administrator")
        ):
            org = _get_membership_organization(membership)
            if not is_trusted_platform_organization(org):
                continue
            return True
    return False


def is_technical_system_admin(user: User) -> bool:
    """
    Checks whether the user has an active technical System Administrator role
    (scope_level == ScopeLevel.system or name == 'System Administrator').
    Strictly excludes Government Verification SuperAdminProfile.
    Tenant organization members must not inherit platform-level technical admin rights.
    """
    for membership in user.memberships:
        if (
            membership.status == AssignmentStatus.active
            and membership.role
            and (membership.role.scope_level == ScopeLevel.system or membership.role.name == "System Administrator")
            and membership.role.is_system_role
        ):
            org = _get_membership_organization(membership)
            if not is_trusted_platform_organization(org):
                continue
            return True
    return False


def has_user_manage_permission(user: User) -> bool:
    """
    Checks whether the user has explicit user:manage permission or is an active technical System Administrator.
    Strictly excludes Government Verification SuperAdminProfile wildcard bypass.
    """
    if is_technical_system_admin(user):
        return True

    for membership in user.memberships:
        if membership.status == AssignmentStatus.active and membership.role:
            for rp in membership.role.permissions:
                if rp.permission and rp.permission.codename in ("user:manage", "*"):
                    return True

    if hasattr(user, "study_team_assignments") and user.study_team_assignments:
        for assignment in user.study_team_assignments:
            if assignment.assignment_status == AssignmentStatus.active and assignment.role:
                for rp in assignment.role.permissions:
                    if rp.permission and rp.permission.codename in ("user:manage", "*"):
                        return True
    return False


def has_global_audit_permission(user: User) -> bool:
    """
    Checks whether the user has explicit global audit access (technical System Administrator
    or explicit system-scoped role with audit:read).
    Strictly excludes:
    - Government Verification SuperAdminProfile wildcard bypass.
    - Organization-scoped roles granting audit:read or wildcard * (must not leak cross-tenant).
    - Study-scoped roles granting audit:read or wildcard * (must not leak global logs).
    - Non-system roles with wildcard *.
    - Tenant OrganizationMember records (must not inherit platform-level global audit access).
    """
    if is_technical_system_admin(user):
        return True

    for membership in user.memberships:
        if (
            membership.status == AssignmentStatus.active
            and membership.role
            and membership.role.scope_level == ScopeLevel.system
            and membership.role.is_system_role
        ):
            # Tenant OrganizationMember records must not be treated as a platform-level grant.
            # Platform-level roles must belong to an explicitly authorized central platform authority.
            org = _get_membership_organization(membership)
            if not is_trusted_platform_organization(org):
                continue

            for rp in membership.role.permissions:
                if rp.permission and rp.permission.codename == "audit:read":
                    return True

    return False


def get_user_permissions(user: User) -> set[str]:
    """Aggregates all unique permission codenames assigned to the user across active roles."""
    permissions: set[str] = set()

    if hasattr(user, "super_admin_profile") and user.super_admin_profile and user.super_admin_profile.is_active:
        permissions.add("*")

    for membership in user.memberships:
        if membership.status == AssignmentStatus.active and membership.role:
            is_sys = (
                membership.role.scope_level == ScopeLevel.system
                or membership.role.is_system_role
                or membership.role.name == "System Administrator"
            )
            if is_sys:
                org = _get_membership_organization(membership)
                if not is_trusted_platform_organization(org):
                    # Tenant members with improperly attached system roles cannot claim system permissions
                    continue
                if membership.role.scope_level == ScopeLevel.system or membership.role.name == "System Administrator":
                    permissions.add("*")

            for rp in membership.role.permissions:
                if rp.permission and rp.permission.codename:
                    permissions.add(rp.permission.codename)

    if hasattr(user, "study_team_assignments") and user.study_team_assignments:
        for assignment in user.study_team_assignments:
            if assignment.assignment_status == AssignmentStatus.active and assignment.role:
                for rp in assignment.role.permissions:
                    if rp.permission and rp.permission.codename:
                        permissions.add(rp.permission.codename)
    return permissions


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Validates JWT Bearer token and returns the authenticated User with loaded RBAC relationships.
    Raises HTTP 401 if missing, invalid, expired, or user is inactive.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    stmt = (
        select(User)
        .options(
            selectinload(User.memberships).selectinload(OrganizationMember.organization),
            selectinload(User.memberships)
            .selectinload(OrganizationMember.role)
            .selectinload(Role.permissions)
            .selectinload(RolePermission.permission),
            selectinload(User.study_team_assignments)
            .selectinload(StudyTeamMember.role)
            .selectinload(Role.permissions)
            .selectinload(RolePermission.permission),
            selectinload(User.super_admin_profile),
        )
        .where(User.id == user_id)
    )
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != UserStatus.active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or suspended",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_permission(codename: str) -> Callable[..., Any]:
    """Dependency factory checking that the authenticated user holds a specific permission codename."""

    async def _permission_dependency(current_user: User = Depends(get_current_user)) -> User:
        if is_system_admin(current_user):
            return current_user

        perms = get_user_permissions(current_user)
        if "*" in perms or codename in perms:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: missing required permission '{codename}'",
        )

    return _permission_dependency


async def require_user_management(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency requiring explicit user:manage permission or technical System Administrator role.
    Government Verification Super Admin without technical admin role receives HTTP 403 Forbidden.
    """
    if has_user_manage_permission(current_user):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Permission denied: missing required permission 'user:manage'",
    )


async def require_global_audit_access(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency requiring explicit audit:read permission or technical System Administrator role.
    Government Verification Super Admin without technical admin role receives HTTP 403 Forbidden.
    """
    if has_global_audit_permission(current_user):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Permission denied: missing required permission 'audit:read'",
    )


def require_organization_access(permission: str | None = None) -> Callable[..., Any]:
    """
    Dependency factory verifying the user is an active member of the given organization_id,
    with an optional permission check.
    """

    async def _org_access_dependency(
        organization_id: uuid.UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> OrganizationMember | None:
        if is_system_admin(current_user):
            stmt = select(OrganizationMember).where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == current_user.id,
            )
            res = await db.execute(stmt)
            return res.scalars().first()

        stmt = select(OrganizationMember).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.status == AssignmentStatus.active,
        )
        res = await db.execute(stmt)
        member = res.scalars().first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not an active member of this organization",
            )

        if permission:
            perms = get_user_permissions(current_user)
            if "*" not in perms and permission not in perms:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: missing required permission '{permission}'",
                )

        return member

    return _org_access_dependency


def require_study_access(permission: str | None = None) -> Callable[..., Any]:
    """
    Dependency factory verifying that the authenticated user has access to study_id
    either via sponsor/CRO organization membership or explicit study team assignment.
    """

    async def _study_access_dependency(
        study_id: uuid.UUID,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> Study:
        stmt = select(Study).where(Study.id == study_id)
        res = await db.execute(stmt)
        study = res.scalars().first()
        if not study:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study not found",
            )

        if is_system_admin(current_user):
            return study

        # Check organization membership (sponsor or CRO)
        user_org_ids = {
            m.organization_id
            for m in current_user.memberships
            if m.status == AssignmentStatus.active
        }
        if study.sponsor_org_id in user_org_ids or (
            study.cro_org_id and study.cro_org_id in user_org_ids
        ):
            return study

        # Check study team member assignment
        stmt_team = select(StudyTeamMember).where(
            StudyTeamMember.study_id == study_id,
            StudyTeamMember.user_id == current_user.id,
            StudyTeamMember.assignment_status == AssignmentStatus.active,
        )
        team_res = await db.execute(stmt_team)
        if team_res.scalars().first():
            return study

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: user is not assigned to or authorized for this study",
        )

    return _study_access_dependency
