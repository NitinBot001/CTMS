from __future__ import annotations

import datetime
from datetime import timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.enums import (
    AssignmentStatus,
    OrganizationStatus,
    OrganizationType,
    ScopeLevel,
    StudyPhase,
    StudyStatus,
    StudyType,
    UserStatus,
)
from app.models.organization import Organization, OrganizationMember
from app.models.study import Study, StudyTeamMember
from app.models.user import Permission, Role, RolePermission, SuperAdminProfile, User


@pytest.mark.asyncio
async def test_unauthenticated_requests_return_401(client: AsyncClient):
    # Verify unauthenticated requests to protected endpoints fail with 401
    res = await client.get("/api/v1/organizations")
    assert res.status_code == 401
    assert "WWW-Authenticate" in res.headers

    res = await client.get("/api/v1/studies")
    assert res.status_code == 401

    res = await client.get("/api/v1/audit/logs")
    assert res.status_code == 401

    res = await client.get("/api/v1/users")
    assert res.status_code == 401
    assert "WWW-Authenticate" in res.headers


@pytest.mark.asyncio
async def test_invalid_and_expired_tokens_return_401(client: AsyncClient):
    # Malformed token
    res = await client.get(
        "/api/v1/organizations",
        headers={"Authorization": "Bearer not-a-valid-jwt-token"},
    )
    assert res.status_code == 401

    # Expired token
    expired_token = create_access_token(
        {"sub": "00000000-0000-0000-0000-000000000001", "email": "test@test.com"},
        expires_delta=timedelta(seconds=-10),
    )
    res = await client.get(
        "/api/v1/organizations",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_auth_login_me_workflow(client: AsyncClient, db_session: AsyncSession):
    # 1. Create a user directly
    user = User(
        email="researcher.me@aiia.org",
        full_name="Dr. Clinical Researcher",
        status=UserStatus.active,
        hashed_password=hash_password("MySecurePass123!"),
    )
    db_session.add(user)
    await db_session.flush()

    role = Role(
        name="Clinical Researcher",
        scope_level=ScopeLevel.study,
        is_system_role=False,
    )
    org = Organization(
        name="AIIA Academic Center",
        organization_type=OrganizationType.institution,
        status=OrganizationStatus.active,
    )
    db_session.add_all([role, org])
    await db_session.flush()

    membership = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role_id=role.id,
        status=AssignmentStatus.active,
    )
    db_session.add(membership)
    await db_session.commit()

    # 2. Login with correct credentials
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "researcher.me@aiia.org", "password": "MySecurePass123!"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    assert token_data["user"]["email"] == "researcher.me@aiia.org"

    # 3. Call /auth/me with bearer token
    me_res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["user"]["email"] == "researcher.me@aiia.org"
    assert me_data["is_system_admin"] is False
    assert len(me_data["memberships"]) == 1
    assert me_data["memberships"][0]["organization_name"] == "AIIA Academic Center"


@pytest.mark.asyncio
async def test_auth_login_invalid_password(client: AsyncClient, db_session: AsyncSession):
    user = User(
        email="test.user@aiia.org",
        full_name="Test User",
        status=UserStatus.active,
        hashed_password=hash_password("CorrectPassword!"),
    )
    db_session.add(user)
    await db_session.commit()

    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "test.user@aiia.org", "password": "WrongPassword!"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_inactive_user_cannot_login(client: AsyncClient, db_session: AsyncSession):
    user = User(
        email="inactive.user@aiia.org",
        full_name="Inactive User",
        status=UserStatus.inactive,
        hashed_password=hash_password("Password123!"),
    )
    db_session.add(user)
    await db_session.commit()

    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "inactive.user@aiia.org", "password": "Password123!"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_rbac_study_scope_access(client: AsyncClient, db_session: AsyncSession):
    # 1. Create Sponsor Org, CRO Org, and Unrelated Org
    sponsor = Organization(
        name="Ayush Pharma Ltd",
        organization_type=OrganizationType.sponsor,
        status=OrganizationStatus.active,
    )
    unrelated_org = Organization(
        name="Unrelated Site Org",
        organization_type=OrganizationType.institution,
        status=OrganizationStatus.active,
    )
    db_session.add_all([sponsor, unrelated_org])
    await db_session.flush()

    # 2. Create Study under Sponsor
    study = Study(
        study_code="RBAC-EXP-01",
        protocol_number="PRT-RBAC-01",
        title="RBAC Scope Verification Trial",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_1,
        status=StudyStatus.active,
        sponsor_org_id=sponsor.id,
        therapeutic_area="Oncology",
    )
    db_session.add(study)
    await db_session.flush()

    # 3. Create User in Unrelated Org (not assigned to study)
    role = Role(name="Site Coordinator", scope_level=ScopeLevel.site, is_system_role=False)
    unrelated_user = User(
        email="coordinator@unrelated.org",
        full_name="Site Coordinator",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add_all([role, unrelated_user])
    await db_session.flush()

    mem = OrganizationMember(
        organization_id=unrelated_org.id,
        user_id=unrelated_user.id,
        role_id=role.id,
        status=AssignmentStatus.active,
    )
    db_session.add(mem)
    await db_session.commit()

    unrelated_token = create_access_token(
        {"sub": str(unrelated_user.id), "email": unrelated_user.email}
    )
    unrelated_headers = {"Authorization": f"Bearer {unrelated_token}"}

    # 4. Attempting to add a team member to study without access must return 403
    forbidden_res = await client.post(
        f"/api/v1/studies/{study.id}/team",
        json={
            "study_id": str(study.id),
            "user_id": str(unrelated_user.id),
            "role_id": str(role.id),
        },
        headers=unrelated_headers,
    )
    # Note: adding team members on study is protected
    assert forbidden_res.status_code in [403, 401]

    # 5. Now assign user to study team
    team_member = StudyTeamMember(
        study_id=study.id,
        user_id=unrelated_user.id,
        role_id=role.id,
        assignment_status=AssignmentStatus.active,
        start_date=datetime.date.today(),
    )
    db_session.add(team_member)
    await db_session.commit()

    # 6. User now has valid access to study team list
    allowed_res = await client.get(
        f"/api/v1/studies/{study.id}/team",
        headers=unrelated_headers,
    )
    assert allowed_res.status_code == 200
    team_data = allowed_res.json()
    assert len(team_data) == 1


# ---------------------------------------------------------------------------
# F01: User Directory Authorization Regression Tests (GET /api/v1/users)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_users_ordinary_user_forbidden_returns_403(
    client: AsyncClient, db_session: AsyncSession
):
    """An ordinary authenticated user without user:manage permission must be denied with HTTP 403."""
    user = User(
        email="nurse.ordinary@hospital.org",
        full_name="Nurse Sarah",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    role = Role(
        name="Site Nurse",
        scope_level=ScopeLevel.site,
        is_system_role=False,
    )
    org = Organization(
        name="General Hospital Site",
        organization_type=OrganizationType.institution,
        status=OrganizationStatus.active,
    )
    db_session.add_all([user, role, org])
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
    res = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "user:manage" in res.json()["detail"]


@pytest.mark.asyncio
async def test_list_users_with_user_manage_permission_returns_200(
    client: AsyncClient, db_session: AsyncSession
):
    """An authenticated user explicitly holding the user:manage permission must receive HTTP 200."""
    user = User(
        email="user.admin@institution.org",
        full_name="User Administrator",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    role = Role(
        name="User Manager",
        scope_level=ScopeLevel.organization,
        is_system_role=False,
    )
    perm = Permission(
        codename="user:manage",
        resource="users",
        action="manage",
        description="Manage users permission",
    )
    org = Organization(
        name="Clinical Operations Org",
        organization_type=OrganizationType.institution,
        status=OrganizationStatus.active,
    )
    db_session.add_all([user, role, perm, org])
    await db_session.flush()

    rp = RolePermission(role_id=role.id, permission_id=perm.id)
    membership = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role_id=role.id,
        status=AssignmentStatus.active,
    )
    db_session.add_all([rp, membership])
    await db_session.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    res = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(u["email"] == "user.admin@institution.org" for u in data)


@pytest.mark.asyncio
async def test_list_users_system_admin_returns_200(
    client: AsyncClient, admin_token: str
):
    """A System Administrator must be granted access (HTTP 200) under existing admin bypass policy."""
    res = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_list_users_government_super_admin_forbidden_returns_403(
    client: AsyncClient, db_session: AsyncSession
):
    """A pure Government Verification Super Admin must NOT have access to the general technical user directory (HTTP 403)."""
    user = User(
        email="gov.superadmin@ayuctms.gov.in",
        full_name="Government Super Admin",
        status=UserStatus.active,
        hashed_password=hash_password("SuperAdmin123!"),
    )
    db_session.add(user)
    await db_session.flush()

    profile = SuperAdminProfile(user_id=user.id, is_active=True)
    db_session.add(profile)
    await db_session.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    res = await client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "user:manage" in res.json()["detail"]


# ---------------------------------------------------------------------------
# F01B: User Profile (GET /api/v1/users/{id}) Ownership & RBAC Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_user_by_id_unauthenticated_returns_401(client: AsyncClient):
    """Anonymous request to get user by ID must return 401."""
    res = await client.get("/api/v1/users/00000000-0000-0000-0000-000000000001")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_get_user_by_id_self_allowed_returns_200(
    client: AsyncClient, db_session: AsyncSession
):
    """An ordinary user must be permitted to retrieve their own user record."""
    user = User(
        email="self.lookup@hospital.org",
        full_name="Dr. Self Lookup",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(user)
    await db_session.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    res = await client.get(
        f"/api/v1/users/{user.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["id"] == str(user.id)
    assert res.json()["email"] == "self.lookup@hospital.org"


@pytest.mark.asyncio
async def test_get_user_by_id_other_user_forbidden_returns_403(
    client: AsyncClient, db_session: AsyncSession
):
    """An ordinary user attempting to view another user's profile must be rejected with 403."""
    user_a = User(
        email="user.a@hospital.org",
        full_name="User Alpha",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    user_b = User(
        email="user.b@hospital.org",
        full_name="User Beta",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    role = Role(name="Nurse", scope_level=ScopeLevel.site, is_system_role=False)
    org = Organization(name="Site A", organization_type=OrganizationType.institution, status=OrganizationStatus.active)
    db_session.add_all([user_a, user_b, role, org])
    await db_session.flush()

    mem = OrganizationMember(organization_id=org.id, user_id=user_a.id, role_id=role.id, status=AssignmentStatus.active)
    db_session.add(mem)
    await db_session.commit()

    token_a = create_access_token({"sub": str(user_a.id), "email": user_a.email})
    res = await client.get(
        f"/api/v1/users/{user_b.id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res.status_code == 403
    assert "user:manage" in res.json()["detail"]


@pytest.mark.asyncio
async def test_get_user_by_id_with_user_manage_returns_200(
    client: AsyncClient, db_session: AsyncSession
):
    """A user with user:manage permission can retrieve another user's profile."""
    manager = User(
        email="manager.lookup@hospital.org",
        full_name="Manager Mike",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    target_user = User(
        email="target.user@hospital.org",
        full_name="Target Tom",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    role = Role(name="Personnel Admin", scope_level=ScopeLevel.organization, is_system_role=False)
    perm = Permission(codename="user:manage", resource="users", action="manage")
    org = Organization(name="Ops Org", organization_type=OrganizationType.institution, status=OrganizationStatus.active)
    db_session.add_all([manager, target_user, role, perm, org])
    await db_session.flush()

    rp = RolePermission(role_id=role.id, permission_id=perm.id)
    mem = OrganizationMember(organization_id=org.id, user_id=manager.id, role_id=role.id, status=AssignmentStatus.active)
    db_session.add_all([rp, mem])
    await db_session.commit()

    token = create_access_token({"sub": str(manager.id), "email": manager.email})
    res = await client.get(
        f"/api/v1/users/{target_user.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["id"] == str(target_user.id)


@pytest.mark.asyncio
async def test_get_user_by_id_system_admin_returns_200(
    client: AsyncClient, admin_token: str, db_session: AsyncSession
):
    """System Administrator can retrieve any user profile by ID."""
    other_user = User(
        email="audited.user@hospital.org",
        full_name="Audited Alice",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(other_user)
    await db_session.commit()

    res = await client.get(
        f"/api/v1/users/{other_user.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["id"] == str(other_user.id)


@pytest.mark.asyncio
async def test_get_user_by_id_government_super_admin_self_allowed_returns_200(
    client: AsyncClient, db_session: AsyncSession
):
    """A Government Verification Super Admin can retrieve their own profile."""
    gov_user = User(
        email="gov.verifier.self@ayuctms.gov.in",
        full_name="Gov Verifier Self",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(gov_user)
    await db_session.flush()

    profile = SuperAdminProfile(user_id=gov_user.id, is_active=True)
    db_session.add(profile)
    await db_session.commit()

    token = create_access_token({"sub": str(gov_user.id), "email": gov_user.email})
    res = await client.get(
        f"/api/v1/users/{gov_user.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["id"] == str(gov_user.id)
    assert res.json()["email"] == "gov.verifier.self@ayuctms.gov.in"


@pytest.mark.asyncio
async def test_get_user_by_id_government_super_admin_other_user_forbidden_returns_403(
    client: AsyncClient, db_session: AsyncSession
):
    """A pure Government Verification Super Admin attempting to view another user's profile must be rejected with 403."""
    gov_user = User(
        email="gov.verifier.lookup@ayuctms.gov.in",
        full_name="Gov Verifier",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    other_user = User(
        email="clinical.staff@hospital.org",
        full_name="Clinical Staff",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add_all([gov_user, other_user])
    await db_session.flush()

    profile = SuperAdminProfile(user_id=gov_user.id, is_active=True)
    db_session.add(profile)
    await db_session.commit()

    token = create_access_token({"sub": str(gov_user.id), "email": gov_user.email})
    res = await client.get(
        f"/api/v1/users/{other_user.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "user:manage" in res.json()["detail"]


# ---------------------------------------------------------------------------
# F01B: Role Creation (POST /api/v1/roles) Privilege Escalation & RBAC Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_role_unauthenticated_returns_401(client: AsyncClient):
    """Anonymous request to create a role must return 401."""
    res = await client.post(
        "/api/v1/roles",
        json={"name": "New Role", "scope_level": "study"},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_create_role_ordinary_user_forbidden_returns_403(
    client: AsyncClient, db_session: AsyncSession
):
    """Ordinary authenticated user cannot create roles."""
    user = User(
        email="regular.staff@hospital.org",
        full_name="Staff Bob",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(user)
    await db_session.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    res = await client.post(
        "/api/v1/roles",
        json={"name": "Unauthorized Custom Role", "scope_level": "study"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "user:manage" in res.json()["detail"]


@pytest.mark.asyncio
async def test_create_role_privilege_escalation_system_scope_blocked_returns_403(
    client: AsyncClient, db_session: AsyncSession
):
    """A user with user:manage (non-admin) cannot create a system-scoped role."""
    manager = User(
        email="org.admin.escalate@hospital.org",
        full_name="Org Admin",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    role = Role(name="Org Admin Role", scope_level=ScopeLevel.organization, is_system_role=False)
    perm = Permission(codename="user:manage", resource="users", action="manage")
    org = Organization(name="Admin Org", organization_type=OrganizationType.institution, status=OrganizationStatus.active)
    db_session.add_all([manager, role, perm, org])
    await db_session.flush()

    rp = RolePermission(role_id=role.id, permission_id=perm.id)
    mem = OrganizationMember(organization_id=org.id, user_id=manager.id, role_id=role.id, status=AssignmentStatus.active)
    db_session.add_all([rp, mem])
    await db_session.commit()

    token = create_access_token({"sub": str(manager.id), "email": manager.email})
    res = await client.post(
        "/api/v1/roles",
        json={"name": "Backdoor System Role", "scope_level": "system"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "System Administrators" in res.json()["detail"]


@pytest.mark.asyncio
async def test_create_role_with_user_manage_creates_study_role_returns_201(
    client: AsyncClient, db_session: AsyncSession
):
    """A user with user:manage can successfully create study- or site-scoped roles."""
    manager = User(
        email="role.creator@hospital.org",
        full_name="Role Creator",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    role = Role(name="Role Creator Role", scope_level=ScopeLevel.organization, is_system_role=False)
    perm = Permission(codename="user:manage", resource="users", action="manage")
    org = Organization(name="Creator Org", organization_type=OrganizationType.institution, status=OrganizationStatus.active)
    db_session.add_all([manager, role, perm, org])
    await db_session.flush()

    rp = RolePermission(role_id=role.id, permission_id=perm.id)
    mem = OrganizationMember(organization_id=org.id, user_id=manager.id, role_id=role.id, status=AssignmentStatus.active)
    db_session.add_all([rp, mem])
    await db_session.commit()

    token = create_access_token({"sub": str(manager.id), "email": manager.email})
    res = await client.post(
        "/api/v1/roles",
        json={"name": "Clinical Research Coordinator Custom", "scope_level": "study", "description": "Custom CRC role"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    assert res.json()["name"] == "Clinical Research Coordinator Custom"
    assert res.json()["scope_level"] == "study"
    assert res.json()["is_system_role"] is False


@pytest.mark.asyncio
async def test_create_role_system_admin_allowed_returns_201(
    client: AsyncClient, admin_token: str
):
    """System Administrator can create roles of any scope, including system scope."""
    res = await client.post(
        "/api/v1/roles",
        json={"name": "System Audit Specialist", "scope_level": "system"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201
    assert res.json()["name"] == "System Audit Specialist"
    assert res.json()["scope_level"] == "system"


@pytest.mark.asyncio
async def test_create_role_government_super_admin_forbidden_returns_403(
    client: AsyncClient, db_session: AsyncSession
):
    """A pure Government Verification Super Admin cannot create roles via technical role management."""
    gov_user = User(
        email="gov.role.creator@ayuctms.gov.in",
        full_name="Gov Role Creator",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(gov_user)
    await db_session.flush()

    profile = SuperAdminProfile(user_id=gov_user.id, is_active=True)
    db_session.add(profile)
    await db_session.commit()

    token = create_access_token({"sub": str(gov_user.id), "email": gov_user.email})
    res = await client.post(
        "/api/v1/roles",
        json={"name": "Gov Created Role", "scope_level": "organization"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "user:manage" in res.json()["detail"]


@pytest.mark.asyncio
async def test_create_role_bypass_reserved_name_forbidden_returns_403(
    client: AsyncClient, db_session: AsyncSession
):
    """A non-technical-admin with user:manage cannot bypass system role restriction by using reserved names."""
    manager = User(
        email="bypass.manager@hospital.org",
        full_name="Bypass Manager",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    role = Role(name="Bypass Manager Role", scope_level=ScopeLevel.organization, is_system_role=False)
    perm = Permission(codename="user:manage", resource="users", action="manage")
    org = Organization(name="Bypass Org", organization_type=OrganizationType.institution, status=OrganizationStatus.active)
    db_session.add_all([manager, role, perm, org])
    await db_session.flush()

    rp = RolePermission(role_id=role.id, permission_id=perm.id)
    mem = OrganizationMember(organization_id=org.id, user_id=manager.id, role_id=role.id, status=AssignmentStatus.active)
    db_session.add_all([rp, mem])
    await db_session.commit()

    token = create_access_token({"sub": str(manager.id), "email": manager.email})

    # Attempt bypass with reserved name "System Administrator" under organization scope
    res = await client.post(
        "/api/v1/roles",
        json={"name": "System Administrator", "scope_level": "organization"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "System Administrators" in res.json()["detail"]

    # Attempt bypass with reserved name "Super Admin" under study scope
    res2 = await client.post(
        "/api/v1/roles",
        json={"name": "Super Admin", "scope_level": "study"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res2.status_code == 403
    assert "System Administrators" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_create_role_bypass_is_system_role_forbidden_returns_403(
    client: AsyncClient, db_session: AsyncSession
):
    """A non-technical-admin with user:manage cannot mark a role as is_system_role=True."""
    manager = User(
        email="flag.manager@hospital.org",
        full_name="Flag Manager",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    role = Role(name="Flag Manager Role", scope_level=ScopeLevel.organization, is_system_role=False)
    perm = Permission(codename="user:manage", resource="users", action="manage")
    org = Organization(name="Flag Org", organization_type=OrganizationType.institution, status=OrganizationStatus.active)
    db_session.add_all([manager, role, perm, org])
    await db_session.flush()

    rp = RolePermission(role_id=role.id, permission_id=perm.id)
    mem = OrganizationMember(organization_id=org.id, user_id=manager.id, role_id=role.id, status=AssignmentStatus.active)
    db_session.add_all([rp, mem])
    await db_session.commit()

    token = create_access_token({"sub": str(manager.id), "email": manager.email})

    res = await client.post(
        "/api/v1/roles",
        json={"name": "Privileged Study Manager", "scope_level": "study", "is_system_role": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "System Administrators" in res.json()["detail"]


# ---------------------------------------------------------------------------
# F01B: Permissions Listing (GET /api/v1/permissions) RBAC Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_permissions_unauthenticated_returns_401(client: AsyncClient):
    """Anonymous request to list permissions must return 401."""
    res = await client.get("/api/v1/permissions")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_list_permissions_ordinary_user_forbidden_returns_403(
    client: AsyncClient, db_session: AsyncSession
):
    """Ordinary authenticated user cannot enumerate internal security permissions."""
    user = User(
        email="plain.user@hospital.org",
        full_name="Plain User",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(user)
    await db_session.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    res = await client.get(
        "/api/v1/permissions",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "user:manage" in res.json()["detail"]


@pytest.mark.asyncio
async def test_list_permissions_system_admin_returns_200(
    client: AsyncClient, admin_token: str
):
    """System Administrator can view the permissions registry."""
    res = await client.get(
        "/api/v1/permissions",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_list_permissions_government_super_admin_forbidden_returns_403(
    client: AsyncClient, db_session: AsyncSession
):
    """A pure Government Verification Super Admin cannot list technical security permissions (HTTP 403)."""
    gov_user = User(
        email="gov.perm.viewer@ayuctms.gov.in",
        full_name="Gov Perm Viewer",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(gov_user)
    await db_session.flush()

    profile = SuperAdminProfile(user_id=gov_user.id, is_active=True)
    db_session.add(profile)
    await db_session.commit()

    token = create_access_token({"sub": str(gov_user.id), "email": gov_user.email})
    res = await client.get(
        "/api/v1/permissions",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "user:manage" in res.json()["detail"]


# ---------------------------------------------------------------------------
# F01B: Roles Listing (GET /api/v1/roles) Metadata Access Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_roles_unauthenticated_returns_401(client: AsyncClient):
    """Anonymous request to list roles must return 401."""
    res = await client.get("/api/v1/roles")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_list_roles_authenticated_ordinary_user_returns_200(
    client: AsyncClient, db_session: AsyncSession
):
    """Authenticated user can view role catalog to support UI selection in study/org pages."""
    user = User(
        email="member.viewer@hospital.org",
        full_name="Member Viewer",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(user)
    await db_session.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    res = await client.get(
        "/api/v1/roles",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


