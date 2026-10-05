import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import OnboardingStatus, OrganizationStatus
from app.models.organization import OnboardingApplication, Organization
from app.schemas.organization import (
    OrganizationCreate,
)
from app.services.audit import AuditService


class OrganizationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_organization(self, org_id: uuid.UUID) -> Organization | None:
        stmt = select(Organization).where(Organization.id == org_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create_organization(
        self, org_in: OrganizationCreate, user_id: uuid.UUID
    ) -> Organization:
        org = Organization(**org_in.model_dump(), status=OrganizationStatus.draft)
        self.db.add(org)
        await self.db.flush()

        await AuditService.create_audit_log(
            db=self.db,
            user_id=user_id,
            action="organization.create",
            resource_type="organization",
            resource_id=org.id,
            changes={"new": org_in.model_dump()},
        )
        await self.db.commit()
        await self.db.refresh(org)
        return org

    async def transition_onboarding(
        self,
        application_id: uuid.UUID,
        new_status: OnboardingStatus,
        user_id: uuid.UUID,
        notes: str | None = None,
    ) -> OnboardingApplication:
        stmt = select(OnboardingApplication).where(OnboardingApplication.id == application_id)
        result = await self.db.execute(stmt)
        application = result.scalars().first()
        if not application:
            raise ValueError("Application not found")

        current_status = application.status
        allowed_transitions = {
            OnboardingStatus.draft: [OnboardingStatus.submitted],
            OnboardingStatus.submitted: [OnboardingStatus.under_review],
            OnboardingStatus.under_review: [
                OnboardingStatus.approved,
                OnboardingStatus.returned,
                OnboardingStatus.rejected,
            ],
        }

        if new_status not in allowed_transitions.get(current_status, []):
            raise ValueError(f"Invalid transition from {current_status} to {new_status}")

        application.status = new_status
        if notes:
            application.review_notes = notes

        if new_status == OnboardingStatus.approved:
            org = await self.get_organization(application.organization_id)
            if org:
                org.status = OrganizationStatus.active

        await AuditService.create_audit_log(
            db=self.db,
            user_id=user_id,
            action="onboarding.transition",
            resource_type="onboarding_application",
            resource_id=application.id,
            changes={"old_status": current_status, "new_status": new_status, "notes": notes},
        )

        await self.db.commit()
        await self.db.refresh(application)
        return application
