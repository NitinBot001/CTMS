from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, security_bearer
from app.core.database import get_db
from app.core.security import decode_access_token, hash_password
from app.models.enums import UserStatus
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

    # Determine actor (authenticated user or self-registration/bootstrap)
    actor_id: uuid.UUID | None = None
    if credentials and credentials.credentials:
        try:
            payload = decode_access_token(credentials.credentials)
            sub = payload.get("sub")
            if sub:
                actor_id = uuid.UUID(sub)
        except Exception:
            actor_id = None

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
    current_user: User = Depends(get_current_user),
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
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# -------------------------------------------------------------
# Roles & Permissions
# -------------------------------------------------------------


@router.post("/roles", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_in: RoleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Role).where(Role.name == role_in.name))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Role name already exists")

    role = Role(
        **role_in.model_dump(),
        is_system_role=False,
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Permission)
    result = await db.execute(stmt)
    return result.scalars().all()
