from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.audit import AuditService


@pytest.mark.asyncio
async def test_audit_hash_chain_integrity(client: AsyncClient, db_session: AsyncSession):
    user_id = uuid.uuid4()
    r_id1 = uuid.uuid4()
    r_id2 = uuid.uuid4()
    r_id3 = uuid.uuid4()

    # Create 3 audit records sequentially
    log1 = await AuditService.create_audit_log(
        db=db_session,
        user_id=user_id,
        action="organization.create",
        resource_type="organization",
        resource_id=r_id1,
        changes={"name": "Org 1"},
    )
    await db_session.commit()

    log2 = await AuditService.create_audit_log(
        db=db_session,
        user_id=user_id,
        action="study.create",
        resource_type="study",
        resource_id=r_id2,
        changes={"title": "Study 1"},
    )
    await db_session.commit()

    log3 = await AuditService.create_audit_log(
        db=db_session,
        user_id=user_id,
        action="participant.create",
        resource_type="participant",
        resource_id=r_id3,
        changes={"code": "P-01"},
    )
    await db_session.commit()

    # 1. Verify genesis entry
    assert log1.previous_hash == "0" * 64
    # 2. Verify second entry links to first entry's hash
    assert log2.previous_hash == log1.entry_hash
    # 3. Verify third entry links to second entry's hash
    assert log3.previous_hash == log2.entry_hash

    # 4. Verify API verification endpoint returns valid
    res = await client.get("/api/v1/audit/verify")
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["verified_records"] >= 3

    # 5. Simulate malicious tampering of log2
    log2.previous_hash = "tampered_hash_value_1234567890abcdef"
    await db_session.commit()

    # Verification must detect the tampering!
    tamper_res = await client.get("/api/v1/audit/verify")
    assert tamper_res.status_code == 200
    tamper_data = tamper_res.json()
    assert tamper_data["valid"] is False
    assert "Chain broken" in tamper_data["error"]
    assert tamper_data["failure_type"] == "broken_link"

    # 6. Simulate malicious payload tampering (changing action while hashes appear unchanged)
    log2.previous_hash = log1.entry_hash
    log2.action = "malicious.tampered.action"
    await db_session.commit()

    tamper_payload_res = await client.get("/api/v1/audit/verify")
    assert tamper_payload_res.status_code == 200
    tamper_payload_data = tamper_payload_res.json()
    assert tamper_payload_data["valid"] is False
    assert tamper_payload_data["failure_type"] == "payload_tampered"
    assert "Payload tampered" in tamper_payload_data["error"]
