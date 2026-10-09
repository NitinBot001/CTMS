<USER_REQUEST>
MASTER IMPLEMENTATION PROMPT — AyuCTMS Government Verification, Super Admin & Research/Site Onboarding

1. Your Role

Act as a senior full-stack architect, security engineer, and implementation agent working inside the existing AyuCTMS repository.

Your task is to inspect, design, implement, test, and document the complete platform access verification and research/site onboarding workflow.

Do not stop at a proposal, wireframe, or implementation plan. After inspecting the repository, implement the feature end to end while preserving the existing architecture and API contracts wherever possible.

Work autonomously. Make implementation decisions consistent with the existing codebase, document important decisions, and report actual verification results. Do not claim that a feature works unless it has been tested.

---

2. Mandatory Project Context

AyuCTMS is a Clinical Trial Management System for Ayurveda research under the AIIA/SIH26046 project.

Existing technology stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS.
- Backend: FastAPI, Python, Pydantic v2.
- Database: PostgreSQL.
- ORM: SQLAlchemy 2.x with asynchronous support.
- Migrations: Alembic.
- Cache/background infrastructure: Redis where already configured.
- Authentication: Existing JWT Bearer authentication.
- Email delivery: Resend.
- API contract: "docs/API_CONTRACT.md" and "docs/openapi.json".

Existing canonical domain entities

Inspect the actual implementation of these entities before modifying anything:

- Organization
- OnboardingApplication
- User
- Role
- Permission
- RolePermission
- OrganizationMember
- Study
- Site
- StudySite
- StudyTeamMember
- Participant
- StudyMilestone
- AdverseEvent
- EthicsApproval
- RegulatorySubmission
- ProtocolDeviation
- CAPARecord
- Document
- AuditLog

The list above describes the known domain model. Verify actual names, relationships, fields, migrations, and existing functionality in the repository.

Do not create duplicate users, organizations, roles, permissions, studies, sites, or team-member systems when the existing canonical entities can support the feature.

Organization types such as Sponsor and CRO must continue to use the existing organization model and its "organization_type" or equivalent field. Preserve the separation between organizations, users, study assignments, and site assignments.

---

3. Correct Business Model

The platform has three distinct layers of responsibility.

Layer A — Government Verification Team / Platform Super Admin

This is the platform-level authority responsible for verifying access to the research platform.

Responsibilities:

- Review independently submitted access requests.
- Verify applicant identity and affiliation.
- Review required documents and qualifications.
- Approve or reject individual applicants.
- Verify proposed research-team members and site personnel.
- Review site participation requests for a study.
- Manage platform-level verification staff, subject to the implemented Super Admin permissions.
- Review verification history and audit trails.
- View pending, approved, rejected, and incomplete applications.
- Monitor onboarding metrics and verification turnaround.
- Revoke or suspend access when properly authorized and audited.

Government verification is a platform-level permission scope. Ordinary Sponsor, CRO, Organization Admin, Research PI, and Site PI roles must never receive global verification powers merely because they administer an organization or study.

Layer B — Research PI / CRO-side research team

Research-side users are associated with a Sponsor or CRO organization and one or more studies according to their assignments.

The initial Research PI or authorized CRO-side representative can:

- Independently request access to AyuCTMS.
- Provide their identity, professional affiliation, and supporting documents.
- Request association with an existing organization or submit the information needed for a new organization, where permitted by the current organization workflow.
- After approval and activation, create or manage research work according to assigned permissions.
- Create or manage studies within their authorized scope.
- Propose or invite research-team members.
- Assign proposed team members to suitable organization or study roles.
- Request the participation of eligible clinical sites in a study.
- Track government verification, invitation, and site-participation statuses.
- Manage research documents, milestones, compliance tasks, and team assignments according to permissions.

Research-side users may propose people and roles, but they cannot approve their own access requests or independently grant verified platform access to other people.

Layer C — Site PI / institution and site personnel

A Site PI is distinct from a Research PI.

Site-side users can:

- Independently request platform access.
- Identify their institution and clinical site.
- Provide professional credentials and supporting documentation.
- Request association with an existing site or submit information for a proposed site, subject to verification.
- Review study participation requests directed to their site.
- Confirm or decline their institution's participation in a specific study, provided they have the authority to do so.
- Propose or invite eligible site staff where authorized.
- Manage approved site-level work according to their permissions.

Potential site personnel include:

- Site PI.
- Data Entry Operator (DEO).
- Authorized nurses.
- Other approved clinical or administrative personnel.

Site personnel must not automatically inherit Research PI or platform-level privileges.

Where institutional authorization is required, the system must capture the appropriate authorized confirmation rather than treating an individual Site PI's account as unconditional proof of institutional authority.

---

4. Required Onboarding Entry Points

Implement three independently accessible entry points.

A. Research PI access request

The applicant provides:

- Full legal name.
- Email address.
- Registered mobile number.
- Professional designation.
- Organization affiliation and type, where applicable.
- Requested role and intended responsibilities.
- Relevant professional credentials.
- Required supporting documents.
- Declaration of accuracy and consent to verification.
- Any other fields required by the existing data model and approved onboarding rules.

A Research PI may be the initial research-side applicant or a PI joining an existing organization or study, subject to authorization.

B. CRO staff access request

CRO staff must be able to independently request access rather than depending exclusively on an initial Research PI to create their accounts.

Capture:

- Identity and contact details.
- CRO affiliation.
- Requested job function.
- Requested organization or study scope, if known.
- Qualifications and required documents.
- Relevant sponsor/CRO relationships where applicable.

An applicant's claim of CRO affiliation is not itself verified affiliation. Provide a verification step for the organization and the applicant's authority to join it.

Do not automatically grant CRO staff organization-wide access when only study-specific access has been approved.

C. Site PI access request

The Site PI independently submits an access request with:

- Identity and professional information.
- Institution and clinical-site details.
- Relevant qualifications and supporting documentation.
- Requested site association.
- Requested access scope.
- Applicable declarations and consent.

Support both cases:

1. The institution/site already exists.
2. The institution/site needs to be proposed for verification.

Avoid creating duplicate sites when an existing canonical Site record can be matched safely.

If a Site PI requests access to an existing site, verify the person's affiliation and authority before granting the corresponding site-level permissions.

Entry-point rules

- Each entry point must have a clear UI and backend workflow.
- All entry points must use the same canonical identity and verification infrastructure.
- A public access request must not automatically create an active, privileged account.
- An existing authenticated user must not be able to exploit public onboarding to change their role, organization, or verification status.
- Use safe duplicate detection and a controlled process for merging or associating duplicate requests.
- Do not expose private applicant records through public endpoints.

---

5. Government Verification Workflow

Implement a complete lifecycle for every individual access request.

Recommended states, adapted to the existing state-machine conventions:

"DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED_PENDING_ACTIVATION → ACTIVE"

Additional terminal or restricted states:

- "REJECTED"
- "NEEDS_INFORMATION"
- "WITHDRAWN"
- "SUSPENDED"
- "EXPIRED", where appropriate

Use the repository's existing naming conventions if equivalent states already exist. Document the mapping.

Required behavior

1. Applicant submits an access request.
2. The backend validates required fields and supporting-document references.
3. The system records submission time and a unique request identifier.
4. The application appears in the authorized Government Verification Team queue.
5. A reviewer examines the applicant's identity, affiliation, requested scope, and documents.
6. The reviewer can request additional information, approve, or reject.
7. Reviewers must provide a reason or structured rationale where required.
8. Approval creates or links the canonical user identity and the appropriate pending role/organization/study/site assignments.
9. Approval does not itself mean that the user has completed account activation.
10. Resend sends a one-time activation email.
11. The applicant sets a password and completes any required profile fields.
12. The system activates access only when all mandatory approval and activation requirements are satisfied.
13. The user can then sign in and access only the authorized dashboards and resources.

Rejection

- Rejected applicants must not receive activation links or usable login credentials.
- Rejected applicants must not be able to authenticate into the platform.
- Preserve the rejection decision, reviewer identity, timestamp, and reason in the audit history.
- Define a controlled resubmission or appeal process if supported by the product requirements.
- Prevent repeated requests from bypassing a previous rejection without the appropriate review.

Additional-information requests

- The applicant can provide the requested information through an authenticated or securely tokenized process.
- The application returns to the correct review queue after resubmission.
- Record every submission and review transition.
- Do not overwrite important prior review history.

Reviewer security

- Enforce reviewer authorization on the backend for every action.
- A reviewer cannot approve their own access request.
- Define separation-of-duties rules for high-privilege accounts.
- Restrict access to identity documents to explicitly authorized personnel.
- Prevent unauthorized changes to reviewer decisions or historical records.

---

6. Initial Super Admin Bootstrap and First Login

Implement a secure, repeatable bootstrap mechanism for the initial platform Super Admin.

Inspect the existing authentication and user-creation behavior first. Preserve the existing rule that anonymous user creation is permitted only for initial bootstrap when the database has zero users, if that is the current documented contract.

Environment configuration

Support configuration equivalent to:

- "SUPER_ADMIN_EMAIL"
- "SUPER_ADMIN_BOOTSTRAP_PASSWORD"
- "RESEND_API_KEY"
- "RESEND_FROM_EMAIL"
- "APP_BASE_URL"
- Activation-token expiry configuration, if the project supports it.

Use the project's established settings module and environment naming conventions. Update ".env.example" with placeholders only.

Never commit real credentials or print passwords, API keys, activation tokens, or sensitive applicant information in logs.

Bootstrap behavior

- Bootstrap the initial Super Admin only when the database has no eligible platform administrator and the bootstrap conditions are satisfied.
- Persist the Super Admin as a normal canonical User record with an explicit platform-level role and required profile/setup status.
- Environment variables provide bootstrap configuration; they are not the permanent user database.
- Never reset or overwrite an existing Super Admin password or profile on every startup.
- Make bootstrap idempotent and safe under concurrent startup conditions.
- Never create a second Super Admin merely because an existing account has incomplete profile setup.
- Fail safely with a clear diagnostic if required bootstrap settings are missing or inconsistent.

First-login setup

The initial Super Admin must complete first-login setup before accessing the normal administrative dashboard.

Require:

- New personal password.
- Full name.
- Registered mobile number.
- Address and other profile information required by the approved application policy.
- Identity details only to the extent justified by the verification policy.
- Any mandatory terms or declarations.

Do not collect unnecessary sensitive identity data.

The first-login flow must verify the bootstrap password using the existing secure authentication mechanism, enforce password policy, persist the new password hash and profile, and mark setup complete.

Do not keep a permanently privileged account dependent on the bootstrap password.

Government verification team expansion

The initial Super Admin may provision additional Government Verification Team members through an explicitly authorized platform-level workflow.

- Each additional verifier has an individual canonical user identity.
- Apply least-privilege permissions.
- Use invitations and individual account activation.
- Record who provisioned and approved each verifier.
- Do not grant platform-level permissions through ordinary organization or study role assignment.
- Prevent a verifier from escalating their own privileges.

If the current permission architecture cannot safely support a required distinction, extend it additively and document the migration.

---

7. Research PI Team Invitations and Individual Verification

A Research PI or authorized research-side lead must be able to assemble a proposed research team after obtaining the required platform access.

Team invitation workflow

1. Authorized Research PI opens their organization or study team.
2. They add a proposed person using the required contact details and requested role.
3. The system creates a pending invitation or team-membership request.
4. The invitee receives an invitation or access-request notification.
5. The invitee completes identity and affiliation information and submits required documents.
6. Government Verification Team reviews the individual.
7. The organization/study authorization is checked separately from the person's identity verification.
8. Upon all required approvals, the system sends an activation link or activates the relevant assignment for an already-active, verified user.
9. The member receives only the approved organization/study permissions.

Critical distinction

Identity verification, account activation, organization membership, and study-role assignment are separate concepts.

Do not collapse them into one boolean such as "is_approved".

A person may be verified as an individual but still lack authorization to join a particular organization or study. Conversely, a Research PI may invite a person, but that invitation does not mean the person has passed government verification.

Role assignment

Support the appropriate existing or explicitly approved role catalog, such as:

- Research PI.
- CRO lead or CRO staff.
- Study Coordinator.
- Regulatory/document specialist.
- Document reviewer.
- Other explicitly configured research-team roles.

These labels are examples of business roles, not permission grants by themselves. Map them to existing Role/Permission definitions and the correct organization, study, or platform scope.

Do not allow arbitrary frontend role strings to create privileged roles.

---

8. Clinical Site Onboarding and Study Participation

Site participation has two independent approval requirements:

1. Government Verification Team approval.
2. Site PI/institution participation confirmation.

Both are mandatory. Neither approval substitutes for the other.

Required workflow

1. An authorized Research PI requests that an eligible site participate in a specific study.
2. The request identifies the study, proposed site, intended activities, and relevant documents.
3. The system validates that the requester has permission to manage that study.
4. The request is routed to the Government Verification Team.
5. The site request is also routed to the authorized Site PI/institution contact.
6. Government reviewers verify the site, required documentation, and relevant eligibility.
7. The Site PI/institution confirms or declines participation in that particular study.
8. The two decisions are recorded independently.
9. Participation becomes active only when both required approvals are satisfied and all other applicable study prerequisites are met.
10. The canonical StudySite association is activated only at the correct point in the lifecycle.

The two approvals may occur in either order. The implementation must not assume that one reviewer always acts first.

Possible participation states

Use the existing state-machine convention where available. Otherwise, support equivalent states such as:

- "REQUESTED"
- "PENDING_GOVERNMENT_VERIFICATION"
- "PENDING_SITE_CONFIRMATION"
- "PENDING_BOTH_APPROVALS"
- "APPROVED"
- "REJECTED"
- "WITHDRAWN"
- "SUSPENDED"

The overall status must be derived or transitioned safely from the two independent decisions.

Store separate fields or related decision records for:

- Government decision.
- Government reviewer.
- Government decision timestamp and rationale.
- Site/institution decision.
- Confirming Site PI or authorized institutional representative.
- Site decision timestamp and rationale.

Do not store only one generic "approved" flag.

Site confirmation security

- Only an authenticated, verified, authorized Site PI or explicitly authorized institutional representative may confirm participation.
- The Research PI who requested participation cannot impersonate the site approver.
- A Site PI cannot approve participation for an unrelated institution or site.
- A person cannot approve their own government verification decision.
- Site participation decisions must be study-specific.
- Declining one study's participation must not automatically deactivate the site's other studies.
- Do not automatically activate a StudySite association before both approvals are complete.
- Preserve historical decisions if a site later withdraws or is suspended.

Site team members

Site personnel such as DEOs and nurses must have individual identities and appropriate verification.

- A Site PI may propose or invite eligible staff where authorized.
- Government verification is required before new personnel gain platform access.
- Site affiliation and role authorization must be validated separately.
- Site staff receive only the permissions appropriate to their approved site and assigned studies.
- Nurses and other clinical personnel must not automatically receive permissions for participant safety decisions, regulatory submissions, or unrelated studies.
- Follow any existing institution-specific approval rules in the repository.

---

9. Data Model and Database Migrations

Inspect existing models and migrations before designing additions.

Reuse the canonical User, Organization, OrganizationMember, Study, Site, StudySite, StudyTeamMember, Role, Permission, and AuditLog structures wherever appropriate.

If the current "OnboardingApplication" model is suitable, extend it rather than introducing a parallel request system.

Add only the missing concepts required to represent the workflow. These may include:

- Access request/application type.
- Applicant identity and requested scope.
- Verification case and decision history.
- Secure invitation/activation token records.
- Organization or study membership approval state.
- Site participation request and independent government/site decisions.
- First-login setup state.
- Verification reviewer assignments, if needed.

Treat this list as design guidance, not an instruction to create every model regardless of need.

Data integrity

- Use foreign keys and appropriate uniqueness constraints.
- Prevent duplicate active memberships and duplicate active invitations where relevant.
- Use transactions for approval operations that create or activate related records.
- Protect against concurrent approval, rejection, activation, or invitation consumption.
- Use explicit enums or validated state-machine transitions.
- Preserve referential integrity and historical audit records.
- Add indexes for review queues, pending invitations, application status, and site participation lookup.
- Never use a client-supplied user ID as proof of identity or authority.
- Avoid storing unnecessary copies of identity documents or credentials.

Migration requirements

- Write forward Alembic migrations.
- Preserve existing records and current API behavior.
- Do not drop or rewrite existing data merely to simplify the new workflow.
- Provide safe defaults for existing users and memberships.
- Explain how existing accounts are classified and whether any manual reconciliation is required.
- Test migrations against the supported development/test database setup.

---

10. Resend Email and Secure Account Activation

Implement email delivery through a small service abstraction using Resend.

Email must be triggered by approved lifecycle events, not arbitrary frontend requests.

Email types

- Access request received.
- Additional information required.
- Access request approved and activation required.
- Invitation to join an organization or study.
- Site participation request notification.
- Site participation confirmation requested.
- Site participation decision notification.
- Account activation confirmation.
- Appropriate rejection notification without credentials.

Activation security

- Generate cryptographically secure, single-use, expiring activation tokens.
- Store only a secure hash of each token in the database.
- Bind tokens to the intended user, purpose, and relevant invitation/application.
- Consume tokens atomically so concurrent requests cannot reuse them.
- Invalidate expired, revoked, superseded, or already-consumed tokens.
- Avoid leaking whether arbitrary email addresses belong to the system.
- Do not put passwords in URLs, emails, logs, or API responses.
- Never email a plaintext or temporary reusable password.
- Rate-limit sensitive public endpoints where infrastructure supports it.
- Use "APP_BASE_URL" to build links; do not trust a client-supplied host header to generate activation URLs.

Failure handling

- A Resend failure must not silently mark an account as activated.
- Preserve a retryable email-delivery state.
- Make retries safe and idempotent.
- Avoid sending duplicate activation emails for the same event unnecessarily.
- Provide clear development-mode behavior when email credentials are absent.
- Never print the full activation token in logs.
- Do not claim an email was delivered merely because an API request was attempted.

Use Resend's supported API/library patterns already used in the project, or add the smallest compatible integration if none exists. Keep email transport separate from business logic.

---

11. Authentication, RBAC and Authorization

The backend is the security authority.

Implement or extend explicit permission scopes for:

- Platform verification.
- Platform administration.
- Organization membership.
- Study team membership.
- Site membership.
- Study-site participation confirmation.

Adapt the design to the existing Role and Permission system rather than creating a second authorization framework.

Mandatory security rules

- Unverified applicants cannot access protected dashboards.
- Approved-but-not-activated users cannot access normal dashboards.
- A user's requested role is not automatically their granted role.
- The frontend must not be trusted to enforce permissions.
- Every sensitive API operation checks authentication, permission, resource scope, and current state.
- An organization admin cannot approve global platform access unless explicitly granted the platform-level permission.
- A Research PI cannot approve their own verification or grant themselves additional platform privileges.
- A Site PI cannot act outside their verified site scope.
- An already-active user's invitation must not silently expand their privileges.
- A user cannot bypass verification by calling the API directly.
- Account suspension or revocation must be enforced by the backend.
- Preserve the current secure bootstrap rule for anonymous user creation when the database contains zero users, if it is part of the existing contract.

Review JWT/session handling to ensure that changes to activation, suspension, and critical role assignments take effect appropriately. Do not allow stale claims to preserve revoked privileges indefinitely.

---

12. Audit Trail and Compliance

Every security-relevant transition must produce an audit record.

Include events equivalent to:

- Access request submitted.
- Applicant information updated.
- Documents added or replaced.
- Verification started.
- Additional information requested.
- Verification approved or rejected.
- User activated.
- Invitation created, accepted, revoked, or expired.
- Organization membership requested or approved.
- Study team assignment created or changed.
- Site participation requested.
- Government site decision recorded.
- Site/institution confirmation recorded.
- Study-site participation activated, rejected, withdrawn, or suspended.
- Role or permission changed.
- User suspended or access revoked.
- Bootstrap and first-login setup completed.

Use the existing append-only/hash-chained AuditLog implementation if available.

Each audit event should capture the authenticated actor, action, target entity, timestamp, and appropriate before/after metadata. Record decision reasons where appropriate.

Never put passwords, raw activation tokens, API keys, or unnecessary sensitive identity-document content into audit metadata.

Do not allow ordinary users to edit or delete historical verification decisions.

---

13. Frontend Requirements

Implement a consistent, production-quality onboarding experience using the existing React architecture and reusable components.

Do not rebuild the frontend with another framework or create duplicate UI component systems.

Public access pages

Provide distinct entry points for:

- Research PI.
- CRO staff.
- Site PI.

Include:

- Clear eligibility and application instructions.
- Appropriate dynamic form fields.
- Client-side validation backed by server-side validation.
- Document upload or secure document-reference workflow consistent with the existing storage implementation.
- Submission confirmation and request reference.
- Safe application-status lookup or authenticated status page.
- Additional-information response flow.
- Account activation and password setup.

Government verification dashboard

Provide:

- Pending access requests.
- Pending team-member verification.
- Pending site verification.
- Pending site participation decisions.
- Search, filtering, sorting, pagination, and status indicators.
- Applicant detail and permitted document review.
- Verification timeline and audit history.
- Approve, reject, and request-information actions.
- Required reason/confirmation dialogs for sensitive decisions.
- Separate visibility for government approval versus Site PI/institution confirmation.

Research PI dashboard

Provide:

- Own profile and verification status.
- Organization and study context.
- Research-team list and invitations.
- Individual member verification status.
- Pending and approved memberships.
- Site participation requests with both decision statuses.
- Clear indication of why a request is waiting.
- No controls that allow the PI to approve government verification.

Site PI dashboard

Provide:

- Profile and site affiliation.
- Site verification status.
- Incoming study participation requests.
- Independent confirm/decline actions with appropriate justification.
- Site staff and pending verification list, where authorized.
- Study participation status and history.

Super Admin first-login experience

- Dedicated forced setup route.
- Password and profile completion.
- Validation and actionable error messages.
- No normal dashboard access until setup is complete.
- Safe handling of expired or invalid setup sessions.

UI constraints

- Reuse existing design tokens, components, routing, form patterns, and API client.
- Use loading, empty, error, and success states.
- Provide accessible labels, keyboard navigation, and responsive layouts.
- Keep government, research, and site dashboards clearly separated by role and scope.
- Do not display fake metrics, hardcoded applicants, simulated approvals, or placeholder success messages as real functionality.

---

14. API Contract and Backward Compatibility

The existing API contract has been frozen and hardened. Treat "docs/API_CONTRACT.md" and "docs/openapi.json" as authoritative starting points.

Before implementation:

1. Inspect existing onboarding, authentication, user, organization, site, study, team, email, and audit endpoints.
2. Identify which capabilities already exist.
3. Reuse existing endpoints when they correctly support the required workflow.
4. Identify missing behavior and model it explicitly.

Add or modify endpoints only where required. Possible endpoint families include:

- Public access request submission.
- Applicant application-status and information updates.
- Government review queue and decision actions.
- Team invitation creation and response.
- Account activation and password setup.
- Site participation request and confirmation.
- Super Admin bootstrap/setup and verifier management.
- Authorized membership and role assignment management.

These are endpoint families, not mandated URL strings. Follow the existing API naming and versioning conventions.

Contract rules

- Do not invent fields or enum values in the frontend.
- Generate or update OpenAPI schemas and frontend types from the canonical contract where the existing workflow supports generation.
- Update "docs/API_CONTRACT.md", "docs/openapi.json", and any relevant gap/decision documentation.
- Document request/response examples, authorization requirements, status transitions, and error behavior.
- Preserve existing endpoints and authentication semantics unless a justified, documented compatibility change is necessary.
- Never weaken authorization to make the frontend work.
- Do not change unrelated backend functionality.

---

15. Testing Requirements

Write and run automated tests covering the complete lifecycle.

Backend tests

At minimum, verify:

1. Research PI can independently submit an access request.
2. CRO staff can independently submit an access request.
3. Site PI can independently submit an access request.
4. Invalid or incomplete applications are rejected with appropriate validation errors.
5. Anonymous applicants cannot access protected dashboards.
6. An unverified user cannot access protected APIs.
7. An approved but unactivated user cannot access protected dashboards.
8. Government approval creates the correct pending access state.
9. Rejection does not issue activation credentials.
10. Reviewers cannot approve their own access requests.
11. Organization admins cannot perform global government verification.
12. Research PIs cannot self-approve team members.
13. Team invitations are scoped to the correct organization/study.
14. Invitation tokens are single-use and expire correctly.
15. Activation tokens are stored hashed and cannot be reused.
16. Resend failures do not falsely activate accounts.
17. Super Admin bootstrap is idempotent and does not overwrite an existing account.
18. First-login setup cannot be bypassed.
19. Government site approval alone does not activate site participation.
20. Site confirmation alone does not activate site participation.
21. Site participation becomes active only after both required approvals and all other applicable prerequisites.
22. Unauthorized users cannot confirm another site's participation.
23. A Site PI cannot confirm participation for an unrelated site.
24. Concurrent or repeated decisions cannot corrupt the state machine.
25. Every important transition generates the expected audit record.
26. Existing user creation/bootstrap security rules continue to work.
27. Existing API contract tests and regression tests remain green.

Mock Resend in automated tests. Do not send real emails from the test suite.

Frontend tests

Test:

- All three public entry points.
- Form validation and submission.
- Application-status display.
- Government verification actions and error states.
- Research PI invitation workflow.
- Site PI participation confirmation.
- First-login setup.
- Loading, empty, and failure states.
- Route guards and role-specific navigation.
- No UI action grants permissions without backend confirmation.

Integration tests

Where the repository supports integration testing, exercise the end-to-end flow:

"Applicant → Access Request → Government Review → Approval → Resend Activation → Password Setup → Login → Role-Scoped Dashboard"

Also test:

"Research PI → Site Participation Request → Government Approval + Site Confirmation → Active StudySite Association"

Use a test database and mocked email provider.

---

16. Implementation Order

Execute in this order:

Phase 1 — Repository discovery

Inspect:

- "AGENTS.md", "DESIGN.md", "MEMORY.md", and existing project context files if present.
- Backend models, schemas, services, routers, migrations, and tests.
- Existing authentication and bootstrap logic.
- Role/permission and resource-scope checks.
- Frontend routes, components, API client, and current dashboard pages.
- Current OpenAPI contract and documentation.
- Existing email or object-storage abstractions.

Do not overwrite project-specific instructions.

Phase 2 — Gap analysis and design

Write a concise implementation note covering:

- Existing reusable components.
- Missing capabilities.
- State machines and transition rules.
- Authorization matrix.
- Database additions and migrations.
- API contract changes.
- Resend integration.
- Security risks and mitigation.

Keep the plan aligned with the decisions in this prompt. Do not ask the user to reapprove decisions already specified here.

Phase 3 — Backend and database

Implement canonical models, migrations, validation, services, authorization, APIs, email integration, and audit events.

Keep business logic in the appropriate service/domain layer rather than embedding it all in route handlers.

Phase 4 — Frontend

Implement the public entry points, verification queue, research-team workflow, site participation workflow, activation flow, and first-login setup using existing reusable architecture.

Phase 5 — Verification

Run the relevant migrations, backend tests, linting, type checks, frontend tests, and production build.

Fix regressions introduced by this implementation. Do not edit unrelated systems to hide failures.

Phase 6 — Documentation and handoff

Update the API contract, OpenAPI specification, environment example, workflow/state-machine documentation, and developer setup instructions.

Provide an implementation report containing:

- Features implemented.
- Files and migrations changed.
- Endpoints added or changed.
- Roles and permission scopes.
- State transitions.
- Environment variables required.
- How to configure Resend.
- Commands executed and actual test results.
- Any unimplemented items or known limitations.
- Exact manual steps needed for end-to-end verification.

Clearly distinguish tests actually executed from tests that remain pending.

---

17. Non-Negotiable Constraints

- Do not treat this feature as organization onboarding alone.
- Do not merge Research PI and Site PI into one role.
- Do not assume that a PI's invitation equals government approval.
- Do not assume government site approval equals institutional participation confirmation.
- Do not activate study-site participation until both required decisions are satisfied.
- Do not email plaintext passwords.
- Do not store raw activation tokens.
- Do not grant a user permissions simply because they requested them.
- Do not let the frontend serve as the only authorization layer.
- Do not duplicate existing canonical domain entities.
- Do not delete existing data or casually rewrite frozen API contracts.
- Do not create fake data or report unverified functionality as complete.
- Do not silently bypass migration, security, or test failures.
- Keep changes modular, auditable, type-safe, and compatible with the current AyuCTMS architecture.

Definition of Done

The feature is complete only when the three independent access-request entry points work; Government Verification Team approval is enforced server-side; team members undergo individual verification; Super Admin bootstrap and first-login setup are secure; Resend activation works through a safe token lifecycle; Research PI and Site PI permissions remain distinct; site participation requires both government approval and authorized site/institution confirmation; audit records are created; API documentation is updated; and automated tests demonstrate the critical approval, denial, activation, authorization, and state-transition rules.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-10-09T17:49:42+04:00.
</ADDITIONAL_METADATA>