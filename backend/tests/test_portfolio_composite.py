from __future__ import annotations

import datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.compliance import (
    ProtocolDeviation,
)
from app.models.enums import (
    AdverseEventType,
    AEStatus,
    DeviationSeverity,
    DeviationStatus,
    MilestoneStatus,
    OrganizationStatus,
    OrganizationType,
    ParticipantStatus,
    Seriousness,
    Severity,
    SiteStatus,
    SiteType,
    StudyPhase,
    StudySiteActivationStatus,
    StudyStatus,
    StudyType,
)
from app.models.organization import Organization
from app.models.participant import Participant
from app.models.progress import StudyMilestone
from app.models.safety import AdverseEvent
from app.models.site import Site, StudySite
from app.models.study import Study


@pytest.mark.asyncio
async def test_portfolio_health_and_alerts(auth_client: AsyncClient, db_session: AsyncSession):
    today = datetime.date.today()
    org = Organization(name="Health Test Org", organization_type=OrganizationType.sponsor, status=OrganizationStatus.active)
    db_session.add(org)
    await db_session.flush()

    study = Study(
        study_code="PORT-HEALTH-01",
        protocol_number="PRT-HEALTH-01",
        title="Portfolio Health Trial",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        status=StudyStatus.active,
        sponsor_org_id=org.id,
        therapeutic_area="Ayurveda",
    )
    db_session.add(study)
    await db_session.flush()

    participant = Participant(
        study_id=study.id,
        participant_code="P-HEALTH-01",
        status=ParticipantStatus.enrolled,
        enrollment_date=today,
    )
    db_session.add(participant)
    await db_session.flush()

    # Initial state: clean -> Green health
    res = await auth_client.get("/api/v1/portfolio/health")
    assert res.status_code == 200
    health_data = res.json()
    assert health_data["status"] == "Green"
    assert health_data["risk_level"] == "Low"

    # Add open SAE
    sae = AdverseEvent(
        study_id=study.id,
        participant_id=participant.id,
        event_type=AdverseEventType.sae,
        description="Severe hepatic enzyme elevation",
        seriousness=Seriousness.serious,
        severity=Severity.severe,
        status=AEStatus.open,
        onset_date=today,
    )
    db_session.add(sae)
    await db_session.commit()

    # Health status should now be Amber
    res = await auth_client.get("/api/v1/portfolio/health")
    assert res.status_code == 200
    assert res.json()["status"] == "Amber"

    # Add critical unresolved deviation -> turns health to Red
    crit_dev = ProtocolDeviation(
        study_id=study.id,
        category="Informed Consent Violation",
        description="Patient dosed without signed consent document",
        severity=DeviationSeverity.critical,
        status=DeviationStatus.identified,
        identified_date=today,
    )
    db_session.add(crit_dev)
    await db_session.commit()

    res = await auth_client.get("/api/v1/portfolio/health")
    assert res.status_code == 200
    assert res.json()["status"] == "Red"
    assert res.json()["risk_level"] == "High"

    # Test alerts aggregation
    alerts_res = await auth_client.get("/api/v1/portfolio/alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    alert_types = [a["type"] for a in alerts]
    assert "open_sae" in alert_types
    assert "critical_deviation" in alert_types


@pytest.mark.asyncio
async def test_portfolio_upcoming_milestones(auth_client: AsyncClient, db_session: AsyncSession):
    today = datetime.date.today()
    org = Organization(name="Milestone Sponsor", organization_type=OrganizationType.sponsor, status=OrganizationStatus.active)
    db_session.add(org)
    await db_session.flush()

    study = Study(
        study_code="PORT-MS-01",
        protocol_number="PRT-MS-01",
        title="Upcoming Milestones Trial",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_1,
        status=StudyStatus.active,
        sponsor_org_id=org.id,
        therapeutic_area="Neurology",
    )
    db_session.add(study)
    await db_session.flush()

    ms1 = StudyMilestone(
        study_id=study.id,
        title="First Patient In (FPI)",
        planned_date=today + datetime.timedelta(days=10),
        status=MilestoneStatus.pending,
    )
    ms2 = StudyMilestone(
        study_id=study.id,
        title="Interim Analysis Data Lock",
        planned_date=today + datetime.timedelta(days=60),
        status=MilestoneStatus.pending,
    )
    db_session.add_all([ms1, ms2])
    await db_session.commit()

    res = await auth_client.get("/api/v1/portfolio/milestones/upcoming")
    assert res.status_code == 200
    milestones = res.json()
    assert len(milestones) >= 2
    # Verify ordered by planned_date ascending
    assert milestones[0]["title"] == "First Patient In (FPI)"
    assert milestones[0]["study_code"] == "PORT-MS-01"


@pytest.mark.asyncio
async def test_portfolio_enrollment_trend_and_by_site(auth_client: AsyncClient, db_session: AsyncSession):
    today = datetime.date.today()
    org = Organization(name="Recruitment Sponsor", organization_type=OrganizationType.sponsor, status=OrganizationStatus.active)
    site1 = Site(site_code="SITE-REC-01", name="Site One Delhi", site_type=SiteType.hospital, status=SiteStatus.active)
    site2 = Site(site_code="SITE-REC-02", name="Site Two Mumbai", site_type=SiteType.hospital, status=SiteStatus.active)
    db_session.add_all([org, site1, site2])
    await db_session.flush()

    study = Study(
        study_code="PORT-REC-01",
        protocol_number="PRT-REC-01",
        title="Recruitment Breakdown Trial",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        status=StudyStatus.active,
        sponsor_org_id=org.id,
        planned_sample_size=100,
        therapeutic_area="Cardiology",
    )
    db_session.add(study)
    await db_session.flush()

    ss1 = StudySite(
        study_id=study.id,
        site_id=site1.id,
        recruitment_target=60,
        activation_status=StudySiteActivationStatus.activated,
    )
    ss2 = StudySite(
        study_id=study.id,
        site_id=site2.id,
        recruitment_target=40,
        activation_status=StudySiteActivationStatus.activated,
    )
    db_session.add_all([ss1, ss2])
    await db_session.flush()

    # Add participants
    p1 = Participant(
        study_id=study.id,
        site_id=site1.id,
        participant_code="P-REC-01",
        status=ParticipantStatus.enrolled,
        enrollment_date=today - datetime.timedelta(days=5),
    )
    p2 = Participant(
        study_id=study.id,
        site_id=site1.id,
        participant_code="P-REC-02",
        status=ParticipantStatus.active,
        enrollment_date=today - datetime.timedelta(days=2),
    )
    p3 = Participant(
        study_id=study.id,
        site_id=site2.id,
        participant_code="P-REC-03",
        status=ParticipantStatus.enrolled,
        enrollment_date=today,
    )
    db_session.add_all([p1, p2, p3])
    await db_session.commit()

    # 1. Enrollment trend
    trend_res = await auth_client.get(f"/api/v1/portfolio/enrollment/trend?study_id={study.id}")
    assert trend_res.status_code == 200
    trend_data = trend_res.json()
    assert len(trend_data) == 3
    assert trend_data[-1]["cumulative_count"] == 3

    # 2. Enrollment by site
    by_site_res = await auth_client.get(f"/api/v1/portfolio/studies/{study.id}/enrollment/by-site")
    assert by_site_res.status_code == 200
    by_site_data = by_site_res.json()
    assert len(by_site_data) == 2

    site1_stat = next(s for s in by_site_data if s["site_code"] == "SITE-REC-01")
    assert site1_stat["recruitment_target"] == 60
    assert site1_stat["actual_enrolled"] == 2
    assert site1_stat["recruitment_percentage"] == round(2 / 60 * 100, 1)

    site2_stat = next(s for s in by_site_data if s["site_code"] == "SITE-REC-02")
    assert site2_stat["recruitment_target"] == 40
    assert site2_stat["actual_enrolled"] == 1
    assert site2_stat["recruitment_percentage"] == round(1 / 40 * 100, 1)
