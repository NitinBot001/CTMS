from __future__ import annotations

import asyncio
import unittest.mock
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.core.security as _security_module
import app.models  # noqa: F401 - Register all models
from app.core.database import get_db
from app.core.security import create_access_token, hash_password
from app.main import app as fastapi_app
from app.models.base import Base
from app.models.enums import (
    AssignmentStatus,
    OrganizationStatus,
    OrganizationType,
    ScopeLevel,
    UserStatus,
)
from app.models.organization import Organization, OrganizationMember
from app.models.user import Role, User

# In-memory SQLite database for test speed and isolation
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

# ---------------------------------------------------------------------------
# Speed optimisation: use bcrypt cost=4 during all tests (production uses 12).
# test_password_security.py::test_production_bcrypt_rounds_meets_owasp_minimum
# re-imports the module fresh to assert the real constant is >= 12.
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True, scope="session")
def _fast_bcrypt():
    with unittest.mock.patch.object(_security_module, "_BCRYPT_ROUNDS", 4):
        yield


@pytest.fixture(autouse=True)
def _mock_email_service(monkeypatch):
    async def mock_send_email(to_email: str, subject: str, html_content: str, settings):
        return {
            "id": "mock_resend_msg_001",
            "status": "simulated",
            "to": to_email,
            "subject": subject,
        }

    monkeypatch.setattr("app.services.email.EmailService.send_email", mock_send_email)


test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestAsyncSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def prepare_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestAsyncSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> User:
    role = Role(
        name="System Administrator",
        description="Full platform administration",
        scope_level=ScopeLevel.system,
        is_system_role=True,
    )
    user = User(
        email="admin@ayuctms.gov.in",
        full_name="AyuCTMS Admin",
        status=UserStatus.active,
        hashed_password=hash_password("Admin123!"),
    )
    db_session.add_all([role, user])
    await db_session.flush()

    org = Organization(
        name="Central System Org",
        organization_type=OrganizationType.institution,
        status=OrganizationStatus.active,
    )
    db_session.add(org)
    await db_session.flush()

    membership = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role_id=role.id,
        status=AssignmentStatus.active,
    )
    db_session.add(membership)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_token(admin_user: User) -> str:
    return create_access_token({"sub": str(admin_user.id), "email": admin_user.email})


@pytest_asyncio.fixture
async def auth_headers(admin_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient, auth_headers: dict[str, str]) -> AsyncClient:
    client.headers.update(auth_headers)
    return client
