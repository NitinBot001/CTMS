# AyuCTMS Comprehensive Route Inventory

- **Evidence Category:** `SOURCE_CONFIRMED` & `RUNTIME_CONFIRMED`
- **Authoritative Router File:** `frontend/src/app/router/AppRouter.tsx`

---

## 1. Complete Route Inventory Table

| Route Path | Associated Page Component | Access Tier | Required Role / Permission | Layout Wrapper | Snapshot Ref |
|---|---|---|---|---|---|
| `/login` | `LoginPage` | Public | Anonymous | None (Standalone Fullpage) | [`login.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/login.html) |
| `/request-access` | `RequestAccessPage` | Public | Anonymous | None (Standalone Fullpage) | [`request-access.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/request-access.html) |
| `/activate` | `AccountActivationPage` | Public | Anonymous with Token | None (Standalone Fullpage) | [`activate.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/activate.html) |
| `/` | Redirects to `/dashboard` | Protected | Authenticated | `AppShell` | N/A |
| `/dashboard` | `DashboardPage` | Protected | All Authenticated | `AppShell` | Dispatches dynamically based on resolved role |
| ↳ `/dashboard` (Super Admin) | `SuperAdminOverviewDashboard` | Protected | Super Admin (`super_admin`) | `AppShell` | [`dashboard-super-admin.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-super-admin.html) |
| ↳ `/dashboard` (Research PI) | `ResearchPIDashboard` | Protected | Sponsor PI (`research_pi`) | `AppShell` | [`dashboard-research-pi.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-research-pi.html) |
| ↳ `/dashboard` (CRO Workspace) | `CROWorkspaceDashboard` | Protected | CRO Monitor (`cro`) | `AppShell` | [`dashboard-cro-workspace.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-cro-workspace.html) |
| ↳ `/dashboard` (Site PI) | `SitePIDashboard` | Protected | Site PI (`site_pi`) | `AppShell` | [`dashboard-site-pi.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-site-pi.html) |
| ↳ `/dashboard` (Unassigned) | `AccessPendingDashboard` | Protected | Unassigned (`unassigned`) | `AppShell` | [`dashboard-access-pending.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/dashboard-access-pending.html) |
| `/organizations` | `OrganizationListPage` | Protected | `organizations:read` / All Auth | `AppShell` | [`organizations.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/organizations.html) |
| `/organizations/:id` | `OrganizationDetailPage` | Protected | Org Member / Admin | `AppShell` | [`organization-detail.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/organization-detail.html) |
| `/studies` | `StudyListPage` | Protected | `studies:read` / Scoped | `AppShell` | [`studies.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/studies.html) |
| `/studies/new` | `StudyCreatePage` | Protected | `studies:create` (Sponsor PI / Admin) | `AppShell` | [`study-create.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/study-create.html) |
| `/studies/:id` | `StudyDetailPage` | Protected | Assigned Team / Admin | `AppShell` | [`study-detail.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/study-detail.html) |
| `/sites` | `SiteListPage` | Protected | `sites:read` / All Auth | `AppShell` | [`sites.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/sites.html) |
| `/sites/:id` | `SiteDetailPage` | Protected | Assigned Site / Admin | `AppShell` | [`site-detail.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/site-detail.html) |
| `/participants` | `ParticipantListPage` | Protected | `participants:read` / Scoped | `AppShell` | [`participants.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/participants.html) |
| `/participants/:id` | `ParticipantDetailPage` | Protected | Site PI / Monitor | `AppShell` | [`participant-detail.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/participant-detail.html) |
| `/safety` | `AdverseEventListPage` | Protected | `safety:read` / Scoped | `AppShell` | [`safety.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/safety.html) |
| `/safety/:id` | `AdverseEventDetailPage` | Protected | Safety Officer / Monitor | `AppShell` | [`safety-detail.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/safety-detail.html) |
| `/compliance` | `CompliancePage` | Protected | QA / Compliance Auditor | `AppShell` | [`compliance.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/compliance.html) |
| `/documents` | `DocumentListPage` | Protected | `documents:read` / Scoped | `AppShell` | [`documents.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/documents.html) |
| `/audit` | `AuditLogPage` | Protected | Super Admin / Auditor | `AppShell` | [`audit.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/audit.html) |
| `/admin` | `AdminPage` | Protected | `user:manage` (System Admin) | `AppShell` | [`admin.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/admin.html) |
| `/super-admin` | `SuperAdminPage` | Protected | `isSuperAdmin = true` | `AppShell` | [`super-admin-overview.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/super-admin-overview.html) |
| `*` (Catch-all) | `NotFoundPage` | Protected | All Authenticated | `AppShell` | [`not-found.html`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/not-found.html) |

---
