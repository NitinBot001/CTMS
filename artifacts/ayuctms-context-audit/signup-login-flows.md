# AyuCTMS Authentication, Registration & Onboarding Flows

- **Evidence Category:** `RUNTIME_CONFIRMED`
- **Scope:** Public access request, Super Admin review, invitation tokens, activation, login, and force password change.

---

## 1. End-to-End Onboarding Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Applicant as Organization Applicant
    participant UI as Frontend (/request-access)
    participant API as Backend Platform API
    participant DB as ctms.db
    actor SuperAdmin as Government Verification Team
    actor AdminUser as Invited Org Admin

    Applicant->>UI: Fills Access Request Form
    UI->>API: POST /api/v1/platform/onboarding-requests
    API->>DB: INSERT into onboarding_requests (status = 'pending')
    API-->>UI: Return HTTP 201 Created + Request ID
    
    SuperAdmin->>UI: Logs in to /super-admin console
    UI->>API: GET /api/v1/platform/onboarding-requests
    API-->>UI: Returns pending applications
    SuperAdmin->>UI: Clicks "Approve & Provision"
    UI->>API: POST /api/v1/platform/onboarding-requests/{id}/approve
    Note over API,DB: Atomic Transaction: Create Org + Create User + Create InvitationToken + Set status = 'approved'
    API-->>UI: Returns ProvisionResult + Raw Invitation Token
    
    AdminUser->>UI: Opens /activate?token=<TOKEN>
    AdminUser->>UI: Sets New Permanent Password
    UI->>API: POST /api/v1/platform/activate
    API->>DB: Validates SHA-256 hash, marks token used, updates user status = 'active'
    API-->>UI: Return HTTP 200 Success
    
    AdminUser->>UI: Navigates to /login
    UI->>API: POST /api/v1/auth/login
    API-->>UI: Returns JWT Bearer Token
```

---

## 2. Password Security & First-Login Policy

- **Hashing Algorithm:** `bcrypt` (12 rounds) adhering to OWASP minimum.
- **Minimum Length:** 8 characters.
- **Forced Password Change Mechanism:**
  - Column `users.must_change_password` (boolean).
  - When provisioned or bootstrapped via temporary password, `must_change_password = True`.
  - Upon authentication, if `must_change_password === true`, `AppShell` immediately opens the blocking `ForcePasswordChangeModal`.
  - User cannot dismiss modal or access operational screens until `POST /api/v1/platform/change-password` or `first-login-setup` completes.

---

## 3. Discovered Vulnerabilities & Deviations

1. **Email Domain Verification:**
   The public `/request-access` form does not validate corporate or institutional email domains. Generic webmail domains (e.g. `gmail.com`) are allowed and were used in the seed database (`nitinbhujwa@gmail.com`).
2. **Token Exposure in URL:**
   The activation link relies on query parameter `?token=...`, exposing the one-time token in server access logs and browser history.
3. **Session Termination on Password Change:**
   Changing password updates `password_changed_at` in the database, but does not actively revoke previously issued JWT tokens before their 24-hour expiry.
