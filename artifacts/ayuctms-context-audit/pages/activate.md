# Account & Invitation Activation Screen

- **Route:** `/activate`
- **Target Role(s):** Invited Organization Administrators / Anonymous with Token
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`activate.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/activate.html)

---

## 1. Page Overview & Functional Purpose
Invitation activation portal where newly provisioned institutional administrators establish credentials using an invitation token received via email.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `POST /api/v1/platform/activate (Body: { token, new_password } -> Returns: { message, email })`

---

## 3. Discovered Interactive Controls & Forms
- Activation Token input (prefilled via `?token=` query parameter)
- New Password input (min 8 characters)
- Confirm New Password input
- Activate Account button
- Link to Sign In

---

## 4. State Handling & Edge States
Displays error banner if token is expired, used, or malformed. On success, transitions user to login screen.

---

## 5. Security & UI Defect Observations
Token in URL query param (`?token=...`) can leak into browser history or referrers if external assets are requested.
