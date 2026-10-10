# Super Admin Platform Verification Console Page

- **Route:** `/super-admin`
- **Target Role(s):** Platform Super Admin (Government Verification Team)
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`super-admin-overview.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/super-admin-overview.html)

---

## 1. Page Overview & Functional Purpose
Dedicated platform control console where the Government Verification Team reviews onboarding applications, verifies institutional credentials, and provisions organizations.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/platform/onboarding-requests (Returns: list[OnboardingRequestRead])`
- `PATCH /api/v1/platform/onboarding-requests/{id}/review (Review Status Mutation)`
- `POST /api/v1/platform/onboarding-requests/{id}/approve (Atomic Provisioning Mutation)`
- `GET /api/v1/platform/super-admin/me (Profile Probe)`

---

## 3. Discovered Interactive Controls & Forms
- Super Admin Banner: 'Government Verification Team — Platform Control'
- Tabs: 'Pending Applications', 'Under Review', 'Approved Organizations', 'Rejected'
- Onboarding Requests Table with Applicant, Organization, Type, Submitted Date, Status
- Action: 'Review Application' -> opens Review Modal with notes textarea
- Action: 'Approve & Provision' -> triggers atomic organization and admin user creation with invitation token

---

## 4. State Handling & Edge States
Enforces state transition rules (`pending` -> `under_review` -> `approved`). Double approval is protected by row-level idempotency.

---

## 5. Security & UI Defect Observations
Review modal notes field is optional; ideally, rejection should mandate a justification reason.
