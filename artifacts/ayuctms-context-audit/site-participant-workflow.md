# AyuCTMS Protocol-Driven Site Assignment & Participant Mapping Workflow

- **Evidence Category:** `RUNTIME_CONFIRMED` & `SOURCE_CONFIRMED`
- **Modules Covered:** CRO Site Discovery, Formal Site Participation Requests, Institutional Site PI Decisions, Participant CSV Ingestion, and Lifecycle Mapping.

---

## 1. Approval-Based Site Assignment Workflow

In AyuCTMS, clinical trial sites are **NOT** arbitrarily attached to protocols. Instead, an explicit, bilateral agreement workflow is enforced between the contracted CRO and the institutional Site PI:

```mermaid
flowchart TD
    A[CRO Lead Monitor opens CRO Workspace Dashboard] --> B[Clicks 'Discover & Invite Sites']
    B --> C[GET /api/v1/studies/{id}/eligible-sites]
    C --> D[Selects Accredited Facility e.g. GAH Clinical Site]
    D --> E[POST /api/v1/platform/site-participation-requests]
    E --> F[SiteParticipationRequest created in status: 'pending']
    F --> G[Site PI logs in to Clinical Research Site Console]
    G --> H[Sees Incoming Protocol Invitation under 'Incoming Protocol Requests']
    H --> I[Clicks 'Review & Confirm' -> Opens Institutional Decision Modal]
    I --> J{Institutional PI Decision}
    J -- Approve --> K[POST .../site-decision with decision: 'approved']
    J -- Decline --> L[POST .../site-decision with decision: 'rejected']
    K --> M[StudySite record created/activated for Protocol & Site]
    M --> N[Site is now authorized for Participant Ingestion]
```

---

## 2. Participant Ingestion & Pseudonymization Rules

1. **Target Site Validation:**
   Participants can **only** be imported or enrolled into sites that hold an approved, active `StudySite` linkage. Attempts to ingest participants into an unassigned or pending site fail validation.
2. **Bulk CSV Ingestion Contract (`POST /api/v1/participants/bulk-import`):**
   - Payload:
     ```json
     {
       "study_id": "92966003-40a0-432a-a729-1fd088307b1b",
       "site_id": "bcd98577-689c-4c8f-a873-21a045c04ea4",
       "participants": [
         {
           "participant_code": "ASH-DEL-016",
           "screening_date": "2026-10-01",
           "status": "screening"
         }
       ]
     }
     ```
3. **Pseudonymization & Zero-PII Policy:**
   - Patient names, phone numbers, home addresses, Aadhaar numbers, and national IDs are **strictly prohibited** from the schema and UI.
   - Subjects are tracked exclusively via alphanumeric participant codes (e.g. `ASH-DEL-001`, `ASH-DEL-002`).

---

## 3. Discovered Edge Case Observations

1. **Duplicate Participant Code Handling:**
   Ingestion enforces unique `(study_id, participant_code)` constraints. Duplicates in CSV files are skipped and reported in the bulk response error array.
2. **Site PI Association Gap in Seed Data:**
   In `ctms.db`, Site PI Dr. Patel (`dr.patel.dbg@gah.edu.in`) is associated with organization `GAH`, but the `Site` record `SITE-DBG-01` had `organization_id: null` in seed data, causing `data.site_id` to return `null` in the dashboard until manually linked.
