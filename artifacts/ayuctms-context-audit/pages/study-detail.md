# Clinical Study Protocol Detail & Master Workspace

- **Route:** `/studies/:id`
- **Target Role(s):** Assigned Protocol Investigators, Monitors, Administrators
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`study-detail.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/study-detail.html)

---

## 1. Page Overview & Functional Purpose
Central protocol workspace containing trial synopsis, affiliated research sites, study team member roster, participant accrual metrics, and protocol documents.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/studies/{id} (Returns: StudyRead)`
- `GET /api/v1/studies/{id}/sites (Returns: list[StudySiteRead])`
- `GET /api/v1/studies/{id}/team (Returns: list[StudyTeamMemberRead])`

---

## 3. Discovered Interactive Controls & Forms
- Protocol Header with CTRI status and GCP ethics badge
- Tabs: 'Overview', 'Participating Sites', 'Team Members', 'Documents', 'Milestones'
- Participating Sites Table with Activation Status, EC Approval, Target Sample
- Button: 'Add Site' / 'Request Site Participation'
- Status Transition trigger (e.g. from `draft` to `active`)

---

## 4. State Handling & Edge States
If user lacks scope for this study, backend returns HTTP 403 Forbidden with clear access denied message.

---

## 5. Security & UI Defect Observations
Study status transition dialog does not validate that at least one site is activated before transitioning study from `approved` to `active`.
