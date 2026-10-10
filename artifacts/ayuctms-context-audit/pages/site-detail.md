# Clinical Site Detail & Institutional Facility Page

- **Route:** `/sites/:id`
- **Target Role(s):** Site Investigators, Assigned CROs, Platform Administrators
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`site-detail.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/site-detail.html)

---

## 1. Page Overview & Functional Purpose
Site facility profile detailing institutional address, Ethics Committee accreditation, active clinical trials, and site staff roster.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/sites/{id} (Returns: SiteRead)`
- `GET /api/v1/sites/{id}/studies (Returns: list of assigned studies)`

---

## 3. Discovered Interactive Controls & Forms
- Facility Metadata Card with address and telephone
- Ethics Committee Accreditation status badge
- Active Protocols conducting research at this facility
- Site Investigators list
- Button: 'Edit Site Details' (requires `site:manage` permission)

---

## 4. State Handling & Edge States
Displays empty study list if facility is newly registered and has not accepted any protocol invitations.

---

## 5. Security & UI Defect Observations
EC approval documents cannot be uploaded directly on this page; must navigate to `/documents` module.
