# AyuCTMS — Clinical Trial Management System (CRO & Sponsor Platform)

[![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![License: Confidential](https://img.shields.io/badge/License-Confidential-red.svg)](#)

> **SIH26046 AIIA Clinical Trial Management System**  
> Developed for the **All India Institute of Ayurveda (AIIA)** to provide an institutional, data-model-first CRO/Sponsor management platform for Ayurvedic and integrative clinical research.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture & Design Principles](#-architecture--design-principles)
- [Repository Structure](#-repository-structure)
- [Core Functional Domains](#-core-functional-domains)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (FastAPI)](#backend-setup-fastapi)
  - [Frontend Setup (React + Vite)](#frontend-setup-react--vite)
- [Database Migrations & Seeding](#-database-migrations--seeding)
- [Cryptographic Audit Trail (21 CFR Part 11)](#-cryptographic-audit-trail-21-cfr-part-11)
- [Verification & Testing](#-verification--testing)
- [API Documentation](#-api-documentation)
- [Living Documentation Protocol](#-living-documentation-protocol)

---

## 🌟 Overview

AyuCTMS establishes an enterprise-grade backend and web frontend foundation to plan, manage, monitor, and audit clinical trials conducted under Ayurvedic and modern institutional protocols. 

Unlike conventional generic project trackers, AyuCTMS is **strictly data-model-first**:
1. Every business metric (site count, actual enrollment, delayed studies) is dynamically calculated from canonical database records.
2. Every lifecycle transition follows a strict, state-machine validated workflow.
3. Every mutating event is immutably logged into a SHA-256 hash-chained cryptographic audit ledger.

---

## 🏛️ Architecture & Design Principles

```
                    ┌──────────────────────────────────────────────┐
                    │     React 19 + Tailwind CSS v4 Frontend      │
                    │         (Vite 8 SPA / TypeScript 6)          │
                    └──────────────────────┬───────────────────────┘
                                           │ REST API (JSON)
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │             FastAPI Backend (v1)             │
                    │   Routers: /api/v1/{domain} + Swagger Docs   │
                    └──────────────────────┬───────────────────────┘
                                           │
                    ┌──────────────────────┴───────────────────────┐
                    │              Service & Logic Layer           │
                    │   - State Machines (Onboarding, Study, etc.) │
                    │   - Hash-Chained Audit Trail (SHA-256)       │
                    │   - Dynamic Portfolio KPI Aggregator         │
                    └──────────────────────┬───────────────────────┘
                                           │
                    ┌──────────────────────┴───────────────────────┐
                    │          SQLAlchemy 2.0 Async ORM            │
                    │  (Alembic Migrations / SQLite & PostgreSQL)  │
                    └──────────────────────────────────────────────┘
```

1. **Normalized Master Data**: CROs, Sponsors, and Institutions are modeled as canonical `organizations` records with controlled classification types. Studies reference `sponsor_org_id` and `cro_org_id` foreign keys (no loose string representations).
2. **Zero Redundant Counters**: Portfolio metrics (`total_studies`, `active_studies`, `delayed_studies`, `actual_enrollment`, `site_count`) are derived directly via SQL aggregation functions on canonical rows.
3. **Rigid State Machines**: Onboarding (`draft` ➔ `submitted` ➔ `under_review` ➔ `approved`/`rejected`/`returned`) and Study lifecycles (`draft` ➔ `planned` ➔ `active` ➔ `suspended`/`completed`/`terminated`) prevent invalid out-of-order jumps.
4. **Multi-Centric Trial Topology**: Normalized `sites` directory with a junction `study_sites` table enforcing uniqueness on `(study_id, site_id)` to handle investigator assignments and site-level milestone tracking.

---

## 📂 Repository Structure

```text
ctms/
├── README.md                      # Project master documentation (Living Document)
├── memory.md                      # Persistent AI agent session log & architectural decisions
├── docs/                          # Architecture & Data Models
│   ├── CRO_SPONSOR_DATA_DICTIONARY.md # 70+ fields mapped across 15 business domains
│   └── ER_MODEL.md                # Entity-Relationship diagram & state machine flowcharts
├── backend/                       # FastAPI Async Backend Application
│   ├── alembic/                   # Alembic async migration environment
│   │   └── versions/              # Database migration version scripts
│   ├── app/
│   │   ├── api/v1/                # Modular REST API v1 domain endpoints
│   │   │   ├── audit.py           # Audit ledger and tamper verification endpoints
│   │   │   ├── compliance.py      # Ethics approvals, deviations, and CAPA
│   │   │   ├── documents.py       # Regulatory & operational document management
│   │   │   ├── organizations.py   # Organization master data & onboarding
│   │   │   ├── participants.py    # Participant enrollment & lifecycle
│   │   │   ├── portfolio.py       # Dynamic portfolio KPI calculations
│   │   │   ├── router.py          # Unified API router aggregator
│   │   │   ├── safety.py          # Adverse Events (AE / SAE) pharmacovigilance
│   │   │   ├── sites.py           # Site master directory & study site linkage
│   │   │   ├── studies.py         # Clinical study registry & team mapping
│   │   │   └── users.py           # User accounts & RBAC management
│   │   ├── core/                  # Engine, async session factory, settings, security
│   │   ├── models/                # SQLAlchemy 2.0 mapped models
│   │   │   ├── audit.py           # AuditLog model with SHA-256 hash chaining
│   │   │   ├── compliance.py      # EthicsApproval, RegulatorySubmission, ProtocolDeviation, CAPA
│   │   │   ├── document.py        # Document model with versioning
│   │   │   ├── enums.py           # 30+ type-safe Python enum classifications
│   │   │   ├── organization.py    # Organization & OnboardingApplication models
│   │   │   ├── participant.py     # Participant model & enrollment statuses
│   │   │   ├── progress.py        # StudyMilestone tracking model
│   │   │   ├── safety.py          # AdverseEvent pharmacovigilance model
│   │   │   ├── site.py            # Site & StudySite junction models
│   │   │   ├── study.py           # Study & StudyTeamMember models
│   │   │   └── user.py            # User, Role, Permission, OrganizationMember
│   │   ├── schemas/               # Pydantic v2 validation & response schemas
│   │   ├── services/              # Business logic, state machines, and audit services
│   │   └── main.py                # FastAPI application entrypoint & middleware
│   ├── scripts/
│   │   └── seed.py                # Benchmark dataset seeder for AyuCTMS
│   └── tests/                     # Automated pytest async test suite (10/10 green)
└── frontend/                      # React 19 SPA Frontend
    ├── public/                    # Static assets
    ├── src/
    │   ├── App.tsx                # Institutional trial registry & dashboard UI
    │   ├── index.css              # Tailwind CSS v4 styling & typography tokens
    │   └── main.tsx               # React root entrypoint
    ├── package.json               # Frontend scripts & dependencies
    └── vite.config.ts             # Vite 8 build & server configuration
```

---

## 💼 Core Functional Domains

| Domain | Key Models / Entities | Core Responsibilities |
|---|---|---|
| **Organization & Onboarding** | `Organization`, `OnboardingApplication` | Sponsor and CRO onboarding lifecycle, document verification, multi-tenant organization directory. |
| **Study Management** | `Study`, `StudyTeamMember` | Protocol identification, CTRI registry tracking, study phase, therapeutic area, status state machine. |
| **Site Management** | `Site`, `StudySite` | Institutional research sites, ethics committee affiliations, investigator assignments, site activations. |
| **Participant Lifecycle** | `Participant` | Screening, enrollment, randomization, dosage cohort, withdrawal, and completion tracking. |
| **Safety & Pharmacovigilance** | `AdverseEvent` | Severity grading (Mild/Moderate/Severe), causality, expectedness, serious adverse event (SAE) reporting. |
| **Regulatory & Compliance** | `EthicsApproval`, `ProtocolDeviation`, `CAPARecord` | IRB/IEC approval tracking, major/minor protocol deviations, root-cause corrective action (CAPA). |
| **Documents & Versioning** | `Document` | Regulatory dossiers, protocols, ICFs, site training records with version tracking and checksums. |
| **Audit Ledger** | `AuditLog` | Cryptographic SHA-256 hash chaining of all mutating actions, actor identification, tamper verification. |
| **Portfolio Analytics** | *Dynamic Queries* | Real-time computed KPIs (enrollment rates, active sites, milestone deadlines, study velocity). |

---

## 🚀 Quick Start (Single-Command Runner)

To start both the Backend (FastAPI on port 8000) and Frontend (React/Vite on port 5173) simultaneously with automatic cleanup on `Ctrl+C`:

- **Linux / macOS / Git Bash / WSL**:
  ```bash
  ./run_dev.sh
  ```

- **Windows (Command Prompt / Double-Click)**:
  ```cmd
  run_dev.bat
  ```

- **Windows (PowerShell)**:
  ```powershell
  .\run_dev.ps1
  ```

Pressing `Ctrl+C` cleanly terminates both backend and frontend processes without leaving orphan background processes.

---

## 🛠️ Manual Getting Started

### Prerequisites

- **Python**: `>= 3.12` (Python 3.14 recommended)
- **Node.js**: `>= 20.0.0`
- **npm**: `>= 10.0.0`
- **Git**

---

### Backend Setup (FastAPI)

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Initialize Database and Run Migrations**:
   ```bash
   alembic upgrade head
   ```

5. **Seed Benchmark Clinical Trial Data**:
   ```bash
   python scripts/seed.py
   ```

6. **Start the FastAPI Development Server**:
   ```bash
   python run.py
   # or: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   The backend API will be available at `http://localhost:8000`. Interactive documentation is available at `http://localhost:8000/docs`.

---

### Frontend Setup (React + Vite)

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install node dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   The application dashboard will be accessible at `http://localhost:5173`.

---

## 🗄️ Database Migrations & Seeding

Alembic manages database schema evolution asynchronously:

- **Create a new migration after model changes**:
  ```bash
  alembic revision --autogenerate -m "describe_changes"
  ```
- **Apply migrations**:
  ```bash
  alembic upgrade head
  ```
- **Roll back last migration**:
  ```bash
  alembic downgrade -1
  ```
- **Re-seed initial database records**:
  ```bash
  python scripts/seed.py
  ```

---

## 🔒 Cryptographic Audit Trail (21 CFR Part 11)

In compliance with clinical data integrity standards, every state transition and mutating operation produces an immutable entry in the `audit_logs` table.

### Hash Chaining Mechanism:
1. Each audit log stores an `entry_hash` computed as:
   $$\text{entry\_hash} = \text{SHA-256}(\text{previous\_hash} + \text{action} + \text{resource\_type} + \text{resource\_id} + \text{timestamp})$$
2. The genesis entry uses `0` as the `previous_hash`.
3. An automated endpoint (`GET /api/v1/audit/verify`) validates the entire sequential chain:
   ```json
   {
     "status": "valid",
     "total_logs": 42,
     "chain_intact": true,
     "verified_at": "2026-10-05T16:00:00Z"
   }
   ```
   If any row is altered or deleted directly in the database, the chain breaks and the API returns the exact index of corruption.

---

## 🧪 Verification & Testing

### Backend Verification
Run the complete automated test suite covering models, state machines, portfolio calculations, and the cryptographic audit chain:

```bash
cd backend
# Run test suite
pytest -v

# Run code style & lint check
ruff check .
```

### Frontend Verification
Run the complete frontend verification ladder:

```bash
cd frontend
# Runs oxlint, TypeScript compilation, and production build
npm run verify
```

---

## 📖 API Documentation

Once the backend is running, open your browser to explore and interact with the endpoints:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: `GET http://localhost:8000/health`
- **Portfolio Overview**: `GET http://localhost:8000/api/v1/portfolio/overview`
- **Audit Verification**: `GET http://localhost:8000/api/v1/audit/verify`

---

## 📝 Living Documentation Protocol

This `README.md` is designed to be maintained alongside the codebase:
- Whenever a **new domain or entity** is added (e.g., eCRF, ePRO, Drug Supply Management), update the [Core Functional Domains](#-core-functional-domains) and [Repository Structure](#-repository-structure) sections.
- When new environment variables or setup steps are introduced, keep the [Getting Started](#-getting-started) commands accurate.
- Maintain historical architectural decisions in [memory.md](file:///root/ayu-back/ctms/memory.md).

---

## 📄 License & Attribution

Developed for the **All India Institute of Ayurveda (AIIA)**.  
*Confidential — Clinical Trial Management System Project.*
