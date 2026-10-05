from __future__ import annotations

import datetime
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.document import Document
from app.models.enums import DocumentStatus, DocumentType
from app.models.user import User
from app.schemas.common import StatusTransitionRequest
from app.schemas.document import DocumentCreate, DocumentRead
from app.services.audit import AuditService

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def create_document(
    doc_in: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = Document(
        **doc_in.model_dump(),
        status=DocumentStatus.draft,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="document.create",
        resource_type="document",
        resource_id=doc.id,
        changes=doc_in.model_dump(mode="json"),
    )
    await db.commit()
    await db.refresh(doc)
    return doc


@router.get("", response_model=list[DocumentRead])
async def list_documents(
    study_id: uuid.UUID | None = None,
    organization_id: uuid.UUID | None = None,
    site_id: uuid.UUID | None = None,
    document_type: DocumentType | None = None,
    status: DocumentStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Document)
    if study_id:
        stmt = stmt.where(Document.study_id == study_id)
    if organization_id:
        stmt = stmt.where(Document.organization_id == organization_id)
    if site_id:
        stmt = stmt.where(Document.site_id == site_id)
    if document_type:
        stmt = stmt.where(Document.document_type == document_type)
    if status:
        stmt = stmt.where(Document.status == status)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{document_id}", response_model=DocumentRead)
async def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.post("/{document_id}/transition", response_model=DocumentRead)
async def transition_document(
    document_id: uuid.UUID,
    transition_in: StatusTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        new_status = DocumentStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(
            status_code=400, detail=f"Invalid document status: {transition_in.new_status}"
        )

    allowed_transitions = {
        DocumentStatus.draft: [DocumentStatus.under_review, DocumentStatus.archived],
        DocumentStatus.under_review: [
            DocumentStatus.approved,
            DocumentStatus.draft,
            DocumentStatus.archived,
        ],
        DocumentStatus.approved: [
            DocumentStatus.superseded,
            DocumentStatus.expired,
            DocumentStatus.archived,
        ],
    }

    if new_status not in allowed_transitions.get(doc.status, []):
        raise HTTPException(
            status_code=400, detail=f"Invalid transition from {doc.status.value} to {new_status.value}"
        )

    old_status = doc.status
    doc.status = new_status

    if new_status == DocumentStatus.approved:
        doc.approved_by = current_user.id
        doc.approved_at = datetime.datetime.now(datetime.UTC)

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="document.transition",
        resource_type="document",
        resource_id=doc.id,
        changes={
            "old_status": old_status.value,
            "new_status": new_status.value,
            "notes": transition_in.reason,
        },
    )
    await db.commit()
    await db.refresh(doc)
    return doc
