from __future__ import annotations

import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, hash_password
from app.main import app as fastapi_app
from app.models.audit import AuditLog
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
from app.models.study import Study, StudyTeamMember
from app.models.user import Permission, Role, RolePermission, SuperAdminProfile, User


@pytest.fixture
async def compliance_safety_setup(db_session: AsyncSession):
    """
    Sets up a complete multi-tenant, multi-study, multi-site environment with
    Sponsor A, CRO A, Sponsor B, Site A1, Site A2, Site B1, and various role holders.
    """
    # 0. Permissions
    perm_comp_read = Permission(codename="compliance:read", resource="compliance", action="read", description="Read compliance")
    perm_comp_write = Permission(codename="compliance:write", resource="compliance", action="write", description="Write compliance")
    perm_safe_read = Permission(codename="safety:read", resource="safety", action="read", description="Read safety")
    perm_safe_write = Permission(codename="safety:write", resource="safety", action="write", description="Write safety")
    perm_all = Permission(codename="*", resource="*", action="*", description="All")

    db_session.add_all([perm_comp_read, perm_comp_write, perm_safe_read, perm_safe_write, perm_all])
    await db_session.flush()

    # Roles
    role_sys_admin = Role(name="System Administrator", scope_level=ScopeLevel.system, is_system_role=True)
    role_study_pi = Role(name="Principal Investigator", scope_level=ScopeLevel.study, is_system_role=False)
    role_cro_monitor = Role(name="CRO Lead Monitor", scope_level=ScopeLevel.organization, is_system_role=False)
    role_site_pi = Role(name="Site Principal Investigator", scope_level=ScopeLevel.site, is_system_role=False)
    role_site_coord = Role(name="Site Coordinator", scope_level=ScopeLevel.site, is_system_role=False)
    role_viewer_only = Role(name="Read Only Auditor", scope_level=ScopeLevel.study, is_system_role=False)

    db_session.add_all([role_sys_admin, role_study_pi, role_cro_monitor, role_site_pi, role_site_coord, role_viewer_only])
    await db_session.flush()

    # Assign permissions
    db_session.add_all([
        RolePermission(role_id=role_sys_admin.id, permission_id=perm_all.id),
        RolePermission(role_id=role_study_pi.id, permission_id=perm_comp_read.id),
        RolePermission(role_id=role_study_pi.id, permission_id=perm_comp_write.id),
        RolePermission(role_id=role_study_pi.id, permission_id=perm_safe_read.id),
        RolePermission(role_id=role_study_pi.id, permission_id=perm_safe_write.id),
        RolePermission(role_id=role_cro_monitor.id, permission_id=perm_comp_read.id),
        RolePermission(role_id=role_cro_monitor.id, permission_id=perm_comp_write.id),
        RolePermission(role_id=role_cro_monitor.id, permission_id=perm_safe_read.id),
        RolePermission(role_id=role_cro_monitor.id, permission_id=perm_safe_write.id),
        RolePermission(role_id=role_site_pi.id, permission_id=perm_comp_read.id),
        RolePermission(role_id=role_site_pi.id, permission_id=perm_comp_write.id),
        RolePermission(role_id=role_site_pi.id, permission_id=perm_safe_read.id),
        RolePermission(role_id=role_site_pi.id, permission_id=perm_safe_write.id),
        RolePermission(role_id=role_site_coord.id, permission_id=perm_comp_read.id),
        RolePermission(role_id=role_site_coord.id, permission_id=perm_comp_write.id),
        RolePermission(role_id=role_site_coord.id, permission_id=perm_safe_read.id),
        RolePermission(role_id=role_site_coord.id, permission_id=perm_safe_write.id),
        RolePermission(role_id=role_viewer_only.id, permission_id=perm_comp_read.id),
        RolePermission(role_id=role_viewer_only.id, permission_id=perm_safe_read.id),
    ])
    await db_session.flush()

    # 1. Platform Authority & Tech Admin
    platform_org = Organization(
        name="AyuCTMS Central Platform",
        organization_type=OrganizationType.institution,
        status=OrganizationStatus.active,
        is_platform_authority=True,
    )
    db_session.add(platform_org)
    await db_session.flush()

    tech_admin = User(
        email="tech.admin@platform.gov.in",
        full_name="Technical Platform Admin",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(tech_admin)
    await db_session.flush()

    db_session.add(OrganizationMember(
        organization_id=platform_org.id,
        user_id=tech_admin.id,
        role_id=role_sys_admin.id,
        status=AssignmentStatus.active,
    ))
    await db_session.flush()

    # 2. Sponsor A & CRO A
    org_sponsor_a = Organization(name="Ayush Pharma A", organization_type=OrganizationType.sponsor, status=OrganizationStatus.active)
    org_cro_a = Organization(name="Ayush CRO A", organization_type=OrganizationType.cro, status=OrganizationStatus.active)
    # Sponsor B (Competitor)
    org_sponsor_b = Organization(name="Vaidya Labs B", organization_type=OrganizationType.sponsor, status=OrganizationStatus.active)
    db_session.add_all([org_sponsor_a, org_cro_a, org_sponsor_b])
    await db_session.flush()

    # Studies
    study_a = Study(
        study_code="AYU-STUDY-A",
        protocol_number="PRT-A-01",
        title="Study A Efficacy Trial",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        status=StudyStatus.active,
        sponsor_org_id=org_sponsor_a.id,
        cro_org_id=org_cro_a.id,
        therapeutic_area="Ayurveda",
    )
    study_b = Study(
        study_code="AYU-STUDY-B",
        protocol_number="PRT-B-01",
        title="Study B Trial",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_3,
        status=StudyStatus.active,
        sponsor_org_id=org_sponsor_b.id,
        therapeutic_area="Ayurveda",
    )
    db_session.add_all([study_a, study_b])
    await db_session.flush()

    # Sites
    org_hospital_a1 = Organization(name="AIIA New Delhi", organization_type=OrganizationType.site_affiliate, status=OrganizationStatus.active)
    org_hospital_a2 = Organization(name="BHU Varanasi", organization_type=OrganizationType.site_affiliate, status=OrganizationStatus.active)
    org_hospital_b1 = Organization(name="IPGTRA Jamnagar", organization_type=OrganizationType.site_affiliate, status=OrganizationStatus.active)
    db_session.add_all([org_hospital_a1, org_hospital_a2, org_hospital_b1])
    await db_session.flush()

    site_a1 = Site(name="AIIA Site A1", site_code="SITE-A1", site_type=SiteType.hospital, organization_id=org_hospital_a1.id, status=SiteStatus.active)
    site_a2 = Site(name="BHU Site A2", site_code="SITE-A2", site_type=SiteType.hospital, organization_id=org_hospital_a2.id, status=SiteStatus.active)
    site_b1 = Site(name="Jamnagar Site B1", site_code="SITE-B1", site_type=SiteType.hospital, organization_id=org_hospital_b1.id, status=SiteStatus.active)
    db_session.add_all([site_a1, site_a2, site_b1])
    await db_session.flush()

    # Link StudySites
    ss_a1 = StudySite(study_id=study_a.id, site_id=site_a1.id, activation_status=StudySiteActivationStatus.activated)
    ss_a2 = StudySite(study_id=study_a.id, site_id=site_a2.id, activation_status=StudySiteActivationStatus.activated)
    ss_b1 = StudySite(study_id=study_b.id, site_id=site_b1.id, activation_status=StudySiteActivationStatus.activated)
    db_session.add_all([ss_a1, ss_a2, ss_b1])
    await db_session.flush()

    # Participants
    p_a1 = Participant(participant_code="P-A1-001", study_id=study_a.id, site_id=site_a1.id, status=ParticipantStatus.enrolled)
    p_a2 = Participant(participant_code="P-A2-001", study_id=study_a.id, site_id=site_a2.id, status=ParticipantStatus.enrolled)
    p_b1 = Participant(participant_code="P-B1-001", study_id=study_b.id, site_id=site_b1.id, status=ParticipantStatus.enrolled)
    db_session.add_all([p_a1, p_a2, p_b1])
    await db_session.flush()

    # Users
    user_sponsor_a = User(email="pi.sponsor.a@ayush.com", full_name="Sponsor A PI", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_cro_a = User(email="cra.cro.a@cro.com", full_name="CRO A Lead Monitor", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_site_a1_pi = User(email="pi.site.a1@aiia.in", full_name="Site A1 PI", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_site_a1_coord = User(email="coord.site.a1@aiia.in", full_name="Site A1 Coord", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_site_a2_pi = User(email="pi.site.a2@bhu.in", full_name="Site A2 PI", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_sponsor_b = User(email="pi.sponsor.b@vaidya.com", full_name="Sponsor B PI", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_unprivileged = User(email="no.roles@nowhere.com", full_name="Unprivileged User", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_gov_admin = User(email="gov.admin@ayush.gov.in", full_name="Gov Super Admin", status=UserStatus.active, hashed_password=hash_password("Pass123!"))

    db_session.add_all([
        user_sponsor_a, user_cro_a, user_site_a1_pi, user_site_a1_coord,
        user_site_a2_pi, user_sponsor_b, user_unprivileged, user_gov_admin,
    ])
    await db_session.flush()

    # Government Profile for user_gov_admin
    db_session.add(SuperAdminProfile(
        user_id=user_gov_admin.id,
        is_active=True,
    ))

    # Organization memberships
    db_session.add(OrganizationMember(organization_id=org_sponsor_a.id, user_id=user_sponsor_a.id, role_id=role_study_pi.id, status=AssignmentStatus.active))
    db_session.add(OrganizationMember(organization_id=org_cro_a.id, user_id=user_cro_a.id, role_id=role_cro_monitor.id, status=AssignmentStatus.active))
    db_session.add(OrganizationMember(organization_id=org_hospital_a1.id, user_id=user_site_a1_pi.id, role_id=role_site_pi.id, status=AssignmentStatus.active))
    db_session.add(OrganizationMember(organization_id=org_hospital_a1.id, user_id=user_site_a1_coord.id, role_id=role_site_coord.id, status=AssignmentStatus.active))
    db_session.add(OrganizationMember(organization_id=org_hospital_a2.id, user_id=user_site_a2_pi.id, role_id=role_site_pi.id, status=AssignmentStatus.active))
    db_session.add(OrganizationMember(organization_id=org_sponsor_b.id, user_id=user_sponsor_b.id, role_id=role_study_pi.id, status=AssignmentStatus.active))
    await db_session.flush()

    # Study Team Memberships
    # Study A team:
    db_session.add(StudyTeamMember(study_id=study_a.id, user_id=user_sponsor_a.id, role_id=role_study_pi.id, site_id=None, assignment_status=AssignmentStatus.active))
    db_session.add(StudyTeamMember(study_id=study_a.id, user_id=user_site_a1_pi.id, role_id=role_site_pi.id, site_id=site_a1.id, assignment_status=AssignmentStatus.active))
    db_session.add(StudyTeamMember(study_id=study_a.id, user_id=user_site_a1_coord.id, role_id=role_site_coord.id, site_id=site_a1.id, assignment_status=AssignmentStatus.active))
    db_session.add(StudyTeamMember(study_id=study_a.id, user_id=user_site_a2_pi.id, role_id=role_site_pi.id, site_id=site_a2.id, assignment_status=AssignmentStatus.active))
    # Study B team:
    db_session.add(StudyTeamMember(study_id=study_b.id, user_id=user_sponsor_b.id, role_id=role_study_pi.id, site_id=None, assignment_status=AssignmentStatus.active))
    await db_session.commit()

    return {
        "study_a": study_a,
        "study_b": study_b,
        "site_a1": site_a1,
        "site_a2": site_a2,
        "site_b1": site_b1,
        "p_a1": p_a1,
        "p_a2": p_a2,
        "p_b1": p_b1,
        "org_sponsor_a": org_sponsor_a,
        "tech_admin": tech_admin,
        "user_sponsor_a": user_sponsor_a,
        "user_cro_a": user_cro_a,
        "user_site_a1_pi": user_site_a1_pi,
        "user_site_a1_coord": user_site_a1_coord,
        "user_site_a2_pi": user_site_a2_pi,
        "user_sponsor_b": user_sponsor_b,
        "user_unprivileged": user_unprivileged,
        "user_gov_admin": user_gov_admin,
    }


def _make_client(user: User, db_session: AsyncSession) -> AsyncClient:
    token = create_access_token({"sub": str(user.id), "email": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    async def override_get_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=fastapi_app)
    return AsyncClient(transport=transport, base_url="http://testserver", headers=headers)


# ---------------------------------------------------------------------------
# Test 1: Unauthenticated Requests receive 401
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_unauthenticated_safety_and_compliance_rejected_401(client: AsyncClient):
    """Anonymous calls to safety and compliance endpoints must return 401."""
    endpoints = [
        ("/api/v1/safety/adverse-events", "GET"),
        ("/api/v1/safety/adverse-events", "POST"),
        (f"/api/v1/safety/adverse-events/{uuid.uuid4()}", "GET"),
        (f"/api/v1/safety/adverse-events/{uuid.uuid4()}/transition", "POST"),
        ("/api/v1/compliance/ethics", "GET"),
        ("/api/v1/compliance/ethics", "POST"),
        (f"/api/v1/compliance/ethics/{uuid.uuid4()}/transition", "POST"),
        ("/api/v1/compliance/regulatory", "GET"),
        ("/api/v1/compliance/regulatory", "POST"),
        (f"/api/v1/compliance/regulatory/{uuid.uuid4()}/transition", "POST"),
        ("/api/v1/compliance/deviations", "GET"),
        ("/api/v1/compliance/deviations", "POST"),
        (f"/api/v1/compliance/deviations/{uuid.uuid4()}/transition", "POST"),
        ("/api/v1/compliance/capa", "GET"),
        ("/api/v1/compliance/capa", "POST"),
        (f"/api/v1/compliance/capa/{uuid.uuid4()}/transition", "POST"),
    ]
    for url, method in endpoints:
        if method == "GET":
            res = await client.get(url)
        else:
            res = await client.post(url, json={})
        assert res.status_code == 401, f"Expected 401 for anonymous {method} {url}, got {res.status_code}"


# ---------------------------------------------------------------------------
# Test 2: Unprivileged user rejected with 403
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_unprivileged_user_cannot_access_safety_or_compliance(
    compliance_safety_setup: dict,
    db_session: AsyncSession,
):
    """A user without safety or compliance permissions receives 403 on all operations."""
    unprivileged = compliance_safety_setup["user_unprivileged"]
    async with _make_client(unprivileged, db_session) as ac:
        # Safety
        res = await ac.get("/api/v1/safety/adverse-events")
        assert res.status_code == 403
        assert "safety:read" in res.json()["detail"]

        res = await ac.post("/api/v1/safety/adverse-events", json={
            "study_id": str(compliance_safety_setup["study_a"].id),
            "participant_id": str(compliance_safety_setup["p_a1"].id),
            "event_type": "ae",
            "description": "Mild headache",
            "onset_date": "2026-04-01",
            "seriousness": "non_serious",
            "severity": "mild",
        })
        assert res.status_code == 403
        assert "safety:write" in res.json()["detail"]

        # Compliance
        res = await ac.get("/api/v1/compliance/ethics")
        assert res.status_code == 403
        assert "compliance:read" in res.json()["detail"]

        res = await ac.get("/api/v1/compliance/regulatory")
        assert res.status_code == 403

        res = await ac.get("/api/v1/compliance/deviations")
        assert res.status_code == 403

        res = await ac.get("/api/v1/compliance/capa")
        assert res.status_code == 403


# ---------------------------------------------------------------------------
# Test 3: Government Super Admin profile cannot bypass clinical domain
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_government_super_admin_cannot_access_safety_or_compliance(
    compliance_safety_setup: dict,
    db_session: AsyncSession,
):
    """
    Government Verification Super Admin profile without explicit clinical role assignment
    must NOT possess wildcard access to adverse events or compliance data.
    """
    gov_admin = compliance_safety_setup["user_gov_admin"]
    async with _make_client(gov_admin, db_session) as ac:
        res = await ac.get("/api/v1/safety/adverse-events")
        assert res.status_code == 403

        res = await ac.get("/api/v1/compliance/ethics")
        assert res.status_code == 403

        res = await ac.get("/api/v1/compliance/regulatory")
        assert res.status_code == 403

        res = await ac.get("/api/v1/compliance/deviations")
        assert res.status_code == 403

        res = await ac.get("/api/v1/compliance/capa")
        assert res.status_code == 403


# ---------------------------------------------------------------------------
# Test 4: Safety Sponsor Isolation (Sponsor A vs Sponsor B)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_safety_sponsor_isolation(
    compliance_safety_setup: dict,
    db_session: AsyncSession,
):
    """
    Sponsor A user can manage adverse events in Study A.
    Sponsor A user CANNOT view, report, or transition adverse events in Study B.
    """
    user_a = compliance_safety_setup["user_sponsor_a"]
    user_b = compliance_safety_setup["user_sponsor_b"]
    study_a = compliance_safety_setup["study_a"]
    study_b = compliance_safety_setup["study_b"]
    p_a1 = compliance_safety_setup["p_a1"]
    p_b1 = compliance_safety_setup["p_b1"]
    site_a1 = compliance_safety_setup["site_a1"]
    site_b1 = compliance_safety_setup["site_b1"]

    # 1. Sponsor A reports an adverse event in Study A -> 201 Created
    async with _make_client(user_a, db_session) as ac_a:
        res_create_a = await ac_a.post("/api/v1/safety/adverse-events", json={
            "study_id": str(study_a.id),
            "participant_id": str(p_a1.id),
            "site_id": str(site_a1.id),
            "event_type": "ae",
            "description": "Nausea post herbal decoction",
            "onset_date": "2026-04-10",
            "seriousness": "non_serious",
            "severity": "mild",
        })
        assert res_create_a.status_code == 201
        ae_a_id = res_create_a.json()["id"]

        # Sponsor A tries to report AE in Study B -> 403 Forbidden
        res_cross_report = await ac_a.post("/api/v1/safety/adverse-events", json={
            "study_id": str(study_b.id),
            "participant_id": str(p_b1.id),
            "site_id": str(site_b1.id),
            "event_type": "ae",
            "description": "Unauthorized cross-sponsor report",
            "onset_date": "2026-04-10",
            "seriousness": "non_serious",
            "severity": "mild",
        })
        assert res_cross_report.status_code == 403

    # 2. Sponsor B reports an adverse event in Study B
    async with _make_client(user_b, db_session) as ac_b:
        res_create_b = await ac_b.post("/api/v1/safety/adverse-events", json={
            "study_id": str(study_b.id),
            "participant_id": str(p_b1.id),
            "site_id": str(site_b1.id),
            "event_type": "sae",
            "description": "Severe allergic reaction",
            "onset_date": "2026-04-10",
            "seriousness": "serious",
            "severity": "severe",
        })
        assert res_create_b.status_code == 201
        ae_b_id = res_create_b.json()["id"]

    # 3. Cross-tenant retrieval isolation
    async with _make_client(user_a, db_session) as ac_a:
        # Direct lookup of Study B AE by Sponsor A -> 403 Forbidden
        res_lookup = await ac_a.get(f"/api/v1/safety/adverse-events/{ae_b_id}")
        assert res_lookup.status_code == 403

        # Transition of Study B AE by Sponsor A -> 403 Forbidden
        res_trans = await ac_a.post(f"/api/v1/safety/adverse-events/{ae_b_id}/transition", json={
            "new_status": "under_review",
            "reason": "Unauthorized review attempt",
        })
        assert res_trans.status_code == 403

        # Listing for Sponsor A returns only Study A AE, never Study B AE
        res_list = await ac_a.get("/api/v1/safety/adverse-events")
        assert res_list.status_code == 200
        ids = [item["id"] for item in res_list.json()]
        assert ae_a_id in ids
        assert ae_b_id not in ids

        # Query filter for Study B returns 403
        res_filtered = await ac_a.get(f"/api/v1/safety/adverse-events?study_id={study_b.id}")
        assert res_filtered.status_code == 403


# ---------------------------------------------------------------------------
# Test 5: Safety Site Isolation (Site A1 vs Site A2)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_safety_site_isolation(
    compliance_safety_setup: dict,
    db_session: AsyncSession,
):
    """
    Site A1 PI can view and report adverse events only for Site A1.
    Site A1 PI CANNOT view, report, or transition adverse events for Site A2.
    """
    user_site_a1 = compliance_safety_setup["user_site_a1_pi"]
    user_site_a2 = compliance_safety_setup["user_site_a2_pi"]
    study_a = compliance_safety_setup["study_a"]
    site_a1 = compliance_safety_setup["site_a1"]
    site_a2 = compliance_safety_setup["site_a2"]
    p_a1 = compliance_safety_setup["p_a1"]
    p_a2 = compliance_safety_setup["p_a2"]

    # 1. Site A1 reports AE at Site A1
    async with _make_client(user_site_a1, db_session) as ac_a1:
        res_a1 = await ac_a1.post("/api/v1/safety/adverse-events", json={
            "study_id": str(study_a.id),
            "participant_id": str(p_a1.id),
            "site_id": str(site_a1.id),
            "event_type": "ae",
            "description": "Mild rash at Site A1",
            "onset_date": "2026-04-11",
            "seriousness": "non_serious",
            "severity": "mild",
        })
        assert res_a1.status_code == 201
        ae_a1_id = res_a1.json()["id"]

        # Site A1 tries to report AE for Site A2 and its participant -> 403 Forbidden
        res_cross_site = await ac_a1.post("/api/v1/safety/adverse-events", json={
            "study_id": str(study_a.id),
            "participant_id": str(p_a2.id),
            "site_id": str(site_a2.id),
            "event_type": "ae",
            "description": "Cross site injection",
            "onset_date": "2026-04-11",
            "seriousness": "non_serious",
            "severity": "mild",
        })
        assert res_cross_site.status_code == 403
        assert "site staff cannot report adverse events for other sites" in res_cross_site.json()["detail"]

        # Site A1 tries to report AE with mismatched participant/site -> 400 Bad Request
        res_mismatch = await ac_a1.post("/api/v1/safety/adverse-events", json={
            "study_id": str(study_a.id),
            "participant_id": str(p_a1.id),
            "site_id": str(site_a2.id),
            "event_type": "ae",
            "description": "Cross site mismatch",
            "onset_date": "2026-04-11",
            "seriousness": "non_serious",
            "severity": "mild",
        })
        assert res_mismatch.status_code == 400
        assert "Participant is not registered at the specified site" in res_mismatch.json()["detail"]

    # 2. Site A2 reports AE at Site A2
    async with _make_client(user_site_a2, db_session) as ac_a2:
        res_a2 = await ac_a2.post("/api/v1/safety/adverse-events", json={
            "study_id": str(study_a.id),
            "participant_id": str(p_a2.id),
            "site_id": str(site_a2.id),
            "event_type": "ae",
            "description": "Mild dizziness at Site A2",
            "onset_date": "2026-04-11",
            "seriousness": "non_serious",
            "severity": "mild",
        })
        assert res_a2.status_code == 201
        ae_a2_id = res_a2.json()["id"]

    # 3. Cross-site isolation checks
    async with _make_client(user_site_a1, db_session) as ac_a1:
        # Site A1 tries to view Site A2 event -> 403 Forbidden
        res_get_a2 = await ac_a1.get(f"/api/v1/safety/adverse-events/{ae_a2_id}")
        assert res_get_a2.status_code == 403

        # Site A1 tries to transition Site A2 event -> 403 Forbidden
        res_trans_a2 = await ac_a1.post(f"/api/v1/safety/adverse-events/{ae_a2_id}/transition", json={
            "new_status": "under_review",
            "reason": "Unauthorized cross-site transition",
        })
        assert res_trans_a2.status_code == 403

        # Listing for Site A1 returns only Site A1 event
        res_list = await ac_a1.get("/api/v1/safety/adverse-events")
        assert res_list.status_code == 200
        ids = [item["id"] for item in res_list.json()]
        assert ae_a1_id in ids
        assert ae_a2_id not in ids


# ---------------------------------------------------------------------------
# Test 6: Safety Adverse Event Lifecycle & CRO Access
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_safety_adverse_event_lifecycle_and_cro_access(
    compliance_safety_setup: dict,
    db_session: AsyncSession,
):
    """
    CRO Lead Monitor can view and transition adverse events across all sites in the study.
    Validates state machine transitions: open -> under_review -> closed.
    """
    user_cro = compliance_safety_setup["user_cro_a"]
    user_site_a1 = compliance_safety_setup["user_site_a1_coord"]
    study_a = compliance_safety_setup["study_a"]
    site_a1 = compliance_safety_setup["site_a1"]
    p_a1 = compliance_safety_setup["p_a1"]

    # Coordinator logs AE
    async with _make_client(user_site_a1, db_session) as ac_coord:
        res = await ac_coord.post("/api/v1/safety/adverse-events", json={
            "study_id": str(study_a.id),
            "participant_id": str(p_a1.id),
            "site_id": str(site_a1.id),
            "event_type": "ae",
            "description": "Transient abdominal discomfort",
            "onset_date": "2026-04-12",
            "seriousness": "non_serious",
            "severity": "mild",
        })
        assert res.status_code == 201
        ae_id = res.json()["id"]

    # CRO Monitor reviews and transitions
    async with _make_client(user_cro, db_session) as ac_cro:
        # CRO can read
        res_get = await ac_cro.get(f"/api/v1/safety/adverse-events/{ae_id}")
        assert res_get.status_code == 200
        assert res_get.json()["status"] == "open"

        # Transition open -> under_review
        res_t1 = await ac_cro.post(f"/api/v1/safety/adverse-events/{ae_id}/transition", json={
            "new_status": "under_review",
            "reason": "Pharmacovigilance medical review initiated",
        })
        assert res_t1.status_code == 200
        assert res_t1.json()["status"] == "under_review"

        # Transition under_review -> closed
        res_t2 = await ac_cro.post(f"/api/v1/safety/adverse-events/{ae_id}/transition", json={
            "new_status": "closed",
            "reason": "Symptoms resolved, case closed",
        })
        assert res_t2.status_code == 200
        assert res_t2.json()["status"] == "closed"


# ---------------------------------------------------------------------------
# Test 7: Compliance Ethics Approval RBAC & Boundaries
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_compliance_ethics_approval_rbac_and_isolation(
    compliance_safety_setup: dict,
    db_session: AsyncSession,
):
    """
    Ethics approval scoping:
    1. Study-wide ethics approval can be created by Sponsor/CRO PI, but NOT by site staff.
    2. Site-specific ethics approval can be created by site staff for their site.
    3. Site staff CANNOT create ethics approvals for other sites.
    4. Site staff CANNOT transition study-wide ethics approvals.
    5. Sponsor A cannot see or mutate Sponsor B ethics approvals.
    """
    user_sponsor_a = compliance_safety_setup["user_sponsor_a"]
    user_site_a1 = compliance_safety_setup["user_site_a1_pi"]
    user_site_a2 = compliance_safety_setup["user_site_a2_pi"]
    user_sponsor_b = compliance_safety_setup["user_sponsor_b"]
    study_a = compliance_safety_setup["study_a"]
    study_b = compliance_safety_setup["study_b"]
    site_a1 = compliance_safety_setup["site_a1"]
    site_a2 = compliance_safety_setup["site_a2"]

    # 1. Sponsor A creates study-wide Central EC approval
    async with _make_client(user_sponsor_a, db_session) as ac_sp:
        res_central = await ac_sp.post("/api/v1/compliance/ethics", json={
            "study_id": str(study_a.id),
            "site_id": None,
            "committee_name": "Central Institutional Ethics Committee",
            "status": "not_submitted",
        })
        assert res_central.status_code == 201
        central_ec_id = res_central.json()["id"]

    # 2. Site A1 tries to create study-wide EC -> 403 Forbidden
    async with _make_client(user_site_a1, db_session) as ac_site:
        res_err = await ac_site.post("/api/v1/compliance/ethics", json={
            "study_id": str(study_a.id),
            "site_id": None,
            "committee_name": "Unauthorized Central Submission",
            "status": "not_submitted",
        })
        assert res_err.status_code == 403

        # Site A1 tries to create EC for Site A2 -> 403 Forbidden
        res_cross = await ac_site.post("/api/v1/compliance/ethics", json={
            "study_id": str(study_a.id),
            "site_id": str(site_a2.id),
            "committee_name": "Site A2 Ethics Committee",
            "status": "not_submitted",
        })
        assert res_cross.status_code == 403

        # Site A1 creates EC for Site A1 -> 201 Created
        res_ok = await ac_site.post("/api/v1/compliance/ethics", json={
            "study_id": str(study_a.id),
            "site_id": str(site_a1.id),
            "committee_name": "AIIA Institutional Ethics Committee",
            "status": "not_submitted",
        })
        assert res_ok.status_code == 201
        site_ec_id = res_ok.json()["id"]

        # Site A1 transitions their site EC -> 200 OK
        res_site_trans = await ac_site.post(f"/api/v1/compliance/ethics/{site_ec_id}/transition", json={
            "new_status": "pending",
            "reason": "Submitted to AIIA EC",
        })
        assert res_site_trans.status_code == 200

        # Site A1 tries to transition study-wide Central EC -> 403 Forbidden
        res_central_trans = await ac_site.post(f"/api/v1/compliance/ethics/{central_ec_id}/transition", json={
            "new_status": "pending",
            "reason": "Unauthorized site attempt",
        })
        assert res_central_trans.status_code == 403

    # 3. Cross-sponsor isolation: Sponsor B cannot see or transition Study A EC
    async with _make_client(user_sponsor_b, db_session) as ac_b:
        res_b_trans = await ac_b.post(f"/api/v1/compliance/ethics/{central_ec_id}/transition", json={
            "new_status": "pending",
            "reason": "Sponsor B hijack attempt",
        })
        assert res_b_trans.status_code == 403

        res_b_list = await ac_b.get("/api/v1/compliance/ethics")
        assert res_b_list.status_code == 200
        ids = [item["id"] for item in res_b_list.json()]
        assert central_ec_id not in ids
        assert site_ec_id not in ids


# ---------------------------------------------------------------------------
# Test 8: Compliance Regulatory Submission RBAC & Boundaries
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_compliance_regulatory_submission_rbac_and_isolation(
    compliance_safety_setup: dict,
    db_session: AsyncSession,
):
    """
    Regulatory submissions:
    1. Only study-level team / Sponsor / CRO can create or transition regulatory submissions.
    2. Site-level staff cannot create regulatory submissions (403).
    3. Site staff can read regulatory submissions for their study.
    4. Cross-sponsor isolation is strictly enforced.
    """
    user_sponsor_a = compliance_safety_setup["user_sponsor_a"]
    user_site_a1 = compliance_safety_setup["user_site_a1_pi"]
    user_sponsor_b = compliance_safety_setup["user_sponsor_b"]
    study_a = compliance_safety_setup["study_a"]

    # 1. Site staff tries to create regulatory submission -> 403 Forbidden
    async with _make_client(user_site_a1, db_session) as ac_site:
        res_err = await ac_site.post("/api/v1/compliance/regulatory", json={
            "study_id": str(study_a.id),
            "submission_type": "DCGI Clinical Trial NOC",
            "authority": "CDSCO New Delhi",
            "status": "not_submitted",
        })
        assert res_err.status_code == 403

    # 2. Sponsor A creates regulatory submission -> 201 Created
    async with _make_client(user_sponsor_a, db_session) as ac_sp:
        res_reg = await ac_sp.post("/api/v1/compliance/regulatory", json={
            "study_id": str(study_a.id),
            "submission_type": "DCGI Clinical Trial NOC",
            "authority": "CDSCO New Delhi",
            "status": "not_submitted",
        })
        assert res_reg.status_code == 201
        reg_id = res_reg.json()["id"]

    # 3. Site staff CAN read the study's regulatory submission
    async with _make_client(user_site_a1, db_session) as ac_site:
        res_list = await ac_site.get("/api/v1/compliance/regulatory")
        assert res_list.status_code == 200
        ids = [item["id"] for item in res_list.json()]
        assert reg_id in ids

        # But site staff CANNOT transition it -> 403 Forbidden
        res_trans = await ac_site.post(f"/api/v1/compliance/regulatory/{reg_id}/transition", json={
            "new_status": "pending",
            "reason": "Site staff attempt",
        })
        assert res_trans.status_code == 403

    # 4. Sponsor B cannot see or transition Study A's regulatory submission
    async with _make_client(user_sponsor_b, db_session) as ac_b:
        res_trans_b = await ac_b.post(f"/api/v1/compliance/regulatory/{reg_id}/transition", json={
            "new_status": "pending",
            "reason": "Sponsor B attempt",
        })
        assert res_trans_b.status_code == 403

        res_list_b = await ac_b.get("/api/v1/compliance/regulatory")
        assert res_list_b.status_code == 200
        ids_b = [item["id"] for item in res_list_b.json()]
        assert reg_id not in ids_b


# ---------------------------------------------------------------------------
# Test 9: Compliance Protocol Deviation RBAC & Boundaries
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_compliance_protocol_deviation_rbac_and_isolation(
    compliance_safety_setup: dict,
    db_session: AsyncSession,
):
    """
    Protocol deviations:
    1. Site A1 staff can record deviations for Site A1.
    2. Site A1 staff cannot record deviations for Site A2 -> 403.
    3. Site A1 staff cannot transition deviations for Site A2 -> 403.
    4. Cross-sponsor isolation is strictly enforced.
    """
    user_site_a1 = compliance_safety_setup["user_site_a1_coord"]
    user_site_a2 = compliance_safety_setup["user_site_a2_pi"]
    user_sponsor_a = compliance_safety_setup["user_sponsor_a"]
    user_sponsor_b = compliance_safety_setup["user_sponsor_b"]
    study_a = compliance_safety_setup["study_a"]
    site_a1 = compliance_safety_setup["site_a1"]
    site_a2 = compliance_safety_setup["site_a2"]
    p_a1 = compliance_safety_setup["p_a1"]
    p_a2 = compliance_safety_setup["p_a2"]

    # 1. Site A1 records deviation at Site A1
    async with _make_client(user_site_a1, db_session) as ac_a1:
        res_a1 = await ac_a1.post("/api/v1/compliance/deviations", json={
            "study_id": str(study_a.id),
            "site_id": str(site_a1.id),
            "participant_id": str(p_a1.id),
            "category": "Visit Window",
            "description": "Patient completed Visit 2 48h outside window",
            "severity": "minor",
            "status": "identified",
            "identified_date": "2026-04-12",
        })
        assert res_a1.status_code == 201
        dev_a1_id = res_a1.json()["id"]

        # Site A1 tries to record deviation for Site A2 -> 403 Forbidden
        res_cross = await ac_a1.post("/api/v1/compliance/deviations", json={
            "study_id": str(study_a.id),
            "site_id": str(site_a2.id),
            "participant_id": str(p_a2.id),
            "category": "Informed Consent",
            "description": "Cross site deviation",
            "severity": "major",
            "status": "identified",
            "identified_date": "2026-04-12",
        })
        assert res_cross.status_code == 403

    # 2. Site A2 records deviation at Site A2
    async with _make_client(user_site_a2, db_session) as ac_a2:
        res_a2 = await ac_a2.post("/api/v1/compliance/deviations", json={
            "study_id": str(study_a.id),
            "site_id": str(site_a2.id),
            "participant_id": str(p_a2.id),
            "category": "Dosing",
            "description": "Missed evening dose",
            "severity": "minor",
            "status": "identified",
            "identified_date": "2026-04-12",
        })
        assert res_a2.status_code == 201
        dev_a2_id = res_a2.json()["id"]

    # 3. Cross-site isolation
    async with _make_client(user_site_a1, db_session) as ac_a1:
        # Site A1 tries to transition Site A2 deviation -> 403 Forbidden
        res_trans = await ac_a1.post(f"/api/v1/compliance/deviations/{dev_a2_id}/transition", json={
            "new_status": "reported",
            "reason": "Cross-site transition attempt",
        })
        assert res_trans.status_code == 403

        # Site A1 transitions own deviation -> 200 OK
        res_own_trans = await ac_a1.post(f"/api/v1/compliance/deviations/{dev_a1_id}/transition", json={
            "new_status": "reported",
            "reason": "Reported to sponsor monitor",
        })
        assert res_own_trans.status_code == 200

    # 4. Sponsor B cross-tenant isolation
    async with _make_client(user_sponsor_b, db_session) as ac_b:
        res_b_trans = await ac_b.post(f"/api/v1/compliance/deviations/{dev_a1_id}/transition", json={
            "new_status": "resolved",
            "reason": "Sponsor B attempt",
        })
        assert res_b_trans.status_code == 403


# ---------------------------------------------------------------------------
# Test 10: Compliance CAPA RBAC & Boundaries
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_compliance_capa_rbac_and_isolation(
    compliance_safety_setup: dict,
    db_session: AsyncSession,
):
    """
    CAPA records:
    1. Sponsor A PI can create and transition CAPA records for Study A.
    2. Sponsor B cannot access or transition Study A CAPA records.
    3. State transition open -> in_progress -> completed verified.
    """
    user_sponsor_a = compliance_safety_setup["user_sponsor_a"]
    user_sponsor_b = compliance_safety_setup["user_sponsor_b"]
    study_a = compliance_safety_setup["study_a"]

    # 1. Sponsor A creates CAPA
    async with _make_client(user_sponsor_a, db_session) as ac_a:
        res_capa = await ac_a.post("/api/v1/compliance/capa", json={
            "study_id": str(study_a.id),
            "capa_type": "corrective",
            "description": "Retrain study site staff on electronic ICF logging",
            "status": "open",
            "due_date": "2026-05-30",
        })
        assert res_capa.status_code == 201
        capa_id = res_capa.json()["id"]

        # Sponsor A transitions open -> in_progress -> 200 OK
        res_t1 = await ac_a.post(f"/api/v1/compliance/capa/{capa_id}/transition", json={
            "new_status": "in_progress",
            "reason": "Staff training scheduled",
        })
        assert res_t1.status_code == 200
        assert res_t1.json()["status"] == "in_progress"

    # 2. Sponsor B tries to transition Study A CAPA -> 403 Forbidden
    async with _make_client(user_sponsor_b, db_session) as ac_b:
        res_b_trans = await ac_b.post(f"/api/v1/compliance/capa/{capa_id}/transition", json={
            "new_status": "completed",
            "reason": "Sponsor B unauthorized close",
        })
        assert res_b_trans.status_code == 403

        res_b_list = await ac_b.get("/api/v1/compliance/capa")
        assert res_b_list.status_code == 200
        ids = [item["id"] for item in res_b_list.json()]
        assert capa_id not in ids


# ---------------------------------------------------------------------------
# Test 11: Technical System Admin Full Access
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_technical_system_admin_full_access(
    compliance_safety_setup: dict,
    db_session: AsyncSession,
):
    """
    Technical System Administrator retains unrestricted platform-wide oversight
    across all safety and compliance endpoints.
    """
    tech_admin = compliance_safety_setup["tech_admin"]
    study_a = compliance_safety_setup["study_a"]
    study_b = compliance_safety_setup["study_b"]

    async with _make_client(tech_admin, db_session) as ac_admin:
        # Can list all safety
        res_safe = await ac_admin.get("/api/v1/safety/adverse-events")
        assert res_safe.status_code == 200

        # Can list all compliance
        res_ec = await ac_admin.get("/api/v1/compliance/ethics")
        assert res_ec.status_code == 200

        res_reg = await ac_admin.get("/api/v1/compliance/regulatory")
        assert res_reg.status_code == 200

        res_dev = await ac_admin.get("/api/v1/compliance/deviations")
        assert res_dev.status_code == 200

        res_capa = await ac_admin.get("/api/v1/compliance/capa")
        assert res_capa.status_code == 200


# ---------------------------------------------------------------------------
# Test 12: Audit Trail Logging Includes study_id for Safety & Compliance
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_audit_trail_logging_includes_study_id(
    compliance_safety_setup: dict,
    db_session: AsyncSession,
):
    """
    Verifies that safety and compliance creation and transition operations
    record audit log entries with study_id populated in changes, maintaining
    consistency with F02/F02B/F02C audit scoping requirements.
    """
    user_sponsor_a = compliance_safety_setup["user_sponsor_a"]
    study_a = compliance_safety_setup["study_a"]
    site_a1 = compliance_safety_setup["site_a1"]
    p_a1 = compliance_safety_setup["p_a1"]

    async with _make_client(user_sponsor_a, db_session) as ac:
        # Create AE
        res_ae = await ac.post("/api/v1/safety/adverse-events", json={
            "study_id": str(study_a.id),
            "participant_id": str(p_a1.id),
            "site_id": str(site_a1.id),
            "event_type": "ae",
            "description": "Mild fatigue",
            "onset_date": "2026-04-12",
            "seriousness": "non_serious",
            "severity": "mild",
        })
        assert res_ae.status_code == 201
        ae_id = uuid.UUID(res_ae.json()["id"])

        # Transition AE
        res_trans = await ac.post(f"/api/v1/safety/adverse-events/{ae_id}/transition", json={
            "new_status": "under_review",
            "reason": "Audit study verification",
        })
        assert res_trans.status_code == 200

    # Inspect audit logs in database
    stmt = select(AuditLog).where(AuditLog.resource_id == ae_id)
    logs = (await db_session.execute(stmt)).scalars().all()
    assert len(logs) == 2  # 1 create + 1 transition

    for log in logs:
        assert log.changes is not None
        assert "study_id" in log.changes
        assert log.changes["study_id"] == str(study_a.id)
