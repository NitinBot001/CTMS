from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.rbac import (
    get_user_accessible_site_ids,
    get_user_accessible_study_ids,
    resolve_user_role,
)
from app.models.enums import (
    AEStatus,
    AssignmentStatus,
    MilestoneStatus,
    OnboardingRequestStatus,
    OrganizationType,
    ParticipantStatus,
    ParticipationDecisionStatus,
    SiteParticipationStatus,
    StudySiteActivationStatus,
)
from app.models.organization import Organization, OrganizationMember
from app.models.participant import Participant
from app.models.platform import SiteParticipationRequest, TeamMemberVerificationRequest
from app.models.safety import AdverseEvent
from app.models.site import Site, StudySite
from app.models.study import Study
from app.models.user import User
from app.schemas.dashboard import (
    CRODashboardResponse,
    CROSiteRequestItem,
    CROStudyItem,
    DashboardSummaryResponse,
    ResearchPIDashboardResponse,
    ResearchPIStudyItem,
    SiteIncomingRequestItem,
    SitePIDashboardResponse,
    SuperAdminOrgItem,
    SuperAdminOverviewResponse,
    SuperAdminStudyItem,
)

router = APIRouter(prefix="/dashboard", tags=["Role Dashboards"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardSummaryResponse:
    """
    Returns role-tailored dashboard telemetry and data strictly scoped to the authenticated user.
    Prevents unauthorized global aggregate leakage by dispatching to role-specific builders.
    """
    role = await resolve_user_role(current_user, db)

    if role == "super_admin":
        overview = await _build_super_admin_overview(db)
        return DashboardSummaryResponse(role="super_admin", super_admin=overview)

    if role == "research_pi":
        res_pi = await _build_research_pi_dashboard(current_user, db)
        return DashboardSummaryResponse(role="research_pi", research_pi=res_pi)

    if role == "cro":
        cro_data = await _build_cro_dashboard(current_user, db)
        return DashboardSummaryResponse(role="cro", cro=cro_data)

    if role == "site_pi":
        site_data = await _build_site_pi_dashboard(current_user, db)
        return DashboardSummaryResponse(role="site_pi", site_pi=site_data)

    return DashboardSummaryResponse(role="unassigned")


async def _build_super_admin_overview(db: AsyncSession) -> SuperAdminOverviewResponse:
    # 1. Sponsors and CROs
    org_stmt = select(Organization).where(
        Organization.organization_type.in_([OrganizationType.sponsor, OrganizationType.cro])
    )
    all_orgs = (await db.execute(org_stmt)).scalars().all()

    # Pre-count studies per org
    study_counts_stmt = select(Study.sponsor_org_id, func.count(Study.id)).group_by(Study.sponsor_org_id)
    sponsor_counts = dict((await db.execute(study_counts_stmt)).all())

    cro_counts_stmt = select(Study.cro_org_id, func.count(Study.id)).where(Study.cro_org_id.is_not(None)).group_by(Study.cro_org_id)
    cro_counts = dict((await db.execute(cro_counts_stmt)).all())

    sponsors: list[SuperAdminOrgItem] = []
    cros: list[SuperAdminOrgItem] = []

    for org in all_orgs:
        if org.organization_type == OrganizationType.sponsor:
            sponsors.append(
                SuperAdminOrgItem(
                    id=org.id,
                    name=org.name,
                    organization_type=org.organization_type.value,
                    registration_number=org.registration_number,
                    status=org.status.value,
                    city=org.city,
                    state=org.state,
                    studies_count=sponsor_counts.get(org.id, 0),
                )
            )
        elif org.organization_type == OrganizationType.cro:
            cros.append(
                SuperAdminOrgItem(
                    id=org.id,
                    name=org.name,
                    organization_type=org.organization_type.value,
                    registration_number=org.registration_number,
                    status=org.status.value,
                    city=org.city,
                    state=org.state,
                    studies_count=cro_counts.get(org.id, 0),
                )
            )

    # 2. Studies overview
    studies_stmt = (
        select(Study)
        .options(
            selectinload(Study.sponsor_org),
            selectinload(Study.cro_org),
            selectinload(Study.study_sites),
            selectinload(Study.participants),
            selectinload(Study.milestones),
        )
        .order_by(Study.created_at.desc())
    )
    studies_res = (await db.execute(studies_stmt)).scalars().all()

    study_items: list[SuperAdminStudyItem] = []
    for s in studies_res:
        active_sites = sum(
            1 for ss in s.study_sites if ss.activation_status == StudySiteActivationStatus.activated
        )
        participant_counts: dict[str, int] = {}
        for p in s.participants:
            st = p.status.value
            participant_counts[st] = participant_counts.get(st, 0) + 1

        pending_m = sum(1 for m in s.milestones if m.status == MilestoneStatus.pending)
        completed_m = sum(1 for m in s.milestones if m.status == MilestoneStatus.completed)

        study_items.append(
            SuperAdminStudyItem(
                id=s.id,
                study_code=s.study_code,
                protocol_number=s.protocol_number,
                title=s.title,
                phase=s.phase.value,
                status=s.status.value,
                sponsor_name=s.sponsor_org.name if s.sponsor_org else None,
                cro_name=s.cro_org.name if s.cro_org else None,
                participating_sites_count=active_sites,
                participant_count=len(s.participants),
                participant_status_distribution=participant_counts,
                pending_milestones_count=pending_m,
                completed_milestones_count=completed_m,
            )
        )

    return SuperAdminOverviewResponse(
        is_read_only=True,
        total_sponsors=len(sponsors),
        total_cros=len(cros),
        total_studies=len(study_items),
        sponsors=sponsors,
        cros=cros,
        studies=study_items,
    )


async def _build_research_pi_dashboard(user: User, db: AsyncSession) -> ResearchPIDashboardResponse:
    accessible_ids = await get_user_accessible_study_ids(user, db)

    studies_stmt = (
        select(Study)
        .options(
            selectinload(Study.study_sites),
            selectinload(Study.participants),
            selectinload(Study.milestones),
        )
    )
    if accessible_ids is not None:
        studies_stmt = studies_stmt.where(Study.id.in_(accessible_ids))

    studies = (await db.execute(studies_stmt)).scalars().all()

    study_items: list[ResearchPIStudyItem] = []
    active_sites_set: set[uuid.UUID] = set()
    upcoming_milestones: list[dict[str, Any]] = []

    for s in studies:
        act_count = 0
        for ss in s.study_sites:
            if ss.activation_status == StudySiteActivationStatus.activated:
                act_count += 1
                active_sites_set.add(ss.site_id)

        enrolled_count = sum(
            1 for p in s.participants if p.status in [ParticipantStatus.enrolled, ParticipantStatus.active, ParticipantStatus.completed]
        )
        pending_m = sum(1 for m in s.milestones if m.status != MilestoneStatus.completed)

        for m in s.milestones:
            if m.status != MilestoneStatus.completed:
                upcoming_milestones.append({
                    "id": str(m.id),
                    "study_id": str(s.id),
                    "study_code": s.study_code,
                    "title": m.title,
                    "target_date": m.planned_date.isoformat() if m.planned_date else None,
                    "status": m.status.value,
                })

        study_items.append(
            ResearchPIStudyItem(
                id=s.id,
                study_code=s.study_code,
                protocol_number=s.protocol_number,
                title=s.title,
                phase=s.phase.value,
                status=s.status.value,
                active_sites_count=act_count,
                enrolled_participants=enrolled_count,
                planned_sample_size=s.planned_sample_size,
                pending_milestones=pending_m,
            )
        )

    # Sort upcoming milestones by target_date
    upcoming_milestones.sort(key=lambda x: x["target_date"] or "9999-99-99")

    # Pending team verification requests
    study_id_list = [s.id for s in studies]
    pending_invites = 0
    if study_id_list:
        invites_stmt = select(func.count(TeamMemberVerificationRequest.id)).where(
            TeamMemberVerificationRequest.study_id.in_(study_id_list),
            TeamMemberVerificationRequest.status == OnboardingRequestStatus.pending,
        )
        pending_invites = (await db.execute(invites_stmt)).scalar() or 0

    return ResearchPIDashboardResponse(
        studies=study_items,
        active_sites_count=len(active_sites_set),
        pending_team_invitations=pending_invites,
        upcoming_milestones=upcoming_milestones[:10],
    )


async def _build_cro_dashboard(user: User, db: AsyncSession) -> CRODashboardResponse:
    accessible_ids = await get_user_accessible_study_ids(user, db)

    studies_stmt = (
        select(Study)
        .options(
            selectinload(Study.sponsor_org),
            selectinload(Study.study_sites),
            selectinload(Study.participants),
        )
    )
    if accessible_ids is not None:
        studies_stmt = studies_stmt.where(Study.id.in_(accessible_ids))

    studies = (await db.execute(studies_stmt)).scalars().all()
    study_id_list = [s.id for s in studies]

    study_items: list[CROStudyItem] = []
    total_participants = 0

    for s in studies:
        act_count = sum(
            1 for ss in s.study_sites if ss.activation_status == StudySiteActivationStatus.activated
        )
        enrolled_count = sum(
            1 for p in s.participants if p.status in [ParticipantStatus.enrolled, ParticipantStatus.active, ParticipantStatus.completed]
        )
        total_participants += len(s.participants)

        study_items.append(
            CROStudyItem(
                id=s.id,
                study_code=s.study_code,
                protocol_number=s.protocol_number,
                title=s.title,
                phase=s.phase.value,
                status=s.status.value,
                sponsor_name=s.sponsor_org.name if s.sponsor_org else None,
                active_sites_count=act_count,
                enrolled_participants=enrolled_count,
                planned_sample_size=s.planned_sample_size,
            )
        )

    # Eligible registered clinical sites count
    eligible_sites_count = (await db.execute(select(func.count(Site.id)).where(Site.status == "active"))).scalar() or 0

    # Recent site participation requests
    recent_requests: list[CROSiteRequestItem] = []
    pending_site_requests_count = 0
    if study_id_list:
        req_stmt = (
            select(SiteParticipationRequest)
            .options(
                selectinload(SiteParticipationRequest.study),
                selectinload(SiteParticipationRequest.site),
            )
            .where(SiteParticipationRequest.study_id.in_(study_id_list))
            .order_by(SiteParticipationRequest.created_at.desc())
        )
        all_reqs = (await db.execute(req_stmt)).scalars().all()
        pending_site_requests_count = sum(
            1 for r in all_reqs if r.status in [
                SiteParticipationStatus.requested,
                SiteParticipationStatus.pending_government_verification,
                SiteParticipationStatus.pending_site_confirmation,
            ]
        )

        for r in all_reqs[:15]:
            recent_requests.append(
                CROSiteRequestItem(
                    id=r.id,
                    study_id=r.study_id,
                    study_title=r.study.title if r.study else "Unknown Study",
                    site_id=r.site_id,
                    site_name=r.site.name if r.site else "Unknown Site",
                    site_code=r.site.site_code if r.site else "N/A",
                    government_status=r.government_status.value,
                    site_status=r.site_status.value,
                    status=r.status.value,
                    created_at=r.created_at,
                )
            )

    return CRODashboardResponse(
        studies=study_items,
        eligible_sites_count=eligible_sites_count,
        pending_site_requests_count=pending_site_requests_count,
        total_participants_in_scope=total_participants,
        recent_site_requests=recent_requests,
    )


async def _build_site_pi_dashboard(user: User, db: AsyncSession) -> SitePIDashboardResponse:
    accessible_site_ids = await get_user_accessible_site_ids(user, db)

    # Select primary site
    primary_site: Site | None = None
    if accessible_site_ids:
        first_id = next(iter(accessible_site_ids))
        primary_site = await db.get(Site, first_id)
    else:
        # Fallback to any site linked to user's org
        stmt_m = select(OrganizationMember.organization_id).where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.status == AssignmentStatus.active,
        )
        org_ids = (await db.execute(stmt_m)).scalars().all()
        if org_ids:
            primary_site = (await db.execute(select(Site).where(Site.organization_id.in_(org_ids)))).scalars().first()

    if not primary_site:
        return SitePIDashboardResponse(
            active_studies_count=0,
            pending_requests_count=0,
            participants_count=0,
            open_safety_events=0,
            incoming_requests=[],
        )

    # Active studies at this site
    active_studies_stmt = select(func.count(StudySite.id)).where(
        StudySite.site_id == primary_site.id,
        StudySite.activation_status == StudySiteActivationStatus.activated,
    )
    active_studies_count = (await db.execute(active_studies_stmt)).scalar() or 0

    # Participants at this site
    participants_stmt = select(func.count(Participant.id)).where(Participant.site_id == primary_site.id)
    participants_count = (await db.execute(participants_stmt)).scalar() or 0

    # Open safety events at this site
    open_ae_stmt = select(func.count(AdverseEvent.id)).where(
        AdverseEvent.site_id == primary_site.id,
        AdverseEvent.status == AEStatus.open,
    )
    open_safety = (await db.execute(open_ae_stmt)).scalar() or 0

    # Incoming study participation requests pending site PI confirmation
    req_stmt = (
        select(SiteParticipationRequest)
        .options(
            selectinload(SiteParticipationRequest.study),
            selectinload(SiteParticipationRequest.requested_by),
        )
        .where(
            SiteParticipationRequest.site_id == primary_site.id,
        )
        .order_by(SiteParticipationRequest.created_at.desc())
    )
    all_site_reqs = (await db.execute(req_stmt)).scalars().all()
    pending_count = sum(1 for r in all_site_reqs if r.site_status == ParticipationDecisionStatus.pending)

    incoming: list[SiteIncomingRequestItem] = []
    for r in all_site_reqs:
        incoming.append(
            SiteIncomingRequestItem(
                id=r.id,
                study_id=r.study_id,
                study_title=r.study.title if r.study else "Unknown",
                study_code=r.study.study_code if r.study else "N/A",
                requester_name=r.requested_by.full_name if r.requested_by else "Unknown",
                government_status=r.government_status.value,
                site_status=r.site_status.value,
                status=r.status.value,
                created_at=r.created_at,
            )
        )

    return SitePIDashboardResponse(
        site_id=primary_site.id,
        site_name=primary_site.name,
        site_code=primary_site.site_code,
        city=primary_site.city,
        active_studies_count=active_studies_count,
        pending_requests_count=pending_count,
        participants_count=participants_count,
        open_safety_events=open_safety,
        incoming_requests=incoming,
    )
