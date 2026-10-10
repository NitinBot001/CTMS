# Super Admin Operations Oversight Dashboard

- **Route:** `/dashboard (Resolved role: super_admin)`
- **Target Role(s):** Platform Super Admin (Government Verification Team)
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`dashboard-super-admin.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-super-admin.html)

---

## 1. Page Overview & Functional Purpose
Read-only cross-organizational oversight dashboard presenting platform-wide telemetry across registered Sponsors, CROs, and active protocols without operational mutation leakage.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/dashboard/summary (Returns: { role: 'super_admin', super_admin: SuperAdminOverviewResponse })`

---

## 3. Discovered Interactive Controls & Forms
- Telemetry Refresh Button (`onClick={() => refetch()}`)
- Quick Link: 'Review Onboarding Applications' -> navigates to `/super-admin`
- Quick Link: 'Cryptographic Audit Trail' -> navigates to `/audit`
- Registered Sponsors Card with Total Count & Detail Table
- Registered CROs Card with Total Count & Detail Table
- Active Protocols Card with Multi-center Site and Participant Rollups

---

## 4. State Handling & Edge States
Read-only banner clearly indicates government verification oversight mode. No operational buttons (e.g. approve site, add participant) exist here.

---

## 5. Security & UI Defect Observations
Dashboard renders 'Received NaN for children' console warning if planned_sample_size calculation encounters missing denominator.
