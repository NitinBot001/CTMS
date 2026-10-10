# Participants & Patient Subject Directory Page

- **Route:** `/participants`
- **Target Role(s):** Site PI, CRA, Study Coordinator, Data Entry Operator
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`participants.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/participants.html)

---

## 1. Page Overview & Functional Purpose
Clinical trial participant subject registry tracking recruitment, screening, enrollment, randomization, and trial completion across sites.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/participants (Returns: list[ParticipantRead] scoped to study/site access)`
- `POST /api/v1/participants (Single Participant Ingestion)`
- `POST /api/v1/participants/bulk-import (Bulk CSV Ingestion)`

---

## 3. Discovered Interactive Controls & Forms
- Search Input by Participant Pseudonym Code (e.g. `ASH-DEL-001`)
- Status Filter dropdown (`screening`, `enrolled`, `randomized`, `completed`, `withdrawn`)
- Button: 'Enroll Participant' -> opens `ParticipantModal`
- Button: 'Bulk Ingest' (for CRO / Coordinator)
- Participant Table with Subject Code, Protocol, Site, Screening Date, Status
- Row click navigates to `/participants/:id`

---

## 4. State Handling & Edge States
Full pseudonymization: Patient Personally Identifiable Information (PII) is NEVER collected or displayed. Only alphanumeric subject codes exist.

---

## 5. Security & UI Defect Observations
Date filters for screening date range are absent in the table toolbar.
