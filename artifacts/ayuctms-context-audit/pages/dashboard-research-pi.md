# Research Principal Investigator Hub Dashboard

- **Route:** `/dashboard (Resolved role: research_pi)`
- **Target Role(s):** Sponsor-side Principal Investigator / Research Lead
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`dashboard-research-pi.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-research-pi.html)

---

## 1. Page Overview & Functional Purpose
Protocol delivery oversight hub displaying assigned clinical trials, affiliated research site activations, recruitment progression, and scheduled trial milestones.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/dashboard/summary (Returns: { role: 'research_pi', research_pi: ResearchPIDashboardResponse })`

---

## 3. Discovered Interactive Controls & Forms
- Assigned Studies Metric Card
- Active Sites Metric Card
- Team Verifications Metric Card
- Upcoming Milestones Metric Card
- Research Studies Table with Phase, Status, Site Counts, Sample Size Progress Bars
- Upcoming Scheduled Protocol Targets List

---

## 4. State Handling & Edge States
Empty state displays guidance if PI has not been assigned to any studies yet. Scoped strictly to studies in PI purview.

---

## 5. Security & UI Defect Observations
In seed database, PI Dr. Rajesh Sharma has a site_id assigned in study_team_members, which causes backend rbac resolver to categorize him as site_pi rather than research_pi.
