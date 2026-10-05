from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.enums import AEStatus, Seriousness, Severity
from app.models.safety import AdverseEvent
from app.models.user import User
from app.schemas.common import StatusTransitionRequest
from app.schemas.safety import AdverseEventCreate, AdverseEventRead
from app.services.audit import AuditService

router = APIRouter(prefix="/safety", tags=["Safety / Pharmacovigilance"])


@router.post(
    "/adverse-events", response_model=AdverseEventRead, status_code=status.HTTP_201_CREATED
)
async def report_adverse_event(
    event_in: AdverseEventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ae = AdverseEvent(
        **event_in.model_dump(),
        status=AEStatus.open,
        reported_by=current_user.id,
    )
    db.add(ae)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="safety.ae_report",
        resource_type="adverse_event",
        resource_id=ae.id,
        changes=event_in.model_dump(mode="json"),
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
    stmt = select(AdverseEvent)
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
    ae = await db.get(AdverseEvent, event_id)
    if not ae:
        raise HTTPException(status_code=404, detail="Adverse event not found")
    return ae


@router.post("/adverse-events/{event_id}/transition", response_model=AdverseEventRead)
async def transition_adverse_event(
    event_id: uuid.UUID,
    transition_in: StatusTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ae = await db.get(AdverseEvent, event_id)
    if not ae:
        raise HTTPException(status_code=404, detail="Adverse event not found")

    try:
        new_status = AEStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(
            status_code=400, detail=f"Invalid AE status: {transition_in.new_status}"
        )

    allowed_transitions = {
        AEStatus.open: [AEStatus.under_review, AEStatus.closed],
        AEStatus.under_review: [AEStatus.closed, AEStatus.open],
    }

    if new_status not in allowed_transitions.get(ae.status, []):
        raise HTTPException(
            status_code=400, detail=f"Invalid transition from {ae.status.value} to {new_status.value}"
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
            "old_status": old_status.value,
            "new_status": new_status.value,
            "notes": transition_in.reason,
        },
    )
    await db.commit()
    await db.refresh(ae)
    return ae
