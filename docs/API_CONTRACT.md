# AyuCTMS — Authoritative Backend API Contract

**System:** AyuCTMS (Clinical Trial Management System — CRO / Sponsor Platform)  
**Contract Version:** `1.0.0-frozen`  
**Base URL:** `http://localhost:8000` (Development)  
**Authoritative API Prefix:** `/api/v1`  
**OpenAPI Specification:** [`docs/openapi.json`](file:///root/ayu-back/ctms/docs/openapi.json)  
**Gaps & Discrepancies Report:** [`docs/API_CONTRACT_GAPS.md`](file:///root/ayu-back/ctms/docs/API_CONTRACT_GAPS.md)

---

## 1. Executive Summary & Principles

This document is the **frozen, implementation-accurate REST API contract** for the AyuCTMS CRO / Sponsor backend. It serves as the single source of truth for the React 19 / TypeScript frontend.

### Core Rules for Frontend Integration
1. **Zero Guesswork:** Never invent endpoints, alternate URLs, or unlisted query parameters. Call only the exact paths documented herein.
2. **Authoritative Prefix:** Every domain endpoint resides under `/api/v1` except for `/health` and `/` (root service metadata).
3. **Flat List Responses:** All collection listing endpoints return direct JSON arrays (`list[T]`), not enveloped objects. Do not look for `data.items` or `data.total`.
4. **State Machine Controlled Lifecycles:** Status fields on entities (Studies, Sites, Participants, Adverse Events, Ethics, Regulatory, Deviations, CAPA, Documents, Onboarding) **cannot be edited via arbitrary PATCH**. They are strictly mutated via dedicated `POST .../transition` endpoints using `StatusTransitionRequest`.
5. **Separation of Concerns:** 
   - Server controls IDs, timestamps (`created_at`, `updated_at`), audit trails, transitions, and derived KPI counts.
   - Client controls editable business payload fields.
   - Document binaries are stored in cloud object storage; the API manages document metadata and lifecycle states.

---

## 2. Authentication & Authorization Contract

### 2.1 Authentication Mechanism
- **Token Type:** JSON Web Token (JWT) Bearer Token (`HS256`).
- **Standard Request Header:**
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  ```
- **Token Expiration:** 24 hours (`1440` minutes) by default.
- **Token Payload Claims:**
  - `sub`: User UUID string (e.g. `"9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"`)
  - `email`: User email address
  - `exp`: Expiration Unix epoch timestamp
  - `iat`: Issued-at Unix epoch timestamp

### 2.2 RBAC & Scope Hierarchy
The backend implements multi-tenant, role-based, and study-scoped authorization:

```
User 
 └── Organization Membership (Active)
      └── Role (System, Organization, Study, or Site scope)
           └── Permissions (e.g., "*", "study.read", "study.create")
```

#### Authorization Checks:
1. **System Administrator:** Any user holding an active role with `is_system_role=True` or `scope_level="system"` bypasses organization/study restrictions.
2. **Organization Scope:** Verified by `require_organization_access(permission)`. The user must have an active `OrganizationMember` record for the targeted `organization_id`.
3. **Study Scope:** Verified by `require_study_access()`. The user must either:
   - Be a System Administrator, OR
   - Belong to the study's Sponsor organization (`sponsor_org_id`), OR
   - Belong to the study's CRO organization (`cro_org_id`), OR
   - Hold an active assignment in `study_team_members` for that `study_id`.
4. **Endpoint Permissions:** Evaluated via permission codenames (e.g., `study.create`, `org.write`). Wildcard `*` grants all permissions.

---

## 3. Standardized Error Contract

All error responses from the backend follow standard FastAPI / Starlette JSON schemas:

### 3.1 HTTP 400 — Bad Request / Illegal State Transition
Raised when a business validation fails (e.g., duplicate code, illegal lifecycle transition):
```json
{
  "detail": "Invalid transition from draft to completed"
}
```

### 3.2 HTTP 401 — Unauthorized
Raised when the `Authorization` header is missing, malformed, or expired.
- Header sent: `WWW-Authenticate: Bearer`
```json
{
  "detail": "Authentication credentials were not provided"
}
```
*(Or `"Token has expired"`, `"Could not validate credentials"`)*

### 3.3 HTTP 403 — Forbidden
Raised when user is authenticated but lacks required scope, role, or permission, or is inactive:
```json
{
  "detail": "Access denied: user is not assigned to or authorized for this study"
}
```
*(Or `"User account is inactive or suspended"`, `"Permission denied: missing required permission 'study.manage'"`)*

### 3.4 HTTP 404 — Not Found
Raised when a requested resource ID does not exist in the database:
```json
{
  "detail": "Study not found"
}
```

### 3.5 HTTP 422 — Unprocessable Entity (Schema Validation Error)
Raised automatically by Pydantic when request body, path, or query parameters fail type validation:
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "name"],
      "msg": "Field required",
      "input": {}
    },
    {
      "type": "enum",
      "loc": ["body", "organization_type"],
      "msg": "Input should be 'cro', 'sponsor', 'institution' or 'site_affiliate'",
      "input": "invalid_type"
    }
  ]
}
```

---

## 4. Complete Endpoint Inventory Matrix

Total: **66 Endpoints** (64 business endpoints under `/api/v1` + 2 root/health endpoints)

| Method | Path | Summary / Description | Auth Required | Scope / Dependency | Response Model |
|---|---|---|---|---|---|
| **System** | | | | | |
| `GET` | `/health` | Liveness health check | No | Public | `{"status": "healthy", ...}` |
| `GET` | `/` | API gateway welcome & discovery | No | Public | `{"message": "...", ...}` |
| **Auth** | | | | | |
| `POST` | `/api/v1/auth/login` | Authenticate with email/password → JWT | No | Public | `TokenResponse` |
| `GET` | `/api/v1/auth/me` | Current user profile, RBAC perms, orgs | Yes | `get_current_user` | `UserProfileRead` |
| **Organizations** | | | | | |
| `POST` | `/api/v1/organizations` | Create an organization in draft status | Yes | `get_current_user` | `OrganizationRead` (201) |
| `GET` | `/api/v1/organizations` | List organizations with optional filters | Yes | `get_current_user` | `list[OrganizationRead]` |
| `GET` | `/api/v1/organizations/{org_id}` | Retrieve organization by UUID | Yes | `get_current_user` | `OrganizationRead` |
| `PATCH` | `/api/v1/organizations/{org_id}` | Update organization profile fields | Yes | `get_current_user` | `OrganizationRead` |
| `GET` | `/api/v1/organizations/{org_id}/members` | List members of an organization | Yes | `get_current_user` | `list[OrganizationMemberRead]` |
| `POST` | `/api/v1/organizations/{org_id}/members` | Add user to organization with role | Yes | `get_current_user` | `OrganizationMemberRead` (201) |
| **Onboarding** | | | | | |
| `POST` | `/api/v1/organizations/{org_id}/onboarding` | Submit onboarding application (draft) | Yes | `get_current_user` | `OnboardingApplicationRead` (201) |
| `POST` | `/api/v1/organizations/onboarding/{app_id}/transition` | Transition onboarding status | Yes | `get_current_user` | `OnboardingApplicationRead` |
| **Studies** | | | | | |
| `POST` | `/api/v1/studies` | Register a new clinical trial study | Yes | `get_current_user` | `StudyRead` (201) |
| `GET` | `/api/v1/studies` | List clinical studies with filters | Yes | `get_current_user` | `list[StudyRead]` |
| `GET` | `/api/v1/studies/{study_id}` | Retrieve study details by UUID | Yes | `require_study_access` | `StudyRead` |
| `PATCH` | `/api/v1/studies/{study_id}` | Update study protocol metadata | Yes | `require_study_access` | `StudyRead` |
| `POST` | `/api/v1/studies/{study_id}/transition` | Transition study lifecycle status | Yes | `require_study_access` | `StudyRead` |
| `GET` | `/api/v1/studies/{study_id}/milestones` | List progress tracking milestones | Yes | `require_study_access` | `list[StudyMilestoneRead]` |
| **Study Team** | | | | | |
| `GET` | `/api/v1/studies/{study_id}/team` | List assigned study team members | Yes | `require_study_access` | `list[StudyTeamMemberRead]` |
| `POST` | `/api/v1/studies/{study_id}/team` | Assign user to study team with role | Yes | `require_study_access` | `StudyTeamMemberRead` (201) |
| **Study Sites** | | | | | |
| `GET` | `/api/v1/studies/{study_id}/sites` | List sites assigned to this study | Yes | `require_study_access` | `list[StudySiteRead]` |
| `POST` | `/api/v1/studies/{study_id}/sites` | Assign reusable site to study | Yes | `require_study_access` | `StudySiteRead` (201) |
| `POST` | `/api/v1/studies/{study_id}/sites/{site_id}/transition` | Transition site activation status | Yes | `require_study_access` | `StudySiteRead` |
| **Sites Master** | | | | | |
| `POST` | `/api/v1/sites` | Register global reusable hospital/site | Yes | `get_current_user` | `SiteRead` (201) |
| `GET` | `/api/v1/sites` | List global research sites | Yes | `get_current_user` | `list[SiteRead]` |
| `GET` | `/api/v1/sites/{site_id}` | Retrieve site master record | Yes | `get_current_user` | `SiteRead` |
| `PATCH` | `/api/v1/sites/{site_id}` | Update site contact & profile | Yes | `get_current_user` | `SiteRead` |
| **Participants** | | | | | |
| `POST` | `/api/v1/participants` | Screen / enroll new participant | Yes | `get_current_user` | `ParticipantRead` (201) |
| `GET` | `/api/v1/participants` | List participants with study/site filter | Yes | `get_current_user` | `list[ParticipantRead]` |
| `GET` | `/api/v1/participants/{participant_id}` | Retrieve single participant profile | Yes | `get_current_user` | `ParticipantRead` |
| `POST` | `/api/v1/participants/{participant_id}/transition` | Transition participant state | Yes | `get_current_user` | `ParticipantRead` |
| **Safety** | | | | | |
| `POST` | `/api/v1/safety/adverse-events` | Log an adverse event (AE/SAE/SUSAR) | Yes | `get_current_user` | `AdverseEventRead` (201) |
| `GET` | `/api/v1/safety/adverse-events` | List adverse events with filters | Yes | `get_current_user` | `list[AdverseEventRead]` |
| `GET` | `/api/v1/safety/adverse-events/{event_id}` | Retrieve specific adverse event | Yes | `get_current_user` | `AdverseEventRead` |
| `POST` | `/api/v1/safety/adverse-events/{event_id}/transition` | Transition AE status | Yes | `get_current_user` | `AdverseEventRead` |
| **Compliance: Ethics** | | | | | |
| `POST` | `/api/v1/compliance/ethics` | Record Ethics Committee approval | Yes | `get_current_user` | `EthicsApprovalRead` (201) |
| `GET` | `/api/v1/compliance/ethics` | List ethics approvals by study/site | Yes | `get_current_user` | `list[EthicsApprovalRead]` |
| `POST` | `/api/v1/compliance/ethics/{approval_id}/transition` | Transition EC approval status | Yes | `get_current_user` | `EthicsApprovalRead` |
| **Compliance: Regulatory** | | | | | |
| `POST` | `/api/v1/compliance/regulatory` | Create regulatory authority submission | Yes | `get_current_user` | `RegulatorySubmissionRead` (201) |
| `GET` | `/api/v1/compliance/regulatory` | List regulatory submissions | Yes | `get_current_user` | `list[RegulatorySubmissionRead]` |
| `POST` | `/api/v1/compliance/regulatory/{submission_id}/transition` | Transition regulatory status | Yes | `get_current_user` | `RegulatorySubmissionRead` |
| **Compliance: Deviations** | | | | | |
| `POST` | `/api/v1/compliance/deviations` | Record a protocol deviation | Yes | `get_current_user` | `ProtocolDeviationRead` (201) |
| `GET` | `/api/v1/compliance/deviations` | List protocol deviations | Yes | `get_current_user` | `list[ProtocolDeviationRead]` |
| `POST` | `/api/v1/compliance/deviations/{deviation_id}/transition` | Transition deviation status | Yes | `get_current_user` | `ProtocolDeviationRead` |
| **Compliance: CAPA** | | | | | |
| `POST` | `/api/v1/compliance/capa` | Create corrective / preventive action | Yes | `get_current_user` | `CAPARecordRead` (201) |
| `GET` | `/api/v1/compliance/capa` | List CAPA records by study/org | Yes | `get_current_user` | `list[CAPARecordRead]` |
| `POST` | `/api/v1/compliance/capa/{capa_id}/transition` | Transition CAPA status | Yes | `get_current_user` | `CAPARecordRead` |
| **Documents** | | | | | |
| `POST` | `/api/v1/documents` | Register document metadata & checksum | Yes | `get_current_user` | `DocumentRead` (201) |
| `GET` | `/api/v1/documents` | List documents with query filters | Yes | `get_current_user` | `list[DocumentRead]` |
| `GET` | `/api/v1/documents/{document_id}` | Retrieve document metadata | Yes | `get_current_user` | `DocumentRead` |
| `POST` | `/api/v1/documents/{document_id}/transition` | Transition document approval status | Yes | `get_current_user` | `DocumentRead` |
| **Portfolio Analytics** | | | | | |
| `GET` | `/api/v1/portfolio/overview` | Overall portfolio aggregate counts | Yes | `get_current_user` | `PortfolioOverviewResponse` |
| `GET` | `/api/v1/portfolio/health` | Composite risk level (Green/Amber/Red) | Yes | `get_current_user` | `PortfolioHealthResponse` |
| `GET` | `/api/v1/portfolio/alerts` | Active actionable operational alerts | Yes | `get_current_user` | `list[PortfolioAlertItem]` |
| `GET` | `/api/v1/portfolio/milestones/upcoming`| Aggregated upcoming milestones | Yes | `get_current_user` | `list[UpcomingMilestoneItem]` |
| `GET` | `/api/v1/portfolio/enrollment/trend` | Timeseries of cumulative enrollment | Yes | `get_current_user` | `list[EnrollmentTrendPoint]` |
| `GET` | `/api/v1/portfolio/studies/{study_id}/enrollment/by-site` | Site recruitment progress per study | Yes | `get_current_user` | `list[SiteEnrollmentItem]` |
| `GET` | `/api/v1/portfolio/studies/{study_id}/metrics` | Comprehensive study KPI breakdown | Yes | `get_current_user` | `StudyMetricsResponse` |
| **Audit Trail** | | | | | |
| `GET` | `/api/v1/audit/logs` | Query immutable audit log entries | Yes | `get_current_user` | `list[AuditLogRead]` |
| `GET` | `/api/v1/audit/verify` | Cryptographic hash-chain integrity check | Yes | `get_current_user` | `dict[str, Any]` |
| **Users & RBAC** | | | | | |
| `POST` | `/api/v1/users` | Register user (bootstrap if zero users; authenticated otherwise) | Conditional | Bootstrap (users==0) / `get_current_user` | `UserRead` (201) |
| `GET` | `/api/v1/users` | List platform users with filter | Yes | `get_current_user` | `list[UserRead]` |
| `GET` | `/api/v1/users/{user_id}` | Retrieve user profile by UUID | Yes | `get_current_user` | `UserRead` |
| `POST` | `/api/v1/roles` | Create a user role with scope | Yes | `get_current_user` | `RoleRead` (201) |
| `GET` | `/api/v1/roles` | List all available roles | Yes | `get_current_user` | `list[RoleRead]` |
| `GET` | `/api/v1/permissions` | List all registered RBAC permissions | Yes | `get_current_user` | `list[PermissionRead]` |

---

## 5. Domain Endpoint Specifications

### 5.1 Authentication (`/api/v1/auth`)

#### `POST /api/v1/auth/login`
- **Purpose:** Exchange email and password for a signed JWT access token.
- **Auth:** Public (None).
- **Request Body:** `application/json`
  ```json
  {
    "email": "admin@ayuctms.gov.in",
    "password": "SecurePassword123!"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "user": {
      "id": "11111111-1111-1111-1111-111111111111",
      "email": "admin@ayuctms.gov.in",
      "full_name": "AyuCTMS Admin",
      "phone": "+91 9876543210",
      "status": "active",
      "created_at": "2026-10-05T12:00:00Z",
      "updated_at": "2026-10-05T12:00:00Z"
    }
  }
  ```
- **Errors:** `401 Unauthorized` (Incorrect credentials), `403 Forbidden` (User inactive/suspended), `422` (Invalid schema).

#### `GET /api/v1/auth/me`
- **Purpose:** Retrieve profile, loaded permissions, system admin status, and organization memberships of the authenticated caller.
- **Auth:** Bearer JWT (`get_current_user`).
- **Response:** `200 OK`
  ```json
  {
    "user": {
      "id": "11111111-1111-1111-1111-111111111111",
      "email": "admin@ayuctms.gov.in",
      "full_name": "AyuCTMS Admin",
      "phone": "+91 9876543210",
      "status": "active",
      "created_at": "2026-10-05T12:00:00Z",
      "updated_at": "2026-10-05T12:00:00Z"
    },
    "permissions": ["*", "study.read", "study.create"],
    "is_system_admin": true,
    "memberships": [
      {
        "organization_id": "22222222-2222-2222-2222-222222222222",
        "organization_name": "Central Council for Research in Ayurvedic Sciences",
        "role_name": "System Administrator",
        "scope_level": "system",
        "status": "active"
      }
    ]
  }
  ```

---

### 5.2 Organizations & Onboarding (`/api/v1/organizations`)

#### `POST /api/v1/organizations`
- **Purpose:** Create an organization in initial `draft` status.
- **Auth:** Bearer JWT.
- **Request Body:** `application/json`
  ```json
  {
    "name": "All India Institute of Ayurveda",
    "organization_type": "sponsor",
    "registration_number": "AIIA-ND-001",
    "website": "https://aiia.gov.in",
    "phone": "+91-11-26950401",
    "email": "clinical.trials@aiia.gov.in",
    "address_line1": "Mathura Road, Gautam Puri",
    "address_line2": "Sarita Vihar",
    "city": "New Delhi",
    "state": "Delhi",
    "country": "India",
    "postal_code": "110076"
  }
  ```
- **Response:** `201 Created` (`OrganizationRead`)
  ```json
  {
    "id": "22222222-2222-2222-2222-222222222222",
    "name": "All India Institute of Ayurveda",
    "organization_type": "sponsor",
    "status": "draft",
    "registration_number": "AIIA-ND-001",
    "website": "https://aiia.gov.in",
    "phone": "+91-11-26950401",
    "email": "clinical.trials@aiia.gov.in",
    "address_line1": "Mathura Road, Gautam Puri",
    "address_line2": "Sarita Vihar",
    "city": "New Delhi",
    "state": "Delhi",
    "country": "India",
    "postal_code": "110076",
    "created_at": "2026-10-05T12:00:00Z",
    "updated_at": "2026-10-05T12:00:00Z"
  }
  ```

#### `GET /api/v1/organizations`
- **Query Params:**
  - `org_type` (`OrganizationType` enum, optional)
  - `org_status` (`OrganizationStatus` enum, optional)
  - `skip` (`integer`, default `0`, min `0`)
  - `limit` (`integer`, default `50`, min `1`, max `100`)
- **Response:** `200 OK` — `list[OrganizationRead]`

#### `PATCH /api/v1/organizations/{org_id}`
- **Purpose:** Update editable organization profile fields.
- **Request Body:** Partial `OrganizationUpdate` (all fields optional).
- **Response:** `200 OK` — Updated `OrganizationRead`.

#### `POST /api/v1/organizations/{org_id}/onboarding`
- **Purpose:** Submit an onboarding application for an organization (creates application in `draft` status).
- **Response:** `201 Created` (`OnboardingApplicationRead`)
  ```json
  {
    "id": "33333333-3333-3333-3333-333333333333",
    "organization_id": "22222222-2222-2222-2222-222222222222",
    "status": "draft",
    "submitted_at": null,
    "reviewed_at": null,
    "reviewed_by": null,
    "review_notes": null,
    "created_at": "2026-10-05T12:00:00Z",
    "updated_at": "2026-10-05T12:00:00Z"
  }
  ```

#### `POST /api/v1/organizations/onboarding/{app_id}/transition`
- **Purpose:** Transition onboarding application state.
- **Allowed Transitions:**
  - `draft` → `submitted`
  - `submitted` → `under_review`
  - `under_review` → `approved`, `returned`, `rejected`
  *(Note: Transition to `approved` automatically changes `organization.status` to `active`).*
- **Request Body:**
  ```json
  {
    "new_status": "submitted",
    "reason": "Initial compliance verification complete"
  }
  ```
- **Response:** `200 OK` — Updated `OnboardingApplicationRead`.

#### `GET /api/v1/organizations/{org_id}/members`
- **Response:** `200 OK` — `list[OrganizationMemberRead]`.

#### `POST /api/v1/organizations/{org_id}/members`
- **Purpose:** Add a user to an organization with an assigned role.
- **Note:** `organization_id` is derived strictly from the `{org_id}` URL path parameter.
- **Request Body:**
  ```json
  {
    "user_id": "11111111-1111-1111-1111-111111111111",
    "role_id": "44444444-4444-4444-4444-444444444444"
  }
  ```
- **Response:** `201 Created` (`OrganizationMemberRead`).

---

### 5.3 Studies & Trial Protocols (`/api/v1/studies`)

#### `POST /api/v1/studies`
- **Purpose:** Register a clinical study in initial `draft` status.
- **Request Body:** `application/json`
  ```json
  {
    "study_code": "AYU-ONC-2026-001",
    "protocol_number": "AIIA/CT/2026/01",
    "title": "Clinical Evaluation of Ashwagandha in Cancer-Related Fatigue",
    "short_title": "Ashwagandha Fatigue Study",
    "study_type": "interventional",
    "phase": "phase_2",
    "sponsor_org_id": "22222222-2222-2222-2222-222222222222",
    "cro_org_id": "55555555-5555-5555-5555-555555555555",
    "therapeutic_area": "Integrative Oncology",
    "intervention_type": "Herbal Extract / Withania somnifera",
    "study_design": "Double-blind, Randomized, Placebo-Controlled",
    "blinding": "double_blind",
    "randomization": true,
    "planned_sample_size": 120,
    "start_date": "2026-11-01",
    "end_date": "2027-11-01",
    "recruitment_start_date": "2026-11-15",
    "recruitment_end_date": "2027-05-15",
    "ctri_status": "registered",
    "ctri_number": "CTRI/2026/09/012345",
    "description": "Evaluating standardized Withania somnifera 500mg BID vs placebo."
  }
  ```
- **Response:** `201 Created` (`StudyRead`)
  ```json
  {
    "id": "66666666-6666-6666-6666-666666666666",
    "study_code": "AYU-ONC-2026-001",
    "protocol_number": "AIIA/CT/2026/01",
    "title": "Clinical Evaluation of Ashwagandha in Cancer-Related Fatigue",
    "short_title": "Ashwagandha Fatigue Study",
    "study_type": "interventional",
    "phase": "phase_2",
    "status": "draft",
    "sponsor_org_id": "22222222-2222-2222-2222-222222222222",
    "cro_org_id": "55555555-5555-5555-5555-555555555555",
    "therapeutic_area": "Integrative Oncology",
    "intervention_type": "Herbal Extract / Withania somnifera",
    "study_design": "Double-blind, Randomized, Placebo-Controlled",
    "blinding": "double_blind",
    "randomization": true,
    "planned_sample_size": 120,
    "start_date": "2026-11-01",
    "end_date": "2027-11-01",
    "recruitment_start_date": "2026-11-15",
    "recruitment_end_date": "2027-05-15",
    "ctri_status": "registered",
    "ctri_number": "CTRI/2026/09/012345",
    "ec_approval_status": null,
    "regulatory_status": null,
    "description": "Evaluating standardized Withania somnifera 500mg BID vs placebo.",
    "created_at": "2026-10-05T12:00:00Z",
    "updated_at": "2026-10-05T12:00:00Z"
  }
  ```

#### `GET /api/v1/studies`
- **Query Params:** `status`, `phase`, `sponsor_org_id`, `cro_org_id`, `skip`, `limit`.
- **Response:** `200 OK` — `list[StudyRead]`.

#### `GET /api/v1/studies/{study_id}`
- **Auth & Scope:** Enforced via `require_study_access()`. Returns `StudyRead`.

#### `PATCH /api/v1/studies/{study_id}`
- **Purpose:** Update study metadata (excluding status). Returns `StudyRead`.

#### `POST /api/v1/studies/{study_id}/transition`
- **Purpose:** Execute study protocol state machine transition.
- **Allowed Transitions:**
  - `draft` → `planned`, `withdrawn`
  - `planned` → `active`
  - `active` → `suspended`, `completed`, `terminated`
  - `suspended` → `active`
- **Request Body:**
  ```json
  {
    "new_status": "planned",
    "reason": "Protocol version 1.0 approved by steering committee"
  }
  ```
- **Response:** `200 OK` — Updated `StudyRead`.

#### `GET /api/v1/studies/{study_id}/milestones`
- **Purpose:** Retrieve planned and actual protocol timeline milestones for a study.
- **Auth & Scope:** Enforced via `require_study_access()`.
- **Response:** `200 OK` — `list[StudyMilestoneRead]`
  ```json
  [
    {
      "id": "88888888-8888-8888-8888-888888888888",
      "study_id": "66666666-6666-6666-6666-666666666666",
      "title": "First Participant In (FPI)",
      "description": "First subject successfully screened and enrolled",
      "planned_date": "2026-11-20",
      "actual_date": "2026-11-18",
      "status": "completed",
      "created_at": "2026-10-05T12:00:00Z",
      "updated_at": "2026-10-05T12:00:00Z"
    }
  ]
  ```

---

### 5.4 Study Team & Study Sites

#### `GET /api/v1/studies/{study_id}/team`
- **Response:** `200 OK` — `list[StudyTeamMemberRead]`.

#### `POST /api/v1/studies/{study_id}/team`
- **Purpose:** Assign a user to the study team with an assigned role.
- **Note:** `study_id` is derived strictly from the `{study_id}` URL path parameter.
- **Request Body:**
  ```json
  {
    "user_id": "11111111-1111-1111-1111-111111111111",
    "role_id": "44444444-4444-4444-4444-444444444444",
    "site_id": null,
    "start_date": "2026-11-01",
    "end_date": null
  }
  ```
- **Response:** `201 Created` (`StudyTeamMemberRead`).

#### `GET /api/v1/studies/{study_id}/sites`
- **Response:** `200 OK` — `list[StudySiteRead]`.

#### `POST /api/v1/studies/{study_id}/sites`
- **Purpose:** Assign a site master record to this clinical study.
- **Note:** `study_id` is derived strictly from the `{study_id}` URL path parameter.
- **Request Body:**
  ```json
  {
    "site_id": "77777777-7777-7777-7777-777777777777",
    "recruitment_target": 60,
    "monitoring_status": "not_started"
  }
  ```
- **Response:** `201 Created` (`StudySiteRead`, initial status: `planned`).
- **Conflict:** Returns `400 Bad Request` if `site_id` is already assigned to this study.

#### `POST /api/v1/studies/{study_id}/sites/{site_id}/transition`
- **Purpose:** Transition site activation lifecycle.
- **Allowed Transitions:**
  - `planned` → `initiated`
  - `initiated` → `activated` *(automatically records `activation_date = today`)*
  - `activated` → `suspended`, `closed`
  - `suspended` → `activated`, `closed`
- **Request Body:** `StatusTransitionRequest`
- **Response:** `200 OK` — Updated `StudySiteRead`.

---

### 5.5 Global Sites Master (`/api/v1/sites`)

#### `POST /api/v1/sites`
- **Purpose:** Register reusable hospital/site master record (initial status: `active`).
- **Request Body:**
  ```json
  {
    "site_code": "SITE-AIIA-01",
    "name": "AIIA Central Hospital Research Wing",
    "site_type": "academic",
    "address_line1": "Mathura Road, Sarita Vihar",
    "city": "New Delhi",
    "state": "Delhi",
    "country": "India",
    "postal_code": "110076",
    "phone": "+91-11-26950400",
    "email": "clinical.site@aiia.gov.in",
    "organization_id": "22222222-2222-2222-2222-222222222222"
  }
  ```
- **Response:** `201 Created` (`SiteRead`).

#### `GET /api/v1/sites`
- **Query Params:** `site_type`, `status`, `city`, `skip`, `limit`.
- **Response:** `200 OK` — `list[SiteRead]`.

#### `PATCH /api/v1/sites/{site_id}`
- **Response:** `200 OK` — Updated `SiteRead`.

---

### 5.6 Participants (`/api/v1/participants`)

#### `POST /api/v1/participants`
- **Purpose:** Register screened participant (initial status: `screened`).
- **Request Body:**
  ```json
  {
    "participant_code": "SUBJ-001",
    "study_id": "66666666-6666-6666-6666-666666666666",
    "site_id": "77777777-7777-7777-7777-777777777777",
    "screening_date": "2026-11-16"
  }
  ```
- **Response:** `201 Created` (`ParticipantRead`).

#### `GET /api/v1/participants`
- **Query Params:** `study_id`, `site_id`, `status`, `skip`, `limit`.
- **Response:** `200 OK` — `list[ParticipantRead]`.

#### `POST /api/v1/participants/{participant_id}/transition`
- **Purpose:** Transition participant lifecycle with automatic milestone date assignment.
- **Allowed Transitions:**
  - `screened` → `eligible`, `screen_failed`
  - `eligible` → `randomized` *(sets `randomization_date`)*, `enrolled` *(sets `enrollment_date`)*, `withdrawn` *(sets `withdrawal_date` + `withdrawal_reason`)*
  - `randomized` → `enrolled` *(sets `enrollment_date`)*, `withdrawn`
  - `enrolled` → `active`, `withdrawn`
  - `active` → `completed` *(sets `completion_date`)*, `withdrawn`
- **Request Body:** `StatusTransitionRequest`
- **Response:** `200 OK` — Updated `ParticipantRead`.

---

### 5.7 Safety / Pharmacovigilance (`/api/v1/safety`)

#### `POST /api/v1/safety/adverse-events`
- **Purpose:** Log adverse event (initial status: `open`, `reported_by` auto-populated).
- **Request Body:**
  ```json
  {
    "study_id": "66666666-6666-6666-6666-666666666666",
    "participant_id": "88888888-8888-8888-8888-888888888888",
    "site_id": "77777777-7777-7777-7777-777777777777",
    "event_type": "sae",
    "description": "Grade 3 nausea and dizziness following morning dose",
    "onset_date": "2026-11-20",
    "resolution_date": null,
    "seriousness": "serious",
    "severity": "severe",
    "causality": "possible",
    "expectedness": "unexpected",
    "action_taken": "Dose temporarily withheld; symptomatic treatment given",
    "outcome": "recovering",
    "reporting_deadline": "2026-11-21"
  }
  ```
- **Response:** `201 Created` (`AdverseEventRead`).

#### `GET /api/v1/safety/adverse-events`
- **Query Params:** `study_id`, `participant_id`, `seriousness`, `severity`, `status`, `skip`, `limit`.
- **Response:** `200 OK` — `list[AdverseEventRead]`.

#### `POST /api/v1/safety/adverse-events/{event_id}/transition`
- **Allowed Transitions:**
  - `open` → `under_review`, `closed`
  - `under_review` → `closed`, `open`
- **Response:** `200 OK` — Updated `AdverseEventRead`.

---

### 5.8 Compliance & Regulatory (`/api/v1/compliance`)

#### Ethics Approvals:
- `POST /api/v1/compliance/ethics` (`201 Created`, `EthicsApprovalRead`)
- `GET /api/v1/compliance/ethics` (query: `study_id`, `site_id`, `skip`, `limit` → `list[EthicsApprovalRead]`)
- `POST /api/v1/compliance/ethics/{approval_id}/transition`:
  - `not_submitted` → `pending`
  - `pending` → `approved` *(auto-sets `approval_date`)*, `conditional`, `rejected`
  - `conditional` → `approved`, `rejected`
  - `approved` → `expired`

#### Regulatory Submissions:
- `POST /api/v1/compliance/regulatory` (`201 Created`, `RegulatorySubmissionRead`)
- `GET /api/v1/compliance/regulatory` (query: `study_id`, `skip`, `limit` → `list[RegulatorySubmissionRead]`)
- `POST /api/v1/compliance/regulatory/{submission_id}/transition`:
  - `not_submitted` → `pending`
  - `pending` → `approved` *(auto-sets `approval_date`)*, `conditional`, `rejected`
  - `conditional` → `approved`, `rejected`

#### Protocol Deviations:
- `POST /api/v1/compliance/deviations` (`201 Created`, `ProtocolDeviationRead`)
- `GET /api/v1/compliance/deviations` (query: `study_id`, `site_id`, `skip`, `limit` → `list[ProtocolDeviationRead]`)
- `POST /api/v1/compliance/deviations/{deviation_id}/transition`:
  - `identified` → `reported`
  - `reported` → `resolved` *(auto-sets `resolution_date`)*

#### CAPA Records:
- `POST /api/v1/compliance/capa` (`201 Created`, `CAPARecordRead`)
- `GET /api/v1/compliance/capa` (query: `study_id`, `organization_id`, `skip`, `limit` → `list[CAPARecordRead]`)
- `POST /api/v1/compliance/capa/{capa_id}/transition`:
  - `open` → `in_progress`
  - `in_progress` → `completed` *(auto-sets `completed_date`)*
  - `completed` → `verified`

---

### 5.9 Documents & 21 CFR Part 11 Metadata (`/api/v1/documents`)

**Document Storage Architecture:**
Binary file transfer is decoupled from the transactional REST API. Binary files are uploaded directly to cloud object storage (e.g. AWS S3, MinIO, or Google Cloud Storage) out-of-band using pre-signed URLs or backend-authenticated storage connectors.
The AyuCTMS REST API tracks 21 CFR Part 11 compliant metadata, SHA-256 cryptographic checksums, audit records, and approval lifecycle states:

- `POST /api/v1/documents`: Registers document metadata (initial status: `draft`, `uploaded_by` set from authenticated user).
  ```json
  {
    "organization_id": "22222222-2222-2222-2222-222222222222",
    "study_id": "66666666-6666-6666-6666-666666666666",
    "site_id": null,
    "document_type": "protocol",
    "title": "Clinical Trial Protocol Version 1.0",
    "version": "1.0",
    "expiry_date": null,
    "storage_key": "s3://ayu-ctms-docs/studies/66666666/protocol_v1.0.pdf",
    "file_name": "protocol_v1.0.pdf",
    "file_size": 2458120,
    "mime_type": "application/pdf",
    "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
  ```
- `GET /api/v1/documents` (query: `study_id`, `organization_id`, `site_id`, `document_type`, `status`, `skip`, `limit` → `list[DocumentRead]`)
- `GET /api/v1/documents/{document_id}` → `DocumentRead`
- `POST /api/v1/documents/{document_id}/transition`:
  - `draft` → `under_review`, `archived`
  - `under_review` → `approved` *(auto-sets `approved_by` & `approved_at`)*, `draft`, `archived`
  - `approved` → `superseded`, `expired`, `archived`

---

### 5.10 Portfolio & Derived Analytics (`/api/v1/portfolio`)

All portfolio metrics are **dynamically calculated** on the fly from canonical database records with zero redundant stored counters. All endpoints return strongly-typed Pydantic response models.

#### `GET /api/v1/portfolio/overview`
- **Response Model:** `PortfolioOverviewResponse`
- **Derivation Logic:**
  - `studies.total`: `COUNT(studies)`
  - `studies.active`: `COUNT(studies WHERE status='active')`
  - `studies.delayed`: `COUNT(studies WHERE status='active' AND end_date < CURRENT_DATE)`
  - `sites.currently_activated`: `COUNT(DISTINCT study_sites.site_id WHERE activation_status='activated')`
  - `participants.actual_enrolled`: `COUNT(participants WHERE status IN ('enrolled', 'active', 'completed'))`
  - `safety.open_serious_cases`: `COUNT(adverse_events WHERE status='open' AND seriousness='serious')`
- **Response Example:**
  ```json
  {
    "as_of_date": "2026-10-05",
    "studies": {
      "total": 4,
      "active": 3,
      "planned": 1,
      "completed": 0,
      "delayed": 0
    },
    "sites": {
      "total_registered": 6,
      "currently_activated": 4
    },
    "participants": {
      "total_screened": 85,
      "actual_enrolled": 68,
      "active_in_treatment": 54,
      "screen_failures": 12
    },
    "safety": {
      "open_cases": 2,
      "open_serious_cases": 0
    }
  }
  ```

#### `GET /api/v1/portfolio/health`
- **Response Model:** `PortfolioHealthResponse`
- **Output:** Composite health rating (`overall_rating`: `"Green" | "Amber" | "Red"`) and risk level (`risk_level`: `"Low" | "Medium" | "High"`) with breakdown (`delayed_studies_count`, `open_sae_count`, `critical_deviations_count`, `expired_ethics_count`, `risk_factors: list[str]`).

#### `GET /api/v1/portfolio/alerts`
- **Response Model:** `list[PortfolioAlertItem]`
- **Output:** Actionable operational alerts: approvals expiring within 30 days, delayed milestones, open SAEs, and critical deviations. Fields: `alert_type`, `severity` (`critical`, `warning`, `info`), `title`, `description`, `study_id`, `study_code`, `due_date`.

#### `GET /api/v1/portfolio/milestones/upcoming`
- **Query Params:** `limit: int = 20` (min 1, max 100).
- **Response Model:** `list[UpcomingMilestoneItem]`
- **Output:** Upcoming milestones across all studies sorted by planned date. Fields: `id`, `study_id`, `study_code`, `title`, `planned_date`, `status`, `days_until`.

#### `GET /api/v1/portfolio/enrollment/trend`
- **Query Params:** `study_id: UUID` (optional).
- **Response Model:** `list[EnrollmentTrendPoint]`
- **Output:** Array of timeseries entries: `{"date": "2026-11-16", "enrolled_count": 5, "cumulative_count": 25}`.

#### `GET /api/v1/portfolio/studies/{study_id}/enrollment/by-site`
- **Response Model:** `list[SiteEnrollmentItem]`
- **Output:** Breakdown per site: `site_id`, `site_code`, `site_name`, `recruitment_target`, `actual_enrolled`, `recruitment_percentage`, `activation_status`.

#### `GET /api/v1/portfolio/studies/{study_id}/metrics`
- **Response Model:** `StudyMetricsResponse`
- **Output:** Deep-dive KPI breakdown for a single study (recruitment progress vs planned sample size, status counts, site counts, adverse event counts, deviations, and schedule delay boolean).

---

### 5.11 Audit Trail & 21 CFR Part 11 (`/api/v1/audit`)

#### `GET /api/v1/audit/logs`
- **Query Params:** `resource_type`, `resource_id`, `action`, `skip`, `limit`.
- **Response:** `list[AuditLogRead]` (immutable audit records).

#### `GET /api/v1/audit/verify`
- **Purpose:** Verifies the cryptographic hash-chain continuity and payload digests across the entire system.
- **Response:**
  ```json
  {
    "valid": true,
    "verified_records": 142,
    "message": "Cryptographic integrity verified across all 142 audit log entries"
  }
  ```

---

### 5.12 Users & RBAC Control (`/api/v1/users`, `/roles`, `/permissions`)

#### `POST /api/v1/users`
- **Purpose:** Create user accounts.
- **Security Rule (Bootstrap Architecture):**
  - **System Bootstrap:** Unauthenticated creation is permitted **only** when `total_users == 0` for initializing the first system administrator account.
  - **Normal Operation:** Once at least one user exists in the database, anonymous user creation is strictly prohibited. Anonymous calls immediately return `HTTP 401 Unauthorized` (`WWW-Authenticate: Bearer`). Normal user provisioning requires authenticated requests with administrative privileges.
  - **Password Security:** Passwords are encrypted with `bcrypt` (12 rounds). Plaintext passwords and `hashed_password` are strictly excluded from all API responses and logs.
- **Request Body:** `UserCreate` (`email`, `password`, `full_name`, `phone`).
- **Response:** `201 Created` (`UserRead`).

#### `GET /api/v1/users`
- **Response:** `list[UserRead]` (query: `status`, `skip`, `limit`).

#### `GET /api/v1/users/{user_id}`
- **Response:** `UserRead`.

#### `POST /api/v1/roles`
- **Purpose:** Create custom role (`name`, `description`, `scope_level`).
- **Response:** `201 Created` (`RoleRead`).

#### `GET /api/v1/roles`
- **Response:** `list[RoleRead]`.

#### `GET /api/v1/permissions`
- **Response:** `list[PermissionRead]`.

---

### 5.12 Platform, Government Verification & Dual-Approval Onboarding (`/api/v1/platform`)

This domain governs platform-level access, independent government verification across research roles, and the independent dual-approval clinical trial site onboarding workflow.

#### Public Access Requests
- **`POST /api/v1/platform/requests/research-pi`**
  - **Payload:** `ResearchPIRequestCreate` (`applicant_name`, `email`, `organization_name`, `organization_type`, `requested_role`, `phone`, `designation`, `qualifications`, `country`, `state`, `city`, `declaration_accepted`)
  - **Response:** `OnboardingRequestRead` (status: `"pending"`)
- **`POST /api/v1/platform/requests/cro-staff`**
  - **Payload:** `CROStaffRequestCreate`
  - **Response:** `OnboardingRequestRead` (status: `"pending"`)
- **`POST /api/v1/platform/requests/site-pi`**
  - **Payload:** `SitePIRequestCreate` (`proposed_site_name`, institutional affiliation)
  - **Response:** `OnboardingRequestRead` (status: `"pending"`)
- **`POST /api/v1/platform/onboarding-requests`**
  - Legacy intake endpoint. Supported for backward compatibility.

#### Government Verification & Platform Administration
- **`GET /api/v1/platform/onboarding-requests`** (query: `request_type`, `status` → `list[OnboardingRequestRead]`, requires Super Admin)
- **`GET /api/v1/platform/onboarding-requests/{request_id}`** → `OnboardingRequestRead` (requires Super Admin)
- **`PATCH /api/v1/platform/onboarding-requests/{request_id}/review`**
  - **Payload:** `OnboardingRequestReview` (`status`, `review_notes`)
  - **Allowed State Graph:**
    - `pending` → `under_review`
    - `under_review` → `approved`, `rejected`, `changes_requested`
    - `changes_requested` → `under_review`, `rejected`
  - **Self-Review Prevention:** Evaluator cannot review their own submitted request (`HTTP 400 Bad Request`).
- **`POST /api/v1/platform/onboarding-requests/{request_id}/approve`**
  - Atomic tenant provisioning: creates canonical `Organization`, initial `User` (`status="inactive"`, `must_change_password=True`), `OrganizationMember` with org-admin role, and single-use bcrypt-hashed `InvitationToken`. Dispatches activation email via Resend API (or safe dev logging). Idempotent on double-approval.

#### Account Activation & Security Setup
- **`POST /api/v1/platform/activate`**
  - **Payload:** `ActivationRequest` (`token`, `new_password` min 8 chars)
  - Validates bcrypt token hash, activates user (`status="active"`), marks token used.
- **`POST /api/v1/platform/first-login-setup`**
  - **Payload:** `FirstLoginSetupRequest` (`current_password`, `new_password`, `full_name`, `phone`)
  - Authenticated. Resets `must_change_password=False`, updates profile, records `password_changed_at`.
- **`POST /api/v1/platform/change-password`**
  - Authenticated password change endpoint.

#### Independent Dual-Approval Clinical Site Participation
Neither Government approval alone nor institutional Site PI confirmation alone activates a `StudySite`. Both must be affirmative.
- **`POST /api/v1/platform/site-participation/request`**
  - Initiated by Research PI / CRO. Creates `SiteParticipationRequest` (`government_status="pending"`, `site_status="pending"`, `status="requested"`).
- **`GET /api/v1/platform/site-participation`** → `list[SiteParticipationRequestRead]` (requires Super Admin)
- **`GET /api/v1/platform/site-participation/by-study/{study_id}`** → `list[SiteParticipationRequestRead]`
- **`GET /api/v1/platform/site-participation/by-site/{site_id}`** → `list[SiteParticipationRequestRead]`
- **`POST /api/v1/platform/site-participation/{request_id}/government-review`**
  - **Payload:** `SiteParticipationDecisionReview` (`decision: "approved" | "rejected"`, `notes`)
  - Requires Government Super Admin. Cannot be self-reviewed by requester.
  - If both decisions become `"approved"`, atomically activates `StudySite` (`activation_status="activated"`).
- **`POST /api/v1/platform/site-participation/{request_id}/site-response`**
  - **Payload:** `SiteParticipationDecisionReview` (`decision: "approved" | "rejected"`, `notes`)
  - Requires authorized institutional respondent for `site_id`. Research PI requester receives `403 Forbidden`.
  - If both decisions become `"approved"`, atomically activates `StudySite` (`activation_status="activated"`).

#### Research Team Member Verification
- **`POST /api/v1/platform/team-invitations`**
  - Invites team member into an organization or study. Routes to government verification queue.
- **`GET /api/v1/platform/team-verifications`** → `list[TeamMemberVerificationRequestRead]` (requires Super Admin)
- **`POST /api/v1/platform/team-verifications/{request_id}/review`** (requires Super Admin)

#### Government Verifier Provisioning
- **`POST /api/v1/platform/super-admin/verifiers`** (creates platform government verifier profile, requires Super Admin)
- **`GET /api/v1/platform/super-admin/verifiers`** → `list[SuperAdminProfileRead]` (requires Super Admin)

---

## 6. Server-Controlled vs Client-Controlled Fields

| Entity | Client-Controlled (Editable on Create/Update) | Server-Controlled (Read-Only / Managed by Backend) |
|---|---|---|
| **Organization** | `name`, `organization_type` (on create), `registration_number`, `website`, `phone`, `email`, address fields | `id`, `status` (via onboarding workflow), `created_at`, `updated_at` |
| **Onboarding** | `notes` / `reason` (on transition) | `id`, `organization_id`, `status`, `submitted_at`, `reviewed_at`, `reviewed_by`, timestamps |
| **Study** | `study_code`, `protocol_number`, `title`, `short_title`, `study_type`, `phase`, `sponsor_org_id`, `cro_org_id`, `therapeutic_area`, `intervention_type`, `study_design`, `blinding`, `randomization`, `planned_sample_size`, dates, CTRI info, `description` | `id`, `status` (via transition), `ec_approval_status`, `regulatory_status`, timestamps |
| **Study Site** | `recruitment_target`, `monitoring_status` | `id`, `study_id`, `site_id`, `activation_status` (via transition), `activation_date`, timestamps |
| **Site** | `site_code`, `name`, `site_type`, contact & address fields, `organization_id`, `status` (on PATCH) | `id`, `created_at`, `updated_at` |
| **Participant** | `participant_code`, `study_id`, `site_id`, `screening_date` | `id`, `status` (via transition), `randomization_date`, `enrollment_date`, `completion_date`, `withdrawal_date`, `withdrawal_reason`, timestamps |
| **Adverse Event** | `study_id`, `participant_id`, `site_id`, `event_type`, `description`, `onset_date`, `resolution_date`, `seriousness`, `severity`, `causality`, `expectedness`, `action_taken`, `outcome`, `reporting_deadline` | `id`, `status` (via transition), `reported_by` (auto-set from auth), timestamps |
| **Compliance (All)** | Study/Site/Org foreign keys, numbers, dates, classifications, descriptions | `id`, `status` (via transition), `approval_date`, `resolution_date`, `completed_date`, timestamps |
| **Document** | `organization_id`, `study_id`, `site_id`, `document_type`, `title`, `version`, `expiry_date`, `storage_key`, `file_name`, `file_size`, `mime_type`, `checksum` | `id`, `status` (via transition), `uploaded_by`, `approved_by`, `approved_at`, timestamps |
| **User** | `email`, `full_name`, `phone`, `password` (on create) | `id`, `status`, `hashed_password` (never exposed in API), timestamps |

---

## 7. Centralized Enum Reference

Every API-visible enum corresponds strictly to the following string literals:

1. **`OrganizationType`:** `"cro"`, `"sponsor"`, `"institution"`, `"site_affiliate"`
2. **`OrganizationStatus`:** `"draft"`, `"pending"`, `"active"`, `"suspended"`, `"deactivated"`
3. **`OnboardingStatus`:** `"draft"`, `"submitted"`, `"under_review"`, `"returned"`, `"rejected"`, `"approved"`
4. **`StudyType`:** `"interventional"`, `"observational"`, `"expanded_access"`
5. **`StudyPhase`:** `"phase_1"`, `"phase_1_2"`, `"phase_2"`, `"phase_2_3"`, `"phase_3"`, `"phase_3_4"`, `"phase_4"`, `"na"`
6. **`StudyStatus`:** `"draft"`, `"planned"`, `"active"`, `"suspended"`, `"completed"`, `"terminated"`, `"withdrawn"`
7. **`BlindingType`:** `"open_label"`, `"single_blind"`, `"double_blind"`, `"triple_blind"`
8. **`CTRIStatus`:** `"not_registered"`, `"pending"`, `"registered"`
9. **`ApprovalStatus`:** `"not_submitted"`, `"pending"`, `"approved"`, `"conditional"`, `"rejected"`
10. **`RegulatoryStatus`:** `"not_submitted"`, `"pending"`, `"approved"`, `"conditional"`, `"rejected"`
11. **`SiteType`:** `"hospital"`, `"clinic"`, `"research_center"`, `"academic"`, `"other"`
12. **`SiteStatus`:** `"active"`, `"inactive"`
13. **`StudySiteActivationStatus`:** `"planned"`, `"initiated"`, `"activated"`, `"suspended"`, `"closed"`
14. **`ContractStatus`:** `"not_started"`, `"negotiating"`, `"executed"`, `"terminated"`
15. **`MonitoringStatus`:** `"not_started"`, `"ongoing"`, `"completed"`
16. **`ECStatus`:** `"not_submitted"`, `"pending"`, `"approved"`, `"conditional"`, `"rejected"`, `"expired"`
17. **`AssignmentStatus`:** `"active"`, `"inactive"`, `"removed"`
18. **`ParticipantStatus`:** `"screened"`, `"eligible"`, `"screen_failed"`, `"randomized"`, `"enrolled"`, `"active"`, `"completed"`, `"withdrawn"`, `"discontinued"`
19. **`MilestoneStatus`:** `"pending"`, `"in_progress"`, `"completed"`, `"delayed"`, `"cancelled"`
20. **`AdverseEventType`:** `"ae"`, `"sae"`, `"susar"`
21. **`Seriousness`:** `"non_serious"`, `"serious"`
22. **`Severity`:** `"mild"`, `"moderate"`, `"severe"`, `"life_threatening"`, `"fatal"`
23. **`Causality`:** `"unrelated"`, `"unlikely"`, `"possible"`, `"probable"`, `"definite"`
24. **`Expectedness`:** `"expected"`, `"unexpected"`
25. **`AEOutcome`:** `"recovered"`, `"recovering"`, `"not_recovered"`, `"fatal"`, `"unknown"`
26. **`AEStatus`:** `"open"`, `"under_review"`, `"closed"`
27. **`DeviationSeverity`:** `"minor"`, `"major"`, `"critical"`
28. **`DeviationStatus`:** `"identified"`, `"reported"`, `"resolved"`
29. **`CAPAType`:** `"corrective"`, `"preventive"`
30. **`CAPAStatus`:** `"open"`, `"in_progress"`, `"completed"`, `"verified"`
31. **`DocumentType`:** `"protocol"`, `"investigator_brochure"`, `"icf"`, `"ec_document"`, `"regulatory"`, `"contract"`, `"training"`, `"essential"`, `"other"`
32. **`DocumentStatus`:** `"draft"`, `"under_review"`, `"approved"`, `"superseded"`, `"expired"`, `"archived"`
33. **`UserStatus`:** `"active"`, `"inactive"`, `"suspended"`
34. **`ScopeLevel`:** `"system"`, `"organization"`, `"study"`, `"site"`
35. **`AccessRequestType`:** `"research_pi"`, `"cro_staff"`, `"site_pi"`
36. **`OnboardingRequestStatus`:** `"pending"`, `"under_review"`, `"approved"`, `"rejected"`, `"changes_requested"`
37. **`SiteParticipationStatus`:** `"requested"`, `"pending_government_verification"`, `"pending_site_confirmation"`, `"approved"`, `"rejected"`, `"withdrawn"`
38. **`ParticipationDecisionStatus`:** `"pending"`, `"approved"`, `"rejected"`

---

## 8. Data Serialization Specifications

1. **UUIDs:** Represented as standard 36-character hyphenated lowercase hexadecimal strings:
   `"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`.
2. **Dates:** Calendar dates (e.g., `start_date`, `onset_date`) are serialized in ISO-8601 calendar date format:
   `"YYYY-MM-DD"`.
3. **Timestamps:** Timestamps (e.g., `created_at`, `timestamp`) are serialized in ISO-8601 UTC representation:
   `"YYYY-MM-DDTHH:MM:SS"` or `"YYYY-MM-DDTHH:MM:SS.ffffffZ"`.
4. **Audit Payload Hashes:** Hashes are 64-character lowercase SHA-256 hexadecimal digests. Genesis hash is 64 zeros:
   `"0000000000000000000000000000000000000000000000000000000000000000"`.
