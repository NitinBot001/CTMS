from __future__ import annotations

import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.rbac import get_user_accessible_site_ids, get_user_accessible_study_ids
from app.models.enums import ParticipantStatus, StudySiteActivationStatus
from app.models.participant import Participant
from app.models.site import StudySite
from app.models.study import Study
from app.models.user import User
from app.schemas.common import StatusTransitionRequest
from app.schemas.participant import (
    ParticipantBulkImportRequest,
    ParticipantBulkImportResponse,
    ParticipantCreate,
    ParticipantImportError,
    ParticipantRead,
)
from app.services.audit import AuditService

router = APIRouter(prefix="/participants", tags=["Participants"])


@router.post("", response_model=ParticipantRead, status_code=status.HTTP_201_CREATED)
async def create_participant(
    participant_in: ParticipantCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    study = await db.get(Study, participant_in.study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    if not participant_in.site_id:
        raise HTTPException(status_code=400, detail="site_id is required to register a participant")

    # Validate site is an active StudySite for this study protocol
    ss_stmt = select(StudySite).where(
        StudySite.study_id == participant_in.study_id,
        StudySite.site_id == participant_in.site_id,
    )
    study_site = (await db.execute(ss_stmt)).scalars().first()
    if not study_site:
        raise HTTPException(
            status_code=400,
            detail=f"Site {participant_in.site_id} is not assigned to study protocol {participant_in.study_id}",
        )
    if study_site.activation_status != StudySiteActivationStatus.activated:
        raise HTTPException(
            status_code=400,
            detail=f"Site {participant_in.site_id} is currently {study_site.activation_status.value}. Only activated participating sites can register participants.",
        )

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
        user_id=current_user.id,
        action="participant.create",
        resource_type="participant",
        resource_id=participant.id,
        changes=participant_in.model_dump(mode="json"),
    )
    await db.commit()
    await db.refresh(participant)
    return participant


@router.post(
    "/bulk-import",
    response_model=ParticipantBulkImportResponse,
    status_code=status.HTTP_200_OK,
)
async def bulk_import_participants(
    import_in: ParticipantBulkImportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Bulk imports participants for a study protocol with strict row-level validation.
    Verifies study existence, activated StudySite association, and participant code uniqueness.
    """
    study = await db.get(Study, import_in.study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    # Pre-cache activated StudySites for this study
    ss_stmt = select(StudySite).where(
        StudySite.study_id == import_in.study_id,
        StudySite.activation_status == StudySiteActivationStatus.activated,
    )
    active_sites = {ss.site_id for ss in (await db.execute(ss_stmt)).scalars().all()}

    # Pre-cache existing participant codes in this study
    p_stmt = select(Participant.participant_code).where(Participant.study_id == import_in.study_id)
    existing_codes = set((await db.execute(p_stmt)).scalars().all())

    errors: list[ParticipantImportError] = []
    imported_participants: list[Participant] = []
    batch_codes: set[str] = set()

    for idx, item in enumerate(import_in.participants, start=1):
        code = item.participant_code.strip() if item.participant_code else ""
        if not code:
            errors.append(ParticipantImportError(row=idx, participant_code="N/A", error="Missing participant_code"))
            continue

        if code in existing_codes or code in batch_codes:
            errors.append(ParticipantImportError(row=idx, participant_code=code, error="Duplicate participant code in study"))
            continue

        if item.site_id not in active_sites:
            errors.append(
                ParticipantImportError(
                    row=idx,
                    participant_code=code,
                    error=f"Site {item.site_id} is not an activated participating site for this study protocol",
                )
            )
            continue

        p = Participant(
            participant_code=code,
            study_id=import_in.study_id,
            site_id=item.site_id,
            screening_date=item.screening_date,
            enrollment_date=item.enrollment_date,
            status=item.status,
        )
        db.add(p)
        batch_codes.add(code)
        imported_participants.append(p)

    if imported_participants:
        await db.flush()
        await AuditService.create_audit_log(
            db=db,
            user_id=current_user.id,
            action="participant.bulk_import",
            resource_type="study",
            resource_id=import_in.study_id,
            changes={
                "imported_count": len(imported_participants),
                "failed_count": len(errors),
            },
        )
        await db.commit()
        for p in imported_participants:
            await db.refresh(p)

    return ParticipantBulkImportResponse(
        total_processed=len(import_in.participants),
        imported_count=len(imported_participants),
        failed_count=len(errors),
        errors=errors,
        imported_participants=[ParticipantRead.model_validate(p) for p in imported_participants],
    )


@router.get("", response_model=list[ParticipantRead])
async def list_participants(
    study_id: uuid.UUID | None = None,
    site_id: uuid.UUID | None = None,
    status: ParticipantStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    accessible_study_ids = await get_user_accessible_study_ids(current_user, db)
    accessible_site_ids = await get_user_accessible_site_ids(current_user, db)

    stmt = select(Participant)
    if accessible_study_ids is not None:
        stmt = stmt.where(Participant.study_id.in_(accessible_study_ids))
    if accessible_site_ids is not None and accessible_study_ids is None:
        stmt = stmt.where(Participant.site_id.in_(accessible_site_ids))

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
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
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
            detail=f"Invalid transition from {participant.status.value} to {new_status.value}",
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
        user_id=current_user.id,
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
