# AIIA CTMS — Memory Archive

This archive contains older task log entries rotated from `memory.md` / `MEMORY.md` per AGENTS.md protocol A7.

---

### 2026-09-28 · T-000 · Phase 0 — Project Context & Development Contract
- **What:** Ingested and verified Phase 0 requirements, CTMS business model, PI role scope, RBAC & scope decoupling, task lifecycle, and design system contracts.
- **Why:** Establish foundational understanding and architecture boundaries before any code is written.
- **How:** Inspected `/root/ayu-back/mvp` files, strictly enforced directory boundary constraints.
- **Result:** Confirmed clean workspace in `/root/ayu-back/mvp`, zero feature code written in Phase 0, all architecture principles validated.
- **Verified by:** Directory inspection (`ls -la`), `DESIGN.md` review, `MEMORY.md` update.
- **Dead ends:** none.
- **Follow-ups:** Await Phase 1 explicit instructions for PI Dashboard product architecture and segmentation.

---

### 2026-09-29 · T-001 · Phase 1 — Segment A: PI Dashboard Foundation + Overview
- **What:** Built complete PI Application Shell, Global Navigation, Study/Site Context Switcher, Overview Dashboard with 9 clinical operations sections, service & repository abstraction layer, and verification suite.
- **Why:** Establish the site-level clinical trial operations center for Principal Investigators per Phase 1 Segment A requirements.
- **How:** Created types, mockData, repositories, services, StudyContext, AppShell, Header, Sidebar, UI primitives, 7 dashboard widget components, and DashboardOverviewPage.
- **Result:** Fully functional, responsive PI operations overview with interactive study/site switching, loading/empty/error states, and calculated recruitment metrics. Future modules connected via non-functional placeholders.
- **Verified by:** `npm run typecheck` (0 errors), `npm test` (5/5 unit tests passed), `npm run build` (production assets generated), `curl` HTTP 200 checks on Dev and Preview servers, secret scan (0 secrets).
- **Dead ends:** Initial `--experimental-strip-types` test runner hit Node ESM relative import resolution; resolved cleanly with Vite SSR test bundle runner (`npm test`).
- **Follow-ups:** Await Segment B instructions (Participant Management).

---

### 2026-09-29 · T-002 · Phase 1 — Segment B: Participant Management
- **What:** Implemented the Participant Management module: domain models, `IParticipantRepository` & `MockParticipantRepository`, `participantService`, `ParticipantManagementPage` (`/pi/patients`) with search/filters/summary strip/desktop table/mobile cards/edge states, and `ParticipantDetailPage` (`/pi/patients/:participantId`) with identity, milestones, activities, safety logs, and invalid ID handling.
- **Why:** Provide the operational participant directory and subject-level oversight for Principal Investigators per Phase 1 Segment B requirements.
- **How:** Created ParticipantStatusBadge, ParticipantSummaryCards, ParticipantFiltersBar, ParticipantTable, ParticipantMobileCard, ParticipantManagementPage, ParticipantDetailPage, mockParticipantRepository, participantService; updated routes, mockData, and expanded services.test.ts to 10 test suites.
- **Result:** Fully functional participant directory and detail views with strict study/site scoping, composite search & filters, derived summary metrics, and responsive desktop/mobile layouts.
- **Verified by:** `npm run typecheck` (0 errors), `npm test` (10/10 automated tests passed), `npm run build` (production assets generated), `npm run verify` (exit code 0), `curl` HTTP 200 checks on `/pi/patients` and `/pi/patients/PT-1023` on Dev and Preview servers, raw mock import scan (0 raw imports in UI), secret scan (0 secrets).
- **Dead ends:** none.
- **Follow-ups:** Await Segment C instructions (Visits & Clinical Activities).

---

### 2026-09-29 · T-003 · Phase 1 — Segment C: Visits & Clinical Activities
- **What:** Implemented the Visits & Clinical Activities module: protocol visit definitions, allowable window calculation engine, deterministic status derivation (`SCHEDULED`, `DUE`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`, `MISSED`, `CANCELLED`), `IVisitRepository` & `MockVisitRepository`, `visitService`, `VisitsManagementPage` (`/pi/visits`), `VisitDetailPage` (`/pi/visits/:visitId`), procedure checklist with sign-off capability, participant timeline integration in `ParticipantDetailPage`, and expanded verification suite to 20 tests.
- **Why:** Provide the Principal Investigator with full site-level visit scheduling, protocol window compliance tracking, and procedural activity oversight.
- **How:** Created `visitCalculations.ts`, `VisitStatusBadge`, `VisitSummaryCards`, `VisitFiltersBar`, `VisitWindowDisplay`, `ClinicalActivityList`, `VisitTable`, `VisitMobileCard`, `VisitsManagementPage`, `VisitDetailPage`, `mockVisitRepository`, `visitService`; updated routes, `ParticipantDetailPage`, and expanded `services.test.ts` to 20 automated test suites.
- **Result:** Fully functional site visit schedule directory, allowable window tracking, procedural activity sign-off, participant visit schedule timeline, and responsive desktop/mobile layouts.
- **Verified by:** `npm run typecheck` (0 errors), `npm test` (20/20 automated tests passed), `npm run build` (production assets generated), `npm run verify` (exit code 0), `curl` HTTP 200 checks on `/`, `/pi/dashboard`, `/pi/visits`, `/pi/visits/VIS-1023-04`, `/pi/patients/PT-1023`, raw mock import scan (0 raw mock imports in UI), secret scan (0 secrets detected).
- **Dead ends:** none.
- **Follow-ups:** Await Segment D instructions (Safety Pharmacovigilance). Do not proceed automatically.

---

### 2026-09-29 · T-004 · Phase 1 — Segment D: PI Dashboard — Safety & Pharmacovigilance
- **What:** Implemented the complete Safety & Pharmacovigilance module: safety domain models (`SafetyEvent`, `Severity`, `Seriousness`, `Causality`, `ActionTaken`, `PIReviewStatus`, `FollowUpStatus`), `ISafetyRepository` & `MockSafetyRepository`, `safetyService`, `SafetyManagementPage` (`/pi/safety`), `SafetyEventDetailPage` (`/pi/safety/:eventId`), 5 visual badge primitives, summary metric cards, multi-criteria filters bar, responsive table and mobile cards, interactive PI review workflow, follow-up tracking, participant detail safety history integration, and expanded test suite to 30 tests.
- **Why:** Provide the Principal Investigator with operational safety event oversight, AE/SAE management, PI review sign-off, and follow-up compliance tracking while strictly decoupling severity, seriousness, and causality.
- **How:** Created `SafetyEventTypeBadge`, `SafetySeverityBadge`, `SafetySeriousnessBadge`, `SafetyReviewBadge`, `SafetyFollowUpBadge`, `SafetySummaryCards`, `SafetyFiltersBar`, `SafetyEventTable`, `SafetyEventMobileCard`, `mockSafetyRepository`, `safetyService`, `SafetyManagementPage`, `SafetyEventDetailPage`; updated `types/index.ts`, `repositories/interfaces.ts`, `mockData.ts`, `routes/index.tsx`, `ParticipantDetailPage.tsx`, and added tests 21–30 to `services.test.ts`.
- **Result:** Fully functional safety event directory, clinical event detail page with interactive PI sign-off, decoupled severity and seriousness representation, participant safety history linking, and responsive desktop/mobile layouts.
- **Verified by:** `npm run typecheck` (0 errors), `npm test` (30/30 automated tests passed), `npm run build` (production assets generated), `npm run verify` (exit code 0), `curl` HTTP 200 checks on `/`, `/pi/dashboard`, `/pi/patients`, `/pi/patients/PT-1023`, `/pi/visits`, `/pi/visits/VIS-1023-04`, `/pi/safety`, `/pi/safety/SAE-003`, raw mock import scan (0 raw mock imports in UI), secret scan (0 secrets detected).
- **Dead ends:** Fixed block-scoped variable collision in `services.test.ts` where `safetySummary` was shadowed between overview and safety tests.
- **Follow-ups:** Await Segment E instructions (Protocol Compliance). Do not proceed automatically.

---

### 2026-09-29 · T-005 · Phase 1 — Segment E: PI Dashboard — Protocol Compliance & Deviations
- **What:** Implemented the complete Protocol Compliance & Deviations module: compliance domain models (`ProtocolDeviation`, `DeviationScope`, `DeviationCategory`, `DeviationClassification`, `RootCauseCategory`, `DeviationStatus`, `CapaStatus`, `ComplianceReviewStatus`, `ComplianceSummaryMetrics`, `ParticipantComplianceSummary`), `IComplianceRepository` & `MockComplianceRepository`, `complianceService`, `ComplianceManagementPage` (`/pi/compliance`), `ComplianceDeviationDetailPage` (`/pi/compliance/:deviationId`), 5 visual badge primitives, summary metric cards, multi-criteria filters bar, responsive table and mobile cards, interactive CAPA workflow and status tracking, interactive PI review sign-off workflow, participant detail compliance history integration, visit detail deviation integration, overview dashboard card integration, and expanded test suite to 50 tests.
- **Why:** Provide the Principal Investigator with operational oversight of protocol non-compliance, GCP deviations, root cause evaluation, CAPA management, and regulatory review sign-off across participant, site, and study scopes.
- **How:** Created `DeviationClassificationBadge`, `DeviationStatusBadge`, `DeviationCapaBadge`, `DeviationReviewBadge`, `DeviationScopeBadge`, `ComplianceSummaryCards`, `ComplianceFiltersBar`, `ComplianceDeviationTable`, `ComplianceDeviationMobileCard`, `mockComplianceRepository`, `complianceService`, `ComplianceManagementPage`, `ComplianceDeviationDetailPage`; updated `types/index.ts`, `repositories/interfaces.ts`, `mockData.ts`, `routes/index.tsx`, `SafetyAndComplianceCards.tsx`, `ParticipantDetailPage.tsx`, `VisitDetailPage.tsx`, and added tests 31–50 to `services.test.ts`.
- **Result:** Fully functional protocol compliance directory, deviation detail page with interactive CAPA tracking and PI review sign-off, distinct classification/status/CAPA badges, participant compliance history, visit deviations section, overview dashboard live metrics, and responsive desktop/mobile layouts.
- **Verified by:** `npm run typecheck` (0 errors), `npm test` (50/50 automated tests passed), `npm run build` (production assets generated), `npm run verify` (exit code 0), `curl` HTTP 200 checks on `/`, `/pi/dashboard`, `/pi/patients`, `/pi/patients/PT-1023`, `/pi/visits`, `/pi/visits/VIS-1023-04`, `/pi/safety`, `/pi/safety/SAE-003`, `/pi/compliance`, `/pi/compliance/DEV-001`, `/pi/compliance/DEV-004`, raw mock import scan (0 raw mock imports in UI), secret scan (0 secrets detected).
- **Dead ends:** In `services.test.ts`, renamed `searchById` in Test 33 to `searchDevById` to prevent redeclaration collision with Test 25. In `ComplianceDeviationDetailPage.tsx`, removed unused icon imports to satisfy strict TypeScript compiler.
- **Follow-ups:** Await Segment F instructions (Team & Custom Roles). Do not proceed automatically.

---

### 2026-09-29 · T-006 · Phase 1 — Segment E Audit Remediation & Polish
- **What:** Addressed all 7 audit findings for Segment E:
  1. Fixed Open Deviations summary card filter (`status: 'OPEN'` excludes `RESOLVED` and `CLOSED`, matching `metrics.open`).
  2. Fixed PI Review Required summary card filter (`reviewStatus: 'REVIEW_REQUIRED'` includes `SIGN_OFF_REQUIRED` and `NOT_REVIEWED`, matching `metrics.piReviewRequired`).
  3. Fixed CAPA Pending summary card filter (`capaStatus: 'PENDING_OR_ACTIVE'` includes `PENDING` and `IN_PROGRESS`, matching `metrics.capaPending`).
  4. Restored and enforced deviation lifecycle transition validation (`isValidDeviationStatusTransition`, rejecting illegal transitions such as `REPORTED -> CLOSED`).
  5. Renamed UI and report claims from "Audit & Traceability / GCP compliance trail" to "Audit Metadata / System record & tracking metadata".
  6. Added functional Date Range dropdown UI (`ALL`, `LAST_7_DAYS`, `LAST_30_DAYS`) to `ComplianceFiltersBar` and cleaned `dateRange` in `DeviationFilters`.
  7. Toned down regulatory badges and tooltips to avoid implying automatic legal obligations (e.g. removed "expedited reporting required", "Sponsor alert", "ICH-GCP E6 Adherence" badge).
- **Why:** Resolve audit discrepancies between summary card counts and filtered record tables, enforce clinical workflow transition rules, ensure factual claims regarding audit metadata, and remove overly prescriptive regulatory language.
- **How:** Updated `types/index.ts`, `mockComplianceRepository.ts`, `complianceService.ts`, `ComplianceFiltersBar.tsx`, `ComplianceSummaryCards.tsx`, `ComplianceManagementPage.tsx`, `ComplianceDeviationDetailPage.tsx`, `DeviationClassificationBadge.tsx`, `DeviationReviewBadge.tsx`, `SafetySeriousnessBadge.tsx`, and added test assertions to `services.test.ts`.
- **Result:** Summary card filters now return exactly the counts advertised on the cards; lifecycle status cannot make invalid jumps; Date Range can be filtered in the UI; Audit card accurately claims Audit Metadata; badges and tooltips reflect balanced clinical operational oversight.
- **Verified by:** `npm run typecheck` (0 errors), `npm run test` (50/50 test suites passed), `npm run build` (production build succeeded), `npm run verify` (exit code 0), secret scan (0 secrets).
- **Dead ends:** None.
- **Follow-ups:** Ready for Segment F (Team & Custom Roles) whenever instructed.

---

### 2026-09-29 · T-007 · Phase 1 — Segment F: PI Dashboard — Team & Custom Roles
- **What:** Implemented the complete Team & Custom Roles module: domain models (`User`, `Role`, `RoleType`, `Permission`, `PermissionModule`, `PermissionAction`, `UserRole`, `TeamMemberSummary`, `TeamMemberDetail`, `TeamFilters`, `RoleFilters`, `TeamSummaryMetrics`, `RoleWithCounts`, `CreateCustomRoleInput`, `UpdateCustomRoleInput`, `AssignRoleInput`), `ITeamRepository` and `MockTeamRepository`, `teamService`, 8 UI components in `src/components/team/` (`RoleBadge`, `UserStatusBadge`, `PermissionMatrix`, `TeamSummaryCards`, `TeamFiltersBar`, `TeamMemberTable`, `TeamMemberMobileCard`, `AssignRoleModal`, `CreateCustomRoleModal`), 4 pages (`TeamManagementPage` at `/pi/team`, `TeamMemberDetailPage` at `/pi/team/:userId`, `RoleManagementPage` at `/pi/team/roles`, `RoleDetailPage` at `/pi/team/roles/:roleId`), active routing integration in `src/routes/index.tsx`, and expanded automated test suite to 64 tests.
- **Why:** Provide the Principal Investigator with full site-level staff oversight, ICH-GCP delegation of authority logs, custom clinical role authoring with granular permission matrices, and dynamic effective permissions calculation while strictly enforcing scope and site isolation.
- **How:** Built service/repository data layer adhering to `UI -> Service -> Repository -> Mock Data` architecture. Strictly separated permissions (what) from scope (where: `studyId` + `siteId`). Derived effective permissions as dynamic union of assigned role permissions. Enforced system role template immutability, unique custom role names, non-empty custom role permission arrays, and duplicate assignment rejection. Verified strict cross-site isolation where queries outside current site return `null` without data leakage.
- **Result:** Fully functional team directory with composite search/status/role filtering, member detail page with profile summary and live permission matrix, role directory and editor distinguishing system templates from custom roles, interactive custom role creation and role assignment dialogs, and responsive desktop/mobile layouts.
- **Verified by:** `npm run typecheck` (0 errors), `npm test` (64/64 automated test suites passed), `npm run build` (production assets generated), `npm run verify` (exit code 0), `curl` HTTP 200 checks on `/`, `/pi/team`, `/pi/team/roles`, `/pi/team/roles/ROLE_PI`, `/pi/team/USR-101`, raw mock import scan (0 raw mock imports in UI), secret scan (0 secrets detected).
- **Dead ends:** Removed unused `User` import in `src/repositories/interfaces.ts`, added `roleType` alias to `RoleFilters` and `studyId`/`siteId` to `AssignRoleInput` to support flexible repository assignment signatures, and resolved `EmptyState` prop typing.
- **Follow-ups:** Await instructions for next phase (e.g. Segment G: Task Management). Do not proceed automatically.

---

### 2026-09-29 · T-008 · Phase 1 — Segment G: PI Dashboard — Task Management & Approvals
- **What:** Implemented the complete Task Management & Approvals module: domain models (`Task`, `TaskAssignment`, `TaskApproval`, `TaskStatus`, `TaskCategory`, `TaskPriority`, `TaskApprovalDecision`, `RelatedEntityType`, `TaskSummaryMetrics`, `TaskFilters`, `CreateTaskInput`, `AssignTaskInput`), lifecycle calculations and date engine (`isValidTaskTransition`, `isTaskOverdue`, `isTaskDueToday`), `ITaskRepository` and `MockTaskRepository`, `taskService`, 8 UI components in `src/components/tasks/` (`TaskStatusBadge`, `TaskPriorityBadge`, `TaskCategoryBadge`, `TaskSummaryCards`, `TaskFiltersBar`, `TaskTable`, `TaskMobileCard`, `CreateTaskModal`, `AssignTaskModal`, `TaskApprovalModal`), 2 pages (`TaskManagementPage` at `/pi/tasks` and `TaskDetailPage` at `/pi/tasks/:taskId`), active routes in `src/routes/index.tsx`, and expanded automated test suite from 64 to 80 tests.
- **Why:** Provide the Principal Investigator with an operational task-control center to delegate, track, review, and approve clinical trial site activities (across safety, compliance, visits, pharmacy, documentation, and participants) with rigorous lifecycle enforcement and cross-site isolation.
- **How:** Built service/repository layer adhering to `UI -> Service -> Repository -> Mock Data`. Created 14 realistic clinical trial tasks with cross-links to SAE-003, DEV-001, DEV-002, DEV-003, VIS-1023-04, PT-1011. Implemented strict state transitions preventing direct completion of tasks requiring approval. Enforced active site staff validation on assignment. Created desktop table and mobile cards, interactive PI approval / revision / rejection modals, and clinical entity deep links.
- **Result:** Fully functional task control system with 6 KPI summary filter cards, multi-criteria composite filtering, new task authoring, delegation modals, and task detail page with visual lifecycle stepper, clinical source links, and audit history.
- **Verified by:** `npm run typecheck` (0 errors), `npm test` (80/80 automated test suites passed), `npm run build` (production assets generated), `npm run verify` (exit code 0), `curl` HTTP 200 checks on `/pi/tasks` and `/pi/tasks/TSK-101`, raw mock import scan (0 raw mock imports in UI), secret scan (0 secrets detected).
- **Dead ends:** Resolved `EmptyState` prop requirement to pass JSX element instead of component identifier, corrected `CardHeader`/`CardContent` usage to standard styled `div` wrappers, and fixed property names for `myOpen` and `dueDateFilter`.
- **Follow-ups:** Await instructions for next phase (e.g. Segment H: Document Management). Do not proceed automatically.

---

### 2026-09-29 · T-009 · Phase 1 — Segment H: PI Dashboard — Document Management & Expiry Tracking
- **What:** Implemented the complete Document Management & Expiry Tracking module: domain models (`Document`, `DocumentVersion`, `DocumentStatus`, `DocumentCategory`, `DocumentType`, `DocumentExpiryState`, `DocumentSummaryMetrics`, `DocumentFilters`, `CreateDocumentInput`, `CreateDocumentVersionInput`, `UpdateDocumentInput`), deterministic expiry calculations and date engine (`calculateDocumentExpiryState`, `getDaysUntilExpiry`, `deriveDocumentStatus`, `isDocumentActionRequired`), `IDocumentRepository` and `MockDocumentRepository`, `documentService`, 8 UI components in `src/components/documents/` (`DocumentStatusBadge`, `DocumentCategoryBadge`, `DocumentExpiryBadge`, `DocumentSummaryCards`, `DocumentFiltersBar`, `DocumentTable`, `DocumentMobileCard`, `DocumentVersionHistory`, `CreateDocumentModal`, `CreateDocumentVersionModal`), 2 pages (`DocumentManagementPage` at `/pi/documents` and `DocumentDetailPage` at `/pi/documents/:documentId`), routing integration in `src/routes/index.tsx`, and expanded automated test suite from 80 to 100 tests.
- **Why:** Provide the Principal Investigator with full regulatory binder control, GCP document versioning, operational expiration monitoring, and Action Required alerts for missing or expired mandatory trial records across the assigned clinical study site.
- **How:** Built service/repository layer adhering to `UI -> Service -> Repository -> Mock Data`. Created 15 realistic clinical trial documents across SITE-001 (12), SITE-002 (2), and SITE-003 (1) with multi-version histories, cross-links to clinical entities (DEV-003, DEV-002, PT-1011, TSK-106, SAE-003), and expiration horizons. Implemented strict version uniqueness, immutable historical preservation of superseded versions, and owner validation against active site staff. Enforced scope isolation where cross-site lookups return `null` without leakage.
- **Result:** Fully functional document register with 6 KPI summary filter cards, multi-criteria composite filtering (Search, Category, Type, Status, Expiry, Obligation, Owner), desktop table and mobile cards, new document and new version authoring modals, and document detail view with version audit trail, owner metadata, and deep links to linked clinical records.
- **Verified by:** `npm run typecheck` (0 errors), `npm test` (100/100 automated test suites passed), `npm run build` (production assets generated), `npm run verify` (exit code 0), `curl` HTTP 200 checks on `/pi/documents` and `/pi/documents/DOC-101`, raw mock import scan (0 raw mock imports in UI), secret scan (0 secrets detected).
- **Dead ends:** Resolved `EmptyState` prop convention to use `actionLabel` and `onAction` instead of `action` JSX element, resolved unused imports flagged by `tsc -b`, and fixed regression count in Test 100 to expect 11 tasks at SITE-001.
- **Follow-ups:** Await instructions for next phase (e.g. Segment I: Reports & Regulatory Exports). Do not proceed automatically.

---

### 2026-09-29 · T-010 · Phase 1 — Segment H Enhancement: Document File Upload & Management Controls
- **What:** Implemented interactive drag-and-drop file upload (`FileUploadZone`), metadata auto-extraction (name, type, size, object URL), client-side file preview and real file download in `DocumentVersionHistory`, document metadata editor modal (`EditDocumentModal`), and "Edit Metadata" action on `DocumentDetailPage`.
- **Why:** Empower user and Principal Investigator to upload actual files directly from their machine into the trial binder, preview and download version files, and update document classification, dates, obligation, and owner directly in the UI.
- **How:** Built `FileUploadZone` with HTML5 drag-and-drop and fallback file picker, object URL creation via `URL.createObjectURL(file)`, integrated zone into `CreateDocumentModal` and `CreateDocumentVersionModal`. Updated `DocumentVersionHistory` to open real uploaded blob URLs or generate structured regulatory trial record text blobs on-the-fly for seed documents. Created `EditDocumentModal` wired to `documentService.updateDocument()`.
- **Result:** Complete file upload and document management workflow is active in the browser. Users can drag/drop files, auto-extract file info, preview and download documents, and edit metadata without external cloud storage.
- **Verified by:** `npm run typecheck` (0 errors), `npm test` (100/100 automated test suites passed including new file blob and metadata update tests), `npm run build` (production assets generated), `npm run verify` (exit code 0), `curl` HTTP 200 checks on `/pi/documents` and `/pi/documents/DOC-101`, raw mock import scan (0 raw mock imports in UI), secret scan (0 secrets detected).
- **Dead ends:** Removed unused `File` icon import from `lucide-react` in `FileUploadZone.tsx` that conflicted with native browser `File` type.
- **Follow-ups:** Ready for Phase 1 — Segment I (Reports & Regulatory Exports).
