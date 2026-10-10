from __future__ import annotations

import contextlib
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Security, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import (
    get_current_user,
    has_user_manage_permission,
    is_technical_system_admin,
    require_user_management,
    security_bearer,
)
from app.core.database import get_db
from app.core.security import hash_password
from app.models.enums import ScopeLevel, UserStatus
from app.models.user import Permission, Role, User
from app.schemas.user import PermissionRead, RoleCreate, RoleRead, UserCreate, UserRead
from app.services.audit import AuditService

router = APIRouter(tags=["Users & Access Control"])


# -------------------------------------------------------------
# Users
# -------------------------------------------------------------


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    credentials: HTTPAuthorizationCredentials | None = Security(security_bearer),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.email == user_in.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Check total users in system to enforce bootstrap vs normal access control
    user_count_res = await db.execute(select(func.count(User.id)))
    total_users = user_count_res.scalar() or 0

    actor_id: uuid.UUID | None = None
    if total_users == 0:
        # Initial system bootstrap: allow unauthenticated creation of first administrator account
        actor_id = None
    else:
        # Normal operation: anonymous creation is strictly rejected
        if not credentials or not credentials.credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to create users. Bootstrap is closed.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        current_user = await get_current_user(credentials=credentials, db=db)
        actor_id = current_user.id

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        phone=user_in.phone,
        status=UserStatus.active,
        hashed_password=hash_password(user_in.password),
    )
    db.add(user)
    await db.flush()

    audit_actor = actor_id or user.id
    await AuditService.create_audit_log(
        db=db,
        user_id=audit_actor,
        action="user.create",
        resource_type="user",
        resource_id=user.id,
        changes={"email": user.email, "full_name": user.full_name},
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/users", response_model=list[UserRead])
async def list_users(
    status: UserStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_user_management),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User)
    if status:
        stmt = stmt.where(User.status == status)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/users/{user_id}", response_model=UserRead)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Allow self-lookup; require explicit user:manage permission or technical System Administrator for third-party lookup
    if current_user.id != user_id and not has_user_manage_permission(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'user:manage'",
        )

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# -------------------------------------------------------------
# Roles & Permissions
# -------------------------------------------------------------


@router.post("/roles", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
async def create_role(
    request: Request,
    role_in: RoleCreate,
    current_user: User = Depends(require_user_management),
    db: AsyncSession = Depends(get_db),
):
    raw_body: dict = {}
    with contextlib.suppress(Exception):
        raw_body = await request.json()

    is_tech_admin = is_technical_system_admin(current_user)
    is_system_scope = (role_in.scope_level == ScopeLevel.system)
    is_system_flag = (raw_body.get("is_system_role") is True) or getattr(role_in, "is_system_role", False) is True
    name_norm = role_in.name.strip().lower()
    reserved_role_names = {
        "system administrator",
        "system admin",
        "super admin",
        "superadmin",
        "platform super admin",
        "government verification super admin",
        "government super admin",
    }
    is_reserved_name = name_norm in reserved_role_names

    # Prevent privilege escalation and payload bypasses: only technical System Administrators can create system-level roles
    if (is_system_scope or is_system_flag or is_reserved_name) and not is_tech_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: only technical System Administrators can create system-level roles",
        )

    existing = await db.execute(select(Role).where(Role.name == role_in.name))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Role name already exists")

    is_sys = bool(is_tech_admin and (is_system_scope or is_system_flag))
    role = Role(
        **role_in.model_dump(),
        is_system_role=is_sys,
    )
    db.add(role)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="role.create",
        resource_type="role",
        resource_id=role.id,
        changes=role_in.model_dump(mode="json"),
    )
    await db.commit()
    await db.refresh(role)
    return role


@router.get("/roles", response_model=list[RoleRead])
async def list_roles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Role)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/permissions", response_model=list[PermissionRead])
async def list_permissions(
    current_user: User = Depends(require_user_management),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Permission)
    result = await db.execute(stmt)
    return result.scalars().all()
