# AyuCTMS Comprehensive Permission Matrix

- **Evidence Category:** `SOURCE_CONFIRMED` & `API_CONFIRMED`
- **Authoritative Source:** `backend/app/core/rbac.py`

---

## 1. Canonical Permission Definitions

| Permission Codename | Resource | Action | Description |
|---|---|---|---|
| `organizations:read` | `organizations` | `read` | View organizations in authorized scope |
| `studies:read` | `studies` | `read` | View assigned clinical studies |
| `studies:create` | `studies` | `create` | Create clinical trial studies |
| `studies:update` | `studies` | `update` | Edit authorized clinical trial studies |
| `participants:read` | `participants` | `read` | View participants within authorized scope |
| `participants:import` | `participants` | `import` | Bulk import participants into approved study sites |
| `participants:assign` | `participants` | `assign` | Assign or transition participant status |
| `sites:read` | `sites` | `read` | View registered clinical trial sites |
| `study_sites:request` | `study_sites` | `request` | Request site participation in study (CRO) |
| `study_sites:approve` | `study_sites` | `approve` | Approve/accept site participation request (Site PI) |
| `study_teams:manage` | `study_teams` | `manage` | Manage study team members and staff |
| `documents:read` | `documents` | `read` | Access trial master file documents |
| `documents:upload` | `documents` | `upload` | Upload regulatory and trial documents |
| `audit:read` | `audit` | `read` | Inspect cryptographic audit trail |
| `user:manage` | `users` | `manage` | Manage user accounts and credentials |
| `*` (Wildcard) | `*` | `*` | Full unrestricted platform administration |

---

## 2. Role-to-Permission Mapping Matrix

| Permission Codename | Super Admin | System Admin | Principal Investigator | CRO Lead Monitor | Clinical Research Assoc | Site Principal Investigator | Site Coordinator |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `*` (Wildcard) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `organizations:read` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `studies:read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `studies:create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `studies:update` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `participants:read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `participants:import` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `participants:assign` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `sites:read` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `study_sites:request` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `study_sites:approve` | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `study_teams:manage` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `documents:read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `documents:upload` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `audit:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `user:manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `platform:super_admin` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Enforcement Layers

1. **FastAPI Route Dependencies (`app/core/auth.py`):**
   - `require_permission(permission_name)`
   - `require_study_access()`
   - `require_organization_access()`
   - `require_super_admin()`
2. **Database Query Level:**
   - Filters statements using `WHERE studies.id IN (accessible_study_ids)`
   - Denies cross-tenant participant visibility.
3. **Frontend UI Rendering:**
   - Sidebar filters items based on `userPermissions.includes(item.permission)`.
   - Modals and action buttons check permission flags before rendering.
