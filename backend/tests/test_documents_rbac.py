from __future__ import annotations

import pytest
from httpx import AsyncClient
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
