from __future__ import annotations

import datetime
import logging
import secrets
import smtplib
import uuid
from email.message import EmailMessage

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import hash_password, verify_password
from app.models.enums import (
    AssignmentStatus,
    OnboardingRequestStatus,
    OrganizationStatus,
    ScopeLevel,
    UserStatus,
)
from app.models.organization import Organization, OrganizationMember
from app.models.platform import OnboardingRequest
from app.models.user import InvitationToken, Role, SuperAdminProfile, User
from app.services.audit import AuditService

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
            SuperAdminProfile.user_id == user.id,
            SuperAdminProfile.is_active.is_(True)
        )
        res = await db.execute(stmt)
        return res.scalars().first() is not None

    @staticmethod
    async def create_invitation_token(user_id: uuid.UUID, db: AsyncSession) -> str:
        raw_token = secrets.token_urlsafe(32)
        # Using the project's security.py hash_password which uses rounds=12
        token_hash = hash_password(raw_token)
        
        expires_at = datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=7)
        
        token_record = InvitationToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            is_used=False
        )
        db.add(token_record)
        await db.flush()
        return raw_token

    @staticmethod
    async def verify_and_consume_invitation_token(raw_token: str, db: AsyncSession) -> InvitationToken | None:
        now = datetime.datetime.now(datetime.UTC)
        stmt = select(InvitationToken).where(
            InvitationToken.is_used.is_(False),
            InvitationToken.expires_at > now
        ).order_by(InvitationToken.created_at.desc()).limit(10)
        
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
        settings: Settings
    ) -> dict:
        # Re-read to ensure atomic state within a transaction
        stmt = select(OnboardingRequest).where(OnboardingRequest.id == request_id).with_for_update()
        res = await db.execute(stmt)
        request = res.scalars().first()
        
        if not request:
            raise ValueError("Request not found")
            
        if request.status == OnboardingRequestStatus.approved:
            return {
                "organization_id": request.provisioned_organization_id,
                "user_email": request.email,
                "invitation_sent": False,
                "raw_token": None
            }
            
        # Create Organization
        org = Organization(
            name=request.organization_name,
            organization_type=request.organization_type,
            status=OrganizationStatus.active,
            email=request.email,
            phone=request.phone,
            website=request.website,
            country=request.country,
            state=request.state,
            city=request.city,
        )
        db.add(org)
        await db.flush()
        
        # Create User
        # Check if email exists
        user_stmt = select(User).where(User.email == request.email)
        user_res = await db.execute(user_stmt)
        existing_user = user_res.scalars().first()
        
        if existing_user:
            user = existing_user
        else:
            # We create a dummy password, they must reset it via activation token
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
            
        # Ensure org-admin role exists
        role_stmt = select(Role).where(Role.name == "Organization Admin", Role.scope_level == ScopeLevel.organization)
        role_res = await db.execute(role_stmt)
        org_admin_role = role_res.scalars().first()
        
        if not org_admin_role:
            org_admin_role = Role(
                name="Organization Admin",
                description="Administrator for the organization",
                scope_level=ScopeLevel.organization,
            )
            db.add(org_admin_role)
            await db.flush()
            
        # Create membership
        member = OrganizationMember(
            user_id=user.id,
            organization_id=org.id,
            role_id=org_admin_role.id,
            status=AssignmentStatus.active,
        )
        db.add(member)
        await db.flush()
        
        # Update request
        request.status = OnboardingRequestStatus.approved
        request.reviewed_by = reviewer_user.id
        request.reviewed_at = datetime.datetime.now(datetime.UTC)
        request.provisioned_organization_id = org.id
        request.provisioned_user_id = user.id
        await db.flush()
        
        # Create invitation token
        raw_token = await PlatformService.create_invitation_token(user.id, db)
        
        # Audit
        await AuditService.create_audit_log(
            db=db,
            user_id=reviewer_user.id,
            action="onboarding_request_approved",
            resource_type="onboarding_request",
            resource_id=request.id,
            changes={"provisioned_organization_id": str(org.id), "provisioned_user_id": str(user.id)}
        )
        
        # Send Email
        PlatformService.send_invitation_email(user.email, org.name, raw_token, settings)
        
        return {
            "organization_id": org.id,
            "user_email": user.email,
            "invitation_sent": settings.MAIL_ENABLED,
            "raw_token": raw_token if not settings.MAIL_ENABLED else None
        }

    @staticmethod
    def send_invitation_email(to_email: str, org_name: str, raw_token: str, settings: Settings):
        if not settings.MAIL_ENABLED:
            logger.info(f"[DEV] Invitation token for {to_email}: {raw_token[:8]}...")
            return
            
        try:
            msg = EmailMessage()
            msg.set_content(f"Welcome to AyuCTMS! Your organization {org_name} has been approved.\n\nPlease activate your account using this token:\n\n{raw_token}")
            msg["Subject"] = "AyuCTMS - Activate your account"
            msg["From"] = settings.MAIL_FROM
            msg["To"] = to_email
            
            # Very basic SMTP sending
            s = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            if settings.SMTP_USE_TLS:
                s.starttls()
            if settings.SMTP_USERNAME:
                s.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            s.send_message(msg)
            s.quit()
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
