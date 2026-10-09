from __future__ import annotations

import datetime
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.compliance import EthicsApproval, ProtocolDeviation
from app.models.enums import (
    AEStatus,
    DeviationSeverity,
    DeviationStatus,
    ECStatus,
    MilestoneStatus,
    ParticipantStatus,
    Seriousness,
    StudySiteActivationStatus,
    StudyStatus,
)
from app.models.participant import Participant
from app.models.progress import StudyMilestone
from app.models.safety import AdverseEvent
from app.models.site import Site, StudySite
from app.models.study import Study
from app.models.user import User
from app.schemas.portfolio import (
    EnrollmentTrendPoint,
    PortfolioAlertItem,
    PortfolioHealthResponse,
    PortfolioOverviewResponse,
    SiteEnrollmentItem,
    StudyMetricsResponse,
    UpcomingMilestoneItem,
)

router = APIRouter(prefix="/portfolio", tags=["Portfolio / Derived Analytics"])


@router.get("/overview", response_model=PortfolioOverviewResponse)
async def get_portfolio_overview(
    current_user: User = Depends(get_current_user),
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


@router.get("/health", response_model=PortfolioHealthResponse)
async def get_portfolio_health(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Computes technical composite health indicator (Green, Amber, Red) based on:
    - Delayed studies past their end date
    - Unresolved critical deviations
    - Open serious adverse events (SAEs)
    - Expired ethics committee approvals
    """
    today = datetime.date.today()

    delayed_studies_res = await db.execute(
        select(func.count(Study.id)).where(
            Study.status == StudyStatus.active,
            Study.end_date < today,
        )
    )
    delayed_studies = delayed_studies_res.scalar() or 0

    open_sae_res = await db.execute(
        select(func.count(AdverseEvent.id)).where(
            AdverseEvent.status == AEStatus.open,
            AdverseEvent.seriousness == Seriousness.serious,
        )
    )
    open_sae = open_sae_res.scalar() or 0

    crit_dev_res = await db.execute(
        select(func.count(ProtocolDeviation.id)).where(
            ProtocolDeviation.severity == DeviationSeverity.critical,
            ProtocolDeviation.status != DeviationStatus.resolved,
        )
    )
    crit_deviations = crit_dev_res.scalar() or 0

    expired_ec_res = await db.execute(
        select(func.count(EthicsApproval.id)).where(
            EthicsApproval.status == ECStatus.approved,
            EthicsApproval.expiry_date < today,
        )
    )
    expired_ec = expired_ec_res.scalar() or 0

    # Composite logic
    if crit_deviations > 0 or open_sae >= 3 or delayed_studies >= 3:
        status_rating = "Red"
        risk_level = "High"
    elif open_sae > 0 or delayed_studies > 0 or expired_ec > 0:
        status_rating = "Amber"
        risk_level = "Medium"
    else:
        status_rating = "Green"
        risk_level = "Low"

    return {
        "status": status_rating,
        "risk_level": risk_level,
        "as_of_date": today.isoformat(),
        "indicators": {
            "delayed_studies": delayed_studies,
            "open_serious_adverse_events": open_sae,
            "critical_unresolved_deviations": crit_deviations,
            "expired_ethics_approvals": expired_ec,
        },
        "summary": (
            f"Portfolio health rated {status_rating} ({risk_level} risk) with "
            f"{delayed_studies} delayed studies, {open_sae} open SAEs, and {crit_deviations} critical deviations."
        ),
    }


@router.get("/alerts", response_model=list[PortfolioAlertItem])
async def get_portfolio_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    Returns aggregated actionable operational alerts:
    - Approvals expiring within 30 days or already expired
    - Delayed milestones
    - Open SAEs requiring expedited review
    - Critical protocol deviations
    """
    today = datetime.date.today()
    in_30_days = today + datetime.timedelta(days=30)
    alerts: list[dict[str, Any]] = []

    # 1. Expiring / Expired Ethics Approvals
    ec_stmt = select(EthicsApproval).where(
        EthicsApproval.status == ECStatus.approved,
        EthicsApproval.expiry_date <= in_30_days,
    )
    ec_result = await db.execute(ec_stmt)
    for ec in ec_result.scalars().all():
        is_expired = ec.expiry_date and ec.expiry_date < today
        alerts.append(
            {
                "type": "ethics_expiry",
                "severity": "critical" if is_expired else "warning",
                "title": f"Ethics Approval {'Expired' if is_expired else 'Expiring Soon'}",
                "description": (
                    f"Ethics approval for committee '{ec.committee_name}' "
                    f"{'expired on' if is_expired else 'will expire on'} {ec.expiry_date}."
                ),
                "study_id": str(ec.study_id),
                "due_date": ec.expiry_date.isoformat() if ec.expiry_date else None,
            }
        )

    # 2. Delayed Milestones
    ms_stmt = select(StudyMilestone).where(
        StudyMilestone.status.in_([MilestoneStatus.pending, MilestoneStatus.in_progress]),
        StudyMilestone.planned_date < today,
    )
    ms_result = await db.execute(ms_stmt)
    for ms in ms_result.scalars().all():
        alerts.append(
            {
                "type": "milestone_delayed",
                "severity": "warning",
                "title": f"Milestone Delayed: {ms.title}",
                "description": f"Milestone '{ms.title}' was planned for completion by {ms.planned_date}.",
                "study_id": str(ms.study_id),
                "due_date": ms.planned_date.isoformat() if ms.planned_date else None,
            }
        )

    # 3. Open SAEs
    sae_stmt = select(AdverseEvent).where(
        AdverseEvent.status == AEStatus.open,
        AdverseEvent.seriousness == Seriousness.serious,
    )
    sae_result = await db.execute(sae_stmt)
    for sae in sae_result.scalars().all():
        alerts.append(
            {
                "type": "open_sae",
                "severity": "critical",
                "title": "Open Serious Adverse Event",
                "description": f"SAE '{sae.description[:80]}' remains open under active review.",
                "study_id": str(sae.study_id),
                "due_date": sae.onset_date.isoformat() if sae.onset_date else None,
            }
        )

    # 4. Critical Protocol Deviations
    dev_stmt = select(ProtocolDeviation).where(
        ProtocolDeviation.severity == DeviationSeverity.critical,
        ProtocolDeviation.status != DeviationStatus.resolved,
    )
    dev_result = await db.execute(dev_stmt)
    for dev in dev_result.scalars().all():
        alerts.append(
            {
                "type": "critical_deviation",
                "severity": "critical",
                "title": f"Critical Deviation: {dev.category}",
                "description": dev.description[:120],
                "study_id": str(dev.study_id),
                "due_date": dev.identified_date.isoformat() if dev.identified_date else None,
            }
        )

    return alerts


@router.get("/milestones/upcoming", response_model=list[UpcomingMilestoneItem])
async def get_upcoming_milestones(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """Returns aggregated upcoming milestones across studies, ordered by planned date."""
    stmt = (
        select(StudyMilestone)
        .options(selectinload(StudyMilestone.study))
        .where(
            StudyMilestone.status.in_([MilestoneStatus.pending, MilestoneStatus.in_progress]),
            StudyMilestone.planned_date.is_not(None),
        )
        .order_by(StudyMilestone.planned_date.asc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    milestones = result.scalars().all()

    return [
        {
            "id": str(m.id),
            "study_id": str(m.study_id),
            "study_code": m.study.study_code if m.study else None,
            "title": m.title,
            "description": m.description,
            "status": m.status.value,
            "planned_date": m.planned_date.isoformat() if m.planned_date else None,
            "actual_date": m.actual_date.isoformat() if m.actual_date else None,
        }
        for m in milestones
    ]


@router.get("/enrollment/trend", response_model=list[EnrollmentTrendPoint])
async def get_enrollment_trend(
    study_id: uuid.UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    Computes cumulative and discrete participant enrollment trend timeseries
    from canonical participant enrollment dates.
    """
    stmt = (
        select(Participant.enrollment_date, func.count(Participant.id))
        .where(
            Participant.enrollment_date.is_not(None),
            Participant.status.in_(
                [
                    ParticipantStatus.enrolled,
                    ParticipantStatus.active,
                    ParticipantStatus.completed,
                ]
            ),
        )
    )
    if study_id:
        stmt = stmt.where(Participant.study_id == study_id)

    stmt = stmt.group_by(Participant.enrollment_date).order_by(Participant.enrollment_date.asc())
    result = await db.execute(stmt)
    rows = result.all()

    cumulative = 0
    trend: list[dict[str, Any]] = []
    for enr_date, count in rows:
        cumulative += count
        trend.append(
            {
                "date": enr_date.isoformat() if enr_date else None,
                "enrolled_count": count,
                "cumulative_count": cumulative,
            }
        )

    return trend


@router.get("/studies/{study_id}/enrollment/by-site", response_model=list[SiteEnrollmentItem])
async def get_enrollment_by_site(
    study_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    Computes recruitment progress, planned target vs actual enrolled count,
    broken down per site for the specified study.
    """
    study = await db.get(Study, study_id)
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    # Fetch study sites with site details
    stmt = (
        select(StudySite)
        .options(selectinload(StudySite.site))
        .where(StudySite.study_id == study_id)
    )
    result = await db.execute(stmt)
    study_sites = result.scalars().all()

    breakdown: list[dict[str, Any]] = []
    for ss in study_sites:
        enr_stmt = select(func.count(Participant.id)).where(
            Participant.study_id == study_id,
            Participant.site_id == ss.site_id,
            Participant.status.in_(
                [
                    ParticipantStatus.enrolled,
                    ParticipantStatus.active,
                    ParticipantStatus.completed,
                ]
            ),
        )
        enr_res = await db.execute(enr_stmt)
        actual = enr_res.scalar() or 0
        target = ss.recruitment_target or 0
        pct = round((actual / target * 100), 1) if target > 0 else 0.0

        breakdown.append(
            {
                "site_id": str(ss.site_id),
                "site_code": ss.site.site_code if ss.site else None,
                "site_name": ss.site.name if ss.site else None,
                "recruitment_target": target,
                "actual_enrolled": actual,
                "recruitment_percentage": pct,
                "activation_status": ss.activation_status.value,
            }
        )

    return breakdown


@router.get("/studies/{study_id}/metrics", response_model=StudyMetricsResponse)
async def get_study_metrics(
    study_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
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
