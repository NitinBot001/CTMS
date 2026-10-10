# Organizations Directory Page

- **Route:** `/organizations`
- **Target Role(s):** System Admin, Super Admin, Sponsor Admin, CRO Admin
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`organizations.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/organizations.html)

---

## 1. Page Overview & Functional Purpose
Directory of registered clinical research organizations, sponsors, CROs, academic medical centers, and government institutes in the AyuCTMS network.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/organizations (Returns: list[OrganizationRead])`
- `POST /api/v1/organizations (Create Organization Mutation)`

---

## 3. Discovered Interactive Controls & Forms
- Search and filter controls by organization type (`sponsor`, `cro`, `institution`)
- Button: 'Register Organization' -> opens `OrganizationModal`
- Organization Table with Name, Type, Reg Number, Location, Status Badge
- Row click navigates to `/organizations/:id`

---

## 4. State Handling & Edge States
Shows skeleton loaders during fetch, empty state when zero organizations match filter.

---

## 5. Security & UI Defect Observations
Ordinary users cannot view organizations outside their membership unless holding system:read permission.
