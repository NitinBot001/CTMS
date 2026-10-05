from __future__ import annotations

import datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import (
    OrganizationStatus,
    OrganizationType,
    ParticipantStatus,
    SiteStatus,
    SiteType,
    StudyPhase,
    StudySiteActivationStatus,
    StudyStatus,
    StudyType,
)
from app.models.organization import Organization
from app.models.participant import Participant
from app.models.site import Site, StudySite
from app.models.study import Study


@pytest.mark.asyncio
async def test_portfolio_derived_kpis(client: AsyncClient, db_session: AsyncSession):
    # Setup Sponsor
    sponsor = Organization(
        name="Global Ayush Research",
        organization_type=OrganizationType.sponsor,
        status=OrganizationStatus.active,
    )
    db_session.add(sponsor)
    await db_session.flush()

    # Create 2 Studies: 1 active, 1 planned, 1 delayed
    yesterday = datetime.date.today() - datetime.timedelta(days=1)
    study1 = Study(
        study_code="PORT-001",
        protocol_number="PRT-P1",
        title="Active On-Time Study",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_3,
        sponsor_org_id=sponsor.id,
        therapeutic_area="Metabolism",
        status=StudyStatus.active,
        planned_sample_size=100,
        end_date=datetime.date.today() + datetime.timedelta(days=90),
    )
    study2 = Study(
        study_code="PORT-002",
        protocol_number="PRT-P2",
        title="Delayed Study Past End Date",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        sponsor_org_id=sponsor.id,
        therapeutic_area="Cardiology",
        status=StudyStatus.active,
        planned_sample_size=50,
        end_date=yesterday,  # Past end date!
    )
    study3 = Study(
        study_code="PORT-003",
        protocol_number="PRT-P3",
        title="Planned Study",
        study_type=StudyType.observational,
        phase=StudyPhase.na,
        sponsor_org_id=sponsor.id,
        therapeutic_area="Epidemiology",
        status=StudyStatus.planned,
    )
    db_session.add_all([study1, study2, study3])
    await db_session.flush()

    # Create Site & Associate with Study 1
    site = Site(
        site_code="SITE-P-01",
        name="Trial Hub Mumbai",
        site_type=SiteType.hospital,
        status=SiteStatus.active,
    )
    db_session.add(site)
    await db_session.flush()

    ss = StudySite(
        study_id=study1.id,
        site_id=site.id,
        activation_status=StudySiteActivationStatus.activated,
    )
    db_session.add(ss)

    # Create Participants for Study 1: 2 enrolled, 1 active, 1 screen failed
    p1 = Participant(
        participant_code="SUB-01", study_id=study1.id, status=ParticipantStatus.enrolled
    )
    p2 = Participant(participant_code="SUB-02", study_id=study1.id, status=ParticipantStatus.active)
    p3 = Participant(
        participant_code="SUB-03", study_id=study1.id, status=ParticipantStatus.screen_failed
    )
    db_session.add_all([p1, p2, p3])
    await db_session.commit()

    # Call Portfolio Overview API
    res = await client.get("/api/v1/portfolio/overview")
    assert res.status_code == 200
    data = res.json()

    assert data["studies"]["total"] == 3
    assert data["studies"]["active"] == 2
    assert data["studies"]["planned"] == 1
    assert data["studies"]["delayed"] == 1  # study2 is delayed!

    assert data["sites"]["total_registered"] == 1
    assert data["sites"]["currently_activated"] == 1

    assert data["participants"]["total_screened"] == 3
    assert data["participants"]["actual_enrolled"] == 2  # p1 + p2
    assert data["participants"]["screen_failures"] == 1  # p3

    # Call Study Metrics API for Study 1
    res_study = await client.get(f"/api/v1/portfolio/studies/{study1.id}/metrics")
    assert res_study.status_code == 200
    sdata = res_study.json()

    assert sdata["recruitment"]["planned_sample_size"] == 100
    assert sdata["recruitment"]["actual_enrolled"] == 2
    assert sdata["recruitment"]["recruitment_percentage"] == 2.0
    assert sdata["is_delayed"] is False

    # Check delayed study metrics
    res_study2 = await client.get(f"/api/v1/portfolio/studies/{study2.id}/metrics")
    assert res_study2.status_code == 200
    assert res_study2.json()["is_delayed"] is True
