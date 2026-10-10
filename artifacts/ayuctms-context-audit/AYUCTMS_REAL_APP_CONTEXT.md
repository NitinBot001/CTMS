# AyuCTMS — Real Application Discovery, Role-by-Role Browser Audit & Context Generation

**Auditor:** Senior QA Engineer, Application Security Reviewer & Frontend Systems Analyst  
**Audit Target:** AyuCTMS Clinical Trial Management System (SIH26046 / AIIA)  
**Execution Context:** Linux 4.19 (Android Termux proot `aarch64`), Python 3.14.4, Node.js v24.21.0, FastAPI, React 19, SQLite (`aiosqlite`)  
**Audit Directory:** [`artifacts/ayuctms-context-audit/`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/)  
**Date of Audit:** October 10, 2026  
**Audit Integrity:** Strictly Non-Destructive. Zero application files or permissions modified. Redacted secrets.

---

## Table of Contents
1. [Section A: Executive Summary & Audit Methodology](#section-a-executive-summary--audit-methodology)
2. [Section B: Discovered Roles & Access Matrix](#section-b-discovered-roles--access-matrix)
3. [Section C: Discovered Route Inventory](#section-c-discovered-route-inventory)
4. [Section D: Test Accounts, Authentication & Password Policy](#section-d-test-accounts-authentication--password-policy)
5. [Section E: Role-Specific Dashboards Audit](#section-e-role-specific-dashboards-audit)
6. [Section F: Organizations & Controlled Onboarding Flow Audit](#section-f-organizations--controlled-onboarding-flow-audit)
7. [Section G: Clinical Studies & Protocol Management Audit](#section-g-clinical-studies--protocol-management-audit)
8. [Section H: Sites & Protocol-Driven Site Assignment Audit](#section-h-sites--protocol-driven-site-assignment-audit)
9. [Section I: Participants & Patient Management Audit](#section-i-participants--patient-management-audit)
10. [Section J: Safety, Adverse Events & Pharmacovigilance Audit](#section-j-safety-adverse-events--pharmacovigilance-audit)
11. [Section K: Compliance, Ethics & Regulatory Audit](#section-k-compliance-ethics--regulatory-audit)
12. [Section L: Documents & Trial Master File (eTMF) Audit](#section-l-documents--trial-master-file-etmf-audit)
13. [Section M: System Audit Logs & Audit Trail Audit](#section-m-system-audit-logs--audit-trail-audit)
14. [Section N: Interactive Modals & Edge States](#section-n-interactive-modals--edge-states)
15. [Section O: Discovered UI Defects, Inconsistencies & Security Observations](#section-o-discovered-ui-defects-inconsistencies--security-observations)

---

## Section A: Executive Summary & Audit Methodology

### 1. Executive Summary
This audit provides an evidence-based discovery of the running AyuCTMS application. AyuCTMS is a dedicated Clinical Trial Management System designed for Ayurvedic research, supporting multi-tenant institutional operations between Government Verification Teams (Super Admin), Academic Sponsors (e.g., AIIA), Contract Research Organizations (CROs), and Clinical Research Sites (Hospitals & Medical Colleges).

During this audit, both the backend (FastAPI on `http://127.0.0.1:8000`) and frontend (Vite/React 19 on `http://127.0.0.1:5173`) were executed concurrently in live runtime. All 5 discovered database user accounts were authenticated, their live API interactions captured, and 32 sanitized HTML snapshots generated across all supported screens and modal dialogues.

### 2. Evidence Classification Hierarchy
Every finding, workflow description, and defect reported herein is categorized according to strict evidence tiers:
- **`RUNTIME_CONFIRMED`**: Directly observed in the live running application via active HTTP traffic, terminal execution, or rendered DOM state.
- **`API_CONFIRMED`**: Formally validated via direct REST API calls and JSON schema responses.
- **`SOURCE_CONFIRMED`**: Verified by direct static code analysis of backend route handlers, models, migrations, or React components.
- **`INFERRED`**: Deduced logically from architecture patterns and relational database structures.
- **`NOT_TESTED`**: Existing in codebase but unverified due to mock services (e.g. live S3 bucket or external email dispatch).
- **`BLOCKED`**: Incapable of execution in the current environment due to technical or infrastructure limits.

---

## Section B: Discovered Roles & Access Matrix

### 1. Roles Discovered in Database (`RUNTIME_CONFIRMED`)
Inspection of `backend/ctms.db` revealed 6 canonical roles and 1 special platform profile:
1. **Platform Super Admin (`SuperAdminProfile`)**: Government Verification Team member with platform-level read-only oversight across all organizations and atomic provisioning authority.
2. **System Administrator (`ScopeLevel.system`)**: Platform infrastructure maintenance role holding wildcard `*` permissions.
3. **Principal Investigator (`ScopeLevel.study`)**: Protocol delivery lead responsible for trial conduct at study or sponsor scope.
4. **CRO Lead Monitor (`ScopeLevel.organization`)**: Multi-center trial coordinator managing site discovery, contracts, and protocol execution.
5. **Clinical Research Associate (`ScopeLevel.organization`)**: Field monitor responsible for site visits and participant data verification.
6. **Site Principal Investigator (`ScopeLevel.site`)**: Institutional head at a hospital/clinic with site acceptance authority.
7. **Site Coordinator (`ScopeLevel.site`)**: Subject visit coordinator and clinical data entry personnel.

### 2. Canonical Permissions Matrix (`SOURCE_CONFIRMED`)
16 canonical permissions exist in `app/core/rbac.py`:
`organizations:read`, `studies:read`, `studies:create`, `studies:update`, `participants:read`, `participants:import`, `participants:assign`, `sites:read`, `study_sites:request`, `study_sites:approve`, `study_teams:manage`, `documents:read`, `documents:upload`, `audit:read`, `user:manage`, and `*`.

---

## Section C: Discovered Route Inventory

The application defines 25 distinct frontend routes in `frontend/src/app/router/AppRouter.tsx`:

- **Public Routes:**
  - `/login` — User authentication portal ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/login.html))
  - `/request-access` — Institutional onboarding application ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/request-access.html))
  - `/activate` — Account invitation token activation ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/activate.html))
- **Protected Core Routes (wrapped in `AppShell`):**
  - `/dashboard` — Dynamic dispatch based on resolved role:
    - Super Admin Overview ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-super-admin.html))
    - Research PI Hub ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-research-pi.html))
    - CRO Operations Workspace ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-cro-workspace.html))
    - Site PI Console ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-site-pi.html))
    - Access Pending ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-access-pending.html))
  - `/organizations` & `/organizations/:id` — Institutional directories ([Snapshots](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/organizations.html))
  - `/studies`, `/studies/new` & `/studies/:id` — Protocol workspaces ([Snapshots](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/studies.html))
  - `/sites` & `/sites/:id` — Research facilities ([Snapshots](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/sites.html))
  - `/participants` & `/participants/:id` — Subject directories ([Snapshots](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/participants.html))
  - `/safety` & `/safety/:id` — Pharmacovigilance ([Snapshots](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/safety.html))
  - `/compliance` — Ethics & CAPA ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/compliance.html))
  - `/documents` — Trial Master Files ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/documents.html))
  - `/audit` — Cryptographic Audit Trail ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/audit.html))
  - `/admin` — Access Control ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/admin.html))
  - `/super-admin` — Platform Control Console ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/super-admin-overview.html))
  - `*` — Not Found ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/not-found.html))

---

## Section D: Test Accounts, Authentication & Password Policy

### 1. Test Accounts Verified (`RUNTIME_CONFIRMED`)
All 5 accounts in `backend/ctms.db` were authenticated and evaluated against the backend API:
1. `admin@ayuctms.example` (Nitin Bhujwa): Platform Super Admin. Resolves to `super_admin`.
2. `admin@ayuctms.gov.in` (AyuCTMS System Administrator): System Admin. Resolves to `unassigned`.
3. `pi.rajesh@aiia.gov.in` (Dr. Rajesh Sharma): Assigned to Study `AYU-CT-2026-001` and Site `SITE-DEL-01`. Resolves to `site_pi`.
4. `dr.patel.dbg@gah.edu.in` (Dr. Patel): Site PI at GAH. Resolves to `site_pi`.
5. `nitinbhujwa@gmail.com` (Nitin Bhujwa): Clinical Research Associate at Rewa ayu collage (CRO). Resolves to `cro`.

### 2. Password Security Policy (`API_CONFIRMED`)
- Bcrypt hashing with 12 rounds.
- Passwords must be at least 8 characters.
- Column `users.must_change_password`: When `True`, the `AppShell` immediately renders the blocking `ForcePasswordChangeModal`. The user is prohibited from navigating to operational pages until they set a permanent password.

---

## Section E: Role-Specific Dashboards Audit

The legacy generic dashboard has been completely eliminated. `GET /api/v1/dashboard/summary` dispatches to tailored data builders:

1. **Super Admin Overview Dashboard:**
   - **Characteristics:** Read-only cross-organizational oversight. Displays total sponsors (1), total CROs (3), total active studies (2), and total participants (15). Operational buttons (such as enrolling participants or adding sites) are intentionally absent.
2. **Research PI Hub Dashboard:**
   - **Characteristics:** Focuses on protocol delivery. Displays assigned studies, participating site count, pending team verifications, and upcoming study milestones.
3. **CRO Trial Operations Workspace Dashboard:**
   - **Characteristics:** Contracted protocols, eligible accredited site counts (3), pending site requests, and participant counts. Provides actionable triggers: "Discover & Invite Sites" and "Bulk Ingest Participants".
4. **Clinical Research Site Console Dashboard:**
   - **Characteristics:** Displays site code (`SITE-DEL-01`), institutional facility name, incoming CRO protocol requests, and active local subjects. Features an institutional review and confirmation modal.
5. **Access Pending Dashboard:**
   - **Characteristics:** Safe default when role is unassigned. Completely suppresses telemetry and operational links.

---

## Section F: Organizations & Controlled Onboarding Flow Audit

### 1. Onboarding Pipeline (`RUNTIME_CONFIRMED`)
- Public applicants submit requests via `POST /api/v1/platform/onboarding-requests`.
- Requests enter status `pending`.
- Super Admin reviews applications via `PATCH .../review` (transitions: `under_review`, `changes_requested`, `rejected`).
- Upon approval, `POST .../approve` executes an atomic database transaction:
  1. Creates `Organization` record.
  2. Creates initial Admin `User` (status: `inactive`, `must_change_password = True`).
  3. Creates `OrganizationMember` linkage.
  4. Generates a 32-byte cryptographic `InvitationToken` (stored as SHA-256 hash).
  5. Updates `OnboardingRequest` to `approved` and records provisioned IDs.

---

## Section G: Clinical Studies & Protocol Management Audit

### 1. Protocols in System (`RUNTIME_CONFIRMED`)
- **`AYU-CT-2026-001`**: Multi-Center Randomized Trial on Ashwagandha Formulation for Cognitive Health (Phase II, Interventional, CTRI Registered, 15 subjects enrolled).
- **`AYU-CT-2026-004`**: Curcumin Metabolic Study (Phase I, Approved).

### 2. Scoping Enforcement
- Sponsor PIs only view studies sponsored by their institution.
- CROs only view studies contracted to their organization (`cro_org_id`).
- Site PIs only view studies activated at their specific clinical facility.

---

## Section H: Sites & Protocol-Driven Site Assignment Audit

### 1. Approval-Based Site Linkage (`RUNTIME_CONFIRMED`)
Sites are **never** attached to studies directly without institutional agreement:
1. CRO discovers accredited site via `GET /api/v1/studies/{id}/eligible-sites`.
2. CRO submits invitation via `POST /api/v1/platform/site-participation-requests`.
3. Site PI reviews invitation in their Site Console and submits formal institutional decision via `POST .../site-decision` (`approved` / `rejected`).
4. Only upon approval is a `StudySite` record activated.

---

## Section I: Participants & Patient Management Audit

### 1. Zero-PII Policy (`RUNTIME_CONFIRMED`)
- AyuCTMS strictly enforces pseudonymization. No patient names, phone numbers, Aadhaar numbers, or addresses are stored.
- Subjects are identified exclusively by protocol codes (e.g. `ASH-DEL-001` to `ASH-DEL-015`).

### 2. Bulk Ingestion (`API_CONFIRMED`)
- Enforced via `POST /api/v1/participants/bulk-import`.
- Requires an active, approved `StudySite` linkage.
- Accepts batch CSV data with validation on duplicate participant codes and valid screening dates.

---

## Section J: Safety, Adverse Events & Pharmacovigilance Audit

- Pharmacovigilance repository mounted at `/api/v1/safety/adverse-events`.
- Captures event terms, onset dates, severity (`mild`, `moderate`, `severe`, `life_threatening`), seriousness criteria (SAE), and causality assessments.
- SAE reports highlight regulatory notification timelines (24 hours to Ethics Committee / DCGI / Ministry of Ayush).

---

## Section K: Compliance, Ethics & Regulatory Audit

- Tracks Ethics Committee (EC) approvals, registration numbers, and re-approvals.
- Manages Protocol Deviations categorized as `minor`, `major`, or `critical`.
- Manages Corrective and Preventive Action (CAPA) records with root cause analysis and completion deadlines.

---

## Section L: Documents & Trial Master File (eTMF) Audit

- Electronic Trial Master File metadata repository mounted at `/api/v1/documents`.
- Manages protocol versions, Investigator Brochures (IB), Informed Consent Forms (ICF), and monitoring visit logs.
- Stores storage keys (`s3://...`) and SHA-256 file hashes for document integrity.

---

## Section M: System Audit Logs & Audit Trail Audit

- Append-only cryptographic audit trail mounted at `/api/v1/audit/logs`.
- Records actor user ID, action timestamp, action type (e.g. `organization.create`, `study.transition`), target resource, and JSON delta payload.
- No deletion or modification endpoint exists for audit logs.

---

## Section N: Interactive Modals & Edge States

Snapshots generated for all interactive overlays:
1. **Force Password Change Modal** ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/modal-force-password-change.html))
2. **Site Discovery & Invitation Dialog** ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/modal-site-discovery.html))
3. **Participant Bulk CSV Import Dialog** ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/modal-participant-import.html))
4. **Institutional Protocol Confirmation Dialog** ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/modal-institutional-confirmation.html))
5. **Adverse Event Reporting Modal** ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/modal-adverse-event.html))
6. **Organization Registration Modal** ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/modal-organization.html))
7. **Clinical Site Registration Modal** ([Snapshot](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/modal-site.html))

---

## Section O: Discovered UI Defects, Inconsistencies & Security Observations

### Defect 1: System Administrator Account Falls Through to Unassigned Dashboard
- **Observed:** `admin@ayuctms.gov.in` has role `System Administrator`, but calling `/api/v1/dashboard/summary` returns `{"role": "unassigned"}`.
- **Cause:** The dashboard role resolver in `rbac.py` only checks `SuperAdminProfile` and `OrganizationMember`. Because this account holds neither, it is incorrectly directed to the `AccessPendingDashboard`.
- **Severity:** Medium (UX / Routing defect).

### Defect 2: Site PI Precedence Overrides Sponsor Research PI
- **Observed:** In seed data, Dr. Rajesh Sharma (`pi.rajesh@aiia.gov.in`) was assigned both a Study PI role and a site linkage (`SITE-DEL-01`). The backend resolver classifies him as `site_pi` rather than `research_pi`.
- **Cause:** In `resolve_user_role`, `if a.site_id is not None: return "site_pi"` takes precedence over the study investigator role check.
- **Severity:** Low (Seed data / Role priority conflict).

### Defect 3: React SSR Hydration `NaN` Warning
- **Observed:** In `SuperAdminOverviewDashboard`, if a study has `planned_sample_size` of 0 or undefined, calculating enrollment percentage evaluates to `NaN`, logging `Received NaN for the children attribute`.
- **Severity:** Low (Cosmetic warning).

### Defect 4: Inconsistent Safety Endpoint Path
- **Observed:** The safety backend router is mounted at `/api/v1/safety/adverse-events`. Probing `/api/v1/safety` returns HTTP 404 Not Found.
- **Severity:** Low (API contract clarity).

### Defect 5: Unvalidated Public Email Domains
- **Observed:** `/request-access` allows generic webmail domains (`gmail.com`, `yahoo.com`). Institutional onboarding should mandate official corporate/university email domains.
- **Severity:** Medium (Security / Verification hygiene).

---

## Sub-Report Directory Index
- [Host Environment Details](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/environment.md)
- [Route Inventory](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/route-inventory.md)
- [Role Inventory](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/role-inventory.md)
- [Permission Matrix](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/permission-matrix.md)
- [Signup & Login Flows](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/signup-login-flows.md)
- [Site & Participant Workflows](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/site-participant-workflow.md)
- [Runtime Errors & Console Logs](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/runtime-errors.md)
- [Test Coverage Gaps](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/coverage-gaps.md)
- [API Endpoints Catalog](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/network/api-endpoints.md)
- [Multi-Role Network Log](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/network/network-log.md)
- [Scoping & Multi-Tenancy Rules](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/network/scoping-rules.md)
