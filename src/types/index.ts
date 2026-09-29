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
  screeningCode: string;
  initials: string;
  age: number;
  sex: 'M' | 'F' | 'Other';
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

export type ClinicalActivityStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'NOT_APPLICABLE';

export interface ProtocolVisitDefinition {
  id: string;
  studyId: string;
  code: string;
  name: string;
  sequence: number;
  anchor: VisitAnchor;
  targetOffsetDays: number;
  windowBeforeDays: number;
  windowAfterDays: number;
  requiredActivities: string[];
  description?: string;
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
  | 'REPORTS';

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
  | 'SAFETY';

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
  relatedEntityType?: 'PARTICIPANT' | 'VISIT' | 'COMPLIANCE' | 'SAFETY' | 'TASK';
  relatedEntityId?: string;
  versions: DocumentVersion[];
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
  | 'TEAM_ASSIGNMENT';

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'NORMAL';

export type NotificationStatus = 'UNREAD' | 'READ' | 'DISMISSED';

export type NotificationSourceEntityType =
  | 'SAFETY_EVENT'
  | 'PROTOCOL_DEVIATION'
  | 'TASK'
  | 'DOCUMENT'
  | 'VISIT'
  | 'PARTICIPANT'
  | 'TEAM_MEMBER';

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






