/**
 * CTMS Types & Interfaces for PI Operations
 */

export type StudyStatus = 'Draft' | 'Preparing' | 'Recruiting' | 'Active' | 'Suspended' | 'Completed' | 'Closed';

export type ActivityStatus = 'Upcoming' | 'Due Today' | 'Overdue' | 'Completed';

export type PriorityLevel = 'High' | 'Medium' | 'Normal';

export interface Site {
  id: string;
  name: string;
  siteCode: string;
  location: string;
  piId: string;
  piName: string;
}

export interface Study {
  id: string;
  code: string;
  title: string;
  shortDescription: string;
  protocolVersion: string;
  status: StudyStatus;
  sponsorName: string;
  targetEnrollment: number;
  sites: Site[];
}

export interface CurrentStudyContext {
  studyId: string;
  studyCode: string;
  studyTitle: string;
  protocolVersion: string;
  studyStatus: StudyStatus;
  siteId: string;
  siteName: string;
  siteCode: string;
  piId: string;
  piName: string;
  piRole: string;
}

export interface ParticipantSummary {
  screened: number;
  enrolled: number;
  active: number;
  completed: number;
  withdrawn: number;
}

export interface RecruitmentData {
  target: number;
  enrolled: number;
  remaining: number;
  progressPercent: number;
}

export interface VisitMetrics {
  upcoming: number;
  overdue: number;
  completedThisMonth: number;
}

export interface UpcomingActivityItem {
  id: string;
  participantId: string;
  activityName: string;
  dateLabel: string;
  status: ActivityStatus;
  assignedStaff: string;
}

export interface SafetySummary {
  adverseEvents: number;
  seriousAdverseEvents: number;
  pendingReview: number;
  followUpRequired: number;
}

export interface ComplianceSummary {
  openDeviations: number;
  criticalDeviations: number;
  pendingCorrectiveActions: number;
  lastAuditDate: string;
}

export interface PendingActionItem {
  id: string;
  title: string;
  category: 'Safety' | 'Compliance' | 'Report' | 'Task';
  priority: PriorityLevel;
  dueDateLabel: string;
  status: string;
  actionLabel: string;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  actor: string;
  role: string;
  timestampLabel: string;
  category: string;
}

export interface DashboardOverviewData {
  context: CurrentStudyContext;
  participantSummary: ParticipantSummary;
  recruitment: RecruitmentData;
  visits: VisitMetrics;
  safetySummary: SafetySummary;
  complianceSummary: ComplianceSummary;
  upcomingActivities: UpcomingActivityItem[];
  pendingActions: PendingActionItem[];
  recentActivities: RecentActivityItem[];
}

export type ParticipantLifecycleStatus =
  | 'SCREENING'
  | 'SCREENED'
  | 'ELIGIBLE'
  | 'ENROLLED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'SCREEN_FAILED'
  | 'WITHDRAWN'
  | 'LOST_TO_FOLLOW_UP';

export interface ParticipantActivityLog {
  id: string;
  activityName: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Overdue' | 'Scheduled';
  notes?: string;
  performedBy?: string;
}

export interface ParticipantSafetyLog {
  id: string;
  eventName: string;
  date: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  isSae: boolean;
  resolutionStatus: 'Resolved' | 'Ongoing' | 'Under Review';
}

export interface Participant {
  id: string;
  studyId: string;
  siteId: string;
  participantCode: string;
  participantNumber?: string;
  screeningCode: string;
  initials: string;
  age: number;
  sex: 'M' | 'F' | 'Other';
  email?: string;
  screeningDate: string;
  enrollmentDate: string | null;
  status: ParticipantLifecycleStatus;
  phase: string;
  assignedCoordinatorId: string;
  assignedCoordinatorName: string;
  lastActivityDate: string;
  lastActivityName: string;
  nextActivityDate: string | null;
  nextActivityName: string | null;
  attentionRequired: boolean;
  attentionReason: string | null;
  createdAt: string;
  updatedAt: string;
  recentActivities?: ParticipantActivityLog[];
  safetyEvents?: ParticipantSafetyLog[];
}

export interface ParticipantFilters {
  search?: string;
  status?: ParticipantLifecycleStatus | 'ALL';
  sex?: 'ALL' | 'M' | 'F' | 'Other';
  coordinatorId?: string;
  attentionRequired?: boolean;
}

export interface ParticipantSummaryMetrics {
  total: number;
  screening: number;
  enrolled: number;
  active: number;
  completed: number;
  withdrawn: number;
  screenFailed: number;
  attentionRequired: number;
}

export type VisitStatus =
  | 'SCHEDULED'
  | 'DUE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'MISSED'
  | 'CANCELLED'
  | 'NOT_APPLICABLE';

export type VisitAnchor = 'SCREENING_DATE' | 'ENROLLMENT_DATE' | 'PREVIOUS_VISIT';

export type VisitType =
  | 'SCREENING'
  | 'BASELINE'
  | 'TREATMENT'
  | 'FOLLOW_UP'
  | 'CLOSE_OUT'
  | 'END_OF_STUDY'
  | 'UNSCHEDULED';

export type ClinicalActivityStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'NOT_APPLICABLE';

export interface ProtocolVisitDefinition {
  id: string;
  studyId: string;
  protocolVersionId?: string;
  code: string;
  name: string;
  sequence: number;
  anchor: VisitAnchor;
  targetOffsetDays: number;
  targetDay?: number;
  windowBeforeDays: number;
  windowAfterDays: number;
  requiredActivities: string[];
  description?: string;
  required?: boolean;
  visitType?: VisitType;
  status?: string;
  notes?: string;
}

export interface ClinicalActivity {
  id: string;
  visitId: string;
  code: string;
  name: string;
  required: boolean;
  status: ClinicalActivityStatus;
  category?: 'Vital Signs' | 'Laboratory' | 'Physical Exam' | 'Questionnaire' | 'Medication' | 'Assessment';
  completedBy?: string;
  completedAt?: string;
  notes?: string;
}

export interface ParticipantVisit {
  id: string;
  studyId: string;
  siteId: string;
  participantId: string;
  participantCode: string;
  participantInitials: string;
  protocolVisitDefinitionId: string;
  protocolVersionId?: string;
  protocolVersionNumber?: string;
  visitCode: string;
  visitName: string;
  sequence: number;
  targetDate: string; // ISO YYYY-MM-DD
  windowStart: string; // ISO YYYY-MM-DD
  windowEnd: string; // ISO YYYY-MM-DD
  status: VisitStatus;
  completedDate?: string;
  cancelledDate?: string;
  assignedStaff?: string;
  notes?: string;
  activities: ClinicalActivity[];
  totalActivities: number;
  completedActivities: number;
  pendingActivities: number;
  requiredIncompleteActivities: number;
}

export interface VisitFilters {
  search?: string;
  status?: VisitStatus | 'ALL';
  participantId?: string;
  visitCode?: string;
  dateRange?: 'ALL' | 'TODAY' | 'NEXT_7_DAYS' | 'OVERDUE' | 'THIS_MONTH';
}

export interface VisitSummaryMetrics {
  total: number;
  due: number;
  upcoming: number;
  overdue: number;
  completed: number;
  missed: number;
}

export interface CalculatedVisitWindow {
  targetDate: string;
  windowStart: string;
  windowEnd: string;
}

// ==========================================
// SEGMENT D: SAFETY & PHARMACOVIGILANCE
// ==========================================

export type SafetyEventType = 'AE' | 'SAE';

export type Severity = 'MILD' | 'MODERATE' | 'SEVERE';

export type Seriousness =
  | 'DEATH'
  | 'LIFE_THREATENING'
  | 'HOSPITALIZATION'
  | 'DISABILITY'
  | 'CONGENITAL_ANOMALY'
  | 'OTHER_MEDICALLY_IMPORTANT'
  | 'NONE';

export type Causality =
  | 'NOT_ASSESSED'
  | 'NOT_RELATED'
  | 'UNLIKELY'
  | 'POSSIBLE'
  | 'PROBABLE'
  | 'DEFINITE';

export type ActionTaken =
  | 'NONE'
  | 'NO_CHANGE'
  | 'DOSE_ADJUSTED'
  | 'TREATMENT_INTERRUPTED'
  | 'TREATMENT_DISCONTINUED'
  | 'CONCOMITANT_MEDICATION'
  | 'HOSPITALIZATION'
  | 'OTHER';

export type SafetyEventStatus =
  | 'REPORTED'
  | 'UNDER_REVIEW'
  | 'PI_REVIEW_REQUIRED'
  | 'FOLLOW_UP_REQUIRED'
  | 'RESOLVED'
  | 'CLOSED';

export type PIReviewStatus =
  | 'NOT_REVIEWED'
  | 'UNDER_REVIEW'
  | 'REVIEWED'
  | 'SIGN_OFF_REQUIRED';

export type FollowUpStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'DUE'
  | 'COMPLETED'
  | 'OVERDUE';

export interface SafetyEvent {
  id: string;
  studyId: string;
  siteId: string;
  participantId: string;
  participantCode: string;
  participantInitials: string;

  eventType: SafetyEventType;

  title: string;
  description: string;

  onsetDate: string; // ISO YYYY-MM-DD
  resolutionDate?: string | null; // ISO YYYY-MM-DD
  ongoing: boolean;

  severity: Severity;
  seriousness: Seriousness;
  causality: Causality;

  actionTaken: ActionTaken;

  status: SafetyEventStatus;

  piReviewStatus: PIReviewStatus;

  followUpStatus: FollowUpStatus;
  followUpDueDate?: string | null; // ISO YYYY-MM-DD
  followUpNotes?: string | null;

  reportedBy: string;
  reportedAt: string; // ISO string

  reviewedBy?: string | null;
  reviewedAt?: string | null; // ISO string

  lastUpdatedAt: string; // ISO string
}

export interface SafetyFilters {
  search?: string;
  eventType?: SafetyEventType | 'ALL';
  status?: SafetyEventStatus | 'ALL';
  severity?: Severity | 'ALL';
  seriousness?: Seriousness | 'ALL';
  piReviewStatus?: PIReviewStatus | 'ALL';
  followUpStatus?: FollowUpStatus | 'ALL';
  participantId?: string;
  dateRange?: 'ALL' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'ONGOING' | 'OVERDUE_FOLLOWUP';
}

export interface SafetySummaryMetrics {
  total: number;
  ae: number;
  sae: number;
  ongoing: number;
  resolved: number;
  piReviewRequired: number;
  followUpDue: number;
  overdueFollowUp: number;
}

export interface ParticipantSafetySummary {
  totalEvents: number;
  aeCount: number;
  saeCount: number;
  ongoingCount: number;
  piReviewRequiredCount: number;
  events: SafetyEvent[];
}

// ==========================================
// SEGMENT E: PROTOCOL COMPLIANCE & DEVIATIONS
// ==========================================

export type DeviationScope = 'PARTICIPANT' | 'SITE' | 'STUDY';

export type DeviationCategory =
  | 'VISIT_WINDOW'
  | 'ELIGIBILITY'
  | 'INFORMED_CONSENT'
  | 'PROCEDURE'
  | 'PROTOCOL_PROCEDURE'
  | 'DOCUMENTATION'
  | 'DATA_ENTRY'
  | 'TRAINING'
  | 'INVESTIGATIONAL_PRODUCT'
  | 'SAMPLE_COLLECTION'
  | 'OTHER';

export type DeviationClassification = 'MINOR' | 'MAJOR' | 'CRITICAL';

export type RootCauseCategory =
  | 'HUMAN_ERROR'
  | 'TRAINING_GAP'
  | 'SCHEDULING'
  | 'SYSTEM_ISSUE'
  | 'DOCUMENTATION_GAP'
  | 'PROTOCOL_CLARITY'
  | 'RESOURCE_CONSTRAINT'
  | 'OTHER';

export type DeviationStatus =
  | 'REPORTED'
  | 'UNDER_REVIEW'
  | 'ACTION_REQUIRED'
  | 'CAPA_IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export const VALID_DEVIATION_STATUS_TRANSITIONS: Record<DeviationStatus, readonly DeviationStatus[]> = {
  REPORTED: ['UNDER_REVIEW', 'ACTION_REQUIRED', 'RESOLVED'],
  UNDER_REVIEW: ['ACTION_REQUIRED', 'CAPA_IN_PROGRESS', 'RESOLVED'],
  ACTION_REQUIRED: ['UNDER_REVIEW', 'CAPA_IN_PROGRESS', 'RESOLVED'],
  CAPA_IN_PROGRESS: ['RESOLVED', 'ACTION_REQUIRED'],
  RESOLVED: ['CLOSED', 'UNDER_REVIEW', 'ACTION_REQUIRED'],
  CLOSED: [],
};

export function isValidDeviationStatusTransition(
  currentStatus: DeviationStatus,
  targetStatus: DeviationStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = VALID_DEVIATION_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}

export type CapaStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE';

export type ComplianceReviewStatus =
  | 'NOT_REVIEWED'
  | 'UNDER_REVIEW'
  | 'REVIEWED'
  | 'SIGN_OFF_REQUIRED';

export interface ProtocolDeviation {
  id: string;
  studyId: string;
  siteId: string;

  scope: DeviationScope;
  participantId?: string;
  visitId?: string;

  protocolVersion: string;
  protocolSection?: string;

  category: DeviationCategory;
  classification: DeviationClassification;

  occurrenceDate: string; // ISO YYYY-MM-DD
  detectionDate: string; // ISO YYYY-MM-DD

  title: string;
  description: string;

  rootCauseCategory: RootCauseCategory;
  rootCauseDescription?: string;

  immediateAction?: string;

  capaRequired: boolean;
  capaStatus: CapaStatus;
  capaTargetDate?: string; // ISO YYYY-MM-DD
  capaActionSummary?: string;

  status: DeviationStatus;
  reviewStatus: ComplianceReviewStatus;

  reportedBy: string;
  reportedAt: string; // ISO string

  reviewedBy?: string | null;
  reviewedAt?: string | null; // ISO string

  resolvedAt?: string | null; // ISO string
  closedAt?: string | null; // ISO string

  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface DeviationFilters {
  search?: string;
  scope?: DeviationScope | 'ALL';
  classification?: DeviationClassification | 'ALL';
  status?: DeviationStatus | 'ALL' | 'OPEN';
  capaStatus?: CapaStatus | 'ALL' | 'PENDING_OR_ACTIVE';
  reviewStatus?: ComplianceReviewStatus | 'ALL' | 'REVIEW_REQUIRED';
  category?: DeviationCategory | 'ALL';
  participantId?: string;
  dateRange?: 'ALL' | 'LAST_7_DAYS' | 'LAST_30_DAYS';
}

export interface ComplianceSummaryMetrics {
  total: number;
  open: number;
  critical: number;
  major: number;
  minor: number;
  piReviewRequired: number;
  capaPending: number;
  capaOverdue: number;
  resolvedOrClosed: number;
}

export interface ParticipantComplianceSummary {
  totalDeviations: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  openCount: number;
  deviations: ProtocolDeviation[];
}

// ============================================================
// Segment F: Team & Custom Roles Domain Models
// ============================================================

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  displayName: string;
  email: string;
  designation: string;
  status: UserStatus;
  organization?: string;
  department?: string;
  phone?: string;
  employeeId?: string;
  mustChangePassword?: boolean;
  isTemporaryPassword?: boolean;
  notes?: string;
  participantId?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type RoleType = 'SYSTEM' | 'CUSTOM';

export interface Role {
  id: string;
  name: string;
  description: string;
  type: RoleType;
  permissionIds: string[];
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type PermissionModule =
  | 'STUDY'
  | 'PARTICIPANTS'
  | 'VISITS'
  | 'SAFETY'
  | 'COMPLIANCE'
  | 'TEAM'
  | 'DOCUMENTS'
  | 'TASKS'
  | 'REPORTS'
  | 'DATA_ENTRY'
  | 'PARTICIPANT_PORTAL';

export type PermissionAction =
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'REVIEW'
  | 'APPROVE'
  | 'MANAGE'
  | 'EXPORT';

export interface Permission {
  id: string;
  module: PermissionModule;
  action: PermissionAction;
  name: string;
  description: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  studyId: string;
  siteId: string;
  assignedAt: string; // ISO string
  assignedBy: string;
}

export interface TeamMemberSummary {
  user: User;
  roles: Role[];
  assignments: UserRole[];
  studyId: string;
  siteId: string;
}

export interface TeamMemberDetail {
  user: User;
  roles: Role[];
  assignments: UserRole[];
  effectivePermissions: Permission[];
  studyId: string;
  siteId: string;
}

export interface TeamFilters {
  search?: string;
  status?: UserStatus | 'ALL';
  roleId?: string | 'ALL';
}

export interface RoleFilters {
  search?: string;
  type?: RoleType | 'ALL';
  roleType?: RoleType | 'ALL';
}

export interface TeamSummaryMetrics {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  systemRolesCount: number;
  customRolesCount: number;
  totalAssignments: number;
}

export interface RoleWithCounts extends Role {
  assignedUserCount: number;
}

export interface CreateCustomRoleInput {
  name: string;
  description: string;
  permissionIds: string[];
}

export interface UpdateCustomRoleInput {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface AssignRoleInput {
  userId: string;
  roleId: string;
  studyId?: string;
  siteId?: string;
  assignedBy?: string;
}

// ============================================================
// SEGMENT G — TASK MANAGEMENT & APPROVALS DOMAIN MODELS
// ============================================================

export type TaskStatus =
  | 'DRAFT'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'COMPLETED'
  | 'REVISION_REQUIRED'
  | 'CANCELLED';

export type TaskCategory =
  | 'SAFETY'
  | 'COMPLIANCE'
  | 'PARTICIPANT'
  | 'VISIT'
  | 'DOCUMENT'
  | 'REPORT'
  | 'PHARMACY'
  | 'TRAINING'
  | 'OTHER';

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'NORMAL';

export type TaskApprovalDecision = 'APPROVED' | 'REVISION_REQUIRED' | 'REJECTED';

export type RelatedEntityType =
  | 'PARTICIPANT'
  | 'VISIT'
  | 'COMPLIANCE'
  | 'SAFETY'
  | 'TASK'
  | 'DOCUMENT'
  | 'DOCUMENT_BUNDLE';

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  assignedBy: string;
  assignedAt: string; // ISO string
  status: 'ACTIVE' | 'SUPERSEDED';
}

export interface TaskApproval {
  id: string;
  taskId: string;
  reviewerId: string;
  reviewerName?: string;
  decision: TaskApprovalDecision;
  comments: string;
  reviewedAt: string; // ISO string
}

export interface TaskAssignee {
  userId: string;
  displayName: string;
  email: string;
  designation: string;
  roleId?: string;
  roleName?: string;
}

export interface Task {
  id: string;
  studyId: string;
  siteId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  createdBy: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  requiresApproval: boolean;
  approvalRequiredFromRoleId?: string;
  submittedAt?: string;
  completedAt?: string;
  assignee?: TaskAssignee;
  assignments: TaskAssignment[];
  approvals: TaskApproval[];
}

export interface TaskSummaryMetrics {
  total: number;
  myOpen: number;
  dueToday: number;
  overdue: number;
  pendingReview: number;
  completed: number;
}

export interface TaskFilters {
  search?: string;
  status?: TaskStatus | 'ALL' | 'OPEN';
  priority?: TaskPriority | 'ALL';
  category?: TaskCategory | 'ALL';
  assigneeId?: string | 'ALL' | 'UNASSIGNED' | 'MY_TASKS';
  dueDateFilter?: 'ALL' | 'TODAY' | 'OVERDUE' | 'UPCOMING';
  requiresApproval?: boolean | 'ALL';
}

export interface CreateTaskInput {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate: string;
  requiresApproval: boolean;
  approvalRequiredFromRoleId?: string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  assigneeUserId?: string;
  createdBy?: string;
}

export interface AssignTaskInput {
  userId: string;
  assignedBy: string;
}

export interface ApproveTaskInput {
  reviewerId: string;
  reviewerName?: string;
  comments: string;
}

// ============================================================
// SEGMENT H — DOCUMENT MANAGEMENT & EXPIRY TRACKING DOMAIN MODELS
// ============================================================

export type DocumentStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'ARCHIVED'
  | 'SUPERSEDED';

export type DocumentCategory =
  | 'REGULATORY'
  | 'ETHICS'
  | 'PROTOCOL'
  | 'INFORMED_CONSENT'
  | 'SITE'
  | 'TRAINING'
  | 'SAFETY'
  | 'PHARMACY'
  | 'LABORATORY'
  | 'STUDY_REPORT'
  | 'OTHER';

export type DocumentType =
  | 'Protocol'
  | 'Protocol Amendment'
  | 'Investigator Document'
  | 'Ethics Approval'
  | 'Site Approval'
  | 'Consent Form'
  | 'Training Certificate'
  | 'Safety Report'
  | 'Pharmacy Record'
  | 'Laboratory Certification'
  | 'Monitoring Report'
  | 'Study Report'
  | 'Other';

export type DocumentExpiryState =
  | 'NO_EXPIRY'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED';

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: string; // e.g. "1.0", "1.1", "2.0"
  versionLabel?: string;
  fileName: string;
  fileType: string; // e.g. "PDF", "DOCX", "XLSX"
  fileSize?: string; // e.g. "2.4 MB"
  uploadedBy: string; // User display name or user ID
  uploadedAt: string; // ISO string
  effectiveDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  changeSummary?: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED' | 'DRAFT';
  fileBlobUrl?: string; // Optional client-side blob URL for preview and download
}

export interface Document {
  id: string; // e.g. "DOC-101"
  studyId: string;
  siteId: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  documentType: DocumentType;
  status: DocumentStatus;
  isRequired: boolean;
  currentVersionId: string;
  currentVersionNumber: string;
  effectiveDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  ownerUserId: string;
  ownerName?: string;
  ownerRoleId?: string;
  createdBy: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  relatedEntityType?: 'PARTICIPANT' | 'VISIT' | 'COMPLIANCE' | 'SAFETY' | 'TASK' | 'DOCUMENT' | 'DOCUMENT_BUNDLE';
  relatedEntityId?: string;
  versions: DocumentVersion[];
  // Bundle and Start-up Governance Metadata
  bundleId?: string;
  bundleCategory?: 'REGULATORY_ETHICS' | 'PROTOCOL_SCIENTIFIC' | 'SITE_INVESTIGATOR' | 'CONTRACTUAL_FINANCIAL' | 'IP_PHARMACY' | 'LABORATORY' | 'ACTIVATION_READINESS';
  sourceType?: 'CRO' | 'SPONSOR' | 'SITE' | 'REGULATORY_AUTHORITY' | 'ETHICS_COMMITTEE' | 'CENTRAL_LAB' | 'VENDOR';
  sourceName?: string;
  receivedDate?: string;
  requiredFor?: 'STUDY_STARTUP' | 'SITE_ACTIVATION' | 'ROUTINE_MONITORING' | 'SAFETY_REPORTING' | 'CLOSE_OUT';
  applicability?: 'ALL_SITES' | 'SITE_SPECIFIC' | 'CONDITIONAL';
  isConditional?: boolean;
  conditionDescription?: string;
  reviewStatus?: 'PENDING_REVIEW' | 'REVIEWED_ACCEPTED' | 'REJECTED' | 'CONDITIONAL_APPROVAL';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  supersedesDocumentId?: string;
  isSyntheticWatermarked?: boolean;
  syntheticWatermarkText?: string;
}

export interface DocumentBundle {
  bundleId: string;
  bundleName: string;
  bundleCode: string;
  studyId: string;
  siteId: string;
  version: string;
  croOrganizationId?: string;
  croOrganizationName?: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'READY_FOR_MOCK_ACTIVATION' | 'ACTIVATED' | 'REJECTED';
  watermarkNotice: string;
  documentIds: string[];
  totalDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
  expiringSoonDocuments: number;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  activatedBy?: string;
  notes?: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  type: 'CRO' | 'SPONSOR' | 'SITE' | 'REGULATORY' | 'ETHICS_COMMITTEE' | 'CENTRAL_LAB' | 'VENDOR';
  status: 'ACTIVE' | 'INACTIVE';
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  isSynthetic: boolean;
  watermarkNotice?: string;
}

export interface SiteActivationReadinessResult {
  studyId: string;
  siteId: string;
  evaluationDate: string;
  protocolVersion: string;
  status: 'READY' | 'READY_WITH_CONDITIONS' | 'NOT_READY';
  statusLabel: string;
  isReadyForActivation: boolean;
  totalRequired: number;
  approvedCount: number;
  pendingReviewCount: number;
  missingCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  blockingIssues: string[];
  conditions: string[];
  warnings: string[];
  categoryBreakdown: Record<
    string,
    {
      categoryName: string;
      total: number;
      approved: number;
      missing: number;
      expired: number;
      isReady: boolean;
    }
  >;
  missingRequiredTypes: string[];
}

export interface DocumentSummaryMetrics {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  required: number;
  actionRequired: number; // Required documents without active/current valid version OR currently expired
}

export interface DocumentFilters {
  search?: string;
  category?: DocumentCategory | 'ALL';
  documentType?: DocumentType | 'ALL';
  status?: DocumentStatus | 'ALL' | 'ACTIVE_OR_EXPIRING';
  expiryFilter?:
    | 'ALL'
    | 'ACTIVE'
    | 'EXPIRING_SOON'
    | 'EXPIRED'
    | 'NO_EXPIRY'
    | 'NEXT_7_DAYS'
    | 'NEXT_30_DAYS';
  isRequired?: boolean | 'ALL';
  ownerUserId?: string | 'ALL';
  bundleId?: string | 'ALL' | 'ROUTINE_ONLY';
  includeStartupBundle?: boolean;
}

export interface CreateDocumentInput {
  title: string;
  description?: string;
  category: DocumentCategory;
  documentType: DocumentType;
  isRequired: boolean;
  ownerUserId: string;
  ownerRoleId?: string;
  effectiveDate?: string;
  expiryDate?: string;
  initialVersionNumber?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  fileBlobUrl?: string;
  changeSummary?: string;
  relatedEntityType?: 'PARTICIPANT' | 'VISIT' | 'COMPLIANCE' | 'SAFETY' | 'TASK';
  relatedEntityId?: string;
  createdBy?: string;
}

export interface CreateDocumentVersionInput {
  versionNumber: string;
  versionLabel?: string;
  fileName: string;
  fileType: string;
  fileSize?: string;
  fileBlobUrl?: string;
  effectiveDate?: string;
  expiryDate?: string;
  changeSummary?: string;
  uploadedBy: string;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  category?: DocumentCategory;
  documentType?: DocumentType;
  isRequired?: boolean;
  ownerUserId?: string;
  effectiveDate?: string;
  expiryDate?: string;
  status?: DocumentStatus;
  relatedEntityType?: 'PARTICIPANT' | 'VISIT' | 'COMPLIANCE' | 'SAFETY' | 'TASK';
  relatedEntityId?: string;
}

// ============================================================
// SEGMENT I: REPORTS & REGULATORY EXPORTS DOMAIN MODELS
// ============================================================

export type ReportType =
  | 'OPERATIONAL'
  | 'PARTICIPANT'
  | 'VISIT'
  | 'SAFETY'
  | 'COMPLIANCE'
  | 'TASK'
  | 'DOCUMENT';

export interface ReportDefinition {
  reportType: ReportType;
  title: string;
  description: string;
  domain: string;
  availableScope: string;
  defaultSortField?: string;
  iconName?: string;
}

export interface ReportMetadata {
  reportType: ReportType;
  title: string;
  studyId: string;
  siteId: string;
  generatedAt: string; // ISO date string
  generatedBy?: string;
  disclaimer: string;
}

export type ReportRowValue = string | number | boolean | null | undefined;
export type ReportRow = Record<string, ReportRowValue>;

export interface ReportColumnConfig {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'date' | 'badge' | 'number';
}

export interface ReportSummaryMetricItem {
  label: string;
  value: number | string;
  sublabel?: string;
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'success';
}

export interface ReportFilters {
  search?: string;
  status?: string;
  participantId?: string;
  category?: string;
  priority?: string;
  classification?: string;
  dateFrom?: string;
  dateTo?: string;
  reviewStatus?: string;
}

export interface GeneratedReport {
  metadata: ReportMetadata;
  filters: ReportFilters;
  columns: ReportColumnConfig[];
  summaryMetrics: ReportSummaryMetricItem[];
  rows: ReportRow[];
  totalRows: number;
}

// ============================================================
// SEGMENT J: NOTIFICATIONS, ALERTS & ACTION CENTER
// ============================================================

export type NotificationType =
  | 'SAFETY_REVIEW'
  | 'SAFETY_FOLLOWUP'
  | 'COMPLIANCE_REVIEW'
  | 'CAPA_OVERDUE'
  | 'TASK_ASSIGNED'
  | 'TASK_REVIEW'
  | 'TASK_REVISION'
  | 'TASK_OVERDUE'
  | 'DOCUMENT_EXPIRING'
  | 'DOCUMENT_EXPIRED'
  | 'VISIT_DUE'
  | 'VISIT_OVERDUE'
  | 'TEAM_ASSIGNMENT'
  | 'DATA_ENTRY_SUBMITTED'
  | 'DATA_ENTRY_RETURNED'
  | 'DATA_ENTRY_VERIFIED'
  | 'DATA_ENTRY_CRO_SUBMITTED'
  | 'PARTICIPANT_ONBOARDING_APPROVED'
  | 'PARTICIPANT_ONBOARDING_CLARIFICATION'
  | 'PARTICIPANT_ONBOARDING_REJECTED'
  | 'PARTICIPANT_REQUEST_SUBMITTED';

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'NORMAL';

export type NotificationStatus = 'UNREAD' | 'READ' | 'DISMISSED';

export type NotificationSourceEntityType =
  | 'SAFETY_EVENT'
  | 'PROTOCOL_DEVIATION'
  | 'TASK'
  | 'DOCUMENT'
  | 'VISIT'
  | 'PARTICIPANT'
  | 'TEAM_MEMBER'
  | 'VISIT_DATA_RECORD';

export interface Notification {
  id: string;
  studyId: string;
  siteId: string;
  recipientUserId: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  sourceEntityType?: NotificationSourceEntityType;
  sourceEntityId?: string;
  actionLabel?: string;
  actionRoute?: string;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  search?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  unreadOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface NotificationSummaryMetrics {
  total: number;
  unread: number;
  highPriority: number;
  actionRequired: number;
  today?: number;
}

// ============================================================
// AUTHENTICATION & ROLE-BASED PORTAL FOUNDATION DOMAIN MODELS
// ============================================================

export interface AuthUser {
  id: string;
  displayName: string;
  name?: string; // Convenience alias for displayName
  email: string;
  designation: string;
  status: UserStatus;
  organization?: string;
  department?: string;
  phone?: string;
}

export interface AuthSession {
  userId: string;
  roleId: string;
  studyId: string;
  siteId: string;
  authenticated: boolean;
  createdAt: string; // ISO string
  expiresAt?: string; // Optional expiry timestamp
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  user?: AuthUser;
  role?: Role;
  effectivePermissions?: Permission[];
  error?: string;
  errorMessage?: string; // Convenience alias for error
}

export interface DemoCredential {
  email: string;
  password: string; // Synthetic demo password only
  label: string;
  roleName: string;
  userName?: string; // Convenience user name display
  roleId: string;
  userId: string;
  studyId: string;
  siteId: string;
  description: string;
}

export interface NavigationItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string; // Segment F permission identifier required to see this nav item
  badge?: string;
  badgeVariant?: 'danger' | 'warning' | 'neutral';
}

// ============================================================
// TASK K: DATA ENTRY OPERATOR WORKFLOW & SUB-I VERIFICATION
// ============================================================

export type VisitDataStatus =
  | 'DRAFT'
  | 'SUBMITTED_FOR_VERIFICATION'
  | 'RETURNED_FOR_CORRECTION'
  | 'RESUBMITTED_FOR_VERIFICATION'
  | 'VERIFIED'
  | 'PI_REVIEW'
  | 'SUBMITTED_TO_CRO';

export type ReviewNoteType = 'COMMENT' | 'SUGGESTION' | 'CLINICAL_REVIEW';

export interface ReviewNote {
  id: string;
  studyId: string;
  siteId: string;
  recordId: string;
  authorUserId: string;
  authorName: string;
  authorRoleId: string;
  authorRoleName: string;
  type: ReviewNoteType;
  message: string;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
}

export type VerificationActionType =
  | 'CREATED'
  | 'UPDATED'
  | 'SUBMITTED_FOR_VERIFICATION'
  | 'RETURNED_FOR_CORRECTION'
  | 'RESUBMITTED_FOR_VERIFICATION'
  | 'VERIFIED'
  | 'PI_REVIEWED'
  | 'SUBMITTED_TO_CRO'
  | 'REVIEW_NOTE_ADDED'
  | 'ATTACHMENT_ADDED'
  | 'ATTACHMENT_REPLACED';

export interface VerificationAction {
  id: string;
  recordId: string;
  actorUserId: string;
  actorName: string;
  actorRoleId: string;
  actorRoleName: string;
  action: VerificationActionType;
  reason?: string;
  comment?: string;
  affectedFields?: string[];
  createdAt: string; // ISO
}

export interface VisitAttachment {
  id: string;
  recordId: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageReference: string; // object URL or simulated preview data
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedAt: string; // ISO
  description?: string;
  documentType?: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string;
  uploadedBy?: string;
  notes?: string;
}

export type VisitDataFieldCategory =
  | 'VISIT_INFO'
  | 'VITALS'
  | 'TESTS_OBSERVATIONS'
  | 'OBSERVATIONS'
  | 'LAB_RESULTS'
  | 'OTHER';

export interface VisitDataField {
  id: string;
  recordId: string;
  category: VisitDataFieldCategory;
  fieldKey: string;
  label: string;
  value: string;
  unit?: string;
  sourceReference?: string;
  sourceAttachmentId?: string;
  flaggedForCorrection?: boolean;
  flagReason?: string;
  updatedAt: string; // ISO
}

export interface VisitDataRecord {
  id: string; // e.g. 'VDR-101'
  studyId: string;
  siteId: string;
  participantId: string;
  participantCode: string;
  participantInitials: string;
  visitId: string;
  visitCode: string;
  visitName: string;
  visitDate: string; // ISO YYYY-MM-DD
  enteredByUserId: string;
  enteredByName: string;
  verifiedByUserId?: string;
  verifiedByName?: string;
  status: VisitDataStatus;
  submittedAt?: string;
  verifiedAt?: string;
  returnedAt?: string;
  returnedBy?: string;
  returnReason?: string;
  returnAffectedFields?: string[];
  resubmittedAt?: string;
  piReviewedAt?: string;
  submittedToCroAt?: string;
  croSubmittedAt?: string;
  croBatchReference?: string;
  fields: VisitDataField[];
  attachments: VisitAttachment[];
  reviewNotes: ReviewNote[];
  history: VerificationAction[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface VisitDataFilters {
  search?: string;
  status?: VisitDataStatus | 'ALL';
  participantId?: string;
  visitId?: string;
  hasAttachments?: boolean;
}

export interface DataEntrySummaryMetrics {
  pendingDataEntry: number;
  enteredToday: number;
  pendingVerification: number;
  returnedForCorrection: number;
  documentsPending: number;
  verified: number;
  totalRecords: number;
}

// -------------------------------------------------------------
// Environment & Empty Test Workflow Types
// -------------------------------------------------------------

export type AppEnvironmentMode = 'MOCK' | 'EMPTY_TEST';

export interface CreateTeamMemberInput {
  displayName: string;
  email: string;
  employeeId?: string;
  roleId: string;
  studyId: string;
  siteId: string;
  status?: 'ACTIVE' | 'INACTIVE';
  designation?: string;
  department?: string;
  phone?: string;
  notes?: string;
  password?: string;
}

export interface CreateTeamMemberResult {
  user: User;
  role: Role;
  assignment: UserRole;
  temporaryPassword: string;
}

export interface CreateParticipantInput {
  participantId?: string;
  studyId: string;
  siteId: string;
  screeningNumber: string;
  participantCode?: string;
  status?: ParticipantLifecycleStatus;
  initials?: string;
  enrollmentDate?: string;
  screeningDate?: string;
  demographics?: {
    age: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    dob?: string;
  };
  assignedInvestigatorId?: string;
  assignedInvestigatorName?: string;
  notes?: string;
}

export interface CreateVisitInput {
  studyId: string;
  siteId: string;
  participantId: string;
  visitDefinitionId?: string;
  protocolVersionId?: string;
  protocolVersionNumber?: string;
  visitCode: string;
  visitName: string;
  visitType: 'SCREENING' | 'BASELINE' | 'TREATMENT' | 'FOLLOW_UP' | 'CLOSE_OUT' | 'UNSCHEDULED';
  plannedDate: string;
  status?: 'SCHEDULED' | 'DUE' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'MISSED' | 'CANCELLED';
  assignedStaff?: string;
  notes?: string;
}

export interface AuditLogEvent {
  id: string;
  actorUserId: string;
  actorRole: string;
  studyId: string;
  siteId: string;
  targetEntity: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Stage 1: Participant Onboarding & Portal Domain Types
// ============================================================

export type ParticipantOnboardingRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'NEEDS_CLARIFICATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONVERTED_TO_PARTICIPANT';

export interface ParticipantOnboardingRequest {
  id: string;
  studyId: string;
  siteId: string;
  participantAccountId?: string;
  requestedEmail: string;
  requestedName: string;
  age?: number;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
  preferredLanguage?: string;
  notes?: string;
  status: ParticipantOnboardingRequestStatus;
  submittedAt: string;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  decisionReason?: string;
  participantId?: string;
  participantNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewOnboardingRequestInput {
  decision: 'APPROVE' | 'REQUEST_CLARIFICATION' | 'REJECT';
  reason?: string;
  participantNumber?: string;
}

export type ParticipantRequestType =
  | 'RESCHEDULE_VISIT'
  | 'CANNOT_ATTEND'
  | 'GENERAL_STUDY_REQUEST';

export type ParticipantRequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export interface ParticipantRequest {
  id: string;
  participantId: string;
  participantName?: string;
  studyId: string;
  siteId: string;
  requestType: ParticipantRequestType;
  visitId?: string;
  visitName?: string;
  message: string;
  proposedDate?: string;
  status: ParticipantRequestStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewerComment?: string;
}

export interface CreateParticipantRequestInput {
  participantId: string;
  studyId: string;
  siteId: string;
  requestType: ParticipantRequestType;
  visitId?: string;
  visitName?: string;
  message: string;
  proposedDate?: string;
}

export interface ReviewParticipantRequestInput {
  decision: 'APPROVE' | 'REJECT';
  comment?: string;
  newPlannedDate?: string;
}

export interface ParticipantSelfRegistrationInput {
  studyId: string;
  siteId: string;
  requestedEmail: string;
  requestedName: string;
  password?: string;
  age?: number;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
  preferredLanguage?: string;
  notes?: string;
  participantAccountId?: string;
}

// ============================================================
// STAGE 2A: CLINICAL PROTOCOL FOUNDATION & CONFIGURATION ENGINE
// ============================================================

export type ProtocolStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CLOSED'
  | 'ARCHIVED';

export type ProtocolVersionStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'RETIRED';

export interface Protocol {
  id: string;
  studyId: string;
  name: string;
  shortTitle: string;
  protocolNumber: string;
  currentVersionId: string;
  status: ProtocolStatus;
  description?: string;
  sponsorName?: string;
  therapeuticArea?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProtocolVersion {
  id: string;
  protocolId: string;
  studyId: string;
  versionNumber: string; // e.g. "1.0", "2.0"
  versionLabel: string; // e.g. "Version 1.0 (Initial Active)"
  status: ProtocolVersionStatus;
  effectiveDate?: string;
  approvalDate?: string;
  approvedBy?: string;
  supersedesVersionId?: string;
  changeSummary?: string;
  createdBy: string;
  activatedBy?: string;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProtocolEligibilityType = 'INCLUSION' | 'EXCLUSION';

export interface ProtocolEligibilityCriterion {
  id: string;
  protocolVersionId: string;
  type: ProtocolEligibilityType;
  criterionCode: string;
  title: string;
  description: string;
  displayOrder: number;
  required: boolean;
  active: boolean;
}

export type ProtocolAssessmentCategory =
  | 'GENERAL'
  | 'CLINICAL_EXAM'
  | 'VITALS'
  | 'ASSESSMENT'
  | 'QUESTIONNAIRE'
  | 'OTHER';

export interface ProtocolAssessmentDefinition {
  id: string;
  protocolVersionId: string;
  code: string;
  name: string;
  category: ProtocolAssessmentCategory;
  description?: string;
  visitDefinitionId: string; // Linked to ProtocolVisitDefinition
  required: boolean;
  displayOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  version?: string;
  sourceReference?: string;
  participantVisible?: boolean;
  clinicalSystem?: 'AYURVEDA' | 'CONVENTIONAL';
  ayurvedaCategory?: AyurvedaCategoryCode;
  instrumentId?: string;
  instrumentVersion?: string;
  terminologySystem?: AyurvedaTerminologySystem;
  terminologyCode?: string | null;
  validationStatus?: AyurvedaValidationStatus;
  assessorRoleRequirement?: AssessorRequirement;
  contentStatus?: AyurvedaContentStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProtocolInvestigationCategory =
  | 'LABORATORY'
  | 'IMAGING'
  | 'DIAGNOSTIC'
  | 'VITALS'
  | 'OTHER';

export interface ProtocolInvestigationDefinition {
  id: string;
  protocolVersionId: string;
  code: string;
  name: string;
  category: ProtocolInvestigationCategory;
  description?: string;
  visitDefinitionId: string; // Linked to ProtocolVisitDefinition
  required: boolean;
  displayOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  participantVisible?: boolean;
  sourceReference?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProtocolOutcomeType = 'PRIMARY' | 'SECONDARY' | 'EXPLORATORY' | 'SAFETY';

export interface ProtocolOutcomeDefinition {
  id: string;
  protocolVersionId: string;
  code: string;
  name: string;
  description?: string;
  outcomeType: ProtocolOutcomeType;
  visitDefinitionId?: string;
  timepoint?: string;
  required: boolean;
  displayOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  sourceReference?: string;
}

export type ProtocolFormType =
  | 'VISIT'
  | 'ASSESSMENT'
  | 'INVESTIGATION'
  | 'OUTCOME'
  | 'SAFETY'
  | 'OTHER';

export interface ProtocolFormDefinition {
  id: string;
  protocolVersionId: string;
  code: string;
  name: string;
  formType: ProtocolFormType;
  description?: string;
  applicableVisitDefinitionId?: string;
  required: boolean;
  displayOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  participantVisible?: boolean;
  dataDomain: string;
  version: string;
}

export type ProtocolConsentType =
  | 'INFORMED_CONSENT'
  | 'RECONSENT'
  | 'ASSENT'
  | 'OTHER';

export interface ProtocolConsentRequirement {
  id: string;
  protocolVersionId: string;
  consentType: ProtocolConsentType;
  requiredBefore: string;
  required: boolean;
  versionReference?: string;
  participantVisible?: boolean;
  description?: string;
}

export type ProtocolSafetyEventType = 'AE' | 'SAE' | 'ADR' | 'SAFETY_SIGNAL';

export interface ProtocolSafetyRequirement {
  id: string;
  protocolVersionId: string;
  eventType: ProtocolSafetyEventType;
  required: boolean;
  reportingWindow?: string;
  description?: string;
  active: boolean;
}

export interface ProtocolDeviationRequirement {
  id: string;
  protocolVersionId: string;
  category: string;
  description?: string;
  required: boolean;
  active: boolean;
}

export type ProtocolMilestoneType =
  | 'ETHICS_APPROVAL'
  | 'CTRI_REGISTRATION'
  | 'SITE_ACTIVATION'
  | 'FIRST_PATIENT_IN'
  | 'LAST_PATIENT_IN'
  | 'LAST_PATIENT_LAST_VISIT'
  | 'DATABASE_LOCK'
  | 'CLOSEOUT';

export interface ProtocolMilestone {
  id: string;
  protocolVersionId: string;
  type: ProtocolMilestoneType;
  name: string;
  plannedDate?: string;
  relativeDay?: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'ACHIEVED' | 'DELAYED';
  required: boolean;
  description?: string;
}

export interface StudyProtocolConfig {
  protocol: Protocol;
  activeVersion: ProtocolVersion;
  eligibility: ProtocolEligibilityCriterion[];
  visits: ProtocolVisitDefinition[];
  assessments: ProtocolAssessmentDefinition[];
  investigations: ProtocolInvestigationDefinition[];
  outcomes: ProtocolOutcomeDefinition[];
  consentRequirements: ProtocolConsentRequirement[];
  safetyRequirements: ProtocolSafetyRequirement[];
  deviationRequirements: ProtocolDeviationRequirement[];
  milestones: ProtocolMilestone[];
  forms: ProtocolFormDefinition[];
  ayurveda?: {
    categories: AyurvedaAssessmentCategory[];
    instruments: AyurvedaAssessmentInstrument[];
    protocolAssessments: ProtocolAyurvedaAssessment[];
    terminologyReferences: AyurvedaTerminologyEntry[];
  };
}

export interface ProtocolValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Input Types for Protocol Mutations
export interface CreateProtocolInput {
  name: string;
  shortTitle: string;
  protocolNumber: string;
  description?: string;
  sponsorName?: string;
  therapeuticArea?: string;
}

export interface CreateProtocolVersionInput {
  versionNumber: string;
  versionLabel?: string;
  changeSummary?: string;
  cloneFromVersionId?: string;
}

export interface CreateEligibilityCriterionInput {
  type: ProtocolEligibilityType;
  criterionCode: string;
  title: string;
  description: string;
  displayOrder?: number;
  required?: boolean;
  active?: boolean;
}

export interface CreateProtocolVisitDefinitionInput {
  code: string;
  name: string;
  sequence: number;
  anchor: VisitAnchor;
  targetOffsetDays: number;
  targetDay?: number;
  windowBeforeDays: number;
  windowAfterDays: number;
  requiredActivities?: string[];
  description?: string;
  required?: boolean;
  visitType?: VisitType;
  status?: string;
  notes?: string;
}

export interface CreateAssessmentDefinitionInput {
  code: string;
  name: string;
  category: ProtocolAssessmentCategory;
  visitDefinitionId: string;
  description?: string;
  required?: boolean;
  displayOrder?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  version?: string;
  sourceReference?: string;
  participantVisible?: boolean;
}

export interface CreateInvestigationDefinitionInput {
  code: string;
  name: string;
  category: ProtocolInvestigationCategory;
  visitDefinitionId: string;
  description?: string;
  required?: boolean;
  displayOrder?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  participantVisible?: boolean;
  sourceReference?: string;
}

export interface CreateOutcomeDefinitionInput {
  code: string;
  name: string;
  outcomeType: ProtocolOutcomeType;
  description?: string;
  visitDefinitionId?: string;
  timepoint?: string;
  required?: boolean;
  displayOrder?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  sourceReference?: string;
}

export interface CreateFormDefinitionInput {
  code: string;
  name: string;
  formType: ProtocolFormType;
  description?: string;
  applicableVisitDefinitionId?: string;
  required?: boolean;
  displayOrder?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  participantVisible?: boolean;
  dataDomain?: string;
  version?: string;
}

export interface CreateConsentRequirementInput {
  consentType: ProtocolConsentType;
  requiredBefore: string;
  required?: boolean;
  versionReference?: string;
  participantVisible?: boolean;
  description?: string;
}

export interface CreateSafetyRequirementInput {
  eventType: ProtocolSafetyEventType;
  required?: boolean;
  reportingWindow?: string;
  description?: string;
  active?: boolean;
}

export interface CreateDeviationRequirementInput {
  category: string;
  description?: string;
  required?: boolean;
  active?: boolean;
}

export interface CreateMilestoneInput {
  type: ProtocolMilestoneType;
  name: string;
  plannedDate?: string;
  relativeDay?: number;
  status?: 'PLANNED' | 'IN_PROGRESS' | 'ACHIEVED' | 'DELAYED';
  required?: boolean;
  description?: string;
}

// ============================================================
// STAGE 2B — AYURVEDA CLINICAL CONFIGURATION FOUNDATION
// ============================================================

export type CanonicalAyurvedaCategoryCode =
  | 'PRAKRITI'
  | 'VIKRITI'
  | 'AYURVEDA_GENERAL_CLINICAL_EXAMINATION'
  | 'DASHAVIDHA_PARIKSHA'
  | 'ASHTAVIDHA_PARIKSHA'
  | 'AGNI'
  | 'KOSHTHA'
  | 'DHATU_RELATED_ASSESSMENT'
  | 'AYURVEDA_HEALTH_ASSESSMENT'
  | 'AYURVEDA_DISEASE_SPECIFIC_ASSESSMENT'
  | 'AYURVEDA_OUTCOME_ASSESSMENT'
  | 'AYURVEDA_INTERVENTION_ASSESSMENT'
  | 'OTHER_AYURVEDA_ASSESSMENT';

export type AyurvedaCategoryCode = CanonicalAyurvedaCategoryCode | (string & {});

export type AyurvedaValidationStatus =
  | 'VALIDATED'
  | 'SOURCE_REFERENCED'
  | 'PROTOCOL_DEFINED'
  | 'PENDING_VALIDATION'
  | 'DEPRECATED';

export type AyurvedaUsageStatus = 'ACTIVE' | 'DEPRECATED' | 'RETIRED';

export type AyurvedaScoringMethod = 'NONE' | 'SOURCE_DEFINED' | 'IMPLEMENT_LATER';

export type AyurvedaScoringStatus = 'NOT_CONFIGURED' | 'SOURCE_DOCUMENTED' | 'IMPLEMENT_LATER';

export type AyurvedaContentStatus =
  | 'METADATA_ONLY'
  | 'ITEMS_CONFIGURED'
  | 'DIGITAL_INSTRUMENT_READY';

export type AyurvedaTerminologySystem =
  | 'NAMASTE'
  | 'WHO_AYURVEDA_TERMINOLOGY'
  | 'CCRAS'
  | 'INSTITUTIONAL'
  | 'PROTOCOL_SPECIFIC'
  | 'OTHER_VALIDATED';

export type AyurvedaTerminologyStatus =
  | 'VALIDATED'
  | 'SOURCE_REFERENCED'
  | 'PROTOCOL_DEFINED'
  | 'PENDING_VALIDATION'
  | 'DEPRECATED'
  | 'PENDING_TERMINOLOGY_MAPPING';

export type OfficialCodeVerificationStatus =
  | 'VERIFIED_SOURCE'
  | 'PENDING_MAPPING'
  | 'INTERNAL_ONLY';

export type AyurvedaLanguageSupportStatus =
  | 'SOURCE_VERIFIED'
  | 'SOURCE_UNVERIFIED'
  | 'INSTITUTIONAL_SPECIFIED'
  | 'NOT_SPECIFIED';

export type ClassicalSourceType =
  | 'CLASSICAL_TEXT'
  | 'CCRAS'
  | 'MINISTRY_OF_AYUSH'
  | 'WHO'
  | 'INSTITUTIONAL_PROTOCOL'
  | 'PEER_REVIEWED'
  | 'OTHER';

export interface AssessorRequirement {
  requiredRole?: string;
  trainingRequired: boolean;
  trainingReference?: string;
  certificationReference?: string;
  notes?: string;
}

export interface ClassicalSourceMetadata {
  sourceName: string;
  citation: string;
  edition?: string;
  chapterSection?: string;
  pageReference?: string;
  sourceType: ClassicalSourceType;
}

export interface AyurvedaAssessmentCategory {
  id: string;
  code: AyurvedaCategoryCode;
  name: string;
  description: string;
  sourceAuthority: string;
  sourceReference?: string;
  status: AyurvedaValidationStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AyurvedaAssessmentInstrument {
  id: string;
  code: string;
  name: string;
  category: AyurvedaCategoryCode;
  description: string;
  sourceAuthority: string;
  sourceReference: string;
  version: string;
  validationStatus: AyurvedaValidationStatus;
  usageStatus: AyurvedaUsageStatus;
  trainingRequired: boolean;
  trainingProvider?: string;
  trainingReference?: string;
  licenseNote?: string;
  languageSupport: string[];
  languageSupportStatus?: AyurvedaLanguageSupportStatus;
  scoringMethod: AyurvedaScoringMethod;
  scoringStatus: AyurvedaScoringStatus;
  itemSourceReference?: string;
  contentStatus: AyurvedaContentStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AyurvedaTerminologyEntry {
  id: string;
  localConceptId?: string | null;
  system: AyurvedaTerminologySystem;
  code: string | null;
  officialCodeVerification: OfficialCodeVerificationStatus;
  display: string;
  shortDefinition?: string;
  longDefinition?: string;
  language: string;
  sourceAuthority: string;
  sourceReference: string;
  version: string;
  parentCode?: string | null;
  status: AyurvedaTerminologyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProtocolAyurvedaAssessment {
  id: string;
  protocolVersionId: string;
  assessmentCode: string;
  name: string;
  category: AyurvedaCategoryCode;
  instrumentId: string;
  instrumentVersion: string;
  visitDefinitionId: string;
  required: boolean;
  participantVisible: boolean;
  assessorRequirement?: AssessorRequirement;
  sourceReference?: string;
  validationStatus: AyurvedaValidationStatus;
  contentStatus: AyurvedaContentStatus;
  terminologySystem?: AyurvedaTerminologySystem;
  terminologyCode?: string | null;
  localConceptId?: string | null;
  displayOrder: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAyurvedaCategoryInput {
  code: AyurvedaCategoryCode;
  name: string;
  description: string;
  sourceAuthority: string;
  sourceReference?: string;
  status?: AyurvedaValidationStatus;
  isActive?: boolean;
}

export interface CreateAyurvedaInstrumentInput {
  code: string;
  name: string;
  category: AyurvedaCategoryCode;
  description?: string;
  sourceAuthority: string;
  sourceReference?: string;
  version: string;
  validationStatus?: AyurvedaValidationStatus;
  usageStatus?: AyurvedaUsageStatus;
  trainingRequired?: boolean;
  trainingProvider?: string;
  trainingReference?: string;
  licenseNote?: string;
  languageSupport?: string[];
  languageSupportStatus?: AyurvedaLanguageSupportStatus;
  scoringMethod?: AyurvedaScoringMethod;
  scoringStatus?: AyurvedaScoringStatus;
  itemSourceReference?: string;
  contentStatus?: AyurvedaContentStatus;
  isActive?: boolean;
}

export interface UpdateAyurvedaInstrumentInput {
  name?: string;
  description?: string;
  sourceAuthority?: string;
  sourceReference?: string;
  version?: string;
  validationStatus?: AyurvedaValidationStatus;
  usageStatus?: AyurvedaUsageStatus;
  trainingRequired?: boolean;
  trainingProvider?: string;
  trainingReference?: string;
  licenseNote?: string;
  languageSupport?: string[];
  languageSupportStatus?: AyurvedaLanguageSupportStatus;
  scoringMethod?: AyurvedaScoringMethod;
  scoringStatus?: AyurvedaScoringStatus;
  itemSourceReference?: string;
  contentStatus?: AyurvedaContentStatus;
  isActive?: boolean;
}

export interface CreateAyurvedaTerminologyInput {
  system: AyurvedaTerminologySystem;
  code: string | null;
  localConceptId?: string | null;
  officialCodeVerification?: OfficialCodeVerificationStatus;
  display: string;
  shortDefinition?: string;
  longDefinition?: string;
  language: string;
  sourceAuthority: string;
  sourceReference: string;
  version: string;
  parentCode?: string | null;
  status?: AyurvedaTerminologyStatus;
}

export interface CreateProtocolAyurvedaAssessmentInput {
  assessmentCode: string;
  name: string;
  category: AyurvedaCategoryCode;
  instrumentId: string;
  instrumentVersion?: string;
  visitDefinitionId: string;
  required?: boolean;
  participantVisible?: boolean;
  assessorRequirement?: AssessorRequirement;
  sourceReference?: string;
  validationStatus?: AyurvedaValidationStatus;
  contentStatus?: AyurvedaContentStatus;
  terminologySystem?: AyurvedaTerminologySystem;
  terminologyCode?: string | null;
  localConceptId?: string | null;
  displayOrder?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateProtocolAyurvedaAssessmentInput {
  name?: string;
  required?: boolean;
  participantVisible?: boolean;
  assessorRequirement?: AssessorRequirement;
  sourceReference?: string;
  validationStatus?: AyurvedaValidationStatus;
  contentStatus?: AyurvedaContentStatus;
  localConceptId?: string | null;
  displayOrder?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface AyurvedaInstrumentFilter {
  category?: AyurvedaCategoryCode;
  sourceAuthority?: string;
  validationStatus?: AyurvedaValidationStatus;
  usageStatus?: AyurvedaUsageStatus;
  isActive?: boolean;
}

export interface AyurvedaTerminologyFilter {
  system?: AyurvedaTerminologySystem;
  status?: AyurvedaTerminologyStatus;
  search?: string;
}

// ============================================================
// STAGE 3: AYURVEDA PARTICIPANT + CLINICAL ASSESSMENT FRAMEWORK
// DIGITAL QUESTIONNAIRE BUILDER + DYNAMIC RESPONSE COLLECTION
// ============================================================

export type AssessmentAdministrationMode =
  | 'STAFF_ASSESSOR'
  | 'PARTICIPANT_SELF_REPORT'
  | 'STAFF_AND_PARTICIPANT'
  | 'INSTRUMENT_ONLY';

export type AssessmentContentSourceType =
  | 'SOURCE_REFERENCED'
  | 'PROJECT_AUTHORED'
  | 'SYNTHETIC_DEMO'
  | 'LICENSED'
  | 'INTERNAL_RESEARCH_CONTENT';

export type AssessmentRightsStatus =
  | 'VERIFIED'
  | 'PENDING_REVIEW'
  | 'RESTRICTED'
  | 'UNKNOWN';

export type AssessmentVersionStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'RETIRED';

export type AssessmentSessionStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUIRED'
  | 'COMPLETED'
  | 'CANCELLED';

export type AssessmentAssignmentStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type AssessmentReviewStatus =
  | 'APPROVED'
  | 'REVISION_REQUESTED'
  | 'REJECTED';

export type AssessmentItemType =
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'
  | 'YES_NO'
  | 'TEXT'
  | 'LONG_TEXT'
  | 'INTEGER'
  | 'DECIMAL'
  | 'DATE'
  | 'TIME'
  | 'DATE_TIME'
  | 'SCALE'
  | 'BODY_DIAGRAM'
  | 'FILE_REFERENCE'
  | 'OBSERVATION'
  | 'INSTRUCTION';

export type AssessmentRuleOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'IS_ANSWERED'
  | 'IS_UNANSWERED'
  | 'IN'
  | 'NOT_IN';

export type AssessmentRuleAction =
  | 'SHOW_ITEM'
  | 'HIDE_ITEM'
  | 'SHOW_SECTION'
  | 'HIDE_SECTION'
  | 'SKIP_TO_ITEM'
  | 'SKIP_TO_SECTION'
  | 'END_ASSESSMENT'
  | 'ENABLE_ITEM'
  | 'DISABLE_ITEM'
  | 'REQUIRE_ITEM'
  | 'OPTIONAL_ITEM';

export interface BodyLocationValue {
  regionId: string;
  side?: 'LEFT' | 'RIGHT' | 'BILATERAL' | 'MIDLINE';
  locationNotes?: string;
}

export interface AssessmentOption {
  optionId: string;
  responseDefinitionId?: string;
  label: string;
  value: string;
  order: number;
  exclusive?: boolean;
  otherAllowed?: boolean;
}

export interface AssessmentItemValidationRule {
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  customMessage?: string;
}

export interface AssessmentResponseDefinition {
  id: string;
  itemType: AssessmentItemType;
  options?: AssessmentOption[];
  minVal?: number;
  maxVal?: number;
  stepVal?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  placeholder?: string;
}

export interface AssessmentRule {
  ruleId: string;
  instrumentVersionId: string;
  sourceItemId: string;
  operator: AssessmentRuleOperator;
  expectedValue?: any;
  action: AssessmentRuleAction;
  targetItemId?: string;
  targetSectionId?: string;
  priority: number;
  active: boolean;
  logicalOperator?: 'AND' | 'OR';
  secondarySourceItemId?: string;
  secondaryOperator?: AssessmentRuleOperator;
  secondaryExpectedValue?: any;
}

export interface AssessmentSection {
  sectionId: string;
  instrumentVersionId: string;
  sectionCode: string;
  title: string;
  description?: string;
  order: number;
  required: boolean;
  displayCondition?: any;
}

export interface AssessmentItem {
  itemId: string;
  instrumentVersionId: string;
  sectionId: string;
  itemCode: string;
  itemType: AssessmentItemType;
  questionText: string;
  helpText?: string;
  order: number;
  required: boolean;
  responseDefinitionId?: string;
  responseDefinition?: AssessmentResponseDefinition;
  validationRules?: AssessmentItemValidationRule;
  administrationMode: AssessmentAdministrationMode;
  provenance?: string;
  contentSource: AssessmentContentSourceType;
  active: boolean;
}

export interface AssessmentInstrumentVersion {
  versionId: string;
  instrumentId: string;
  versionLabel: string;
  status: AssessmentVersionStatus;
  effectiveFrom?: string;
  effectiveTo?: string;
  itemCount: number;
  contentSource: AssessmentContentSourceType;
  rightsStatus: AssessmentRightsStatus;
  immutableAfterActivation: boolean;
  licenseNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentInstrument {
  instrumentId: string;
  localConceptId?: string | null;
  linkedStage2BInstrumentId: string;
  category: AyurvedaCategoryCode;
  name: string;
  description: string;
  administrationMode: AssessmentAdministrationMode;
  sourceAuthority: string;
  sourceReference: string;
  contentStatus: AyurvedaContentStatus;
  rightsStatus: AssessmentRightsStatus;
  contentSourceType: AssessmentContentSourceType;
  scoringStatus: AyurvedaScoringStatus;
  trainingRequired: boolean;
  trainingProvider?: string;
  activeVersionId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentAssignment {
  assignmentId: string;
  studyId: string;
  siteId: string;
  participantId: string;
  instrumentId: string;
  instrumentVersionId: string;
  assignedBy: string;
  assignedAt: string;
  dueAt?: string;
  status: AssessmentAssignmentStatus;
  notes?: string;
}

export interface AssessmentSession {
  sessionId: string;
  assignmentId: string;
  studyId: string;
  siteId: string;
  participantId: string;
  instrumentId: string;
  instrumentVersionId: string;
  startedAt: string;
  lastSavedAt: string;
  completedAt?: string;
  status: AssessmentSessionStatus;
  currentItemId?: string;
  completionPercentage: number;
  startedBy: string;
  completedBy?: string;
  isFinal?: boolean;
}

export interface AssessmentResponse {
  responseId: string;
  sessionId: string;
  assignmentId: string;
  studyId: string;
  siteId: string;
  participantId: string;
  instrumentId: string;
  instrumentVersionId: string;
  itemId: string;
  valueType: AssessmentItemType;
  value: any;
  selectedOptionIds?: string[];
  textValue?: string;
  numericValue?: number;
  booleanValue?: boolean;
  dateValue?: string;
  bodyLocationValue?: BodyLocationValue;
  recordedAt: string;
  recordedBy: string;
  isFinal: boolean;
}

export interface AssessmentReview {
  reviewId: string;
  sessionId: string;
  assignmentId: string;
  studyId: string;
  siteId: string;
  reviewerUserId: string;
  reviewerName: string;
  reviewerRole: string;
  reviewStatus: AssessmentReviewStatus;
  reviewedAt: string;
  notes?: string;
  revisionReason?: string;
}

// Input Types
export interface CreateAssessmentInstrumentInput {
  localConceptId?: string | null;
  linkedStage2BInstrumentId: string;
  category: AyurvedaCategoryCode;
  name: string;
  description?: string;
  administrationMode?: AssessmentAdministrationMode;
  sourceAuthority?: string;
  sourceReference?: string;
  rightsStatus?: AssessmentRightsStatus;
  contentSourceType?: AssessmentContentSourceType;
  trainingRequired?: boolean;
  trainingProvider?: string;
}

export interface CreateAssessmentVersionInput {
  instrumentId: string;
  versionLabel: string;
  contentSource?: AssessmentContentSourceType;
  rightsStatus?: AssessmentRightsStatus;
  licenseNote?: string;
}

export interface CreateAssessmentSectionInput {
  instrumentVersionId: string;
  sectionCode: string;
  title: string;
  description?: string;
  order?: number;
  required?: boolean;
}

export interface CreateAssessmentItemInput {
  instrumentVersionId: string;
  sectionId: string;
  itemCode: string;
  itemType: AssessmentItemType;
  questionText: string;
  helpText?: string;
  order?: number;
  required?: boolean;
  responseDefinition?: AssessmentResponseDefinition;
  validationRules?: AssessmentItemValidationRule;
  administrationMode?: AssessmentAdministrationMode;
  provenance?: string;
  contentSource?: AssessmentContentSourceType;
}

export interface CreateAssessmentRuleInput {
  instrumentVersionId: string;
  sourceItemId: string;
  operator: AssessmentRuleOperator;
  expectedValue?: any;
  action: AssessmentRuleAction;
  targetItemId?: string;
  targetSectionId?: string;
  priority?: number;
}

export interface CreateAssessmentAssignmentInput {
  participantId: string;
  instrumentId: string;
  instrumentVersionId?: string;
  dueAt?: string;
  notes?: string;
}

export interface SaveAssessmentResponseInput {
  sessionId: string;
  assignmentId: string;
  participantId: string;
  instrumentId: string;
  instrumentVersionId: string;
  itemId: string;
  valueType: AssessmentItemType;
  value: any;
  selectedOptionIds?: string[];
  textValue?: string;
  numericValue?: number;
  booleanValue?: boolean;
  dateValue?: string;
  bodyLocationValue?: BodyLocationValue;
  isFinal?: boolean;
}

export interface CreateAssessmentReviewInput {
  sessionId: string;
  assignmentId: string;
  reviewStatus: AssessmentReviewStatus;
  notes?: string;
  revisionReason?: string;
}

export interface AssessmentInstrumentFilter {
  category?: AyurvedaCategoryCode;
  administrationMode?: AssessmentAdministrationMode;
  contentSourceType?: AssessmentContentSourceType;
  rightsStatus?: AssessmentRightsStatus;
  search?: string;
}

export interface AssessmentAssignmentFilter {
  participantId?: string;
  instrumentId?: string;
  status?: AssessmentAssignmentStatus;
  assignedBy?: string;
}

export interface AssessmentSessionFilter {
  participantId?: string;
  assignmentId?: string;
  instrumentId?: string;
  status?: AssessmentSessionStatus;
}

export interface AssessmentValidationError {
  path: string;
  message: string;
  code: string;
}

export interface AssessmentValidationWarning {
  path: string;
  message: string;
  code: string;
}

export interface AssessmentValidationInfo {
  path: string;
  message: string;
  code: string;
}

export interface AssessmentValidationResult {
  isValid: boolean;
  errors: AssessmentValidationError[];
  warnings: AssessmentValidationWarning[];
  info: AssessmentValidationInfo[];
}



