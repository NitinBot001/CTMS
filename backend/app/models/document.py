from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums import DocumentStatus, DocumentType

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.site import Site
    from app.models.study import Study
    from app.models.user import User


class Document(BaseModel):
    __tablename__ = "documents"

    organization_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("organizations.id"))
    study_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("studies.id"), index=True)
    site_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("sites.id"))

    document_type: Mapped[DocumentType] = mapped_column(
        sa.Enum(DocumentType, name="document_type", create_constraint=True)
    )
    title: Mapped[str] = mapped_column(sa.String(500))
    version: Mapped[str] = mapped_column(sa.String(50))
    status: Mapped[DocumentStatus] = mapped_column(
        sa.Enum(DocumentStatus, name="document_status", create_constraint=True)
    )

    expiry_date: Mapped[date | None] = mapped_column(sa.Date, index=True)
    storage_key: Mapped[str] = mapped_column(sa.String(1000))
    file_name: Mapped[str] = mapped_column(sa.String(500))
    file_size: Mapped[int | None] = mapped_column(sa.BigInteger)
    mime_type: Mapped[str | None] = mapped_column(sa.String(100))
    checksum: Mapped[str | None] = mapped_column(sa.String(128))

    uploaded_by: Mapped[uuid.UUID] = mapped_column(sa.ForeignKey("users.id"))
    approved_by: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("users.id"))
    approved_at: Mapped[datetime | None] = mapped_column(sa.DateTime)

    # Relationships
    organization: Mapped[Organization | None] = relationship(back_populates="documents")
    study: Mapped[Study | None] = relationship(back_populates="documents")
    site: Mapped[Site | None] = relationship(back_populates="documents")

    uploaded_by_user: Mapped[User] = relationship(
        back_populates="documents_uploaded", foreign_keys=[uploaded_by]
    )
    approved_by_user: Mapped[User | None] = relationship(
        back_populates="documents_approved", foreign_keys=[approved_by]
    )
