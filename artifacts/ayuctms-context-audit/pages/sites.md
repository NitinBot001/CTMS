# Clinical Research Sites Directory Page

- **Route:** `/sites`
- **Target Role(s):** Site PI, CRO Monitor, Super Admin, System Admin
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`sites.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/sites.html)

---

## 1. Page Overview & Functional Purpose
Directory of accredited clinical trial sites, Ayurvedic hospitals, university research facilities, and medical colleges.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/sites (Returns: list[SiteRead])`
- `POST /api/v1/sites (Site Create Mutation)`

---

## 3. Discovered Interactive Controls & Forms
- Search input by Site Name, Code, or City
- Site Type filter (`hospital`, `clinic`, `academic_institute`, `independent_center`)
- Button: 'Register Site' -> opens `SiteModal`
- Sites Table with Site Code, Facility Name, City, State, Affiliated Org, Status Badge
- Row click navigates to `/sites/:id`

---

## 4. State Handling & Edge States
Returns all registered sites; CROs and PIs can discover eligible sites across the country.

---

## 5. Security & UI Defect Observations
No geospatial map view or distance radius filter for multi-center trial site feasibility.
