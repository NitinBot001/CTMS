/**
 * Empty Test Workspace Repositories
 * 
 * Provides concrete domain repository implementations backed exclusively by `emptyTestStore`.
 * Delegates core business logic, status transitions, and validations to standard Mock repositories
 * parameterized with `emptyTestStore` state and persistence callbacks.
 * 
 * Guarantees zero cross-contamination with canonical MOCK fixtures.
 */
import {
  IAuthRepository,
  IStudyRepository,
  IParticipantRepository,
  IVisitRepository,
  ITaskRepository,
  ITeamRepository,
  IVisitDataRepository,
  ISafetyRepository,
  IComplianceRepository,
  IDocumentRepository,
  INotificationRepository,
  IDashboardRepository,
  IReportRepository,
  IAuditRepository,
  ParticipantQueryContext,
  NotificationQueryContext,
  WorkflowActor,
  CreateDraftRecordInput,
} from './interfaces';
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
  ComplianceReviewStatus,
  DeviationStatus,
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
  CreateTeamMemberInput,
  CreateParticipantInput,
  CreateVisitInput,
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
  AuditLogEvent,
  DataEntrySummaryMetrics,
  ParticipantOnboardingRequest,
  ParticipantRequest,
  ParticipantSelfRegistrationInput,
  CreateParticipantRequestInput,
} from '../types';
import {
  emptyTestStore,
  BOOTSTRAP_PI_USER,
  BOOTSTRAP_PI_PASSWORD,
  EMPTY_PROTOCOL_VISITS,
} from '../storage/emptyTestStore';
import { MOCK_PERMISSIONS } from '../data/mockData';
import { MockTeamRepository } from './mockTeamRepository';
import { MockParticipantRepository } from './mockParticipantRepository';
import { MockVisitRepository } from './mockVisitRepository';
import { MockTaskRepository } from './mockTaskRepository';
import { MockVisitDataRepository } from './mockVisitDataRepository';
import { MockNotificationRepository } from './mockNotificationRepository';
import { MockDocumentRepository } from './mockDocumentRepository';
import { MockSafetyRepository } from './mockSafetyRepository';
import { MockComplianceRepository } from './mockComplianceRepository';
import { MockReportRepository } from './mockReportRepository';

// ============================================================================
// 1. Empty Auth Repository
// ============================================================================
export class EmptyAuthRepository implements IAuthRepository {
  getDemoCredentials(): DemoCredential[] {
    const users = emptyTestStore.getUsers();
    const userRoles = emptyTestStore.getUserRoles();
    const roles = emptyTestStore.getRoles();
    const passwords = emptyTestStore.getUserPasswords();

    return users.map((u) => {
      const assignment = userRoles.find((ur) => ur.userId === u.id);
      const roleId = assignment?.roleId || 'ROLE_PI';
      const role = roles.find((r) => r.id === roleId) || roles[0];
      const password =
        passwords[u.email.toLowerCase()] ||
        (u.id === BOOTSTRAP_PI_USER.id ? BOOTSTRAP_PI_PASSWORD : '128');

      return {
        email: u.email,
        password,
        label: `${role.name} (${u.displayName})`,
        roleName: role.name,
        userName: u.displayName,
        roleId: role.id,
        userId: u.id,
        studyId: assignment?.studyId || 'EMPTY-STUDY-001',
        siteId: assignment?.siteId || 'EMPTY-SITE-001',
        description: `${u.displayName} — ${role.name} in Clean Test Workspace`,
      };
    });
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = emptyTestStore.getUsers().find((u) => u.id === userId);
    return user ? structuredClone(user) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    const user = emptyTestStore.getUsers().find((u) => u.email.toLowerCase() === normalized);
    return user ? structuredClone(user) : null;
  }

  async getUserAssignments(userId: string): Promise<UserRole[]> {
    return emptyTestStore
      .getUserRoles()
      .filter((ur) => ur.userId === userId)
      .map((ur) => structuredClone(ur));
  }

  async getRoleById(roleId: string): Promise<Role | null> {
    const role = emptyTestStore.getRoles().find((r) => r.id === roleId);
    return role ? structuredClone(role) : null;
  }

  async getEffectivePermissions(
    userId: string,
    studyId: string,
    siteId: string
  ): Promise<Permission[]> {
    const assignments = emptyTestStore
      .getUserRoles()
      .filter((ur) => ur.userId === userId && ur.studyId === studyId && ur.siteId === siteId);

    const roles = emptyTestStore.getRoles();
    const permissionIdSet = new Set<string>();

    assignments.forEach((a) => {
      const role = roles.find((r) => r.id === a.roleId);
      if (role) {
        role.permissionIds.forEach((pid) => permissionIdSet.add(pid));
      }
    });

    return MOCK_PERMISSIONS.filter((p) => permissionIdSet.has(p.id)).map((p) => structuredClone(p));
  }

  async authenticate(email: string, password: string): Promise<AuthResult> {
    const trimmedEmail = email?.trim().toLowerCase() || '';
    const trimmedPassword = password?.trim() || '';

    if (!trimmedEmail || !trimmedPassword) {
      return { success: false, error: 'Email and password are required.' };
    }

    const user = await this.getUserByEmail(trimmedEmail);
    if (!user) {
      return { success: false, error: 'Invalid credentials. User not found in Empty Test workspace.' };
    }

    if (user.status === 'INACTIVE') {
      return { success: false, error: 'This user account is inactive. Please contact the administrator.' };
    }

    const passwords = emptyTestStore.getUserPasswords();
    const expectedPassword =
      passwords[trimmedEmail] || (user.id === BOOTSTRAP_PI_USER.id ? BOOTSTRAP_PI_PASSWORD : '128');

    if (trimmedPassword !== expectedPassword) {
      return { success: false, error: 'Invalid credentials. Please verify your email and password.' };
    }

    const assignments = await this.getUserAssignments(user.id);
    if (assignments.length === 0) {
      return { success: false, error: 'User has no authorized clinical study/site assignments.' };
    }

    const activeAssignment = assignments[0];
    const role = await this.getRoleById(activeAssignment.roleId);
    if (!role) {
      return { success: false, error: 'Assigned role could not be resolved.' };
    }

    const effectivePermissions = await this.getEffectivePermissions(
      user.id,
      activeAssignment.studyId,
      activeAssignment.siteId
    );

    const session = {
      sessionId: `EMPTY-SESS-${Date.now()}`,
      userId: user.id,
      userName: user.displayName,
      email: user.email,
      roleId: role.id,
      roleName: role.name,
      studyId: activeAssignment.studyId,
      siteId: activeAssignment.siteId,
      authenticated: true,
      loginTimestamp: new Date().toISOString(),
      lastActiveTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      session,
      user,
      role,
      effectivePermissions,
    };
  }
}

// ============================================================================
// 2. Empty Study Repository
// ============================================================================
export class EmptyStudyRepository implements IStudyRepository {
  async getStudies(): Promise<Study[]> {
    return [structuredClone(emptyTestStore.getWorkspace().study)];
  }

  async getStudyById(studyId: string): Promise<Study | null> {
    const study = emptyTestStore.getWorkspace().study;
    return study.id === studyId ? structuredClone(study) : null;
  }

  async getSitesByStudyId(studyId: string): Promise<Site[]> {
    const study = emptyTestStore.getWorkspace().study;
    return study.id === studyId ? structuredClone(study.sites) : [];
  }
}

// ============================================================================
// 3. Empty Team Repository
// ============================================================================
export class EmptyTeamRepository implements ITeamRepository {
  private get repo(): MockTeamRepository {
    return new MockTeamRepository(
      emptyTestStore.getUsers(),
      emptyTestStore.getRoles(),
      structuredClone(MOCK_PERMISSIONS),
      emptyTestStore.getUserRoles(),
      (users) => emptyTestStore.saveUsers(users),
      (roles) => emptyTestStore.saveRoles(roles),
      (userRoles) => emptyTestStore.saveUserRoles(userRoles)
    );
  }

  async getTeamMembers(context: ParticipantQueryContext, filters?: TeamFilters): Promise<TeamMemberSummary[]> {
    return this.repo.getTeamMembers(context, filters);
  }

  async getTeamMemberById(context: ParticipantQueryContext, userId: string): Promise<TeamMemberDetail | null> {
    return this.repo.getTeamMemberById(context, userId);
  }

  async getRoles(context: ParticipantQueryContext, filters?: RoleFilters): Promise<RoleWithCounts[]> {
    return this.repo.getRoles(context, filters);
  }

  async getRoleById(context: ParticipantQueryContext, roleId: string): Promise<Role | null> {
    return this.repo.getRoleById(context, roleId);
  }

  async getPermissions(): Promise<Permission[]> {
    return this.repo.getPermissions();
  }

  async getUserRoleAssignments(context: ParticipantQueryContext, userId: string): Promise<UserRole[]> {
    return this.repo.getUserRoleAssignments(context, userId);
  }

  async getEffectivePermissions(context: ParticipantQueryContext, userId: string): Promise<Permission[]> {
    return this.repo.getEffectivePermissions(context, userId);
  }

  async getTeamSummaryMetrics(context: ParticipantQueryContext): Promise<TeamSummaryMetrics> {
    return this.repo.getTeamSummaryMetrics(context);
  }

  async assignRole(context: ParticipantQueryContext, input: AssignRoleInput): Promise<UserRole> {
    return this.repo.assignRole(context, input);
  }

  async removeRoleAssignment(context: ParticipantQueryContext, userRoleId: string): Promise<boolean> {
    return this.repo.removeRoleAssignment(context, userRoleId);
  }

  async createCustomRole(context: ParticipantQueryContext, input: CreateCustomRoleInput): Promise<Role> {
    return this.repo.createCustomRole(context, input);
  }

  async updateCustomRole(
    context: ParticipantQueryContext,
    roleId: string,
    input: UpdateCustomRoleInput
  ): Promise<Role> {
    return this.repo.updateCustomRole(context, roleId, input);
  }

  async createTeamMember(
    context: ParticipantQueryContext,
    input: CreateTeamMemberInput
  ): Promise<TeamMemberSummary> {
    const member = await this.repo.createTeamMember(context, input);
    // Always persist password to passwords store (default "128")
    const tempPassword = input.password?.trim() || '128';
    emptyTestStore.setUserPassword(input.email, tempPassword);
    return member;
  }

  async toggleUserStatus(
    context: ParticipantQueryContext,
    userId: string,
    status: 'ACTIVE' | 'INACTIVE'
  ): Promise<User> {
    return this.repo.toggleUserStatus(context, userId, status);
  }
}

// ============================================================================
// 4. Empty Participant Repository
// ============================================================================
export class EmptyParticipantRepository implements IParticipantRepository {
  private getStore(): Record<string, Record<string, Participant[]>> {
    const list = emptyTestStore.getParticipants();
    const map: Record<string, Record<string, Participant[]>> = {};
    for (const p of list) {
      if (!map[p.studyId]) map[p.studyId] = {};
      if (!map[p.studyId][p.siteId]) map[p.studyId][p.siteId] = [];
      map[p.studyId][p.siteId].push(p);
    }
    return map;
  }

  private saveStore(store: Record<string, Record<string, Participant[]>>): void {
    const all: Participant[] = [];
    for (const s of Object.values(store)) {
      for (const siteList of Object.values(s)) {
        all.push(...siteList);
      }
    }
    emptyTestStore.saveParticipants(all);
  }

  private get repo(): MockParticipantRepository {
    return new MockParticipantRepository(
      this.getStore(),
      (store) => this.saveStore(store),
      emptyTestStore.getOnboardingRequests(),
      (reqs) => emptyTestStore.saveOnboardingRequests(reqs),
      emptyTestStore.getParticipantRequests(),
      (preqs) => emptyTestStore.saveParticipantRequests(preqs)
    );
  }

  async getParticipants(context: ParticipantQueryContext, filters?: ParticipantFilters): Promise<Participant[]> {
    return this.repo.getParticipants(context, filters);
  }

  async getParticipantById(context: ParticipantQueryContext, participantId: string): Promise<Participant | null> {
    return this.repo.getParticipantById(context, participantId);
  }

  async getParticipantSummary(context: ParticipantQueryContext): Promise<ParticipantSummaryMetrics> {
    return this.repo.getParticipantSummary(context);
  }

  async createParticipant(context: ParticipantQueryContext, input: CreateParticipantInput): Promise<Participant> {
    return this.repo.createParticipant(context, input);
  }

  async updateParticipant(
    context: ParticipantQueryContext,
    participantId: string,
    updates: Partial<Participant>
  ): Promise<Participant | null> {
    return this.repo.updateParticipant(context, participantId, updates);
  }

  async getOnboardingRequests(context: ParticipantQueryContext): Promise<ParticipantOnboardingRequest[]> {
    return this.repo.getOnboardingRequests(context);
  }

  async getOnboardingRequestById(
    context: ParticipantQueryContext,
    requestId: string
  ): Promise<ParticipantOnboardingRequest | null> {
    return this.repo.getOnboardingRequestById(context, requestId);
  }

  async createOnboardingRequest(input: ParticipantSelfRegistrationInput): Promise<ParticipantOnboardingRequest> {
    return this.repo.createOnboardingRequest(input);
  }

  async updateOnboardingRequest(req: ParticipantOnboardingRequest): Promise<ParticipantOnboardingRequest> {
    return this.repo.updateOnboardingRequest(req);
  }

  async getParticipantRequests(
    context: ParticipantQueryContext,
    participantId?: string
  ): Promise<ParticipantRequest[]> {
    return this.repo.getParticipantRequests(context, participantId);
  }

  async createParticipantRequest(input: CreateParticipantRequestInput): Promise<ParticipantRequest> {
    return this.repo.createParticipantRequest(input);
  }

  async updateParticipantRequest(req: ParticipantRequest): Promise<ParticipantRequest> {
    return this.repo.updateParticipantRequest(req);
  }
}

// ============================================================================
// 5. Empty Visit Repository
// ============================================================================
export class EmptyVisitRepository implements IVisitRepository {
  private getVisitsStore(): Record<string, Record<string, ParticipantVisit[]>> {
    const list = emptyTestStore.getVisits();
    const map: Record<string, Record<string, ParticipantVisit[]>> = {};
    for (const v of list) {
      if (!map[v.studyId]) map[v.studyId] = {};
      if (!map[v.studyId][v.siteId]) map[v.studyId][v.siteId] = [];
      map[v.studyId][v.siteId].push(v);
    }
    return map;
  }

  private saveVisitsStore(store: Record<string, Record<string, ParticipantVisit[]>>): void {
    const all: ParticipantVisit[] = [];
    for (const s of Object.values(store)) {
      for (const siteList of Object.values(s)) {
        all.push(...siteList);
      }
    }
    emptyTestStore.saveVisits(all);
  }

  private get repo(): MockVisitRepository {
    const protocolVisits: Record<string, ProtocolVisitDefinition[]> = {
      'EMPTY-STUDY-001': EMPTY_PROTOCOL_VISITS,
    };
    return new MockVisitRepository(this.getVisitsStore(), protocolVisits, (store) =>
      this.saveVisitsStore(store)
    );
  }

  async getProtocolVisits(studyId: string): Promise<ProtocolVisitDefinition[]> {
    return this.repo.getProtocolVisits(studyId);
  }

  async getVisits(context: ParticipantQueryContext, filters?: VisitFilters): Promise<ParticipantVisit[]> {
    return this.repo.getVisits(context, filters);
  }

  async getParticipantVisits(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<ParticipantVisit[]> {
    return this.repo.getParticipantVisits(context, participantId);
  }

  async getVisitById(context: ParticipantQueryContext, visitId: string): Promise<ParticipantVisit | null> {
    return this.repo.getVisitById(context, visitId);
  }

  async getVisitSummary(context: ParticipantQueryContext): Promise<VisitSummaryMetrics> {
    return this.repo.getVisitSummary(context);
  }

  async updateVisitActivityStatus(
    context: ParticipantQueryContext,
    visitId: string,
    activityId: string,
    status: ClinicalActivityStatus
  ): Promise<ParticipantVisit | null> {
    return this.repo.updateVisitActivityStatus(context, visitId, activityId, status);
  }

  async createVisit(context: ParticipantQueryContext, input: CreateVisitInput): Promise<ParticipantVisit> {
    return this.repo.createVisit(context, input);
  }

  async updateVisit(
    context: ParticipantQueryContext,
    visitId: string,
    updates: Partial<ParticipantVisit>
  ): Promise<ParticipantVisit | null> {
    return this.repo.updateVisit(context, visitId, updates);
  }
}

// ============================================================================
// 6. Empty Task Repository
// ============================================================================
export class EmptyTaskRepository implements ITaskRepository {
  private get repo(): MockTaskRepository {
    return new MockTaskRepository(
      emptyTestStore.getTasks(),
      emptyTestStore.getUsers(),
      emptyTestStore.getUserRoles(),
      emptyTestStore.getRoles(),
      (tasks) => emptyTestStore.saveTasks(tasks)
    );
  }

  async getTasks(context: ParticipantQueryContext, filters?: TaskFilters): Promise<Task[]> {
    return this.repo.getTasks(context, filters);
  }

  async getTaskById(context: ParticipantQueryContext, taskId: string): Promise<Task | null> {
    return this.repo.getTaskById(context, taskId);
  }

  async getTaskSummary(context: ParticipantQueryContext, currentUserId?: string): Promise<TaskSummaryMetrics> {
    return this.repo.getTaskSummary(context, currentUserId);
  }

  async getTaskAssignments(context: ParticipantQueryContext, taskId: string): Promise<TaskAssignment[]> {
    return this.repo.getTaskAssignments(context, taskId);
  }

  async getMyTasks(context: ParticipantQueryContext, userId: string): Promise<Task[]> {
    return this.repo.getMyTasks(context, userId);
  }

  async createTask(context: ParticipantQueryContext, input: CreateTaskInput): Promise<Task> {
    return this.repo.createTask(context, input);
  }

  async assignTask(
    context: ParticipantQueryContext,
    taskId: string,
    assignment: AssignTaskInput
  ): Promise<Task> {
    return this.repo.assignTask(context, taskId, assignment);
  }

  async updateTaskStatus(
    context: ParticipantQueryContext,
    taskId: string,
    status: TaskStatus
  ): Promise<Task> {
    return this.repo.updateTaskStatus(context, taskId, status);
  }

  async submitTask(context: ParticipantQueryContext, taskId: string): Promise<Task> {
    return this.repo.submitTask(context, taskId);
  }

  async approveTask(
    context: ParticipantQueryContext,
    taskId: string,
    reviewerId: string,
    comments: string
  ): Promise<Task> {
    return this.repo.approveTask(context, taskId, reviewerId, comments);
  }

  async requestRevision(
    context: ParticipantQueryContext,
    taskId: string,
    reviewerId: string,
    comments: string
  ): Promise<Task> {
    return this.repo.requestRevision(context, taskId, reviewerId, comments);
  }

  async rejectTask(
    context: ParticipantQueryContext,
    taskId: string,
    reviewerId: string,
    comments: string
  ): Promise<Task> {
    return this.repo.rejectTask(context, taskId, reviewerId, comments);
  }

  async completeTask(context: ParticipantQueryContext, taskId: string): Promise<Task> {
    return this.repo.completeTask(context, taskId);
  }
}

// ============================================================================
// 7. Empty Visit Data Repository
// ============================================================================
export class EmptyVisitDataRepository implements IVisitDataRepository {
  private get repo(): MockVisitDataRepository {
    return new MockVisitDataRepository(emptyTestStore.getVisitData(), (recs) =>
      emptyTestStore.saveVisitData(recs)
    );
  }

  async getRecord(context: ParticipantQueryContext, recordId: string): Promise<VisitDataRecord | null> {
    return this.repo.getRecord(context, recordId);
  }

  async listRecords(context: ParticipantQueryContext, filters?: VisitDataFilters): Promise<VisitDataRecord[]> {
    return this.repo.listRecords(context, filters);
  }

  async getDataEntryQueue(context: ParticipantQueryContext): Promise<VisitDataRecord[]> {
    return this.repo.getDataEntryQueue(context);
  }

  async getVerificationQueue(context: ParticipantQueryContext): Promise<VisitDataRecord[]> {
    return this.repo.getVerificationQueue(context);
  }

  async createDraft(
    context: ParticipantQueryContext,
    record: CreateDraftRecordInput,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.createDraft(context, record, actor);
  }

  async updateField(
    context: ParticipantQueryContext,
    recordId: string,
    field: Partial<VisitDataField> & { fieldKey: string; label: string; value: string },
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.updateField(context, recordId, field, actor);
  }

  async updateRecordFields(
    context: ParticipantQueryContext,
    recordId: string,
    fields: Partial<VisitDataField>[],
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.updateRecordFields(context, recordId, fields, actor);
  }

  async uploadAttachment(
    context: ParticipantQueryContext,
    recordId: string,
    attachment: Omit<VisitAttachment, 'id' | 'recordId' | 'uploadedAt'>,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.uploadAttachment(context, recordId, attachment, actor);
  }

  async removeAttachment(
    context: ParticipantQueryContext,
    recordId: string,
    attachmentId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.removeAttachment(context, recordId, attachmentId, actor);
  }

  async submitForVerification(
    context: ParticipantQueryContext,
    recordId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.submitForVerification(context, recordId, actor);
  }

  async returnForCorrection(
    context: ParticipantQueryContext,
    recordId: string,
    reason: string,
    affectedFields: string[] | undefined,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.returnForCorrection(context, recordId, reason, affectedFields, actor);
  }

  async resubmitForVerification(
    context: ParticipantQueryContext,
    recordId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.resubmitForVerification(context, recordId, actor);
  }

  async verifyRecord(
    context: ParticipantQueryContext,
    recordId: string,
    comment: string | undefined,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.verifyRecord(context, recordId, comment, actor);
  }

  async moveToPiReview(
    context: ParticipantQueryContext,
    recordId: string,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.moveToPiReview(context, recordId, actor);
  }

  async submitToCro(
    context: ParticipantQueryContext,
    recordId: string,
    comment: string | undefined,
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.submitToCro(context, recordId, comment, actor);
  }

  async addReviewNote(
    context: ParticipantQueryContext,
    recordId: string,
    note: { type: ReviewNoteType; message: string },
    actor: WorkflowActor
  ): Promise<VisitDataRecord> {
    return this.repo.addReviewNote(context, recordId, note, actor);
  }

  async getReviewHistory(context: ParticipantQueryContext, recordId: string): Promise<ReviewNote[]> {
    return this.repo.getReviewHistory(context, recordId);
  }

  async getVerificationHistory(
    context: ParticipantQueryContext,
    recordId: string
  ): Promise<VerificationAction[]> {
    return this.repo.getVerificationHistory(context, recordId);
  }

  async getSummaryMetrics(context: ParticipantQueryContext): Promise<DataEntrySummaryMetrics> {
    return this.repo.getSummaryMetrics(context);
  }
}

// ============================================================================
// 8. Empty Notification Repository
// ============================================================================
export class EmptyNotificationRepository implements INotificationRepository {
  private get repo(): MockNotificationRepository {
    return new MockNotificationRepository(emptyTestStore.getNotifications(), (notifications) =>
      emptyTestStore.saveNotifications(notifications)
    );
  }

  async getNotifications(
    context: NotificationQueryContext,
    filters?: NotificationFilters
  ): Promise<Notification[]> {
    return this.repo.getNotifications(context, filters);
  }

  async getNotificationById(
    context: NotificationQueryContext,
    notificationId: string
  ): Promise<Notification | null> {
    return this.repo.getNotificationById(context, notificationId);
  }

  async getNotificationSummary(context: NotificationQueryContext): Promise<NotificationSummaryMetrics> {
    return this.repo.getNotificationSummary(context);
  }

  async markAsRead(context: NotificationQueryContext, notificationId: string): Promise<Notification> {
    return this.repo.markAsRead(context, notificationId);
  }

  async markAllAsRead(context: NotificationQueryContext): Promise<number> {
    return this.repo.markAllAsRead(context);
  }

  async dismissNotification(
    context: NotificationQueryContext,
    notificationId: string
  ): Promise<Notification> {
    return this.repo.dismissNotification(context, notificationId);
  }

  async getUnreadCount(context: NotificationQueryContext): Promise<number> {
    return this.repo.getUnreadCount(context);
  }

  async createNotification(
    context: NotificationQueryContext,
    notification: Omit<Notification, 'id' | 'createdAt'>
  ): Promise<Notification> {
    return this.repo.createNotification(context, notification);
  }
}

// ============================================================================
// 9. Empty Safety Repository
// ============================================================================
export class EmptySafetyRepository implements ISafetyRepository {
  private getStore(): Record<string, Record<string, SafetyEvent[]>> {
    const list = emptyTestStore.getSafety();
    const map: Record<string, Record<string, SafetyEvent[]>> = {};
    for (const e of list) {
      if (!map[e.studyId]) map[e.studyId] = {};
      if (!map[e.studyId][e.siteId]) map[e.studyId][e.siteId] = [];
      map[e.studyId][e.siteId].push(e);
    }
    return map;
  }

  private saveStore(store: Record<string, Record<string, SafetyEvent[]>>): void {
    const all: SafetyEvent[] = [];
    for (const s of Object.values(store)) {
      for (const siteList of Object.values(s)) {
        all.push(...siteList);
      }
    }
    emptyTestStore.saveSafety(all);
  }

  private get repo(): MockSafetyRepository {
    return new MockSafetyRepository(this.getStore(), (store) => this.saveStore(store));
  }

  async getSafetyEvents(context: ParticipantQueryContext, filters?: SafetyFilters): Promise<SafetyEvent[]> {
    return this.repo.getSafetyEvents(context, filters);
  }

  async getSafetyEventById(context: ParticipantQueryContext, eventId: string): Promise<SafetyEvent | null> {
    return this.repo.getSafetyEventById(context, eventId);
  }

  async getParticipantSafetyEvents(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<SafetyEvent[]> {
    return this.repo.getParticipantSafetyEvents(context, participantId);
  }

  async getSafetySummary(context: ParticipantQueryContext): Promise<SafetySummaryMetrics> {
    return this.repo.getSafetySummary(context);
  }

  async updatePIReviewStatus(
    context: ParticipantQueryContext,
    eventId: string,
    status: PIReviewStatus,
    reviewedBy?: string
  ): Promise<SafetyEvent | null> {
    return this.repo.updatePIReviewStatus(context, eventId, status, reviewedBy);
  }

  async updateFollowUpStatus(
    context: ParticipantQueryContext,
    eventId: string,
    status: FollowUpStatus,
    notes?: string
  ): Promise<SafetyEvent | null> {
    return this.repo.updateFollowUpStatus(context, eventId, status, notes);
  }
}

// ============================================================================
// 10. Empty Compliance Repository
// ============================================================================
export class EmptyComplianceRepository implements IComplianceRepository {
  private getStore(): Record<string, Record<string, ProtocolDeviation[]>> {
    const list = emptyTestStore.getDeviations();
    const map: Record<string, Record<string, ProtocolDeviation[]>> = {};
    for (const d of list) {
      if (!map[d.studyId]) map[d.studyId] = {};
      if (!map[d.studyId][d.siteId]) map[d.studyId][d.siteId] = [];
      map[d.studyId][d.siteId].push(d);
    }
    return map;
  }

  private saveStore(store: Record<string, Record<string, ProtocolDeviation[]>>): void {
    const all: ProtocolDeviation[] = [];
    for (const s of Object.values(store)) {
      for (const siteList of Object.values(s)) {
        all.push(...siteList);
      }
    }
    emptyTestStore.saveDeviations(all);
  }

  private get repo(): MockComplianceRepository {
    return new MockComplianceRepository(this.getStore(), (store) => this.saveStore(store));
  }

  async getDeviations(context: ParticipantQueryContext, filters?: DeviationFilters): Promise<ProtocolDeviation[]> {
    return this.repo.getDeviations(context, filters);
  }

  async getDeviationById(context: ParticipantQueryContext, deviationId: string): Promise<ProtocolDeviation | null> {
    return this.repo.getDeviationById(context, deviationId);
  }

  async getParticipantDeviations(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<ProtocolDeviation[]> {
    return this.repo.getParticipantDeviations(context, participantId);
  }

  async getVisitDeviations(context: ParticipantQueryContext, visitId: string): Promise<ProtocolDeviation[]> {
    return this.repo.getVisitDeviations(context, visitId);
  }

  async getComplianceSummary(context: ParticipantQueryContext): Promise<ComplianceSummaryMetrics> {
    return this.repo.getComplianceSummary(context);
  }

  async updateDeviationStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    status: DeviationStatus
  ): Promise<ProtocolDeviation | null> {
    return this.repo.updateDeviationStatus(context, deviationId, status);
  }

  async updateReviewStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    reviewStatus: ComplianceReviewStatus,
    reviewedBy?: string
  ): Promise<ProtocolDeviation | null> {
    return this.repo.updateReviewStatus(context, deviationId, reviewStatus, reviewedBy);
  }

  async updateCapaStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    capaStatus: CapaStatus,
    summary?: string
  ): Promise<ProtocolDeviation | null> {
    return this.repo.updateCapaStatus(context, deviationId, capaStatus, summary);
  }
}

// ============================================================================
// 11. Empty Document Repository
// ============================================================================
export class EmptyDocumentRepository implements IDocumentRepository {
  private get repo(): MockDocumentRepository {
    return new MockDocumentRepository(
      emptyTestStore.getDocuments(),
      emptyTestStore.getUsers(),
      emptyTestStore.getUserRoles(),
      (docs) => emptyTestStore.saveDocuments(docs)
    );
  }

  async getDocuments(context: ParticipantQueryContext, filters?: DocumentFilters): Promise<Document[]> {
    return this.repo.getDocuments(context, filters);
  }

  async getDocumentById(context: ParticipantQueryContext, documentId: string): Promise<Document | null> {
    return this.repo.getDocumentById(context, documentId);
  }

  async getDocumentSummary(context: ParticipantQueryContext): Promise<DocumentSummaryMetrics> {
    return this.repo.getDocumentSummary(context);
  }

  async getDocumentVersions(context: ParticipantQueryContext, documentId: string): Promise<DocumentVersion[]> {
    return this.repo.getDocumentVersions(context, documentId);
  }

  async createDocument(context: ParticipantQueryContext, input: CreateDocumentInput): Promise<Document> {
    return this.repo.createDocument(context, input);
  }

  async createDocumentVersion(
    context: ParticipantQueryContext,
    documentId: string,
    input: CreateDocumentVersionInput
  ): Promise<Document> {
    return this.repo.createDocumentVersion(context, documentId, input);
  }

  async updateDocument(
    context: ParticipantQueryContext,
    documentId: string,
    update: UpdateDocumentInput
  ): Promise<Document> {
    return this.repo.updateDocument(context, documentId, update);
  }

  async archiveDocument(context: ParticipantQueryContext, documentId: string): Promise<Document> {
    return this.repo.archiveDocument(context, documentId);
  }

  getExpiryState(document: Document, referenceDate?: string): DocumentExpiryState {
    return this.repo.getExpiryState(document, referenceDate);
  }
}

// ============================================================================
// 12. Empty Dashboard Repository
// ============================================================================
export class EmptyDashboardRepository implements IDashboardRepository {
  async getOverview(studyId: string, siteId: string): Promise<DashboardOverviewData | null> {
    const study = emptyTestStore.getWorkspace().study;
    if (study.id !== studyId) return null;

    const site = study.sites.find((s) => s.id === siteId) || study.sites[0];
    const participants = emptyTestStore.getParticipants();
    const visits = emptyTestStore.getVisits();
    const tasks = emptyTestStore.getTasks();
    const safety = emptyTestStore.getSafety();
    const deviations = emptyTestStore.getDeviations();
    const auditEvents = emptyTestStore.getAuditHistory();

    const enrolledCount = participants.filter((p) => p.status === 'ENROLLED' || p.enrollmentDate).length;
    const activeCount = participants.filter((p) => p.status === 'ACTIVE').length;
    const completedCount = participants.filter((p) => p.status === 'COMPLETED').length;
    const withdrawnCount = participants.filter((p) => p.status === 'WITHDRAWN').length;
    const screenedCount = participants.length;

    const upcomingVisits = visits.filter((v) => v.status === 'SCHEDULED' || v.status === 'DUE').length;
    const overdueVisits = visits.filter((v) => v.status === 'OVERDUE').length;
    const completedVisits = visits.filter((v) => v.status === 'COMPLETED').length;

    const aeCount = safety.filter((e) => e.eventType === 'AE').length;
    const saeCount = safety.filter((e) => e.eventType === 'SAE').length;
    const pendingSafetyReview = safety.filter((e) => e.piReviewStatus === 'NOT_REVIEWED').length;

    const openDevs = deviations.filter((d) => d.status !== 'CLOSED' && d.status !== 'RESOLVED').length;
    const critDevs = deviations.filter((d) => d.classification === 'CRITICAL').length;
    const pendingCapa = deviations.filter((d) => d.capaStatus === 'PENDING' || d.capaStatus === 'IN_PROGRESS').length;

    const mapTaskPriority = (p: Task['priority']): 'High' | 'Medium' | 'Normal' => {
      if (p === 'HIGH') return 'High';
      if (p === 'MEDIUM') return 'Medium';
      return 'Normal';
    };

    return {
      context: {
        studyId: study.id,
        studyCode: study.code,
        studyTitle: study.title,
        protocolVersion: study.protocolVersion,
        studyStatus: study.status,
        siteId: site.id,
        siteName: site.name,
        siteCode: site.siteCode,
        piId: site.piId,
        piName: site.piName,
        piRole: 'Principal Investigator',
      },
      participantSummary: {
        screened: screenedCount,
        enrolled: enrolledCount,
        active: activeCount,
        completed: completedCount,
        withdrawn: withdrawnCount,
      },
      recruitment: {
        target: study.targetEnrollment,
        enrolled: enrolledCount,
        remaining: Math.max(0, study.targetEnrollment - enrolledCount),
        progressPercent: Math.round((enrolledCount / study.targetEnrollment) * 100),
      },
      visits: {
        upcoming: upcomingVisits,
        overdue: overdueVisits,
        completedThisMonth: completedVisits,
      },
      safetySummary: {
        adverseEvents: aeCount,
        seriousAdverseEvents: saeCount,
        pendingReview: pendingSafetyReview,
        followUpRequired: 0,
      },
      complianceSummary: {
        openDeviations: openDevs,
        criticalDeviations: critDevs,
        pendingCorrectiveActions: pendingCapa,
        lastAuditDate: '2026-09-01',
      },
      upcomingActivities: [],
      pendingActions: tasks
        .filter((t) => t.status === 'UNDER_REVIEW' || t.status === 'SUBMITTED')
        .map((t) => ({
          id: t.id,
          title: t.title,
          category: 'Task' as const,
          priority: mapTaskPriority(t.priority),
          dueDateLabel: t.dueDate,
          status: t.status,
          actionLabel: 'Review Task',
        })),
      recentActivities: auditEvents.slice(0, 10).map((a: AuditLogEvent) => ({
        id: a.id,
        title: `${a.action}: ${a.targetEntity}`,
        actor: a.actorUserId,
        role: a.actorRole,
        timestampLabel: a.timestamp.slice(0, 10),
        category: a.targetEntity,
      })),
    };
  }
}

// ============================================================================
// 13. Empty Report Repository
// ============================================================================
export class EmptyReportRepository implements IReportRepository {
  private get repo(): MockReportRepository {
    return new MockReportRepository();
  }

  async getReportDefinitions(): Promise<ReportDefinition[]> {
    return this.repo.getReportDefinitions();
  }

  async generateReport(
    context: ParticipantQueryContext,
    reportType: ReportType,
    filters?: ReportFilters
  ): Promise<GeneratedReport> {
    return this.repo.generateReport(context, reportType, filters);
  }

  async getReportSummary(
    context: ParticipantQueryContext,
    reportType: ReportType
  ): Promise<ReportSummaryMetricItem[]> {
    return this.repo.getReportSummary(context, reportType);
  }
}

// ============================================================================
// 14. Empty Audit Repository
// ============================================================================
export class EmptyAuditRepository implements IAuditRepository {
  async getEvents(context: ParticipantQueryContext): Promise<AuditLogEvent[]> {
    return emptyTestStore
      .getAuditHistory()
      .filter((e: AuditLogEvent) => e.studyId === context.studyId && e.siteId === context.siteId);
  }

  async logEvent(event: Omit<AuditLogEvent, 'id' | 'timestamp'>): Promise<AuditLogEvent> {
    return emptyTestStore.logAuditEvent(event);
  }
}
