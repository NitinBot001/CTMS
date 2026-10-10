# Cryptographic Audit Trail & System Verification Page

- **Route:** `/audit`
- **Target Role(s):** Super Admin, Compliance Auditor, Regulatory Inspector
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`audit.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/audit.html)

---

## 1. Page Overview & Functional Purpose
Tamper-evident audit log recording every security-critical mutation, login event, role assignment, participant transition, and protocol state change.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/audit/logs (Returns: list[AuditLogRead] with timestamp, actor, action, resource, diffs)`

---

## 3. Discovered Interactive Controls & Forms
- Audit Filter by Resource Type (`study`, `organization`, `participant`, `user`)
- Audit Filter by Action (`create`, `update`, `transition`, `delete`)
- Date Range selector
- Audit Log Table displaying Timestamp, Actor User ID, Action, Target Resource, JSON Diff Payload
- Export Audit Trail button

---

## 4. State Handling & Edge States
Audit logs are strictly append-only. No user, not even Super Admin, has permission to edit or truncate audit records.

---

## 5. Security & UI Defect Observations
Actor user ID is displayed as raw UUID rather than resolving to user's full name and email in the table view.
