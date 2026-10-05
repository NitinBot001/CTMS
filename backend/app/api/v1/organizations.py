from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.enums import OnboardingStatus, OrganizationStatus, OrganizationType
from app.models.organization import OnboardingApplication, Organization, OrganizationMember
from app.models.user import User
from app.schemas.common import StatusTransitionRequest
from app.schemas.organization import (
    OnboardingApplicationRead,
    OrganizationCreate,
    OrganizationRead,
    OrganizationUpdate,
)
from app.schemas.user import OrganizationMemberCreate, OrganizationMemberRead
from app.services.audit import AuditService
from app.services.organization import OrganizationService

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.post("", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_in: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrganizationService(db)
    return await service.create_organization(org_in, user_id=current_user.id)


@router.get("", response_model=list[OrganizationRead])
async def list_organizations(
    org_type: OrganizationType | None = None,
    org_status: OrganizationStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Organization)
    if org_type:
        stmt = stmt.where(Organization.organization_type == org_type)
    if org_status:
        stmt = stmt.where(Organization.status == org_status)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{org_id}", response_model=OrganizationRead)
async def get_organization(
    org_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrganizationService(db)
    org = await service.get_organization(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.patch("/{org_id}", response_model=OrganizationRead)
async def update_organization(
    org_id: uuid.UUID,
    org_in: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrganizationService(db)
    org = await service.get_organization(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    update_data = org_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="organization.update",
        resource_type="organization",
        resource_id=org.id,
        changes=update_data,
    )
    await db.commit()
    await db.refresh(org)
    return org


# -------------------------------------------------------------
# Onboarding Workflows
# -------------------------------------------------------------


@router.post(
    "/{org_id}/onboarding",
    response_model=OnboardingApplicationRead,
    status_code=status.HTTP_201_CREATED,
)
async def submit_onboarding_application(
    org_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrganizationService(db)
    org = await service.get_organization(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    app = OnboardingApplication(
        organization_id=org_id,
        status=OnboardingStatus.draft,
    )
    db.add(app)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="onboarding.create",
        resource_type="onboarding_application",
        resource_id=app.id,
        changes={"organization_id": str(org_id), "status": OnboardingStatus.draft.value},
    )
    await db.commit()
    await db.refresh(app)
    return app


@router.post(
    "/onboarding/{app_id}/transition",
    response_model=OnboardingApplicationRead,
)
async def transition_onboarding_status(
    app_id: uuid.UUID,
    transition_in: StatusTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrganizationService(db)
    try:
        new_status = OnboardingStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(
            status_code=400, detail=f"Invalid onboarding status: {transition_in.new_status}"
        )

    try:
        return await service.transition_onboarding(
            application_id=app_id,
            new_status=new_status,
            user_id=current_user.id,
            notes=transition_in.reason,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------------------------------------
# Organization Members
# -------------------------------------------------------------


@router.get("/{org_id}/members", response_model=list[OrganizationMemberRead])
async def list_organization_members(
    org_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(OrganizationMember).where(OrganizationMember.organization_id == org_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/{org_id}/members",
    response_model=OrganizationMemberRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_organization_member(
    org_id: uuid.UUID,
    member_in: OrganizationMemberCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = OrganizationMember(
        organization_id=org_id,
        user_id=member_in.user_id,
        role_id=member_in.role_id,
    )
    db.add(member)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="organization.member_add",
        resource_type="organization_member",
        resource_id=member.id,
        changes={"organization_id": str(org_id), "user_id": str(member_in.user_id)},
    )
    await db.commit()
    await db.refresh(member)
    return member
