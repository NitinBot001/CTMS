from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import (
    get_current_user,
    has_global_audit_permission,
    require_global_audit_access,
)
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.document import Document
from app.models.enums import AssignmentStatus
from app.models.participant import Participant
from app.models.site import Site, StudySite
from app.models.study import Study, StudyTeamMember
from app.models.user import User
from app.services.audit import AuditService

router = APIRouter(prefix="/audit", tags=["Audit Trail"])


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    timestamp: Any
    user_id: uuid.UUID | None = None
    action: str
    resource_type: str
    resource_id: uuid.UUID
    changes: Any | None = None
    ip_address: str | None = None
    previous_hash: str | None = None
    entry_hash: str


async def get_user_study_scope_ids(user: User, db: AsyncSession) -> set[uuid.UUID]:
    """
    Returns set of Study IDs accessible to the user based on active organization membership
    (Sponsor/CRO) and active study team member assignments.
    """
    user_org_ids = [
        m.organization_id
        for m in user.memberships
        if m.status == AssignmentStatus.active
    ]
    accessible: set[uuid.UUID] = set()
    if user_org_ids:
        stmt = select(Study.id).where(
            (Study.sponsor_org_id.in_(user_org_ids)) | (Study.cro_org_id.in_(user_org_ids))
        )
        for sid in (await db.execute(stmt)).scalars().all():
            accessible.add(sid)

    team_stmt = select(StudyTeamMember.study_id).where(
        StudyTeamMember.user_id == user.id,
        StudyTeamMember.assignment_status == AssignmentStatus.active,
    )
    for sid in (await db.execute(team_stmt)).scalars().all():
        accessible.add(sid)

    return accessible


@router.get("/logs", response_model=list[AuditLogRead])
async def list_audit_logs(
    resource_type: str | None = None,
    resource_id: uuid.UUID | None = None,
    action: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    is_global_auditor = has_global_audit_permission(current_user)

    if not is_global_auditor:
        # Caller lacks global audit access: must provide specific resource scoping
        if not resource_type or not resource_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied: global audit access requires 'audit:read' permission",
            )

        accessible_study_ids = await get_user_study_scope_ids(current_user, db)

        if resource_type == "study":
            study = await db.get(Study, resource_id)
            if not study:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study not found")
            if resource_id not in accessible_study_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: user is not assigned to or authorized for this study",
                )

        elif resource_type == "participant":
            participant = await db.get(Participant, resource_id)
            if not participant:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")
            if participant.study_id not in accessible_study_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: participant does not belong to an authorized study",
                )

        elif resource_type == "document":
            document = await db.get(Document, resource_id)
            if not document:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
            if document.study_id is None or document.study_id not in accessible_study_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: document does not belong to an authorized study",
                )

        elif resource_type == "site":
            site = await db.get(Site, resource_id)
            if not site:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
            if not accessible_study_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: site is not associated with an authorized study",
                )
            ss_stmt = select(StudySite).where(
                StudySite.site_id == resource_id,
                StudySite.study_id.in_(accessible_study_ids),
            )
            site_in_study = (await db.execute(ss_stmt)).scalars().first()
            if not site_in_study:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: site is not associated with an authorized study",
                )

        else:
            # System-wide or un-scopable resource types (user, role, organization, etc.)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied: viewing audit logs for this resource requires 'audit:read' permission",
            )

    stmt = select(AuditLog).order_by(AuditLog.timestamp.desc())
    if resource_type:
        stmt = stmt.where(AuditLog.resource_type == resource_type)
    if resource_id:
        stmt = stmt.where(AuditLog.resource_id == resource_id)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/verify")
async def verify_audit_chain(
    current_user: User = Depends(require_global_audit_access),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Verifies the cryptographic hash-chain integrity of all audit records.
    Validates both:
    1. Chain Link Integrity: previous_hash matches the entry_hash of the preceding record.
    2. Payload Integrity: entry_hash matches the SHA-256 digest of the canonical record payload.
    """
    stmt = select(AuditLog).order_by(AuditLog.timestamp.asc())
    result = await db.execute(stmt)
    logs = result.scalars().all()

    expected_previous_hash = "0" * 64
    verified_count = 0

    for idx, log in enumerate(logs):
        # 1. Chain link integrity check
        if log.previous_hash != expected_previous_hash:
            return {
                "valid": False,
                "failure_type": "broken_link",
                "index": idx,
                "record_id": str(log.id),
                "error": f"Chain broken at record {idx} (ID: {log.id}): expected previous_hash '{expected_previous_hash}' but found '{log.previous_hash}'",
                "verified_records": verified_count,
            }

        # 2. Payload tamper check
        expected_entry_hash = AuditService.compute_entry_hash(
            previous_hash=log.previous_hash,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            timestamp=log.timestamp,
        )
        if log.entry_hash != expected_entry_hash:
            return {
                "valid": False,
                "failure_type": "payload_tampered",
                "index": idx,
                "record_id": str(log.id),
                "error": f"Payload tampered at record {idx} (ID: {log.id}): expected entry_hash '{expected_entry_hash}' but found '{log.entry_hash}'",
                "verified_records": verified_count,
            }

        expected_previous_hash = log.entry_hash
        verified_count += 1

    return {
        "valid": True,
        "verified_records": verified_count,
        "message": f"Cryptographic integrity verified across all {verified_count} audit log entries",
    }
