from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.enums import SiteStatus, SiteType
from app.models.site import Site
from app.models.user import User
from app.schemas.site import SiteCreate, SiteRead, SiteUpdate
from app.services.audit import AuditService

router = APIRouter(prefix="/sites", tags=["Sites"])


@router.post("", response_model=SiteRead, status_code=status.HTTP_201_CREATED)
async def create_site(
    site_in: SiteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    site = Site(**site_in.model_dump(), status=SiteStatus.active)
    db.add(site)
    await db.flush()

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="site.create",
        resource_type="site",
        resource_id=site.id,
        changes=site_in.model_dump(mode="json"),
    )
    await db.commit()
    await db.refresh(site)
    return site


@router.get("", response_model=list[SiteRead])
async def list_sites(
    site_type: SiteType | None = None,
    status: SiteStatus | None = None,
    city: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Site)
    if site_type:
        stmt = stmt.where(Site.site_type == site_type)
    if status:
        stmt = stmt.where(Site.status == status)
    if city:
        stmt = stmt.where(Site.city.ilike(f"%{city}%"))
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{site_id}", response_model=SiteRead)
async def get_site(
    site_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    site = await db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site


@router.patch("/{site_id}", response_model=SiteRead)
async def update_site(
    site_id: uuid.UUID,
    site_in: SiteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    site = await db.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    update_data = site_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(site, field, value)

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="site.update",
        resource_type="site",
        resource_id=site.id,
        changes=update_data,
    )
    await db.commit()
    await db.refresh(site)
    return site
