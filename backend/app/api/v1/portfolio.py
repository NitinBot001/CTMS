from __future__ import annotations

import datetime
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.compliance import ProtocolDeviation
from app.models.enums import (
    AEStatus,
    ParticipantStatus,
    Seriousness,
    StudySiteActivationStatus,
    StudyStatus,
)
from app.models.participant import Participant
from app.models.safety import AdverseEvent
from app.models.site import Site, StudySite
from app.models.study import Study

router = APIRouter(prefix="/portfolio", tags=["Portfolio / Derived Analytics"])


@router.get("/overview")
async def get_portfolio_overview(
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Computes all portfolio metrics dynamically from canonical database records.
    No redundant counters are stored.
    """
    today = datetime.date.today()

    # Studies metrics
    total_studies_res = await db.execute(select(func.count(Study.id)))
    total_studies = total_studies_res.scalar() or 0

    active_studies_res = await db.execute(
        select(func.count(Study.id)).where(Study.status == StudyStatus.active)
    )
    active_studies = active_studies_res.scalar() or 0

    planned_studies_res = await db.execute(
        select(func.count(Study.id)).where(Study.status == StudyStatus.planned)
    )
    planned_studies = planned_studies_res.scalar() or 0

    completed_studies_res = await db.execute(
        select(func.count(Study.id)).where(Study.status == StudyStatus.completed)
    )
    completed_studies = completed_studies_res.scalar() or 0

    delayed_studies_res = await db.execute(
        select(func.count(Study.id)).where(
            Study.status == StudyStatus.active,
            Study.end_date < today,
        )
    )
    delayed_studies = delayed_studies_res.scalar() or 0

    # Sites metrics
    total_sites_res = await db.execute(select(func.count(Site.id)))
    total_sites = total_sites_res.scalar() or 0

    active_sites_res = await db.execute(
        select(func.count(func.distinct(StudySite.site_id))).where(
            StudySite.activation_status == StudySiteActivationStatus.activated
        )
    )
    active_sites = active_sites_res.scalar() or 0

    # Participant metrics
    total_participants_res = await db.execute(select(func.count(Participant.id)))
    total_participants = total_participants_res.scalar() or 0

    enrolled_res = await db.execute(
        select(func.count(Participant.id)).where(
            Participant.status.in_(
                [
                    ParticipantStatus.enrolled,
                    ParticipantStatus.active,
                    ParticipantStatus.completed,
                ]
            )
        )
    )
    actual_enrollment = enrolled_res.scalar() or 0

    active_participants_res = await db.execute(
        select(func.count(Participant.id)).where(Participant.status == ParticipantStatus.active)
    )
    active_participants = active_participants_res.scalar() or 0

    screen_failures_res = await db.execute(
        select(func.count(Participant.id)).where(
            Participant.status == ParticipantStatus.screen_failed
        )
    )
    screen_failures = screen_failures_res.scalar() or 0

    # Safety metrics
    open_ae_res = await db.execute(
        select(func.count(AdverseEvent.id)).where(AdverseEvent.status == AEStatus.open)
    )
    open_cases = open_ae_res.scalar() or 0

    open_sae_res = await db.execute(
        select(func.count(AdverseEvent.id)).where(
            AdverseEvent.status == AEStatus.open,
            AdverseEvent.seriousness == Seriousness.serious,
        )
    )
    open_sae_cases = open_sae_res.scalar() or 0

    return {
        "as_of_date": today.isoformat(),
        "studies": {
            "total": total_studies,
            "active": active_studies,
            "planned": planned_studies,
            "completed": completed_studies,
            "delayed": delayed_studies,
        },
        "sites": {
            "total_registered": total_sites,
            "currently_activated": active_sites,
        },
        "participants": {
            "total_screened": total_participants,
            "actual_enrolled": actual_enrollment,
            "active_in_treatment": active_participants,
            "screen_failures": screen_failures,
        },
        "safety": {
            "open_cases": open_cases,
            "open_serious_cases": open_sae_cases,
        },
    }


@router.get("/studies/{study_id}/metrics")
async def get_study_metrics(
    study_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Computes study-level progress, enrollment, and safety metrics dynamically.
    """
    study = await db.get(Study, study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    today = datetime.date.today()

    # Participant breakdown
    status_counts_res = await db.execute(
        select(Participant.status, func.count(Participant.id))
        .where(Participant.study_id == study_id)
        .group_by(Participant.status)
    )
    status_counts = {str(status.value): count for status, count in status_counts_res.all()}

    actual_enrolled = (
        status_counts.get("enrolled", 0)
        + status_counts.get("active", 0)
        + status_counts.get("completed", 0)
    )
    planned = study.planned_sample_size or 0
    recruitment_pct = round((actual_enrolled / planned * 100), 1) if planned > 0 else 0.0

    # Study sites
    sites_res = await db.execute(
        select(func.count(StudySite.id)).where(StudySite.study_id == study_id)
    )
    site_count = sites_res.scalar() or 0

    active_sites_res = await db.execute(
        select(func.count(StudySite.id)).where(
            StudySite.study_id == study_id,
            StudySite.activation_status == StudySiteActivationStatus.activated,
        )
    )
    active_site_count = active_sites_res.scalar() or 0

    # Safety
    ae_res = await db.execute(
        select(func.count(AdverseEvent.id)).where(AdverseEvent.study_id == study_id)
    )
    ae_count = ae_res.scalar() or 0

    sae_res = await db.execute(
        select(func.count(AdverseEvent.id)).where(
            AdverseEvent.study_id == study_id,
            AdverseEvent.seriousness == Seriousness.serious,
        )
    )
    sae_count = sae_res.scalar() or 0

    # Deviations
    dev_res = await db.execute(
        select(func.count(ProtocolDeviation.id)).where(ProtocolDeviation.study_id == study_id)
    )
    deviation_count = dev_res.scalar() or 0

    is_delayed = bool(
        study.end_date and study.end_date < today and study.status == StudyStatus.active
    )

    return {
        "study_id": str(study.id),
        "study_code": study.study_code,
        "title": study.title,
        "phase": study.phase.value,
        "status": study.status.value,
        "is_delayed": is_delayed,
        "recruitment": {
            "planned_sample_size": planned,
            "actual_enrolled": actual_enrolled,
            "recruitment_percentage": recruitment_pct,
            "status_breakdown": status_counts,
        },
        "sites": {
            "total_assigned": site_count,
            "activated": active_site_count,
        },
        "safety": {
            "total_adverse_events": ae_count,
            "serious_adverse_events": sae_count,
        },
        "compliance": {
            "total_deviations": deviation_count,
        },
    }
