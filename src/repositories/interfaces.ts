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
  Notification,
  NotificationFilters,
  NotificationSummaryMetrics,
  AuthResult,
  DemoCredential,
  User,
  VisitDataRecord,
  VisitDataField,
  VisitAttachment,
  ReviewNote,
  ReviewNoteType,
  VerificationAction,
  VisitDataFilters,
  DataEntrySummaryMetrics,
  CreateTeamMemberInput,
  CreateParticipantInput,
  CreateVisitInput,
  AuditLogEvent,
  ParticipantOnboardingRequest,
  ParticipantRequest,
  ParticipantSelfRegistrationInput,
  CreateParticipantRequestInput,
  Protocol,
  ProtocolVersion,
  ProtocolEligibilityCriterion,
  ProtocolAssessmentDefinition,
  ProtocolInvestigationDefinition,
  ProtocolOutcomeDefinition,
  ProtocolFormDefinition,
  ProtocolConsentRequirement,
  ProtocolSafetyRequirement,
  ProtocolDeviationRequirement,
  ProtocolMilestone,
  StudyProtocolConfig,
  CreateProtocolInput,
  CreateProtocolVersionInput,
  CreateEligibilityCriterionInput,
  CreateProtocolVisitDefinitionInput,
  CreateAssessmentDefinitionInput,
  CreateInvestigationDefinitionInput,
  CreateOutcomeDefinitionInput,
  CreateFormDefinitionInput,
  CreateConsentRequirementInput,
  CreateSafetyRequirementInput,
  CreateDeviationRequirementInput,
  CreateMilestoneInput,
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
  createParticipant(context: ParticipantQueryContext, input: CreateParticipantInput): Promise<Participant>;
  updateParticipant?(context: ParticipantQueryContext, participantId: string, updates: Partial<Participant>): Promise<Participant | null>;
  getOnboardingRequests?(context: ParticipantQueryContext): Promise<ParticipantOnboardingRequest[]>;
  getOnboardingRequestById?(context: ParticipantQueryContext, requestId: string): Promise<ParticipantOnboardingRequest | null>;
  createOnboardingRequest?(input: ParticipantSelfRegistrationInput): Promise<ParticipantOnboardingRequest>;
  updateOnboardingRequest?(req: ParticipantOnboardingRequest): Promise<ParticipantOnboardingRequest>;
  getParticipantRequests?(context: ParticipantQueryContext, participantId?: string): Promise<ParticipantRequest[]>;
  createParticipantRequest?(input: CreateParticipantRequestInput): Promise<ParticipantRequest>;
  updateParticipantRequest?(req: ParticipantRequest): Promise<ParticipantRequest>;
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
  createVisit?(context: ParticipantQueryContext, input: CreateVisitInput): Promise<ParticipantVisit>;
  updateVisit?(
    context: ParticipantQueryContext,
    visitId: string,
    updates: Partial<ParticipantVisit>
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
  createTeamMember?(
    context: ParticipantQueryContext,
    input: CreateTeamMemberInput
  ): Promise<TeamMemberSummary>;
  toggleUserStatus?(
    context: ParticipantQueryContext,
    userId: string,
    status: 'ACTIVE' | 'INACTIVE'
  ): Promise<User>;
}

export interface IAuditRepository {
  getEvents(context: ParticipantQueryContext): Promise<AuditLogEvent[]>;
  logEvent(event: Omit<AuditLogEvent, 'id' | 'timestamp'>): Promise<AuditLogEvent>;
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

export interface NotificationQueryContext {
  studyId: string;
  siteId: string;
  recipientUserId: string;
}

export interface INotificationRepository {
  getNotifications(
    context: NotificationQueryContext,
    filters?: NotificationFilters
  ): Promise<Notification[]>;
  getNotificationById(
    context: NotificationQueryContext,
    notificationId: string
  ): Promise<Notification | null>;
  getNotificationSummary(
    context: NotificationQueryContext
  ): Promise<NotificationSummaryMetrics>;
  markAsRead(
    context: NotificationQueryContext,
    notificationId: string
  ): Promise<Notification>;
  markAllAsRead(
    context: NotificationQueryContext
  ): Promise<number>;
  dismissNotification(
    context: NotificationQueryContext,
    notificationId: string
  ): Promise<Notification>;
  getUnreadCount(
    context: NotificationQueryContext
  ): Promise<number>;
  createNotification(
    context: NotificationQueryContext,
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<Notification>;
}

export interface IAuthRepository {
  authenticate(email: string, password: string): Promise<AuthResult>;
  getUserById(userId: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserAssignments(userId: string): Promise<UserRole[]>;
  getRoleById(roleId: string): Promise<Role | null>;
  getEffectivePermissions(userId: string, studyId: string, siteId: string): Promise<Permission[]>;
  getDemoCredentials(): DemoCredential[];
}

export interface WorkflowActor {
  userId: string;
  name: string;
  roleId: string;
  roleName: string;
  role?: string;
  effectivePermissions?: string[];
}

export interface CreateDraftRecordInput {
  participantId: string;
  participantCode: string;
  participantInitials: string;
  visitId: string;
  visitCode: string;
  visitName: string;
  visitDate: string;
  fields?: Partial<VisitDataField>[];
}

export interface IVisitDataRepository {
  getRecord(
    context: ParticipantQueryContext,
    recordId: string
  ): Promise<VisitDataRecord | null>;

  listRecords(
    context: ParticipantQueryContext,
    filters?: VisitDataFilters
  ): Promise<VisitDataRecord[]>;

  getDataEntryQueue(
    context: ParticipantQueryContext
  ): Promise<VisitDataRecord[]>;

  getVerificationQueue(
    context: ParticipantQueryContext
  ): Promise<VisitDataRecord[]>;

  createDraft(
    context: ParticipantQueryContext,
    record: CreateDraftRecordInput,
    actor: WorkflowActor
  ): Promise<VisitDataRecord>;

  updateField(
    context: ParticipantQueryContext,
    recordId: string,
    field: Partial<VisitDataField> & { fieldKey: string; label: string; value: string },
    actor: WorkflowActor
  ): Promise<VisitDataRecord>;

  updateRecordFields(
    context: ParticipantQueryContext,
    recordId: string,
    fields: Partial<VisitDataField>[],
    actor: WorkflowActor
  ): Promise<VisitDataRecord>;

  uploadAttachment(
    context: ParticipantQueryContext,
    recordId: string,
    attachment: Omit<VisitAttachment, 'id' | 'recordId' | 'uploadedAt'>,
    actor: WorkflowActor
  ): Promise<VisitDataRecord>;

  removeAttachment(
    context: ParticipantQueryContext,
    recordId: string,
    attachmentId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord>;

  submitForVerification(
    context: ParticipantQueryContext,
    recordId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord>;

  returnForCorrection(
    context: ParticipantQueryContext,
    recordId: string,
    reason: string,
    affectedFields: string[] | undefined,
    actor: WorkflowActor
  ): Promise<VisitDataRecord>;

  resubmitForVerification(
    context: ParticipantQueryContext,
    recordId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord>;

  verifyRecord(
    context: ParticipantQueryContext,
    recordId: string,
    comment: string | undefined,
    actor: WorkflowActor
  ): Promise<VisitDataRecord>;

  moveToPiReview(
    context: ParticipantQueryContext,
    recordId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord>;

  submitToCro(
    context: ParticipantQueryContext,
    recordId: string,
    comment: string | undefined,
    actor: WorkflowActor
  ): Promise<VisitDataRecord>;

  addReviewNote(
    context: ParticipantQueryContext,
    recordId: string,
    note: { type: ReviewNoteType; message: string },
    actor: WorkflowActor
  ): Promise<VisitDataRecord>;

  getReviewHistory(
    context: ParticipantQueryContext,
    recordId: string
  ): Promise<ReviewNote[]>;

  getVerificationHistory(
    context: ParticipantQueryContext,
    recordId: string
  ): Promise<VerificationAction[]>;

  getSummaryMetrics(
    context: ParticipantQueryContext
  ): Promise<DataEntrySummaryMetrics>;
}

export interface IProtocolRepository {
  getProtocols(studyId: string): Promise<Protocol[]>;
  getProtocol(studyId: string, protocolId: string): Promise<Protocol | null>;
  getActiveProtocol(studyId: string): Promise<Protocol | null>;
  getProtocolVersions(protocolId: string): Promise<ProtocolVersion[]>;
  getProtocolVersion(versionId: string): Promise<ProtocolVersion | null>;
  getActiveProtocolVersion(studyId: string): Promise<ProtocolVersion | null>;
  getStudyProtocolConfig(versionId: string): Promise<StudyProtocolConfig | null>;
  getEligibilityCriteria(versionId: string): Promise<ProtocolEligibilityCriterion[]>;
  getVisitDefinitions(versionId: string): Promise<ProtocolVisitDefinition[]>;
  getAssessmentDefinitions(versionId: string, visitDefinitionId?: string): Promise<ProtocolAssessmentDefinition[]>;
  getInvestigationDefinitions(versionId: string, visitDefinitionId?: string): Promise<ProtocolInvestigationDefinition[]>;
  getOutcomeDefinitions(versionId: string, visitDefinitionId?: string): Promise<ProtocolOutcomeDefinition[]>;
  getFormDefinitions(versionId: string, visitDefinitionId?: string): Promise<ProtocolFormDefinition[]>;
  getConsentRequirements(versionId: string): Promise<ProtocolConsentRequirement[]>;
  getSafetyRequirements(versionId: string): Promise<ProtocolSafetyRequirement[]>;
  getDeviationRequirements(versionId: string): Promise<ProtocolDeviationRequirement[]>;
  getMilestones(versionId: string): Promise<ProtocolMilestone[]>;

  createProtocol(studyId: string, input: CreateProtocolInput): Promise<Protocol>;
  createProtocolVersion(protocolId: string, input: CreateProtocolVersionInput): Promise<ProtocolVersion>;
  updateProtocolVersion(versionId: string, updates: Partial<ProtocolVersion>): Promise<ProtocolVersion | null>;
  addEligibilityCriterion(versionId: string, input: CreateEligibilityCriterionInput): Promise<ProtocolEligibilityCriterion>;
  updateEligibilityCriterion(versionId: string, criterionId: string, updates: Partial<ProtocolEligibilityCriterion>): Promise<ProtocolEligibilityCriterion | null>;
  addVisitDefinition(versionId: string, input: CreateProtocolVisitDefinitionInput): Promise<ProtocolVisitDefinition>;
  updateVisitDefinition(versionId: string, visitDefId: string, updates: Partial<ProtocolVisitDefinition>): Promise<ProtocolVisitDefinition | null>;
  addAssessmentDefinition(versionId: string, input: CreateAssessmentDefinitionInput): Promise<ProtocolAssessmentDefinition>;
  updateAssessmentDefinition(versionId: string, assessmentId: string, updates: Partial<ProtocolAssessmentDefinition>): Promise<ProtocolAssessmentDefinition | null>;
  addInvestigationDefinition(versionId: string, input: CreateInvestigationDefinitionInput): Promise<ProtocolInvestigationDefinition>;
  updateInvestigationDefinition(versionId: string, investigationId: string, updates: Partial<ProtocolInvestigationDefinition>): Promise<ProtocolInvestigationDefinition | null>;
  addOutcomeDefinition(versionId: string, input: CreateOutcomeDefinitionInput): Promise<ProtocolOutcomeDefinition>;
  addConsentRequirement(versionId: string, input: CreateConsentRequirementInput): Promise<ProtocolConsentRequirement>;
  addSafetyRequirement(versionId: string, input: CreateSafetyRequirementInput): Promise<ProtocolSafetyRequirement>;
  addDeviationRequirement(versionId: string, input: CreateDeviationRequirementInput): Promise<ProtocolDeviationRequirement>;
  addMilestone(versionId: string, input: CreateMilestoneInput): Promise<ProtocolMilestone>;
  addFormDefinition(versionId: string, input: CreateFormDefinitionInput): Promise<ProtocolFormDefinition>;
}


