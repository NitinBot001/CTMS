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
  - Backend: 100% GREEN (86/86 pytest async tests passing in 201s, ruff check 0 errors, mypy 0 errors across 53 source files).
  - API Contract: 69 paths synchronized in `docs/openapi.json` and verified by regression test suite.
  - Frontend: 100% GREEN (`npm run verify` passing with 0 errors: oxlint clean, TypeScript compiler `tsc -b` 0 errors, Vite production build clean in 24s with optimized assets).
  - Government Verification & Dual-Approval Onboarding: Fully implemented across Layer A (Government Verifiers / Super Admin), Layer B (Research PI / CRO Staff), and Layer C (Site PI / Clinical Sites). Independent dual-approval site participation pipeline with government approval + site PI confirmation gating study site activation. Public intake (`/request-access`), token activation (`/activate`), mandatory first-login profile setup (`ForcePasswordChangeModal`), Government Verification Dashboard (`/super-admin`), Study Detail participation pipeline (`/studies/:id`), and Site Detail incoming requests queue (`/sites/:id`).
- **System Changes**: Symlinked `/usr/local/bin/python -> /usr/bin/python3` (Undo: `rm /usr/local/bin/python`) so `python` uses system Python 3.14 with OpenSSL 3.5.5 support instead of Termux binary without `_ssl`.

---

## 2. Decisions
- **Three-Tier Institutional Governance Model**: Separates platform authority into Layer A (Government Verification Team / Platform Super Admin), Layer B (Research PI / CRO-Side Research Team), and Layer C (Site PI / Institution and Site Personnel).
- **Independent Dual-Approval Site Study Participation**: Neither Government approval alone nor Site PI confirmation alone activates `StudySite`. Both must be affirmative (`status="approved"`). Atomically provisions/activates `StudySite` with `activation_status="activated"` only when both decisions are recorded.
- **Strict Authorization & Self-Review Prevention**: Reviewers cannot evaluate their own onboarding requests. Research PIs cannot confirm site study participation requests; site responses are strictly gated by site institution authorization (`403 Forbidden` for non-site personnel).
- **Single-Use Cryptographic Invitation Tokens with Email Delivery**: Tokens generated via `secrets.token_urlsafe(32)`, stored exclusively as bcrypt hashes (work factor 12) in `invitation_tokens`, with HTTP email delivery through Resend API (`EmailService`) and safe dev fallback when `RESEND_API_KEY` is not set.
- **Mandatory First-Login Profile & Credential Setup**: First-time login for provisioned administrators and super admins enforces password change and profile completion (`full_name`, `phone`) via `FirstLoginSetupRequest`.
- **Platform Super Admin & Controlled Onboarding Gate**: Public organizations do not automatically gain access. New applicants submit through `/request-access`. Super Admin reviews applicants through a multi-stage state machine (`pending` -> `under_review` -> `changes_requested` / `rejected` / `approved`). Approval triggers an atomic transaction creating the organization, initial admin user, organization membership, and cryptographic invitation token.
- **Strict Token & Password Security**: Raw invitation tokens are never stored in the database. Instead, only bcrypt hashes (work factor 12) are persisted. First-time login enforces mandatory password reset (`must_change_password: bool`) via `ForcePasswordChangeModal` before user can interact with the app.
- **Idempotent Super Admin Bootstrap**: Initial super admin is provisioned on FastAPI startup via `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_BOOTSTRAP_PASSWORD` environment variables without duplicate records or persistent plaintext passwords.
- **Strict Implementation Fidelity to Backend API Contract**: Frontend consumes exact `/api/v1` routes and schemas derived from `docs/openapi.json`. Zero invented endpoints, parameters, or synthetic envelopes. Direct array collections consumed without artificial wrapping. State transitions use `POST .../transition` with `{ new_status: string, reason?: string | null }`.
- **Clinical Design System Tokens (Academic/Editorial Warm Palette)**: Standardized on Paper Tint (`#F8F6F2`), Card Ivory (`#FFFFFF`), Border Parchment (`#E4DED3`), Header Deep Rust (`#7A2A12`), Accent Ochre (`#B8862E`), Text Charcoal (`#1C1A17`), and Muted Slate (`#726B5C`), with standard status colors for clinical workflows.
- **Full Separation of Concerns & Deep Componentization**: Zero monolithic files. Features structured into Primitives (`Button`, `Icon`, `Typography`, `Surface`, `Layout`), Feedback (`Alert`, `EmptyState`, `ErrorState`, `LoadingState`, `ProgressBar`, `Skeleton`, `Spinner`, `StatusBadge`, `TransitionDialog`), Overlays (`Dialog`, `ConfirmDialog`), Data Display (`Card`, `Table`, `DataTable`), Navigation (`Breadcrumb`, `Tabs`, `Sidebar`, `Topbar`), Domain Modals (`OrganizationModal`, `SiteModal`, `ParticipantModal`, `AdverseEventModal`), and Domain Pages.
- **Client-Side Cryptographic Verification UX**: Interactive dual-phase audit verification tool in `/audit` with live block-chain continuity and payload hash inspection.
- **API Contract Hardening & Bootstrap Protection (Approach B)**: Hardened `POST /api/v1/users` to allow unauthenticated account creation strictly during initial platform initialization (`total_users == 0`). Once any user exists, anonymous requests are rejected with `HTTP 401 Unauthorized` (`WWW-Authenticate: Bearer`). Normal user provisioning requires authenticated context. Sensitive password hashes are guaranteed absent from all API schemas.
- **Clean Nested Resource Derivation (GAP-01 Resolution)**: Eliminated redundant parent foreign keys from child create payloads (`OrganizationMemberCreate`, `StudyTeamMemberCreate`, `StudySiteCreate`). Parent IDs derive exclusively from URL path parameters.
- **Deterministic Typed Analytics Schemas**: Added explicit Pydantic response models for milestone queries (`StudyMilestoneRead`) and all 7 portfolio analytics endpoints (`PortfolioOverviewResponse`, `PortfolioHealthResponse`, `PortfolioAlertItem`, etc.), eliminating untyped dictionaries and guaranteeing typed client generation.
- **API Contract Freeze & Zero Guesswork Policy**: Created authoritative `docs/API_CONTRACT.md` and exported native `docs/openapi.json` from the live FastAPI app. Discrepancies between source dictionary and endpoint schemas documented in `docs/API_CONTRACT_GAPS.md`.
- **Data-Model-First Foundation**: Designed full field-level data dictionary and entity-relationship models before building CRUD or APIs.
- **Reproducible Migration Architecture**: `35f75b6f0684_initial_cro_sponsor_schema.py` defines all 20 canonical tables, foreign keys, unique constraints, and indexes. Verified via programmatic upgrade -> downgrade -> upgrade tests on blank databases.
- **Production-Grade PyJWT & RBAC**: Real JWT bearer token authentication with role-based and multi-tenant scoping dependencies (`require_permission`, `require_organization_access`, `require_study_access`). Hardcoded system user IDs eliminated.
- **Cryptographic Audit Trail with Canonical Payload Verification**: Dual-phase tamper detection in `/api/v1/audit/verify` verifying both hash-chain continuity and canonical payload digest integrity (ISO-8601 UTC microsecond normalization).
- **Derived Portfolio Analytics**: Composite health indices (Green/Amber/Red risk levels), actionable alerts, milestone schedules, enrollment trends, and site breakdowns computed on the fly with zero stored redundant counters.
- **Controlled Lifecycle State Machines**: Onboarding, Study, Study Site Activation, Ethics Approvals, Regulatory Submissions, Protocol Deviations, and CAPA Records strictly enforce allowed transition graphs and audit state changes.

---

## 3. Task Log

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
