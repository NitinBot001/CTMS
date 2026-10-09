import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.enums import OnboardingRequestStatus, UserStatus
from app.models.platform import OnboardingRequest
from app.models.user import User, SuperAdminProfile
from app.core.security import hash_password, create_access_token

@pytest_asyncio.fixture
async def super_admin_user(db_session: AsyncSession) -> User:
    user = User(
        email="superadmin@example.com",
        full_name="Super Admin",
        status=UserStatus.active,
        hashed_password=hash_password("SuperAdmin123!"),
    )
    db_session.add(user)
    await db_session.flush()
    profile = SuperAdminProfile(user_id=user.id, is_active=True)
    db_session.add(profile)
    await db_session.commit()
    return user

@pytest_asyncio.fixture
async def super_admin_token(super_admin_user: User) -> str:
    return create_access_token({"sub": str(super_admin_user.id), "email": super_admin_user.email})

@pytest.mark.asyncio
async def test_submit_onboarding_request_anonymous(client: AsyncClient):
    payload = {
        "applicant_name": "John Doe",
        "organization_name": "Test Org",
        "organization_type": "cro",
        "email": "test@org.com",
    }
    response = await client.post("/api/v1/platform/onboarding-requests", json=payload)
    assert response.status_code == 201
    assert response.json()["status"] == "pending"

@pytest.mark.asyncio
async def test_submit_request_invalid_email(client: AsyncClient):
    payload = {
        "applicant_name": "John Doe",
        "organization_name": "Test Org",
        "organization_type": "cro",
    }
    response = await client.post("/api/v1/platform/onboarding-requests", json=payload)
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_list_requests_requires_super_admin(client: AsyncClient):
    response = await client.get("/api/v1/platform/onboarding-requests")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_super_admin_can_list_requests(client: AsyncClient, super_admin_token: str):
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await client.get("/api/v1/platform/onboarding-requests", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_review_transition_valid(client: AsyncClient, super_admin_token: str, db_session: AsyncSession):
    # Setup pending request
    req = OnboardingRequest(
        applicant_name="Alice", organization_name="A Corp", organization_type="cro",
        email="alice@acorp.com", status=OnboardingRequestStatus.pending
    )
    db_session.add(req)
    await db_session.commit()
    
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await client.patch(
        f"/api/v1/platform/onboarding-requests/{req.id}/review", 
        json={"status": "under_review"}, headers=headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "under_review"

@pytest.mark.asyncio
async def test_review_transition_invalid(client: AsyncClient, super_admin_token: str, db_session: AsyncSession):
    # Setup approved request
    req = OnboardingRequest(
        applicant_name="Alice", organization_name="A Corp", organization_type="cro",
        email="alice@acorp.com", status=OnboardingRequestStatus.approved
    )
    db_session.add(req)
    await db_session.commit()
    
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await client.patch(
        f"/api/v1/platform/onboarding-requests/{req.id}/review", 
        json={"status": "pending"}, headers=headers
    )
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_approve_provisions_organization(client: AsyncClient, super_admin_token: str, db_session: AsyncSession):
    req = OnboardingRequest(
        applicant_name="Bob", organization_name="B Corp", organization_type="sponsor",
        email="bob@bcorp.com", status=OnboardingRequestStatus.under_review
    )
    db_session.add(req)
    await db_session.commit()
    
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await client.post(
        f"/api/v1/platform/onboarding-requests/{req.id}/approve", headers=headers
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["organization_id"] is not None
    assert res_data["raw_token"] is not None

@pytest.mark.asyncio
async def test_double_approve_idempotent(client: AsyncClient, super_admin_token: str, db_session: AsyncSession):
    req = OnboardingRequest(
        applicant_name="Bob", organization_name="B Corp", organization_type="sponsor",
        email="bob@bcorp.com", status=OnboardingRequestStatus.under_review
    )
    db_session.add(req)
    await db_session.commit()
    
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    r1 = await client.post(f"/api/v1/platform/onboarding-requests/{req.id}/approve", headers=headers)
    r2 = await client.post(f"/api/v1/platform/onboarding-requests/{req.id}/approve", headers=headers)
    assert r2.status_code == 200
    assert r2.json()["organization_id"] == r1.json()["organization_id"]

@pytest.mark.asyncio
async def test_activate_account(client: AsyncClient, super_admin_token: str, db_session: AsyncSession):
    # approve first to generate token
    req = OnboardingRequest(
        applicant_name="Carol", organization_name="C Corp", organization_type="sponsor",
        email="carol@ccorp.com", status=OnboardingRequestStatus.under_review
    )
    db_session.add(req)
    await db_session.commit()
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    approve_res = await client.post(f"/api/v1/platform/onboarding-requests/{req.id}/approve", headers=headers)
    token = approve_res.json()["raw_token"]
    
    activate_res = await client.post("/api/v1/platform/activate", json={"token": token, "new_password": "NewSecurePassword123!"})
    assert activate_res.status_code == 200
    
    # check that we can login
    login_res = await client.post("/api/v1/auth/login", json={"email": "carol@ccorp.com", "password": "NewSecurePassword123!"})
    assert login_res.status_code == 200

@pytest.mark.asyncio
async def test_activate_used_token(client: AsyncClient, super_admin_token: str, db_session: AsyncSession):
    req = OnboardingRequest(
        applicant_name="Dave", organization_name="D Corp", organization_type="sponsor",
        email="dave@dcorp.com", status=OnboardingRequestStatus.under_review
    )
    db_session.add(req)
    await db_session.commit()
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    approve_res = await client.post(f"/api/v1/platform/onboarding-requests/{req.id}/approve", headers=headers)
    token = approve_res.json()["raw_token"]
    
    await client.post("/api/v1/platform/activate", json={"token": token, "new_password": "NewSecurePassword123!"})
    r2 = await client.post("/api/v1/platform/activate", json={"token": token, "new_password": "NewSecurePassword123!"})
    assert r2.status_code == 400

@pytest.mark.asyncio
async def test_change_password_requires_auth(client: AsyncClient):
    response = await client.post("/api/v1/platform/change-password", json={"current_password": "old", "new_password": "newpassword"})
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_change_password_success(client: AsyncClient, super_admin_token: str):
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    response = await client.post(
        "/api/v1/platform/change-password", 
        json={"current_password": "SuperAdmin123!", "new_password": "EvenNewerPassword123!"},
        headers=headers
    )
    assert response.status_code == 200
