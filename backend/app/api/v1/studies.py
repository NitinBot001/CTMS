from __future__ import annotations

import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_study_access
from app.core.database import get_db
from app.models.enums import AssignmentStatus, StudyPhase, StudySiteActivationStatus, StudyStatus
from app.models.progress import StudyMilestone
from app.models.site import StudySite
from app.models.study import Study, StudyTeamMember
from app.models.user import User
from app.schemas.common import StatusTransitionRequest
from app.schemas.site import EligibleSiteItem, StudySiteCreate, StudySiteRead
from app.schemas.study import (
    StudyCreate,
    StudyMilestoneRead,
    StudyRead,
    StudyTeamMemberCreate,
    StudyTeamMemberRead,
    StudyUpdate,
)
from app.services.audit import AuditService
from app.services.study import StudyService

router = APIRouter(prefix="/studies", tags=["Studies"])

ALLOWED_SITE_TRANSITIONS: dict[StudySiteActivationStatus, set[StudySiteActivationStatus]] = {
    StudySiteActivationStatus.planned: {StudySiteActivationStatus.initiated},
    StudySiteActivationStatus.initiated: {StudySiteActivationStatus.activated},
    StudySiteActivationStatus.activated: {
        StudySiteActivationStatus.suspended,
        StudySiteActivationStatus.closed,
    },
    StudySiteActivationStatus.suspended: {
        StudySiteActivationStatus.activated,
        StudySiteActivationStatus.closed,
    },
}


@router.post("", response_model=StudyRead, status_code=status.HTTP_201_CREATED)
async def create_study(
    study_in: StudyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = StudyService(db)
    return await service.create_study(study_in, user_id=current_user.id)


@router.get("", response_model=list[StudyRead])
async def list_studies(
    status: StudyStatus | None = None,
    phase: StudyPhase | None = None,
    sponsor_org_id: uuid.UUID | None = None,
    cro_org_id: uuid.UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.core.rbac import get_user_accessible_study_ids

    accessible_ids = await get_user_accessible_study_ids(current_user, db)

    stmt = select(Study)
    if accessible_ids is not None:
        stmt = stmt.where(Study.id.in_(accessible_ids))
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
    study: Study = Depends(require_study_access()),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return study


@router.patch("/{study_id}", response_model=StudyRead)
async def update_study(
    study_id: uuid.UUID,
    study_in: StudyUpdate,
    study: Study = Depends(require_study_access()),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = study_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(study, field, value)

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
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
    study: Study = Depends(require_study_access()),
    current_user: User = Depends(get_current_user),
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
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -------------------------------------------------------------
# Study Team Members (Role-based, user-linked, optional site scope)
# -------------------------------------------------------------


@router.get("/{study_id}/team", response_model=list[StudyTeamMemberRead])
async def list_study_team_members(
    study_id: uuid.UUID,
    study: Study = Depends(require_study_access()),
    current_user: User = Depends(get_current_user),
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
    study: Study = Depends(require_study_access()),
    current_user: User = Depends(get_current_user),
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
        user_id=current_user.id,
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
    study: Study = Depends(require_study_access()),
    current_user: User = Depends(get_current_user),
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
    study: Study = Depends(require_study_access()),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.core.rbac import resolve_user_role

    user_role = await resolve_user_role(current_user, db)
    if user_role == "cro":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CRO personnel cannot directly assign sites. Please submit a site participation request via POST /platform/site-participation/request for government and site PI review.",
        )

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
        user_id=current_user.id,
        action="study.site_assign",
        resource_type="study_site",
        resource_id=study_site.id,
        changes={"study_id": str(study_id), "site_id": str(site_in.site_id)},
    )
    await db.commit()
    await db.refresh(study_site)
    return study_site


@router.get("/{study_id}/eligible-sites", response_model=list[EligibleSiteItem])
async def list_eligible_sites(
    study_id: uuid.UUID,
    q: str | None = None,
    study: Study = Depends(require_study_access()),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns registered clinical trial sites for site discovery.
    Includes active assignment status and pending participation request status for this study.
    """
    from app.models.platform import SiteParticipationRequest
    from app.models.site import Site

    study_sites_stmt = select(StudySite).where(StudySite.study_id == study_id)
    study_sites_map = {ss.site_id: ss for ss in (await db.execute(study_sites_stmt)).scalars().all()}

    part_stmt = select(SiteParticipationRequest).where(SiteParticipationRequest.study_id == study_id)
    part_requests = (await db.execute(part_stmt)).scalars().all()
    part_map: dict[uuid.UUID, SiteParticipationRequest] = {}
    for pr in part_requests:
        if pr.site_id not in part_map or pr.created_at > part_map[pr.site_id].created_at:
            part_map[pr.site_id] = pr

    stmt = select(Site)
    if q:
        search_pattern = f"%{q}%"
        stmt = stmt.where(
            (Site.name.ilike(search_pattern))
            | (Site.site_code.ilike(search_pattern))
            | (Site.city.ilike(search_pattern))
        )
    sites = (await db.execute(stmt)).scalars().all()

    items: list[EligibleSiteItem] = []
    for s in sites:
        ss = study_sites_map.get(s.id)
        part_req = part_map.get(s.id)
        items.append(
            EligibleSiteItem(
                id=s.id,
                site_code=s.site_code,
                name=s.name,
                site_type=s.site_type,
                city=s.city,
                state=s.state,
                country=s.country,
                status=s.status,
                is_assigned=ss is not None,
                activation_status=ss.activation_status.value if ss else None,
                participation_request_id=part_req.id if part_req else None,
                participation_status=part_req.status.value if part_req else None,
                government_status=part_req.government_status.value if part_req else None,
                site_status=part_req.site_status.value if part_req else None,
            )
        )
    return items


@router.post(
    "/{study_id}/sites/{site_id}/transition",
    response_model=StudySiteRead,
)
async def transition_study_site_status(
    study_id: uuid.UUID,
    site_id: uuid.UUID,
    transition_in: StatusTransitionRequest,
    study: Study = Depends(require_study_access()),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(StudySite).where(
        StudySite.study_id == study_id,
        StudySite.site_id == site_id,
    )
    res = await db.execute(stmt)
    study_site = res.scalars().first()
    if not study_site:
        raise HTTPException(status_code=404, detail="Study site assignment not found")

    try:
        new_status = StudySiteActivationStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid site activation status: {transition_in.new_status}",
        )

    current_status = study_site.activation_status
    allowed = ALLOWED_SITE_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {current_status.value} to {new_status.value}",
        )

    study_site.activation_status = new_status
    if new_status == StudySiteActivationStatus.activated and not study_site.activation_date:
        study_site.activation_date = datetime.date.today()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="study_site.transition",
        resource_type="study_site",
        resource_id=study_site.id,
        changes={
            "old_status": current_status.value,
            "new_status": new_status.value,
            "reason": transition_in.reason,
        },
    )
    await db.commit()
    await db.refresh(study_site)
    return study_site


# -------------------------------------------------------------
# Study Milestones
# -------------------------------------------------------------


@router.get("/{study_id}/milestones", response_model=list[StudyMilestoneRead])
async def list_study_milestones(
    study_id: uuid.UUID,
    study: Study = Depends(require_study_access()),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(StudyMilestone).where(StudyMilestone.study_id == study_id)
    result = await db.execute(stmt)
    return result.scalars().all()
