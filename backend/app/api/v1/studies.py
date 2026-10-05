from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.enums import AssignmentStatus, StudyPhase, StudySiteActivationStatus, StudyStatus
from app.models.progress import StudyMilestone
from app.models.site import StudySite
from app.models.study import Study, StudyTeamMember
from app.schemas.common import StatusTransitionRequest
from app.schemas.site import StudySiteCreate, StudySiteRead
from app.schemas.study import (
    StudyCreate,
    StudyRead,
    StudyTeamMemberCreate,
    StudyTeamMemberRead,
    StudyUpdate,
)
from app.services.audit import AuditService
from app.services.study import StudyService

router = APIRouter(prefix="/studies", tags=["Studies"])
SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@router.post("", response_model=StudyRead, status_code=status.HTTP_201_CREATED)
async def create_study(
    study_in: StudyCreate,
    db: AsyncSession = Depends(get_db),
):
    service = StudyService(db)
    return await service.create_study(study_in, user_id=SYSTEM_USER_ID)


@router.get("", response_model=list[StudyRead])
async def list_studies(
    status: StudyStatus | None = None,
    phase: StudyPhase | None = None,
    sponsor_org_id: uuid.UUID | None = None,
    cro_org_id: uuid.UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Study)
    if status:
        stmt = stmt.where(Study.status == status)
    if phase:
        stmt = stmt.where(Study.phase == phase)
    if sponsor_org_id:
        stmt = stmt.where(Study.sponsor_org_id == sponsor_org_id)
    if cro_org_id:
        stmt = stmt.where(Study.cro_org_id == cro_org_id)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{study_id}", response_model=StudyRead)
async def get_study(
    study_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = StudyService(db)
    study = await service.get_study(study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    return study


@router.patch("/{study_id}", response_model=StudyRead)
async def update_study(
    study_id: uuid.UUID,
    study_in: StudyUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = StudyService(db)
    study = await service.get_study(study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    update_data = study_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(study, field, value)

    await AuditService.create_audit_log(
        db=db,
        user_id=SYSTEM_USER_ID,
        action="study.update",
        resource_type="study",
        resource_id=study.id,
        changes=update_data,
    )
    await db.commit()
    await db.refresh(study)
    return study


@router.post("/{study_id}/transition", response_model=StudyRead)
async def transition_study_status(
    study_id: uuid.UUID,
    transition_in: StatusTransitionRequest,
    db: AsyncSession = Depends(get_db),
):
    service = StudyService(db)
    try:
        new_status = StudyStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(
            status_code=400, detail=f"Invalid study status: {transition_in.new_status}"
        )

    try:
        return await service.transition_status(
            study_id=study_id,
            new_status=new_status,
            user_id=SYSTEM_USER_ID,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------------------------------------
# Study Team Members (Role-based, user-linked, optional site scope)
# -------------------------------------------------------------


@router.get("/{study_id}/team", response_model=list[StudyTeamMemberRead])
async def list_study_team_members(
    study_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(StudyTeamMember).where(StudyTeamMember.study_id == study_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/{study_id}/team",
    response_model=StudyTeamMemberRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_study_team_member(
    study_id: uuid.UUID,
    member_in: StudyTeamMemberCreate,
    db: AsyncSession = Depends(get_db),
):
    member = StudyTeamMember(
        study_id=study_id,
        user_id=member_in.user_id,
        role_id=member_in.role_id,
        site_id=member_in.site_id,
        assignment_status=AssignmentStatus.active,
        start_date=member_in.start_date,
        end_date=member_in.end_date,
    )
    db.add(member)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=SYSTEM_USER_ID,
        action="study.team_assign",
        resource_type="study_team_member",
        resource_id=member.id,
        changes={
            "study_id": str(study_id),
            "user_id": str(member_in.user_id),
            "role_id": str(member_in.role_id),
        },
    )
    await db.commit()
    await db.refresh(member)
    return member


# -------------------------------------------------------------
# Study Sites (Junction table linking reusable Sites to Studies)
# -------------------------------------------------------------


@router.get("/{study_id}/sites", response_model=list[StudySiteRead])
async def list_study_sites(
    study_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(StudySite).where(StudySite.study_id == study_id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/{study_id}/sites",
    response_model=StudySiteRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_study_site(
    study_id: uuid.UUID,
    site_in: StudySiteCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(StudySite).where(
            StudySite.study_id == study_id,
            StudySite.site_id == site_in.site_id,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Site already assigned to this study")

    study_site = StudySite(
        study_id=study_id,
        site_id=site_in.site_id,
        activation_status=StudySiteActivationStatus.planned,
        recruitment_target=site_in.recruitment_target,
        monitoring_status=site_in.monitoring_status,
    )
    db.add(study_site)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=SYSTEM_USER_ID,
        action="study.site_assign",
        resource_type="study_site",
        resource_id=study_site.id,
        changes={"study_id": str(study_id), "site_id": str(site_in.site_id)},
    )
    await db.commit()
    await db.refresh(study_site)
    return study_site


# -------------------------------------------------------------
# Study Milestones
# -------------------------------------------------------------


@router.get("/{study_id}/milestones")
async def list_study_milestones(
    study_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(StudyMilestone).where(StudyMilestone.study_id == study_id)
    result = await db.execute(stmt)
    return result.scalars().all()
