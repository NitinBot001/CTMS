from __future__ import annotations

import json
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
from app.models.user import Permission, Role, RolePermission, User
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


def extract_study_id_from_audit_changes(changes: Any) -> uuid.UUID | None:
    """Extracts study_id from audit changes payload if present."""
    if not changes:
        return None
    if isinstance(changes, str):
        try:
            changes = json.loads(changes)
        except Exception:
            return None
    if isinstance(changes, dict):
        raw_sid = changes.get("study_id") or changes.get("studyId")
        if raw_sid:
            try:
                return uuid.UUID(str(raw_sid))
            except (ValueError, TypeError):
                return None
    return None


async def get_user_study_scope_ids(user: User, db: AsyncSession) -> set[uuid.UUID]:
    """
    Returns set of Study IDs for which the caller is explicitly authorized to view audit logs.
    Enforces that the user must have both:
    1. Study association (via sponsor/CRO organization membership or study team assignment).
    2. Explicit 'audit:read' permission within that same scope.
    Ordinary assigned users (e.g. site nurses, coordinators, investigators) without 'audit:read'
    permission gain NO audit access.
    """
    accessible: set[uuid.UUID] = set()

    # 1. Organization-scoped audit:read:
    # Active organization membership whose role explicitly grants 'audit:read' (or '*')
    # Grants access strictly to studies where that organization is sponsor or CRO.
    authorized_org_ids: list[uuid.UUID] = []
    for m in user.memberships:
        if m.status == AssignmentStatus.active and m.role:
            has_audit = any(
                rp.permission and rp.permission.codename in ("audit:read", "*")
                for rp in m.role.permissions
            )
            if has_audit:
                authorized_org_ids.append(m.organization_id)

    if authorized_org_ids:
        stmt = select(Study.id).where(
            (Study.sponsor_org_id.in_(authorized_org_ids)) | (Study.cro_org_id.in_(authorized_org_ids))
        )
        for sid in (await db.execute(stmt)).scalars().all():
            accessible.add(sid)

    # 2. Study-scoped audit:read:
    # Active study team assignment whose assigned role explicitly grants 'audit:read' (or '*')
    # Grants access strictly to that assigned study.
    team_stmt = (
        select(StudyTeamMember.study_id)
        .join(StudyTeamMember.role)
        .join(Role.permissions)
        .join(RolePermission.permission)
        .where(
            StudyTeamMember.user_id == user.id,
            StudyTeamMember.assignment_status == AssignmentStatus.active,
            Permission.codename.in_(["audit:read", "*"]),
        )
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
            ss_stmt = select(StudySite.study_id).where(StudySite.site_id == resource_id)
            all_site_study_ids = set((await db.execute(ss_stmt)).scalars().all())
            authorized_site_study_ids = all_site_study_ids.intersection(accessible_study_ids)
            if not authorized_site_study_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: site is not associated with an authorized study",
                )
            is_shared_with_inaccessible_studies = bool(all_site_study_ids - accessible_study_ids)

        elif resource_type == "study_site":
            study_site = await db.get(StudySite, resource_id)
            if not study_site:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study site assignment not found")
            if study_site.study_id not in accessible_study_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: study site does not belong to an authorized study",
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

    if not is_global_auditor and resource_type == "site":
        raw_logs = (await db.execute(stmt)).scalars().all()
        filtered_logs: list[AuditLog] = []
        for log in raw_logs:
            log_study_id = extract_study_id_from_audit_changes(log.changes)
            if log_study_id is not None:
                # Explicit study context: allow only if study is authorized
                if log_study_id in accessible_study_ids:
                    filtered_logs.append(log)
            else:
                # Ambiguous site-level log with no study context:
                # Disallow on shared sites to prevent cross-study leakage of global site history
                if not is_shared_with_inaccessible_studies:
                    filtered_logs.append(log)
        return filtered_logs[skip : skip + limit]

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
