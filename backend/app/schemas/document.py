from __future__ import annotations

import datetime
import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import DocumentStatus, DocumentType


class DocumentBase(BaseModel):
    organization_id: uuid.UUID | None = None
    study_id: uuid.UUID | None = None
    site_id: uuid.UUID | None = None
    document_type: DocumentType
    title: str
    version: str
    expiry_date: datetime.date | None = None
    storage_key: str
    file_name: str
    file_size: int | None = None
    mime_type: str | None = None
    checksum: str | None = None


class DocumentCreate(DocumentBase):
    pass


class DocumentRead(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    status: DocumentStatus
    uploaded_by: uuid.UUID
    approved_by: uuid.UUID | None = None
    approved_at: datetime.datetime | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
