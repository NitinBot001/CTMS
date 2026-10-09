from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.audit import AuditLog
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
    current_user: User = Depends(get_current_user),
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
