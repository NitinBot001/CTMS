from __future__ import annotations

import uuid

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
from app.models.study import Study, StudyTeamMember
from app.models.user import Permission, Role, RolePermission, SuperAdminProfile, User
from app.services.audit import AuditService

# ---------------------------------------------------------------------------
# Test Fixtures for Dual-Study Cross-Isolation
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def two_studies_setup(db_session: AsyncSession):
    """
    Creates two distinct studies with distinct organizations, sites, participants,
    and audit log records in each scope to prove strict cross-tenant data isolation.
    """
    # 1. Organization A & Study A
    org_a = Organization(
        name="Sponsor Org Alpha",
        organization_type=OrganizationType.sponsor,
        status=OrganizationStatus.active,
        registration_number="SPONSOR-ALPHA-01",
    )
    db_session.add(org_a)
    await db_session.flush()

    study_a = Study(
        study_code="STUDY-ALPHA-01",
        protocol_number="PRT-ALPHA-01",
        title="Curcumin Clinical Trial Alpha",
        therapeutic_area="Ayurveda",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        status=StudyStatus.active,
        sponsor_org_id=org_a.id,
        planned_sample_size=50,
    )
    site_a = Site(
        site_code="SITE-ALPHA-01",
        name="Clinical Center Alpha",
        site_type=SiteType.hospital,
        status=SiteStatus.active,
        city="Haridwar",
        state="Uttarakhand",
        organization_id=org_a.id,
    )
    db_session.add_all([study_a, site_a])
    await db_session.flush()

    study_site_a = StudySite(
        study_id=study_a.id,
        site_id=site_a.id,
        activation_status=StudySiteActivationStatus.activated,
    )
    participant_a = Participant(
        study_id=study_a.id,
        site_id=site_a.id,
        participant_code="SUBJ-ALPHA-001",
        status=ParticipantStatus.enrolled,
    )
    db_session.add_all([study_site_a, participant_a])
    await db_session.flush()

    # 2. Organization B & Study B
    org_b = Organization(
        name="Sponsor Org Beta",
        organization_type=OrganizationType.sponsor,
        status=OrganizationStatus.active,
        registration_number="SPONSOR-BETA-01",
    )
    db_session.add(org_b)
    await db_session.flush()

    study_b = Study(
        study_code="STUDY-BETA-02",
        protocol_number="PRT-BETA-02",
        title="Brahmi Neuro Trial Beta",
        therapeutic_area="Ayurveda",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_3,
        status=StudyStatus.active,
        sponsor_org_id=org_b.id,
        planned_sample_size=100,
    )
    site_b = Site(
        site_code="SITE-BETA-02",
        name="Clinical Center Beta",
        site_type=SiteType.hospital,
        status=SiteStatus.active,
        city="Varanasi",
        state="Uttar Pradesh",
        organization_id=org_b.id,
    )
    db_session.add_all([study_b, site_b])
    await db_session.flush()

    study_site_b = StudySite(
        study_id=study_b.id,
        site_id=site_b.id,
        activation_status=StudySiteActivationStatus.activated,
    )
    participant_b = Participant(
        study_id=study_b.id,
        site_id=site_b.id,
        participant_code="SUBJ-BETA-002",
        status=ParticipantStatus.enrolled,
    )
    db_session.add_all([study_site_b, participant_b])
    await db_session.flush()

    # 3. User assigned to Study A only (Principal Investigator)
    user_a = User(
        email="pi.alpha@hospital.org",
        full_name="Dr. Alpha Investigator",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    role_pi = Role(
        name="Principal Investigator Alpha",
        scope_level=ScopeLevel.study,
        is_system_role=False,
    )
    db_session.add_all([user_a, role_pi])
    await db_session.flush()

    member_a = OrganizationMember(
        organization_id=org_a.id,
        user_id=user_a.id,
        role_id=role_pi.id,
        status=AssignmentStatus.active,
    )
    team_a = StudyTeamMember(
        study_id=study_a.id,
        user_id=user_a.id,
        role_id=role_pi.id,
        assignment_status=AssignmentStatus.active,
    )
    db_session.add_all([member_a, team_a])
    await db_session.flush()

    # 4. User assigned to Study B only
    user_b = User(
        email="pi.beta@hospital.org",
        full_name="Dr. Beta Investigator",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(user_b)
    await db_session.flush()

    member_b = OrganizationMember(
        organization_id=org_b.id,
        user_id=user_b.id,
        role_id=role_pi.id,
        status=AssignmentStatus.active,
    )
    team_b = StudyTeamMember(
        study_id=study_b.id,
        user_id=user_b.id,
        role_id=role_pi.id,
        assignment_status=AssignmentStatus.active,
    )
    db_session.add_all([member_b, team_b])
    await db_session.flush()

    # 5. Global Auditor (User with explicit audit:read permission)
    auditor_user = User(
        email="global.auditor@clinicalqa.org",
        full_name="Global QA Auditor",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    auditor_role = Role(
        name="Quality Assurance Auditor",
        scope_level=ScopeLevel.organization,
        is_system_role=False,
    )
    audit_perm = Permission(
        codename="audit:read",
        resource="audit",
        action="read",
        description="Inspect cryptographic audit trail",
    )
    db_session.add_all([auditor_user, auditor_role, audit_perm])
    await db_session.flush()

    rp_audit = RolePermission(role_id=auditor_role.id, permission_id=audit_perm.id)
    auditor_membership = OrganizationMember(
        organization_id=org_a.id,
        user_id=auditor_user.id,
        role_id=auditor_role.id,
        status=AssignmentStatus.active,
    )
    db_session.add_all([rp_audit, auditor_membership])
    await db_session.flush()

    # 6. Ordinary unassigned user
    ordinary_user = User(
        email="plain.unassigned@hospital.org",
        full_name="Plain Unassigned",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(ordinary_user)
    await db_session.flush()

    # 7. Government Verification Super Admin
    gov_super_admin = User(
        email="gov.verifier.audit@ayuctms.gov.in",
        full_name="Gov Super Admin",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(gov_super_admin)
    await db_session.flush()

    gov_profile = SuperAdminProfile(user_id=gov_super_admin.id, is_active=True)
    db_session.add(gov_profile)
    await db_session.flush()

    # 8. Create Audit Logs in each scope
    log_study_a = await AuditService.create_audit_log(
        db=db_session,
        user_id=user_a.id,
        action="study.create",
        resource_type="study",
        resource_id=study_a.id,
        changes={"title": study_a.title},
    )
    log_part_a = await AuditService.create_audit_log(
        db=db_session,
        user_id=user_a.id,
        action="participant.create",
        resource_type="participant",
        resource_id=participant_a.id,
        changes={"code": participant_a.participant_code},
    )
    log_study_b = await AuditService.create_audit_log(
        db=db_session,
        user_id=user_b.id,
        action="study.create",
        resource_type="study",
        resource_id=study_b.id,
        changes={"title": study_b.title},
    )
    log_part_b = await AuditService.create_audit_log(
        db=db_session,
        user_id=user_b.id,
        action="participant.create",
        resource_type="participant",
        resource_id=participant_b.id,
        changes={"code": participant_b.participant_code},
    )
    log_user_sys = await AuditService.create_audit_log(
        db=db_session,
        user_id=None,
        action="user.create",
        resource_type="user",
        resource_id=ordinary_user.id,
        changes={"email": ordinary_user.email},
    )
    await db_session.commit()

    tokens = {
        "user_a": create_access_token({"sub": str(user_a.id), "email": user_a.email}),
        "user_b": create_access_token({"sub": str(user_b.id), "email": user_b.email}),
        "auditor": create_access_token({"sub": str(auditor_user.id), "email": auditor_user.email}),
        "ordinary": create_access_token({"sub": str(ordinary_user.id), "email": ordinary_user.email}),
        "gov_super_admin": create_access_token({"sub": str(gov_super_admin.id), "email": gov_super_admin.email}),
    }

    return {
        "study_a": study_a,
        "study_b": study_b,
        "site_a": site_a,
        "site_b": site_b,
        "participant_a": participant_a,
        "participant_b": participant_b,
        "tokens": tokens,
        "logs": {
            "study_a": log_study_a,
            "part_a": log_part_a,
            "study_b": log_study_b,
            "part_b": log_part_b,
            "user_sys": log_user_sys,
        },
    }


# ---------------------------------------------------------------------------
# F02: Unauthenticated and Global Audit Access Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_audit_logs_unauthenticated_returns_401(client: AsyncClient):
    """Anonymous request to /api/v1/audit/logs must return 401."""
    res = await client.get("/api/v1/audit/logs")
    assert res.status_code == 401
    assert "WWW-Authenticate" in res.headers


@pytest.mark.asyncio
async def test_audit_verify_unauthenticated_returns_401(client: AsyncClient):
    """Anonymous request to /api/v1/audit/verify must return 401."""
    res = await client.get("/api/v1/audit/verify")
    assert res.status_code == 401
    assert "WWW-Authenticate" in res.headers


@pytest.mark.asyncio
async def test_audit_logs_ordinary_user_global_forbidden_returns_403(
    client: AsyncClient, two_studies_setup: dict
):
    """Ordinary authenticated user without audit:read requesting global logs must receive 403."""
    token = two_studies_setup["tokens"]["ordinary"]
    res = await client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "audit:read" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_government_super_admin_global_forbidden_returns_403(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Government Verification Super Admin cannot access global technical audit logs
    through a generic admin bypass (must receive 403).
    """
    token = two_studies_setup["tokens"]["gov_super_admin"]
    res = await client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "audit:read" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_verify_ordinary_user_forbidden_returns_403(
    client: AsyncClient, two_studies_setup: dict
):
    """Ordinary authenticated user calling /api/v1/audit/verify must receive 403."""
    token = two_studies_setup["tokens"]["ordinary"]
    res = await client.get(
        "/api/v1/audit/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "audit:read" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_verify_government_super_admin_forbidden_returns_403(
    client: AsyncClient, two_studies_setup: dict
):
    """Government Verification Super Admin cannot verify global technical audit chain (must receive 403)."""
    token = two_studies_setup["tokens"]["gov_super_admin"]
    res = await client.get(
        "/api/v1/audit/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "audit:read" in res.json()["detail"]


# ---------------------------------------------------------------------------
# F02: Authorized Global Audit Reader Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_audit_logs_technical_system_admin_permitted_returns_200(
    client: AsyncClient, admin_token: str, two_studies_setup: dict
):
    """Technical System Administrator can retrieve unscoped global audit logs across all studies."""
    res = await client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 5

    resource_ids = {item["resource_id"] for item in data}
    assert str(two_studies_setup["study_a"].id) in resource_ids
    assert str(two_studies_setup["study_b"].id) in resource_ids


@pytest.mark.asyncio
async def test_audit_logs_global_auditor_with_audit_read_permission_returns_200(
    client: AsyncClient, two_studies_setup: dict
):
    """User holding explicit audit:read permission can retrieve unscoped global audit logs."""
    token = two_studies_setup["tokens"]["auditor"]
    res = await client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 5


@pytest.mark.asyncio
async def test_audit_verify_technical_system_admin_returns_200(
    client: AsyncClient, admin_token: str, two_studies_setup: dict
):
    """Technical System Administrator can verify the global cryptographic audit chain."""
    res = await client.get(
        "/api/v1/audit/verify",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["verified_records"] >= 1


@pytest.mark.asyncio
async def test_audit_verify_global_auditor_returns_200(
    client: AsyncClient, two_studies_setup: dict
):
    """User holding explicit audit:read permission can verify the cryptographic audit chain."""
    token = two_studies_setup["tokens"]["auditor"]
    res = await client.get(
        "/api/v1/audit/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True


# ---------------------------------------------------------------------------
# F02: Study-Scoped Access & Cross-Study Data Isolation Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_audit_logs_study_scoped_user_permitted_for_own_study(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Study A investigator querying Study A audit logs receives 200 with strictly isolated data.
    Logs from Study B must NOT appear in the response.
    """
    token_a = two_studies_setup["tokens"]["user_a"]
    study_a = two_studies_setup["study_a"]
    study_b = two_studies_setup["study_b"]

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=study&resource_id={study_a.id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1

    # Verify every returned record belongs exclusively to Study A
    for record in data:
        assert record["resource_id"] == str(study_a.id)
        assert record["resource_id"] != str(study_b.id)


@pytest.mark.asyncio
async def test_audit_logs_study_scoped_user_forbidden_for_other_study(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Study A investigator attempting to query Study B audit logs must receive HTTP 403 Forbidden.
    """
    token_a = two_studies_setup["tokens"]["user_a"]
    study_b = two_studies_setup["study_b"]

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=study&resource_id={study_b.id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res.status_code == 403
    assert "authorized for this study" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_study_scoped_user_bypass_omitted_filter_forbidden_returns_403(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Study-scoped investigator attempting to bypass scoping by omitting resource_id must receive 403.
    """
    token_a = two_studies_setup["tokens"]["user_a"]

    # Omitting resource_id while passing resource_type=study
    res = await client.get(
        "/api/v1/audit/logs?resource_type=study",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res.status_code == 403
    assert "audit:read" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_study_scoped_user_permitted_for_own_participant(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Study A investigator querying audit logs for a participant in Study A receives 200.
    """
    token_a = two_studies_setup["tokens"]["user_a"]
    part_a = two_studies_setup["participant_a"]

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=participant&resource_id={part_a.id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["resource_id"] == str(part_a.id)


@pytest.mark.asyncio
async def test_audit_logs_study_scoped_user_forbidden_for_other_participant(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Study A investigator attempting to query audit logs for a participant in Study B must receive 403.
    """
    token_a = two_studies_setup["tokens"]["user_a"]
    part_b = two_studies_setup["participant_b"]

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=participant&resource_id={part_b.id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res.status_code == 403
    assert "authorized study" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_study_scoped_user_forbidden_for_unrelated_site(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Study A investigator attempting to query audit logs for Site B (not associated with Study A) must receive 403.
    """
    token_a = two_studies_setup["tokens"]["user_a"]
    site_b = two_studies_setup["site_b"]

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=site&resource_id={site_b.id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res.status_code == 403
    assert "associated with an authorized study" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_study_scoped_user_forbidden_for_system_entity_types(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Study-scoped investigator attempting to query system-level audit logs (e.g. user, role) must receive 403.
    """
    token_a = two_studies_setup["tokens"]["user_a"]
    random_user_id = uuid.uuid4()

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=user&resource_id={random_user_id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res.status_code == 403
    assert "audit:read" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_pagination_and_filtering_for_authorized_users(
    client: AsyncClient, admin_token: str
):
    """
    Authorized global auditor testing skip, limit, and action filters.
    """
    # Test action filtering
    res_action = await client.get(
        "/api/v1/audit/logs?action=study.create",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_action.status_code == 200
    for record in res_action.json():
        assert record["action"] == "study.create"

    # Test limit filtering
    res_limit = await client.get(
        "/api/v1/audit/logs?limit=2",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_limit.status_code == 200
    assert len(res_limit.json()) <= 2
