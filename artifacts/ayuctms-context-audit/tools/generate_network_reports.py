#!/usr/bin/env python3
import json
from pathlib import Path

NETWORK_DIR = Path("/root/ayu-back/ctms/artifacts/ayuctms-context-audit/network")
DUMP_FILE = NETWORK_DIR / "api_audit_dump.json"

with open(DUMP_FILE, "r") as f:
    audit_data = json.load(f)

# 1. API Endpoints Catalog
endpoints_md = """# AyuCTMS Discovered Backend API Endpoints & Contracts

- **Base URL:** `http://127.0.0.1:8000`
- **API Prefix:** `/api/v1`
- **Protocol:** HTTP/1.1 JSON REST
- **Authentication:** HTTP Bearer JSON Web Token (JWT)

---

## 1. Core Platform Endpoints (Observed in Real Runtime)

| Method | Endpoint Path | Tag | Auth Required | Supported Roles | Scoping Mechanism |
|---|---|---|---|---|---|
| `GET` | `/health` | Health | No | Anonymous | Platform health probe |
| `POST` | `/api/v1/auth/login` | Authentication | No | Anonymous | Issues 24-hr Bearer JWT |
| `GET` | `/api/v1/dashboard/summary` | Role Dashboards | Yes | All Authenticated | Resolves role (`super_admin`, `research_pi`, `cro`, `site_pi`, `unassigned`) and returns strict role-scoped telemetry |
| `GET` | `/api/v1/organizations` | Organizations | Yes | All Authenticated | Returns registered research organizations, sponsors, CROs, institutes |
| `POST` | `/api/v1/organizations` | Organizations | Yes | Admin / Super Admin | Registers new sponsor or CRO organization |
| `GET` | `/api/v1/organizations/{id}` | Organizations | Yes | Org Members / Admin | Institutional details and accreditation numbers |
| `GET` | `/api/v1/studies` | Studies | Yes | Study / Org Scoped | Filtered by user's sponsor, CRO, or study team assignments |
| `POST` | `/api/v1/studies` | Studies | Yes | Sponsor PI / Admin | Registers new protocol with CTRI details |
| `GET` | `/api/v1/studies/{id}` | Studies | Yes | Assigned Team / Admin | Comprehensive protocol synopsis and participating sites |
| `GET` | `/api/v1/sites` | Sites | Yes | All Authenticated | Inventory of clinical sites across the country |
| `POST` | `/api/v1/sites` | Sites | Yes | Site Admin / Admin | Registers new clinical facility |
| `GET` | `/api/v1/sites/{id}` | Sites | Yes | All Authenticated | Facility metadata and Ethics Committee status |
| `GET` | `/api/v1/participants` | Participants | Yes | Site / Study Scoped | Pseudonymized subject registry; strictly scoped by study & site |
| `POST` | `/api/v1/participants/bulk-import` | Participants | Yes | CRO / Site PI | Batch ingestion of CSV participant records into approved sites |
| `GET` | `/api/v1/safety/adverse-events` | Safety | Yes | Study / Site Scoped | Pharmacovigilance and Adverse Event registry |
| `POST` | `/api/v1/safety/adverse-events` | Safety | Yes | Site PI / Monitor | Reports new AE / SAE with severity and causality |
| `GET` | `/api/v1/compliance/capa` | Compliance | Yes | QA / Compliance | CAPA root-cause and corrective action workflows |
| `GET` | `/api/v1/documents` | Documents | Yes | Study / Site Scoped | Electronic Trial Master File (eTMF) metadata repository |
| `GET` | `/api/v1/audit/logs` | Audit | Yes | Super Admin / Auditor | Tamper-evident cryptographic audit log |
| `GET` | `/api/v1/users` | Users | Yes | System Admin (`user:manage`) | Platform user directory |
| `POST` | `/api/v1/platform/onboarding-requests` | Onboarding | No | Public / Anonymous | Submits new organization access request |
| `GET` | `/api/v1/platform/onboarding-requests` | Onboarding | Yes | Super Admin Only | Returns all pending institutional onboarding applications |
| `POST` | `/api/v1/platform/onboarding-requests/{id}/approve` | Onboarding | Yes | Super Admin Only | Idempotently provisions Organization + Admin User + Invitation Token |
| `POST` | `/api/v1/platform/activate` | Onboarding | No | Anonymous with Token | Consumes invitation token and establishes permanent credentials |
| `GET` | `/api/v1/platform/super-admin/me` | Platform | Yes | Super Admin Only | Verifies active SuperAdminProfile status |

---
"""

with open(NETWORK_DIR / "api-endpoints.md", "w") as f:
    f.write(endpoints_md)

# 2. Network Log across all test accounts
network_log_md = """# AyuCTMS Multi-Role Runtime Network Interaction Log

This log captures real HTTP interactions performed against the live backend (`http://127.0.0.1:8000`) across all five test accounts discovered in `ctms.db`.

---
"""

for acc in audit_data:
    network_log_md += f"""## Account: `{acc['account']}` ({acc['name']})

| Endpoint | Method | HTTP Status | Result / Sample Data |
|---|---|---|---|
"""
    for ep in acc['endpoints']:
        status_badge = f"**{ep['status']}**" if ep['status'] == 200 else f"<span style='color:red'>{ep['status']}</span>"
        desc = ep.get('error') or f"Count: {ep.get('count', 1)}"
        network_log_md += f"| `{ep['endpoint']}` | `{ep['method']}` | {status_badge} | {desc} |\n"
    network_log_md += "\n---\n\n"

with open(NETWORK_DIR / "network-log.md", "w") as f:
    f.write(network_log_md)

# 3. Scoping Rules
scoping_rules_md = """# AyuCTMS Permission Scoping & Multi-Tenant Isolation Rules

- **Evidence Category:** `RUNTIME_CONFIRMED` & `SOURCE_CONFIRMED`
- **Authoritative Files:** `backend/app/core/rbac.py`, `backend/app/api/v1/dashboard.py`

---

## 1. Scoping Hierarchy

AyuCTMS operates under a 4-tier scope hierarchy:

1. **Platform Scope (`ScopeLevel.system` / Super Admin)**:
   - Super Admin profile (`SuperAdminProfile.is_active = True`) bypasses organization and study restrictions for read-only telemetry.
   - Cross-organizational visibility across all Sponsors, CROs, and active Protocols.
   - Governed by `PlatformService.is_super_admin()`.

2. **Organization Scope (`ScopeLevel.organization` / Sponsor or CRO)**:
   - Scoped to studies where the user's organization is registered as `sponsor_org_id` or `cro_org_id`.
   - CRO users can discover accredited sites and issue `SiteParticipationRequest` invitations.

3. **Study Scope (`ScopeLevel.study` / Principal Investigator)**:
   - Scoped to specific clinical trials where the user holds an active assignment in `study_team_members`.
   - Access to protocol documents, milestones, and participant rollups for that protocol.

4. **Site Scope (`ScopeLevel.site` / Site PI & Coordinator)**:
   - Scoped to the specific facility (`site_id`) where the investigator conducts the trial.
   - Site PIs receive incoming protocol participation invitations and hold decision authority (`approved` / `declined`).
   - Participant records are strictly partitioned by `site_id`.

---

## 2. Dynamic Dashboard Role Resolution Algorithm (`resolve_user_role`)

When a user requests `GET /api/v1/dashboard/summary`, the backend executes the following resolution ladder:

```
[1. Super Admin Check] -> Does user have active SuperAdminProfile?
     YES -> "super_admin" (Returns read-only cross-org overview)
     NO  -> Continue

[2. Organization Membership Check] -> Active OrganizationMember records:
     - If org_type in [institution, site_affiliate] or role contains "site" -> "site_pi"
     - If org_type == cro or role contains "cro" / "cra" -> "cro"
     - If org_type == sponsor or role contains "principal investigator" / "research" -> "research_pi"
     - Otherwise continue

[3. Study Team Assignment Check] -> Active StudyTeamMember records:
     - If assignment has site_id is not None -> "site_pi"
     - If role contains "investigator" or "research" -> "research_pi"
     - If role contains "cro" or "cra" -> "cro"
     - Otherwise continue

[4. Fallback] -> "unassigned" (Renders AccessPendingDashboard, hides telemetry)
```

---

## 3. Discovered Scoping Observations

1. **System Admin (`admin@ayuctms.gov.in`) Fallback:**
   The `admin@ayuctms.gov.in` account has role `System Administrator` (system scope) in the database, but does NOT hold a `SuperAdminProfile` or an `OrganizationMember` row. Consequently, it falls through to `"unassigned"`, rendering the Access Pending restricted screen.
2. **Site PI Precedence:**
   In `study_team_members`, if a PI has a non-null `site_id` attached, the resolver categorizes them as `"site_pi"` rather than `"research_pi"`.
3. **CRO Workspace Scoping:**
   CRO users only see studies where their organization ID matches `studies.cro_org_id`. If contracted studies = 0, the workspace displays the empty state with site discovery readiness.
"""

with open(NETWORK_DIR / "scoping-rules.md", "w") as f:
    f.write(scoping_rules_md)

print("Generated network reports in artifacts/ayuctms-context-audit/network/")
