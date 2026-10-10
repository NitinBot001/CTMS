# Institutional Onboarding & Access Request Screen

- **Route:** `/request-access`
- **Target Role(s):** Public / Organization Applicants (Anonymous)
- **Evidence Level:** `RUNTIME_CONFIRMED`
- **Rendered Snapshot:** [`request-access.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/request-access.html)

---

## 1. Page Overview & Functional Purpose
Public-facing registration form for research institutions, sponsors, and CROs seeking access to the AyuCTMS platform under government verification.

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
- `POST /api/v1/platform/onboarding-requests (Body: OnboardingRequestCreate -> Returns: OnboardingRequestRead)`

---

## 3. Discovered Interactive Controls & Forms
- Applicant Full Name input
- Official Email Address input
- Contact Phone input
- Organization Name input
- Organization Type dropdown (`sponsor`, `cro`, `institution`, `site_affiliate`)
- Website URL input
- Geographic Location inputs (Country, State, City)
- Institutional Description textarea
- Submit Request button
- Back to Login link

---

## 4. State Handling & Edge States
Displays submission success state with request tracking ID. Validates email format and required fields via react-hook-form + Zod.

---

## 5. Security & UI Defect Observations
Does not enforce official institutional email domain validation on client side; permits generic free email addresses like gmail.com.
