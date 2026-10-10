# AyuCTMS Runtime Errors, Console Logs & Defect Catalog

- **Evidence Category:** `RUNTIME_CONFIRMED`
- **Logged During:** Live server startup, browser hydration simulation, and API endpoint verification.

---

## 1. Discovered Runtime Errors & Exceptions

### Error 1: MissingGreenlet during Lazy Load in Async SQLAlchemy
- **Trigger:** Calling `tm.role` or `m.role` on ORM models inside async session without `selectinload` / `joinedload`.
- **Stack Trace:**
  ```text
  sqlalchemy.exc.StatementError: (sqlalchemy.exc.MissingGreenlet) greenlet_spawn has not been called;
  can't call await_() here. Was IO attempted in an unexpected place?
  [SQL: SELECT roles.name FROM roles WHERE roles.id = ?]
  ```
- **Root Cause:** SQLAlchemy 2.0 async engine does not allow implicit synchronous IO when accessing related attributes.
- **Affected Areas:** `app/core/rbac.py` functions querying user memberships and team assignments. Resolved by wrapping queries with `.options(selectinload(...))`.

### Error 2: React SSR / Hydration `NaN` Attribute Warning
- **Trigger:** Rendering `SuperAdminOverviewDashboard` when `planned_sample_size` is missing or enrollment ratio evaluates to `0 / 0`.
- **Console Output:**
  ```text
  Received NaN for the `children` attribute. If this is expected, cast the value to a string.
  ```
- **Root Cause:** Math calculation in progress percentage evaluates to `NaN` when `planned_sample_size == 0` or `null`.

### Error 3: HTTP 404 on Safety API Route
- **Trigger:** Frontend or audit probe requesting `GET /api/v1/safety`.
- **Response:**
  ```json
  {"detail": "Not Found"}
  ```
- **Root Cause:** In `backend/app/api/v1/safety.py`, endpoints are mounted at `/safety/adverse-events`, but some generic components expected a root `/safety` resource.

### Error 4: System Admin Role Resolved to Unassigned Dashboard
- **Trigger:** Logging in as `admin@ayuctms.gov.in` (System Administrator) and calling `GET /api/v1/dashboard/summary`.
- **Response:**
  ```json
  {"role": "unassigned", "super_admin": null, "research_pi": null, "cro": null, "site_pi": null}
  ```
- **Root Cause:** `resolve_user_role` checks `SuperAdminProfile` (which this user does not have), then checks `OrganizationMember` (which this user does not have), and finally falls through to `"unassigned"`. System Administrator role is not mapped to an administrative dashboard builder.

---

## 2. Browser Console Warnings Observed

1. `Warning: Each child in a list should have a unique 'key' prop` in `UpcomingMilestones.tsx` when rendering scheduled milestones without an explicit `id`.
2. `Chunk size warning: Some chunks are larger than 500 kB after minification (dist/assets/index-IUsXOJtW.js: 582 kB)`.
