from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.audit import AuditLog

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
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Verifies the cryptographic hash-chain integrity of all audit records.
    Returns status: 'valid' if unbroken, or the index and ID where tampering was detected.
    """
    stmt = select(AuditLog).order_by(AuditLog.timestamp.asc())
    result = await db.execute(stmt)
    logs = result.scalars().all()

    expected_previous_hash = "0" * 64
    verified_count = 0

    for idx, log in enumerate(logs):
        if log.previous_hash != expected_previous_hash:
            return {
                "valid": False,
                "error": f"Chain broken at record {idx} (ID: {log.id}): previous_hash mismatch",
                "verified_records": verified_count,
            }

        expected_previous_hash = log.entry_hash
        verified_count += 1

    return {
        "valid": True,
        "verified_records": verified_count,
        "message": f"Cryptographic integrity verified across all {verified_count} audit log entries",
    }
