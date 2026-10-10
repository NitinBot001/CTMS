from __future__ import annotations

import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
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

    # 5. Global Platform Auditor (User with explicit audit:read on a system-scoped role)
    auditor_user = User(
        email="global.auditor@clinicalqa.org",
        full_name="Global QA Auditor",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    auditor_role = Role(
        name="Global System Auditor",
        scope_level=ScopeLevel.system,
        is_system_role=True,
    )
    audit_perm = Permission(
        codename="audit:read",
        resource="audit",
        action="read",
        description="Inspect cryptographic audit trail",
    )
    central_audit_org = Organization(
        name="Central Platform Audit Authority",
        organization_type=OrganizationType.institution,
        status=OrganizationStatus.active,
        registration_number="INST-CENTRAL-AUDIT-01",
        is_platform_authority=True,
    )
    db_session.add_all([auditor_user, auditor_role, audit_perm, central_audit_org])
    await db_session.flush()

    rp_audit = RolePermission(role_id=auditor_role.id, permission_id=audit_perm.id)
    auditor_membership = OrganizationMember(
        organization_id=central_audit_org.id,
        user_id=auditor_user.id,
        role_id=auditor_role.id,
        status=AssignmentStatus.active,
    )
    db_session.add_all([rp_audit, auditor_membership])
    await db_session.flush()

    # 5a. Tenant member in Sponsor Org A with an incorrectly assigned system role
    tenant_imposter_user = User(
        email="tenant.imposter@sponsoralpha.org",
        full_name="Tenant Imposter User",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(tenant_imposter_user)
    await db_session.flush()

    tenant_imposter_membership = OrganizationMember(
        organization_id=org_a.id,  # Tenant organization!
        user_id=tenant_imposter_user.id,
        role_id=auditor_role.id,  # System-scoped role attached to tenant member
        status=AssignmentStatus.active,
    )
    db_session.add(tenant_imposter_membership)
    await db_session.flush()

    # 5b. Organization-Scoped Auditor (Role scoped to organization, not system)
    org_auditor_user = User(
        email="org.auditor@sponsoralpha.org",
        full_name="Org QA Auditor Alpha",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    org_auditor_role = Role(
        name="Organization Auditor Alpha",
        scope_level=ScopeLevel.organization,
        is_system_role=False,
    )
    db_session.add_all([org_auditor_user, org_auditor_role])
    await db_session.flush()

    rp_org_audit = RolePermission(role_id=org_auditor_role.id, permission_id=audit_perm.id)
    org_auditor_membership = OrganizationMember(
        organization_id=org_a.id,
        user_id=org_auditor_user.id,
        role_id=org_auditor_role.id,
        status=AssignmentStatus.active,
    )
    db_session.add_all([rp_org_audit, org_auditor_membership])
    await db_session.flush()

    # 5c. Study-Scoped Auditor (Role scoped to Study A)
    study_auditor_user = User(
        email="study.auditor@studyalpha.org",
        full_name="Study Monitor Auditor Alpha",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    study_auditor_role = Role(
        name="Study Auditor Alpha",
        scope_level=ScopeLevel.study,
        is_system_role=False,
    )
    db_session.add_all([study_auditor_user, study_auditor_role])
    await db_session.flush()

    rp_study_audit = RolePermission(role_id=study_auditor_role.id, permission_id=audit_perm.id)
    study_auditor_membership = OrganizationMember(
        organization_id=org_a.id,
        user_id=study_auditor_user.id,
        role_id=study_auditor_role.id,
        status=AssignmentStatus.active,
    )
    study_auditor_assignment = StudyTeamMember(
        study_id=study_a.id,
        user_id=study_auditor_user.id,
        role_id=study_auditor_role.id,
        assignment_status=AssignmentStatus.active,
    )
    db_session.add_all([rp_study_audit, study_auditor_membership, study_auditor_assignment])
    await db_session.flush()

    # 5d. Shared Site linked to BOTH Study A and Study B
    shared_site = Site(
        site_code="SITE-SHARED-01",
        name="Shared Regional Research Hospital",
        site_type=SiteType.hospital,
        status=SiteStatus.active,
        city="New Delhi",
        state="Delhi",
        organization_id=org_a.id,
    )
    db_session.add(shared_site)
    await db_session.flush()

    study_site_shared_a = StudySite(
        study_id=study_a.id,
        site_id=shared_site.id,
        activation_status=StudySiteActivationStatus.activated,
    )
    study_site_shared_b = StudySite(
        study_id=study_b.id,
        site_id=shared_site.id,
        activation_status=StudySiteActivationStatus.activated,
    )
    db_session.add_all([study_site_shared_a, study_site_shared_b])
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
    log_shared_site_a = await AuditService.create_audit_log(
        db=db_session,
        user_id=user_a.id,
        action="site.study_event",
        resource_type="site",
        resource_id=shared_site.id,
        changes={"study_id": str(study_a.id), "event": "Study Alpha Site Initiation"},
    )
    log_shared_site_b = await AuditService.create_audit_log(
        db=db_session,
        user_id=user_b.id,
        action="site.study_event",
        resource_type="site",
        resource_id=shared_site.id,
        changes={"study_id": str(study_b.id), "event": "Study Beta Site Initiation"},
    )
    log_shared_site_ambiguous = await AuditService.create_audit_log(
        db=db_session,
        user_id=user_a.id,
        action="site.update",
        resource_type="site",
        resource_id=shared_site.id,
        changes={"name": "Shared Regional Research Hospital Updated"},
    )
    await db_session.commit()

    tokens = {
        "user_a": create_access_token({"sub": str(user_a.id), "email": user_a.email}),
        "user_b": create_access_token({"sub": str(user_b.id), "email": user_b.email}),
        "auditor": create_access_token({"sub": str(auditor_user.id), "email": auditor_user.email}),
        "org_auditor": create_access_token({"sub": str(org_auditor_user.id), "email": org_auditor_user.email}),
        "study_auditor": create_access_token({"sub": str(study_auditor_user.id), "email": study_auditor_user.email}),
        "ordinary": create_access_token({"sub": str(ordinary_user.id), "email": ordinary_user.email}),
        "gov_super_admin": create_access_token({"sub": str(gov_super_admin.id), "email": gov_super_admin.email}),
        "tenant_imposter": create_access_token({"sub": str(tenant_imposter_user.id), "email": tenant_imposter_user.email}),
    }

    return {
        "org_a": org_a,
        "org_b": org_b,
        "central_audit_org": central_audit_org,
        "study_a": study_a,
        "study_b": study_b,
        "site_a": site_a,
        "site_b": site_b,
        "shared_site": shared_site,
        "participant_a": participant_a,
        "participant_b": participant_b,
        "auditor_role": auditor_role,
        "tenant_imposter_user": tenant_imposter_user,
        "tokens": tokens,
        "logs": {
            "study_a": log_study_a,
            "part_a": log_part_a,
            "study_b": log_study_b,
            "part_b": log_part_b,
            "user_sys": log_user_sys,
            "shared_site_a": log_shared_site_a,
            "shared_site_b": log_shared_site_b,
            "shared_site_ambiguous": log_shared_site_ambiguous,
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
    Study A authorized auditor querying Study A audit logs receives 200 with strictly isolated data.
    Logs from Study B must NOT appear in the response.
    """
    token = two_studies_setup["tokens"]["study_auditor"]
    study_a = two_studies_setup["study_a"]
    study_b = two_studies_setup["study_b"]

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=study&resource_id={study_a.id}",
        headers={"Authorization": f"Bearer {token}"},
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
    Study A authorized auditor attempting to query Study B audit logs must receive HTTP 403 Forbidden.
    """
    token = two_studies_setup["tokens"]["study_auditor"]
    study_b = two_studies_setup["study_b"]

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=study&resource_id={study_b.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "authorized for this study" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_study_scoped_user_bypass_omitted_filter_forbidden_returns_403(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Study-scoped auditor attempting to bypass scoping by omitting resource_id must receive 403.
    """
    token = two_studies_setup["tokens"]["study_auditor"]

    # Omitting resource_id while passing resource_type=study
    res = await client.get(
        "/api/v1/audit/logs?resource_type=study",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "audit:read" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_study_scoped_user_permitted_for_own_participant(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Study A auditor querying audit logs for a participant in Study A receives 200.
    """
    token = two_studies_setup["tokens"]["study_auditor"]
    part_a = two_studies_setup["participant_a"]

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=participant&resource_id={part_a.id}",
        headers={"Authorization": f"Bearer {token}"},
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
    Study A auditor attempting to query audit logs for a participant in Study B must receive 403.
    """
    token = two_studies_setup["tokens"]["study_auditor"]
    part_b = two_studies_setup["participant_b"]

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=participant&resource_id={part_b.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "authorized study" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_study_scoped_user_forbidden_for_unrelated_site(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Study A auditor attempting to query audit logs for Site B (not associated with Study A) must receive 403.
    """
    token = two_studies_setup["tokens"]["study_auditor"]
    site_b = two_studies_setup["site_b"]

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=site&resource_id={site_b.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "associated with an authorized study" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_study_scoped_user_forbidden_for_system_entity_types(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Study-scoped auditor attempting to query system-level audit logs (e.g. user, role) must receive 403.
    """
    token = two_studies_setup["tokens"]["study_auditor"]
    random_user_id = uuid.uuid4()

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=user&resource_id={random_user_id}",
        headers={"Authorization": f"Bearer {token}"},
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


# ---------------------------------------------------------------------------
# F02B: Adversarial Scope & Shared-Site Isolation Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_audit_logs_study_scoped_auditor_cannot_list_global_logs_returns_403(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Study-scoped role with audit:read (assigned only to Study A) must not thereby grant global access.
    Querying /api/v1/audit/logs without resource scoping must receive HTTP 403 Forbidden.
    """
    token = two_studies_setup["tokens"]["study_auditor"]
    res = await client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "audit:read" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_verify_study_scoped_auditor_forbidden_returns_403(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Study-scoped role with audit:read must NOT be able to call global /api/v1/audit/verify.
    Must receive HTTP 403 Forbidden.
    """
    token = two_studies_setup["tokens"]["study_auditor"]
    res = await client.get(
        "/api/v1/audit/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "audit:read" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_organization_scoped_auditor_cannot_list_global_logs_returns_403(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Organization-scoped role with audit:read must not grant cross-tenant global audit access.
    Querying /api/v1/audit/logs without resource scoping must receive HTTP 403 Forbidden.
    """
    token = two_studies_setup["tokens"]["org_auditor"]
    res = await client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "audit:read" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_verify_organization_scoped_auditor_forbidden_returns_403(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Organization-scoped role with audit:read must NOT be able to call global /api/v1/audit/verify.
    Must receive HTTP 403 Forbidden.
    """
    token = two_studies_setup["tokens"]["org_auditor"]
    res = await client.get(
        "/api/v1/audit/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "audit:read" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_organization_scoped_auditor_cannot_access_unrelated_tenant_returns_403(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Organization-scoped auditor in Org A cannot access Study B (belonging to Org B).
    Must receive HTTP 403 Forbidden.
    """
    token = two_studies_setup["tokens"]["org_auditor"]
    study_b = two_studies_setup["study_b"]

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=study&resource_id={study_b.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "authorized for this study" in res.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_shared_site_does_not_leak_inaccessible_study_events(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Shared site linked to both Study A and Study B:
    When Study A caller queries audit logs for the shared site,
    events belonging to Study B and ambiguous unseparated site events MUST NOT leak.
    Only events explicitly tied to Study A are returned.
    """
    token = two_studies_setup["tokens"]["study_auditor"]
    shared_site = two_studies_setup["shared_site"]
    log_shared_a = two_studies_setup["logs"]["shared_site_a"]
    log_shared_b = two_studies_setup["logs"]["shared_site_b"]
    log_shared_ambiguous = two_studies_setup["logs"]["shared_site_ambiguous"]

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=site&resource_id={shared_site.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    returned_logs = res.json()
    assert isinstance(returned_logs, list)

    returned_ids = {item["id"] for item in returned_logs}
    # Study A event MUST be present
    assert str(log_shared_a.id) in returned_ids
    # Study B event MUST NOT be leaked
    assert str(log_shared_b.id) not in returned_ids
    # Ambiguous site-level event on shared site MUST NOT be leaked
    assert str(log_shared_ambiguous.id) not in returned_ids


@pytest.mark.asyncio
async def test_audit_logs_shared_site_global_auditor_sees_all_events(
    client: AsyncClient, two_studies_setup: dict
):
    """
    A genuine global auditor querying the shared site can inspect all records across both studies.
    """
    token = two_studies_setup["tokens"]["auditor"]
    shared_site = two_studies_setup["shared_site"]
    log_shared_a = two_studies_setup["logs"]["shared_site_a"]
    log_shared_b = two_studies_setup["logs"]["shared_site_b"]
    log_shared_ambiguous = two_studies_setup["logs"]["shared_site_ambiguous"]

    res = await client.get(
        f"/api/v1/audit/logs?resource_type=site&resource_id={shared_site.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    returned_logs = res.json()

    returned_ids = {item["id"] for item in returned_logs}
    assert str(log_shared_a.id) in returned_ids
    assert str(log_shared_b.id) in returned_ids
    assert str(log_shared_ambiguous.id) in returned_ids


# ---------------------------------------------------------------------------
# F02C: Final Audit Authorization Boundary Verification Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_audit_logs_study_assigned_user_without_audit_read_forbidden_returns_403(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Test 1: Study-assigned user (e.g. investigator, nurse, coordinator) WITHOUT explicit
    audit:read permission MUST NOT gain audit log access merely by study assignment.
    Must receive HTTP 403 Forbidden across study, participant, and site endpoints.
    """
    token_investigator = two_studies_setup["tokens"]["user_a"]
    study_a = two_studies_setup["study_a"]
    part_a = two_studies_setup["participant_a"]
    shared_site = two_studies_setup["shared_site"]

    # 1. Attempt reading study audit logs
    res_study = await client.get(
        f"/api/v1/audit/logs?resource_type=study&resource_id={study_a.id}",
        headers={"Authorization": f"Bearer {token_investigator}"},
    )
    assert res_study.status_code == 403
    assert "authorized for this study" in res_study.json()["detail"]

    # 2. Attempt reading participant audit logs
    res_part = await client.get(
        f"/api/v1/audit/logs?resource_type=participant&resource_id={part_a.id}",
        headers={"Authorization": f"Bearer {token_investigator}"},
    )
    assert res_part.status_code == 403
    assert "authorized study" in res_part.json()["detail"]

    # 3. Attempt reading site audit logs
    res_site = await client.get(
        f"/api/v1/audit/logs?resource_type=site&resource_id={shared_site.id}",
        headers={"Authorization": f"Bearer {token_investigator}"},
    )
    assert res_site.status_code == 403
    assert "associated with an authorized study" in res_site.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_study_scoped_auditor_can_read_assigned_study_only(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Test 2: Study-scoped auditor with explicit audit:read on Study A:
    - CAN read audit logs for Study A (HTTP 200).
    - CANNOT read audit logs for Study B (HTTP 403 Forbidden).
    - CANNOT read unscoped global audit logs (HTTP 403 Forbidden).
    """
    token_study_auditor = two_studies_setup["tokens"]["study_auditor"]
    study_a = two_studies_setup["study_a"]
    study_b = two_studies_setup["study_b"]

    # 1. Permitted on assigned Study A
    res_a = await client.get(
        f"/api/v1/audit/logs?resource_type=study&resource_id={study_a.id}",
        headers={"Authorization": f"Bearer {token_study_auditor}"},
    )
    assert res_a.status_code == 200
    assert len(res_a.json()) >= 1

    # 2. Forbidden on unassigned Study B
    res_b = await client.get(
        f"/api/v1/audit/logs?resource_type=study&resource_id={study_b.id}",
        headers={"Authorization": f"Bearer {token_study_auditor}"},
    )
    assert res_b.status_code == 403
    assert "authorized for this study" in res_b.json()["detail"]

    # 3. Forbidden on unscoped global logs
    res_global = await client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {token_study_auditor}"},
    )
    assert res_global.status_code == 403


@pytest.mark.asyncio
async def test_audit_logs_org_scoped_auditor_cannot_read_other_org_records(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Test 3: Organization-scoped auditor with audit:read on Org A:
    - CAN read audit records of studies sponsored by Org A (HTTP 200).
    - CANNOT read audit records of studies sponsored by Org B (HTTP 403 Forbidden).
    - CANNOT read participant logs in Org B (HTTP 403 Forbidden).
    """
    token_org_auditor = two_studies_setup["tokens"]["org_auditor"]
    study_a = two_studies_setup["study_a"]
    study_b = two_studies_setup["study_b"]
    part_b = two_studies_setup["participant_b"]

    # 1. Permitted for Study A (sponsored by Org A)
    res_a = await client.get(
        f"/api/v1/audit/logs?resource_type=study&resource_id={study_a.id}",
        headers={"Authorization": f"Bearer {token_org_auditor}"},
    )
    assert res_a.status_code == 200

    # 2. Forbidden for Study B (sponsored by Org B)
    res_b = await client.get(
        f"/api/v1/audit/logs?resource_type=study&resource_id={study_b.id}",
        headers={"Authorization": f"Bearer {token_org_auditor}"},
    )
    assert res_b.status_code == 403
    assert "authorized for this study" in res_b.json()["detail"]

    # 3. Forbidden for participant in Study B
    res_part = await client.get(
        f"/api/v1/audit/logs?resource_type=participant&resource_id={part_b.id}",
        headers={"Authorization": f"Bearer {token_org_auditor}"},
    )
    assert res_part.status_code == 403
    assert "authorized study" in res_part.json()["detail"]


@pytest.mark.asyncio
async def test_audit_logs_tenant_member_cannot_obtain_global_audit_access_returns_403(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Test 4: A tenant OrganizationMember (sponsor/CRO) with an attached system-scoped role
    MUST NOT be treated as a platform-level grant.
    Must receive HTTP 403 Forbidden on both unscoped /audit/logs and /audit/verify.
    """
    token_tenant_imposter = two_studies_setup["tokens"]["tenant_imposter"]

    # 1. Unscoped global audit logs attempt
    res_logs = await client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {token_tenant_imposter}"},
    )
    assert res_logs.status_code == 403
    assert "audit:read" in res_logs.json()["detail"]

    # 2. Cryptographic audit chain verification attempt
    res_verify = await client.get(
        "/api/v1/audit/verify",
        headers={"Authorization": f"Bearer {token_tenant_imposter}"},
    )
    assert res_verify.status_code == 403
    assert "audit:read" in res_verify.json()["detail"]


@pytest.mark.asyncio
async def test_ordinary_org_admin_cannot_assign_system_role_via_org_members_api(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Test 5a: Ordinary organization administrator cannot assign a system-scoped or platform role
    through POST /api/v1/organizations/{org_id}/members.
    Must receive HTTP 403 Forbidden.
    """
    token_caller = two_studies_setup["tokens"]["user_a"]  # Member of Org A, but ordinary user
    org_a = two_studies_setup["org_a"]
    auditor_role = two_studies_setup["auditor_role"]  # System-scoped role

    target_user_id = uuid.uuid4()

    res = await client.post(
        f"/api/v1/organizations/{org_a.id}/members",
        json={
            "user_id": str(target_user_id),
            "role_id": str(auditor_role.id),
        },
        headers={"Authorization": f"Bearer {token_caller}"},
    )
    assert res.status_code == 403
    assert "platform or system-level roles" in res.json()["detail"]


@pytest.mark.asyncio
async def test_ordinary_study_admin_cannot_assign_system_role_via_study_team_api(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Test 5b: Ordinary study team manager cannot assign a system-scoped role
    through POST /api/v1/studies/{study_id}/team.
    Must receive HTTP 403 Forbidden.
    """
    token_caller = two_studies_setup["tokens"]["study_auditor"]  # Has study access to Study A
    study_a = two_studies_setup["study_a"]
    auditor_role = two_studies_setup["auditor_role"]  # System-scoped role

    target_user_id = uuid.uuid4()

    res = await client.post(
        f"/api/v1/studies/{study_a.id}/team",
        json={
            "user_id": str(target_user_id),
            "role_id": str(auditor_role.id),
        },
        headers={"Authorization": f"Bearer {token_caller}"},
    )
    assert res.status_code == 403
    assert "platform or system-level roles" in res.json()["detail"]


@pytest.mark.asyncio
async def test_technical_system_admin_and_global_auditor_retain_intended_access(
    client: AsyncClient, admin_token: str, two_studies_setup: dict, db_session: AsyncSession
):
    """
    Test 6:
    - Technical System Administrator retains global audit read and chain verification access.
    - Technical System Administrator can assign roles via POST /organizations/{org_id}/members.
    - Explicitly authorized global auditor (institution member with system role) retains global access.
    """
    token_global_auditor = two_studies_setup["tokens"]["auditor"]
    org_a = two_studies_setup["org_a"]
    auditor_role = two_studies_setup["auditor_role"]

    # 1. Global Auditor can read global logs
    res_aud_logs = await client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {token_global_auditor}"},
    )
    assert res_aud_logs.status_code == 200

    # 2. Global Auditor can verify audit chain
    res_aud_verify = await client.get(
        "/api/v1/audit/verify",
        headers={"Authorization": f"Bearer {token_global_auditor}"},
    )
    assert res_aud_verify.status_code == 200

    # 3. Technical System Admin can read global logs
    res_admin_logs = await client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_admin_logs.status_code == 200

    # 4. Technical System Admin can verify audit chain
    res_admin_verify = await client.get(
        "/api/v1/audit/verify",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_admin_verify.status_code == 200

    # 5. Technical System Admin CAN assign members via organizations API (system role to platform authority)
    central_org = two_studies_setup["central_audit_org"]
    new_user = User(
        email="new.sys.assignee@clinicalqa.org",
        full_name="New System Assignee",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(new_user)
    await db_session.flush()

    res_assign = await client.post(
        f"/api/v1/organizations/{central_org.id}/members",
        json={
            "user_id": str(new_user.id),
            "role_id": str(auditor_role.id),
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_assign.status_code == 201
    assert res_assign.json()["user_id"] == str(new_user.id)


@pytest.mark.asyncio
async def test_ordinary_institution_member_with_audit_read_cannot_access_global_audit_logs(
    client: AsyncClient, two_studies_setup: dict, db_session: AsyncSession
):
    """
    Scenario 1, 2, 3:
    1. An ordinary institution named 'Central Ayurveda Hospital' receives no platform privileges merely because of its name.
    2. An organization whose registration number contains 'PLATFORM' or 'AYUCTMS' receives no platform privileges merely because of that value.
    3. An ordinary institution member with 'audit:read' remains unable to access unscoped global audit logs or /audit/verify.
    """
    # 1. Create an ordinary clinical research institution with deceptive keywords in name AND registration number
    heuristic_inst = Organization(
        name="Central Ayurveda Hospital and Research Center",
        organization_type=OrganizationType.institution,
        status=OrganizationStatus.active,
        registration_number="AYUCTMS-PLATFORM-GOV-9999",
        is_platform_authority=False,  # Explicitly ordinary tenant institution!
    )
    # Role scoped to organization with audit:read
    inst_auditor_role = Role(
        name="Institutional Auditor Central Hospital",
        scope_level=ScopeLevel.organization,
        is_system_role=False,
    )
    inst_user = User(
        email="inst.auditor@centralhospital.org",
        full_name="Central Hospital Site Auditor",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add_all([heuristic_inst, inst_auditor_role, inst_user])
    await db_session.flush()

    audit_perm = (
        await db_session.execute(
            select(Permission).where(Permission.codename == "audit:read")
        )
    ).scalars().first()
    assert audit_perm is not None
    rp = RolePermission(role_id=inst_auditor_role.id, permission_id=audit_perm.id)
    membership = OrganizationMember(
        organization_id=heuristic_inst.id,
        user_id=inst_user.id,
        role_id=inst_auditor_role.id,
        status=AssignmentStatus.active,
    )
    db_session.add_all([rp, membership])
    await db_session.commit()

    token = create_access_token({"sub": str(inst_user.id), "email": inst_user.email})

    # Unscoped global audit logs attempt -> 403 Forbidden
    res_logs = await client.get("/api/v1/audit/logs", headers={"Authorization": f"Bearer {token}"})
    assert res_logs.status_code == 403
    assert "audit:read" in res_logs.json()["detail"]

    # Global hash chain verification attempt -> 403 Forbidden
    res_verify = await client.get("/api/v1/audit/verify", headers={"Authorization": f"Bearer {token}"})
    assert res_verify.status_code == 403
    assert "audit:read" in res_verify.json()["detail"]


@pytest.mark.asyncio
async def test_tenant_member_with_improperly_attached_system_role_cannot_bypass_platform_boundary(
    client: AsyncClient, db_session: AsyncSession, two_studies_setup: dict, admin_token: str
):
    """
    Scenario 4:
    A tenant member carrying an improperly attached system-scoped role cannot bypass the trusted platform boundary:
    - is_system_admin is False
    - is_technical_system_admin is False
    - has_global_audit_permission is False
    - get_user_permissions does not grant wildcard * or system role permissions
    - GET /api/v1/audit/logs returns 403
    - GET /api/v1/audit/verify returns 403
    - GET /api/v1/users returns 403
    - POST /api/v1/organizations/{org_id}/members cannot assign system-level role to a tenant organization (400)
    """
    org_a = two_studies_setup["org_a"]  # Tenant organization
    auditor_role = two_studies_setup["auditor_role"]  # System-scoped role ("Global System Auditor")

    # 1. Imposter user with improperly attached system role on tenant organization
    imposter_user = User(
        email="tenant.backdoor@sponsoralpha.org",
        full_name="Tenant Backdoor Imposter",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(imposter_user)
    await db_session.flush()

    imposter_membership = OrganizationMember(
        organization_id=org_a.id,  # Tenant organization!
        user_id=imposter_user.id,
        role_id=auditor_role.id,  # System role attached to tenant member
        status=AssignmentStatus.active,
    )
    db_session.add(imposter_membership)
    await db_session.commit()

    token_imposter = create_access_token({"sub": str(imposter_user.id), "email": imposter_user.email})

    # Unscoped global audit logs attempt -> 403
    res_logs = await client.get("/api/v1/audit/logs", headers={"Authorization": f"Bearer {token_imposter}"})
    assert res_logs.status_code == 403

    # Global hash chain verification attempt -> 403
    res_verify = await client.get("/api/v1/audit/verify", headers={"Authorization": f"Bearer {token_imposter}"})
    assert res_verify.status_code == 403

    # User directory listing attempt -> 403
    res_users = await client.get("/api/v1/users", headers={"Authorization": f"Bearer {token_imposter}"})
    assert res_users.status_code == 403

    # 2. Assignment API prevention: even System Admin cannot assign system role to tenant organization
    another_user = User(
        email="assignee.test@sponsoralpha.org",
        full_name="Assignee Test",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(another_user)
    await db_session.commit()

    res_assign_sys = await client.post(
        f"/api/v1/organizations/{org_a.id}/members",
        json={"user_id": str(another_user.id), "role_id": str(auditor_role.id)},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_assign_sys.status_code == 400
    assert "trusted platform authority" in res_assign_sys.json()["detail"]


@pytest.mark.asyncio
async def test_ordinary_tenant_user_cannot_obtain_system_role_through_team_invitations_or_onboarding(
    client: AsyncClient, two_studies_setup: dict
):
    """
    Scenario 2 (Alternate Assignment Paths):
    An ordinary tenant user cannot obtain a system role through alternate assignment/approval paths:
    - POST /api/v1/platform/team-invitations rejecting reserved or system roles
    - POST /api/v1/platform/onboarding-requests rejecting reserved system roles
    """
    token_caller = two_studies_setup["tokens"]["user_a"]
    org_a = two_studies_setup["org_a"]

    # 1. Attempt to invite a team member with "System Administrator" role -> 400
    res_invite_sys = await client.post(
        "/api/v1/platform/team-invitations",
        json={
            "full_name": "Injected System Admin",
            "email": "injected.sysadmin@example.org",
            "requested_role": "System Administrator",
            "organization_id": str(org_a.id),
        },
        headers={"Authorization": f"Bearer {token_caller}"},
    )
    assert res_invite_sys.status_code == 400
    assert "platform or system-level roles" in res_invite_sys.json()["detail"]

    # 2. Attempt to invite a team member with "Global System Auditor" role -> 400
    res_invite_aud = await client.post(
        "/api/v1/platform/team-invitations",
        json={
            "full_name": "Injected Auditor",
            "email": "injected.auditor@example.org",
            "requested_role": "Global System Auditor",
            "organization_id": str(org_a.id),
        },
        headers={"Authorization": f"Bearer {token_caller}"},
    )
    assert res_invite_aud.status_code == 400
    assert "platform or system-level roles" in res_invite_aud.json()["detail"]

    # 3. Attempt to submit onboarding request requesting "System Administrator" role -> 400
    res_onboard = await client.post(
        "/api/v1/platform/onboarding-requests",
        json={
            "applicant_name": "Malicious Applicant",
            "organization_name": "Rogue Entity",
            "organization_type": "cro",
            "email": "rogue@entity.org",
            "requested_role": "System Administrator",
        },
    )
    assert res_onboard.status_code == 400
    assert "platform or system-level roles" in res_onboard.json()["detail"]


@pytest.mark.asyncio
async def test_config_based_trusted_platform_organization_identifier_supported(
    client: AsyncClient, db_session: AsyncSession, monkeypatch
):
    """
    Scenario 5:
    Configuration-based trusted platform authority identifier (settings.PLATFORM_ORGANIZATION_ID)
    is recognized, and when not configured, fails closed.
    """
    from app.core.config import get_settings

    # Create an organization that does NOT have is_platform_authority=True in DB
    config_org = Organization(
        name="Platform Authority Configured via Env",
        organization_type=OrganizationType.institution,
        status=OrganizationStatus.active,
        registration_number="REG-CONFIG-001",
        is_platform_authority=False,  # Not marked in DB!
    )
    config_user = User(
        email="env.admin@ayuctms.gov.in",
        full_name="Env Bootstrapped Admin",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    sys_role = Role(
        name="Config Platform Admin",
        scope_level=ScopeLevel.system,
        is_system_role=True,
    )
    db_session.add_all([config_org, config_user, sys_role])
    await db_session.flush()

    audit_perm = (
        await db_session.execute(
            select(Permission).where(Permission.codename == "audit:read")
        )
    ).scalars().first()
    if not audit_perm:
        audit_perm = Permission(codename="audit:read", resource="audit", action="read", description="Audit read")
        db_session.add(audit_perm)
        await db_session.flush()
    rp = RolePermission(role_id=sys_role.id, permission_id=audit_perm.id)
    mem = OrganizationMember(
        organization_id=config_org.id,
        user_id=config_user.id,
        role_id=sys_role.id,
        status=AssignmentStatus.active,
    )
    db_session.add_all([rp, mem])
    await db_session.commit()

    token = create_access_token({"sub": str(config_user.id), "email": config_user.email})

    # Without PLATFORM_ORGANIZATION_ID configured -> FAILS CLOSED (403)
    res_before = await client.get("/api/v1/audit/logs", headers={"Authorization": f"Bearer {token}"})
    assert res_before.status_code == 403

    # Now configure PLATFORM_ORGANIZATION_ID to match config_org.id
    current_settings = get_settings()
    monkeypatch.setattr(current_settings, "PLATFORM_ORGANIZATION_ID", str(config_org.id))

    # With PLATFORM_ORGANIZATION_ID configured to correct org -> SUCCEEDS (200)
    res_after = await client.get("/api/v1/audit/logs", headers={"Authorization": f"Bearer {token}"})
    assert res_after.status_code == 200

    # With mismatched PLATFORM_ORGANIZATION_ID configured -> FAILS CLOSED (403)
    monkeypatch.setattr(current_settings, "PLATFORM_ORGANIZATION_ID", str(uuid.uuid4()))
    res_mismatched = await client.get("/api/v1/audit/logs", headers={"Authorization": f"Bearer {token}"})
    assert res_mismatched.status_code == 403


@pytest.mark.asyncio
async def test_tenant_api_cannot_set_or_update_is_platform_authority(
    client: AsyncClient, db_session: AsyncSession, admin_token: str
):
    """
    Ensure ordinary signup, onboarding, organization creation/update, invitations,
    and tenant administration cannot create or modify the trusted platform identity.
    """
    # 1. Attempt to create organization with is_platform_authority=True in payload
    res_create = await client.post(
        "/api/v1/organizations",
        json={
            "name": "Sneaky Platform Org",
            "organization_type": "institution",
            "is_platform_authority": True,  # Attacker attempt
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_create.status_code == 201
    created_id = res_create.json()["id"]

    created_org = await db_session.get(Organization, uuid.UUID(created_id))
    assert created_org is not None
    assert created_org.is_platform_authority is False  # Must remain False!

    # 2. Attempt to update organization with is_platform_authority=True in PATCH payload
    res_patch = await client.patch(
        f"/api/v1/organizations/{created_id}",
        json={"is_platform_authority": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_patch.status_code == 200

    await db_session.refresh(created_org)
    assert created_org.is_platform_authority is False  # Must still remain False!

