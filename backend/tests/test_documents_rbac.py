from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.document import Document
from app.models.enums import (
    AssignmentStatus,
    DocumentStatus,
    DocumentType,
    OrganizationStatus,
    OrganizationType,
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
from app.models.site import Site, StudySite
from app.models.study import Study, StudyTeamMember
from app.models.user import Permission, Role, RolePermission, SuperAdminProfile, User


@pytest.fixture
async def document_rbac_setup(db_session: AsyncSession):
    """
    Sets up a complete multi-tenant, multi-study, multi-site environment with
    Sponsor A, CRO A, Sponsor B, Site A1, Site A2, Site B1, and various role holders.
    """
    # 0. Canonical permissions
    perm_doc_read = Permission(codename="documents:read", resource="documents", action="read", description="Read docs")
    perm_doc_upload = Permission(codename="documents:upload", resource="documents", action="upload", description="Upload docs")
    perm_gov_verify = Permission(codename="government:verify", resource="government", action="verify", description="Gov verify")
    perm_all = Permission(codename="*", resource="*", action="*", description="All")

    db_session.add_all([perm_doc_read, perm_doc_upload, perm_gov_verify, perm_all])
    await db_session.flush()

    # Roles
    role_sys_admin = Role(name="System Administrator", scope_level=ScopeLevel.system, is_system_role=True)
    role_sponsor_pi = Role(name="Principal Investigator", scope_level=ScopeLevel.study, is_system_role=False)
    role_cro_monitor = Role(name="CRO Lead Monitor", scope_level=ScopeLevel.organization, is_system_role=False)
    role_site_pi = Role(name="Site Principal Investigator", scope_level=ScopeLevel.site, is_system_role=False)
    role_site_coord = Role(name="Site Coordinator", scope_level=ScopeLevel.site, is_system_role=False)
    role_site_nurse = Role(name="Site Nurse", scope_level=ScopeLevel.site, is_system_role=False)

    db_session.add_all([role_sys_admin, role_sponsor_pi, role_cro_monitor, role_site_pi, role_site_coord, role_site_nurse])
    await db_session.flush()

    # Assign permissions to roles
    db_session.add_all([
        RolePermission(role_id=role_sys_admin.id, permission_id=perm_all.id),
        RolePermission(role_id=role_sponsor_pi.id, permission_id=perm_doc_read.id),
        RolePermission(role_id=role_sponsor_pi.id, permission_id=perm_doc_upload.id),
        RolePermission(role_id=role_cro_monitor.id, permission_id=perm_doc_read.id),
        RolePermission(role_id=role_cro_monitor.id, permission_id=perm_doc_upload.id),
        RolePermission(role_id=role_site_pi.id, permission_id=perm_doc_read.id),
        RolePermission(role_id=role_site_pi.id, permission_id=perm_doc_upload.id),
        RolePermission(role_id=role_site_coord.id, permission_id=perm_doc_read.id),  # read-only!
    ])
    await db_session.flush()

    # 1. Trusted Platform Org & Admin User
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

    # 2. Sponsor Org A & CRO Org A
    org_a = Organization(name="Ayush Pharma A", organization_type=OrganizationType.sponsor, status=OrganizationStatus.active)
    org_cro = Organization(name="Bharat CRO Solutions", organization_type=OrganizationType.cro, status=OrganizationStatus.active)
    db_session.add_all([org_a, org_cro])
    await db_session.flush()

    study_a = Study(
        study_code="AYU-STUDY-A",
        protocol_number="PRT-A-01",
        title="Ashwagandha Efficacy Trial A",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        status=StudyStatus.active,
        sponsor_org_id=org_a.id,
        cro_org_id=org_cro.id,
        therapeutic_area="Ayurveda",
    )
    site_a1 = Site(
        site_code="SITE-A1",
        name="Haridwar Research Hospital",
        site_type=SiteType.hospital,
        status=SiteStatus.active,
        city="Haridwar",
        organization_id=org_a.id,
    )
    site_a2 = Site(
        site_code="SITE-A2",
        name="Rishikesh Clinical Center",
        site_type=SiteType.hospital,
        status=SiteStatus.active,
        city="Rishikesh",
        organization_id=org_a.id,
    )
    db_session.add_all([study_a, site_a1, site_a2])
    await db_session.flush()

    db_session.add_all([
        StudySite(study_id=study_a.id, site_id=site_a1.id, activation_status=StudySiteActivationStatus.activated),
        StudySite(study_id=study_a.id, site_id=site_a2.id, activation_status=StudySiteActivationStatus.activated),
    ])
    await db_session.flush()

    # 3. Sponsor Org B & Study B
    org_b = Organization(name="Ayush Bio B", organization_type=OrganizationType.sponsor, status=OrganizationStatus.active)
    db_session.add(org_b)
    await db_session.flush()

    study_b = Study(
        study_code="AYU-STUDY-B",
        protocol_number="PRT-B-02",
        title="Brahmi Cognition Trial B",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_3,
        status=StudyStatus.active,
        sponsor_org_id=org_b.id,
        therapeutic_area="Ayurveda",
    )
    site_b1 = Site(
        site_code="SITE-B1",
        name="Varanasi Ayurvedic Hospital",
        site_type=SiteType.hospital,
        status=SiteStatus.active,
        city="Varanasi",
        organization_id=org_b.id,
    )
    db_session.add_all([study_b, site_b1])
    await db_session.flush()

    db_session.add(
        StudySite(study_id=study_b.id, site_id=site_b1.id, activation_status=StudySiteActivationStatus.activated)
    )
    await db_session.flush()

    # 4. Users
    user_sponsor_a = User(email="pi.a@sponsor-a.com", full_name="Sponsor A PI", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_cro_a = User(email="cra.a@cro-solutions.com", full_name="CRO Monitor A", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_sponsor_b = User(email="pi.b@sponsor-b.com", full_name="Sponsor B PI", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_site_pi_a1 = User(email="site_pi@haridwar.org", full_name="Site A1 PI", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_site_coord_a1 = User(email="coord@haridwar.org", full_name="Site A1 Coordinator", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_site_nurse_a1 = User(email="nurse@haridwar.org", full_name="Site A1 Nurse", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_pending = User(email="pending@sponsor-a.com", full_name="Pending User", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_revoked = User(email="revoked@haridwar.org", full_name="Revoked Staff", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_gov_superadmin = User(email="gov@ayush.gov.in", full_name="Gov SuperAdmin", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    user_unassigned = User(email="unassigned@random.com", full_name="Unassigned User", status=UserStatus.active, hashed_password=hash_password("Pass123!"))

    db_session.add_all([
        user_sponsor_a, user_cro_a, user_sponsor_b, user_site_pi_a1, user_site_coord_a1,
        user_site_nurse_a1, user_pending, user_revoked, user_gov_superadmin, user_unassigned,
    ])
    await db_session.flush()

    # Memberships and Team Assignments
    db_session.add_all([
        # Sponsor A member
        OrganizationMember(organization_id=org_a.id, user_id=user_sponsor_a.id, role_id=role_sponsor_pi.id, status=AssignmentStatus.active),
        # CRO A member
        OrganizationMember(organization_id=org_cro.id, user_id=user_cro_a.id, role_id=role_cro_monitor.id, status=AssignmentStatus.active),
        # Sponsor B member
        OrganizationMember(organization_id=org_b.id, user_id=user_sponsor_b.id, role_id=role_sponsor_pi.id, status=AssignmentStatus.active),
        # Site A1 PI
        StudyTeamMember(study_id=study_a.id, site_id=site_a1.id, user_id=user_site_pi_a1.id, role_id=role_site_pi.id, assignment_status=AssignmentStatus.active),
        # Site A1 Coordinator (read-only)
        StudyTeamMember(study_id=study_a.id, site_id=site_a1.id, user_id=user_site_coord_a1.id, role_id=role_site_coord.id, assignment_status=AssignmentStatus.active),
        # Site A1 Nurse (no doc perms)
        StudyTeamMember(study_id=study_a.id, site_id=site_a1.id, user_id=user_site_nurse_a1.id, role_id=role_site_nurse.id, assignment_status=AssignmentStatus.active),
        # Inactive/unconfirmed user in Org A
        OrganizationMember(organization_id=org_a.id, user_id=user_pending.id, role_id=role_sponsor_pi.id, status=AssignmentStatus.inactive),
        # Revoked user in Study A
        StudyTeamMember(study_id=study_a.id, site_id=site_a1.id, user_id=user_revoked.id, role_id=role_site_pi.id, assignment_status=AssignmentStatus.removed),
        # Gov Super Admin profile
        SuperAdminProfile(user_id=user_gov_superadmin.id, is_active=True),
    ])
    await db_session.flush()

    # 5. Seed Documents
    # Study A Protocol (study-level)
    doc_a_protocol = Document(
        study_id=study_a.id,
        organization_id=org_a.id,
        site_id=None,
        document_type=DocumentType.protocol,
        title="Study A Protocol v1.0",
        version="1.0",
        status=DocumentStatus.draft,
        storage_key="s3://ctms-docs/studies/A/protocol_v1.pdf",
        file_name="protocol_v1.pdf",
        uploaded_by=user_sponsor_a.id,
    )
    # Site A1 document
    doc_a_site1 = Document(
        study_id=study_a.id,
        organization_id=org_a.id,
        site_id=site_a1.id,
        document_type=DocumentType.ec_document,
        title="Site A1 Ethics Approval",
        version="1.0",
        status=DocumentStatus.under_review,
        storage_key="s3://ctms-docs/studies/A/sites/A1/ec_v1.pdf",
        file_name="ec_v1.pdf",
        uploaded_by=user_site_pi_a1.id,
    )
    # Site A2 document
    doc_a_site2 = Document(
        study_id=study_a.id,
        organization_id=org_a.id,
        site_id=site_a2.id,
        document_type=DocumentType.ec_document,
        title="Site A2 Ethics Approval",
        version="1.0",
        status=DocumentStatus.under_review,
        storage_key="s3://ctms-docs/studies/A/sites/A2/ec_v1.pdf",
        file_name="ec_v2.pdf",
        uploaded_by=user_sponsor_a.id,
    )
    # Org A Corporate SOP (org-only, no study)
    doc_a_org_sop = Document(
        study_id=None,
        organization_id=org_a.id,
        site_id=None,
        document_type=DocumentType.essential,
        title="Sponsor A Corporate SOP",
        version="2.0",
        status=DocumentStatus.draft,
        storage_key="s3://ctms-docs/orgs/A/sop_v2.pdf",
        file_name="sop_v2.pdf",
        uploaded_by=user_sponsor_a.id,
    )
    # Study B Protocol (Sponsor B)
    doc_b_protocol = Document(
        study_id=study_b.id,
        organization_id=org_b.id,
        site_id=None,
        document_type=DocumentType.protocol,
        title="Study B Protocol v1.0",
        version="1.0",
        status=DocumentStatus.draft,
        storage_key="s3://ctms-docs/studies/B/protocol_v1.pdf",
        file_name="protocol_b_v1.pdf",
        uploaded_by=user_sponsor_b.id,
    )
    # Site B1 document (Sponsor B)
    doc_b_site1 = Document(
        study_id=study_b.id,
        organization_id=org_b.id,
        site_id=site_b1.id,
        document_type=DocumentType.ec_document,
        title="Site B1 EC Document",
        version="1.0",
        status=DocumentStatus.draft,
        storage_key="s3://ctms-docs/studies/B/sites/B1/ec.pdf",
        file_name="ec_b1.pdf",
        uploaded_by=user_sponsor_b.id,
    )

    db_session.add_all([doc_a_protocol, doc_a_site1, doc_a_site2, doc_a_org_sop, doc_b_protocol, doc_b_site1])
    await db_session.commit()

    tokens = {
        "tech_admin": create_access_token({"sub": str(tech_admin.id), "email": tech_admin.email}),
        "sponsor_a": create_access_token({"sub": str(user_sponsor_a.id), "email": user_sponsor_a.email}),
        "cro_a": create_access_token({"sub": str(user_cro_a.id), "email": user_cro_a.email}),
        "sponsor_b": create_access_token({"sub": str(user_sponsor_b.id), "email": user_sponsor_b.email}),
        "site_pi_a1": create_access_token({"sub": str(user_site_pi_a1.id), "email": user_site_pi_a1.email}),
        "site_coord_a1": create_access_token({"sub": str(user_site_coord_a1.id), "email": user_site_coord_a1.email}),
        "site_nurse_a1": create_access_token({"sub": str(user_site_nurse_a1.id), "email": user_site_nurse_a1.email}),
        "pending": create_access_token({"sub": str(user_pending.id), "email": user_pending.email}),
        "revoked": create_access_token({"sub": str(user_revoked.id), "email": user_revoked.email}),
        "gov_superadmin": create_access_token({"sub": str(user_gov_superadmin.id), "email": user_gov_superadmin.email}),
        "unassigned": create_access_token({"sub": str(user_unassigned.id), "email": user_unassigned.email}),
    }

    return {
        "org_a": org_a,
        "org_b": org_b,
        "org_cro": org_cro,
        "study_a": study_a,
        "study_b": study_b,
        "site_a1": site_a1,
        "site_a2": site_a2,
        "site_b1": site_b1,
        "docs": {
            "a_protocol": doc_a_protocol,
            "a_site1": doc_a_site1,
            "a_site2": doc_a_site2,
            "a_org_sop": doc_a_org_sop,
            "b_protocol": doc_b_protocol,
            "b_site1": doc_b_site1,
        },
        "tokens": tokens,
    }


# ==============================================================================
# 1. Cross-Tenant Isolation (Sponsor A vs Sponsor B)
# ==============================================================================

@pytest.mark.asyncio
async def test_sponsor_a_cannot_access_sponsor_b_documents(client: AsyncClient, document_rbac_setup: dict):
    tokens = document_rbac_setup["tokens"]
    doc_b = document_rbac_setup["docs"]["b_protocol"]
    study_b = document_rbac_setup["study_b"]

    # 1. Listing does not leak Sponsor B's document
    res = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {tokens['sponsor_a']}"})
    assert res.status_code == 200
    listed_ids = [d["id"] for d in res.json()]
    assert str(doc_b.id) not in listed_ids

    # 2. Filtering by Sponsor B's study returns 403 Forbidden
    res = await client.get(f"/api/v1/documents?study_id={study_b.id}", headers={"Authorization": f"Bearer {tokens['sponsor_a']}"})
    assert res.status_code == 403

    # 3. Direct GET by ID on Sponsor B's document returns 403 Forbidden
    res = await client.get(f"/api/v1/documents/{doc_b.id}", headers={"Authorization": f"Bearer {tokens['sponsor_a']}"})
    assert res.status_code == 403

    # 4. Attempting to transition Sponsor B's document returns 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_b.id}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "under_review", "reason": "Malicious transition"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_sponsor_a_cannot_create_document_in_sponsor_b_study(client: AsyncClient, document_rbac_setup: dict):
    tokens = document_rbac_setup["tokens"]
    study_b = document_rbac_setup["study_b"]

    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "study_id": str(study_b.id),
            "document_type": "protocol",
            "title": "Imposter Protocol",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/studies/B/imposter.pdf",
            "file_name": "imposter.pdf",
        },
    )
    assert res.status_code == 403


# ==============================================================================
# 2. CRO Access vs Unrelated Study Isolation
# ==============================================================================

@pytest.mark.asyncio
async def test_cro_access_to_assigned_study_and_denial_on_unrelated_study(client: AsyncClient, document_rbac_setup: dict):
    tokens = document_rbac_setup["tokens"]
    doc_a = document_rbac_setup["docs"]["a_protocol"]
    doc_b = document_rbac_setup["docs"]["b_protocol"]
    study_b = document_rbac_setup["study_b"]

    # CRO A can access Study A documents
    res = await client.get(f"/api/v1/documents/{doc_a.id}", headers={"Authorization": f"Bearer {tokens['cro_a']}"})
    assert res.status_code == 200
    assert res.json()["title"] == doc_a.title

    # CRO A is denied on Study B documents
    res = await client.get(f"/api/v1/documents/{doc_b.id}", headers={"Authorization": f"Bearer {tokens['cro_a']}"})
    assert res.status_code == 403

    # CRO A cannot create document for Study B
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['cro_a']}"},
        json={
            "study_id": str(study_b.id),
            "document_type": "protocol",
            "title": "CRO Imposter Doc",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/studies/B/cro_imposter.pdf",
            "file_name": "cro_imposter.pdf",
        },
    )
    assert res.status_code == 403


# ==============================================================================
# 3. Site-Level Scope and Cross-Site Isolation
# ==============================================================================

@pytest.mark.asyncio
async def test_site_staff_can_access_own_site_and_study_doc_but_denied_other_sites(client: AsyncClient, document_rbac_setup: dict):
    tokens = document_rbac_setup["tokens"]
    doc_proto = document_rbac_setup["docs"]["a_protocol"]
    doc_site1 = document_rbac_setup["docs"]["a_site1"]
    doc_site2 = document_rbac_setup["docs"]["a_site2"]
    site_a2 = document_rbac_setup["site_a2"]

    # Site A1 PI can read study-level protocol (site_id=None)
    res = await client.get(f"/api/v1/documents/{doc_proto.id}", headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"})
    assert res.status_code == 200

    # Site A1 PI can read their own site's document (site_id=site_a1.id)
    res = await client.get(f"/api/v1/documents/{doc_site1.id}", headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"})
    assert res.status_code == 200

    # Site A1 PI CANNOT read Site A2's document (site_id=site_a2.id) -> 403
    res = await client.get(f"/api/v1/documents/{doc_site2.id}", headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"})
    assert res.status_code == 403

    # Site A1 PI query with site_id=site_a2 -> 403
    res = await client.get(f"/api/v1/documents?site_id={site_a2.id}", headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"})
    assert res.status_code == 403

    # Site A1 PI listing only returns protocol and site1 doc, NEVER site2 doc
    res = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"})
    assert res.status_code == 200
    listed_ids = [d["id"] for d in res.json()]
    assert str(doc_proto.id) in listed_ids
    assert str(doc_site1.id) in listed_ids
    assert str(doc_site2.id) not in listed_ids


@pytest.mark.asyncio
async def test_site_pi_cannot_upload_for_another_site(client: AsyncClient, document_rbac_setup: dict):
    tokens = document_rbac_setup["tokens"]
    study_a = document_rbac_setup["study_a"]
    site_a2 = document_rbac_setup["site_a2"]

    # Site A1 PI attempts to upload document for Site A2 -> 403
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"},
        json={
            "study_id": str(study_a.id),
            "site_id": str(site_a2.id),
            "document_type": "ec_document",
            "title": "Unauthorized Site A2 Upload",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/studies/A/sites/A2/tamper.pdf",
            "file_name": "tamper.pdf",
        },
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_site_pi_cannot_approve_study_wide_documents(client: AsyncClient, document_rbac_setup: dict):
    tokens = document_rbac_setup["tokens"]
    doc_proto = document_rbac_setup["docs"]["a_protocol"]
    doc_site1 = document_rbac_setup["docs"]["a_site1"]

    # Site PI attempts to transition/approve study-wide protocol -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_proto.id}/transition",
        headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"},
        json={"new_status": "under_review", "reason": "Site PI attempting review on study-wide doc"},
    )
    assert res.status_code == 403

    # But Site PI CAN transition their own site document (under_review -> approved)
    res = await client.post(
        f"/api/v1/documents/{doc_site1.id}/transition",
        headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"},
        json={"new_status": "approved", "reason": "Site PI approves local EC document"},
    )
    assert res.status_code == 200
    updated_doc = res.json()
    assert updated_doc["status"] == "approved"
    assert updated_doc["approved_by"] is not None
    assert updated_doc["approved_at"] is not None


# ==============================================================================
# 4. Write Permission Enforcement (Site Coordinator vs Site Nurse)
# ==============================================================================

@pytest.mark.asyncio
async def test_read_only_site_coordinator_cannot_upload_or_transition(client: AsyncClient, document_rbac_setup: dict):
    tokens = document_rbac_setup["tokens"]
    doc_site1 = document_rbac_setup["docs"]["a_site1"]
    study_a = document_rbac_setup["study_a"]
    site_a1 = document_rbac_setup["site_a1"]

    # Site coordinator CAN read
    res = await client.get(f"/api/v1/documents/{doc_site1.id}", headers={"Authorization": f"Bearer {tokens['site_coord_a1']}"})
    assert res.status_code == 200

    # Site coordinator CANNOT upload -> 403 (missing documents:upload)
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['site_coord_a1']}"},
        json={
            "study_id": str(study_a.id),
            "site_id": str(site_a1.id),
            "document_type": "essential",
            "title": "Coord Attempt",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/coord.pdf",
            "file_name": "coord.pdf",
        },
    )
    assert res.status_code == 403

    # Site coordinator CANNOT transition -> 403
    res = await client.post(
        f"/api/v1/documents/{doc_site1.id}/transition",
        headers={"Authorization": f"Bearer {tokens['site_coord_a1']}"},
        json={"new_status": "approved", "reason": "Coordinator approving"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_user_without_document_permissions_is_denied_everywhere(client: AsyncClient, document_rbac_setup: dict):
    tokens = document_rbac_setup["tokens"]
    doc_proto = document_rbac_setup["docs"]["a_protocol"]

    # Site nurse (no doc perms)
    res = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {tokens['site_nurse_a1']}"})
    assert res.status_code == 403

    res = await client.get(f"/api/v1/documents/{doc_proto.id}", headers={"Authorization": f"Bearer {tokens['site_nurse_a1']}"})
    assert res.status_code == 403


# ==============================================================================
# 5. Pending, Revoked, and Unassigned Users
# ==============================================================================

@pytest.mark.asyncio
async def test_pending_and_revoked_users_cannot_access_documents(client: AsyncClient, document_rbac_setup: dict):
    tokens = document_rbac_setup["tokens"]
    doc_proto = document_rbac_setup["docs"]["a_protocol"]

    # Pending user
    res = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {tokens['pending']}"})
    assert res.status_code == 403

    res = await client.get(f"/api/v1/documents/{doc_proto.id}", headers={"Authorization": f"Bearer {tokens['pending']}"})
    assert res.status_code == 403

    # Revoked team member
    res = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {tokens['revoked']}"})
    assert res.status_code == 403

    res = await client.get(f"/api/v1/documents/{doc_proto.id}", headers={"Authorization": f"Bearer {tokens['revoked']}"})
    assert res.status_code == 403

    # Unassigned user
    res = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {tokens['unassigned']}"})
    assert res.status_code == 403


# ==============================================================================
# 6. Admin Roles Separation (Technical Admin vs Government Super Admin)
# ==============================================================================

@pytest.mark.asyncio
async def test_gov_superadmin_has_no_document_bypass_and_tech_admin_retains_access(client: AsyncClient, document_rbac_setup: dict):
    tokens = document_rbac_setup["tokens"]
    doc_proto = document_rbac_setup["docs"]["a_protocol"]
    doc_b = document_rbac_setup["docs"]["b_protocol"]

    # Gov Super Admin has NO document access
    res = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {tokens['gov_superadmin']}"})
    assert res.status_code == 403

    res = await client.get(f"/api/v1/documents/{doc_proto.id}", headers={"Authorization": f"Bearer {tokens['gov_superadmin']}"})
    assert res.status_code == 403

    # Technical System Admin has full access across all studies
    res = await client.get(f"/api/v1/documents/{doc_proto.id}", headers={"Authorization": f"Bearer {tokens['tech_admin']}"})
    assert res.status_code == 200

    res = await client.get(f"/api/v1/documents/{doc_b.id}", headers={"Authorization": f"Bearer {tokens['tech_admin']}"})
    assert res.status_code == 200

    # Tech admin can list all docs
    res = await client.get("/api/v1/documents", headers={"Authorization": f"Bearer {tokens['tech_admin']}"})
    assert res.status_code == 200
    assert len(res.json()) >= 6


# ==============================================================================
# 7. Path Traversal & Unscoped Metadata Rejection
# ==============================================================================

@pytest.mark.asyncio
async def test_path_traversal_and_unscoped_metadata_rejection(client: AsyncClient, document_rbac_setup: dict):
    tokens = document_rbac_setup["tokens"]
    study_a = document_rbac_setup["study_a"]

    # 1. Path traversal in storage_key
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "study_id": str(study_a.id),
            "document_type": "protocol",
            "title": "Traversal Attack",
            "version": "1.0",
            "storage_key": "s3://bucket/../../etc/passwd",
            "file_name": "clean.pdf",
        },
    )
    assert res.status_code == 400
    assert "path traversal" in res.json()["detail"].lower()

    # 2. Path traversal in file_name
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "study_id": str(study_a.id),
            "document_type": "protocol",
            "title": "Traversal Attack 2",
            "version": "1.0",
            "storage_key": "s3://bucket/docs/clean.pdf",
            "file_name": "../../root/secret.pdf",
        },
    )
    assert res.status_code == 400

    # 3. Unscoped document (no study, no org, no site) by non-admin
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "document_type": "protocol",
            "title": "Unscoped Document",
            "version": "1.0",
            "storage_key": "s3://bucket/docs/unscoped.pdf",
            "file_name": "unscoped.pdf",
        },
    )
    assert res.status_code == 400


# ==============================================================================
# 8. Full Authorized Flow & Audit Trail Hash-Chain Integrity
# ==============================================================================

@pytest.mark.asyncio
async def test_authorized_document_lifecycle_and_audit_integrity(
    client: AsyncClient,
    document_rbac_setup: dict,
    db_session: AsyncSession,
):
    tokens = document_rbac_setup["tokens"]
    study_a = document_rbac_setup["study_a"]
    org_a = document_rbac_setup["org_a"]

    # 1. Sponsor A creates a new protocol version
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "study_id": str(study_a.id),
            "organization_id": str(org_a.id),
            "document_type": "protocol",
            "title": "Study A Protocol Version 2.0",
            "version": "2.0",
            "storage_key": "s3://ctms-docs/studies/A/protocol_v2.0.pdf",
            "file_name": "protocol_v2.0.pdf",
            "file_size": 1024500,
            "mime_type": "application/pdf",
            "checksum": "a" * 64,
        },
    )
    assert res.status_code == 201
    created_doc = res.json()
    doc_id = created_doc["id"]
    assert created_doc["status"] == "draft"

    # 2. Transition draft -> under_review
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "under_review", "reason": "Submitted for IEC review"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "under_review"

    # 3. Transition under_review -> approved
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "approved", "reason": "IEC Approval received"},
    )
    assert res.status_code == 200
    approved_doc = res.json()
    assert approved_doc["status"] == "approved"
    assert approved_doc["approved_by"] is not None
    assert approved_doc["approved_at"] is not None

    # 4. Verify audit entries and hash chain via technical admin audit verify endpoint
    verify_res = await client.get("/api/v1/audit/verify", headers={"Authorization": f"Bearer {tokens['tech_admin']}"})
    assert verify_res.status_code == 200
    chain_result = verify_res.json()
    assert chain_result["valid"] is True, f"Hash chain invalid: {chain_result}"
    assert chain_result["verified_records"] >= 3


# ==============================================================================
# 9. F03B: Granular Document Lifecycle Transitions & Role Policy
# ==============================================================================

@pytest.mark.asyncio
async def test_document_lifecycle_transitions_individually(
    client: AsyncClient,
    document_rbac_setup: dict,
):
    """
    Verifies every supported state transition individually:
    - draft -> under_review (submission)
    - under_review -> draft (rejection / revision request)
    - draft -> under_review (resubmission)
    - under_review -> approved (approval)
    - approved -> superseded (superseded)
    - under_review -> archived, draft -> archived, approved -> archived
    - approved -> expired
    """
    tokens = document_rbac_setup["tokens"]
    study_a = document_rbac_setup["study_a"]
    org_a = document_rbac_setup["org_a"]

    # 1. Create a draft document
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "study_id": str(study_a.id),
            "organization_id": str(org_a.id),
            "document_type": "regulatory",
            "title": "Clinical Trial Agreement v1.0",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/studies/A/cta_v1.pdf",
            "file_name": "cta_v1.pdf",
        },
    )
    assert res.status_code == 201
    doc_id = res.json()["id"]
    assert res.json()["status"] == "draft"

    # 2. Submission: draft -> under_review
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "under_review", "reason": "Submit for legal review"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "under_review"

    # 3. Rejection / Revision requested: under_review -> draft
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {tokens['cro_a']}"},
        json={"new_status": "draft", "reason": "Indemnity clause needs amendment"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "draft"
    assert res.json()["approved_by"] is None
    assert res.json()["approved_at"] is None

    # 4. Resubmission: draft -> under_review
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "under_review", "reason": "Resubmitting amended CTA"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "under_review"

    # 5. Approval: under_review -> approved
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "approved", "reason": "Legal and regulatory sign-off complete"},
    )
    assert res.status_code == 200
    approved_data = res.json()
    assert approved_data["status"] == "approved"
    assert approved_data["approved_by"] is not None
    assert approved_data["approved_at"] is not None

    # 6. Terminal status: approved -> superseded
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "superseded", "reason": "Superseded by CTA v2.0"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "superseded"

    # 7. Create another doc to test approved -> expired
    res2 = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "study_id": str(study_a.id),
            "document_type": "training",
            "title": "GCP Training Certificate",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/studies/A/gcp_cert.pdf",
            "file_name": "gcp_cert.pdf",
        },
    )
    assert res2.status_code == 201
    doc_id2 = res2.json()["id"]

    await client.post(
        f"/api/v1/documents/{doc_id2}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "under_review", "reason": "Review cert"},
    )
    await client.post(
        f"/api/v1/documents/{doc_id2}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "approved", "reason": "Approve cert"},
    )
    res_exp = await client.post(
        f"/api/v1/documents/{doc_id2}/transition",
        headers={"Authorization": f"Bearer {tokens['cro_a']}"},
        json={"new_status": "expired", "reason": "Certificate expired after 2-year validity"},
    )
    assert res_exp.status_code == 200
    assert res_exp.json()["status"] == "expired"

    # 8. Create another doc to test draft -> archived
    res3 = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "study_id": str(study_a.id),
            "document_type": "other",
            "title": "Discarded Draft Protocol",
            "version": "0.1",
            "storage_key": "s3://ctms-docs/studies/A/discarded.pdf",
            "file_name": "discarded.pdf",
        },
    )
    assert res3.status_code == 201
    doc_id3 = res3.json()["id"]
    res_arch = await client.post(
        f"/api/v1/documents/{doc_id3}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "archived", "reason": "Obsolete working draft archived"},
    )
    assert res_arch.status_code == 200
    assert res_arch.json()["status"] == "archived"


@pytest.mark.asyncio
async def test_uploader_without_approval_authority_cannot_approve_reject_or_archive(
    client: AsyncClient,
    document_rbac_setup: dict,
    db_session: AsyncSession,
):
    """
    Enforces that upload permission (documents:upload) does NOT implicitly authorize
    approval, rejection, or archival. A site staff member holding upload permissions
    cannot approve, reject, or archive without separate approval authority (e.g. Site PI).
    """
    study_a = document_rbac_setup["study_a"]
    site_a1 = document_rbac_setup["site_a1"]

    # Create a site uploader role with documents:upload and documents:read (non-investigator)
    perm_doc_read = (await db_session.execute(
        select(Permission).where(Permission.codename == "documents:read")
    )).scalars().first()
    perm_doc_upload = (await db_session.execute(
        select(Permission).where(Permission.codename == "documents:upload")
    )).scalars().first()
    assert perm_doc_read and perm_doc_upload

    role_uploader = Role(name="Site Document Clerk", scope_level=ScopeLevel.site, is_system_role=False)
    db_session.add(role_uploader)
    await db_session.flush()

    db_session.add_all([
        RolePermission(role_id=role_uploader.id, permission_id=perm_doc_read.id),
        RolePermission(role_id=role_uploader.id, permission_id=perm_doc_upload.id),
    ])
    await db_session.flush()

    user_uploader = User(
        email="uploader@haridwar.org",
        full_name="Site A1 Uploader",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(user_uploader)
    await db_session.flush()

    db_session.add(
        StudyTeamMember(
            study_id=study_a.id,
            site_id=site_a1.id,
            user_id=user_uploader.id,
            role_id=role_uploader.id,
            assignment_status=AssignmentStatus.active,
        )
    )
    await db_session.commit()

    token_uploader = create_access_token({"sub": str(user_uploader.id), "email": user_uploader.email})
    token_site_pi = document_rbac_setup["tokens"]["site_pi_a1"]

    # 1. Uploader can create draft for their site
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {token_uploader}"},
        json={
            "study_id": str(study_a.id),
            "site_id": str(site_a1.id),
            "document_type": "essential",
            "title": "Site A1 Source Document Worksheet",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/studies/A/sites/A1/worksheet.pdf",
            "file_name": "worksheet.pdf",
        },
    )
    assert res.status_code == 201
    doc_id = res.json()["id"]

    # 2. Uploader can submit draft for review
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_uploader}"},
        json={"new_status": "under_review", "reason": "Ready for Site PI review"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "under_review"

    # 3. Uploader CANNOT approve (under_review -> approved) -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_uploader}"},
        json={"new_status": "approved", "reason": "Self-approving draft"},
    )
    assert res.status_code == 403
    assert "approve" in res.json()["detail"].lower()

    # 4. Uploader CANNOT reject (under_review -> draft) -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_uploader}"},
        json={"new_status": "draft", "reason": "Unauthorized rejection"},
    )
    assert res.status_code == 403
    assert "reject" in res.json()["detail"].lower()

    # 5. Uploader CANNOT archive (under_review -> archived) -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_uploader}"},
        json={"new_status": "archived", "reason": "Unauthorized archival"},
    )
    assert res.status_code == 403
    assert "archive" in res.json()["detail"].lower()

    # 6. Site PI (with approval authority) CAN approve
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_site_pi}"},
        json={"new_status": "approved", "reason": "Site PI formal approval"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "approved"

    # 7. Uploader CANNOT supersede or expire approved document -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_uploader}"},
        json={"new_status": "superseded", "reason": "Unauthorized supersede"},
    )
    assert res.status_code == 403

    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_uploader}"},
        json={"new_status": "expired", "reason": "Unauthorized expiry"},
    )
    assert res.status_code == 403

    # 8. Uploader CANNOT archive approved document -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_uploader}"},
        json={"new_status": "archived", "reason": "Unauthorized archive approved"},
    )
    assert res.status_code == 403

    # 9. Site PI CAN archive approved site document
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_site_pi}"},
        json={"new_status": "archived", "reason": "Site PI archives retired worksheet"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "archived"


@pytest.mark.asyncio
async def test_site_pi_cannot_govern_or_mutate_study_wide_documents(
    client: AsyncClient,
    document_rbac_setup: dict,
):
    """
    Confirms that Site PI has zero mutation or governance authority over study-wide documents.
    Site PI cannot submit, reject, approve, archive, supersede, or expire study-wide documents.
    """
    tokens = document_rbac_setup["tokens"]
    doc_proto = document_rbac_setup["docs"]["a_protocol"]

    # 1. In draft: Site PI cannot transition draft -> under_review on study-wide doc
    res = await client.post(
        f"/api/v1/documents/{doc_proto.id}/transition",
        headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"},
        json={"new_status": "under_review", "reason": "Site PI submitting global protocol"},
    )
    assert res.status_code == 403

    # Sponsor transitions doc to under_review
    res = await client.post(
        f"/api/v1/documents/{doc_proto.id}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "under_review", "reason": "Sponsor submitted for IEC review"},
    )
    assert res.status_code == 200

    # 2. In under_review: Site PI cannot reject (under_review -> draft)
    res = await client.post(
        f"/api/v1/documents/{doc_proto.id}/transition",
        headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"},
        json={"new_status": "draft", "reason": "Site PI attempting rejection on global protocol"},
    )
    assert res.status_code == 403

    # 3. In under_review: Site PI cannot archive (under_review -> archived)
    res = await client.post(
        f"/api/v1/documents/{doc_proto.id}/transition",
        headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"},
        json={"new_status": "archived", "reason": "Site PI attempting archive on global protocol"},
    )
    assert res.status_code == 403

    # 4. In under_review: Site PI cannot approve (under_review -> approved)
    res = await client.post(
        f"/api/v1/documents/{doc_proto.id}/transition",
        headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"},
        json={"new_status": "approved", "reason": "Site PI attempting approval on global protocol"},
    )
    assert res.status_code == 403

    # Sponsor approves doc
    res = await client.post(
        f"/api/v1/documents/{doc_proto.id}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "approved", "reason": "Sponsor signs off protocol"},
    )
    assert res.status_code == 200

    # 5. In approved: Site PI cannot supersede, expire, or archive
    res = await client.post(
        f"/api/v1/documents/{doc_proto.id}/transition",
        headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"},
        json={"new_status": "superseded", "reason": "Site PI attempting supersede"},
    )
    assert res.status_code == 403

    res = await client.post(
        f"/api/v1/documents/{doc_proto.id}/transition",
        headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"},
        json={"new_status": "expired", "reason": "Site PI attempting expiry"},
    )
    assert res.status_code == 403

    res = await client.post(
        f"/api/v1/documents/{doc_proto.id}/transition",
        headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"},
        json={"new_status": "archived", "reason": "Site PI attempting archive approved protocol"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_invalid_and_out_of_sequence_transitions_rejected(
    client: AsyncClient,
    document_rbac_setup: dict,
):
    """
    Confirms state-machine integrity: invalid or out-of-sequence transitions and
    unrecognized status strings are rejected with HTTP 400 Bad Request.
    """
    tokens = document_rbac_setup["tokens"]
    study_a = document_rbac_setup["study_a"]

    # Create a draft document
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "study_id": str(study_a.id),
            "document_type": "protocol",
            "title": "State Machine Validation Doc",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/sm_test.pdf",
            "file_name": "sm_test.pdf",
        },
    )
    assert res.status_code == 201
    doc_id = res.json()["id"]

    # 1. draft -> approved (skipping review) -> 400 Bad Request
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "approved", "reason": "Bypassing review"},
    )
    assert res.status_code == 400
    assert "invalid transition" in res.json()["detail"].lower()

    # 2. draft -> superseded -> 400 Bad Request
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "superseded", "reason": "Direct supersede"},
    )
    assert res.status_code == 400

    # 3. Unrecognized status string -> 400 Bad Request
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "deleted", "reason": "Delete attempt"},
    )
    assert res.status_code == 400
    assert "invalid document status" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_cross_scope_manipulated_ids_during_creation(
    client: AsyncClient,
    document_rbac_setup: dict,
):
    """
    Tests creation with manipulated IDs:
    - Valid study_id with non-existent site_id -> 404
    - Valid study_id with site_id belonging to an unrelated study -> 400
    - Valid study_id with organization_id belonging to an unrelated tenant -> 403
    - Non-existent study_id -> 404
    """
    tokens = document_rbac_setup["tokens"]
    study_a = document_rbac_setup["study_a"]
    org_b = document_rbac_setup["org_b"]
    site_b1 = document_rbac_setup["site_b1"]
    fake_id = uuid.uuid4()

    # 1. Valid study_a with non-existent site_id -> 404 Site not found
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "study_id": str(study_a.id),
            "site_id": str(fake_id),
            "document_type": "essential",
            "title": "Manipulated Site Doc",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/tamper1.pdf",
            "file_name": "tamper1.pdf",
        },
    )
    assert res.status_code == 404
    assert "site not found" in res.json()["detail"].lower()

    # 2. Valid study_a with site_b1 (associated with Study B, NOT Study A) -> 400 Bad Request
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "study_id": str(study_a.id),
            "site_id": str(site_b1.id),
            "document_type": "essential",
            "title": "Cross-Study Site Doc",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/tamper2.pdf",
            "file_name": "tamper2.pdf",
        },
    )
    assert res.status_code == 400
    assert "not associated" in res.json()["detail"].lower()

    # 3. Valid study_a with org_b (unrelated tenant) -> 403 Forbidden
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "study_id": str(study_a.id),
            "organization_id": str(org_b.id),
            "document_type": "essential",
            "title": "Cross-Tenant Org Doc",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/tamper3.pdf",
            "file_name": "tamper3.pdf",
        },
    )
    assert res.status_code == 403
    assert "access denied" in res.json()["detail"].lower()

    # 4. Non-existent study_id -> 404 Study not found
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "study_id": str(fake_id),
            "document_type": "protocol",
            "title": "Non-existent Study Doc",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/tamper4.pdf",
            "file_name": "tamper4.pdf",
        },
    )
    assert res.status_code == 404
    assert "study not found" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_direct_lookup_by_id_enforces_exact_same_boundaries_as_listing(
    client: AsyncClient,
    document_rbac_setup: dict,
):
    """
    Confirms GET /documents/{document_id} strictly enforces tenant, study, site,
    and role boundaries, identical to GET /documents listing.
    """
    tokens = document_rbac_setup["tokens"]
    doc_proto_a = document_rbac_setup["docs"]["a_protocol"]
    doc_site_a2 = document_rbac_setup["docs"]["a_site2"]
    doc_proto_b = document_rbac_setup["docs"]["b_protocol"]

    # 1. Site A1 PI querying Site A2 document by exact ID -> 403 Forbidden
    res = await client.get(
        f"/api/v1/documents/{doc_site_a2.id}",
        headers={"Authorization": f"Bearer {tokens['site_pi_a1']}"},
    )
    assert res.status_code == 403

    # 2. Sponsor A querying Study B document by exact ID -> 403 Forbidden
    res = await client.get(
        f"/api/v1/documents/{doc_proto_b.id}",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
    )
    assert res.status_code == 403

    # 3. CRO A querying Study B document by exact ID -> 403 Forbidden
    res = await client.get(
        f"/api/v1/documents/{doc_proto_b.id}",
        headers={"Authorization": f"Bearer {tokens['cro_a']}"},
    )
    assert res.status_code == 403

    # 4. Inactive membership user querying Study A document by exact ID -> 403 Forbidden
    res = await client.get(
        f"/api/v1/documents/{doc_proto_a.id}",
        headers={"Authorization": f"Bearer {tokens['pending']}"},
    )
    assert res.status_code == 403

    # 5. Revoked assignment querying Study A document by exact ID -> 403 Forbidden
    res = await client.get(
        f"/api/v1/documents/{doc_proto_a.id}",
        headers={"Authorization": f"Bearer {tokens['revoked']}"},
    )
    assert res.status_code == 403

    # 6. Gov Super Admin querying Study A document by exact ID -> 403 Forbidden
    res = await client.get(
        f"/api/v1/documents/{doc_proto_a.id}",
        headers={"Authorization": f"Bearer {tokens['gov_superadmin']}"},
    )
    assert res.status_code == 403

    # 7. Unassigned user querying Study A document by exact ID -> 403 Forbidden
    res = await client.get(
        f"/api/v1/documents/{doc_proto_a.id}",
        headers={"Authorization": f"Bearer {tokens['unassigned']}"},
    )
    assert res.status_code == 403

    # 8. Non-existent document ID -> 404 Not Found
    res = await client.get(
        f"/api/v1/documents/{uuid.uuid4()}",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
    )
    assert res.status_code == 404


# ==============================================================================
# 10. F03C: Substring Vulnerability Remediation & Exact Token Matching
# ==============================================================================

@pytest.mark.asyncio
async def test_hospital_site_coordinator_and_administrator_cannot_exploit_substring_vulnerability(
    client: AsyncClient,
    document_rbac_setup: dict,
    db_session: AsyncSession,
):
    """
    Adversarial regression test for F03C:
    Proves that roles containing 'hospital' (which contains the substring 'pi')
    such as 'Hospital Site Coordinator' and 'Hospital Administrator' CANNOT acquire
    unintended document approval, rejection, or archival authority.
    """
    study_a = document_rbac_setup["study_a"]
    site_a1 = document_rbac_setup["site_a1"]
    org_a = document_rbac_setup["org_a"]

    perm_doc_read = (await db_session.execute(
        select(Permission).where(Permission.codename == "documents:read")
    )).scalars().first()
    perm_doc_upload = (await db_session.execute(
        select(Permission).where(Permission.codename == "documents:upload")
    )).scalars().first()
    assert perm_doc_read and perm_doc_upload

    # 1. Role: Hospital Site Coordinator
    role_hosp_coord = Role(name="Hospital Site Coordinator", scope_level=ScopeLevel.site, is_system_role=False)
    role_hosp_admin = Role(name="Hospital Administrator", scope_level=ScopeLevel.site, is_system_role=False)
    role_hosp_org_admin = Role(name="Hospital Org Administrator", scope_level=ScopeLevel.organization, is_system_role=False)
    db_session.add_all([role_hosp_coord, role_hosp_admin, role_hosp_org_admin])
    await db_session.flush()

    for r in (role_hosp_coord, role_hosp_admin, role_hosp_org_admin):
        db_session.add_all([
            RolePermission(role_id=r.id, permission_id=perm_doc_read.id),
            RolePermission(role_id=r.id, permission_id=perm_doc_upload.id),
        ])
    await db_session.flush()

    user_hosp_coord = User(
        email="hosp_coord@hospital.org",
        full_name="Hospital Site Coordinator User",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    user_hosp_admin = User(
        email="hosp_admin@hospital.org",
        full_name="Hospital Administrator User",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    user_org_admin = User(
        email="org_admin@hospital.org",
        full_name="Hospital Org Administrator User",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add_all([user_hosp_coord, user_hosp_admin, user_org_admin])
    await db_session.flush()

    db_session.add_all([
        StudyTeamMember(
            study_id=study_a.id,
            site_id=site_a1.id,
            user_id=user_hosp_coord.id,
            role_id=role_hosp_coord.id,
            assignment_status=AssignmentStatus.active,
        ),
        StudyTeamMember(
            study_id=study_a.id,
            site_id=site_a1.id,
            user_id=user_hosp_admin.id,
            role_id=role_hosp_admin.id,
            assignment_status=AssignmentStatus.active,
        ),
        OrganizationMember(
            organization_id=org_a.id,
            user_id=user_org_admin.id,
            role_id=role_hosp_org_admin.id,
            status=AssignmentStatus.active,
        ),
    ])
    await db_session.commit()

    token_hosp_coord = create_access_token({"sub": str(user_hosp_coord.id), "email": user_hosp_coord.email})
    token_hosp_admin = create_access_token({"sub": str(user_hosp_admin.id), "email": user_hosp_admin.email})
    token_org_admin = create_access_token({"sub": str(user_org_admin.id), "email": user_org_admin.email})
    token_site_pi = document_rbac_setup["tokens"]["site_pi_a1"]

    # Create a site document in draft and submit to under_review
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {token_hosp_coord}"},
        json={
            "study_id": str(study_a.id),
            "site_id": str(site_a1.id),
            "document_type": "essential",
            "title": "Hospital Site Log",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/studies/A/sites/A1/hosp_log.pdf",
            "file_name": "hosp_log.pdf",
        },
    )
    assert res.status_code == 201
    doc_id = res.json()["id"]

    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_hosp_coord}"},
        json={"new_status": "under_review", "reason": "Submitted for approval"},
    )
    assert res.status_code == 200

    # 1. Hospital Site Coordinator CANNOT approve (under_review -> approved) -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_hosp_coord}"},
        json={"new_status": "approved", "reason": "Hospital Site Coordinator attempting approval"},
    )
    assert res.status_code == 403
    assert "approve" in res.json()["detail"].lower()

    # Hospital Site Coordinator CANNOT reject (under_review -> draft) -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_hosp_coord}"},
        json={"new_status": "draft", "reason": "Hospital Site Coordinator attempting rejection"},
    )
    assert res.status_code == 403

    # Hospital Site Coordinator CANNOT archive (under_review -> archived) -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_hosp_coord}"},
        json={"new_status": "archived", "reason": "Hospital Site Coordinator attempting archival"},
    )
    assert res.status_code == 403

    # 2. Hospital Administrator CANNOT approve (under_review -> approved) -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_hosp_admin}"},
        json={"new_status": "approved", "reason": "Hospital Administrator attempting approval"},
    )
    assert res.status_code == 403
    assert "approve" in res.json()["detail"].lower()

    # 3. Hospital Org Administrator CANNOT approve via organization membership -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_org_admin}"},
        json={"new_status": "approved", "reason": "Org Hospital Administrator attempting approval"},
    )
    assert res.status_code == 403

    # 4. Legitimate Site PI CAN approve
    res = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_site_pi}"},
        json={"new_status": "approved", "reason": "Legitimate Site PI approval"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "approved"


@pytest.mark.asyncio
async def test_site_investigator_approval_scoping_and_isolation(
    client: AsyncClient,
    document_rbac_setup: dict,
    db_session: AsyncSession,
):
    """
    Proves that an explicitly authorized Investigator or Site PI:
    - Can approve documents ONLY within their assigned site.
    - CANNOT approve documents in another site (even within the same study).
    - CANNOT approve study-wide documents (site_id=None).
    - CANNOT approve documents in another study.
    """
    study_a = document_rbac_setup["study_a"]
    site_a1 = document_rbac_setup["site_a1"]
    doc_site_a2 = document_rbac_setup["docs"]["a_site2"]
    doc_proto_a = document_rbac_setup["docs"]["a_protocol"]
    doc_proto_b = document_rbac_setup["docs"]["b_protocol"]

    perm_doc_read = (await db_session.execute(
        select(Permission).where(Permission.codename == "documents:read")
    )).scalars().first()
    perm_doc_upload = (await db_session.execute(
        select(Permission).where(Permission.codename == "documents:upload")
    )).scalars().first()

    # Create role 'Investigator' (pure token 'investigator')
    role_inv = Role(name="Investigator", scope_level=ScopeLevel.site, is_system_role=False)
    db_session.add(role_inv)
    await db_session.flush()

    db_session.add_all([
        RolePermission(role_id=role_inv.id, permission_id=perm_doc_read.id),
        RolePermission(role_id=role_inv.id, permission_id=perm_doc_upload.id),
    ])
    await db_session.flush()

    user_inv = User(
        email="sub_investigator@haridwar.org",
        full_name="Site A1 Sub-Investigator",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(user_inv)
    await db_session.flush()

    db_session.add(
        StudyTeamMember(
            study_id=study_a.id,
            site_id=site_a1.id,
            user_id=user_inv.id,
            role_id=role_inv.id,
            assignment_status=AssignmentStatus.active,
        )
    )
    await db_session.commit()

    token_inv = create_access_token({"sub": str(user_inv.id), "email": user_inv.email})

    # 1. Investigator creates and approves document for assigned Site A1 -> 200 OK
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {token_inv}"},
        json={
            "study_id": str(study_a.id),
            "site_id": str(site_a1.id),
            "document_type": "essential",
            "title": "Investigator Delegation Log",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/studies/A/sites/A1/delegation.pdf",
            "file_name": "delegation.pdf",
        },
    )
    assert res.status_code == 201
    doc_id = res.json()["id"]

    await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_inv}"},
        json={"new_status": "under_review", "reason": "Ready for sign-off"},
    )
    res_app = await client.post(
        f"/api/v1/documents/{doc_id}/transition",
        headers={"Authorization": f"Bearer {token_inv}"},
        json={"new_status": "approved", "reason": "Investigator signs delegation log"},
    )
    assert res_app.status_code == 200
    assert res_app.json()["status"] == "approved"

    # 2. Investigator CANNOT approve Site A2 document -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_site_a2.id}/transition",
        headers={"Authorization": f"Bearer {token_inv}"},
        json={"new_status": "approved", "reason": "Investigator attempting cross-site approval"},
    )
    assert res.status_code == 403

    # 3. Investigator CANNOT approve study-wide protocol -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_proto_a.id}/transition",
        headers={"Authorization": f"Bearer {token_inv}"},
        json={"new_status": "approved", "reason": "Investigator attempting study-wide approval"},
    )
    assert res.status_code == 403

    # 4. Investigator CANNOT approve other study document -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_proto_b.id}/transition",
        headers={"Authorization": f"Bearer {token_inv}"},
        json={"new_status": "approved", "reason": "Investigator attempting cross-study approval"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_monitor_cra_document_approval_policy_and_scoping_rules(
    client: AsyncClient,
    document_rbac_setup: dict,
    db_session: AsyncSession,
):
    """
    Exhaustively verifies F03E Monitor / CRA document approval policy:
    1. Sponsor/CRO Monitor or CRA with valid active organization membership CAN approve
       an eligible study-wide document within scope.
    2. Direct StudyTeamMember Monitor/CRA without qualifying Sponsor/CRO membership CANNOT approve it
       (even if active and role name contains 'monitor', 'CRA', or 'lead').
    3. Sponsor/CRO membership in an unrelated organization does NOT grant approval.
    4. Inactive or revoked organization membership does NOT grant approval.
    5. Authorized Study PI and approved Clinical Director assigned via StudyTeamMember (site_id=None)
       CAN approve study-wide documents.
    """
    study_a = document_rbac_setup["study_a"]
    org_a = document_rbac_setup["org_a"]
    org_cro = document_rbac_setup["org_cro"]
    tokens = document_rbac_setup["tokens"]
    role_cro_monitor = (await db_session.execute(
        select(Role).where(Role.name == "CRO Lead Monitor")
    )).scalars().first()
    role_sponsor_pi = (await db_session.execute(
        select(Role).where(Role.name == "Principal Investigator")
    )).scalars().first()

    perm_doc_read = (await db_session.execute(
        select(Permission).where(Permission.codename == "documents:read")
    )).scalars().first()
    perm_doc_upload = (await db_session.execute(
        select(Permission).where(Permission.codename == "documents:upload")
    )).scalars().first()

    # 1. Create canonical role 'Clinical Research Associate' (organization scope)
    role_cra = Role(name="Clinical Research Associate", scope_level=ScopeLevel.organization, is_system_role=True)
    role_clinical_director = Role(name="Clinical Director", scope_level=ScopeLevel.study, is_system_role=False)
    role_study_monitor = Role(name="Study Team Lead Monitor", scope_level=ScopeLevel.study, is_system_role=False)
    role_study_cra = Role(name="Direct Study CRA", scope_level=ScopeLevel.study, is_system_role=False)

    db_session.add_all([role_cra, role_clinical_director, role_study_monitor, role_study_cra])
    await db_session.flush()

    for r in [role_cra, role_clinical_director, role_study_monitor, role_study_cra]:
        db_session.add_all([
            RolePermission(role_id=r.id, permission_id=perm_doc_read.id),
            RolePermission(role_id=r.id, permission_id=perm_doc_upload.id),
        ])
    await db_session.flush()

    # Create users:
    # A. CRA with active OrganizationMember in study_a's CRO (org_cro)
    user_cra = User(email="cra_member@cro-solutions.com", full_name="Active CRA Member", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    # B. Direct StudyTeamMember with role CRO Lead Monitor (no org membership in study_a's sponsor or CRO)
    user_direct_monitor = User(email="direct_monitor@external.com", full_name="Direct Study Monitor", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    # C. Direct StudyTeamMember with role CRA (no org membership in study_a's sponsor or CRO)
    user_direct_cra = User(email="direct_cra@external.com", full_name="Direct Study CRA", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    # D. Direct StudyTeamMember with role 'Study Team Lead Monitor'
    user_direct_lead_mon = User(email="lead_mon@external.com", full_name="Direct Lead Monitor", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    # E. Inactive OrganizationMember in org_cro with role CRO Lead Monitor
    user_inactive_cro = User(email="inactive_cro@cro-solutions.com", full_name="Inactive CRO Monitor", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    # F. Revoked OrganizationMember in org_cro with role CRO Lead Monitor
    user_revoked_cro = User(email="revoked_cro@cro-solutions.com", full_name="Revoked CRO Monitor", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    # G. Monitor in unrelated CRO organization (org_unrelated_cro)
    org_unrelated_cro = Organization(name="Unrelated Global CRO", organization_type=OrganizationType.cro, status=OrganizationStatus.active)
    db_session.add(org_unrelated_cro)
    await db_session.flush()
    user_unrelated_cro = User(email="unrelated_cro@othercro.com", full_name="Unrelated CRO Monitor", status=UserStatus.active, hashed_password=hash_password("Pass123!"))

    # H. Direct StudyTeamMember with role Principal Investigator (site_id=None, study-wide)
    user_direct_study_pi = User(email="direct_study_pi@external.com", full_name="Direct Study PI", status=UserStatus.active, hashed_password=hash_password("Pass123!"))
    # I. Direct StudyTeamMember with role Clinical Director (site_id=None, study-wide)
    user_direct_clinical_dir = User(email="clinical_dir@external.com", full_name="Direct Clinical Director", status=UserStatus.active, hashed_password=hash_password("Pass123!"))

    db_session.add_all([
        user_cra, user_direct_monitor, user_direct_cra, user_direct_lead_mon,
        user_inactive_cro, user_revoked_cro, user_unrelated_cro,
        user_direct_study_pi, user_direct_clinical_dir,
    ])
    await db_session.flush()

    # Memberships & Assignments
    db_session.add_all([
        # User A: active CRA member in study_a's CRO
        OrganizationMember(organization_id=org_cro.id, user_id=user_cra.id, role_id=role_cra.id, status=AssignmentStatus.active),
        # User B: direct StudyTeamMember with CRO Lead Monitor (study-level, site_id=None)
        StudyTeamMember(study_id=study_a.id, site_id=None, user_id=user_direct_monitor.id, role_id=role_cro_monitor.id, assignment_status=AssignmentStatus.active),
        # User C: direct StudyTeamMember with Clinical Research Associate (study-level, site_id=None)
        StudyTeamMember(study_id=study_a.id, site_id=None, user_id=user_direct_cra.id, role_id=role_cra.id, assignment_status=AssignmentStatus.active),
        # User D: direct StudyTeamMember with Study Team Lead Monitor (study-level, site_id=None)
        StudyTeamMember(study_id=study_a.id, site_id=None, user_id=user_direct_lead_mon.id, role_id=role_study_monitor.id, assignment_status=AssignmentStatus.active),
        # User E: inactive member in org_cro
        OrganizationMember(organization_id=org_cro.id, user_id=user_inactive_cro.id, role_id=role_cro_monitor.id, status=AssignmentStatus.inactive),
        # User F: removed member in org_cro
        OrganizationMember(organization_id=org_cro.id, user_id=user_revoked_cro.id, role_id=role_cro_monitor.id, status=AssignmentStatus.removed),
        # User G: active member in unrelated CRO
        OrganizationMember(organization_id=org_unrelated_cro.id, user_id=user_unrelated_cro.id, role_id=role_cro_monitor.id, status=AssignmentStatus.active),
        # User H: direct StudyTeamMember with Principal Investigator (study-level, site_id=None)
        StudyTeamMember(study_id=study_a.id, site_id=None, user_id=user_direct_study_pi.id, role_id=role_sponsor_pi.id, assignment_status=AssignmentStatus.active),
        # User I: direct StudyTeamMember with Clinical Director (study-level, site_id=None)
        StudyTeamMember(study_id=study_a.id, site_id=None, user_id=user_direct_clinical_dir.id, role_id=role_clinical_director.id, assignment_status=AssignmentStatus.active),
    ])
    await db_session.commit()

    token_cra = create_access_token({"sub": str(user_cra.id), "email": user_cra.email})
    token_direct_monitor = create_access_token({"sub": str(user_direct_monitor.id), "email": user_direct_monitor.email})
    token_direct_cra = create_access_token({"sub": str(user_direct_cra.id), "email": user_direct_cra.email})
    token_direct_lead_mon = create_access_token({"sub": str(user_direct_lead_mon.id), "email": user_direct_lead_mon.email})
    token_inactive_cro = create_access_token({"sub": str(user_inactive_cro.id), "email": user_inactive_cro.email})
    token_revoked_cro = create_access_token({"sub": str(user_revoked_cro.id), "email": user_revoked_cro.email})
    token_unrelated_cro = create_access_token({"sub": str(user_unrelated_cro.id), "email": user_unrelated_cro.email})
    token_direct_study_pi = create_access_token({"sub": str(user_direct_study_pi.id), "email": user_direct_study_pi.email})
    token_direct_clinical_dir = create_access_token({"sub": str(user_direct_clinical_dir.id), "email": user_direct_clinical_dir.email})

    # Test Document 1: Fresh study-wide document created by Sponsor PI
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={
            "study_id": str(study_a.id),
            "document_type": "protocol",
            "title": "Study A Core Protocol Amendment",
            "version": "2.0",
            "storage_key": "s3://ctms-docs/studies/A/protocol_amendment.pdf",
            "file_name": "protocol_amendment.pdf",
        },
    )
    assert res.status_code == 201
    doc_id1 = res.json()["id"]

    # Submit to under_review
    res = await client.post(
        f"/api/v1/documents/{doc_id1}/transition",
        headers={"Authorization": f"Bearer {tokens['sponsor_a']}"},
        json={"new_status": "under_review", "reason": "Ready for regulatory and monitoring sign-off"},
    )
    assert res.status_code == 200

    # 1. Direct StudyTeamMember Monitor/CRA attempts approval, rejection, archival -> all 403 Forbidden
    # A) Direct Monitor trying to approve
    res = await client.post(
        f"/api/v1/documents/{doc_id1}/transition",
        headers={"Authorization": f"Bearer {token_direct_monitor}"},
        json={"new_status": "approved", "reason": "Direct StudyTeamMember monitor attempting approval"},
    )
    assert res.status_code == 403
    assert "approve" in res.json()["detail"].lower()

    # B) Direct Monitor trying to reject
    res = await client.post(
        f"/api/v1/documents/{doc_id1}/transition",
        headers={"Authorization": f"Bearer {token_direct_monitor}"},
        json={"new_status": "draft", "reason": "Direct StudyTeamMember monitor attempting rejection"},
    )
    assert res.status_code == 403

    # C) Direct Monitor trying to archive
    res = await client.post(
        f"/api/v1/documents/{doc_id1}/transition",
        headers={"Authorization": f"Bearer {token_direct_monitor}"},
        json={"new_status": "archived", "reason": "Direct StudyTeamMember monitor attempting archival"},
    )
    assert res.status_code == 403

    # D) Direct CRA trying to approve
    res = await client.post(
        f"/api/v1/documents/{doc_id1}/transition",
        headers={"Authorization": f"Bearer {token_direct_cra}"},
        json={"new_status": "approved", "reason": "Direct CRA attempting approval"},
    )
    assert res.status_code == 403

    # E) Direct Lead Monitor trying to approve
    res = await client.post(
        f"/api/v1/documents/{doc_id1}/transition",
        headers={"Authorization": f"Bearer {token_direct_lead_mon}"},
        json={"new_status": "approved", "reason": "Direct Lead Monitor attempting approval"},
    )
    assert res.status_code == 403

    # 2. Monitor in unrelated CRO organization trying to approve -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_id1}/transition",
        headers={"Authorization": f"Bearer {token_unrelated_cro}"},
        json={"new_status": "approved", "reason": "Unrelated CRO monitor attempting approval"},
    )
    assert res.status_code == 403

    # 3. Inactive and revoked CRO members trying to approve -> 403 Forbidden
    res = await client.post(
        f"/api/v1/documents/{doc_id1}/transition",
        headers={"Authorization": f"Bearer {token_inactive_cro}"},
        json={"new_status": "approved", "reason": "Inactive CRO member attempting approval"},
    )
    assert res.status_code == 403

    res = await client.post(
        f"/api/v1/documents/{doc_id1}/transition",
        headers={"Authorization": f"Bearer {token_revoked_cro}"},
        json={"new_status": "approved", "reason": "Revoked CRO member attempting approval"},
    )
    assert res.status_code == 403

    # 4. Valid Active CRA in study_a's designated CRO approves study-wide document -> 200 OK
    res = await client.post(
        f"/api/v1/documents/{doc_id1}/transition",
        headers={"Authorization": f"Bearer {token_cra}"},
        json={"new_status": "approved", "reason": "Valid CRO CRA approval"},
    )
    assert res.status_code == 200
    doc_approved = res.json()
    assert doc_approved["status"] == "approved"
    assert doc_approved["approved_by"] == str(user_cra.id)
    assert doc_approved["approved_at"] is not None

    # 5. CRO Lead Monitor in study_a's designated CRO can retire (supersede) approved document -> 200 OK
    res = await client.post(
        f"/api/v1/documents/{doc_id1}/transition",
        headers={"Authorization": f"Bearer {tokens['cro_a']}"},
        json={"new_status": "superseded", "reason": "CRO Lead Monitor supersedes with protocol amendment v3.0"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "superseded"

    # 6. Test Document 2: Direct Study PI assigned via StudyTeamMember (site_id=None) can approve
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {token_direct_study_pi}"},
        json={
            "study_id": str(study_a.id),
            "document_type": "investigator_brochure",
            "title": "Study A Investigator Brochure",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/studies/A/ib_v1.pdf",
            "file_name": "ib_v1.pdf",
        },
    )
    assert res.status_code == 201
    doc_id2 = res.json()["id"]

    await client.post(
        f"/api/v1/documents/{doc_id2}/transition",
        headers={"Authorization": f"Bearer {token_direct_study_pi}"},
        json={"new_status": "under_review", "reason": "Submit IB for review"},
    )
    res_app_pi = await client.post(
        f"/api/v1/documents/{doc_id2}/transition",
        headers={"Authorization": f"Bearer {token_direct_study_pi}"},
        json={"new_status": "approved", "reason": "Direct Study PI formal sign-off"},
    )
    assert res_app_pi.status_code == 200
    assert res_app_pi.json()["status"] == "approved"
    assert res_app_pi.json()["approved_by"] == str(user_direct_study_pi.id)

    # 7. Test Document 3: Clinical Director assigned via StudyTeamMember (site_id=None) can approve
    res = await client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {token_direct_clinical_dir}"},
        json={
            "study_id": str(study_a.id),
            "document_type": "regulatory",
            "title": "Study A Regulatory Filing Dossier",
            "version": "1.0",
            "storage_key": "s3://ctms-docs/studies/A/reg_filing.pdf",
            "file_name": "reg_filing.pdf",
        },
    )
    assert res.status_code == 201
    doc_id3 = res.json()["id"]

    await client.post(
        f"/api/v1/documents/{doc_id3}/transition",
        headers={"Authorization": f"Bearer {token_direct_clinical_dir}"},
        json={"new_status": "under_review", "reason": "Submit dossier for review"},
    )
    res_app_dir = await client.post(
        f"/api/v1/documents/{doc_id3}/transition",
        headers={"Authorization": f"Bearer {token_direct_clinical_dir}"},
        json={"new_status": "approved", "reason": "Clinical Director sign-off"},
    )
    assert res_app_dir.status_code == 200
    assert res_app_dir.json()["status"] == "approved"
    assert res_app_dir.json()["approved_by"] == str(user_direct_clinical_dir.id)
