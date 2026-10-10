# Access Pending / Unassigned Dashboard State

- **Route:** `/dashboard (Resolved role: unassigned)`
- **Target Role(s):** Newly Registered / Unassigned / Pending Users
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`dashboard-access-pending.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-access-pending.html)

---

## 1. Page Overview & Functional Purpose
Safe restricted state presented when authenticated user's role or organizational assignment cannot be resolved. Prevents data leakage by suppressing all operational metrics.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/dashboard/summary (Returns: { role: 'unassigned' })`

---

## 3. Discovered Interactive Controls & Forms
- Security Lock Icon
- Notice: 'Access Authorization Pending'
- Explanation: 'Your account is authenticated, but no active role assignment or study purview was resolved.'
- Refresh Status Button (`onClick={() => refetch()}`)
- Sign Out Button

---

## 4. State Handling & Edge States
Completely hides all navigation counts, protocol cards, and operational links. User remains safely sandboxed.

---

## 5. Security & UI Defect Observations
`admin@ayuctms.gov.in` (System Administrator) is resolved to this unassigned dashboard because the role resolver looks for org memberships rather than system administrator bypass.
