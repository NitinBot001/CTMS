import {
  Study,
  Site,
  DashboardOverviewData,
  Participant,
  ParticipantFilters,
  ParticipantSummaryMetrics,
  ProtocolVisitDefinition,
  ParticipantVisit,
  VisitFilters,
  VisitSummaryMetrics,
  ClinicalActivityStatus,
  SafetyEvent,
  SafetyFilters,
  SafetySummaryMetrics,
  PIReviewStatus,
  FollowUpStatus,
  ProtocolDeviation,
  DeviationFilters,
  ComplianceSummaryMetrics,
  DeviationStatus,
  ComplianceReviewStatus,
  CapaStatus,
  Role,
  Permission,
  UserRole,
  TeamMemberSummary,
  TeamMemberDetail,
  TeamFilters,
  RoleFilters,
  TeamSummaryMetrics,
  RoleWithCounts,
  CreateCustomRoleInput,
  UpdateCustomRoleInput,
  AssignRoleInput,
  Task,
  TaskAssignment,
  TaskSummaryMetrics,
  TaskFilters,
  CreateTaskInput,
  AssignTaskInput,
  TaskStatus,
  Document,
  DocumentVersion,
  DocumentSummaryMetrics,
  DocumentFilters,
  CreateDocumentInput,
  CreateDocumentVersionInput,
  UpdateDocumentInput,
  DocumentExpiryState,
  ReportType,
  ReportDefinition,
  ReportFilters,
  GeneratedReport,
  ReportSummaryMetricItem,
} from '../types';

export interface ParticipantQueryContext {
  studyId: string;
  siteId: string;
}

export interface IStudyRepository {
  getStudies(): Promise<Study[]>;
  getStudyById(studyId: string): Promise<Study | null>;
  getSitesByStudyId(studyId: string): Promise<Site[]>;
}

export interface IDashboardRepository {
  getOverview(studyId: string, siteId: string): Promise<DashboardOverviewData | null>;
}

export interface IParticipantRepository {
  getParticipants(context: ParticipantQueryContext, filters?: ParticipantFilters): Promise<Participant[]>;
  getParticipantById(context: ParticipantQueryContext, participantId: string): Promise<Participant | null>;
  getParticipantSummary(context: ParticipantQueryContext): Promise<ParticipantSummaryMetrics>;
}

export interface IVisitRepository {
  getProtocolVisits(studyId: string): Promise<ProtocolVisitDefinition[]>;
  getVisits(context: ParticipantQueryContext, filters?: VisitFilters): Promise<ParticipantVisit[]>;
  getParticipantVisits(context: ParticipantQueryContext, participantId: string): Promise<ParticipantVisit[]>;
  getVisitById(context: ParticipantQueryContext, visitId: string): Promise<ParticipantVisit | null>;
  getVisitSummary(context: ParticipantQueryContext): Promise<VisitSummaryMetrics>;
  updateVisitActivityStatus?(
    context: ParticipantQueryContext,
    visitId: string,
    activityId: string,
    status: ClinicalActivityStatus
  ): Promise<ParticipantVisit | null>;
}

export interface ISafetyRepository {
  getSafetyEvents(context: ParticipantQueryContext, filters?: SafetyFilters): Promise<SafetyEvent[]>;
  getSafetyEventById(context: ParticipantQueryContext, eventId: string): Promise<SafetyEvent | null>;
  getParticipantSafetyEvents(context: ParticipantQueryContext, participantId: string): Promise<SafetyEvent[]>;
  getSafetySummary(context: ParticipantQueryContext): Promise<SafetySummaryMetrics>;
  updatePIReviewStatus(
    context: ParticipantQueryContext,
    eventId: string,
    status: PIReviewStatus,
    reviewedBy?: string
  ): Promise<SafetyEvent | null>;
  updateFollowUpStatus?(
    context: ParticipantQueryContext,
    eventId: string,
    status: FollowUpStatus,
    notes?: string
  ): Promise<SafetyEvent | null>;
}

export interface IComplianceRepository {
  getDeviations(context: ParticipantQueryContext, filters?: DeviationFilters): Promise<ProtocolDeviation[]>;
  getDeviationById(context: ParticipantQueryContext, deviationId: string): Promise<ProtocolDeviation | null>;
  getParticipantDeviations(context: ParticipantQueryContext, participantId: string): Promise<ProtocolDeviation[]>;
  getVisitDeviations(context: ParticipantQueryContext, visitId: string): Promise<ProtocolDeviation[]>;
  getComplianceSummary(context: ParticipantQueryContext): Promise<ComplianceSummaryMetrics>;
  updateDeviationStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    status: DeviationStatus
  ): Promise<ProtocolDeviation | null>;
  updateReviewStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    reviewStatus: ComplianceReviewStatus,
    reviewedBy?: string
  ): Promise<ProtocolDeviation | null>;
  updateCapaStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    capaStatus: CapaStatus,
    summary?: string
  ): Promise<ProtocolDeviation | null>;
}

export interface ITeamRepository {
  getTeamMembers(
    context: ParticipantQueryContext,
    filters?: TeamFilters
  ): Promise<TeamMemberSummary[]>;
  getTeamMemberById(
    context: ParticipantQueryContext,
    userId: string
  ): Promise<TeamMemberDetail | null>;
  getRoles(
    context: ParticipantQueryContext,
    filters?: RoleFilters
  ): Promise<RoleWithCounts[]>;
  getRoleById(
    context: ParticipantQueryContext,
    roleId: string
  ): Promise<Role | null>;
  getPermissions(): Promise<Permission[]>;
  getUserRoleAssignments(
    context: ParticipantQueryContext,
    userId: string
  ): Promise<UserRole[]>;
  getEffectivePermissions(
    context: ParticipantQueryContext,
    userId: string
  ): Promise<Permission[]>;
  getTeamSummaryMetrics(
    context: ParticipantQueryContext
  ): Promise<TeamSummaryMetrics>;
  assignRole(
    context: ParticipantQueryContext,
    input: AssignRoleInput
  ): Promise<UserRole>;
  removeRoleAssignment(
    context: ParticipantQueryContext,
    userRoleId: string
  ): Promise<boolean>;
  createCustomRole(
    context: ParticipantQueryContext,
    input: CreateCustomRoleInput
  ): Promise<Role>;
  updateCustomRole(
    context: ParticipantQueryContext,
    roleId: string,
    input: UpdateCustomRoleInput
  ): Promise<Role>;
}

export interface ITaskRepository {
  getTasks(
    context: ParticipantQueryContext,
    filters?: TaskFilters
  ): Promise<Task[]>;
  getTaskById(
    context: ParticipantQueryContext,
    taskId: string
  ): Promise<Task | null>;
  getTaskSummary(
    context: ParticipantQueryContext,
    currentUserId?: string
  ): Promise<TaskSummaryMetrics>;
  getTaskAssignments(
    context: ParticipantQueryContext,
    taskId: string
  ): Promise<TaskAssignment[]>;
  getMyTasks(
    context: ParticipantQueryContext,
    userId: string
  ): Promise<Task[]>;
  createTask(
    context: ParticipantQueryContext,
    input: CreateTaskInput
  ): Promise<Task>;
  assignTask(
    context: ParticipantQueryContext,
    taskId: string,
    assignment: AssignTaskInput
  ): Promise<Task>;
  updateTaskStatus(
    context: ParticipantQueryContext,
    taskId: string,
    status: TaskStatus
  ): Promise<Task>;
  submitTask(
    context: ParticipantQueryContext,
    taskId: string
  ): Promise<Task>;
  approveTask(
    context: ParticipantQueryContext,
    taskId: string,
    reviewerId: string,
    comments: string
  ): Promise<Task>;
  requestRevision(
    context: ParticipantQueryContext,
    taskId: string,
    reviewerId: string,
    comments: string
  ): Promise<Task>;
  rejectTask(
    context: ParticipantQueryContext,
    taskId: string,
    reviewerId: string,
    comments: string
  ): Promise<Task>;
  completeTask(
    context: ParticipantQueryContext,
    taskId: string
  ): Promise<Task>;
}

export interface IDocumentRepository {
  getDocuments(
    context: ParticipantQueryContext,
    filters?: DocumentFilters
  ): Promise<Document[]>;
  getDocumentById(
    context: ParticipantQueryContext,
    documentId: string
  ): Promise<Document | null>;
  getDocumentSummary(
    context: ParticipantQueryContext
  ): Promise<DocumentSummaryMetrics>;
  getDocumentVersions(
    context: ParticipantQueryContext,
    documentId: string
  ): Promise<DocumentVersion[]>;
  createDocument(
    context: ParticipantQueryContext,
    input: CreateDocumentInput
  ): Promise<Document>;
  createDocumentVersion(
    context: ParticipantQueryContext,
    documentId: string,
    input: CreateDocumentVersionInput
  ): Promise<Document>;
  updateDocument(
    context: ParticipantQueryContext,
    documentId: string,
    update: UpdateDocumentInput
  ): Promise<Document>;
  archiveDocument(
    context: ParticipantQueryContext,
    documentId: string
  ): Promise<Document>;
  getExpiryState(
    document: Document,
    referenceDate?: string
  ): DocumentExpiryState;
}

export interface IReportRepository {
  getReportDefinitions(): Promise<ReportDefinition[]>;
  generateReport(
    context: ParticipantQueryContext,
    reportType: ReportType,
    filters?: ReportFilters
  ): Promise<GeneratedReport>;
  getReportSummary(
    context: ParticipantQueryContext,
    reportType: ReportType
  ): Promise<ReportSummaryMetricItem[]>;
}
