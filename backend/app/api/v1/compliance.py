from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.compliance import (
    CAPARecord,
    EthicsApproval,
    ProtocolDeviation,
    RegulatorySubmission,
)
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
SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


# -------------------------------------------------------------
# Ethics Approvals
# -------------------------------------------------------------


@router.post("/ethics", response_model=EthicsApprovalRead, status_code=status.HTTP_201_CREATED)
async def create_ethics_approval(
    approval_in: EthicsApprovalCreate,
    db: AsyncSession = Depends(get_db),
):
    approval = EthicsApproval(**approval_in.model_dump())
    db.add(approval)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=SYSTEM_USER_ID,
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


# -------------------------------------------------------------
# Regulatory Submissions
# -------------------------------------------------------------


@router.post(
    "/regulatory", response_model=RegulatorySubmissionRead, status_code=status.HTTP_201_CREATED
)
async def create_regulatory_submission(
    sub_in: RegulatorySubmissionCreate,
    db: AsyncSession = Depends(get_db),
):
    sub = RegulatorySubmission(**sub_in.model_dump())
    db.add(sub)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=SYSTEM_USER_ID,
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
    db: AsyncSession = Depends(get_db),
):
    stmt = select(RegulatorySubmission)
    if study_id:
        stmt = stmt.where(RegulatorySubmission.study_id == study_id)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


# -------------------------------------------------------------
# Protocol Deviations
# -------------------------------------------------------------


@router.post(
    "/deviations", response_model=ProtocolDeviationRead, status_code=status.HTTP_201_CREATED
)
async def record_protocol_deviation(
    dev_in: ProtocolDeviationCreate,
    db: AsyncSession = Depends(get_db),
):
    dev = ProtocolDeviation(**dev_in.model_dump())
    db.add(dev)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=SYSTEM_USER_ID,
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


# -------------------------------------------------------------
# CAPA Records
# -------------------------------------------------------------


@router.post("/capa", response_model=CAPARecordRead, status_code=status.HTTP_201_CREATED)
async def create_capa_record(
    capa_in: CAPARecordCreate,
    db: AsyncSession = Depends(get_db),
):
    capa = CAPARecord(**capa_in.model_dump())
    db.add(capa)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=SYSTEM_USER_ID,
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
