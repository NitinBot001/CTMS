# Organization Detail & Member Governance Page

- **Route:** `/organizations/:id`
- **Target Role(s):** Organization Members, System Admin, Super Admin
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`organization-detail.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/organization-detail.html)

---

## 1. Page Overview & Functional Purpose
Detailed institutional profile displaying contact details, accreditation numbers, registered clinical sites, and authorized member rosters.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/organizations/{id} (Returns: OrganizationRead)`
- `GET /api/v1/organizations/{id}/members (Returns: list[OrganizationMemberRead])`

---

## 3. Discovered Interactive Controls & Forms
- Institutional Metadata Card
- Member Roster Table with Name, Email, Assigned Role, Status
- Button: 'Invite Team Member' (if admin)
- Back to Organizations navigation link

---

## 4. State Handling & Edge States
Returns HTTP 403 / Access Denied if non-admin attempts to view foreign organization details.

---

## 5. Security & UI Defect Observations
Organization edit mutation requires full payload; partial updates without registration_number can fail validation.
