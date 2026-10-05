from __future__ import annotations

import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.compliance import (
    CAPARecord,
    EthicsApproval,
    ProtocolDeviation,
    RegulatorySubmission,
)
from app.models.enums import (
    CAPAStatus,
    DeviationStatus,
    ECStatus,
    RegulatoryStatus,
)
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


# -------------------------------------------------------------
# Ethics Approvals
# -------------------------------------------------------------


@router.post("/ethics", response_model=EthicsApprovalRead, status_code=status.HTTP_201_CREATED)
async def create_ethics_approval(
    approval_in: EthicsApprovalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    approval = EthicsApproval(**approval_in.model_dump())
    db.add(approval)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="compliance.ethics_create",
        resource_type="ethics_approval",
        resource_id=approval.id,
        changes=approval_in.model_dump(mode="json"),
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
    stmt = select(EthicsApproval)
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
    approval = await db.get(EthicsApproval, approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Ethics approval not found")

    try:
        new_status = ECStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid EC status: {transition_in.new_status}")

    current_status = approval.status
    allowed = ALLOWED_EC_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
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
    "/regulatory", response_model=RegulatorySubmissionRead, status_code=status.HTTP_201_CREATED
)
async def create_regulatory_submission(
    sub_in: RegulatorySubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub = RegulatorySubmission(**sub_in.model_dump())
    db.add(sub)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="compliance.regulatory_create",
        resource_type="regulatory_submission",
        resource_id=sub.id,
        changes=sub_in.model_dump(mode="json"),
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
    stmt = select(RegulatorySubmission)
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
    sub = await db.get(RegulatorySubmission, submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Regulatory submission not found")

    try:
        new_status = RegulatoryStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(
            status_code=400, detail=f"Invalid regulatory status: {transition_in.new_status}"
        )

    current_status = sub.status
    allowed = ALLOWED_REG_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
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
    "/deviations", response_model=ProtocolDeviationRead, status_code=status.HTTP_201_CREATED
)
async def record_protocol_deviation(
    dev_in: ProtocolDeviationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dev = ProtocolDeviation(**dev_in.model_dump())
    db.add(dev)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="compliance.deviation_record",
        resource_type="protocol_deviation",
        resource_id=dev.id,
        changes=dev_in.model_dump(mode="json"),
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
    stmt = select(ProtocolDeviation)
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
    dev = await db.get(ProtocolDeviation, deviation_id)
    if not dev:
        raise HTTPException(status_code=404, detail="Protocol deviation not found")

    try:
        new_status = DeviationStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(
            status_code=400, detail=f"Invalid deviation status: {transition_in.new_status}"
        )

    current_status = dev.status
    allowed = ALLOWED_DEV_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
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


@router.post("/capa", response_model=CAPARecordRead, status_code=status.HTTP_201_CREATED)
async def create_capa_record(
    capa_in: CAPARecordCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    capa = CAPARecord(**capa_in.model_dump())
    db.add(capa)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="compliance.capa_create",
        resource_type="capa_record",
        resource_id=capa.id,
        changes=capa_in.model_dump(mode="json"),
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
    stmt = select(CAPARecord)
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
    capa = await db.get(CAPARecord, capa_id)
    if not capa:
        raise HTTPException(status_code=404, detail="CAPA record not found")

    try:
        new_status = CAPAStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid CAPA status: {transition_in.new_status}")

    current_status = capa.status
    allowed = ALLOWED_CAPA_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {current_status.value} to {new_status.value}",
        )

    capa.status = new_status
    if new_status == CAPAStatus.completed and not capa.completed_date:
        capa.completed_date = datetime.date.today()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="compliance.capa_transition",
        resource_type="capa_record",
        resource_id=capa.id,
        changes={
            "old_status": current_status.value,
            "new_status": new_status.value,
            "reason": transition_in.reason,
        },
    )
    await db.commit()
    await db.refresh(capa)
    return capa
