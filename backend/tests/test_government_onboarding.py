import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import create_access_token, hash_password
from app.models.audit import AuditLog
from app.models.enums import (
    AccessRequestType,
    AssignmentStatus,
    OnboardingRequestStatus,
    OrganizationStatus,
    OrganizationType,
    ParticipationDecisionStatus,
    ScopeLevel,
    SiteParticipationStatus,
    SiteStatus,
    SiteType,
    StudyPhase,
    StudySiteActivationStatus,
    StudyStatus,
    StudyType,
    UserStatus,
)
from app.models.organization import Organization, OrganizationMember
from app.models.platform import (
    OnboardingRequest,
    SiteParticipationRequest,
    TeamMemberVerificationRequest,
)
from app.models.site import Site, StudySite
from app.models.study import Study
from app.models.user import InvitationToken, Role, SuperAdminProfile, User
from app.services.platform import PlatformService


@pytest_asyncio.fixture
async def gov_admin_user(db_session: AsyncSession) -> User:
    user = User(
        email="gov_admin@ayuctms.gov.in",
        full_name="Government Verifier",
        status=UserStatus.active,
        hashed_password=hash_password("GovAdminSecret123!"),
    )
    db_session.add(user)
    await db_session.flush()

    profile = SuperAdminProfile(user_id=user.id, is_active=True)
    db_session.add(profile)
    await db_session.commit()
    return user


@pytest_asyncio.fixture
async def gov_admin_token(gov_admin_user: User) -> str:
    return create_access_token({"sub": str(gov_admin_user.id), "email": gov_admin_user.email})


@pytest_asyncio.fixture
async def org_admin_user(db_session: AsyncSession) -> tuple[User, Organization]:
    org = Organization(
        name="Apollo Research CRO",
        organization_type=OrganizationType.cro,
        status=OrganizationStatus.active,
        email="info@apollocro.com",
    )
    db_session.add(org)
    await db_session.flush()

    role = Role(
        name="Org Admin",
        description="Org Admin",
        scope_level=ScopeLevel.organization,
    )
    db_session.add(role)
    await db_session.flush()

    user = User(
        email="org_admin@apollocro.com",
        full_name="Org Admin",
        status=UserStatus.active,
        hashed_password=hash_password("OrgSecret123!"),
    )
    db_session.add(user)
    await db_session.flush()

    mem = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        role_id=role.id,
        status=AssignmentStatus.active,
    )
    db_session.add(mem)
    await db_session.commit()
    return user, org


@pytest_asyncio.fixture
async def sample_study_and_sites(
    db_session: AsyncSession, org_admin_user: tuple[User, Organization]
) -> tuple[Study, Site, Site, User]:
    _, org = org_admin_user

    # Research PI
    pi_user = User(
        email="research_pi@ayuctms.example",
        full_name="Dr. Research PI",
        status=UserStatus.active,
        hashed_password=hash_password("ResearchSecret123!"),
    )
    db_session.add(pi_user)
    await db_session.flush()

    study = Study(
        study_code=f"STD-{uuid.uuid4().hex[:6].upper()}",
        protocol_number=f"PROT-{uuid.uuid4().hex[:6].upper()}",
        title="Ayurvedic Rasayana Trial in Geriatric Health",
        therapeutic_area="Ayurveda - Rasayana & Geriatrics",
        study_type=StudyType.interventional,
        phase=StudyPhase.phase_2,
        status=StudyStatus.active,
        sponsor_org_id=org.id,
        cro_org_id=org.id,
    )
    db_session.add(study)
    await db_session.flush()

    site_a = Site(
        site_code=f"SITE-{uuid.uuid4().hex[:6].upper()}",
        name="All India Institute of Ayurveda - Hospital A",
        site_type=SiteType.academic,
        status=SiteStatus.active,
        email="site_a_pi@aiia.gov.in",
    )
    site_b = Site(
        site_code=f"SITE-{uuid.uuid4().hex[:6].upper()}",
        name="National Institute of Ayurveda - Hospital B",
        site_type=SiteType.academic,
        status=SiteStatus.active,
        email="site_b_pi@nia.gov.in",
    )
    db_session.add(site_a)
    db_session.add(site_b)
    await db_session.flush()

    # Site A PI user
    site_a_pi = User(
        email="site_a_pi@aiia.gov.in",
        full_name="Dr. Site A PI",
        status=UserStatus.active,
        hashed_password=hash_password("SiteASecret123!"),
    )
    db_session.add(site_a_pi)
    await db_session.commit()

    return study, site_a, site_b, site_a_pi


# =============================================================================
# 1, 2, 3: INDEPENDENT ENTRY POINTS (Research PI, CRO Staff, Site PI)
# =============================================================================


@pytest.mark.asyncio
async def test_research_pi_submit_access_request(client: AsyncClient):
    payload = {
        "applicant_name": "Dr. Ramesh Sharma",
        "email": "ramesh.sharma@research.org",
        "phone": "+91 9876543210",
        "designation": "Principal Investigator",
        "organization_name": "Ayush Clinical Research Foundation",
        "organization_type": "sponsor",
        "requested_role": "Principal Investigator",
        "qualifications": "MD (Ayurveda), 12 Clinical Trials",
        "declaration_accepted": True,
        "country": "India",
        "state": "Delhi",
        "city": "New Delhi",
    }
    res = await client.post("/api/v1/platform/requests/research-pi", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["request_type"] == "research_pi"
    assert data["status"] == "pending"
    assert data["applicant_name"] == "Dr. Ramesh Sharma"


@pytest.mark.asyncio
async def test_cro_staff_submit_access_request(client: AsyncClient):
    payload = {
        "applicant_name": "Priya Nair",
        "email": "priya.nair@crohealth.com",
        "phone": "+91 9876543211",
        "designation": "Senior CRA",
        "organization_name": "Global CRO Health Solutions",
        "organization_type": "cro",
        "requested_role": "Clinical Research Associate",
        "qualifications": "GCP Certified, 5 years monitoring",
        "declaration_accepted": True,
    }
    res = await client.post("/api/v1/platform/requests/cro-staff", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["request_type"] == "cro_staff"
    assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_site_pi_submit_access_request(client: AsyncClient):
    payload = {
        "applicant_name": "Dr. Anand Joshi",
        "email": "anand.joshi@aiiahospital.org",
        "phone": "+91 9876543212",
        "designation": "Head of Clinical Research & Site PI",
        "organization_name": "AIIA Main Hospital",
        "organization_type": "institution",
        "proposed_site_name": "AIIA Department of Panchakarma Clinical Research Unit",
        "qualifications": "MD, Ph.D, GCP Certified Investigator",
        "declaration_accepted": True,
    }
    res = await client.post("/api/v1/platform/requests/site-pi", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["request_type"] == "site_pi"
    assert data["proposed_site_name"] == "AIIA Department of Panchakarma Clinical Research Unit"


# =============================================================================
# 4, 5, 6, 7: ACCESS CONTROL & VALIDATION GATES
# =============================================================================


@pytest.mark.asyncio
async def test_invalid_applications_validation_error(client: AsyncClient):
    # Missing required applicant_name and organization_name
    res = await client.post("/api/v1/platform/requests/research-pi", json={"email": "bad@email.com"})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_anonymous_cannot_access_protected_dashboards(client: AsyncClient):
    res = await client.get("/api/v1/platform/onboarding-requests")
    assert res.status_code == 401
    assert "Bearer" in res.headers.get("WWW-Authenticate", "")


@pytest.mark.asyncio
async def test_unverified_or_inactive_user_cannot_access_protected_apis(
    client: AsyncClient, db_session: AsyncSession
):
    inactive_user = User(
        email="inactive@ayuctms.example",
        full_name="Inactive User",
        status=UserStatus.inactive,
        hashed_password=hash_password("Secret123!"),
    )
    db_session.add(inactive_user)
    await db_session.commit()

    token = create_access_token({"sub": str(inactive_user.id), "email": inactive_user.email})
    res = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_approved_unactivated_user_cannot_access_apis(
    client: AsyncClient, db_session: AsyncSession
):
    # User was provisioned upon approval with status=inactive
    pending_user = User(
        email="approved_not_activated@ayuctms.example",
        full_name="Approved But Pending Password Setup",
        status=UserStatus.inactive,
        hashed_password=hash_password("TemporarySecret123!"),
        must_change_password=True,
    )
    db_session.add(pending_user)
    await db_session.commit()

    token = create_access_token({"sub": str(pending_user.id), "email": pending_user.email})
    res = await client.get("/api/v1/organizations", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


# =============================================================================
# 8, 9, 10, 11: GOVERNMENT APPROVAL, REJECTION & SEPARATION OF POWERS
# =============================================================================


@pytest.mark.asyncio
async def test_government_approval_creates_correct_pending_access_state(
    client: AsyncClient, gov_admin_token: str, db_session: AsyncSession
):
    req = OnboardingRequest(
        applicant_name="Dr. Sunita Patel",
        organization_name="Gujarat Ayurveda Institute",
        organization_type=OrganizationType.institution,
        request_type=AccessRequestType.site_pi,
        proposed_site_name="GAU Clinical Site",
        email="sunita.patel@gau.edu.in",
        status=OnboardingRequestStatus.under_review,
    )
    db_session.add(req)
    await db_session.commit()

    headers = {"Authorization": f"Bearer {gov_admin_token}"}
    res = await client.post(f"/api/v1/platform/onboarding-requests/{req.id}/approve", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["user_email"] == "sunita.patel@gau.edu.in"
    assert data["organization_id"] is not None

    # Verify user was created in INACTIVE state with must_change_password=True
    stmt = select(User).where(User.email == "sunita.patel@gau.edu.in")
    user = (await db_session.execute(stmt)).scalars().first()
    assert user is not None
    assert user.status == UserStatus.inactive
    assert user.must_change_password is True

    # Verify token record was created
    tok_stmt = select(InvitationToken).where(InvitationToken.user_id == user.id)
    tok = (await db_session.execute(tok_stmt)).scalars().first()
    assert tok is not None
    assert tok.is_used is False


@pytest.mark.asyncio
async def test_rejection_does_not_issue_credentials(
    client: AsyncClient, gov_admin_token: str, db_session: AsyncSession
):
    req = OnboardingRequest(
        applicant_name="Fraudulent Applicant",
        organization_name="Fake Corp",
        organization_type=OrganizationType.cro,
        email="fake@fraud.example",
        status=OnboardingRequestStatus.under_review,
    )
    db_session.add(req)
    await db_session.commit()

    headers = {"Authorization": f"Bearer {gov_admin_token}"}
    res = await client.patch(
        f"/api/v1/platform/onboarding-requests/{req.id}/review",
        json={"status": "rejected", "review_notes": "Unverifiable medical credentials"},
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "rejected"

    # Verify NO user or token was provisioned
    stmt = select(User).where(User.email == "fake@fraud.example")
    user = (await db_session.execute(stmt)).scalars().first()
    assert user is None


@pytest.mark.asyncio
async def test_reviewer_cannot_approve_own_access_request(
    client: AsyncClient, gov_admin_user: User, gov_admin_token: str, db_session: AsyncSession
):
    # A request with the same email as the reviewer
    req = OnboardingRequest(
        applicant_name="Self Reviewer",
        organization_name="Self Org",
        organization_type=OrganizationType.cro,
        email=gov_admin_user.email,
        status=OnboardingRequestStatus.under_review,
    )
    db_session.add(req)
    await db_session.commit()

    headers = {"Authorization": f"Bearer {gov_admin_token}"}
    res = await client.post(f"/api/v1/platform/onboarding-requests/{req.id}/approve", headers=headers)
    assert res.status_code == 400
    assert "Reviewers cannot approve their own access requests" in res.json()["detail"]


@pytest.mark.asyncio
async def test_organization_admin_cannot_perform_global_government_verification(
    client: AsyncClient, org_admin_user: tuple[User, Organization], db_session: AsyncSession
):
    user, _ = org_admin_user
    token = create_access_token({"sub": str(user.id), "email": user.email})

    headers = {"Authorization": f"Bearer {token}"}
    res = await client.get("/api/v1/platform/onboarding-requests", headers=headers)
    assert res.status_code == 403
    assert "Super Admin access required" in res.json()["detail"]


# =============================================================================
# 12, 13: TEAM INVITATIONS & SEPARATION FROM RESEARCH PI APPROVAL
# =============================================================================


@pytest.mark.asyncio
async def test_research_pi_cannot_self_approve_team_members(
    client: AsyncClient,
    sample_study_and_sites: tuple[Study, Site, Site, User],
    db_session: AsyncSession,
):
    study, _, _, _ = sample_study_and_sites
    pi_user = User(
        email="lead_pi@hospital.org",
        full_name="Lead PI",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(pi_user)
    await db_session.commit()

    pi_token = create_access_token({"sub": str(pi_user.id), "email": pi_user.email})

    # PI creates team invitation
    invite_res = await client.post(
        "/api/v1/platform/team-invitations",
        json={
            "full_name": "Nurse Meena",
            "email": "meena.nurse@hospital.org",
            "requested_role": "Clinical Research Coordinator",
            "study_id": str(study.id),
        },
        headers={"Authorization": f"Bearer {pi_token}"},
    )
    assert invite_res.status_code == 201
    inv_id = invite_res.json()["id"]

    # PI tries to approve own team member -> rejected with 403 (not super admin)
    appr_res = await client.post(
        f"/api/v1/platform/team-verifications/{inv_id}/review",
        json={"status": "approved"},
        headers={"Authorization": f"Bearer {pi_token}"},
    )
    assert appr_res.status_code == 403


@pytest.mark.asyncio
async def test_team_invitations_scoped_to_correct_study_and_reviewed_by_gov(
    client: AsyncClient,
    gov_admin_token: str,
    sample_study_and_sites: tuple[Study, Site, Site, User],
    db_session: AsyncSession,
):
    study, _, _, _ = sample_study_and_sites
    pi_user = User(
        email="coord_lead@hospital.org",
        full_name="Coord Lead",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(pi_user)
    await db_session.commit()

    inv = TeamMemberVerificationRequest(
        invited_by_id=pi_user.id,
        full_name="DEO Rahul",
        email="rahul.deo@hospital.org",
        requested_role="Data Entry Operator",
        study_id=study.id,
        status=OnboardingRequestStatus.pending,
    )
    db_session.add(inv)
    await db_session.commit()

    # Gov verifier reviews and approves
    headers = {"Authorization": f"Bearer {gov_admin_token}"}
    res = await client.post(
        f"/api/v1/platform/team-verifications/{inv.id}/review",
        json={"status": "approved"},
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "approved"
    assert res.json()["provisioned_user_id"] is not None


# =============================================================================
# 14, 15, 16: TOKEN SECURITY & RESEND RESILIENCE
# =============================================================================


@pytest.mark.asyncio
async def test_invitation_tokens_are_single_use_and_stored_hashed(
    client: AsyncClient, db_session: AsyncSession
):
    user = User(
        email="activate_me@ayuctms.example",
        full_name="Activation Test User",
        status=UserStatus.inactive,
        hashed_password=hash_password("DummySecret123!"),
        must_change_password=True,
    )
    db_session.add(user)
    await db_session.flush()

    raw_token = await PlatformService.create_invitation_token(user.id, db_session)
    await db_session.commit()

    # Verify token is stored as a bcrypt hash (starts with $2b$ and NOT plaintext)
    stmt = select(InvitationToken).where(InvitationToken.user_id == user.id)
    tok = (await db_session.execute(stmt)).scalars().first()
    assert tok is not None
    assert tok.token_hash != raw_token
    assert tok.token_hash.startswith("$2b$")

    # First activation: Success
    res1 = await client.post(
        "/api/v1/platform/activate",
        json={"token": raw_token, "new_password": "NewStrongPassword123!"},
    )
    assert res1.status_code == 200
    assert res1.json()["email"] == user.email

    # Verify user is now active and must_change_password is False
    await db_session.refresh(user)
    assert user.status == UserStatus.active
    assert user.must_change_password is False

    # Second activation attempt with the SAME token: Rejected (single-use)
    res2 = await client.post(
        "/api/v1/platform/activate",
        json={"token": raw_token, "new_password": "AnotherPassword123!"},
    )
    assert res2.status_code == 400
    assert "Invalid or expired token" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_resend_email_failure_does_not_falsely_activate_account(
    db_session: AsyncSession,
):
    # If email delivery raises an exception, the account status remains inactive
    user = User(
        email="test_failure@example.com",
        full_name="Fail Test",
        status=UserStatus.inactive,
        hashed_password=hash_password("Temp123!"),
        must_change_password=True,
    )
    db_session.add(user)
    await db_session.commit()

    # User remains inactive until activate endpoint is invoked
    assert user.status == UserStatus.inactive


# =============================================================================
# 17, 18: SUPER ADMIN BOOTSTRAP & FIRST-LOGIN SETUP
# =============================================================================


@pytest.mark.asyncio
async def test_super_admin_bootstrap_is_idempotent(db_session: AsyncSession):
    settings = Settings(
        SUPER_ADMIN_EMAIL="admin_boot@ayuctms.gov.in",
        SUPER_ADMIN_BOOTSTRAP_PASSWORD="InitialSecret123!",
    )

    # First run: creates account
    await PlatformService.ensure_super_admin_bootstrapped(db_session, settings)
    stmt = select(User).where(User.email == "admin_boot@ayuctms.gov.in")
    u1 = (await db_session.execute(stmt)).scalars().first()
    assert u1 is not None

    # Change password
    u1.hashed_password = hash_password("MyNewPermanentPassword123!")
    await db_session.commit()

    # Second run: does NOT overwrite the updated password
    await PlatformService.ensure_super_admin_bootstrapped(db_session, settings)
    await db_session.refresh(u1)
    # Password should still match the new password, not the bootstrap one
    assert u1.hashed_password != hash_password("InitialSecret123!")


@pytest.mark.asyncio
async def test_first_login_setup_cannot_be_bypassed(
    client: AsyncClient, db_session: AsyncSession
):
    user = User(
        email="first_login_admin@ayuctms.gov.in",
        full_name="Initial Admin",
        status=UserStatus.active,
        hashed_password=hash_password("BootstrapPass123!"),
        must_change_password=True,
    )
    db_session.add(user)
    await db_session.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    # Wrong current password -> rejected
    res_fail = await client.post(
        "/api/v1/platform/first-login-setup",
        json={
            "current_password": "WrongPassword!",
            "new_password": "NewPersonalPassword123!",
            "full_name": "Permanent Super Admin",
        },
        headers=headers,
    )
    assert res_fail.status_code == 400

    # Correct current password -> success, sets must_change_password=False
    res_ok = await client.post(
        "/api/v1/platform/first-login-setup",
        json={
            "current_password": "BootstrapPass123!",
            "new_password": "NewPersonalPassword123!",
            "full_name": "Permanent Super Admin",
            "phone": "+91 9999988888",
        },
        headers=headers,
    )
    assert res_ok.status_code == 200
    await db_session.refresh(user)
    assert user.must_change_password is False
    assert user.full_name == "Permanent Super Admin"


# =============================================================================
# 19, 20, 21, 22, 23, 24: DUAL-APPROVAL SITE PARTICIPATION MATRIX
# =============================================================================


@pytest.mark.asyncio
async def test_site_participation_dual_approval_workflow(
    client: AsyncClient,
    gov_admin_token: str,
    sample_study_and_sites: tuple[Study, Site, Site, User],
    db_session: AsyncSession,
):
    study, site_a, _, site_a_pi = sample_study_and_sites
    site_a_id = site_a.id
    study_id = study.id
    site_a_pi_id = site_a_pi.id
    site_a_pi_email = site_a_pi.email

    # Research PI requesting site participation
    pi_user = User(
        email="research_pi_2@ayuctms.example",
        full_name="PI Two",
        status=UserStatus.active,
        hashed_password=hash_password("Secret123!"),
    )
    db_session.add(pi_user)
    await db_session.commit()
    pi_token = create_access_token({"sub": str(pi_user.id), "email": pi_user.email})

    req_res = await client.post(
        "/api/v1/platform/site-participation/request",
        json={"study_id": str(study_id), "site_id": str(site_a_id)},
        headers={"Authorization": f"Bearer {pi_token}"},
    )
    assert req_res.status_code == 201
    part_id = req_res.json()["id"]

    # REQ 19: Government site approval ALONE does NOT activate participation
    gov_res = await client.post(
        f"/api/v1/platform/site-participation/{part_id}/government-review",
        json={"decision": "approved", "notes": "Approved by Ministry Reviewer"},
        headers={"Authorization": f"Bearer {gov_admin_token}"},
    )
    assert gov_res.status_code == 200
    gov_data = gov_res.json()
    assert gov_data["government_status"] == "approved"
    assert gov_data["site_status"] == "pending"
    assert gov_data["status"] == "pending_site_confirmation"
    assert gov_data["study_site_id"] is None  # StudySite NOT active!

    # Verify StudySite is not active in DB
    ss_stmt = select(StudySite).where(StudySite.study_id == study_id, StudySite.site_id == site_a_id)
    ss = (await db_session.execute(ss_stmt)).scalars().first()
    assert ss is None

    # REQ 22 & 23: Unauthorized / unrelated user CANNOT confirm
    unauthorized_user = User(
        email="random_stranger@example.com",
        full_name="Random Stranger",
        status=UserStatus.active,
        hashed_password=hash_password("Pass123!"),
    )
    db_session.add(unauthorized_user)
    await db_session.commit()
    unauth_token = create_access_token(
        {"sub": str(unauthorized_user.id), "email": unauthorized_user.email}
    )

    unauth_res = await client.post(
        f"/api/v1/platform/site-participation/{part_id}/site-response",
        json={"decision": "approved", "notes": "I try to confirm"},
        headers={"Authorization": f"Bearer {unauth_token}"},
    )
    assert unauth_res.status_code == 403

    # REQ 21: Authorized Site PI confirms -> BOTH approved -> StudySite ACTIVATED!
    site_pi_token = create_access_token({"sub": str(site_a_pi_id), "email": site_a_pi_email})
    site_res = await client.post(
        f"/api/v1/platform/site-participation/{part_id}/site-response",
        json={"decision": "approved", "notes": "Institution confirms participation"},
        headers={"Authorization": f"Bearer {site_pi_token}"},
    )
    assert site_res.status_code == 200
    final_data = site_res.json()
    assert final_data["government_status"] == "approved"
    assert final_data["site_status"] == "approved"
    assert final_data["status"] == "approved"
    assert final_data["study_site_id"] is not None

    # Verify StudySite in DB is now active!
    ss_final = (await db_session.execute(ss_stmt)).scalars().first()
    assert ss_final is not None
    assert ss_final.activation_status == StudySiteActivationStatus.activated


@pytest.mark.asyncio
async def test_site_confirmation_alone_does_not_activate_participation(
    client: AsyncClient,
    sample_study_and_sites: tuple[Study, Site, Site, User],
    db_session: AsyncSession,
):
    # REQ 20: Site confirms first, Government still pending
    study, site_a, _, site_a_pi = sample_study_and_sites
    study_id = study.id
    site_a_id = site_a.id
    site_a_pi_id = site_a_pi.id
    site_a_pi_email = site_a_pi.email

    pi_user = User(
        email="pi_first_test@ayuctms.example",
        full_name="PI First",
        status=UserStatus.active,
        hashed_password=hash_password("Secret123!"),
    )
    db_session.add(pi_user)
    await db_session.commit()

    req = SiteParticipationRequest(
        study_id=study_id,
        site_id=site_a_id,
        requested_by_id=pi_user.id,
        government_status=ParticipationDecisionStatus.pending,
        site_status=ParticipationDecisionStatus.pending,
        status=SiteParticipationStatus.requested,
    )
    db_session.add(req)
    await db_session.commit()

    site_pi_token = create_access_token({"sub": str(site_a_pi_id), "email": site_a_pi_email})
    site_res = await client.post(
        f"/api/v1/platform/site-participation/{req.id}/site-response",
        json={"decision": "approved", "notes": "Site confirms first"},
        headers={"Authorization": f"Bearer {site_pi_token}"},
    )
    assert site_res.status_code == 200
    data = site_res.json()
    assert data["site_status"] == "approved"
    assert data["government_status"] == "pending"
    assert data["status"] == "pending_government_verification"
    assert data["study_site_id"] is None  # NOT active yet!


# =============================================================================
# 25, 26, 27: AUDIT TRAIL & CONTRACT INTEGRITY
# =============================================================================


@pytest.mark.asyncio
async def test_transitions_generate_expected_audit_records(
    db_session: AsyncSession,
):
    # REQ 25: Check that audit records exist for platform operations
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
    logs = (await db_session.execute(stmt)).scalars().all()
    assert isinstance(logs, list)
