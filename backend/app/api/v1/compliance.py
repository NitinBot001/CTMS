from __future__ import annotations

import datetime
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
    has_compliance_permission,
    is_technical_system_admin,
    is_trusted_platform_organization,
    is_user_authorized_for_compliance_record,
)
from app.core.database import get_db
from app.models.compliance import (
    CAPARecord,
    EthicsApproval,
    ProtocolDeviation,
    RegulatorySubmission,
)
from app.models.enums import (
    AssignmentStatus,
    CAPAStatus,
    DeviationStatus,
    ECStatus,
    RegulatoryStatus,
)
from app.models.organization import Organization
from app.models.participant import Participant
from app.models.site import Site, StudySite
from app.models.study import Study
from app.models.user import User
from app.schemas.common import StatusTransitionRequest
from app.schemas.compliance import (
    CAPARecordCreate,
    CAPARecordRead,
    EthicsApprovalCreate,
    EthicsApprovalRead,
    ProtocolDeviationCreate,
    ProtocolDeviationRead,
    RegulatorySubmissionCreate,
    RegulatorySubmissionRead,
)
from app.services.audit import AuditService

router = APIRouter(prefix="/compliance", tags=["Compliance & Regulatory"])

# Allowed state transitions
ALLOWED_EC_TRANSITIONS: dict[ECStatus, set[ECStatus]] = {
    ECStatus.not_submitted: {ECStatus.pending},
    ECStatus.pending: {ECStatus.approved, ECStatus.conditional, ECStatus.rejected},
    ECStatus.conditional: {ECStatus.approved, ECStatus.rejected},
    ECStatus.approved: {ECStatus.expired},
}

ALLOWED_REG_TRANSITIONS: dict[RegulatoryStatus, set[RegulatoryStatus]] = {
    RegulatoryStatus.not_submitted: {RegulatoryStatus.pending},
    RegulatoryStatus.pending: {
        RegulatoryStatus.approved,
        RegulatoryStatus.conditional,
        RegulatoryStatus.rejected,
    },
    RegulatoryStatus.conditional: {RegulatoryStatus.approved, RegulatoryStatus.rejected},
}

ALLOWED_DEV_TRANSITIONS: dict[DeviationStatus, set[DeviationStatus]] = {
    DeviationStatus.identified: {DeviationStatus.reported},
    DeviationStatus.reported: {DeviationStatus.resolved},
}

ALLOWED_CAPA_TRANSITIONS: dict[CAPAStatus, set[CAPAStatus]] = {
    CAPAStatus.open: {CAPAStatus.in_progress},
    CAPAStatus.in_progress: {CAPAStatus.completed},
    CAPAStatus.completed: {CAPAStatus.verified},
}


async def _get_authorized_compliance_filters(
    user: User,
    db: AsyncSession,
) -> tuple[
    set[uuid.UUID],
    set[uuid.UUID],
    set[uuid.UUID],
    set[tuple[uuid.UUID, uuid.UUID]],
    set[uuid.UUID],
]:
    """
    Computes authorized study IDs, site IDs, org IDs, site-team pairs, and full study IDs
    for querying Compliance records based on user's scope.
    Returns:
    (all_studies, all_sites, authorized_org_ids, site_team_pairs, full_study_ids)
    """
    authorized_org_ids: set[uuid.UUID] = set()
    for m in user.memberships:
        if m.status == AssignmentStatus.active and m.role:
            for rp in m.role.permissions:
                if rp.permission and rp.permission.codename in ("compliance:read", "*"):
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
                    rp.permission and rp.permission.codename in ("compliance:read", "*")
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

    return all_studies, all_sites, authorized_org_ids, site_team_pairs, full_study_ids


# -------------------------------------------------------------
# Ethics Approvals
# -------------------------------------------------------------


@router.post("/ethics", response_model=EthicsApprovalRead, status_code=http_status.HTTP_201_CREATED)
async def create_ethics_approval(
    approval_in: EthicsApprovalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_compliance_permission(current_user, "compliance:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'compliance:write'",
        )

    study = await db.get(Study, approval_in.study_id)
    if not study:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Study not found")

    if approval_in.site_id:
        site = await db.get(Site, approval_in.site_id)
        if not site:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Site not found")
        ss_stmt = select(StudySite).where(
            StudySite.study_id == approval_in.study_id,
            StudySite.site_id == approval_in.site_id,
        )
        if not (await db.execute(ss_stmt)).scalars().first():
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Site is not associated with this study",
            )

    if not is_technical_system_admin(current_user):
        user_org_ids = {
            m.organization_id
            for m in current_user.memberships
            if m.status == AssignmentStatus.active
            and m.role
            and any(rp.permission and rp.permission.codename in ("compliance:write", "*") for rp in m.role.permissions)
        }
        is_sponsor_cro = bool(
            study.sponsor_org_id in user_org_ids
            or (study.cro_org_id and study.cro_org_id in user_org_ids)
        )

        team_assignment = None
        if hasattr(current_user, "study_team_assignments") and current_user.study_team_assignments:
            for a in current_user.study_team_assignments:
                if (
                    a.study_id == approval_in.study_id
                    and a.assignment_status == AssignmentStatus.active
                    and a.role
                    and any(rp.permission and rp.permission.codename in ("compliance:write", "*") for rp in a.role.permissions)
                ):
                    team_assignment = a
                    break

        if not is_sponsor_cro and not team_assignment:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not assigned to or authorized for this study",
            )

        if team_assignment and team_assignment.site_id is not None and not is_sponsor_cro:
            user_site_id = team_assignment.site_id
            if approval_in.site_id is None:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: site staff cannot create study-wide ethics approvals",
                )
            if approval_in.site_id != user_site_id:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: site staff cannot create ethics approvals for other sites",
                )

    approval = EthicsApproval(**approval_in.model_dump())
    db.add(approval)
    await db.flush()

    changes = approval_in.model_dump(mode="json")
    changes["study_id"] = str(approval.study_id)
    if approval.site_id:
        changes["site_id"] = str(approval.site_id)

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="compliance.ethics_create",
        resource_type="ethics_approval",
        resource_id=approval.id,
        changes=changes,
    )
    await db.commit()
    await db.refresh(approval)
    return approval


@router.get("/ethics", response_model=list[EthicsApprovalRead])
async def list_ethics_approvals(
    study_id: uuid.UUID | None = None,
    site_id: uuid.UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_compliance_permission(current_user, "compliance:read"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'compliance:read'",
        )

    stmt = select(EthicsApproval)

    if not is_technical_system_admin(current_user):
        all_studies, all_sites, _, site_team_pairs, full_study_ids = await _get_authorized_compliance_filters(current_user, db)

        if not all_studies:
            return []

        if study_id and study_id not in all_studies:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not assigned to or authorized for this study",
            )
        if site_id and site_id not in all_sites and study_id not in full_study_ids:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not authorized for this site",
            )

        conditions: list[Any] = []
        if full_study_ids:
            conditions.append(EthicsApproval.study_id.in_(full_study_ids))
        for s_id, st_id in site_team_pairs:
            conditions.append(
                sa.and_(
                    EthicsApproval.study_id == s_id,
                    sa.or_(
                        EthicsApproval.site_id == st_id,
                        EthicsApproval.site_id.is_(None),
                    ),
                )
            )
        stmt = stmt.where(sa.or_(*conditions))

    if study_id:
        stmt = stmt.where(EthicsApproval.study_id == study_id)
    if site_id:
        stmt = stmt.where(EthicsApproval.site_id == site_id)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/ethics/{approval_id}/transition", response_model=EthicsApprovalRead)
async def transition_ethics_status(
    approval_id: uuid.UUID,
    transition_in: StatusTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_compliance_permission(current_user, "compliance:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'compliance:write'",
        )

    approval = await db.get(EthicsApproval, approval_id)
    if not approval:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Ethics approval not found")

    if not await is_user_authorized_for_compliance_record(current_user, approval, db, permission="compliance:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Access denied: user is not authorized to transition this ethics approval",
        )

    try:
        new_status = ECStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=f"Invalid EC status: {transition_in.new_status}")

    current_status = approval.status
    allowed = ALLOWED_EC_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from {current_status.value} to {new_status.value}",
        )

    approval.status = new_status
    if new_status in {ECStatus.approved, ECStatus.conditional} and not approval.approval_date:
        approval.approval_date = datetime.date.today()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="compliance.ethics_transition",
        resource_type="ethics_approval",
        resource_id=approval.id,
        changes={
            "study_id": str(approval.study_id),
            "old_status": current_status.value,
            "new_status": new_status.value,
            "reason": transition_in.reason,
        },
    )
    await db.commit()
    await db.refresh(approval)
    return approval


# -------------------------------------------------------------
# Regulatory Submissions
# -------------------------------------------------------------


@router.post(
    "/regulatory", response_model=RegulatorySubmissionRead, status_code=http_status.HTTP_201_CREATED
)
async def create_regulatory_submission(
    sub_in: RegulatorySubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_compliance_permission(current_user, "compliance:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'compliance:write'",
        )

    study = await db.get(Study, sub_in.study_id)
    if not study:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Study not found")

    if not is_technical_system_admin(current_user):
        user_org_ids = {
            m.organization_id
            for m in current_user.memberships
            if m.status == AssignmentStatus.active
            and m.role
            and any(rp.permission and rp.permission.codename in ("compliance:write", "*") for rp in m.role.permissions)
        }
        is_sponsor_cro = bool(
            study.sponsor_org_id in user_org_ids
            or (study.cro_org_id and study.cro_org_id in user_org_ids)
        )

        team_assignment = None
        if hasattr(current_user, "study_team_assignments") and current_user.study_team_assignments:
            for a in current_user.study_team_assignments:
                if (
                    a.study_id == sub_in.study_id
                    and a.assignment_status == AssignmentStatus.active
                    and a.role
                    and any(rp.permission and rp.permission.codename in ("compliance:write", "*") for rp in a.role.permissions)
                ):
                    team_assignment = a
                    break

        if not is_sponsor_cro and not team_assignment:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not assigned to or authorized for this study",
            )

        if team_assignment and team_assignment.site_id is not None and not is_sponsor_cro:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: site staff cannot create study regulatory submissions",
            )

    sub = RegulatorySubmission(**sub_in.model_dump())
    db.add(sub)
    await db.flush()

    changes = sub_in.model_dump(mode="json")
    changes["study_id"] = str(sub.study_id)

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="compliance.regulatory_create",
        resource_type="regulatory_submission",
        resource_id=sub.id,
        changes=changes,
    )
    await db.commit()
    await db.refresh(sub)
    return sub


@router.get("/regulatory", response_model=list[RegulatorySubmissionRead])
async def list_regulatory_submissions(
    study_id: uuid.UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_compliance_permission(current_user, "compliance:read"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'compliance:read'",
        )

    stmt = select(RegulatorySubmission)

    if not is_technical_system_admin(current_user):
        all_studies, _, _, _, _ = await _get_authorized_compliance_filters(current_user, db)

        if not all_studies:
            return []

        if study_id and study_id not in all_studies:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not assigned to or authorized for this study",
            )

        stmt = stmt.where(RegulatorySubmission.study_id.in_(all_studies))

    if study_id:
        stmt = stmt.where(RegulatorySubmission.study_id == study_id)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/regulatory/{submission_id}/transition", response_model=RegulatorySubmissionRead)
async def transition_regulatory_status(
    submission_id: uuid.UUID,
    transition_in: StatusTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_compliance_permission(current_user, "compliance:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'compliance:write'",
        )

    sub = await db.get(RegulatorySubmission, submission_id)
    if not sub:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Regulatory submission not found")

    if not await is_user_authorized_for_compliance_record(current_user, sub, db, permission="compliance:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Access denied: user is not authorized to transition this regulatory submission",
        )

    try:
        new_status = RegulatoryStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST, detail=f"Invalid regulatory status: {transition_in.new_status}"
        )

    current_status = sub.status
    allowed = ALLOWED_REG_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from {current_status.value} to {new_status.value}",
        )

    sub.status = new_status
    if new_status in {RegulatoryStatus.approved, RegulatoryStatus.conditional} and not sub.approval_date:
        sub.approval_date = datetime.date.today()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="compliance.regulatory_transition",
        resource_type="regulatory_submission",
        resource_id=sub.id,
        changes={
            "study_id": str(sub.study_id),
            "old_status": current_status.value,
            "new_status": new_status.value,
            "reason": transition_in.reason,
        },
    )
    await db.commit()
    await db.refresh(sub)
    return sub


# -------------------------------------------------------------
# Protocol Deviations
# -------------------------------------------------------------


@router.post(
    "/deviations", response_model=ProtocolDeviationRead, status_code=http_status.HTTP_201_CREATED
)
async def record_protocol_deviation(
    dev_in: ProtocolDeviationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_compliance_permission(current_user, "compliance:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'compliance:write'",
        )

    study = await db.get(Study, dev_in.study_id)
    if not study:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Study not found")

    participant = None
    if dev_in.participant_id:
        participant = await db.get(Participant, dev_in.participant_id)
        if not participant:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Participant not found")
        if participant.study_id != dev_in.study_id:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Participant does not belong to the specified study",
            )
        if dev_in.site_id and participant.site_id and dev_in.site_id != participant.site_id:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Participant is not registered at the specified site",
            )

    assigned_site_id = dev_in.site_id
    if assigned_site_id:
        site = await db.get(Site, assigned_site_id)
        if not site:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Site not found")
        ss_stmt = select(StudySite).where(
            StudySite.study_id == dev_in.study_id,
            StudySite.site_id == assigned_site_id,
        )
        if not (await db.execute(ss_stmt)).scalars().first():
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Site is not associated with this study",
            )
    elif participant and participant.site_id:
        assigned_site_id = participant.site_id

    if not is_technical_system_admin(current_user):
        user_org_ids = {
            m.organization_id
            for m in current_user.memberships
            if m.status == AssignmentStatus.active
            and m.role
            and any(rp.permission and rp.permission.codename in ("compliance:write", "*") for rp in m.role.permissions)
        }
        is_sponsor_cro = bool(
            study.sponsor_org_id in user_org_ids
            or (study.cro_org_id and study.cro_org_id in user_org_ids)
        )

        team_assignment = None
        if hasattr(current_user, "study_team_assignments") and current_user.study_team_assignments:
            for a in current_user.study_team_assignments:
                if (
                    a.study_id == dev_in.study_id
                    and a.assignment_status == AssignmentStatus.active
                    and a.role
                    and any(rp.permission and rp.permission.codename in ("compliance:write", "*") for rp in a.role.permissions)
                ):
                    team_assignment = a
                    break

        if not is_sponsor_cro and not team_assignment:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not assigned to or authorized for this study",
            )

        if team_assignment and team_assignment.site_id is not None and not is_sponsor_cro:
            user_site_id = team_assignment.site_id
            if dev_in.site_id and dev_in.site_id != user_site_id:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: site staff cannot record protocol deviations for other sites",
                )
            if participant and participant.site_id and participant.site_id != user_site_id:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: site staff cannot record protocol deviations for other sites' participants",
                )
            assigned_site_id = user_site_id

    dev_data = dev_in.model_dump()
    dev_data["site_id"] = assigned_site_id

    dev = ProtocolDeviation(**dev_data)
    db.add(dev)
    await db.flush()

    changes = dev_data.copy()
    changes["study_id"] = str(dev.study_id)
    if assigned_site_id:
        changes["site_id"] = str(assigned_site_id)
    if dev.participant_id:
        changes["participant_id"] = str(dev.participant_id)

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="compliance.deviation_record",
        resource_type="protocol_deviation",
        resource_id=dev.id,
        changes=changes,
    )
    await db.commit()
    await db.refresh(dev)
    return dev


@router.get("/deviations", response_model=list[ProtocolDeviationRead])
async def list_protocol_deviations(
    study_id: uuid.UUID | None = None,
    site_id: uuid.UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_compliance_permission(current_user, "compliance:read"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'compliance:read'",
        )

    stmt = select(ProtocolDeviation)

    if not is_technical_system_admin(current_user):
        all_studies, all_sites, _, site_team_pairs, full_study_ids = await _get_authorized_compliance_filters(current_user, db)

        if not all_studies:
            return []

        if study_id and study_id not in all_studies:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not assigned to or authorized for this study",
            )
        if site_id and site_id not in all_sites and study_id not in full_study_ids:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not authorized for this site",
            )

        conditions: list[Any] = []
        if full_study_ids:
            conditions.append(ProtocolDeviation.study_id.in_(full_study_ids))
        for s_id, st_id in site_team_pairs:
            conditions.append(
                sa.and_(
                    ProtocolDeviation.study_id == s_id,
                    sa.or_(
                        ProtocolDeviation.site_id == st_id,
                        sa.and_(ProtocolDeviation.site_id.is_(None), ProtocolDeviation.participant_id.is_(None)),
                    ),
                )
            )
        stmt = stmt.where(sa.or_(*conditions))

    if study_id:
        stmt = stmt.where(ProtocolDeviation.study_id == study_id)
    if site_id:
        stmt = stmt.where(ProtocolDeviation.site_id == site_id)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/deviations/{deviation_id}/transition", response_model=ProtocolDeviationRead)
async def transition_deviation_status(
    deviation_id: uuid.UUID,
    transition_in: StatusTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_compliance_permission(current_user, "compliance:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'compliance:write'",
        )

    dev = await db.get(ProtocolDeviation, deviation_id)
    if not dev:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Protocol deviation not found")

    if not await is_user_authorized_for_compliance_record(current_user, dev, db, permission="compliance:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Access denied: user is not authorized to transition this protocol deviation",
        )

    try:
        new_status = DeviationStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST, detail=f"Invalid deviation status: {transition_in.new_status}"
        )

    current_status = dev.status
    allowed = ALLOWED_DEV_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from {current_status.value} to {new_status.value}",
        )

    dev.status = new_status
    if new_status == DeviationStatus.resolved and not dev.resolution_date:
        dev.resolution_date = datetime.date.today()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="compliance.deviation_transition",
        resource_type="protocol_deviation",
        resource_id=dev.id,
        changes={
            "study_id": str(dev.study_id),
            "old_status": current_status.value,
            "new_status": new_status.value,
            "reason": transition_in.reason,
        },
    )
    await db.commit()
    await db.refresh(dev)
    return dev


# -------------------------------------------------------------
# CAPA Records
# -------------------------------------------------------------


@router.post("/capa", response_model=CAPARecordRead, status_code=http_status.HTTP_201_CREATED)
async def create_capa_record(
    capa_in: CAPARecordCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_compliance_permission(current_user, "compliance:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'compliance:write'",
        )

    if capa_in.study_id:
        study = await db.get(Study, capa_in.study_id)
        if not study:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Study not found")

        if not is_technical_system_admin(current_user):
            user_org_ids = {
                m.organization_id
                for m in current_user.memberships
                if m.status == AssignmentStatus.active
                and m.role
                and any(rp.permission and rp.permission.codename in ("compliance:write", "*") for rp in m.role.permissions)
            }
            is_sponsor_cro = bool(
                study.sponsor_org_id in user_org_ids
                or (study.cro_org_id and study.cro_org_id in user_org_ids)
            )

            is_study_team = False
            if hasattr(current_user, "study_team_assignments") and current_user.study_team_assignments:
                for a in current_user.study_team_assignments:
                    if (
                        a.study_id == capa_in.study_id
                        and a.assignment_status == AssignmentStatus.active
                        and a.role
                        and any(rp.permission and rp.permission.codename in ("compliance:write", "*") for rp in a.role.permissions)
                    ):
                        is_study_team = True
                        break

            if not is_sponsor_cro and not is_study_team:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: user is not assigned to or authorized for this study",
                )

    if capa_in.organization_id:
        org = await db.get(Organization, capa_in.organization_id)
        if not org:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Organization not found")

        if not is_technical_system_admin(current_user):
            user_org_ids = {
                m.organization_id
                for m in current_user.memberships
                if m.status == AssignmentStatus.active
                and m.role
                and any(rp.permission and rp.permission.codename in ("compliance:write", "*") for rp in m.role.permissions)
            }
            if capa_in.organization_id not in user_org_ids:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: user is not an active member of this organization",
                )

    if capa_in.deviation_id:
        dev = await db.get(ProtocolDeviation, capa_in.deviation_id)
        if not dev:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Protocol deviation not found")
        if not await is_user_authorized_for_compliance_record(current_user, dev, db, permission="compliance:write"):
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not authorized for this deviation",
            )

    capa = CAPARecord(**capa_in.model_dump())
    db.add(capa)
    await db.flush()

    changes = capa_in.model_dump(mode="json")
    if capa.study_id:
        changes["study_id"] = str(capa.study_id)
    if capa.organization_id:
        changes["organization_id"] = str(capa.organization_id)

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="compliance.capa_create",
        resource_type="capa_record",
        resource_id=capa.id,
        changes=changes,
    )
    await db.commit()
    await db.refresh(capa)
    return capa


@router.get("/capa", response_model=list[CAPARecordRead])
async def list_capa_records(
    study_id: uuid.UUID | None = None,
    organization_id: uuid.UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_compliance_permission(current_user, "compliance:read"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'compliance:read'",
        )

    stmt = select(CAPARecord)

    if not is_technical_system_admin(current_user):
        all_studies, _, authorized_org_ids, _, _ = await _get_authorized_compliance_filters(current_user, db)

        if not all_studies and not authorized_org_ids:
            return []

        if study_id and study_id not in all_studies:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not assigned to or authorized for this study",
            )
        if organization_id and organization_id not in authorized_org_ids:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not an active member of this organization",
            )

        conditions: list[Any] = []
        if all_studies:
            conditions.append(CAPARecord.study_id.in_(all_studies))
        if authorized_org_ids:
            conditions.append(CAPARecord.organization_id.in_(authorized_org_ids))
        stmt = stmt.where(sa.or_(*conditions))

    if study_id:
        stmt = stmt.where(CAPARecord.study_id == study_id)
    if organization_id:
        stmt = stmt.where(CAPARecord.organization_id == organization_id)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/capa/{capa_id}/transition", response_model=CAPARecordRead)
async def transition_capa_status(
    capa_id: uuid.UUID,
    transition_in: StatusTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_compliance_permission(current_user, "compliance:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'compliance:write'",
        )

    capa = await db.get(CAPARecord, capa_id)
    if not capa:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="CAPA record not found")

    if not await is_user_authorized_for_compliance_record(current_user, capa, db, permission="compliance:write"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Access denied: user is not authorized to transition this CAPA record",
        )

    try:
        new_status = CAPAStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=f"Invalid CAPA status: {transition_in.new_status}")

    current_status = capa.status
    allowed = ALLOWED_CAPA_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from {current_status.value} to {new_status.value}",
        )

    capa.status = new_status
    if new_status == CAPAStatus.completed and not capa.completed_date:
        capa.completed_date = datetime.date.today()

    changes: dict[str, Any] = {
        "old_status": current_status.value,
        "new_status": new_status.value,
        "reason": transition_in.reason,
    }
    if capa.study_id:
        changes["study_id"] = str(capa.study_id)
    if capa.organization_id:
        changes["organization_id"] = str(capa.organization_id)

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="compliance.capa_transition",
        resource_type="capa_record",
        resource_id=capa.id,
        changes=changes,
    )
    await db.commit()
    await db.refresh(capa)
    return capa
