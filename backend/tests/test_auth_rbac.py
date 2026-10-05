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
from app.models.user import Role, User


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
