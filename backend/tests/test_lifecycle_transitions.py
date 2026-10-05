from __future__ import annotations

import datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.compliance import (
    CAPARecord,
    EthicsApproval,
    ProtocolDeviation,
    RegulatorySubmission,
)
from app.models.enums import (
    CAPAStatus,
    CAPAType,
    DeviationSeverity,
    DeviationStatus,
    ECStatus,
    OrganizationStatus,
    OrganizationType,
    RegulatoryStatus,
    SiteStatus,
    SiteType,
    StudyPhase,
    StudySiteActivationStatus,
    StudyStatus,
    StudyType,
)
from app.models.organization import Organization
from app.models.site import Site, StudySite
from app.models.study import Study


@pytest.mark.asyncio
async def test_study_site_activation_lifecycle(auth_client: AsyncClient, db_session: AsyncSession):
    # Setup organization, study, site, and assignment
    org = Organization(name="Sponsor Org", organization_type=OrganizationType.sponsor, status=OrganizationStatus.active)
    site = Site(site_code="SITE-TR-01", name="Trial Hospital", site_type=SiteType.hospital, status=SiteStatus.active)
    db_session.add_all([org, site])
    await db_session.flush()

    study = Study(
        study_code="SITE-LIFECYCLE-01",
        protocol_number="PRT-SITE-01",
        title="Site Lifecycle Test",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_1,
        status=StudyStatus.active,
        sponsor_org_id=org.id,
        therapeutic_area="General Medicine",
    )
    db_session.add(study)
    await db_session.flush()

    ss = StudySite(
        study_id=study.id,
        site_id=site.id,
        activation_status=StudySiteActivationStatus.planned,
        recruitment_target=100,
    )
    db_session.add(ss)
    await db_session.commit()

    url = f"/api/v1/studies/{study.id}/sites/{site.id}/transition"

    # 1. Invalid jump: planned -> activated must fail
    res = await auth_client.post(url, json={"new_status": "activated"})
    assert res.status_code == 400
    assert "Invalid transition" in res.json()["detail"]

    # 2. Valid transition: planned -> initiated
    res = await auth_client.post(url, json={"new_status": "initiated", "reason": "SIV completed"})
    assert res.status_code == 200
    assert res.json()["activation_status"] == "initiated"

    # 3. Valid transition: initiated -> activated
    res = await auth_client.post(url, json={"new_status": "activated", "reason": "All approvals in place"})
    assert res.status_code == 200
    assert res.json()["activation_status"] == "activated"

    # 4. Valid transition: activated -> suspended
    res = await auth_client.post(url, json={"new_status": "suspended", "reason": "Audit hold"})
    assert res.status_code == 200
    assert res.json()["activation_status"] == "suspended"

    # 5. Valid transition: suspended -> activated
    res = await auth_client.post(url, json={"new_status": "activated", "reason": "Hold cleared"})
    assert res.status_code == 200
    assert res.json()["activation_status"] == "activated"

    # 6. Valid transition: activated -> closed
    res = await auth_client.post(url, json={"new_status": "closed", "reason": "Study conduct complete"})
    assert res.status_code == 200
    assert res.json()["activation_status"] == "closed"


@pytest.mark.asyncio
async def test_ethics_approval_lifecycle(auth_client: AsyncClient, db_session: AsyncSession):
    org = Organization(name="EC Test Sponsor", organization_type=OrganizationType.sponsor, status=OrganizationStatus.active)
    db_session.add(org)
    await db_session.flush()

    study = Study(
        study_code="EC-TR-01",
        protocol_number="PRT-EC-01",
        title="Ethics Approval Lifecycle Trial",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        status=StudyStatus.active,
        sponsor_org_id=org.id,
        therapeutic_area="Neurology",
    )
    db_session.add(study)
    await db_session.flush()

    ec = EthicsApproval(
        study_id=study.id,
        committee_name="AIIA Institutional Ethics Committee",
        status=ECStatus.not_submitted,
    )
    db_session.add(ec)
    await db_session.commit()

    url = f"/api/v1/compliance/ethics/{ec.id}/transition"

    # Invalid jump: not_submitted -> approved
    res = await auth_client.post(url, json={"new_status": "approved"})
    assert res.status_code == 400

    # Valid: not_submitted -> pending
    res = await auth_client.post(url, json={"new_status": "pending"})
    assert res.status_code == 200
    assert res.json()["status"] == "pending"

    # Valid: pending -> approved
    res = await auth_client.post(url, json={"new_status": "approved", "reason": "Formal approval granted"})
    assert res.status_code == 200
    assert res.json()["status"] == "approved"
    assert res.json()["approval_date"] is not None

    # Valid: approved -> expired
    res = await auth_client.post(url, json={"new_status": "expired"})
    assert res.status_code == 200
    assert res.json()["status"] == "expired"


@pytest.mark.asyncio
async def test_regulatory_submission_lifecycle(auth_client: AsyncClient, db_session: AsyncSession):
    org = Organization(name="Reg Test Sponsor", organization_type=OrganizationType.sponsor, status=OrganizationStatus.active)
    db_session.add(org)
    await db_session.flush()

    study = Study(
        study_code="REG-TR-01",
        protocol_number="PRT-REG-01",
        title="Regulatory Lifecycle Trial",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_3,
        status=StudyStatus.active,
        sponsor_org_id=org.id,
        therapeutic_area="Cardiology",
    )
    db_session.add(study)
    await db_session.flush()

    sub = RegulatorySubmission(
        study_id=study.id,
        submission_type="Clinical Trial NOC Application",
        authority="CDSCO",
        status=RegulatoryStatus.not_submitted,
    )
    db_session.add(sub)
    await db_session.commit()

    url = f"/api/v1/compliance/regulatory/{sub.id}/transition"

    # Invalid jump: not_submitted -> approved
    res = await auth_client.post(url, json={"new_status": "approved"})
    assert res.status_code == 400

    # Valid: not_submitted -> pending
    res = await auth_client.post(url, json={"new_status": "pending"})
    assert res.status_code == 200
    assert res.json()["status"] == "pending"

    # Valid: pending -> approved
    res = await auth_client.post(url, json={"new_status": "approved", "reason": "CDSCO NOC granted"})
    assert res.status_code == 200
    assert res.json()["status"] == "approved"
    assert res.json()["approval_date"] is not None


@pytest.mark.asyncio
async def test_protocol_deviation_lifecycle(auth_client: AsyncClient, db_session: AsyncSession):
    org = Organization(name="Dev Test Sponsor", organization_type=OrganizationType.sponsor, status=OrganizationStatus.active)
    db_session.add(org)
    await db_session.flush()

    study = Study(
        study_code="DEV-TR-01",
        protocol_number="PRT-DEV-01",
        title="Deviation Lifecycle Trial",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        status=StudyStatus.active,
        sponsor_org_id=org.id,
        therapeutic_area="Immunology",
    )
    db_session.add(study)
    await db_session.flush()

    dev = ProtocolDeviation(
        study_id=study.id,
        category="Visit Window Deviation",
        description="Visit conducted 3 days outside allowed protocol window",
        severity=DeviationSeverity.minor,
        status=DeviationStatus.identified,
        identified_date=datetime.date.today(),
    )
    db_session.add(dev)
    await db_session.commit()

    url = f"/api/v1/compliance/deviations/{dev.id}/transition"

    # Invalid jump: identified -> resolved
    res = await auth_client.post(url, json={"new_status": "resolved"})
    assert res.status_code == 400

    # Valid: identified -> reported
    res = await auth_client.post(url, json={"new_status": "reported"})
    assert res.status_code == 200
    assert res.json()["status"] == "reported"

    # Valid: reported -> resolved
    res = await auth_client.post(url, json={"new_status": "resolved", "reason": "Patient returned to schedule"})
    assert res.status_code == 200
    assert res.json()["status"] == "resolved"
    assert res.json()["resolution_date"] is not None


@pytest.mark.asyncio
async def test_capa_lifecycle(auth_client: AsyncClient, db_session: AsyncSession):
    org = Organization(name="CAPA Test Sponsor", organization_type=OrganizationType.sponsor, status=OrganizationStatus.active)
    db_session.add(org)
    await db_session.flush()

    study = Study(
        study_code="CAPA-TR-01",
        protocol_number="PRT-CAPA-01",
        title="CAPA Lifecycle Trial",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        status=StudyStatus.active,
        sponsor_org_id=org.id,
        therapeutic_area="Respiratory",
    )
    db_session.add(study)
    await db_session.flush()

    capa = CAPARecord(
        study_id=study.id,
        capa_type=CAPAType.corrective,
        description="Retrain clinical site staff on IP temperature logging",
        status=CAPAStatus.open,
    )
    db_session.add(capa)
    await db_session.commit()

    url = f"/api/v1/compliance/capa/{capa.id}/transition"

    # Invalid jump: open -> verified
    res = await auth_client.post(url, json={"new_status": "verified"})
    assert res.status_code == 400

    # Valid: open -> in_progress
    res = await auth_client.post(url, json={"new_status": "in_progress"})
    assert res.status_code == 200
    assert res.json()["status"] == "in_progress"

    # Valid: in_progress -> completed
    res = await auth_client.post(url, json={"new_status": "completed", "reason": "Training session executed"})
    assert res.status_code == 200
    assert res.json()["status"] == "completed"
    assert res.json()["completed_date"] is not None

    # Valid: completed -> verified
    res = await auth_client.post(url, json={"new_status": "verified", "reason": "Log sheets inspected and compliant"})
    assert res.status_code == 200
    assert res.json()["status"] == "verified"
