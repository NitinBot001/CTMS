# Platform User Access Control & RBAC Management Page

- **Route:** `/admin`
- **Target Role(s):** System Administrator
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`admin.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/admin.html)

---

## 1. Page Overview & Functional Purpose
User management and RBAC configuration console for platform administrators.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `GET /api/v1/users (Returns: list[UserRead])`
- `POST /api/v1/users (User Provisioning)`

---

## 3. Discovered Interactive Controls & Forms
- Users Directory Table with Name, Email, Status, Must Change Password flag
- Button: 'Create User'
- User Role Assignment Modal

---

## 4. State Handling & Edge States
Restricted by `user:manage` permission. Unauthorized users are blocked by route guard.

---

## 5. Security & UI Defect Observations
Sidebar link for Access Control correctly requires `user:manage`, but does not provide inline password reset trigger.
