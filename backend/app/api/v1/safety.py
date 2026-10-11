from __future__ import annotations

import uuid
from typing import Any

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import (
    _get_membership_organization,
    get_current_user,
    has_safety_permission,
    is_technical_system_admin,
    is_trusted_platform_organization,
    is_user_authorized_for_adverse_event,
)
from app.core.database import get_db
from app.models.enums import AEStatus, AssignmentStatus, Seriousness, Severity
from app.models.participant import Participant
from app.models.safety import AdverseEvent
from app.models.site import Site, StudySite
from app.models.study import Study
from app.models.user import User
from app.schemas.common import StatusTransitionRequest
from app.schemas.safety import AdverseEventCreate, AdverseEventRead
from app.services.audit import AuditService

router = APIRouter(prefix="/safety", tags=["Safety / Pharmacovigilance"])


async def _get_authorized_safety_filters(
    user: User,
    db: AsyncSession,
) -> tuple[set[uuid.UUID], set[uuid.UUID], set[tuple[uuid.UUID, uuid.UUID]], list[Any]]:
    """
    Computes authorized study IDs, site IDs, site-team pairs, and SQL filter conditions
    for querying AdverseEvent records based on the user's scope.
    Returns:
    (all_accessible_study_ids, all_accessible_site_ids, site_team_pairs, conditions)
    """
    authorized_org_ids: set[uuid.UUID] = set()
    for m in user.memberships:
        if m.status == AssignmentStatus.active and m.role:
            for rp in m.role.permissions:
                if rp.permission and rp.permission.codename in ("safety:read", "*"):
                    if rp.permission.codename == "*":
                        org = _get_membership_organization(m)
                        if not is_trusted_platform_organization(org):
                            continue
                    authorized_org_ids.add(m.organization_id)
                    break

    sponsor_cro_study_ids: set[uuid.UUID] = set()
    if authorized_org_ids:
        stmt_studies = select(Study.id).where(
            (Study.sponsor_org_id.in_(authorized_org_ids)) | (Study.cro_org_id.in_(authorized_org_ids))
        )
        sponsor_cro_study_ids = set((await db.execute(stmt_studies)).scalars().all())

    study_level_study_ids: set[uuid.UUID] = set()
    site_team_pairs: set[tuple[uuid.UUID, uuid.UUID]] = set()
    site_team_site_ids: set[uuid.UUID] = set()

    if hasattr(user, "study_team_assignments") and user.study_team_assignments:
        for a in user.study_team_assignments:
            if a.assignment_status == AssignmentStatus.active and a.role:
                has_perm = any(
                    rp.permission and rp.permission.codename in ("safety:read", "*")
                    for rp in a.role.permissions
                )
                if has_perm:
                    if a.site_id is None:
                        study_level_study_ids.add(a.study_id)
                    else:
                        site_team_pairs.add((a.study_id, a.site_id))
                        site_team_site_ids.add(a.site_id)

    full_study_ids = sponsor_cro_study_ids | study_level_study_ids
    all_studies = full_study_ids | {pair[0] for pair in site_team_pairs}
    all_sites = site_team_site_ids.copy()

    conditions: list[Any] = []
    if full_study_ids:
        conditions.append(AdverseEvent.study_id.in_(full_study_ids))

    for s_id, st_id in site_team_pairs:
        conditions.append(
            sa.and_(
                AdverseEvent.study_id == s_id,
                AdverseEvent.site_id == st_id,
            )
        )

    return all_studies, all_sites, site_team_pairs, conditions


@router.post(
    "/adverse-events", response_model=AdverseEventRead, status_code=http_status.HTTP_201_CREATED
)
async def report_adverse_event(
    event_in: AdverseEventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_safety_permission(current_user, "safety:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'safety:write'",
        )

    study = await db.get(Study, event_in.study_id)
    if not study:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Study not found")

    participant = await db.get(Participant, event_in.participant_id)
    if not participant:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Participant not found")

    if participant.study_id != event_in.study_id:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Participant does not belong to the specified study",
        )

    assigned_site_id = event_in.site_id
    if assigned_site_id:
        site = await db.get(Site, assigned_site_id)
        if not site:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Site not found")
        ss_stmt = select(StudySite).where(
            StudySite.study_id == event_in.study_id,
            StudySite.site_id == assigned_site_id,
        )
        if not (await db.execute(ss_stmt)).scalars().first():
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Site is not associated with this study",
            )
        if participant.site_id and participant.site_id != assigned_site_id:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Participant is not registered at the specified site",
            )
    elif participant.site_id:
        assigned_site_id = participant.site_id

    if not is_technical_system_admin(current_user):
        user_org_ids = {
            m.organization_id
            for m in current_user.memberships
            if m.status == AssignmentStatus.active
            and m.role
            and any(rp.permission and rp.permission.codename in ("safety:write", "*") for rp in m.role.permissions)
        }
        is_sponsor_cro = bool(
            study.sponsor_org_id in user_org_ids
            or (study.cro_org_id and study.cro_org_id in user_org_ids)
        )

        team_assignment = None
        if hasattr(current_user, "study_team_assignments") and current_user.study_team_assignments:
            for a in current_user.study_team_assignments:
                if (
                    a.study_id == event_in.study_id
                    and a.assignment_status == AssignmentStatus.active
                    and a.role
                    and any(rp.permission and rp.permission.codename in ("safety:write", "*") for rp in a.role.permissions)
                ):
                    team_assignment = a
                    break

        if not is_sponsor_cro and not team_assignment:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not assigned to or authorized for this study",
            )

        if team_assignment and team_assignment.site_id is not None:
            user_site_id = team_assignment.site_id
            if event_in.site_id and event_in.site_id != user_site_id:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: site staff cannot report adverse events for other sites",
                )
            if participant.site_id and participant.site_id != user_site_id:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: site staff cannot report adverse events for other sites' participants",
                )
            assigned_site_id = user_site_id

    event_data = event_in.model_dump()
    event_data["site_id"] = assigned_site_id

    ae = AdverseEvent(
        **event_data,
        status=AEStatus.open,
        reported_by=current_user.id,
    )
    db.add(ae)
    await db.flush()

    changes = event_data.copy()
    changes["study_id"] = str(event_in.study_id)
    if assigned_site_id:
        changes["site_id"] = str(assigned_site_id)
    changes["participant_id"] = str(event_in.participant_id)

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="safety.ae_report",
        resource_type="adverse_event",
        resource_id=ae.id,
        changes=changes,
    )
    await db.commit()
    await db.refresh(ae)
    return ae


@router.get("/adverse-events", response_model=list[AdverseEventRead])
async def list_adverse_events(
    study_id: uuid.UUID | None = None,
    participant_id: uuid.UUID | None = None,
    seriousness: Seriousness | None = None,
    severity: Severity | None = None,
    status: AEStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_safety_permission(current_user, "safety:read"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'safety:read'",
        )

    stmt = select(AdverseEvent)

    if not is_technical_system_admin(current_user):
        all_studies, all_sites, site_team_pairs, conditions = await _get_authorized_safety_filters(current_user, db)

        if not conditions:
            return []

        if study_id and study_id not in all_studies:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not assigned to or authorized for this study",
            )

        stmt = stmt.where(sa.or_(*conditions))

    if study_id:
        stmt = stmt.where(AdverseEvent.study_id == study_id)
    if participant_id:
        stmt = stmt.where(AdverseEvent.participant_id == participant_id)
    if seriousness:
        stmt = stmt.where(AdverseEvent.seriousness == seriousness)
    if severity:
        stmt = stmt.where(AdverseEvent.severity == severity)
    if status:
        stmt = stmt.where(AdverseEvent.status == status)

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/adverse-events/{event_id}", response_model=AdverseEventRead)
async def get_adverse_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_safety_permission(current_user, "safety:read"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'safety:read'",
        )

    ae = await db.get(AdverseEvent, event_id)
    if not ae:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Adverse event not found")

    if not await is_user_authorized_for_adverse_event(current_user, ae, db, permission="safety:read"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Access denied: user is not authorized to view this adverse event",
        )

    return ae


@router.post("/adverse-events/{event_id}/transition", response_model=AdverseEventRead)
async def transition_adverse_event(
    event_id: uuid.UUID,
    transition_in: StatusTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_safety_permission(current_user, "safety:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'safety:write'",
        )

    ae = await db.get(AdverseEvent, event_id)
    if not ae:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Adverse event not found")

    if not await is_user_authorized_for_adverse_event(current_user, ae, db, permission="safety:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Access denied: user is not authorized to transition this adverse event",
        )

    try:
        new_status = AEStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid AE status: {transition_in.new_status}",
        )

    allowed_transitions = {
        AEStatus.open: [AEStatus.under_review, AEStatus.closed],
        AEStatus.under_review: [AEStatus.closed, AEStatus.open],
    }

    if new_status not in allowed_transitions.get(ae.status, []):
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from {ae.status.value} to {new_status.value}",
        )

    old_status = ae.status
    ae.status = new_status

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="safety.ae_transition",
        resource_type="adverse_event",
        resource_id=ae.id,
        changes={
            "study_id": str(ae.study_id),
            "old_status": old_status.value,
            "new_status": new_status.value,
            "notes": transition_in.reason,
        },
    )
    await db.commit()
    await db.refresh(ae)
    return ae
