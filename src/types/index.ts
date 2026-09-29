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
  status?: DeviationStatus | 'ALL';
  capaStatus?: CapaStatus | 'ALL';
  reviewStatus?: ComplianceReviewStatus | 'ALL';
  category?: DeviationCategory | 'ALL';
  participantId?: string;
  dateRange?: 'ALL' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'CAPA_PENDING' | 'CAPA_OVERDUE';
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



