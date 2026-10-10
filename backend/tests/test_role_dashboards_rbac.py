
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.enums import (
    AssignmentStatus,
    OrganizationStatus,
    OrganizationType,
    ParticipantStatus,
    ScopeLevel,
    SiteStatus,
    SiteType,
    StudyPhase,
    StudySiteActivationStatus,
    StudyStatus,
    StudyType,
    UserStatus,
)
from app.models.organization import Organization, OrganizationMember
from app.models.participant import Participant
from app.models.site import Site, StudySite
from app.models.study import Study
from app.models.user import Role, SuperAdminProfile, User


@pytest_asyncio.fixture
async def super_admin(db_session: AsyncSession) -> tuple[User, str]:
    user = User(
        email="super.admin.dash@ayuctms.gov.in",
        full_name="Platform Super Admin",
        status=UserStatus.active,
        hashed_password=hash_password("SuperAdmin123!"),
    )
    db_session.add(user)
    await db_session.flush()
    profile = SuperAdminProfile(user_id=user.id, is_active=True)
    db_session.add(profile)
    await db_session.commit()
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return user, token


@pytest_asyncio.fixture
async def sponsor_pi(db_session: AsyncSession) -> tuple[User, Organization, str]:
    org = Organization(
        name="All India Ayurveda Institute",
        organization_type=OrganizationType.sponsor,
        status=OrganizationStatus.active,
        registration_number="AIIA-SPONSOR-01",
    )
    role = Role(
        name="Principal Investigator",
        scope_level=ScopeLevel.study,
        is_system_role=False,
    )
    user = User(
        email="pi.sharma@aiia.gov.in",
        full_name="Dr. Rajesh Sharma",
        status=UserStatus.active,
        hashed_password=hash_password("Password123!"),
    )
    db_session.add_all([org, role, user])
    await db_session.flush()

    membership = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role_id=role.id,
        status=AssignmentStatus.active,
    )
    db_session.add(membership)
    await db_session.commit()
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return user, org, token


@pytest_asyncio.fixture
async def cro_user(db_session: AsyncSession) -> tuple[User, Organization, str]:
    org = Organization(
        name="Vedic Clinical Trials CRO",
        organization_type=OrganizationType.cro,
        status=OrganizationStatus.active,
        registration_number="VEDIC-CRO-01",
    )
    role = Role(
        name="CRO Lead Monitor",
        scope_level=ScopeLevel.organization,
        is_system_role=False,
    )
    user = User(
        email="monitor.varma@vedictrials.com",
        full_name="Sunil Varma",
        status=UserStatus.active,
        hashed_password=hash_password("Password123!"),
    )
    db_session.add_all([org, role, user])
    await db_session.flush()

    membership = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role_id=role.id,
        status=AssignmentStatus.active,
    )
    db_session.add(membership)
    await db_session.commit()
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return user, org, token


@pytest_asyncio.fixture
async def site_pi(db_session: AsyncSession) -> tuple[User, Site, str]:
    org = Organization(
        name="Gujarat Ayurveda Hospital",
        organization_type=OrganizationType.institution,
        status=OrganizationStatus.active,
    )
    role = Role(
        name="Site Principal Investigator",
        scope_level=ScopeLevel.site,
        is_system_role=False,
    )
    user = User(
        email="dr.patel@gah.edu.in",
        full_name="Dr. Ananya Patel",
        status=UserStatus.active,
        hashed_password=hash_password("Password123!"),
    )
    db_session.add_all([org, role, user])
    await db_session.flush()

    site = Site(
        site_code="SITE-GAH-01",
        name="Gujarat Ayurveda Hospital Clinical Site",
        site_type=SiteType.hospital,
        status=SiteStatus.active,
        city="Jamnagar",
        state="Gujarat",
        organization_id=org.id,
    )
    db_session.add(site)
    await db_session.flush()

    membership = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role_id=role.id,
        status=AssignmentStatus.active,
    )
    db_session.add(membership)
    await db_session.commit()
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return user, site, token


@pytest.mark.asyncio
async def test_dashboard_summary_super_admin(
    client: AsyncClient,
    super_admin: tuple[User, str],
    sponsor_pi: tuple[User, Organization, str],
    cro_user: tuple[User, Organization, str],
):
    _, token = super_admin
    res = await client.get("/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "super_admin"
    assert data["super_admin"] is not None
    assert data["super_admin"]["is_read_only"] is True
    assert data["super_admin"]["total_sponsors"] >= 1
    assert data["super_admin"]["total_cros"] >= 1
    assert data["research_pi"] is None
    assert data["cro"] is None
    assert data["site_pi"] is None


@pytest.mark.asyncio
async def test_dashboard_summary_research_pi(
    client: AsyncClient,
    db_session: AsyncSession,
    sponsor_pi: tuple[User, Organization, str],
):
    user, org, token = sponsor_pi

    # Add a study for this sponsor
    study = Study(
        study_code="PI-TRIAL-01",
        protocol_number="PRT-PI-01",
        title="Ashwagandha Cognitive Trial",
        therapeutic_area="Ayurveda",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        status=StudyStatus.active,
        sponsor_org_id=org.id,
        planned_sample_size=100,
    )
    db_session.add(study)
    await db_session.commit()

    res = await client.get("/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "research_pi"
    assert data["research_pi"] is not None
    assert len(data["research_pi"]["studies"]) >= 1
    assert data["research_pi"]["studies"][0]["study_code"] == "PI-TRIAL-01"
    assert data["super_admin"] is None
    assert data["cro"] is None
    assert data["site_pi"] is None


@pytest.mark.asyncio
async def test_dashboard_summary_cro(
    client: AsyncClient,
    db_session: AsyncSession,
    cro_user: tuple[User, Organization, str],
    sponsor_pi: tuple[User, Organization, str],
):
    user, cro_org, token = cro_user
    _, sponsor_org, _ = sponsor_pi

    # Add a study managed by this CRO
    study = Study(
        study_code="CRO-TRIAL-01",
        protocol_number="PRT-CRO-01",
        title="Brahmi Neuroprotection Study",
        therapeutic_area="Ayurveda",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_3,
        status=StudyStatus.active,
        sponsor_org_id=sponsor_org.id,
        cro_org_id=cro_org.id,
        planned_sample_size=150,
    )
    db_session.add(study)
    await db_session.commit()

    res = await client.get("/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "cro"
    assert data["cro"] is not None
    assert len(data["cro"]["studies"]) >= 1
    assert data["cro"]["studies"][0]["study_code"] == "CRO-TRIAL-01"
    assert data["super_admin"] is None
    assert data["research_pi"] is None
    assert data["site_pi"] is None


@pytest.mark.asyncio
async def test_dashboard_summary_site_pi(
    client: AsyncClient,
    site_pi: tuple[User, Site, str],
):
    user, site, token = site_pi

    res = await client.get("/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "site_pi"
    assert data["site_pi"] is not None
    assert data["site_pi"]["site_id"] == str(site.id)
    assert data["site_pi"]["site_code"] == "SITE-GAH-01"
    assert data["super_admin"] is None
    assert data["cro"] is None
    assert data["research_pi"] is None


@pytest.mark.asyncio
async def test_dashboard_summary_unassigned(client: AsyncClient, db_session: AsyncSession):
    user = User(
        email="unassigned.user@example.com",
        full_name="Unassigned User",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(user)
    await db_session.commit()
    token = create_access_token({"sub": str(user.id), "email": user.email})

    res = await client.get("/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "unassigned"
    assert data["super_admin"] is None
    assert data["research_pi"] is None
    assert data["cro"] is None
    assert data["site_pi"] is None


@pytest.mark.asyncio
async def test_portfolio_global_analytics_403_for_non_admin(
    client: AsyncClient,
    cro_user: tuple[User, Organization, str],
):
    _, _, token = cro_user
    # Ordinary CRO user attempting to access global platform analytics
    res_overview = await client.get("/api/v1/portfolio/overview", headers={"Authorization": f"Bearer {token}"})
    assert res_overview.status_code == 403

    res_health = await client.get("/api/v1/portfolio/health", headers={"Authorization": f"Bearer {token}"})
    assert res_health.status_code == 403

    res_alerts = await client.get("/api/v1/portfolio/alerts", headers={"Authorization": f"Bearer {token}"})
    assert res_alerts.status_code == 403


@pytest.mark.asyncio
async def test_cro_cannot_directly_add_study_site(
    client: AsyncClient,
    db_session: AsyncSession,
    cro_user: tuple[User, Organization, str],
    sponsor_pi: tuple[User, Organization, str],
    site_pi: tuple[User, Site, str],
):
    _, cro_org, cro_token = cro_user
    _, sponsor_org, _ = sponsor_pi
    _, site, _ = site_pi

    study = Study(
        study_code="CRO-BLOCK-01",
        protocol_number="PRT-BLK-01",
        title="Direct Site Block Test",
        therapeutic_area="Ayurveda",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_1,
        status=StudyStatus.active,
        sponsor_org_id=sponsor_org.id,
        cro_org_id=cro_org.id,
    )
    db_session.add(study)
    await db_session.commit()

    # CRO attempts POST /api/v1/studies/{study_id}/sites
    res = await client.post(
        f"/api/v1/studies/{study.id}/sites",
        json={"site_id": str(site.id), "recruitment_target": 25},
        headers={"Authorization": f"Bearer {cro_token}"},
    )
    assert res.status_code == 403
    assert "CRO personnel cannot directly assign sites" in res.json()["detail"]


@pytest.mark.asyncio
async def test_cro_can_discover_eligible_sites(
    client: AsyncClient,
    db_session: AsyncSession,
    cro_user: tuple[User, Organization, str],
    sponsor_pi: tuple[User, Organization, str],
    site_pi: tuple[User, Site, str],
):
    _, cro_org, cro_token = cro_user
    _, sponsor_org, _ = sponsor_pi
    _, site, _ = site_pi

    study = Study(
        study_code="DISCOVER-01",
        protocol_number="PRT-DISC-01",
        title="Site Discovery Test",
        therapeutic_area="Ayurveda",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        status=StudyStatus.active,
        sponsor_org_id=sponsor_org.id,
        cro_org_id=cro_org.id,
    )
    db_session.add(study)
    await db_session.commit()

    res = await client.get(
        f"/api/v1/studies/{study.id}/eligible-sites?q=Gujarat",
        headers={"Authorization": f"Bearer {cro_token}"},
    )
    assert res.status_code == 200
    sites = res.json()
    assert len(sites) >= 1
    match = next((s for s in sites if s["id"] == str(site.id)), None)
    assert match is not None
    assert match["is_assigned"] is False
    assert match["site_code"] == "SITE-GAH-01"


@pytest.mark.asyncio
async def test_participant_creation_requires_activated_site(
    client: AsyncClient,
    db_session: AsyncSession,
    super_admin: tuple[User, str],
    sponsor_pi: tuple[User, Organization, str],
    site_pi: tuple[User, Site, str],
):
    _, admin_token = super_admin
    _, sponsor_org, _ = sponsor_pi
    _, site, _ = site_pi

    study = Study(
        study_code="PT-VAL-01",
        protocol_number="PRT-PTVAL-01",
        title="Participant Validation Trial",
        therapeutic_area="Ayurveda",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        status=StudyStatus.active,
        sponsor_org_id=sponsor_org.id,
    )
    db_session.add(study)
    await db_session.commit()

    # 1. Attempt creating participant before site is assigned -> 400
    res = await client.post(
        "/api/v1/participants",
        json={
            "participant_code": "PT-UNASSIGNED-01",
            "study_id": str(study.id),
            "site_id": str(site.id),
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 400
    assert "not assigned" in res.json()["detail"]

    # 2. Assign site as planned (not yet activated) -> 400
    study_site = StudySite(
        study_id=study.id,
        site_id=site.id,
        activation_status=StudySiteActivationStatus.planned,
    )
    db_session.add(study_site)
    await db_session.commit()

    res_planned = await client.post(
        "/api/v1/participants",
        json={
            "participant_code": "PT-PLANNED-01",
            "study_id": str(study.id),
            "site_id": str(site.id),
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_planned.status_code == 400
    assert "planned" in res_planned.json()["detail"]

    # 3. Activate site -> 201
    study_site.activation_status = StudySiteActivationStatus.activated
    await db_session.commit()

    res_active = await client.post(
        "/api/v1/participants",
        json={
            "participant_code": "PT-ACTIVE-01",
            "study_id": str(study.id),
            "site_id": str(site.id),
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_active.status_code == 201
    assert res_active.json()["participant_code"] == "PT-ACTIVE-01"


@pytest.mark.asyncio
async def test_participant_bulk_import_protocol_validation(
    client: AsyncClient,
    db_session: AsyncSession,
    super_admin: tuple[User, str],
    sponsor_pi: tuple[User, Organization, str],
    site_pi: tuple[User, Site, str],
):
    _, admin_token = super_admin
    _, sponsor_org, _ = sponsor_pi
    _, site, _ = site_pi

    # Unactivated site
    inactive_site = Site(
        site_code="SITE-INACTIVE-01",
        name="Unassigned Health Center",
        site_type=SiteType.clinic,
        status=SiteStatus.active,
    )
    study = Study(
        study_code="BULK-TRIAL-01",
        protocol_number="PRT-BULK-01",
        title="Bulk Import Protocol Trial",
        therapeutic_area="Ayurveda",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_3,
        status=StudyStatus.active,
        sponsor_org_id=sponsor_org.id,
    )
    db_session.add_all([inactive_site, study])
    await db_session.flush()

    study_site = StudySite(
        study_id=study.id,
        site_id=site.id,
        activation_status=StudySiteActivationStatus.activated,
    )
    db_session.add(study_site)
    await db_session.commit()

    # Bulk import payload with:
    # row 1: valid
    # row 2: invalid site (not activated)
    # row 3: duplicate code (same as row 1)
    payload = {
        "study_id": str(study.id),
        "participants": [
            {
                "participant_code": "BULK-001",
                "site_id": str(site.id),
                "screening_date": "2026-10-01",
            },
            {
                "participant_code": "BULK-002",
                "site_id": str(inactive_site.id),
                "screening_date": "2026-10-02",
            },
            {
                "participant_code": "BULK-001",
                "site_id": str(site.id),
                "screening_date": "2026-10-03",
            },
        ],
    }

    res = await client.post(
        "/api/v1/participants/bulk-import",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_processed"] == 3
    assert data["imported_count"] == 1
    assert data["failed_count"] == 2
    assert len(data["errors"]) == 2
    # Verify row numbers and failure reasons
    assert data["errors"][0]["row"] == 2
    assert "not an activated participating site" in data["errors"][0]["error"]
    assert data["errors"][1]["row"] == 3
    assert "Duplicate participant code" in data["errors"][1]["error"]


@pytest.mark.asyncio
async def test_super_admin_overview_and_participant_inspector(
    client: AsyncClient,
    db_session: AsyncSession,
    super_admin: tuple[User, str],
    cro_user: tuple[User, Organization, str],
    sponsor_pi: tuple[User, Organization, str],
    site_pi: tuple[User, Site, str],
):
    _, admin_token = super_admin
    _, _, cro_token = cro_user
    _, sponsor_org, _ = sponsor_pi
    _, site, _ = site_pi

    study = Study(
        study_code="SA-INSPECT-01",
        protocol_number="PRT-SA-01",
        title="Super Admin Inspector Trial",
        therapeutic_area="Ayurveda",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_1,
        status=StudyStatus.active,
        sponsor_org_id=sponsor_org.id,
    )
    db_session.add(study)
    await db_session.flush()

    participant = Participant(
        participant_code="SA-PT-001",
        study_id=study.id,
        site_id=site.id,
        status=ParticipantStatus.enrolled,
    )
    db_session.add(participant)
    await db_session.commit()

    # 1. Super Admin Overview
    res_ov = await client.get(
        "/api/v1/platform/super-admin/overview",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_ov.status_code == 200
    ov_data = res_ov.json()
    assert ov_data["is_read_only"] is True
    assert any(s["study_code"] == "SA-INSPECT-01" for s in ov_data["studies"])

    # 2. Participant Inspector
    res_pts = await client.get(
        f"/api/v1/platform/super-admin/studies/{study.id}/participants",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_pts.status_code == 200
    pts_data = res_pts.json()
    assert len(pts_data) >= 1
    assert pts_data[0]["participant_code"] == "SA-PT-001"

    # 3. Non-Super Admin blocked with 403
    res_blocked = await client.get(
        "/api/v1/platform/super-admin/overview",
        headers={"Authorization": f"Bearer {cro_token}"},
    )
    assert res_blocked.status_code == 403
