from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user, get_user_permissions, is_system_admin
from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.models.enums import UserStatus
from app.models.organization import OrganizationMember
from app.models.study import StudyTeamMember
from app.models.user import Role, RolePermission, User
from app.schemas.user import (
    LoginRequest,
    TokenResponse,
    UserMembershipDetail,
    UserProfileRead,
    UserRead,
    UserStudyAssignment,
)

router = APIRouter(prefix="/auth", tags=["Authentication & Access"])


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticates user with email and password, returning a signed JWT access token."""
    stmt = (
        select(User)
        .options(
            selectinload(User.memberships)
            .selectinload(OrganizationMember.role)
            .selectinload(Role.permissions)
            .selectinload(RolePermission.permission)
        )
        .where(User.email == login_data.email)
    )
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != UserStatus.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or suspended",
        )

    token = create_access_token({"sub": str(user.id), "email": user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.get("/me", response_model=UserProfileRead)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfileRead:
    """Returns the authenticated user's profile, assigned permissions, and active memberships."""
    # Eager load organizations for membership detail
    stmt = (
        select(OrganizationMember)
        .options(
            selectinload(OrganizationMember.organization),
            selectinload(OrganizationMember.role),
        )
        .where(OrganizationMember.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    memberships = res.scalars().all()

    membership_details = [
        UserMembershipDetail(
            organization_id=m.organization_id,
            organization_name=m.organization.name if m.organization else None,
            organization_type=m.organization.organization_type.value
            if (m.organization and m.organization.organization_type)
            else None,
            role_name=m.role.name if m.role else None,
            scope_level=m.role.scope_level.value if m.role else None,
            status=m.status.value,
        )
        for m in memberships
    ]

    stmt_study = (
        select(StudyTeamMember)
        .options(
            selectinload(StudyTeamMember.study),
            selectinload(StudyTeamMember.role),
        )
        .where(StudyTeamMember.user_id == current_user.id)
    )
    study_assignments_raw = (await db.execute(stmt_study)).scalars().all()
    study_assignments = [
        UserStudyAssignment(
            study_id=sa.study_id,
            study_title=sa.study.title if sa.study else None,
            role_name=sa.role.name if sa.role else None,
            site_id=sa.site_id,
            assignment_status=sa.assignment_status.value,
        )
        for sa in study_assignments_raw
    ]

    perms = sorted(get_user_permissions(current_user))
    sys_admin = is_system_admin(current_user)

    from app.core.rbac import resolve_user_role
    from app.services.platform import PlatformService
    super_admin = await PlatformService.is_super_admin(current_user, db)
    assigned_role = await resolve_user_role(current_user, db)

    return UserProfileRead(
        user=UserRead.model_validate(current_user),
        permissions=perms,
        is_system_admin=sys_admin,
        is_super_admin=super_admin,
        assigned_role=assigned_role,
        memberships=membership_details,
        study_assignments=study_assignments,
    )
