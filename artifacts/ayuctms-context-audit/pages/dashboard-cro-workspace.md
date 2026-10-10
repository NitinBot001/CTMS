# CRO Trial Operations Workspace Dashboard

- **Route:** `/dashboard (Resolved role: cro)`
- **Target Role(s):** CRO Lead Monitor / CRA / CRO Staff
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`dashboard-cro-workspace.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-cro-workspace.html)

---

## 1. Page Overview & Functional Purpose
Multi-center protocol orchestration console enabling CRO monitors to oversee contracted studies, discover eligible clinical sites, issue participation requests, and execute bulk participant imports.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/dashboard/summary (Returns: { role: 'cro', cro: CRODashboardResponse })`
- `GET /api/v1/studies/{study_id}/eligible-sites (Discovery Query)`
- `POST /api/v1/platform/site-participation-requests (Site Invitation Mutation)`
- `POST /api/v1/participants/bulk-import (CSV Ingestion Mutation)`

---

## 3. Discovered Interactive Controls & Forms
- Eligible Sites Metric Card
- Pending Site Requests Metric Card
- Participants in Scope Metric Card
- Button: 'Discover & Invite Sites' -> triggers Site Discovery Dialog
- Button: 'Bulk Ingest Participants' -> triggers CSV Participant Import Dialog
- Contracted Protocols Table with Enrolled vs Target counts
- Recent Site Assignment Requests Table

---

## 4. State Handling & Edge States
Displays empty workspace guidance if CRO organization has not been contracted for any clinical protocols.

---

## 5. Security & UI Defect Observations
If CRO CRA account is created without primary organization assignment, dashboard resolves to unassigned access-pending state.
