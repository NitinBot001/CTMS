# Ethics, Regulatory & CAPA Compliance Page

- **Route:** `/compliance`
- **Target Role(s):** Ethics Committee, QA Lead, Compliance Auditor, Super Admin
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`compliance.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/compliance.html)

---

## 1. Page Overview & Functional Purpose
Governance hub for Ethics Committee approvals, regulatory submissions to Ministry of Ayush / CDSCO, protocol deviations, and Corrective Action Plans (CAPA).

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/compliance/capa (Returns: list[CAPARecordRead])`
- `GET /api/v1/compliance/ethics-approvals (Returns: list[EthicsApprovalRead])`
- `GET /api/v1/compliance/protocol-deviations (Returns: list[ProtocolDeviationRead])`

---

## 3. Discovered Interactive Controls & Forms
- Tabs: 'Ethics Committee Approvals', 'Regulatory Filings', 'Protocol Deviations', 'CAPA Records'
- CAPA Records Table with Tracking ID, Root Cause, Remediation Plan, Status
- Button: 'Initiate CAPA Investigation'
- Protocol Deviation Classification badges (`minor`, `major`, `critical`)

---

## 4. State Handling & Edge States
Displays compliance health rating and audit readiness metrics.

---

## 5. Security & UI Defect Observations
CAPA closure requires electronic signature confirmation which is currently simulated without secondary authentication.
