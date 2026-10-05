# memory.md

## 1. Current State
- **Project**: AyuCTMS (Clinical Trial Management System — CRO / Sponsor Foundation)
- **Stack**: FastAPI (Backend, Python 3.14 / SQLAlchemy 2.0 Async / Pydantic v2 / Alembic / PyJWT / aiosqlite / pytest) + React 19 (Frontend, Vite 8 / TypeScript 6 / Tailwind CSS v4)
- **Backend Location**: `backend/` directory (`/root/ayu-back/ctms/backend`)
- **Frontend Location**: `frontend/` directory (`/root/ayu-back/ctms/frontend`)
- **Documentation**: 
  - Formal Field Data Dictionary: `docs/CRO_SPONSOR_DATA_DICTIONARY.md` (mapping all 15 business sections & 70+ source fields)
  - ER Model & Conceptual Architecture: `docs/ER_MODEL.md`
- **Database**: Async SQLite / PostgreSQL compatible. Alembic initial schema migration `35f75b6f0684` fully verified for reproducibility from empty DB. Benchmark seed data in `backend/scripts/seed.py`.
- **Status**: 
  - Backend: 100% GREEN (25/25 pytest async tests passing in 66s, ruff check 0 errors, mypy 0 errors across 47 files).
  - Frontend: 100% GREEN (`npm run verify` passing, oxlint 0 warnings/errors, Vite production build passing).
- **System Changes**: Symlinked `/usr/local/bin/python -> /usr/bin/python3` (Undo: `rm /usr/local/bin/python`) so `python` uses system Python 3.14 with OpenSSL 3.5.5 support instead of Termux binary without `_ssl`.

---

## 2. Decisions
- **Data-Model-First Foundation**: Designed full field-level data dictionary and entity-relationship models before building CRUD or APIs.
- **Reproducible Migration Architecture**: `35f75b6f0684_initial_cro_sponsor_schema.py` defines all 20 canonical tables, foreign keys, unique constraints, and indexes. Verified via programmatic upgrade -> downgrade -> upgrade tests on blank databases.
- **Production-Grade PyJWT & RBAC**: Real JWT bearer token authentication with role-based and multi-tenant scoping dependencies (`require_permission`, `require_organization_access`, `require_study_access`). Hardcoded system user IDs eliminated.
- **Cryptographic Audit Trail with Canonical Payload Verification**: Dual-phase tamper detection in `/api/v1/audit/verify` verifying both hash-chain continuity and canonical payload digest integrity (ISO-8601 UTC microsecond normalization).
- **Derived Portfolio Analytics**: Composite health indices (Green/Amber/Red risk levels), actionable alerts, milestone schedules, enrollment trends, and site breakdowns computed on the fly with zero stored redundant counters.
- **Controlled Lifecycle State Machines**: Onboarding, Study, Study Site Activation, Ethics Approvals, Regulatory Submissions, Protocol Deviations, and CAPA Records strictly enforce allowed transition graphs and audit state changes.

---

## 3. Task Log

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
