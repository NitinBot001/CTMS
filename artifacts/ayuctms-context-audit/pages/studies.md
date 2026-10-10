# Clinical Studies & Protocol Directory Page

- **Route:** `/studies`
- **Target Role(s):** Sponsor PI, CRO Monitor, Site PI, Super Admin
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`studies.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/studies.html)

---

## 1. Page Overview & Functional Purpose
Comprehensive inventory of Ayurvedic clinical trials and research protocols governed under CTRI and GCP guidelines.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/studies (Returns: list[StudyRead] scoped to user permissions)`

---

## 3. Discovered Interactive Controls & Forms
- Search Input by Protocol Number or Study Title
- Phase Filter dropdown (Phase I, Phase II, Phase III, Phase IV)
- Status Filter dropdown (Draft, Active, Completed, Suspended)
- Button: 'New Clinical Study' (visible only with `study:create` permission)
- Studies Table with Study Code, Protocol Number, Phase, Sponsor, Sites Count, Status
- Row click navigates to `/studies/:id`

---

## 4. State Handling & Edge States
Strictly scoped: Ordinary users see only studies where their organization is sponsor/CRO or where they have active team membership.

---

## 5. Security & UI Defect Observations
Super Admin can view all studies, but currently cannot transition study states directly from this screen.
