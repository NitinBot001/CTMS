# AyuCTMS Login Screen

- **Route:** `/login`
- **Target Role(s):** Public / All Users (Anonymous)
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`login.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/login.html)

---

## 1. Page Overview & Functional Purpose
Entry point for authentication into AyuCTMS. Provides email and password inputs, submit trigger, and link to request institutional access.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `POST /api/v1/auth/login (Body: { email, password } -> Returns: { access_token, token_type, user })`
- `GET /api/v1/platform/super-admin/me (Follow-up role probe upon authentication)`

---

## 3. Discovered Interactive Controls & Forms
- Email Address Input (`type=email`, required)
- Password Input (`type=password`, required)
- Sign In Button (`variant=primary`, triggers auth mutation)
- Link: 'Request institutional access' -> navigates to `/request-access`

---

## 4. State Handling & Edge States
Displays inline red banner on invalid credentials (HTTP 401). Disables button and displays loading spinner during JWT resolution.

---

## 5. Security & UI Defect Observations
No 'Forgot Password' recovery link. Force Password Change modal is triggered only after token is stored in localStorage.
