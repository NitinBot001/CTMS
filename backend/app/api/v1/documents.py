from __future__ import annotations

import datetime
import uuid
from typing import Any

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import (
    _get_membership_organization,
    can_user_approve_document,
    get_current_user,
    has_document_permission,
    is_technical_system_admin,
    is_trusted_platform_organization,
    is_user_authorized_for_document,
)
from app.core.database import get_db
from app.models.document import Document
from app.models.enums import AssignmentStatus, DocumentStatus, DocumentType
from app.models.organization import Organization
from app.models.site import Site, StudySite
from app.models.study import Study, StudyTeamMember
from app.models.user import User
from app.schemas.common import StatusTransitionRequest
from app.schemas.document import DocumentCreate, DocumentRead
from app.services.audit import AuditService

router = APIRouter(prefix="/documents", tags=["Documents"])


async def _get_authorized_document_filters(
    user: User,
    db: AsyncSession,
) -> tuple[
    set[uuid.UUID],
    set[uuid.UUID],
    set[uuid.UUID],
    set[uuid.UUID],
    set[tuple[uuid.UUID, uuid.UUID]],
    list[Any],
]:
    """
    Computes SQL filtering expressions for Document queries based on the user's authorized scopes.
    Returns:
    (all_accessible_study_ids, all_accessible_site_ids, authorized_org_ids, full_study_ids, site_team_pairs, conditions)
    """
    authorized_org_ids: set[uuid.UUID] = set()
    for m in user.memberships:
        if m.status == AssignmentStatus.active and m.role:
            for rp in m.role.permissions:
                if rp.permission and rp.permission.codename in ("documents:read", "*"):
                    if rp.permission.codename == "*":
                        org = _get_membership_organization(m)
                        if not is_trusted_platform_organization(org):
                            continue
                    authorized_org_ids.add(m.organization_id)
                    break

    sponsor_cro_study_ids: set[uuid.UUID] = set()
    if authorized_org_ids:
        stmt_studies = select(Study.id).where(
            (Study.sponsor_org_id.in_(authorized_org_ids)) | (Study.cro_org_id.in_(authorized_org_ids))
        )
        sponsor_cro_study_ids = set((await db.execute(stmt_studies)).scalars().all())

    study_level_study_ids: set[uuid.UUID] = set()
    site_team_pairs: set[tuple[uuid.UUID, uuid.UUID]] = set()
    assigned_site_ids: set[uuid.UUID] = set()

    if hasattr(user, "study_team_assignments") and user.study_team_assignments:
        for a in user.study_team_assignments:
            if a.assignment_status == AssignmentStatus.active and a.role:
                has_read = any(
                    rp.permission and rp.permission.codename in ("documents:read", "*")
                    for rp in a.role.permissions
                )
                if has_read:
                    if a.site_id is None:
                        study_level_study_ids.add(a.study_id)
                    else:
                        site_team_pairs.add((a.study_id, a.site_id))
                        assigned_site_ids.add(a.site_id)

    org_site_ids: set[uuid.UUID] = set()
    if authorized_org_ids:
        stmt_sites = select(Site.id).where(Site.organization_id.in_(authorized_org_ids))
        org_site_ids = set((await db.execute(stmt_sites)).scalars().all())

    all_accessible_study_ids = sponsor_cro_study_ids | study_level_study_ids | {p[0] for p in site_team_pairs}
    all_accessible_site_ids = org_site_ids | assigned_site_ids

    conditions: list[Any] = []
    full_study_ids = sponsor_cro_study_ids | study_level_study_ids
    if full_study_ids:
        conditions.append(Document.study_id.in_(full_study_ids))

    for s_id, st_id in site_team_pairs:
        conditions.append(
            sa.and_(
                Document.study_id == s_id,
                sa.or_(Document.site_id.is_(None), Document.site_id == st_id),
            )
        )

    if authorized_org_ids:
        conditions.append(
            sa.and_(
                Document.study_id.is_(None),
                Document.site_id.is_(None),
                Document.organization_id.in_(authorized_org_ids),
            )
        )

    all_site_ids = org_site_ids | assigned_site_ids
    if all_site_ids:
        conditions.append(
            sa.and_(
                Document.study_id.is_(None),
                Document.site_id.in_(all_site_ids),
            )
        )

    return (
        all_accessible_study_ids,
        all_accessible_site_ids,
        authorized_org_ids,
        full_study_ids,
        site_team_pairs,
        conditions,
    )


@router.post("", response_model=DocumentRead, status_code=http_status.HTTP_201_CREATED)
async def create_document(
    doc_in: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_document_permission(current_user, "documents:upload"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'documents:upload'",
        )

    # Path traversal hygiene
    if (
        ".." in doc_in.storage_key
        or ".." in doc_in.file_name
        or "\x00" in doc_in.storage_key
        or "\x00" in doc_in.file_name
    ):
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Invalid storage key or file name: path traversal detected",
        )

    doc_data = doc_in.model_dump()

    if is_technical_system_admin(current_user):
        if doc_in.study_id:
            study = await db.get(Study, doc_in.study_id)
            if not study:
                raise HTTPException(status_code=404, detail="Study not found")
        if doc_in.site_id:
            site = await db.get(Site, doc_in.site_id)
            if not site:
                raise HTTPException(status_code=404, detail="Site not found")
        if doc_in.organization_id:
            org = await db.get(Organization, doc_in.organization_id)
            if not org:
                raise HTTPException(status_code=404, detail="Organization not found")
    else:
        # Non-admin callers must specify an authorized study, organization, or site
        if not doc_in.study_id and not doc_in.organization_id and not doc_in.site_id:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="A document must be associated with an authorized study, organization, or site",
            )

        if doc_in.study_id:
            study = await db.get(Study, doc_in.study_id)
            if not study:
                raise HTTPException(status_code=404, detail="Study not found")

            # Check if caller has study access via sponsor/CRO org or study team assignment
            is_sponsor_or_cro = False
            for m in current_user.memberships:
                if (
                    m.status == AssignmentStatus.active
                    and m.role
                    and m.organization_id in (study.sponsor_org_id, study.cro_org_id)
                    and any(
                        rp.permission and rp.permission.codename in ("documents:upload", "*")
                        for rp in m.role.permissions
                    )
                ):
                    is_sponsor_or_cro = True
                    break

            team_assignment: StudyTeamMember | None = None
            if hasattr(current_user, "study_team_assignments") and current_user.study_team_assignments:
                for a in current_user.study_team_assignments:
                    if (
                        a.study_id == doc_in.study_id
                        and a.assignment_status == AssignmentStatus.active
                        and a.role
                        and any(
                            rp.permission and rp.permission.codename in ("documents:upload", "*")
                            for rp in a.role.permissions
                        )
                    ):
                        team_assignment = a
                        break

            if not is_sponsor_or_cro and not team_assignment:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: user is not assigned to or authorized for this study",
                )

            # Organization scope validation
            if doc_in.organization_id:
                user_org_ids = {
                    m.organization_id for m in current_user.memberships if m.status == AssignmentStatus.active
                }
                if (
                    doc_in.organization_id not in (study.sponsor_org_id, study.cro_org_id)
                    and doc_in.organization_id not in user_org_ids
                ):
                    raise HTTPException(
                        status_code=http_status.HTTP_403_FORBIDDEN,
                        detail="Access denied: organization does not match authorized study or caller scope",
                    )
            else:
                doc_data["organization_id"] = study.sponsor_org_id

            # Site scope validation
            if doc_in.site_id:
                site = await db.get(Site, doc_in.site_id)
                if not site:
                    raise HTTPException(status_code=404, detail="Site not found")
                ss_stmt = select(StudySite).where(
                    StudySite.study_id == doc_in.study_id, StudySite.site_id == doc_in.site_id
                )
                if not (await db.execute(ss_stmt)).scalars().first():
                    raise HTTPException(
                        status_code=http_status.HTTP_400_BAD_REQUEST,
                        detail="Site is not associated with this study",
                    )

                if team_assignment and team_assignment.site_id is not None and team_assignment.site_id != doc_in.site_id:
                    raise HTTPException(
                        status_code=http_status.HTTP_403_FORBIDDEN,
                        detail="Access denied: site staff cannot upload documents for other sites",
                    )
            elif team_assignment and team_assignment.site_id is not None:
                # If site-level staff doesn't specify site_id, scope to their assigned site
                doc_data["site_id"] = team_assignment.site_id

        elif doc_in.organization_id:
            user_org_ids = {
                m.organization_id
                for m in current_user.memberships
                if m.status == AssignmentStatus.active
                and m.role
                and any(
                    rp.permission and rp.permission.codename in ("documents:upload", "*")
                    for rp in m.role.permissions
                )
            }
            if doc_in.organization_id not in user_org_ids:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: user is not an active member of this organization",
                )
            if doc_in.site_id:
                site = await db.get(Site, doc_in.site_id)
                if not site:
                    raise HTTPException(status_code=404, detail="Site not found")
                if site.organization_id != doc_in.organization_id:
                    raise HTTPException(
                        status_code=http_status.HTTP_400_BAD_REQUEST,
                        detail="Site does not belong to the specified organization",
                    )

        elif doc_in.site_id:
            site = await db.get(Site, doc_in.site_id)
            if not site:
                raise HTTPException(status_code=404, detail="Site not found")
            is_site_auth = False
            for m in current_user.memberships:
                if (
                    m.status == AssignmentStatus.active
                    and m.organization_id == site.organization_id
                    and m.role
                    and any(
                        rp.permission and rp.permission.codename in ("documents:upload", "*")
                        for rp in m.role.permissions
                    )
                ):
                    is_site_auth = True
                    break
            if hasattr(current_user, "study_team_assignments") and current_user.study_team_assignments:
                for a in current_user.study_team_assignments:
                    if (
                        a.site_id == doc_in.site_id
                        and a.assignment_status == AssignmentStatus.active
                        and a.role
                        and any(
                            rp.permission and rp.permission.codename in ("documents:upload", "*")
                            for rp in a.role.permissions
                        )
                    ):
                        is_site_auth = True
                        break
            if not is_site_auth:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: user is not authorized for this site",
                )
            doc_data["organization_id"] = site.organization_id

    doc = Document(
        **doc_data,
        status=DocumentStatus.draft,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    await db.flush()

    changes = doc_data.copy()
    if doc.study_id:
        changes["study_id"] = str(doc.study_id)
    if doc.organization_id:
        changes["organization_id"] = str(doc.organization_id)
    if doc.site_id:
        changes["site_id"] = str(doc.site_id)

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="document.create",
        resource_type="document",
        resource_id=doc.id,
        changes=changes,
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
    if not has_document_permission(current_user, "documents:read"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'documents:read'",
        )

    stmt = select(Document)

    if not is_technical_system_admin(current_user):
        (
            all_studies,
            all_sites,
            all_orgs,
            full_study_ids,
            site_team_pairs,
            conditions,
        ) = await _get_authorized_document_filters(current_user, db)

        if not conditions:
            return []

        # Validate requested study_id
        if study_id:
            if study_id not in all_studies:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: user is not assigned to or authorized for this study",
                )
            if site_id and study_id not in full_study_ids and (study_id, site_id) not in site_team_pairs:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: user is not authorized for this site",
                )

        # Validate requested organization_id
        if organization_id and organization_id not in all_orgs:
            study_orgs_stmt = select(Study.sponsor_org_id, Study.cro_org_id).where(Study.id.in_(all_studies))
            study_org_rows = (await db.execute(study_orgs_stmt)).all()
            study_org_ids = {row[0] for row in study_org_rows} | {row[1] for row in study_org_rows if row[1]}
            if organization_id not in study_org_ids:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: user is not authorized for this organization",
                )

        # Validate requested site_id
        if site_id and site_id not in all_sites:
            ss_stmt = select(StudySite.site_id).where(
                StudySite.study_id.in_(full_study_ids), StudySite.site_id == site_id
            )
            if not (await db.execute(ss_stmt)).scalars().first():
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Access denied: user is not authorized for this site",
                )

        stmt = stmt.where(sa.or_(*conditions))

    # Apply explicit query filters
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
    if not has_document_permission(current_user, "documents:read"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'documents:read'",
        )

    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Document not found")

    if not await is_user_authorized_for_document(current_user, doc, db, permission="documents:read"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Access denied: user is not authorized to access this document",
        )

    return doc


@router.post("/{document_id}/transition", response_model=DocumentRead)
async def transition_document(
    document_id: uuid.UUID,
    transition_in: StatusTransitionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not has_document_permission(current_user, "documents:upload"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Permission denied: missing required permission 'documents:upload'",
        )

    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Document not found")

    if not await is_user_authorized_for_document(current_user, doc, db, permission="documents:upload"):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Access denied: user is not authorized to modify this document",
        )

    try:
        new_status = DocumentStatus(transition_in.new_status)
    except ValueError:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document status: {transition_in.new_status}",
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
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from {doc.status.value} to {new_status.value}",
        )

    if new_status == DocumentStatus.approved:
        if not await can_user_approve_document(current_user, doc, db):
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied: user is not authorized to approve this document",
            )
        doc.approved_by = current_user.id
        doc.approved_at = datetime.datetime.now(datetime.UTC)

    old_status = doc.status
    doc.status = new_status

    changes = {
        "old_status": old_status.value,
        "new_status": new_status.value,
        "notes": transition_in.reason,
    }
    if doc.study_id:
        changes["study_id"] = str(doc.study_id)
    if doc.organization_id:
        changes["organization_id"] = str(doc.organization_id)
    if doc.site_id:
        changes["site_id"] = str(doc.site_id)

    await AuditService.create_audit_log(
        db=db,
        user_id=current_user.id,
        action="document.transition",
        resource_type="document",
        resource_id=doc.id,
        changes=changes,
    )
    await db.commit()
    await db.refresh(doc)
    return doc

