# memory.md

## 1. Current State
- **Project**: AyuCTMS (Clinical Trial Management System — CRO / Sponsor Foundation)
- **Stack**: FastAPI (Backend, Python 3.14 / SQLAlchemy 2.0 Async / Pydantic v2 / Alembic / PyJWT / bcrypt / aiosqlite / pytest) + React 19 (Frontend, Vite 8 / TypeScript 6 / Tailwind CSS v4 / @tanstack/react-query / react-router-dom v7 / Lucide React)
- **Backend Location**: `backend/` directory (`/root/ayu-back/ctms/backend`)
- **Frontend Location**: `frontend/` directory (`/root/ayu-back/ctms/frontend`)
- **Documentation**: 
  - Formal Field Data Dictionary: `docs/CRO_SPONSOR_DATA_DICTIONARY.md` (mapping all 15 business sections & 70+ source fields)
  - ER Model & Conceptual Architecture: `docs/ER_MODEL.md`
  - Authoritative API Contract: `docs/API_CONTRACT.md` & `docs/openapi.json`
- **Database**: Async SQLite / PostgreSQL compatible. Alembic schema migrations (`35f75b6f0684` initial + `dd212c6996cd` super admin & onboarding + `e4a1b2c3d5e6` government verification and site participation) fully verified. Benchmark seed data in `backend/scripts/seed.py`.
- **Status**: 
  - Real App Context Audit & Role-by-Role Browser Discovery: COMPLETED. Master context report in `artifacts/ayuctms-context-audit/AYUCTMS_REAL_APP_CONTEXT.md` (Sections A through O), 8 sub-reports (`environment.md`, `route-inventory.md`, `role-inventory.md`, `permission-matrix.md`, `signup-login-flows.md`, `site-participant-workflow.md`, `runtime-errors.md`, `coverage-gaps.md`), 3 network summaries (`api-endpoints.md`, `network-log.md`, `scoping-rules.md`, `api_audit_dump.json`), 23 page-level reports in `pages/`, and 32 sanitized rendered HTML snapshots in `snapshots/`. Both backend (`http://127.0.0.1:8000`) and frontend (`http://127.0.0.1:5173`) verified healthy and operational. Zero application code or permissions modified.
  - Git & GitHub Sync: Master branch fully synchronized with `origin/master` at commit `1429b53`. All local commits (`0211b8a`, `9b9b449`, `1429b53`) pushed successfully to `https://github.com/NitinBot001/CTMS.git`.
  - Backend: 100% GREEN (140/140 pytest async tests passing, ruff check 0 errors, mypy 0 errors across 56 source files).
  - API Contract: 74 paths synchronized in `docs/openapi.json` and verified by regression test suite.
  - Frontend: 100% GREEN (`npm run verify` passing with 0 errors: oxlint clean, TypeScript compiler `tsc -b` 0 errors, Vite production build clean in 6.7s with optimized assets).
  - Role-Specific Dashboards & Scoped Permissions: Fully implemented across all roles. Dedicated dashboards for Super Admin, Research PI, CRO Operations, Site PI, and safe Access-Pending state.
  - Security Findings F01, F01B, and F02: Fully remediated, verified with 49 dedicated RBAC tests, committed, and pushed.
- **System Changes**: Symlinked `/usr/local/bin/python -> /usr/bin/python3` (Undo: `rm /usr/local/bin/python`) so `python` uses system Python 3.14 with OpenSSL 3.5.5 support instead of Termux binary without `_ssl`.

---

## 2. Decisions
- **Real Application Context & Role Discovery**: Generated authoritative markdown context documentation and sanitized rendered HTML snapshots for downstream AI discussion without modifying application source code or permissions.
- **Role-Dedicated Dashboards & Zero Fabricated Telemetry**: Eliminated shared/generic dashboards that exposed system-wide counts to ordinary users. Ordinary users see only data scoped to their assigned studies and sites. Unassigned or pending users see a safe access-pending state. Global `/portfolio` analytics endpoints protected by `analytics:global` returning `HTTP 403 Forbidden` to non-superadmins.

## 3. Task Log

### 2026-10-10 11:50 — Git Stage, Commit, and GitHub Push

- **What**: Staged, pre-commit secret-scanned, committed all project modifications and new artifacts, and pushed 3 commits (`0211b8a`, `9b9b449`, `1429b53`) to `origin/master` (`https://github.com/NitinBot001/CTMS.git`).
- **Why**: Synchronize the entire codebase—including role-dedicated dashboards, discovery audit artifacts, F01/F01B/F02 security fixes, and cross-platform dev runners—with the remote GitHub repository per user request.
- **How**:
  1. Ran pre-commit secret scan across working directory, git diff, and untracked files for passwords, private keys, API keys, and JWTs (clean).
  2. Verified full backend test suite (`pytest tests/`: 140/140 passed) and frontend verification (`npm run verify`: oxlint clean, tsc clean, vite build clean).
  3. Committed 118 files with structured commit message: `feat: implement role-dedicated workspaces, context audit artifacts, and RBAC security hardening (F01-F02)`.
  4. Executed `git push origin master` via authenticated `gh` credential helper; confirmed fast-forward update `7830b28..1429b53 master -> master`.
- **Result**: Working tree is clean and `master` is completely up-to-date with `origin/master`.
- **Verified by**: `git status` ("Your branch is up to date with 'origin/master'. nothing to commit, working tree clean"), `git branch -vv`.
- **Not verified**: None.
- **Dead ends**: None.
- **Follow-ups**: Ready for subsequent feature or security remediation tasks (e.g., F03 Document/TMF scoping).

### 2026-10-10 10:35 — F02: Secure Audit Trail Authorization

- **What**: Enforced global audit access authorization and multi-attribute study-scoping on `GET /api/v1/audit/logs` and `GET /api/v1/audit/verify`. Prevented cross-tenant data leakage across studies, sites, participants, documents, and system entities.
- **Why**: `GET /api/v1/audit/logs` and `GET /api/v1/audit/verify` previously authenticated callers without authorization or study scoping, allowing ordinary authenticated users and Government Verification Super Admins to retrieve global audit records and probe cryptographic verification across unrelated studies and tenants.
- **How**:
  1. Registered canonical permission `audit:read` (`audit`, `read`) in `CANONICAL_PERMISSIONS` in `backend/app/core/rbac.py`.
  2. Implemented `has_global_audit_permission(user: User) -> bool` and `require_global_audit_access(current_user: User)` in `backend/app/core/auth.py`, strictly requiring technical System Administrator status or explicit `audit:read` role assignment (excluding generic `SuperAdminProfile` bypass).
  3. In `backend/app/api/v1/audit.py`:
     - Applied `require_global_audit_access` to `GET /api/v1/audit/verify` (401 for anonymous, 403 for ordinary users and pure Government Super Admins).
     - In `GET /api/v1/audit/logs`: allowed global queries only for callers with global audit access. For non-global callers, mandated `resource_type` and `resource_id` scoping; verified that requested study, participant, document, or site belongs strictly to the caller's authorized studies (`get_user_study_scope_ids`), returning `HTTP 403 Forbidden` for unrelated studies/participants/sites/system entities or omitted filters.
  4. Created 18 regression tests in `backend/tests/test_audit_rbac.py` verifying anonymous 401s, ordinary user 403s, government super admin 403s, global auditor 200s, study-scoped isolation across dual studies/sites/participants, and scoping bypass protections.
- **Result**: Audit logs are fully protected against unscoped enumeration and cross-study tampering while preserving 21 CFR Part 11 cryptographic hash-chain integrity.
- **Verified by**: `pytest -v -k audit` (20/20 passed in 61.83s), `pytest tests/test_auth_rbac.py tests/test_role_dashboards_rbac.py tests/test_api_endpoints.py -v` (43/43 passed in 102.48s), `ruff check app/ tests/` (0 errors), `mypy app/` (0 errors across 56 files).
- **Not verified**: None.
- **Dead ends**: None.
- **Follow-ups**: Address F03 (Document/TMF authorization) in subsequent task per user instruction.

### 2026-10-10 10:00 — F01B Security Review and Admin-Role Separation

- **What**: Enforced architectural separation between technical System Administrator and Government Verification Super Admin across `backend/app/core/auth.py` and `backend/app/api/v1/users.py`, eliminating unauthorized technical privilege inheritance for Government Verification Super Admins and defending against role creation payload bypasses.
- **Why**: `is_system_admin()` and wildcard permissions (`*`) previously treated active `SuperAdminProfile` as technical administrators, inadvertently exposing technical user directory operations, permission registry enumeration, and role creation to government verification personnel whose mandate is platform verification rather than IT operations.
- **How**:
  1. Added `is_technical_system_admin(user: User) -> bool`, `has_user_manage_permission(user: User) -> bool`, and `require_user_management(current_user: User)` in `backend/app/core/auth.py` strictly checking system-scoped technical role memberships or explicit `user:manage` assignments, excluding `SuperAdminProfile`.
  2. In `backend/app/api/v1/users.py`:
     - Applied `require_user_management` to `GET /api/v1/users` and `GET /api/v1/permissions` (pure Government Super Admins receive `HTTP 403 Forbidden`).
     - In `GET /api/v1/users/{user_id}`: preserved self-lookup for all authenticated users; gated third-party lookup with `has_user_manage_permission` (pure Government Super Admins receive `HTTP 403 Forbidden`).
     - In `POST /api/v1/roles`: gated caller with `require_user_management` and rejected system-level role creation bypass attempts across `scope_level == ScopeLevel.system`, raw payload `is_system_role == True`, and reserved role names (`"System Administrator"`, `"System Admin"`, `"Super Admin"`, etc.) with `HTTP 403 Forbidden` unless the caller is an active technical System Administrator.
     - In `GET /api/v1/roles`: maintained `get_current_user` to support UI role pickers.
  3. Added 6 new regression tests and updated 1 test in `backend/tests/test_auth_rbac.py` (total 31 tests in `test_auth_rbac.py`).
- **Result**: Technical IT administration is cleanly decoupled from Government Verification oversight with robust payload bypass protection.
- **Verified by**: `pytest tests/test_auth_rbac.py tests/test_role_dashboards_rbac.py tests/test_api_endpoints.py -v` (43/43 passed in 110.12s), `ruff check app/ tests/` (0 errors), `mypy app/` (0 errors across 56 files).
- **Not verified**: None.
- **Dead ends**: None.
- **Follow-ups**: Address F02 (Audit trail authorization) in subsequent task per user instruction.

### 2026-10-10 09:35 — F01B: Secure User and Role Management Endpoints

- **What**: Remediated adjacent authorization and privilege escalation vulnerabilities in `backend/app/api/v1/users.py` across `GET /users/{user_id}`, `POST /roles`, `GET /roles`, and `GET /permissions`.
- **Why**: Prevent IDOR data leakage on individual user lookups, prevent unauthorized and privilege-escalating system role creation, and protect internal security permissions from enumeration by unprivileged callers.
- **How**:
  1. `GET /users/{user_id}`: Permitted self-lookup (`current_user.id == user_id`); required `user:manage` or administrative rights for third-party lookup, returning `HTTP 403 Forbidden` to unauthorized ordinary users.
  2. `POST /roles`: Required `require_permission("user:manage")`, and explicitly blocked non-System-Administrators from creating `ScopeLevel.system` roles (preventing privilege escalation).
  3. `GET /permissions`: Restricted to `require_permission("user:manage")`, preventing unauthorized capability enumeration.
  4. `GET /roles`: Preserved authenticated role lookup (`get_current_user`) to support legitimate role selection dropdowns in Study and Organization pages without breaking frontend flows.
  5. Added 15 comprehensive regression tests in `backend/tests/test_auth_rbac.py`.
- **Result**: All user, role, and permission endpoints in `users.py` are strictly protected by least privilege with zero regressions.
- **Verified by**: `pytest tests/test_auth_rbac.py -v` (25/25 passed), `pytest tests/test_auth_rbac.py tests/test_role_dashboards_rbac.py -v` (36/36 passed), `pytest tests/test_api_endpoints.py -v` (1/1 passed).
- **Follow-ups**: Address F02 (Audit Trail authorization) in subsequent task.

### 2026-10-10 09:15 — F01: Protect the User Directory API (GET /api/v1/users)

- **What**: Enforced proper RBAC authorization on `GET /api/v1/users` by replacing the plain `get_current_user` dependency with `require_permission("user:manage")`, registered `user:manage` as a canonical permission in `app/core/rbac.py`, and added comprehensive regression tests.
- **Why**: Prevent unauthorized enumeration of the platform user directory by ordinary authenticated users while preserving legitimate access for administrators and users explicitly granted user-management permissions.
- **How**:
  1. Updated `backend/app/api/v1/users.py` to import `require_permission` and set `current_user: User = Depends(require_permission("user:manage"))`.
  2. Added `user:manage` to `CANONICAL_PERMISSIONS` in `backend/app/core/rbac.py`.
  3. Added 4 focused regression tests and updated unauthenticated assertion in `backend/tests/test_auth_rbac.py` verifying: (1) anonymous request -> 401; (2) ordinary user without `user:manage` -> 403; (3) user with `user:manage` -> 200; (4) System Administrator -> 200; (5) Government Verification Super Admin -> 200.
- **Result**: `GET /api/v1/users` is securely protected. Unauthorized callers receive `HTTP 403 Forbidden` with `"Permission denied: missing required permission 'user:manage'"`.
- **Verified by**: `pytest tests/test_auth_rbac.py -v` (10/10 passed), `pytest tests/test_auth_rbac.py tests/test_role_dashboards_rbac.py -v` (21/21 passed).
- **Follow-ups**: Address F02 (Audit Trail access control) and F03 (Document/TMF scoping) in subsequent tasks upon user instruction.

### 2026-10-10 08:20 — Port Cleanup (8002 & 8003)

- **What**: Identified and terminated processes holding ports 8002 and 8003 (`python -m http.server 8002`, `python -m http.server 8003`, and `nport 8003` tunnel proxy).
- **Why**: User requested freeing ports 8002 and 8003.
- **How**: Identified PIDs 12712, 15181, 23932, 23953, 23954, 23995 via `ps aux` and `/proc/*/cmdline`; sent SIGTERM followed by SIGKILL; verified with socket connection tests.
- **Result**: Both ports 8002 and 8003 are verified closed and free for reuse.
- **Verified by**: Python TCP socket connection test (`connect_ex` returns error 111 / ECONNREFUSED for both ports).

### 2026-10-10 03:30 — Real Application Discovery, Role-by-Role Browser Audit & Context Generation

- **What**: Executed a comprehensive, strictly non-destructive QA and security audit of the live running AyuCTMS application across all supported user roles, routes, and workflows; generated the master context report `AYUCTMS_REAL_APP_CONTEXT.md` (Sections A through O), 8 architectural sub-reports, 3 network reports, 23 page reports in `pages/`, and 32 sanitized rendered HTML snapshots in `snapshots/`.
- **Why**: Provide another AI with an authoritative, grounded, evidence-based context report of the actual application behavior, identifying real UI states, role permissions, routing, and defect areas for strategic discussion without modifying code.
- **How**:
  1. Started backend (`http://127.0.0.1:8000`) and frontend (`http://127.0.0.1:5173`) daemon processes; verified health with HTTP 200.
  2. Inspected `ctms.db` and discovered 5 test accounts (`admin@ayuctms.example`, `admin@ayuctms.gov.in`, `pi.rajesh@aiia.gov.in`, `dr.patel.dbg@gah.edu.in`, `nitinbhujwa@gmail.com`) across 6 canonical roles.
  3. Authenticated all 5 accounts against live REST API endpoints; captured JSON payloads into `network/api_audit_dump.json`.
  4. Executed high-fidelity React 19 SSR DOM rendering engine with JSDOM and QueryClient to generate 32 sanitized HTML snapshots (stripping `<style>`, `<link rel="stylesheet">`, and inline styles while preserving semantic markup, forms, and ARIA labels).
  5. Documented 23 detailed page reports in `pages/` citing exact routes, roles, API endpoints, interactive controls, and observed defects.
  6. Documented network architecture (`api-endpoints.md`, `network-log.md`, `scoping-rules.md`).
  7. Formatted master report `AYUCTMS_REAL_APP_CONTEXT.md` strictly according to Sections A through O with evidence tier labels (`RUNTIME_CONFIRMED`, `API_CONFIRMED`, `SOURCE_CONFIRMED`, etc.).
- **Result**: Complete audit artifact bundle assembled under `artifacts/ayuctms-context-audit/`. All live routes, role scoping, site onboarding, and participant ingestion workflows fully characterized with concrete evidence.
- **Verified by**: `curl http://127.0.0.1:8000/health` (200), `curl http://127.0.0.1:5173/` (200), `python3 audit_network.py` (all endpoints tested across 5 accounts), and `npm run build` (production build verified clean).
- **Not verified**: Live AWS S3 binary uploads (simulated storage keys used in local environment); live email transmission (Resend API key inactive in local dev, fallback logging verified).
- **Follow-ups**: Present the generated context files to the user for downstream AI defect discussion and strategic roadmap planning.

### 2026-10-09 23:15 — Role-Specific Dashboards, Scoped Permissions & Protocol-Driven Site Assignment

- **What**: Eliminated the inappropriate generic dashboard and fabricated telemetry; implemented role-specific operational dashboards (Super Admin Read-Only Overview, Research PI Sponsor Hub, CRO Trial Workspace, Site PI Clinical Workspace, and Access-Pending Safe Restricted State); enforced backend role scoping (`analytics:global` gating `/portfolio`, CRO site assignment restriction); and enforced protocol-driven site-scoped participant validation.
- **Why**: Clinical trial management requires strict role isolation where ordinary researchers and investigators must never view system-wide statistics or cross-tenant data. CROs must not directly activate clinical sites without institutional and government approval, and participants must strictly register only at verified, activated protocol sites.
- **How**:
  1. **Backend Role & Scope Enforcement (`backend/app/core/rbac.py`, `backend/app/api/v1/dashboard.py`, `portfolio.py`, `studies.py`, `participants.py`)**: Gated `/portfolio/*` analytics endpoints with `analytics:global` permission (returning HTTP 403 to non-superadmins). Restricted `POST /studies/{id}/sites` so CROs cannot directly bind sites (HTTP 403). Added `GET /studies/{id}/eligible-sites` for CRO discovery. Added `GET /api/v1/dashboard/summary` resolving the user's role and returning strictly scoped telemetry. Added row-level validated `POST /participants/bulk-import`. Added 11 automated pytest tests in `tests/test_role_dashboards_rbac.py`.
  2. **TypeScript & API Contract Synchronization**: Synchronized OpenAPI specification (74 endpoints in `docs/openapi.json`), regenerated `schema.d.ts`, and updated `frontend/src/types/api.ts` with `SuperAdminOrgItem`, `ParticipantImportItem`, and `ParticipantImportError`.
  3. **Role-Dedicated Frontend Dashboards (`frontend/src/features/dashboard/`, `frontend/src/pages/dashboard/DashboardPage.tsx`)**:
     - `SuperAdminOverviewDashboard`: System-wide read-only oversight displaying registered Sponsors, CROs, study progression, site participation, and an interactive read-only participant inspector modal without any mutating clinical actions.
     - `ResearchPIDashboard`: Focused protocol oversight showing assigned studies, activated sites, team invitation statuses, and upcoming protocol milestones.
     - `CROWorkspaceDashboard`: Operational workspace showing managed trials, an eligible site discovery modal with participation request trigger, and a protocol-validated participant CSV bulk import modal.
     - `SitePIDashboard`: Clinical facility workspace showing active trials at the site, tracked subjects, open adverse events, and an incoming study participation requests queue with independent confirm/decline action.
     - `AccessPendingDashboard`: Safe restricted state rendered when an authenticated user has no assigned active role or pending memberships.
- **Result**: Users now land on their dedicated, authenticated institutional role view with zero exposure to system-wide counts or fabricated cards. All 15 canonical permissions are strictly enforced.
- **Verified by**:
  - `pytest tests/ -v` (backend) → 97 passed in 267.77s (11/11 role dashboard tests, 12/12 contract tests, 20/20 government onboarding tests, 54/54 core domain tests).
  - `ruff check app/ tests/` (backend) → 0 errors.
  - `mypy app/` (backend) → Success: no issues found in 56 source files.
  - `npm run verify` (`oxlint && tsc -b && vite build`) (frontend) → 0 errors, built in 13.51s.
  - Secret scan on git diff → Clean (0 secrets exposed).
- **Files added/modified**: `backend/app/core/rbac.py`, `backend/app/api/v1/dashboard.py`, `backend/app/schemas/dashboard.py`, `backend/tests/test_role_dashboards_rbac.py`, `backend/app/api/v1/portfolio.py`, `backend/app/api/v1/studies.py`, `backend/app/api/v1/participants.py`, `docs/openapi.json`, `frontend/src/api/generated/schema.d.ts`, `frontend/src/types/api.ts`, `frontend/src/api/dashboard.api.ts`, `frontend/src/api/studies.api.ts`, `frontend/src/api/participants.api.ts`, `frontend/src/api/platform.api.ts`, `frontend/src/pages/dashboard/DashboardPage.tsx`, `frontend/src/features/dashboard/index.ts`, `frontend/src/features/dashboard/SuperAdminOverviewDashboard.tsx`, `frontend/src/features/dashboard/ResearchPIDashboard.tsx`, `frontend/src/features/dashboard/CROWorkspaceDashboard.tsx`, `frontend/src/features/dashboard/SitePIDashboard.tsx`, `frontend/src/features/dashboard/AccessPendingDashboard.tsx`, `memory.md`.

### 2026-10-09 20:05 — Concurrent Full-Stack Dev Runners (Bash & Windows) with Clean Lifecycle Management

- **What**: Created unified, concurrent development runner scripts for Linux/macOS/Bash (`run_dev.sh`), Windows Batch (`run_dev.bat`), and Windows PowerShell (`run_dev.ps1`) that start both backend and frontend together and cleanly terminate both on Ctrl+C.
- **Why**: Developer requested a single runner file to start both the FastAPI backend and Vite frontend together and stop both on interrupt without leaving orphan processes holding ports 8000 or 5173.
- **How**:
  1. Built `run_dev.sh` with automatic Python venv / system detection, npm verification, background execution of uvicorn and vite, and POSIX `trap cleanup SIGINT SIGTERM EXIT` killing parent and child worker process trees (`pkill -P`).
  2. Built `run_dev.ps1` using native PowerShell `Start-Process` and `try...finally` with `taskkill /pid ... /f /t` to terminate all descendant processes on Ctrl+C.
  3. Built `run_dev.bat` providing both PowerShell delegation and standalone Command Prompt window title / process tree termination.
  4. Tested `run_dev.sh` live: verified both `http://127.0.0.1:8000/health` (HTTP 200) and `http://localhost:5173/` (HTTP 200) were healthy, followed by cancellation testing proving both ports closed immediately with zero orphan processes.
- **Result**: Developer can start the entire stack with a single command (`./run_dev.sh` on Linux/Mac or `run_dev.bat` / `.\run_dev.ps1` on Windows) and press Ctrl+C to terminate everything cleanly.
- **Verified by**: Live runtime test with curl health checks (200 OK) + kill signal test + process table verification (`ps aux | grep -E "uvicorn|vite"` returned 0 matching processes).

### 2026-10-09 19:50 — Resend API Live Verification & Non-Blocking Delivery Hardening

- **What**: Verified live Resend API email integration configured in root `.env`, hardened `EmailService` against third-party error crashes, and updated test suite isolation.
- **Why**: User configured live `RESEND_API_KEY` in root `.env`. Trial tier restrictions (`onboarding@resend.dev` only sending to registered account owner or `delivered@resend.dev`) and external API failures previously threw unhandled `RuntimeError` (HTTP 500) during dummy email processing.
- **How**:
  1. Updated `Settings` in `backend/app/core/config.py` to automatically load credentials from root `ctms/.env` via `SettingsConfigDict`.
  2. Hardened `EmailService.send_email` in `backend/app/services/email.py` to catch Resend API errors (e.g., 403 unverified recipients, 429 rate limits) and connection exceptions cleanly, returning structured error status instead of raising unhandled `RuntimeError`.
  3. Hardened `PlatformService` provisioning to compute `invitation_sent` accurately from the email dispatch result and always provide `raw_token` upon initial creation.
  4. Isolated automated unit tests in `tests/conftest.py` with `_mock_email_service` to eliminate external network latency and quota burn.
  5. Verified live transactional delivery across all 3 templates (`send_activation_email`, `send_team_invitation_email`, `send_site_participation_request_email`) via Resend API to `delivered@resend.dev`.
- **Result**: Resend integration is 100% active and functioning live. Live message IDs received from Resend: `01a12156-13d8-7b8b-a345-47d6216427f2`, `01a12156-16dc-72bb-a8d4-af84c70686f0`, and `01a12156-19f3-7582-9821-54917f0c4881`.
- **Verified by**: Live Resend API invocation returning HTTP 200 message IDs; 86/86 pytest backend tests passing green; `ruff check app/ tests/` 0 errors; `mypy app/` 0 errors (53 files); diff secret scan clean.
- **Follow-ups**: To send emails to external domains other than `nitinbhujwa@gmail.com` or `delivered@resend.dev`, user should verify a domain in their Resend dashboard and update `RESEND_FROM_EMAIL`.

### 2026-10-09 19:15 — AyuCTMS Government Verification, Super Admin & Research/Site Onboarding Workflow

- **What**: Architected, implemented, verified, and documented the complete three-layer platform access verification and research/site onboarding system with independent dual-approval clinical site study participation.
- **Why**: Clinical research under national governance (AIIA/SIH26046) requires independent verification of research PIs, CRO personnel, and site investigators, with clinical sites activated in studies strictly upon affirmative review by both the Government Verification Team and institutional Site PIs.
- **How**:
  1. **Domain Models & Migrations**: Extended `OnboardingRequest` with entry point classifications (`research_pi`, `cro_staff`, `site_pi`); created `SiteParticipationRequest` with independent `government_status` and `site_status` lifecycle columns; created `TeamMemberVerificationRequest`. Applied and verified Alembic migration `e4a1b2c3d5e6`.
  2. **Email Delivery & Security Abstraction**: Implemented `EmailService` utilizing `httpx` to deliver transactional activation emails through Resend API (`POST https://api.resend.com/emails`) with safe dev logging fallback. Persisted only bcrypt hashes of activation tokens.
  3. **Platform Service & REST Endpoints**: Built `PlatformService` logic for multi-entry tenant provisioning, dual-decision review transitions, atomic `_activate_study_site` execution on dual approval, team member invitation routing, verifier management, and mandatory `first_login_setup`.
  4. **Frontend Architecture & UX**:
     - `RequestAccessPage` (`/request-access`): Tabbed institutional entry point for Research PI, CRO Staff, and Site PI with mandatory declaration consent.
     - `SuperAdminPage` (`/super-admin`): Multi-tab Government Verification dashboard with queues for Access Requests, Team Verifications, Site Study Participations, and Government Verifiers.
     - `StudyDetailPage` (`/studies/:id`): Sites tab updated with dual-approval participation pipeline tracking table and "Request Clinical Site Participation" modal dialog.
     - `SiteDetailPage` (`/sites/:id`): Incoming study participation requests table with Site PI "Review & Respond" modal allowing confirmation or rejection with recorded rationale.
     - `ForcePasswordChangeModal`: First-login profile setup dialog.
  5. **Type Generation & Contract Sync**: Synchronized `docs/openapi.json` (69 paths), generated TypeScript definitions in `schema.d.ts`, updated `docs/API_CONTRACT.md`, and added `.env.example`.
- **Result**: Fully functional, secure, and strongly-typed Government Verification and Dual-Approval Site Participation workflow verified across backend and frontend with zero errors.
- **Verified by**:
  - `pytest tests/ -v` (backend) → `86 passed, 3 warnings in 201s` (20/20 government onboarding tests green, 12/12 contract tests green, 12/12 platform tests green, 42/42 canonical domain tests green).
  - `ruff check app/ tests/` → `All checks passed!` (0 errors).
  - `mypy app/` → `Success: no issues found in 53 source files`.
  - `npm run verify` (frontend) → `0 errors, built in 23.95s` (`oxlint` 0 errors, `tsc -b` 0 errors, Vite production build clean).
- **Files added/modified**: `backend/app/models/enums.py`, `backend/app/models/platform.py`, `backend/app/models/__init__.py`, `backend/alembic/versions/e4a1b2c3d5e6_add_government_verification_and_site_participation.py`, `backend/app/core/config.py`, `backend/app/services/email.py`, `backend/app/services/platform.py`, `backend/app/schemas/platform.py`, `backend/app/api/v1/platform.py`, `backend/tests/test_government_onboarding.py`, `docs/openapi.json`, `docs/API_CONTRACT.md`, `.env.example`, `frontend/src/api/generated/schema.d.ts`, `frontend/src/types/api.ts`, `frontend/src/api/platform.api.ts`, `frontend/src/components/status/statusUtils.ts`, `frontend/src/pages/auth/RequestAccessPage.tsx`, `frontend/src/pages/admin/SuperAdminPage.tsx`, `frontend/src/pages/studies/StudyDetailPage.tsx`, `frontend/src/pages/sites/SiteDetailPage.tsx`, `frontend/src/features/auth/ForcePasswordChangeModal.tsx`, `memory.md`.

### 2026-10-09 17:15 — Super Admin & Controlled Organization Onboarding System

- **What**: Engineered end-to-end Platform Super Admin system and controlled organization onboarding workflow across backend models, services, security boundaries, and React 19 frontend views.
- **Why**: Deliver a platform-governed onboarding architecture where new trial organizations require verification and approval by Platform Super Admins before obtaining workspace access, with zero credentials emailed in plaintext.
- **How**:
  1. **Backend Models & Enums**: Created `SuperAdminProfile`, `InvitationToken`, `OnboardingRequest` models; added `OnboardingRequestStatus` enum and `must_change_password`, `password_changed_at`, `last_login_at` fields to `User`. Added Alembic migration `dd212c6996cd`.
  2. **Platform Service & Security**: Built `PlatformService` with idempotent startup bootstrap (`ensure_super_admin_bootstrapped`), secure bcrypt-hashed activation token generation (rounds=12), atomic multi-record tenant provisioning (`provision_organization_from_request`), and email simulation.
  3. **Platform API Router (`/api/v1/platform`)**: Implemented 8 REST endpoints covering anonymous intake (`POST /platform/onboarding-requests`), Super Admin request directory (`GET /platform/onboarding-requests`), status review state machine (`PATCH .../review`), atomic tenant provisioning (`POST .../approve`), account activation (`POST /platform/activate`), password update (`POST /platform/change-password`), and profile check (`GET /platform/super-admin/me`).
  4. **OpenAPI & Types**: Synchronized `docs/openapi.json` (74 operations across 55 paths) and regenerated frontend types in `src/api/generated/schema.d.ts`.
  5. **Frontend API Client & Context**: Created `platform.api.ts` module; augmented `AuthContext` with `isSuperAdmin` and `mustChangePassword` helpers.
  6. **Security Modals & Public Pages**:
     - `ForcePasswordChangeModal`: Mandatory, undismissable credential update dialog for first-login users.
     - `RequestAccessPage` (`/request-access`): Clean institutional intake form with organizational classifications and contact details. Added entry link on `LoginPage`.
     - `AccountActivationPage` (`/activate`): Token validation, password establishment, and direct link to sign in.
     - `SuperAdminPage` (`/super-admin`): Metrics cards, filter tabs by status, search, interactive review drawer, state transitions, atomic approval trigger, and dev-mode activation link generator with copy button.
     - `Sidebar`: Dynamic Platform Control section for Super Admins.
- **Result**: Fully functioning, securely gated Super Admin & Controlled Onboarding system verified 100% green across both backend and frontend.
- **Verified by**:
  - `pytest tests/ -v` (backend) → `66 passed, 3 warnings in 147.99s` (12/12 platform tests green, 12/12 contract tests green).
  - `ruff check app/ tests/` → `All checks passed!`
  - `mypy app/` → `Success: no issues found in 52 source files`.
  - `npm run verify` (frontend) → `0 errors, built in 10.14s` (`oxlint` 0 errors, `tsc -b` 0 errors, Vite production build clean).
- **Files added/modified**: `backend/app/models/platform.py`, `backend/app/models/user.py`, `backend/app/models/enums.py`, `backend/app/schemas/platform.py`, `backend/app/schemas/user.py`, `backend/app/services/platform.py`, `backend/app/api/v1/platform.py`, `backend/app/api/v1/auth.py`, `backend/tests/test_platform.py`, `backend/tests/test_api_contract.py`, `docs/openapi.json`, `frontend/src/api/platform.api.ts`, `frontend/src/features/auth/ForcePasswordChangeModal.tsx`, `frontend/src/pages/admin/SuperAdminPage.tsx`, `frontend/src/pages/auth/RequestAccessPage.tsx`, `frontend/src/pages/auth/AccountActivationPage.tsx`, `frontend/src/pages/auth/LoginPage.tsx`, `frontend/src/components/navigation/Sidebar.tsx`, `frontend/src/components/layout/AppShell.tsx`, `frontend/src/app/router/AppRouter.tsx`, `memory.md`.

### 2026-10-05 21:15 — Frontend Master Implementation (CRO / Sponsor Foundation)

- **What**: Engineered the complete React 19 + TypeScript + Vite + Tailwind CSS frontend application for the AyuCTMS CRO / Sponsor platform foundation.
- **Why**: Deliver a production-grade clinical trial operations user interface faithfully consuming the frozen and hardened `/api/v1` backend API with zero backend modifications and zero invented endpoints.
- **How**:
  1. **Design System & Primitives**: Built cohesive academic/clinical warm theme (`tokens.ts`, `tokens.css`) using Paper Tint (`#F8F6F2`), Card Ivory (`#FFFFFF`), Border Parchment (`#E4DED3`), Deep Rust (`#7A2A12`), and Ochre (`#B8862E`). Implemented primitives (`Button`, `IconButton`, `ButtonGroup`, `Heading`, `Text`, `Icon` with 50+ Lucide icons and alias registry, `Surface`, `Layout`).
  2. **Feedback & Status Components**: `Alert`, `EmptyState`, `ErrorState`, `LoadingState`, `ProgressBar`, `Skeleton`, `Spinner`, `StatusBadge` (with strict enum colors and badges), `TransitionDialog` (generic dialog driving all entity state machines), and `ErrorBoundary`.
  3. **Overlays & Data Display**: `Card`, `Table`, `DataTable` (generic type-safe table with client search, sort, pagination, and empty states), `Dialog`, `ConfirmDialog`.
  4. **Navigation & Shell**: `Breadcrumb`, `Tabs`, `Sidebar` (collapsible navigation with badge counts and active indicator), `Topbar` (breadcrumbs, connection status, user pill, logout), `AppShell`, `PageHeader`, `PageContainer`.
  5. **API Services Layer (`src/api/`)**: Built strongly typed API modules with axios interceptors and normalized `ApiError` handling: `auth.api.ts`, `organizations.api.ts`, `studies.api.ts`, `sites.api.ts`, `participants.api.ts`, `safety.api.ts`, `compliance.api.ts`, `documents.api.ts`, `portfolio.api.ts`, `audit.api.ts`, `admin.api.ts`.
  6. **Authentication & RBAC**: `AuthProvider` and `ToastProvider`, JWT token persistence in `localStorage`, 401 interception, `ProtectedRoute`, `PermissionGate`, and `LoginForm`.
  7. **Domain Pages & Feature Components**:
     - **Dashboard (`/dashboard`)**: `OverviewKPIs`, `HealthSummaryCard`, `AlertsPanel`, `UpcomingMilestones`, `EnrollmentTrendChart`.
     - **Organizations (`/organizations`, `/organizations/:id`)**: Searchable list, creation modal, detail view with member assignment and onboarding state machine transition.
     - **Studies (`/studies`, `/studies/new`, `/studies/:id`)**: Comprehensive protocol directory, protocol wizard, tabbed detail view (Overview, Milestones, Study Sites, Study Team, Health & Safety) with study and site activation state machine transitions.
     - **Sites (`/sites`, `/sites/:id`)**: Clinical research site directory, facility registration modal, site profile with capabilities and investigator assignment.
     - **Participants (`/participants`, `/participants/:id`)**: Subject screening and enrollment tracker, participant modal, detail view with AE history and lifecycle state transitions (`screened` -> `eligible` -> `randomized` -> `enrolled` -> `active` -> `completed`).
     - **Safety (`/safety`, `/safety/:id`)**: Pharmacovigilance adverse event logger, seriousness criteria, AE status workflow (`open` -> `under_review` -> `closed`).
     - **Compliance (`/compliance`)**: Tabbed management for Institutional Ethics Clearances, Regulatory Submissions, Protocol Deviations, and CAPA Records with status transition workflows.
     - **Documents (`/documents`)**: Electronic Trial Master File (eTMF) register with category filters and lifecycle management (`draft` -> `under_review` -> `approved` -> `archived`).
     - **Audit (`/audit`)**: Immutable electronic audit trail viewer with interactive cryptographic hash-chain and payload digest verification.
     - **Admin (`/admin`)**: User accounts directory, clinical roles, and system permission registry.
- **Result**: Fully functioning, strongly typed React 19 clinical trial management system frontend matching 100% of the API contract.
- **Verified by**:
  - `npm run verify` (`oxlint && tsc -b && vite build`) → `0 errors, built in 8.61s` (`dist/index.html` 0.91 kB, `dist/assets/index-BUFz7F2B.css` 40.90 kB, `dist/assets/index-fgomRQCy.js` 480.77 kB).
  - `pytest tests/ -v` (backend) → `54 passed, 3 warnings in 132.79s`.
  - Zero backend modifications (100% backend preservation).
- **Files added/modified**: `src/styles/*`, `src/lib/*`, `src/types/*`, `src/api/*`, `src/app/*`, `src/components/*`, `src/features/*`, `src/pages/*`, `src/App.tsx`, `package.json`, `vite.config.ts`, `tsconfig.app.json`, `memory.md`.

- **What**: Executed final API contract hardening pass eliminating ambiguity, closing anonymous user registration while maintaining bootstrap initialization, strongly typing milestones and all portfolio endpoints, cleaning nested create schemas, and adding contract regression tests.
- **Why**: Frontend React + TypeScript team requires zero schema ambiguity, strict type safety for OpenAPI client generation, clean URL-derived foreign keys, and ironclad authentication boundaries before UI buildout begins.
- **How**:
  1. **User Creation Security (Approach B)**: Hardened `POST /api/v1/users` in `app/api/v1/users.py` to allow anonymous creation only if `total_users == 0` (first system admin bootstrap). Subsequent anonymous calls are rejected with `HTTP 401 Unauthorized` (`WWW-Authenticate: Bearer`).
  2. **Milestone Response Model**: Created `StudyMilestoneRead` in `app/schemas/study.py` and bound it to `GET /api/v1/studies/{study_id}/milestones` with `response_model=list[StudyMilestoneRead]`.
  3. **Typed Portfolio Schemas**: Created `app/schemas/portfolio.py` with 11 strongly typed Pydantic models (`PortfolioOverviewResponse`, `PortfolioHealthResponse`, `PortfolioAlertItem`, `UpcomingMilestoneItem`, `EnrollmentTrendPoint`, `SiteEnrollmentItem`, `StudyMetricsResponse`, and supporting sub-models). Replaced generic `dict[str, Any]` across all 7 portfolio endpoints in `app/api/v1/portfolio.py`.
  4. **Clean Nested Create Payloads (GAP-01 Resolved)**: Removed `organization_id` from `OrganizationMemberCreate`, and `study_id` from `StudyTeamMemberCreate` and `StudySiteCreate`. Parent foreign keys are now supplied exclusively via URL path parameters.
  5. **OpenAPI Sync**: Regenerated `docs/openapi.json` (48 paths, 94 schemas) reflecting all updated response models and parameter schemas.
  6. **Regression Tests**: Added 6 new contract verification tests in `tests/test_api_contract.py` covering bootstrap user creation, 401 rejection on post-bootstrap anonymous signup, milestone schema validation, portfolio typed schemas, absence of parent foreign keys in create schemas, and absence of `hashed_password` across all response schemas.
  7. **Documentation Updates**: Updated `docs/API_CONTRACT.md` and `docs/API_CONTRACT_GAPS.md` (GAP-01 marked RESOLVED). Documented out-of-band object storage architecture for document binaries.
  8. Kept backend data model, business logic, and frontend code strictly untouched (0 lines changed in frontend).
- **Result**: Fully hardened, 100% typed, authenticated, and verified API contract.
- **Verified by**:
  - `pytest tests/ -v` → `54 passed, 3 warnings in 124.53s`
  - `ruff check app/ tests/` → `All checks passed!`
  - `mypy app/` → `Success: no issues found in 48 source files`
- **Files added/modified**: `backend/app/schemas/portfolio.py` (new), `backend/app/schemas/study.py`, `backend/app/schemas/site.py`, `backend/app/schemas/user.py`, `backend/app/api/v1/portfolio.py`, `backend/app/api/v1/studies.py`, `backend/app/api/v1/users.py`, `backend/tests/test_api_contract.py`, `backend/tests/test_api_endpoints.py`, `docs/API_CONTRACT.md`, `docs/API_CONTRACT_GAPS.md`, `docs/openapi.json`, `memory.md`.

### 2026-10-05 19:05 — API Contract Freeze (Authoritative Specification)

- **What**: Executed full API contract freeze across all 66 backend endpoints (64 `/api/v1` domain endpoints + 2 root/health endpoints).
- **Why**: Frontend React team requires an authoritative, implementation-accurate contract so that no API routes, request bodies, query parameters, enums, or error shapes are guessed or invented.
- **How**:
  1. Exported live OpenAPI 3.1 schema from FastAPI into `docs/openapi.json` (48 paths, 76 schemas).
  2. Created `docs/API_CONTRACT.md` documenting every domain: authentication, RBAC hierarchy, endpoint inventory matrix, request/response models, state machine transitions, enum reference (34 enums), server-controlled vs client-controlled fields, and error shapes.
  3. Created `docs/API_CONTRACT_GAPS.md` documenting 6 specific implementation nuances (nested endpoint foreign keys, flat list responses, compliance list filtering, binary storage delegation).
  4. Added `backend/tests/test_api_contract.py` (6 tests) verifying all 66 routes in OpenAPI, disk schema sync, 401 on anonymous access to protected routes, 422 error detail structure, and 400 rejection on illegal state transitions.
  5. Kept backend business model and frontend code strictly untouched (0 lines changed in frontend).
- **Result**: Fully frozen, authoritative API contract ready for React 19 frontend consumption.
- **Verified by**:
  - `pytest tests/ -v` → `48 passed, 3 warnings in 117.49s`
  - `ruff check app/ tests/` → `All checks passed!`
  - `mypy app/` → `Success: no issues found in 47 source files`
- **Files added/modified**: `docs/API_CONTRACT.md`, `docs/openapi.json`, `docs/API_CONTRACT_GAPS.md`, `backend/tests/test_api_contract.py`, `memory.md`.

### 2026-10-05 18:29 — Backend Security Final Check

- **What**: Full password-storage security audit + remediation + regression tests + route security sweep.
- **Why**: Audit requirement: verify passwords use argon2id/bcrypt (data dictionary), no SHA-256, no plaintext, no SYSTEM_USER_ID, all endpoints authenticated.
- **How**:
  1. **Critical find**: `app/core/security.py` was using `hashlib.sha256` with a weak static salt prefix (`"ayu_ctms_"`) — not a KDF, fails the data dictionary specification of argon2id/bcrypt.
  2. **Fix**: Replaced with `bcrypt.hashpw` / `bcrypt.checkpw` (work factor 12, random per-password salt via `bcrypt.gensalt(rounds=12)`). `bcrypt 5.0.0` installed in venv, added `bcrypt>=4.0.0` to `requirements.txt`. Removed `SALT_PREFIX` constant and `hashlib` import entirely.
  3. **Secondary find**: `GET /api/v1/audit/verify` had no authentication dependency — any unauthenticated caller could query audit chain integrity. Fixed: added `current_user: User = Depends(get_current_user)`.
  4. **Regression tests**: Created `tests/test_password_security.py` (16 tests) covering: bcrypt format assertion, not-plaintext, not-SHA-256 (with all legacy salt variants), per-call uniqueness, OWASP-min cost factor, verify correct/wrong/empty/case/legacy-SHA-256/malformed, $2b$ identifier, library round-trip. Session-scoped conftest patch uses rounds=4 for test speed; a dedicated test re-imports fresh module to verify production constant is >= 12.
  5. Updated `tests/test_audit_chain.py` to pass `auth_headers` to the now-protected `/audit/verify` calls.
- **Route security sweep result**: All 9 domain routers (organizations, studies, sites, participants, users, audit, documents, compliance, safety, portfolio) use `get_current_user` or `require_study_access` on every business endpoint. No SYSTEM_USER_ID in production code. Audit actor always comes from `current_user.id`.
- **No plaintext passwords logged/returned/stored**: login endpoint returns only JWT token, `UserRead` schema excludes `hashed_password`, no logging of passwords anywhere.
- **Result**: 42/42 tests pass, ruff 0 errors, mypy 0 errors. SHA-256 hashing is fully eliminated.
- **Verified by**:
  - `pytest tests/ -v` → `42 passed in 100.68s`
  - `ruff check app/ tests/` → `All checks passed!`
  - `mypy app/` → `Success: no issues found in 47 source files`
- **Not verified**: Production database migration of existing SHA-256 hashed passwords (none exist — this is a greenfield project).
- **Files changed**: `app/core/security.py`, `requirements.txt`, `app/api/v1/audit.py`, `tests/test_password_security.py` (new), `tests/test_audit_chain.py`, `tests/conftest.py`.

### 2026-10-05 18:10
- **What**: Completed full remediation of all audit defects identified in the CRO/Sponsor backend foundation while preserving the canonical data model.
- **Why**: Audit identified stubbed Alembic migration, hardcoded `SYSTEM_USER_ID`, lack of real JWT authentication, unvalidated audit payload digests, missing lifecycle state transitions for compliance/sites, and missing composite portfolio endpoints.
- **How**:
  1. Replaced stubbed Alembic migration `35f75b6f0684` with complete 521-line schema covering all 20 tables; fixed `env.py` to support dynamic test DB URLs; created `tests/test_migration.py` verifying full roundtrip upgrade/downgrade.
  2. Implemented PyJWT authentication (`app/core/security.py`, `app/core/auth.py`, `app/api/v1/auth.py`) with login/me endpoints and RBAC/study-scoping dependencies.
  3. Replaced hardcoded `SYSTEM_USER_ID` across all 9 domain routers with authenticated `current_user.id`.
  4. Implemented canonical audit serialization with UTC microsecond formatting and two-phase verification (chain links + payload hash checks).
  5. Implemented transition endpoints and state validation for Study Sites, Ethics Approvals, Regulatory Submissions, Protocol Deviations, and CAPA records.
  6. Added `/api/v1/portfolio/health`, `/alerts`, `/milestones/upcoming`, `/enrollment/trend`, and `/studies/{id}/enrollment/by-site`.
  7. Fixed model constraints in tests (`protocol_number`, `therapeutic_area`, `participant_id` in SAE fixtures).
- **Result**: Fully remediated, hardened, production-ready CRO/Sponsor backend foundation.
- **Verified by**:
  - `pytest -v` — 25/25 passed [100%].
  - `ruff check /root/ayu-back/ctms/backend` — 0 errors.
  - `mypy /root/ayu-back/ctms/backend/app` — Success: no issues found in 47 source files.
  - `python backend/scripts/seed.py` — Database seeded successfully with benchmark data.
- **Follow-ups**: Ready for frontend integration and operational eCRF/monitoring module development.

### 2026-10-05 16:48
- **What**: Added `backend/requirements.txt`, created `backend/run.py` server runner, diagnosed and fixed Python SSL environment issue, and verified backend dev server execution.
- **Why**: User reported that backend server was not running and `requirements.txt` was missing.
- **How**:
  1. Identified root cause: `which python` was resolving to Termux binary without `_ssl` support (`ModuleNotFoundError: No module named '_ssl'`), which prevented Uvicorn from starting.
  2. Fixed system path resolution by symlinking `/usr/local/bin/python -> /usr/bin/python3` (which has full OpenSSL 3.5.5).
  3. Created `backend/requirements.txt` pinned with core FastAPI, SQLAlchemy, Alembic, Pydantic, aiosqlite, asyncpg, and pytest dependencies.
  4. Rebuilt `backend/.venv` using system `python3` and installed all requirements cleanly.
  5. Built `backend/run.py` convenience script with auto-reload, path resolution, and console banner.
  6. Verified backend runtime: `pytest` (10/10 passed in 21s), `curl http://127.0.0.1:8000/health` (HTTP 200 OK), `/api/v1/portfolio/overview` (valid derived JSON), and `/docs` (HTTP 200 OK).
- **Result**: Backend server runs out of the box via `python run.py` or `python -m uvicorn app.main:app --reload`.
- **Verified by**: curl tests against live local server, 10/10 pytest async tests green, and clean process termination.
- **Follow-ups**: None.

### 2026-10-05 16:35
- **What**: Created comprehensive master `README.md` at root documenting the entire CTMS architecture, getting started guides, and living documentation protocol.
- **Why**: User requested keeping code on `master` branch and adding a master README.md to be iteratively maintained as the codebase grows.
- **How**: Authored `/root/ayu-back/ctms/README.md` including technology badges, institutional background (AIIA), architecture diagram, directory layout, 9 core domain descriptions, backend/frontend setup, database migration/seeding instructions, 21 CFR Part 11 cryptographic audit trail details, and test execution commands.
- **Result**: Complete master documentation ready for developers, reviewers, and ongoing project maintenance.
- **Verified by**: File created and reviewed, git status tracking confirmed.
- **Follow-ups**: Update README sections as new CTMS operational domains (eCRF, monitoring visits, randomisation) are developed.

### 2026-10-05 16:00
- **What**: Built the complete CRO/Sponsor backend foundation for AyuCTMS following strict DATA-MODEL-FIRST principles.
- **Why**: User requested the senior backend architect design and implementation for the CRO/Sponsor platform encompassing 10+ business domains and 31 structural sections.
- **How**: Authored `docs/CRO_SPONSOR_DATA_DICTIONARY.md` and `docs/ER_MODEL.md`. Implemented SQLAlchemy 2.0 async models, Pydantic v2 schemas, business service state machines, audit trail, REST APIs, Alembic config, seed data, and initial test suite.
- **Result**: Complete normalized CRO/Sponsor backend foundation.
- **Verified by**: 10 tests green, ruff 0 errors.
- **Follow-ups**: Remediate identified backend gaps.
