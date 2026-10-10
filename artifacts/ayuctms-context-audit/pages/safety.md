# Pharmacovigilance & Adverse Events Registry Page

- **Route:** `/safety`
- **Target Role(s):** Site PI, CRA, Safety Officer, Pharmacovigilance Officer
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`safety.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/safety.html)

---

## 1. Page Overview & Functional Purpose
Safety monitoring console tracking Adverse Events (AE) and Serious Adverse Events (SAE) occurring during Ayurvedic interventions.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/safety/adverse-events (Returns: list[AdverseEventRead])`
- `POST /api/v1/safety/adverse-events (Log Safety Event Mutation)`

---

## 3. Discovered Interactive Controls & Forms
- Severity Filter (`mild`, `moderate`, `severe`, `life_threatening`)
- Seriousness Toggle (`SAE Only`)
- Button: 'Report Adverse Event' -> opens `AdverseEventModal`
- Adverse Events Table with Event Term, Participant Code, Onset Date, Severity, Causality, Status
- Row click navigates to `/safety/:id`

---

## 4. State Handling & Edge States
SAE events trigger high-priority warning indicators and expedited reporting deadlines (e.g. 24-hour notification under CDSCO/Ayush guidelines).

---

## 5. Security & UI Defect Observations
Endpoint in router is `/safety/adverse-events`, but frontend initially curled `/safety`, which returned HTTP 404 until mapped correctly.
