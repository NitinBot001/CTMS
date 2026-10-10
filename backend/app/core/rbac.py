from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import AssignmentStatus, OrganizationType, ScopeLevel
from app.models.organization import OrganizationMember
from app.models.site import Site
from app.models.study import Study, StudyTeamMember
from app.models.user import Permission, Role, RolePermission, User

# Canonical platform permissions
CANONICAL_PERMISSIONS: list[dict[str, str]] = [
    {
        "codename": "organizations:read",
        "resource": "organizations",
        "action": "read",
        "description": "View organizations in authorized scope",
    },
    {
        "codename": "studies:read",
        "resource": "studies",
        "action": "read",
        "description": "View assigned clinical studies",
    },
    {
        "codename": "studies:create",
        "resource": "studies",
        "action": "create",
        "description": "Create clinical trial studies",
    },
    {
        "codename": "studies:update",
        "resource": "studies",
        "action": "update",
        "description": "Edit authorized clinical trial studies",
    },
    {
        "codename": "participants:read",
        "resource": "participants",
        "action": "read",
        "description": "View participants within authorized scope",
    },
    {
        "codename": "participants:import",
        "resource": "participants",
        "action": "import",
        "description": "Bulk import participants into approved study sites",
    },
    {
        "codename": "participants:assign",
        "resource": "participants",
        "action": "assign",
        "description": "Assign or transition participant status",
    },
    {
        "codename": "sites:read",
        "resource": "sites",
        "action": "read",
        "description": "View clinical research sites",
    },
    {
        "codename": "study_sites:request",
        "resource": "study_sites",
        "action": "request",
        "description": "Request study site association",
    },
    {
        "codename": "study_sites:approve",
        "resource": "study_sites",
        "action": "approve",
        "description": "Approve or confirm site participation",
    },
    {
        "codename": "study_teams:manage",
        "resource": "study_teams",
        "action": "manage",
        "description": "Invite and manage study team members",
    },
    {
        "codename": "documents:read",
        "resource": "documents",
        "action": "read",
        "description": "Read trial master files and study documents",
    },
    {
        "codename": "documents:upload",
        "resource": "documents",
        "action": "upload",
        "description": "Upload study documents",
    },
    {
        "codename": "government:verify",
        "resource": "government",
        "action": "verify",
        "description": "Perform government platform verification",
    },
    {
        "codename": "analytics:global",
        "resource": "analytics",
        "action": "global",
        "description": "View global cross-platform operational analytics",
    },
    {
        "codename": "user:manage",
        "resource": "users",
        "action": "manage",
        "description": "Manage platform user accounts and permissions",
    },
    {
        "codename": "audit:read",
        "resource": "audit",
        "action": "read",
        "description": "Inspect cryptographic audit trail",
    },
]

ROLE_PERMISSION_MAPPING: dict[str, list[str]] = {
    "System Administrator": [p["codename"] for p in CANONICAL_PERMISSIONS],
    "Principal Investigator": [
        "organizations:read",
        "studies:read",
        "studies:create",
        "studies:update",
        "participants:read",
        "sites:read",
        "study_teams:manage",
        "documents:read",
        "documents:upload",
    ],
    "CRO Lead Monitor": [
        "organizations:read",
        "studies:read",
        "participants:read",
        "participants:import",
        "participants:assign",
        "sites:read",
        "study_sites:request",
        "documents:read",
        "documents:upload",
    ],
    "Clinical Research Associate": [
        "studies:read",
        "participants:read",
        "participants:import",
        "participants:assign",
        "sites:read",
        "study_sites:request",
        "documents:read",
        "documents:upload",
    ],
    "Site Principal Investigator": [
        "studies:read",
        "participants:read",
        "participants:assign",
        "study_sites:approve",
        "documents:read",
        "documents:upload",
    ],
    "Site Coordinator": [
        "studies:read",
        "participants:read",
        "participants:assign",
        "documents:read",
    ],
}


async def seed_rbac_permissions_and_roles(db: AsyncSession) -> None:
    """Idempotently seeds all canonical permissions and maps them to standard roles."""
    # 1. Seed permissions
    perm_stmt = select(Permission)
    existing_perms = {p.codename: p for p in (await db.execute(perm_stmt)).scalars().all()}

    for perm_data in CANONICAL_PERMISSIONS:
        if perm_data["codename"] not in existing_perms:
            p = Permission(
                codename=perm_data["codename"],
                resource=perm_data["resource"],
                action=perm_data["action"],
                description=perm_data["description"],
            )
            db.add(p)
            existing_perms[perm_data["codename"]] = p

    await db.flush()

    # 2. Seed roles & role-permissions
    role_stmt = select(Role)
    existing_roles = {r.name: r for r in (await db.execute(role_stmt)).scalars().all()}

    role_meta = {
        "System Administrator": (ScopeLevel.system, True),
        "Principal Investigator": (ScopeLevel.study, True),
        "CRO Lead Monitor": (ScopeLevel.organization, True),
        "Clinical Research Associate": (ScopeLevel.organization, True),
        "Site Principal Investigator": (ScopeLevel.site, True),
        "Site Coordinator": (ScopeLevel.site, True),
    }

    # Query all existing RolePermissions directly
    rp_stmt = select(RolePermission)
    existing_rps = (await db.execute(rp_stmt)).scalars().all()
    role_perm_map: dict[uuid.UUID, set[uuid.UUID]] = {}
    for rp in existing_rps:
        role_perm_map.setdefault(rp.role_id, set()).add(rp.permission_id)

    for role_name, perm_codenames in ROLE_PERMISSION_MAPPING.items():
        role = existing_roles.get(role_name)
        if not role:
            scope, is_sys = role_meta.get(role_name, (ScopeLevel.organization, False))
            role = Role(
                name=role_name,
                scope_level=scope,
                is_system_role=is_sys,
                description=f"Standard role: {role_name}",
            )
            db.add(role)
            await db.flush()
            existing_roles[role_name] = role

        # Check existing assigned permission IDs from role_perm_map
        assigned_perm_ids = role_perm_map.setdefault(role.id, set())

        for codename in perm_codenames:
            perm_obj = existing_perms.get(codename)
            if perm_obj and perm_obj.id not in assigned_perm_ids:
                rp_new = RolePermission(role_id=role.id, permission_id=perm_obj.id)
                db.add(rp_new)
                assigned_perm_ids.add(perm_obj.id)

    await db.flush()


async def resolve_user_role(user: User, db: AsyncSession) -> str:
    """
    Resolves the primary clinical institutional role for the authenticated user.
    Returns: 'super_admin' | 'cro' | 'research_pi' | 'site_pi' | 'unassigned'
    """
    from app.services.platform import PlatformService

    if await PlatformService.is_super_admin(user, db):
        return "super_admin"

    # Check organization memberships with eager loaded organization and role
    stmt_memberships = (
        select(OrganizationMember)
        .options(
            selectinload(OrganizationMember.organization),
            selectinload(OrganizationMember.role),
        )
        .where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.status == AssignmentStatus.active,
        )
    )
    memberships = (await db.execute(stmt_memberships)).scalars().all()

    for m in memberships:
        if not m.organization:
            continue

        org_type = m.organization.organization_type
        role_name = m.role.name.lower() if m.role else ""

        if org_type in [OrganizationType.institution, OrganizationType.site_affiliate] or "site" in role_name:
            return "site_pi"
        if org_type == OrganizationType.cro or "cro" in role_name or "cra" in role_name:
            return "cro"
        if org_type == OrganizationType.sponsor or "principal investigator" in role_name or "research" in role_name:
            return "research_pi"

    # Check study team assignments
    stmt_team = (
        select(StudyTeamMember)
        .options(
            selectinload(StudyTeamMember.role),
        )
        .where(
            StudyTeamMember.user_id == user.id,
            StudyTeamMember.assignment_status == AssignmentStatus.active,
        )
    )
    assignments = (await db.execute(stmt_team)).scalars().all()
    for a in assignments:
        if a.site_id is not None:
            return "site_pi"
        role_name = a.role.name.lower() if a.role else ""
        if "investigator" in role_name or "research" in role_name:
            return "research_pi"
        if "cro" in role_name or "cra" in role_name:
            return "cro"

    return "unassigned"


async def get_user_accessible_study_ids(user: User, db: AsyncSession) -> set[uuid.UUID] | None:
    """
    Returns set of Study IDs accessible to the user based on organization membership
    and study team assignments. Returns None if the user has platform-wide access (Super Admin).
    """
    from app.services.platform import PlatformService

    if await PlatformService.is_super_admin(user, db):
        return None

    # Check memberships from database
    stmt_memberships = (
        select(OrganizationMember)
        .options(
            selectinload(OrganizationMember.role),
        )
        .where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.status == AssignmentStatus.active,
        )
    )
    memberships = (await db.execute(stmt_memberships)).scalars().all()

    for m in memberships:
        if m.role and m.role.is_system_role and m.role.scope_level == ScopeLevel.system:
            return None

    user_org_ids = [m.organization_id for m in memberships]

    accessible_ids: set[uuid.UUID] = set()

    # Studies where user's org is sponsor or CRO
    if user_org_ids:
        org_studies_stmt = select(Study.id).where(
            (Study.sponsor_org_id.in_(user_org_ids)) | (Study.cro_org_id.in_(user_org_ids))
        )
        for sid in (await db.execute(org_studies_stmt)).scalars().all():
            accessible_ids.add(sid)

    # Studies where user is explicit team member
    team_stmt = select(StudyTeamMember.study_id).where(
        StudyTeamMember.user_id == user.id,
        StudyTeamMember.assignment_status == AssignmentStatus.active,
    )
    for sid in (await db.execute(team_stmt)).scalars().all():
        accessible_ids.add(sid)

    return accessible_ids


async def get_user_accessible_site_ids(user: User, db: AsyncSession) -> set[uuid.UUID] | None:
    """
    Returns set of Site IDs accessible to the user based on site affiliation
    and study team assignments. Returns None if Super Admin.
    """
    from app.services.platform import PlatformService

    if await PlatformService.is_super_admin(user, db):
        return None

    stmt_memberships = (
        select(OrganizationMember)
        .options(
            selectinload(OrganizationMember.role),
        )
        .where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.status == AssignmentStatus.active,
        )
    )
    memberships = (await db.execute(stmt_memberships)).scalars().all()

    for m in memberships:
        if m.role and m.role.is_system_role and m.role.scope_level == ScopeLevel.system:
            return None

    user_org_ids = [m.organization_id for m in memberships]

    accessible_site_ids: set[uuid.UUID] = set()

    # Sites belonging to user's org
    if user_org_ids:
        site_stmt = select(Site.id).where(Site.organization_id.in_(user_org_ids))
        for sid in (await db.execute(site_stmt)).scalars().all():
            accessible_site_ids.add(sid)

    # Sites where user is team member
    team_stmt = select(StudyTeamMember.site_id).where(
        StudyTeamMember.user_id == user.id,
        StudyTeamMember.site_id.is_not(None),
        StudyTeamMember.assignment_status == AssignmentStatus.active,
    )
    for member_site_id in (await db.execute(team_stmt)).scalars().all():
        if member_site_id is not None:
            accessible_site_ids.add(member_site_id)

    return accessible_site_ids
