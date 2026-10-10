# AyuCTMS Comprehensive Role Inventory & Account Audit

- **Evidence Level:** `RUNTIME_CONFIRMED` & `SOURCE_CONFIRMED`
- **Database File:** `backend/ctms.db`

---

## 1. Discovered Canonical Roles in Database

| Role ID (UUID) | Role Name | Scope Level | Is System Role | Description |
|---|---|---|---|---|
| `656429b9-e4c8-4bac-9ac5-ae761b956d9d` | **System Administrator** | `system` | `True` | Global system administration with full platform access. |
| `0436252f-ec42-41d1-9dd8-573504b4e055` | **Principal Investigator** | `study` | `True` | Responsible for conduct of clinical investigation at study site / sponsor. |
| `edf47c30-746e-40b6-9ff8-9b75a8ecc85a` | **CRO Lead Monitor** | `organization` | `True` | Oversees study conduct across multi-centric trial sites. |
| `b425ef60-81ed-4900-a8c8-3e7eb864e78a` | **Clinical Research Associate** | `organization` | `False` | Performs site discovery, recruitment monitoring, and data verification. |
| `d8df8a34-436f-47d3-952a-3762f6b69216` | **Site Principal Investigator** | `site` | `False` | Institutional leadership, protocol approval, and clinical oversight at hospital. |
| `b6728362-1e5b-4016-8c27-1d5c1ab2a067` | **Site Coordinator** | `site` | `False` | Manages participant scheduling, subject visits, and CRF data entry. |

*(Special Platform Profile: `SuperAdminProfile` links to User ID and grants Government Verification Team platform oversight)*

---

## 2. Test Accounts Discovered & Verified in Runtime

| User ID | Full Name | Email Address | Active Role & Association | Resolved Dashboard | Must Change Pwd |
|---|---|---|---|---|---|
| `3330a57a-b430-4450-962a-5bdfb38718da` | Nitin Bhujwa | `admin@ayuctms.example` | **Platform Super Admin** (`SuperAdminProfile.is_active = True`) | `SuperAdminOverviewDashboard` | `False` |
| `00000000-0000-0000-0000-000000000001` | AyuCTMS System Administrator | `admin@ayuctms.gov.in` | **System Administrator** (System scope, no org membership) | `AccessPendingDashboard` (unassigned) | `False` |
| `cd89ab86-a6e0-4372-9976-cc46f43b3c59` | Dr. Rajesh Sharma | `pi.rajesh@aiia.gov.in` | **Principal Investigator** (Study: `AYU-CT-2026-001`, Site: `SITE-DEL-01`) | `SitePIDashboard` (site_pi) | `False` |
| `54bc3e73-e99f-4652-bbc6-bb716c2b0591` | Dr. Patel | `dr.patel.dbg@gah.edu.in` | **Site Principal Investigator** (Org: `GAH`, Site: `SITE-DBG-01`) | `SitePIDashboard` (site_pi, unlinked) | `False` |
| `5de5d0da-ce28-4ffd-887f-4dfe72ff5f31` | Nitin Bhujwa | `nitinbhujwa@gmail.com` | **Clinical Research Associate** (Org: `Rewa ayu collage` - CRO) | `CROWorkspaceDashboard` (cro) | `False` |

---

## 3. Role Distinction Rules & Boundary Enforcement

1. **Sponsor vs. CRO:**
   - Sponsors (`organization_type = 'sponsor'`) represent trial initiators and funders (e.g. AIIA).
   - CROs (`organization_type = 'cro'`) represent operational trial execution partners (e.g. ClinVeda, Rewa ayu collage).
2. **Research PI vs. Site PI:**
   - **Research PI:** Sits at the Sponsor level, oversees overall protocol design, cross-site trial milestones, and publications.
   - **Site PI:** Sits at an accredited hospital or research clinic, evaluates institutional feasibility, signs protocol agreements, and treats trial participants.
3. **CRA vs. CRO Administrator:**
   - **CRA (Monitor):** Field-level participant verification and monitoring reports.
   - **CRO Administrator:** Manages contracts, staff onboarding, and site discovery invitations.
4. **Platform-Level vs. Organization-Level Permissions:**
   - Platform permissions (Super Admin) cross organizational boundaries for government verification and system health.
   - Organization permissions isolate patient data, site contracts, and study teams to authorized tenants.
