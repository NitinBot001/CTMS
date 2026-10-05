from __future__ import annotations

import datetime
import hashlib
import json
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


class AuditService:
    @staticmethod
    async def create_audit_log(
        db: AsyncSession,
        user_id: uuid.UUID | None,
        action: str,
        resource_type: str,
        resource_id: uuid.UUID,
        changes: dict | None = None,
        ip_address: str | None = None,
    ) -> AuditLog:
        # Fetch the last audit log for hash chaining ordered strictly by timestamp
        stmt = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(1)
        result = await db.execute(stmt)
        last_log = result.scalars().first()

        previous_hash = last_log.entry_hash if last_log else "0" * 64

        now = datetime.datetime.now(datetime.UTC)
        # Ensure strict monotonic ordering even in tight sub-millisecond execution loops
        if last_log and last_log.timestamp:
            # Handle naive or aware timestamp comparison
            last_ts = last_log.timestamp
            if last_ts.tzinfo is None:
                last_ts = last_ts.replace(tzinfo=datetime.UTC)
            if last_ts >= now:
                now = last_ts + datetime.timedelta(microseconds=10)

        now_iso = now.isoformat()

        # Calculate new hash
        hash_input = f"{previous_hash}{action}{resource_type}{str(resource_id)}{now_iso}"
        entry_hash = hashlib.sha256(hash_input.encode()).hexdigest()

        # Sanitize changes for JSON storage (convert UUIDs, dates, enums to serializable primitives)
        sanitized_changes: Any = None
        if changes is not None:
            sanitized_changes = json.loads(json.dumps(changes, default=str))

        audit_log = AuditLog(
            timestamp=now,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            changes=sanitized_changes,
            ip_address=ip_address,
            previous_hash=previous_hash,
            entry_hash=entry_hash,
        )

        db.add(audit_log)
        await db.flush()

        return audit_log
