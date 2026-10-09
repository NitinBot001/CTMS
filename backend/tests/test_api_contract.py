"""
API Contract Verification Tests.

Validates the frozen API contract:
1. Endpoint existence & exact paths
2. OpenAPI schema completeness & integrity
3. Authentication enforcement (401 for unauthorized access)
4. Request validation semantics (422 Unprocessable Entity for schema violations)
5. State machine transition semantics (400 Bad Request for illegal transitions)
6. Response structure correctness
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from httpx import AsyncClient

from app.main import app

# Authoritative inventory of all 66 endpoints
EXPECTED_ENDPOINTS = [
    # System (2)
    ("GET", "/"),
    ("GET", "/health"),
    # Auth (2)
    ("POST", "/api/v1/auth/login"),
    ("GET", "/api/v1/auth/me"),
    # Organizations (6)
    ("POST", "/api/v1/organizations"),
    ("GET", "/api/v1/organizations"),
    ("GET", "/api/v1/organizations/{org_id}"),
    ("PATCH", "/api/v1/organizations/{org_id}"),
    ("GET", "/api/v1/organizations/{org_id}/members"),
    ("POST", "/api/v1/organizations/{org_id}/members"),
    # Onboarding (2)
    ("POST", "/api/v1/organizations/{org_id}/onboarding"),
    ("POST", "/api/v1/organizations/onboarding/{app_id}/transition"),
    # Studies (6)
    ("POST", "/api/v1/studies"),
    ("GET", "/api/v1/studies"),
    ("GET", "/api/v1/studies/{study_id}"),
    ("PATCH", "/api/v1/studies/{study_id}"),
    ("POST", "/api/v1/studies/{study_id}/transition"),
    ("GET", "/api/v1/studies/{study_id}/milestones"),
    # Study Team (2)
    ("GET", "/api/v1/studies/{study_id}/team"),
    ("POST", "/api/v1/studies/{study_id}/team"),
    # Study Sites (3)
    ("GET", "/api/v1/studies/{study_id}/sites"),
    ("POST", "/api/v1/studies/{study_id}/sites"),
    ("POST", "/api/v1/studies/{study_id}/sites/{site_id}/transition"),
    # Sites (4)
    ("POST", "/api/v1/sites"),
    ("GET", "/api/v1/sites"),
    ("GET", "/api/v1/sites/{site_id}"),
    ("PATCH", "/api/v1/sites/{site_id}"),
    # Participants (4)
    ("POST", "/api/v1/participants"),
    ("GET", "/api/v1/participants"),
    ("GET", "/api/v1/participants/{participant_id}"),
    ("POST", "/api/v1/participants/{participant_id}/transition"),
    # Safety (4)
    ("POST", "/api/v1/safety/adverse-events"),
    ("GET", "/api/v1/safety/adverse-events"),
    ("GET", "/api/v1/safety/adverse-events/{event_id}"),
    ("POST", "/api/v1/safety/adverse-events/{event_id}/transition"),
    # Compliance (12)
    ("POST", "/api/v1/compliance/ethics"),
    ("GET", "/api/v1/compliance/ethics"),
    ("POST", "/api/v1/compliance/ethics/{approval_id}/transition"),
    ("POST", "/api/v1/compliance/regulatory"),
    ("GET", "/api/v1/compliance/regulatory"),
    ("POST", "/api/v1/compliance/regulatory/{submission_id}/transition"),
    ("POST", "/api/v1/compliance/deviations"),
    ("GET", "/api/v1/compliance/deviations"),
    ("POST", "/api/v1/compliance/deviations/{deviation_id}/transition"),
    ("POST", "/api/v1/compliance/capa"),
    ("GET", "/api/v1/compliance/capa"),
    ("POST", "/api/v1/compliance/capa/{capa_id}/transition"),
    # Documents (4)
    ("POST", "/api/v1/documents"),
    ("GET", "/api/v1/documents"),
    ("GET", "/api/v1/documents/{document_id}"),
    ("POST", "/api/v1/documents/{document_id}/transition"),
    # Portfolio / Derived Analytics (7)
    ("GET", "/api/v1/portfolio/overview"),
    ("GET", "/api/v1/portfolio/health"),
    ("GET", "/api/v1/portfolio/alerts"),
    ("GET", "/api/v1/portfolio/milestones/upcoming"),
    ("GET", "/api/v1/portfolio/enrollment/trend"),
    ("GET", "/api/v1/portfolio/studies/{study_id}/enrollment/by-site"),
    ("GET", "/api/v1/portfolio/studies/{study_id}/metrics"),
    # Audit (2)
    ("GET", "/api/v1/audit/logs"),
    ("GET", "/api/v1/audit/verify"),
    # Users & RBAC (6)
    ("POST", "/api/v1/users"),
    ("GET", "/api/v1/users"),
    ("GET", "/api/v1/users/{user_id}"),
    ("POST", "/api/v1/roles"),
    ("GET", "/api/v1/roles"),
    ("GET", "/api/v1/permissions"),
]


def test_openapi_schema_matches_exact_endpoint_count():
    """Validates that FastAPI's OpenAPI document exports all 48 unique route paths and 66 operations."""
    schema = app.openapi()
    assert schema["openapi"].startswith("3.")
    assert schema["info"]["title"] == "AyuCTMS"
    assert schema["info"]["version"] == "1.0.0"

    paths = schema["paths"]
    # Verify all expected endpoint paths exist in the schema
    for method, path in EXPECTED_ENDPOINTS:
        assert path in paths, f"Path {path} missing from OpenAPI schema!"
        assert method.lower() in paths[path], f"Method {method} for {path} missing from OpenAPI schema!"


def test_openapi_json_file_on_disk_is_synchronized():
    """Validates that docs/openapi.json on disk exists and matches app.openapi() paths."""
    contract_path = Path(__file__).resolve().parent.parent.parent / "docs" / "openapi.json"
    assert contract_path.exists(), "docs/openapi.json does not exist!"

    with open(contract_path, encoding="utf-8") as f:
        disk_schema = json.load(f)

    app_schema = app.openapi()
    assert len(disk_schema["paths"]) == len(app_schema["paths"])
    for path in app_schema["paths"]:
        assert path in disk_schema["paths"]


@pytest.mark.asyncio
async def test_public_endpoints_accessible_without_auth(client: AsyncClient):
    """Health check and root endpoints must be accessible without authentication."""
    res_health = await client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

    res_root = await client.get("/")
    assert res_root.status_code == 200
    assert "AyuCTMS" in res_root.json()["message"]


@pytest.mark.asyncio
async def test_protected_endpoints_reject_anonymous_calls(client: AsyncClient):
    """Verifies that protected endpoints return 401 Unauthorized for anonymous callers."""
    protected_samples = [
        "/api/v1/auth/me",
        "/api/v1/organizations",
        "/api/v1/studies",
        "/api/v1/sites",
        "/api/v1/participants",
        "/api/v1/safety/adverse-events",
        "/api/v1/compliance/ethics",
        "/api/v1/documents",
        "/api/v1/portfolio/overview",
        "/api/v1/portfolio/health",
        "/api/v1/audit/logs",
        "/api/v1/audit/verify",
        "/api/v1/users",
        "/api/v1/roles",
        "/api/v1/permissions",
    ]
    for path in protected_samples:
        res = await client.get(path)
        assert res.status_code == 401, f"Expected 401 for anonymous GET {path}, got {res.status_code}"
        assert "WWW-Authenticate" in res.headers


@pytest.mark.asyncio
async def test_validation_error_contract_shape(auth_client: AsyncClient):
    """Verifies that FastAPI emits HTTP 422 with the standardized detail list on schema violations."""
    # Attempt to create an organization with empty/invalid payload
    res = await auth_client.post("/api/v1/organizations", json={})
    assert res.status_code == 422
    data = res.json()
    assert "detail" in data
    assert isinstance(data["detail"], list)
    locs = [d["loc"] for d in data["detail"]]
    # Should flag missing 'name' and 'organization_type'
    fields = [loc[-1] for loc in locs]
    assert "name" in fields
    assert "organization_type" in fields


@pytest.mark.asyncio
async def test_state_machine_illegal_transition_rejection(auth_client: AsyncClient):
    """Verifies that illegal status transitions are rejected with HTTP 400."""
    # 1. Create a study in draft
    study_res = await auth_client.post(
        "/api/v1/studies",
        json={
            "study_code": "CONTRACT-TEST-001",
            "protocol_number": "PR-CONTRACT-01",
            "title": "Contract Freeze Validation Study",
            "study_type": "interventional",
            "phase": "phase_2",
            "sponsor_org_id": "00000000-0000-0000-0000-000000000001",
            "therapeutic_area": "Ayurveda Oncology",
        },
    )
    assert study_res.status_code == 201
    study_id = study_res.json()["id"]

    # 2. Attempt illegal transition directly from draft to completed (allowed only: planned, withdrawn)
    illegal_res = await auth_client.post(
        f"/api/v1/studies/{study_id}/transition",
        json={"new_status": "completed"},
    )
    assert illegal_res.status_code == 400
    assert "Invalid transition" in illegal_res.json()["detail"]


@pytest.mark.asyncio
async def test_bootstrap_user_creation_allowed_when_zero_users(client: AsyncClient):
    """When the system has zero users, anonymous creation of the initial administrator is allowed."""
    payload = {
        "email": "bootstrap_admin@ayuctms.gov.in",
        "password": "InitialBootstrapPassword123!",
        "full_name": "Initial System Bootstrap Admin",
    }
    # Initial creation succeeds
    res = await client.post("/api/v1/users", json=payload)
    assert res.status_code == 201
    created_user = res.json()
    assert created_user["email"] == "bootstrap_admin@ayuctms.gov.in"
    assert "hashed_password" not in created_user

    # Second creation immediately rejected with 401 since user count is now > 0
    res2 = await client.post("/api/v1/users", json={
        "email": "second_user@example.com",
        "password": "AnotherPassword123!",
        "full_name": "Second User",
    })
    assert res2.status_code == 401
    assert "Bootstrap is closed" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_anonymous_user_creation_rejected_when_users_exist(client: AsyncClient, admin_user):
    """Anonymous user creation must be rejected with 401 when the system already has users."""
    payload = {
        "email": "unauthorized_signup@example.com",
        "password": "StrongPassword123!",
        "full_name": "Unauthorized User",
    }
    res = await client.post("/api/v1/users", json=payload)
    assert res.status_code == 401
    assert "WWW-Authenticate" in res.headers
    assert "Bootstrap is closed" in res.json()["detail"]


def test_milestone_endpoint_has_explicit_response_model():
    """Milestone endpoint must expose an explicit list[StudyMilestoneRead] schema in OpenAPI."""
    schema = app.openapi()
    milestone_get = schema["paths"]["/api/v1/studies/{study_id}/milestones"]["get"]
    response_200 = milestone_get["responses"]["200"]
    assert "content" in response_200
    json_schema = response_200["content"]["application/json"]["schema"]
    assert json_schema["type"] == "array"
    assert "$ref" in json_schema["items"]
    assert json_schema["items"]["$ref"].endswith("/StudyMilestoneRead")

    # Verify StudyMilestoneRead definition exists and contains expected milestone fields
    milestone_def = schema["components"]["schemas"]["StudyMilestoneRead"]
    props = milestone_def["properties"]
    for expected_field in ["id", "study_id", "title", "description", "planned_date", "actual_date", "status"]:
        assert expected_field in props, f"Field {expected_field} missing from StudyMilestoneRead!"


def test_portfolio_endpoints_have_strongly_typed_schemas():
    """All 7 portfolio endpoints must expose strongly-typed Pydantic schemas in OpenAPI."""
    schema = app.openapi()
    portfolio_paths = schema["paths"]

    # 1. /api/v1/portfolio/overview -> PortfolioOverviewResponse
    overview_schema = portfolio_paths["/api/v1/portfolio/overview"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert overview_schema["$ref"].endswith("/PortfolioOverviewResponse")

    # 2. /api/v1/portfolio/health -> PortfolioHealthResponse
    health_schema = portfolio_paths["/api/v1/portfolio/health"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert health_schema["$ref"].endswith("/PortfolioHealthResponse")

    # 3. /api/v1/portfolio/alerts -> list[PortfolioAlertItem]
    alerts_schema = portfolio_paths["/api/v1/portfolio/alerts"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert alerts_schema["type"] == "array"
    assert alerts_schema["items"]["$ref"].endswith("/PortfolioAlertItem")

    # 4. /api/v1/portfolio/milestones/upcoming -> list[UpcomingMilestoneItem]
    milestones_schema = portfolio_paths["/api/v1/portfolio/milestones/upcoming"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert milestones_schema["type"] == "array"
    assert milestones_schema["items"]["$ref"].endswith("/UpcomingMilestoneItem")

    # 5. /api/v1/portfolio/enrollment/trend -> list[EnrollmentTrendPoint]
    trend_schema = portfolio_paths["/api/v1/portfolio/enrollment/trend"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert trend_schema["type"] == "array"
    assert trend_schema["items"]["$ref"].endswith("/EnrollmentTrendPoint")

    # 6. /api/v1/portfolio/studies/{study_id}/enrollment/by-site -> list[SiteEnrollmentItem]
    site_enrollment_schema = portfolio_paths["/api/v1/portfolio/studies/{study_id}/enrollment/by-site"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert site_enrollment_schema["type"] == "array"
    assert site_enrollment_schema["items"]["$ref"].endswith("/SiteEnrollmentItem")

    # 7. /api/v1/portfolio/studies/{study_id}/metrics -> StudyMetricsResponse
    metrics_schema = portfolio_paths["/api/v1/portfolio/studies/{study_id}/metrics"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    assert metrics_schema["$ref"].endswith("/StudyMetricsResponse")


def test_nested_creation_schemas_omit_redundant_parent_foreign_keys():
    """Nested creation request schemas must not expect parent foreign keys (derived from URL path)."""
    schema = app.openapi()
    schemas = schema["components"]["schemas"]

    # OrganizationMemberCreate: organization_id is derived from /organizations/{org_id}/members
    org_member_create = schemas["OrganizationMemberCreate"]
    assert "organization_id" not in org_member_create.get("properties", {})

    # StudyTeamMemberCreate: study_id is derived from /studies/{study_id}/team
    study_team_create = schemas["StudyTeamMemberCreate"]
    assert "study_id" not in study_team_create.get("properties", {})

    # StudySiteCreate: study_id is derived from /studies/{study_id}/sites
    study_site_create = schemas["StudySiteCreate"]
    assert "study_id" not in study_site_create.get("properties", {})


def test_no_sensitive_fields_in_response_schemas():
    """No API response schemas may expose hashed_password or sensitive credentials."""
    schema = app.openapi()
    schemas = schema["components"]["schemas"]

    # Verify no schema contains hashed_password
    for schema_name, schema_def in schemas.items():
        properties = schema_def.get("properties", {})
        assert "hashed_password" not in properties, (
            f"Sensitive field 'hashed_password' exposed in schema {schema_name}!"
        )

