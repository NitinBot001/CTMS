import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import StudyStatus
from app.models.study import Study
from app.schemas.study import StudyCreate
from app.services.audit import AuditService


class StudyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_study(self, study_id: uuid.UUID) -> Study | None:
        stmt = select(Study).where(Study.id == study_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create_study(self, study_in: StudyCreate, user_id: uuid.UUID) -> Study:
        study = Study(**study_in.model_dump(), status=StudyStatus.draft)
        self.db.add(study)
        await self.db.flush()

        await AuditService.create_audit_log(
            db=self.db,
            user_id=user_id,
            action="study.create",
            resource_type="study",
            resource_id=study.id,
            changes={"new": study_in.model_dump()},
        )
        await self.db.commit()
        await self.db.refresh(study)
        return study

    async def transition_status(
        self, study_id: uuid.UUID, new_status: StudyStatus, user_id: uuid.UUID
    ) -> Study:
        study = await self.get_study(study_id)
        if not study:
            raise ValueError("Study not found")

        current_status = study.status
        allowed_transitions = {
            StudyStatus.draft: [StudyStatus.planned, StudyStatus.withdrawn],
            StudyStatus.planned: [StudyStatus.active],
            StudyStatus.active: [
                StudyStatus.suspended,
                StudyStatus.completed,
                StudyStatus.terminated,
            ],
            StudyStatus.suspended: [StudyStatus.active],
        }

        if new_status not in allowed_transitions.get(current_status, []):
            raise ValueError(f"Invalid transition from {current_status} to {new_status}")

        study.status = new_status

        await AuditService.create_audit_log(
            db=self.db,
            user_id=user_id,
            action="study.transition",
            resource_type="study",
            resource_id=study.id,
            changes={"old_status": current_status, "new_status": new_status},
        )

        await self.db.commit()
        await self.db.refresh(study)
        return study
