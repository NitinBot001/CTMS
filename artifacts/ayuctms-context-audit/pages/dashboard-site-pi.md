# Clinical Research Site Console Dashboard

- **Route:** `/dashboard (Resolved role: site_pi)`
- **Target Role(s):** Site Principal Investigator / Site Coordinator
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`dashboard-site-pi.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-site-pi.html)

---

## 1. Page Overview & Functional Purpose
Site-specific clinical console displaying institutional participation requests from CROs, active protocols conducted at the site, patient enrollment counts, and open safety reports.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/dashboard/summary (Returns: { role: 'site_pi', site_pi: SitePIDashboardResponse })`
- `POST /api/v1/platform/site-participation-requests/{id}/site-decision (Confirmation Mutation)`

---

## 3. Discovered Interactive Controls & Forms
- Institutional Site Banner displaying site name, site code, and city
- Active Protocols Metric Card
- Pending CRO Requests Metric Card
- Enrolled Subjects Metric Card
- Open Safety Events Metric Card
- Incoming Protocol Requests Section with 'Review & Confirm' trigger
- Institutional Decision Modal with Radio buttons ('Approve' / 'Decline') and Notes textarea

---

## 4. State Handling & Edge States
Displays warning banner if site PI has no site link established (`site_id == null`). Incoming requests list shows empty state when zero requests are pending.

---

## 5. Security & UI Defect Observations
Dr. Patel account has `site_id: null` in dashboard summary response because organization membership role does not carry direct `site_id` FK.
