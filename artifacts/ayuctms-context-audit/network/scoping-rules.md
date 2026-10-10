# AyuCTMS Permission Scoping & Multi-Tenant Isolation Rules

- **Evidence Category:** `RUNTIME_CONFIRMED` & `SOURCE_CONFIRMED`
- **Authoritative Files:** `backend/app/core/rbac.py`, `backend/app/api/v1/dashboard.py`

---

## 1. Scoping Hierarchy

AyuCTMS operates under a 4-tier scope hierarchy:

1. **Platform Scope (`ScopeLevel.system` / Super Admin)**:
   - Super Admin profile (`SuperAdminProfile.is_active = True`) bypasses organization and study restrictions for read-only telemetry.
   - Cross-organizational visibility across all Sponsors, CROs, and active Protocols.
   - Governed by `PlatformService.is_super_admin()`.

2. **Organization Scope (`ScopeLevel.organization` / Sponsor or CRO)**:
   - Scoped to studies where the user's organization is registered as `sponsor_org_id` or `cro_org_id`.
   - CRO users can discover accredited sites and issue `SiteParticipationRequest` invitations.

3. **Study Scope (`ScopeLevel.study` / Principal Investigator)**:
   - Scoped to specific clinical trials where the user holds an active assignment in `study_team_members`.
   - Access to protocol documents, milestones, and participant rollups for that protocol.

4. **Site Scope (`ScopeLevel.site` / Site PI & Coordinator)**:
   - Scoped to the specific facility (`site_id`) where the investigator conducts the trial.
   - Site PIs receive incoming protocol participation invitations and hold decision authority (`approved` / `declined`).
   - Participant records are strictly partitioned by `site_id`.

---

## 2. Dynamic Dashboard Role Resolution Algorithm (`resolve_user_role`)

When a user requests `GET /api/v1/dashboard/summary`, the backend executes the following resolution ladder:

```
[1. Super Admin Check] -> Does user have active SuperAdminProfile?
     YES -> "super_admin" (Returns read-only cross-org overview)
     NO  -> Continue

[2. Organization Membership Check] -> Active OrganizationMember records:
     - If org_type in [institution, site_affiliate] or role contains "site" -> "site_pi"
     - If org_type == cro or role contains "cro" / "cra" -> "cro"
     - If org_type == sponsor or role contains "principal investigator" / "research" -> "research_pi"
     - Otherwise continue

[3. Study Team Assignment Check] -> Active StudyTeamMember records:
     - If assignment has site_id is not None -> "site_pi"
     - If role contains "investigator" or "research" -> "research_pi"
     - If role contains "cro" or "cra" -> "cro"
     - Otherwise continue

[4. Fallback] -> "unassigned" (Renders AccessPendingDashboard, hides telemetry)
```

---

## 3. Discovered Scoping Observations

1. **System Admin (`admin@ayuctms.gov.in`) Fallback:**
   The `admin@ayuctms.gov.in` account has role `System Administrator` (system scope) in the database, but does NOT hold a `SuperAdminProfile` or an `OrganizationMember` row. Consequently, it falls through to `"unassigned"`, rendering the Access Pending restricted screen.
2. **Site PI Precedence:**
   In `study_team_members`, if a PI has a non-null `site_id` attached, the resolver categorizes them as `"site_pi"` rather than `"research_pi"`.
3. **CRO Workspace Scoping:**
   CRO users only see studies where their organization ID matches `studies.cro_org_id`. If contracted studies = 0, the workspace displays the empty state with site discovery readiness.
