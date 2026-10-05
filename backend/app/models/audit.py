from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    timestamp: Mapped[datetime] = mapped_column(sa.DateTime, default=sa.func.now())
    user_id: Mapped[uuid.UUID | None] = mapped_column(sa.ForeignKey("users.id"))

    action: Mapped[str] = mapped_column(sa.String(100))
    resource_type: Mapped[str] = mapped_column(sa.String(100))
    resource_id: Mapped[uuid.UUID] = mapped_column(sa.Uuid)

    changes: Mapped[Any | None] = mapped_column(sa.JSON)
    ip_address: Mapped[str | None] = mapped_column(sa.String(45))

    previous_hash: Mapped[str | None] = mapped_column(sa.String(64))
    entry_hash: Mapped[str] = mapped_column(sa.String(64))

    # Relationships
    user: Mapped[User | None] = relationship(back_populates="audit_logs")
