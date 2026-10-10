# AyuCTMS Discovered Backend API Endpoints & Contracts

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
