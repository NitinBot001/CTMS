from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_api_workflow(auth_client: AsyncClient):
    client = auth_client
    # 1. Health check
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # 2. Create Sponsor Organization
    res = await client.post(
        "/api/v1/organizations",
        json={
            "name": "National Ayush Research Institute",
            "organization_type": "sponsor",
            "registration_number": "NARI-2026",
            "email": "sponsor@nari.org",
            "city": "New Delhi",
            "country": "India",
        },
    )
    assert res.status_code == 201
    sponsor_data = res.json()
    sponsor_id = sponsor_data["id"]
    assert sponsor_data["status"] == "draft"

    # 3. Create CRO Organization
    res = await client.post(
        "/api/v1/organizations",
        json={
            "name": "Bharat Clinical Solutions",
            "organization_type": "cro",
            "registration_number": "BCS-CRO-01",
        },
    )
    assert res.status_code == 201
    cro_id = res.json()["id"]

    # 4. Submit Onboarding for Sponsor
    res = await client.post(f"/api/v1/organizations/{sponsor_id}/onboarding")
    assert res.status_code == 201
    app_id = res.json()["id"]

    # Transition to submitted -> under_review -> approved
    res = await client.post(
        f"/api/v1/organizations/onboarding/{app_id}/transition",
        json={"new_status": "submitted"},
    )
    assert res.status_code == 200

    res = await client.post(
        f"/api/v1/organizations/onboarding/{app_id}/transition",
        json={"new_status": "under_review"},
    )
    assert res.status_code == 200

    res = await client.post(
        f"/api/v1/organizations/onboarding/{app_id}/transition",
        json={"new_status": "approved", "reason": "Accreditation verified"},
    )
    assert res.status_code == 200

    # Verify sponsor is now active
    res = await client.get(f"/api/v1/organizations/{sponsor_id}")
    assert res.status_code == 200
    assert res.json()["status"] == "active"

    # 5. Create Study
    res = await client.post(
        "/api/v1/studies",
        json={
            "study_code": "AYU-TRI-2026",
            "protocol_number=": "PROT-TRI-2026",
            "protocol_number": "PROT-TRI-2026",
            "title": "Clinical Efficacy of Triphala Formula in Gut Microbiome Balance",
            "study_type": "interventional",
            "phase": "phase_2",
            "sponsor_org_id": sponsor_id,
            "cro_org_id": cro_id,
            "therapeutic_area": "Gastroenterology",
            "planned_sample_size": 150,
        },
    )
    assert res.status_code == 201
    study_id = res.json()["id"]

    # 6. Create Research Site
    res = await client.post(
        "/api/v1/sites",
        json={
            "site_code": "SITE-AIIA-01",
            "name": "All India Institute of Ayurveda Delhi",
            "site_type": "hospital",
            "city": "New Delhi",
            "state": "Delhi",
            "country": "India",
        },
    )
    assert res.status_code == 201
    site_id = res.json()["id"]

    # 7. Assign Site to Study
    res = await client.post(
        f"/api/v1/studies/{study_id}/sites",
        json={
            "site_id": site_id,
            "recruitment_target": 50,
        },
    )
    assert res.status_code == 201

    # 8. Create User & Assign as Study Team Member
    res = await client.post(
        "/api/v1/users",
        json={
            "email": "dr.gupta@aiia.org",
            "full_name": "Dr. Vivek Gupta",
            "password": "SecurePassword123!",
        },
    )
    assert res.status_code == 201
    user_id = res.json()["id"]

    res = await client.post(
        "/api/v1/roles",
        json={
            "name": "Study Co-Investigator",
            "scope_level": "study",
        },
    )
    assert res.status_code == 201
    role_id = res.json()["id"]

    res = await client.post(
        f"/api/v1/studies/{study_id}/team",
        json={
            "user_id": user_id,
            "role_id": role_id,
            "site_id": site_id,
        },
    )
    assert res.status_code == 201

    # 9. Register Participant & Transition Status
    res = await client.post(
        "/api/v1/participants",
        json={
            "participant_code": "PT-001",
            "study_id": study_id,
            "site_id": site_id,
            "screening_date": "2026-10-01",
        },
    )
    assert res.status_code == 201
    pt_id = res.json()["id"]

    res = await client.post(
        f"/api/v1/participants/{pt_id}/transition",
        json={"new_status": "eligible"},
    )
    assert res.status_code == 200

    res = await client.post(
        f"/api/v1/participants/{pt_id}/transition",
        json={"new_status": "enrolled"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "enrolled"

    # 10. Report Adverse Event
    res = await client.post(
        "/api/v1/safety/adverse-events",
        json={
            "study_id": study_id,
            "participant_id": pt_id,
            "site_id": site_id,
            "event_type": "ae",
            "description": "Transient abdominal fullness",
            "onset_date": "2026-10-03",
            "seriousness": "non_serious",
            "severity": "mild",
        },
    )
    assert res.status_code == 201
    ae_id = res.json()["id"]

    # 11. Record Ethics Approval
    res = await client.post(
        "/api/v1/compliance/ethics",
        json={
            "study_id": study_id,
            "site_id": site_id,
            "committee_name": "AIIA Institutional Ethics Committee",
            "approval_number": "IEC-AIIA-2026-089",
            "status": "approved",
            "approval_date": "2026-09-15",
        },
    )
    assert res.status_code == 201

    # 12. Create Document Metadata
    res = await client.post(
        "/api/v1/documents",
        json={
            "study_id": study_id,
            "document_type": "protocol",
            "title": "Clinical Study Protocol v1.0",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/studies/AYU-TRI-2026/protocol_v1.pdf",
            "file_name": "protocol_v1.pdf",
            "file_size": 2048576,
            "mime_type": "application/pdf",
        },
    )
    assert res.status_code == 201

    # 13. Check Audit Logs
    res = await client.get("/api/v1/audit/logs")
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) >= 5
