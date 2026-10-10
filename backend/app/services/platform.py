from __future__ import annotations

import datetime
import logging
import secrets
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import hash_password, verify_password
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
    StudySiteActivationStatus,
    UserStatus,
)
from app.models.organization import Organization, OrganizationMember
from app.models.platform import (
    OnboardingRequest,
    SiteParticipationRequest,
    TeamMemberVerificationRequest,
)
from app.models.site import Site, StudySite
from app.models.study import Study, StudyTeamMember
from app.models.user import InvitationToken, Role, SuperAdminProfile, User
from app.services.audit import AuditService
from app.services.email import EmailService

logger = logging.getLogger(__name__)


class PlatformService:
    @staticmethod
    async def ensure_super_admin_bootstrapped(db: AsyncSession, settings: Settings) -> None:
        if not settings.SUPER_ADMIN_EMAIL or not settings.SUPER_ADMIN_BOOTSTRAP_PASSWORD:
            return

        stmt = select(User).where(User.email == settings.SUPER_ADMIN_EMAIL)
        res = await db.execute(stmt)
        user = res.scalars().first()

        if not user:
            user = User(
                email=settings.SUPER_ADMIN_EMAIL,
                full_name="Platform Super Admin",
                status=UserStatus.active,
                hashed_password=hash_password(settings.SUPER_ADMIN_BOOTSTRAP_PASSWORD),
                must_change_password=True,
            )
            db.add(user)
            await db.flush()

        stmt_profile = select(SuperAdminProfile).where(SuperAdminProfile.user_id == user.id)
        res_profile = await db.execute(stmt_profile)
        profile = res_profile.scalars().first()

        if not profile:
            profile = SuperAdminProfile(
                user_id=user.id,
                is_active=True,
            )
            db.add(profile)
            await db.flush()

        await db.commit()

    @staticmethod
    async def is_super_admin(user: User, db: AsyncSession) -> bool:
        stmt = select(SuperAdminProfile).where(
            SuperAdminProfile.user_id == user.id, SuperAdminProfile.is_active.is_(True)
        )
        res = await db.execute(stmt)
        return res.scalars().first() is not None

    @staticmethod
    async def create_invitation_token(user_id: uuid.UUID, db: AsyncSession) -> str:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hash_password(raw_token)
        expires_at = datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7)

        token_record = InvitationToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            is_used=False,
        )
        db.add(token_record)
        await db.flush()
        return raw_token

    @staticmethod
    async def verify_and_consume_invitation_token(
        raw_token: str, db: AsyncSession
    ) -> InvitationToken | None:
        now = datetime.datetime.now(datetime.UTC)
        stmt = (
            select(InvitationToken)
            .where(InvitationToken.is_used.is_(False), InvitationToken.expires_at > now)
            .order_by(InvitationToken.created_at.desc())
            .limit(10)
        )

        res = await db.execute(stmt)
        tokens = res.scalars().all()

        for token_record in tokens:
            if verify_password(raw_token, token_record.token_hash):
                token_record.is_used = True
                await db.flush()
                return token_record

        return None

    @staticmethod
    async def provision_organization_from_request(
        request_id: uuid.UUID,
        reviewer_user: User,
        db: AsyncSession,
        settings: Settings,
    ) -> dict:
        stmt = select(OnboardingRequest).where(OnboardingRequest.id == request_id).with_for_update()
        res = await db.execute(stmt)
        request = res.scalars().first()

        if not request:
            raise ValueError("Request not found")

        # Security check: reviewers cannot approve their own requests
        if request.email == reviewer_user.email or request.provisioned_user_id == reviewer_user.id:
            raise ValueError("Reviewers cannot approve their own access requests")

        if request.status == OnboardingRequestStatus.approved:
            return {
                "organization_id": request.provisioned_organization_id,
                "user_email": request.email,
                "invitation_sent": False,
                "raw_token": None,
            }

        # 1. Organization Handling
        org_id = request.organization_id
        if not org_id:
            org_type = request.organization_type or (
                OrganizationType.cro
                if request.request_type == AccessRequestType.cro_staff
                else OrganizationType.sponsor
            )
            new_org = Organization(
                name=request.organization_name or f"{request.applicant_name}'s Organization",
                organization_type=org_type,
                status=OrganizationStatus.active,
                email=request.email,
                phone=request.phone,
                website=request.website,
                country=request.country,
                state=request.state,
                city=request.city,
            )
            db.add(new_org)
            await db.flush()
            org_id = new_org.id

        # 2. Site Handling for Site PI
        site_id = request.site_id
        if request.request_type == AccessRequestType.site_pi and not site_id:
            site_name = request.proposed_site_name or f"{request.organization_name} Clinical Site"
            site_code = f"SITE-{uuid.uuid4().hex[:6].upper()}"
            site = Site(
                name=site_name,
                site_code=site_code,
                site_type=SiteType.academic,
                status=SiteStatus.active,
                organization_id=org_id,
                city=request.city,
                state=request.state,
                country=request.country,
                phone=request.phone,
                email=request.email,
            )
            db.add(site)
            await db.flush()
            site_id = site.id
            request.provisioned_site_id = site.id

        # 3. User Provisioning
        user_stmt = select(User).where(User.email == request.email)
        existing_user = (await db.execute(user_stmt)).scalars().first()

        if existing_user:
            user = existing_user
        else:
            dummy_password = hash_password(secrets.token_urlsafe(32))
            user = User(
                email=request.email,
                full_name=request.applicant_name,
                phone=request.phone,
                status=UserStatus.inactive,
                hashed_password=dummy_password,
                must_change_password=True,
            )
            db.add(user)
            await db.flush()

        # 4. Role & Membership Provisioning
        role_name = request.requested_role or (
            "Principal Investigator"
            if request.request_type in (AccessRequestType.research_pi, AccessRequestType.site_pi)
            else "Organization Admin"
        )
        role_stmt = select(Role).where(
            Role.name == role_name, Role.scope_level == ScopeLevel.organization
        )
        role = (await db.execute(role_stmt)).scalars().first()
        if not role:
            role = Role(
                name=role_name,
                description=f"Standard role for {role_name}",
                scope_level=ScopeLevel.organization,
            )
            db.add(role)
            await db.flush()

        # Membership Check
        member_stmt = select(OrganizationMember).where(
            OrganizationMember.user_id == user.id, OrganizationMember.organization_id == org_id
        )
        member = (await db.execute(member_stmt)).scalars().first()
        if not member:
            member = OrganizationMember(
                user_id=user.id,
                organization_id=org_id,
                role_id=role.id,
                status=AssignmentStatus.active,
            )
            db.add(member)
            await db.flush()

        # 5. Update Request Status
        request.status = OnboardingRequestStatus.approved
        request.reviewed_by = reviewer_user.id
        request.reviewed_at = datetime.datetime.now(datetime.UTC)
        request.provisioned_organization_id = org_id
        request.provisioned_user_id = user.id
        await db.flush()

        # 6. Generate Single-Use Cryptographic Invitation Token
        raw_token = await PlatformService.create_invitation_token(user.id, db)

        # 7. Audit Log
        await AuditService.create_audit_log(
            db=db,
            user_id=reviewer_user.id,
            action="onboarding_request_approved",
            resource_type="onboarding_request",
            resource_id=request.id,
            changes={
                "provisioned_organization_id": str(org_id),
                "provisioned_user_id": str(user.id),
                "provisioned_site_id": str(request.provisioned_site_id)
                if request.provisioned_site_id
                else None,
            },
        )

        # 8. Send Activation Email via Resend
        email_res = await EmailService.send_activation_email(
            to_email=user.email,
            recipient_name=user.full_name,
            raw_token=raw_token,
            settings=settings,
        )
        invitation_sent = bool(email_res.get("id") or email_res.get("status") == "simulated")

        return {
            "organization_id": org_id,
            "user_email": user.email,
            "invitation_sent": invitation_sent,
            "raw_token": raw_token,
        }

    # =========================================================================
    # DUAL-APPROVAL CLINICAL SITE STUDY PARTICIPATION
    # =========================================================================

    @staticmethod
    async def create_site_participation_request(
        study_id: uuid.UUID,
        site_id: uuid.UUID,
        requester: User,
        db: AsyncSession,
        settings: Settings,
    ) -> SiteParticipationRequest:
        # Check if study & site exist
        study = (await db.execute(select(Study).where(Study.id == study_id))).scalars().first()
        if not study:
            raise ValueError("Study not found")

        site = (await db.execute(select(Site).where(Site.id == site_id))).scalars().first()
        if not site:
            raise ValueError("Site not found")

        # Check for existing pending/approved participation request
        existing_stmt = select(SiteParticipationRequest).where(
            SiteParticipationRequest.study_id == study_id,
            SiteParticipationRequest.site_id == site_id,
            SiteParticipationRequest.status.in_(
                [
                    SiteParticipationStatus.requested,
                    SiteParticipationStatus.pending_government_verification,
                    SiteParticipationStatus.pending_site_confirmation,
                    SiteParticipationStatus.approved,
                ]
            ),
        )
        existing = (await db.execute(existing_stmt)).scalars().first()
        if existing:
            return existing

        req = SiteParticipationRequest(
            study_id=study_id,
            site_id=site_id,
            requested_by_id=requester.id,
            government_status=ParticipationDecisionStatus.pending,
            site_status=ParticipationDecisionStatus.pending,
            status=SiteParticipationStatus.requested,
        )
        db.add(req)
        await db.flush()

        await AuditService.create_audit_log(
            db=db,
            user_id=requester.id,
            action="site_participation_requested",
            resource_type="site_participation_request",
            resource_id=req.id,
            changes={"study_id": str(study_id), "site_id": str(site_id)},
        )

        if site.email:
            await EmailService.send_site_participation_request_email(
                to_email=site.email,
                site_name=site.name,
                study_title=study.title,
                requester_name=requester.full_name,
                settings=settings,
            )

        return req

    @staticmethod
    async def review_site_participation_government(
        request_id: uuid.UUID,
        reviewer_user: User,
        decision: ParticipationDecisionStatus,
        notes: str | None,
        db: AsyncSession,
    ) -> SiteParticipationRequest:
        stmt = (
            select(SiteParticipationRequest)
            .where(SiteParticipationRequest.id == request_id)
            .with_for_update()
        )
        req = (await db.execute(stmt)).scalars().first()
        if not req:
            raise ValueError("Participation request not found")

        # Prevent reviewer from self-approving their own requested participation
        if req.requested_by_id == reviewer_user.id:
            raise ValueError("Reviewers cannot approve their own study site participation requests")

        req.government_status = decision
        req.government_reviewer_id = reviewer_user.id
        req.government_reviewed_at = datetime.datetime.now(datetime.UTC)
        req.government_notes = notes

        if decision == ParticipationDecisionStatus.approved:
            if req.site_status == ParticipationDecisionStatus.approved:
                req.status = SiteParticipationStatus.approved
                await PlatformService._activate_study_site(req, db)
            else:
                req.status = SiteParticipationStatus.pending_site_confirmation
        else:
            req.status = SiteParticipationStatus.rejected

        await db.flush()

        await AuditService.create_audit_log(
            db=db,
            user_id=reviewer_user.id,
            action=f"site_participation_government_{decision.value}",
            resource_type="site_participation_request",
            resource_id=req.id,
            changes={"government_status": decision.value, "overall_status": req.status.value},
        )
        return req

    @staticmethod
    async def respond_site_participation_site(
        request_id: uuid.UUID,
        site_user: User,
        decision: ParticipationDecisionStatus,
        notes: str | None,
        db: AsyncSession,
    ) -> SiteParticipationRequest:
        stmt = (
            select(SiteParticipationRequest)
            .where(SiteParticipationRequest.id == request_id)
            .with_for_update()
        )
        req = (await db.execute(stmt)).scalars().first()
        if not req:
            raise ValueError("Participation request not found")

        # Research PI cannot impersonate the site approver
        is_super = await PlatformService.is_super_admin(site_user, db)
        if req.requested_by_id == site_user.id and not is_super:
            raise PermissionError("Research PI requester cannot confirm site participation")

        # Check authorization on site
        # Must be affiliated with site or site's organization, or have StudyTeamMember at site, or be super admin
        site = (await db.execute(select(Site).where(Site.id == req.site_id))).scalars().first()
        if not site:
            raise ValueError("Site not found")

        is_authorized = is_super
        if not is_authorized and site.organization_id:
            for m in site_user.memberships:
                if (
                    m.organization_id == site.organization_id
                    and m.status == AssignmentStatus.active
                ):
                    is_authorized = True
                    break

        if not is_authorized:
            for a in site_user.study_team_assignments:
                if a.site_id == site.id and a.assignment_status == AssignmentStatus.active:
                    is_authorized = True
                    break

        # Also allow if user's email matches site's email
        if not is_authorized and site.email and site.email.lower() == site_user.email.lower():
            is_authorized = True

        if not is_authorized:
            raise PermissionError(
                f"User is not authorized to make decisions for site {site.site_code}"
            )

        req.site_status = decision
        req.site_reviewer_id = site_user.id
        req.site_reviewed_at = datetime.datetime.now(datetime.UTC)
        req.site_notes = notes

        if decision == ParticipationDecisionStatus.approved:
            if req.government_status == ParticipationDecisionStatus.approved:
                req.status = SiteParticipationStatus.approved
                await PlatformService._activate_study_site(req, db)
            else:
                req.status = SiteParticipationStatus.pending_government_verification
        else:
            req.status = SiteParticipationStatus.rejected

        await db.flush()

        await AuditService.create_audit_log(
            db=db,
            user_id=site_user.id,
            action=f"site_participation_site_{decision.value}",
            resource_type="site_participation_request",
            resource_id=req.id,
            changes={"site_status": decision.value, "overall_status": req.status.value},
        )
        return req

    @staticmethod
    async def _activate_study_site(req: SiteParticipationRequest, db: AsyncSession) -> StudySite:
        """Activates or creates StudySite ONLY when both Government and Site approvals are confirmed."""
        stmt = select(StudySite).where(
            StudySite.study_id == req.study_id, StudySite.site_id == req.site_id
        )
        ss = (await db.execute(stmt)).scalars().first()

        if not ss:
            ss = StudySite(
                study_id=req.study_id,
                site_id=req.site_id,
                activation_status=StudySiteActivationStatus.activated,
                activation_date=datetime.date.today(),
            )
            db.add(ss)
            await db.flush()
        else:
            ss.activation_status = StudySiteActivationStatus.activated
            ss.activation_date = datetime.date.today()
            await db.flush()

        req.study_site_id = ss.id
        return ss

    # =========================================================================
    # TEAM MEMBER INVITATIONS & INDIVIDUAL GOVERNMENT VERIFICATION
    # =========================================================================

    @staticmethod
    async def create_team_invitation(
        invited_by: User,
        full_name: str,
        email: str,
        requested_role: str,
        phone: str | None,
        designation: str | None,
        organization_id: uuid.UUID | None,
        study_id: uuid.UUID | None,
        site_id: uuid.UUID | None,
        db: AsyncSession,
    ) -> TeamMemberVerificationRequest:
        inv = TeamMemberVerificationRequest(
            invited_by_id=invited_by.id,
            full_name=full_name,
            email=email,
            phone=phone,
            designation=designation,
            organization_id=organization_id,
            study_id=study_id,
            site_id=site_id,
            requested_role=requested_role,
            status=OnboardingRequestStatus.pending,
        )
        db.add(inv)
        await db.flush()

        await AuditService.create_audit_log(
            db=db,
            user_id=invited_by.id,
            action="team_member_invitation_created",
            resource_type="team_member_verification_request",
            resource_id=inv.id,
            changes={"email": email, "requested_role": requested_role},
        )
        return inv

    @staticmethod
    async def review_team_verification(
        request_id: uuid.UUID,
        reviewer_user: User,
        status: OnboardingRequestStatus,
        review_notes: str | None,
        db: AsyncSession,
        settings: Settings,
    ) -> TeamMemberVerificationRequest:
        stmt = (
            select(TeamMemberVerificationRequest)
            .where(TeamMemberVerificationRequest.id == request_id)
            .with_for_update()
        )
        req = (await db.execute(stmt)).scalars().first()
        if not req:
            raise ValueError("Team verification request not found")

        # Security: inviter cannot self-approve team member
        if req.invited_by_id == reviewer_user.id:
            raise ValueError("Inviters cannot approve their own team member invitations")

        req.status = status
        req.review_notes = review_notes
        req.reviewed_by = reviewer_user.id
        req.reviewed_at = datetime.datetime.now(datetime.UTC)

        raw_token: str | None = None
        if status == OnboardingRequestStatus.approved:
            # Provision or find user
            u_stmt = select(User).where(User.email == req.email)
            u = (await db.execute(u_stmt)).scalars().first()
            if not u:
                dummy_password = hash_password(secrets.token_urlsafe(32))
                u = User(
                    email=req.email,
                    full_name=req.full_name,
                    phone=req.phone,
                    status=UserStatus.inactive,
                    hashed_password=dummy_password,
                    must_change_password=True,
                )
                db.add(u)
                await db.flush()

            req.provisioned_user_id = u.id

            # Role
            role_stmt = select(Role).where(Role.name == req.requested_role)
            role = (await db.execute(role_stmt)).scalars().first()
            if not role:
                role = Role(
                    name=req.requested_role,
                    description=f"Auto-created role {req.requested_role}",
                    scope_level=ScopeLevel.study if req.study_id else ScopeLevel.organization,
                )
                db.add(role)
                await db.flush()

            # Assign to study team or org member
            if req.study_id:
                assignment = StudyTeamMember(
                    study_id=req.study_id,
                    user_id=u.id,
                    role_id=role.id,
                    site_id=req.site_id,
                    assignment_status=AssignmentStatus.active,
                    start_date=datetime.date.today(),
                )
                db.add(assignment)
            elif req.organization_id:
                membership = OrganizationMember(
                    organization_id=req.organization_id,
                    user_id=u.id,
                    role_id=role.id,
                    status=AssignmentStatus.active,
                )
                db.add(membership)

            await db.flush()

            # Create invitation token & send email
            raw_token = await PlatformService.create_invitation_token(u.id, db)
            context_name = "Clinical Research Team"
            await EmailService.send_team_invitation_email(
                to_email=u.email,
                recipient_name=u.full_name,
                inviter_name=reviewer_user.full_name,
                context_name=context_name,
                raw_token=raw_token,
                settings=settings,
            )

        await AuditService.create_audit_log(
            db=db,
            user_id=reviewer_user.id,
            action=f"team_verification_{status.value}",
            resource_type="team_member_verification_request",
            resource_id=req.id,
            changes={"status": status.value, "provisioned_user_id": str(req.provisioned_user_id)},
        )
        return req

    # =========================================================================
    # VERIFIER EXPANSION & FIRST-LOGIN SETUP
    # =========================================================================

    @staticmethod
    async def provision_verifier(
        admin_user: User,
        email: str,
        full_name: str,
        db: AsyncSession,
        settings: Settings,
    ) -> tuple[User, str]:
        # Check user
        u = (await db.execute(select(User).where(User.email == email))).scalars().first()
        if not u:
            dummy_password = hash_password(secrets.token_urlsafe(32))
            u = User(
                email=email,
                full_name=full_name,
                status=UserStatus.inactive,
                hashed_password=dummy_password,
                must_change_password=True,
            )
            db.add(u)
            await db.flush()

        # Add SuperAdminProfile
        prof = (
            await db.execute(select(SuperAdminProfile).where(SuperAdminProfile.user_id == u.id))
        ).scalars().first()
        if not prof:
            prof = SuperAdminProfile(user_id=u.id, is_active=True)
            db.add(prof)
            await db.flush()

        raw_token = await PlatformService.create_invitation_token(u.id, db)

        await AuditService.create_audit_log(
            db=db,
            user_id=admin_user.id,
            action="platform_verifier_provisioned",
            resource_type="user",
            resource_id=u.id,
            changes={"email": email, "verifier_user_id": str(u.id)},
        )

        await EmailService.send_activation_email(
            to_email=u.email,
            recipient_name=u.full_name,
            raw_token=raw_token,
            settings=settings,
        )

        return u, raw_token

    @staticmethod
    async def complete_first_login_setup(
        user: User,
        current_password: str,
        new_password: str,
        full_name: str | None,
        phone: str | None,
        db: AsyncSession,
    ) -> None:
        if not verify_password(current_password, user.hashed_password):
            raise ValueError("Incorrect current password")

        user.hashed_password = hash_password(new_password)
        if full_name:
            user.full_name = full_name
        if phone:
            user.phone = phone
        user.must_change_password = False
        user.password_changed_at = datetime.datetime.now(datetime.UTC)
        await db.flush()

        await AuditService.create_audit_log(
            db=db,
            user_id=user.id,
            action="first_login_setup_completed",
            resource_type="user",
            resource_id=user.id,
            changes={"must_change_password": False},
        )
