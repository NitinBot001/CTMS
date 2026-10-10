#!/usr/bin/env python3
import os
import json
from pathlib import Path

PAGES_DIR = Path("/root/ayu-back/ctms/artifacts/ayuctms-context-audit/pages")
NETWORK_DIR = Path("/root/ayu-back/ctms/artifacts/ayuctms-context-audit/network")
SNAPSHOTS_DIR = Path("/root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots")

PAGES_DIR.mkdir(parents=True, exist_ok=True)
NETWORK_DIR.mkdir(parents=True, exist_ok=True)

# Generate page markdown files
pages_data = [
    {
        "filename": "login.md",
        "title": "AyuCTMS Login Screen",
        "route": "/login",
        "roles": "Public / All Users (Anonymous)",
        "snapshot": "login.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Entry point for authentication into AyuCTMS. Provides email and password inputs, submit trigger, and link to request institutional access.",
        "api_endpoints": [
            "POST /api/v1/auth/login (Body: { email, password } -> Returns: { access_token, token_type, user })",
            "GET /api/v1/platform/super-admin/me (Follow-up role probe upon authentication)"
        ],
        "interactive_elements": [
            "Email Address Input (`type=email`, required)",
            "Password Input (`type=password`, required)",
            "Sign In Button (`variant=primary`, triggers auth mutation)",
            "Link: 'Request institutional access' -> navigates to `/request-access`"
        ],
        "state_handling": "Displays inline red banner on invalid credentials (HTTP 401). Disables button and displays loading spinner during JWT resolution.",
        "defects": "No 'Forgot Password' recovery link. Force Password Change modal is triggered only after token is stored in localStorage."
    },
    {
        "filename": "request-access.md",
        "title": "Institutional Onboarding & Access Request Screen",
        "route": "/request-access",
        "roles": "Public / Organization Applicants (Anonymous)",
        "snapshot": "request-access.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Public-facing registration form for research institutions, sponsors, and CROs seeking access to the AyuCTMS platform under government verification.",
        "api_endpoints": [
            "POST /api/v1/platform/onboarding-requests (Body: OnboardingRequestCreate -> Returns: OnboardingRequestRead)"
        ],
        "interactive_elements": [
            "Applicant Full Name input",
            "Official Email Address input",
            "Contact Phone input",
            "Organization Name input",
            "Organization Type dropdown (`sponsor`, `cro`, `institution`, `site_affiliate`)",
            "Website URL input",
            "Geographic Location inputs (Country, State, City)",
            "Institutional Description textarea",
            "Submit Request button",
            "Back to Login link"
        ],
        "state_handling": "Displays submission success state with request tracking ID. Validates email format and required fields via react-hook-form + Zod.",
        "defects": "Does not enforce official institutional email domain validation on client side; permits generic free email addresses like gmail.com."
    },
    {
        "filename": "activate.md",
        "title": "Account & Invitation Activation Screen",
        "route": "/activate",
        "roles": "Invited Organization Administrators / Anonymous with Token",
        "snapshot": "activate.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Invitation activation portal where newly provisioned institutional administrators establish credentials using an invitation token received via email.",
        "api_endpoints": [
            "POST /api/v1/platform/activate (Body: { token, new_password } -> Returns: { message, email })"
        ],
        "interactive_elements": [
            "Activation Token input (prefilled via `?token=` query parameter)",
            "New Password input (min 8 characters)",
            "Confirm New Password input",
            "Activate Account button",
            "Link to Sign In"
        ],
        "state_handling": "Displays error banner if token is expired, used, or malformed. On success, transitions user to login screen.",
        "defects": "Token in URL query param (`?token=...`) can leak into browser history or referrers if external assets are requested."
    },
    {
        "filename": "dashboard-super-admin.md",
        "title": "Super Admin Operations Oversight Dashboard",
        "route": "/dashboard (Resolved role: super_admin)",
        "roles": "Platform Super Admin (Government Verification Team)",
        "snapshot": "dashboard-super-admin.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Read-only cross-organizational oversight dashboard presenting platform-wide telemetry across registered Sponsors, CROs, and active protocols without operational mutation leakage.",
        "api_endpoints": [
            "GET /api/v1/dashboard/summary (Returns: { role: 'super_admin', super_admin: SuperAdminOverviewResponse })"
        ],
        "interactive_elements": [
            "Telemetry Refresh Button (`onClick={() => refetch()}`)",
            "Quick Link: 'Review Onboarding Applications' -> navigates to `/super-admin`",
            "Quick Link: 'Cryptographic Audit Trail' -> navigates to `/audit`",
            "Registered Sponsors Card with Total Count & Detail Table",
            "Registered CROs Card with Total Count & Detail Table",
            "Active Protocols Card with Multi-center Site and Participant Rollups"
        ],
        "state_handling": "Read-only banner clearly indicates government verification oversight mode. No operational buttons (e.g. approve site, add participant) exist here.",
        "defects": "Dashboard renders 'Received NaN for children' console warning if planned_sample_size calculation encounters missing denominator."
    },
    {
        "filename": "dashboard-research-pi.md",
        "title": "Research Principal Investigator Hub Dashboard",
        "route": "/dashboard (Resolved role: research_pi)",
        "roles": "Sponsor-side Principal Investigator / Research Lead",
        "snapshot": "dashboard-research-pi.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Protocol delivery oversight hub displaying assigned clinical trials, affiliated research site activations, recruitment progression, and scheduled trial milestones.",
        "api_endpoints": [
            "GET /api/v1/dashboard/summary (Returns: { role: 'research_pi', research_pi: ResearchPIDashboardResponse })"
        ],
        "interactive_elements": [
            "Assigned Studies Metric Card",
            "Active Sites Metric Card",
            "Team Verifications Metric Card",
            "Upcoming Milestones Metric Card",
            "Research Studies Table with Phase, Status, Site Counts, Sample Size Progress Bars",
            "Upcoming Scheduled Protocol Targets List"
        ],
        "state_handling": "Empty state displays guidance if PI has not been assigned to any studies yet. Scoped strictly to studies in PI purview.",
        "defects": "In seed database, PI Dr. Rajesh Sharma has a site_id assigned in study_team_members, which causes backend rbac resolver to categorize him as site_pi rather than research_pi."
    },
    {
        "filename": "dashboard-cro-workspace.md",
        "title": "CRO Trial Operations Workspace Dashboard",
        "route": "/dashboard (Resolved role: cro)",
        "roles": "CRO Lead Monitor / CRA / CRO Staff",
        "snapshot": "dashboard-cro-workspace.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Multi-center protocol orchestration console enabling CRO monitors to oversee contracted studies, discover eligible clinical sites, issue participation requests, and execute bulk participant imports.",
        "api_endpoints": [
            "GET /api/v1/dashboard/summary (Returns: { role: 'cro', cro: CRODashboardResponse })",
            "GET /api/v1/studies/{study_id}/eligible-sites (Discovery Query)",
            "POST /api/v1/platform/site-participation-requests (Site Invitation Mutation)",
            "POST /api/v1/participants/bulk-import (CSV Ingestion Mutation)"
        ],
        "interactive_elements": [
            "Eligible Sites Metric Card",
            "Pending Site Requests Metric Card",
            "Participants in Scope Metric Card",
            "Button: 'Discover & Invite Sites' -> triggers Site Discovery Dialog",
            "Button: 'Bulk Ingest Participants' -> triggers CSV Participant Import Dialog",
            "Contracted Protocols Table with Enrolled vs Target counts",
            "Recent Site Assignment Requests Table"
        ],
        "state_handling": "Displays empty workspace guidance if CRO organization has not been contracted for any clinical protocols.",
        "defects": "If CRO CRA account is created without primary organization assignment, dashboard resolves to unassigned access-pending state."
    },
    {
        "filename": "dashboard-site-pi.md",
        "title": "Clinical Research Site Console Dashboard",
        "route": "/dashboard (Resolved role: site_pi)",
        "roles": "Site Principal Investigator / Site Coordinator",
        "snapshot": "dashboard-site-pi.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Site-specific clinical console displaying institutional participation requests from CROs, active protocols conducted at the site, patient enrollment counts, and open safety reports.",
        "api_endpoints": [
            "GET /api/v1/dashboard/summary (Returns: { role: 'site_pi', site_pi: SitePIDashboardResponse })",
            "POST /api/v1/platform/site-participation-requests/{id}/site-decision (Confirmation Mutation)"
        ],
        "interactive_elements": [
            "Institutional Site Banner displaying site name, site code, and city",
            "Active Protocols Metric Card",
            "Pending CRO Requests Metric Card",
            "Enrolled Subjects Metric Card",
            "Open Safety Events Metric Card",
            "Incoming Protocol Requests Section with 'Review & Confirm' trigger",
            "Institutional Decision Modal with Radio buttons ('Approve' / 'Decline') and Notes textarea"
        ],
        "state_handling": "Displays warning banner if site PI has no site link established (`site_id == null`). Incoming requests list shows empty state when zero requests are pending.",
        "defects": "Dr. Patel account has `site_id: null` in dashboard summary response because organization membership role does not carry direct `site_id` FK."
    },
    {
        "filename": "dashboard-access-pending.md",
        "title": "Access Pending / Unassigned Dashboard State",
        "route": "/dashboard (Resolved role: unassigned)",
        "roles": "Newly Registered / Unassigned / Pending Users",
        "snapshot": "dashboard-access-pending.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Safe restricted state presented when authenticated user's role or organizational assignment cannot be resolved. Prevents data leakage by suppressing all operational metrics.",
        "api_endpoints": [
            "GET /api/v1/dashboard/summary (Returns: { role: 'unassigned' })"
        ],
        "interactive_elements": [
            "Security Lock Icon",
            "Notice: 'Access Authorization Pending'",
            "Explanation: 'Your account is authenticated, but no active role assignment or study purview was resolved.'",
            "Refresh Status Button (`onClick={() => refetch()}`)",
            "Sign Out Button"
        ],
        "state_handling": "Completely hides all navigation counts, protocol cards, and operational links. User remains safely sandboxed.",
        "defects": "`admin@ayuctms.gov.in` (System Administrator) is resolved to this unassigned dashboard because the role resolver looks for org memberships rather than system administrator bypass."
    },
    {
        "filename": "organizations.md",
        "title": "Organizations Directory Page",
        "route": "/organizations",
        "roles": "System Admin, Super Admin, Sponsor Admin, CRO Admin",
        "snapshot": "organizations.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Directory of registered clinical research organizations, sponsors, CROs, academic medical centers, and government institutes in the AyuCTMS network.",
        "api_endpoints": [
            "GET /api/v1/organizations (Returns: list[OrganizationRead])",
            "POST /api/v1/organizations (Create Organization Mutation)"
        ],
        "interactive_elements": [
            "Search and filter controls by organization type (`sponsor`, `cro`, `institution`)",
            "Button: 'Register Organization' -> opens `OrganizationModal`",
            "Organization Table with Name, Type, Reg Number, Location, Status Badge",
            "Row click navigates to `/organizations/:id`"
        ],
        "state_handling": "Shows skeleton loaders during fetch, empty state when zero organizations match filter.",
        "defects": "Ordinary users cannot view organizations outside their membership unless holding system:read permission."
    },
    {
        "filename": "organization-detail.md",
        "title": "Organization Detail & Member Governance Page",
        "route": "/organizations/:id",
        "roles": "Organization Members, System Admin, Super Admin",
        "snapshot": "organization-detail.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Detailed institutional profile displaying contact details, accreditation numbers, registered clinical sites, and authorized member rosters.",
        "api_endpoints": [
            "GET /api/v1/organizations/{id} (Returns: OrganizationRead)",
            "GET /api/v1/organizations/{id}/members (Returns: list[OrganizationMemberRead])"
        ],
        "interactive_elements": [
            "Institutional Metadata Card",
            "Member Roster Table with Name, Email, Assigned Role, Status",
            "Button: 'Invite Team Member' (if admin)",
            "Back to Organizations navigation link"
        ],
        "state_handling": "Returns HTTP 403 / Access Denied if non-admin attempts to view foreign organization details.",
        "defects": "Organization edit mutation requires full payload; partial updates without registration_number can fail validation."
    },
    {
        "filename": "studies.md",
        "title": "Clinical Studies & Protocol Directory Page",
        "route": "/studies",
        "roles": "Sponsor PI, CRO Monitor, Site PI, Super Admin",
        "snapshot": "studies.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Comprehensive inventory of Ayurvedic clinical trials and research protocols governed under CTRI and GCP guidelines.",
        "api_endpoints": [
            "GET /api/v1/studies (Returns: list[StudyRead] scoped to user permissions)"
        ],
        "interactive_elements": [
            "Search Input by Protocol Number or Study Title",
            "Phase Filter dropdown (Phase I, Phase II, Phase III, Phase IV)",
            "Status Filter dropdown (Draft, Active, Completed, Suspended)",
            "Button: 'New Clinical Study' (visible only with `study:create` permission)",
            "Studies Table with Study Code, Protocol Number, Phase, Sponsor, Sites Count, Status",
            "Row click navigates to `/studies/:id`"
        ],
        "state_handling": "Strictly scoped: Ordinary users see only studies where their organization is sponsor/CRO or where they have active team membership.",
        "defects": "Super Admin can view all studies, but currently cannot transition study states directly from this screen."
    },
    {
        "filename": "study-create.md",
        "title": "New Clinical Study Protocol Creation Page",
        "route": "/studies/new",
        "roles": "Sponsor PI / Research Administrator",
        "snapshot": "study-create.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Multi-section form for registering a new Ayurvedic clinical trial protocol with regulatory classification, CTRI metadata, and sample size targets.",
        "api_endpoints": [
            "POST /api/v1/studies (Body: StudyCreate -> Returns: StudyRead)"
        ],
        "interactive_elements": [
            "Study Code & Protocol Number inputs",
            "Title & Short Title inputs",
            "Study Type (`interventional`, `observational`)",
            "Clinical Trial Phase dropdown",
            "Therapeutic Area & Intervention Type inputs",
            "Planned Sample Size numeric input",
            "Start Date and End Date datepickers",
            "CTRI Registration Number input",
            "Sponsor & CRO Organization selector",
            "Submit Protocol button"
        ],
        "state_handling": "Client validation blocks submission if protocol number is missing or planned sample size is non-positive.",
        "defects": "CTRI number format regex is not strictly validated against official CTRI/YYYY/MM/NNNN format."
    },
    {
        "filename": "study-detail.md",
        "title": "Clinical Study Protocol Detail & Master Workspace",
        "route": "/studies/:id",
        "roles": "Assigned Protocol Investigators, Monitors, Administrators",
        "snapshot": "study-detail.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Central protocol workspace containing trial synopsis, affiliated research sites, study team member roster, participant accrual metrics, and protocol documents.",
        "api_endpoints": [
            "GET /api/v1/studies/{id} (Returns: StudyRead)",
            "GET /api/v1/studies/{id}/sites (Returns: list[StudySiteRead])",
            "GET /api/v1/studies/{id}/team (Returns: list[StudyTeamMemberRead])"
        ],
        "interactive_elements": [
            "Protocol Header with CTRI status and GCP ethics badge",
            "Tabs: 'Overview', 'Participating Sites', 'Team Members', 'Documents', 'Milestones'",
            "Participating Sites Table with Activation Status, EC Approval, Target Sample",
            "Button: 'Add Site' / 'Request Site Participation'",
            "Status Transition trigger (e.g. from `draft` to `active`)"
        ],
        "state_handling": "If user lacks scope for this study, backend returns HTTP 403 Forbidden with clear access denied message.",
        "defects": "Study status transition dialog does not validate that at least one site is activated before transitioning study from `approved` to `active`."
    },
    {
        "filename": "sites.md",
        "title": "Clinical Research Sites Directory Page",
        "route": "/sites",
        "roles": "Site PI, CRO Monitor, Super Admin, System Admin",
        "snapshot": "sites.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Directory of accredited clinical trial sites, Ayurvedic hospitals, university research facilities, and medical colleges.",
        "api_endpoints": [
            "GET /api/v1/sites (Returns: list[SiteRead])",
            "POST /api/v1/sites (Site Create Mutation)"
        ],
        "interactive_elements": [
            "Search input by Site Name, Code, or City",
            "Site Type filter (`hospital`, `clinic`, `academic_institute`, `independent_center`)",
            "Button: 'Register Site' -> opens `SiteModal`",
            "Sites Table with Site Code, Facility Name, City, State, Affiliated Org, Status Badge",
            "Row click navigates to `/sites/:id`"
        ],
        "state_handling": "Returns all registered sites; CROs and PIs can discover eligible sites across the country.",
        "defects": "No geospatial map view or distance radius filter for multi-center trial site feasibility."
    },
    {
        "filename": "site-detail.md",
        "title": "Clinical Site Detail & Institutional Facility Page",
        "route": "/sites/:id",
        "roles": "Site Investigators, Assigned CROs, Platform Administrators",
        "snapshot": "site-detail.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Site facility profile detailing institutional address, Ethics Committee accreditation, active clinical trials, and site staff roster.",
        "api_endpoints": [
            "GET /api/v1/sites/{id} (Returns: SiteRead)",
            "GET /api/v1/sites/{id}/studies (Returns: list of assigned studies)"
        ],
        "interactive_elements": [
            "Facility Metadata Card with address and telephone",
            "Ethics Committee Accreditation status badge",
            "Active Protocols conducting research at this facility",
            "Site Investigators list",
            "Button: 'Edit Site Details' (requires `site:manage` permission)"
        ],
        "state_handling": "Displays empty study list if facility is newly registered and has not accepted any protocol invitations.",
        "defects": "EC approval documents cannot be uploaded directly on this page; must navigate to `/documents` module."
    },
    {
        "filename": "participants.md",
        "title": "Participants & Patient Subject Directory Page",
        "route": "/participants",
        "roles": "Site PI, CRA, Study Coordinator, Data Entry Operator",
        "snapshot": "participants.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Clinical trial participant subject registry tracking recruitment, screening, enrollment, randomization, and trial completion across sites.",
        "api_endpoints": [
            "GET /api/v1/participants (Returns: list[ParticipantRead] scoped to study/site access)",
            "POST /api/v1/participants (Single Participant Ingestion)",
            "POST /api/v1/participants/bulk-import (Bulk CSV Ingestion)"
        ],
        "interactive_elements": [
            "Search Input by Participant Pseudonym Code (e.g. `ASH-DEL-001`)",
            "Status Filter dropdown (`screening`, `enrolled`, `randomized`, `completed`, `withdrawn`)",
            "Button: 'Enroll Participant' -> opens `ParticipantModal`",
            "Button: 'Bulk Ingest' (for CRO / Coordinator)",
            "Participant Table with Subject Code, Protocol, Site, Screening Date, Status",
            "Row click navigates to `/participants/:id`"
        ],
        "state_handling": "Full pseudonymization: Patient Personally Identifiable Information (PII) is NEVER collected or displayed. Only alphanumeric subject codes exist.",
        "defects": "Date filters for screening date range are absent in the table toolbar."
    },
    {
        "filename": "participant-detail.md",
        "title": "Participant Clinical Subject Detail Page",
        "route": "/participants/:id",
        "roles": "Authorized Site Investigators and Clinical Monitors",
        "snapshot": "participant-detail.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Individual participant tracking record detailing milestone progression, trial randomization status, study visits, and adverse event linkages.",
        "api_endpoints": [
            "GET /api/v1/participants/{id} (Returns: ParticipantRead)",
            "POST /api/v1/participants/{id}/transition (Status Mutation)",
            "GET /api/v1/safety/adverse-events?participant_id={id} (AE link)"
        ],
        "interactive_elements": [
            "Subject Header with Participant Code and Lifecycle Status Badge",
            "Key Milestone Timestamps (Screening Date, Enrollment Date, Randomization Date, Completion Date)",
            "Lifecycle State Transition Buttons (e.g. 'Randomize', 'Complete Trial', 'Withdraw Subject')",
            "Withdrawal Reason input modal if transitioning to `withdrawn`"
        ],
        "state_handling": "State machine enforces legal lifecycle transitions. Invalid skips (e.g. screening -> completed) trigger HTTP 400 Bad Request.",
        "defects": "Transition dialog lacks confirmation checkbox verifying informed consent re-affirmation."
    },
    {
        "filename": "safety.md",
        "title": "Pharmacovigilance & Adverse Events Registry Page",
        "route": "/safety",
        "roles": "Site PI, CRA, Safety Officer, Pharmacovigilance Officer",
        "snapshot": "safety.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Safety monitoring console tracking Adverse Events (AE) and Serious Adverse Events (SAE) occurring during Ayurvedic interventions.",
        "api_endpoints": [
            "GET /api/v1/safety/adverse-events (Returns: list[AdverseEventRead])",
            "POST /api/v1/safety/adverse-events (Log Safety Event Mutation)"
        ],
        "interactive_elements": [
            "Severity Filter (`mild`, `moderate`, `severe`, `life_threatening`)",
            "Seriousness Toggle (`SAE Only`)",
            "Button: 'Report Adverse Event' -> opens `AdverseEventModal`",
            "Adverse Events Table with Event Term, Participant Code, Onset Date, Severity, Causality, Status",
            "Row click navigates to `/safety/:id`"
        ],
        "state_handling": "SAE events trigger high-priority warning indicators and expedited reporting deadlines (e.g. 24-hour notification under CDSCO/Ayush guidelines).",
        "defects": "Endpoint in router is `/safety/adverse-events`, but frontend initially curled `/safety`, which returned HTTP 404 until mapped correctly."
    },
    {
        "filename": "compliance.md",
        "title": "Ethics, Regulatory & CAPA Compliance Page",
        "route": "/compliance",
        "roles": "Ethics Committee, QA Lead, Compliance Auditor, Super Admin",
        "snapshot": "compliance.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Governance hub for Ethics Committee approvals, regulatory submissions to Ministry of Ayush / CDSCO, protocol deviations, and Corrective Action Plans (CAPA).",
        "api_endpoints": [
            "GET /api/v1/compliance/capa (Returns: list[CAPARecordRead])",
            "GET /api/v1/compliance/ethics-approvals (Returns: list[EthicsApprovalRead])",
            "GET /api/v1/compliance/protocol-deviations (Returns: list[ProtocolDeviationRead])"
        ],
        "interactive_elements": [
            "Tabs: 'Ethics Committee Approvals', 'Regulatory Filings', 'Protocol Deviations', 'CAPA Records'",
            "CAPA Records Table with Tracking ID, Root Cause, Remediation Plan, Status",
            "Button: 'Initiate CAPA Investigation'",
            "Protocol Deviation Classification badges (`minor`, `major`, `critical`)"
        ],
        "state_handling": "Displays compliance health rating and audit readiness metrics.",
        "defects": "CAPA closure requires electronic signature confirmation which is currently simulated without secondary authentication."
    },
    {
        "filename": "documents.md",
        "title": "Trial Master File (eTMF) & Document Governance Page",
        "route": "/documents",
        "roles": "CRA, Investigator, TMF Specialist, Document Manager",
        "snapshot": "documents.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Electronic Trial Master File repository managing essential trial documents (protocols, investigator brochures, informed consents, approvals, monitor reports).",
        "api_endpoints": [
            "GET /api/v1/documents (Returns: list[DocumentRead])",
            "POST /api/v1/documents (Upload Metadata & Storage Key Mutation)"
        ],
        "interactive_elements": [
            "Document Type Filter (`protocol`, `ib`, `icf`, `ec_approval`, `monitoring_report`, `cv`)",
            "Button: 'Upload Document' -> opens document submission dialog",
            "Documents Table with Title, Category, Version, Uploaded Date, File Size, Storage Hash",
            "Download Link (`s3://...` or secure presigned URL)"
        ],
        "state_handling": "Tracks document versioning. Replaced documents retain full historic audit record.",
        "defects": "Binary file uploads are simulated using S3 storage key metadata; direct client-to-storage presigned upload flow is not yet wired to a live S3 bucket."
    },
    {
        "filename": "audit.md",
        "title": "Cryptographic Audit Trail & System Verification Page",
        "route": "/audit",
        "roles": "Super Admin, Compliance Auditor, Regulatory Inspector",
        "snapshot": "audit.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Tamper-evident audit log recording every security-critical mutation, login event, role assignment, participant transition, and protocol state change.",
        "api_endpoints": [
            "GET /api/v1/audit/logs (Returns: list[AuditLogRead] with timestamp, actor, action, resource, diffs)"
        ],
        "interactive_elements": [
            "Audit Filter by Resource Type (`study`, `organization`, `participant`, `user`)",
            "Audit Filter by Action (`create`, `update`, `transition`, `delete`)",
            "Date Range selector",
            "Audit Log Table displaying Timestamp, Actor User ID, Action, Target Resource, JSON Diff Payload",
            "Export Audit Trail button"
        ],
        "state_handling": "Audit logs are strictly append-only. No user, not even Super Admin, has permission to edit or truncate audit records.",
        "defects": "Actor user ID is displayed as raw UUID rather than resolving to user's full name and email in the table view."
    },
    {
        "filename": "admin.md",
        "title": "Platform User Access Control & RBAC Management Page",
        "route": "/admin",
        "roles": "System Administrator",
        "snapshot": "admin.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "User management and RBAC configuration console for platform administrators.",
        "api_endpoints": [
            "GET /api/v1/users (Returns: list[UserRead])",
            "POST /api/v1/users (User Provisioning)"
        ],
        "interactive_elements": [
            "Users Directory Table with Name, Email, Status, Must Change Password flag",
            "Button: 'Create User'",
            "User Role Assignment Modal"
        ],
        "state_handling": "Restricted by `user:manage` permission. Unauthorized users are blocked by route guard.",
        "defects": "Sidebar link for Access Control correctly requires `user:manage`, but does not provide inline password reset trigger."
    },
    {
        "filename": "super-admin-overview.md",
        "title": "Super Admin Platform Verification Console Page",
        "route": "/super-admin",
        "roles": "Platform Super Admin (Government Verification Team)",
        "snapshot": "super-admin-overview.html",
        "evidence": "RUNTIME_CONFIRMED",
        "overview": "Dedicated platform control console where the Government Verification Team reviews onboarding applications, verifies institutional credentials, and provisions organizations.",
        "api_endpoints": [
            "GET /api/v1/platform/onboarding-requests (Returns: list[OnboardingRequestRead])",
            "PATCH /api/v1/platform/onboarding-requests/{id}/review (Review Status Mutation)",
            "POST /api/v1/platform/onboarding-requests/{id}/approve (Atomic Provisioning Mutation)",
            "GET /api/v1/platform/super-admin/me (Profile Probe)"
        ],
        "interactive_elements": [
            "Super Admin Banner: 'Government Verification Team — Platform Control'",
            "Tabs: 'Pending Applications', 'Under Review', 'Approved Organizations', 'Rejected'",
            "Onboarding Requests Table with Applicant, Organization, Type, Submitted Date, Status",
            "Action: 'Review Application' -> opens Review Modal with notes textarea",
            "Action: 'Approve & Provision' -> triggers atomic organization and admin user creation with invitation token"
        ],
        "state_handling": "Enforces state transition rules (`pending` -> `under_review` -> `approved`). Double approval is protected by row-level idempotency.",
        "defects": "Review modal notes field is optional; ideally, rejection should mandate a justification reason."
    }
]

for p in pages_data:
    md_content = f"""# {p['title']}

- **Route:** `{p['route']}`
- **Target Role(s):** {p['roles']}
- **Evidence Level:** `{p['evidence']}`
- **Rendered Snapshot:** [`{p['snapshot']}`](file:///root/ayu-back/ctms/artifacts/ayuctms-context-audit/snapshots/{p['snapshot']})

---

## 1. Page Overview & Functional Purpose
{p['overview']}

---

## 2. Real API Interactions & Contracts
The page interacts with the following backend endpoints:
"""
    for ep in p['api_endpoints']:
        md_content += f"- `{ep}`\n"

    md_content += f"""
---

## 3. Discovered Interactive Controls & Forms
"""
    for el in p['interactive_elements']:
        md_content += f"- {el}\n"

    md_content += f"""
---

## 4. State Handling & Edge States
{p['state_handling']}

---

## 5. Security & UI Defect Observations
{p['defects']}
"""
    with open(PAGES_DIR / p['filename'], "w") as f:
        f.write(md_content)

print(f"Generated {len(pages_data)} page reports in {PAGES_DIR}")
