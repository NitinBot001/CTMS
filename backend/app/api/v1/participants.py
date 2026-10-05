from __future__ import annotations

import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.enums import ParticipantStatus
from app.models.participant import Participant
from app.schemas.common import StatusTransitionRequest
from app.schemas.participant import ParticipantCreate, ParticipantRead
from app.services.audit import AuditService

router = APIRouter(prefix="/participants", tags=["Participants"])
SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@router.post("", response_model=ParticipantRead, status_code=status.HTTP_201_CREATED)
async def create_participant(
    participant_in: ParticipantCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Participant).where(
            Participant.participant_code == participant_in.participant_code,
            Participant.study_id == participant_in.study_id,
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Participant code already exists in this study")

    participant = Participant(
        **participant_in.model_dump(),
        status=ParticipantStatus.screened,
    )
    db.add(participant)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=SYSTEM_USER_ID,
        action="participant.create",
        resource_type="participant",
        resource_id=participant.id,
        changes=participant_in.model_dump(mode="json"),
    )
    await db.commit()
    await db.refresh(participant)
    return participant


@router.get("", response_model=list[ParticipantRead])
async def list_participants(
    study_id: uuid.UUID | None = None,
    site_id: uuid.UUID | None = None,
    status: ParticipantStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Participant)
    if study_id:
        stmt = stmt.where(Participant.study_id == study_id)
    if site_id:
        stmt = stmt.where(Participant.site_id == site_id)
    if status:
        stmt = stmt.where(Participant.status == status)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{participant_id}", response_model=ParticipantRead)
async def get_participant(
    participant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    participant = await db.get(Participant, participant_id)
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    return participant


@router.post("/{participant_id}/transition", response_model=ParticipantRead)
async def transition_participant(
    participant_id: uuid.UUID,
    transition_in: StatusTransitionRequest,
    db: AsyncSession = Depends(get_db),
):
    participant = await db.get(Participant, participant_id)
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    try:
        new_status = ParticipantStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(
            status_code=400, detail=f"Invalid participant status: {transition_in.new_status}"
        )

    allowed_transitions = {
        ParticipantStatus.screened: [ParticipantStatus.eligible, ParticipantStatus.screen_failed],
        ParticipantStatus.eligible: [
            ParticipantStatus.randomized,
            ParticipantStatus.enrolled,
            ParticipantStatus.withdrawn,
        ],
        ParticipantStatus.randomized: [ParticipantStatus.enrolled, ParticipantStatus.withdrawn],
        ParticipantStatus.enrolled: [ParticipantStatus.active, ParticipantStatus.withdrawn],
        ParticipantStatus.active: [ParticipantStatus.completed, ParticipantStatus.withdrawn],
    }

    if new_status not in allowed_transitions.get(participant.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition from {participant.status} to {new_status}",
        )

    old_status = participant.status
    participant.status = new_status
    today = datetime.date.today()

    if new_status == ParticipantStatus.randomized:
        participant.randomization_date = today
    elif new_status == ParticipantStatus.enrolled:
        participant.enrollment_date = today
    elif new_status == ParticipantStatus.completed:
        participant.completion_date = today
    elif new_status == ParticipantStatus.withdrawn:
        participant.withdrawal_date = today
        participant.withdrawal_reason = transition_in.reason

    await AuditService.create_audit_log(
        db=db,
        user_id=SYSTEM_USER_ID,
        action="participant.transition",
        resource_type="participant",
        resource_id=participant.id,
        changes={
            "old_status": old_status.value,
            "new_status": new_status.value,
            "reason": transition_in.reason,
        },
    )
    await db.commit()
    await db.refresh(participant)
    return participant
