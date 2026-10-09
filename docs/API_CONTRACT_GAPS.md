# AyuCTMS — API Contract Discrepancy & Gap Report

**Status:** Authoritative Audit Record  
**Baseline Inputs:**
1. `docs/CRO_SPONSOR_DATA_DICTIONARY.md` (Source Field Data Dictionary)
2. `docs/ER_MODEL.md` (Conceptual Entity-Relationship Architecture)
3. FastAPI Router Implementations (`backend/app/api/v1/`)
4. Pydantic v2 Schemas (`backend/app/schemas/`)
5. SQLAlchemy 2.0 Async Models (`backend/app/models/`)

This document records all detected discrepancies between the conceptual/source data model and the actual implemented REST API contract, categorizing whether each is a **Documentation Discrepancy**, an **Implementation Design Choice**, or a **Frontend Consumption Consideration**.

---

## Summary of Discrepancies

| Gap ID | Domain | Area | Finding / Discrepancy | Classification | Frontend Impact / Guideline |
|---|---|---|---|---|---|
| **GAP-01** | Organizations / Studies | Nested POST Endpoints | Redundant foreign keys in request bodies (`organization_id`, `study_id`) removed. Parent IDs now derive cleanly from URL path parameters. | **RESOLVED** (API Hardened) | **Resolved:** Frontend passes parent ID in URL path; request body contains only child resource properties. |
| **GAP-02** | Compliance & Regulatory | Granular Resource Retrieval | No dedicated `GET /compliance/{domain}/{id}` endpoints for individual Ethics, Regulatory, Deviation, or CAPA records. | Architectural Pattern | Frontend must use list endpoints with query filters (`study_id`, `site_id`, `organization_id`) to find specific items. |
| **GAP-03** | Global Pagination | List Response Envelope | Schema `common.PaginatedResponse[T]` exists, but all list endpoints return raw flat JSON arrays (`list[T]`) using `skip` and `limit`. | Implementation Choice | **Mandatory:** Frontend must parse responses as direct arrays `response.data: T[]`, not enveloped objects `response.data.items`. |
| **GAP-04** | Documents | Binary File Transfer | Document API handles metadata, audit, and lifecycle transitions only. No multipart binary upload/download endpoints exist in the REST API. | Architecture Boundary | Binary files are stored in object storage (e.g. S3/MinIO); frontend registers metadata (`storage_key`, `checksum`, `file_size`) via REST API. |
| **GAP-05** | Users & RBAC | Role-Permission Mutation | No REST endpoint for attaching/detaching permissions to roles dynamically (`POST /roles/{role_id}/permissions`). | Security Design | Roles, system roles, and baseline permission mappings are provisioned at seed/bootstrap time. REST API exposes read-only lists of roles and permissions. |
| **GAP-06** | Studies | Milestone Creation API | No direct `POST /studies/{study_id}/milestones` endpoint; milestones are tracked per study and retrieved via `GET /studies/{study_id}/milestones` and `GET /portfolio/milestones/upcoming`. | Implementation Nuance | Milestones are managed through protocol schedule baseline setup; portfolio endpoints expose operational visibility. |

---

## Detailed Gap Analyses

### GAP-01: Redundant Foreign Key in Nested Endpoint Request Bodies [RESOLVED]
- **Previous State:**
  - `POST /api/v1/organizations/{org_id}/members` expected body schema `OrganizationMemberCreate` requiring `organization_id: UUID`.
  - `POST /api/v1/studies/{study_id}/team` expected body schema `StudyTeamMemberCreate` requiring `study_id: UUID`.
  - `POST /api/v1/studies/{study_id}/sites` expected body schema `StudySiteCreate` requiring `study_id: UUID`.
- **Hardened Implementation:**
  Redundant parent foreign keys have been eliminated from all three schemas (`OrganizationMemberCreate`, `StudyTeamMemberCreate`, `StudySiteCreate`). The parent ID is supplied strictly and unambiguously via the URL path parameter and mapped into the model on the backend.
- **Resolution for Frontend:**
  The frontend API client supplies the parent UUID exclusively in the URL path. Request bodies now only provide child payload fields (`user_id`, `role_id`, `site_id`, `recruitment_target`, etc.), preventing parameter mismatch errors.

### GAP-02: Compliance Subdomain Single-Item Retrieval
- **Observed Behavior:**
  The `compliance` router provides list and transition endpoints for Ethics Approvals, Regulatory Submissions, Protocol Deviations, and CAPA Records, but omits singular `GET /{id}` endpoints.
- **Backend Implementation Logic:**
  Compliance records are inherently study-bound and examined in the context of a clinical trial or site audit. Filtering `GET /api/v1/compliance/ethics?study_id={id}` retrieves all approvals for that study.
- **Resolution for Frontend:**
  Frontend details views should filter by `study_id` or cache the list results in client state.

### GAP-03: Flat Array Response Format across List Endpoints
- **Observed Behavior:**
  In `app/schemas/common.py`, a generic `PaginatedResponse[T]` is defined (`items`, `total`, `page`, `size`). However, all 12 list endpoints in the API return `list[T]` directly with status 200:
  - `GET /api/v1/organizations` -> `list[OrganizationRead]`
  - `GET /api/v1/studies` -> `list[StudyRead]`
  - `GET /api/v1/sites` -> `list[SiteRead]`
  - `GET /api/v1/participants` -> `list[ParticipantRead]`
  - etc.
- **Resolution for Frontend:**
  React query hooks must expect array payloads directly. If client-side pagination count is needed, client tracks returned array length or queries with appropriate offset `skip` and `limit`.

### GAP-04: Document Storage Architecture
- **Observed Behavior:**
  `POST /api/v1/documents` accepts `DocumentCreate` containing JSON fields: `storage_key`, `file_name`, `file_size`, `mime_type`, `checksum`. It does not accept `multipart/form-data`.
- **Classification:** Clean Separation of Concerns.
- **Resolution for Frontend:**
  The application follows modern 21 CFR Part 11 cloud architecture: binary files are streamed directly to cloud object storage (e.g., S3/GCS bucket), and the resulting `storage_key` and cryptographic `checksum` (SHA-256) are committed to AyuCTMS for audit and compliance lifecycle tracking.

### GAP-05: RBAC Role & Permission Mutations
- **Observed Behavior:**
  `app/api/v1/users.py` provides:
  - `POST /api/v1/roles` (create role with `name`, `description`, `scope_level`)
  - `GET /api/v1/roles` (list all roles)
  - `GET /api/v1/permissions` (list all system permissions)
  It does not provide an endpoint to attach permissions to roles.
- **Resolution for Frontend:**
  Role definitions and permission assignments are managed by platform administrators via database migrations and initial seed configuration (`scripts/seed.py`). Frontend UI should display available roles and permissions as select options.

---

## Conclusion
None of these discrepancies require modifying backend business logic. They represent clear implementation realities that are documented in `docs/API_CONTRACT.md` so that frontend engineers can integrate cleanly without guesswork.
