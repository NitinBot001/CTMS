from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class StatusTransitionRequest(BaseModel):
    new_status: str
    reason: str | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    size: int


class MessageResponse(BaseModel):
    message: str
