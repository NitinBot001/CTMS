/**
 * Empty Test Workspace Local Storage Manager
 * 
 * Manages clean, browser-persistent workspace data under the `aiia_ctms_empty_test_*` namespace.
 * Strictly isolated from canonical MOCK fixtures.
 */
import { browserStorage } from './browserStorage';
import {
  Study,
  User,
  Role,
  UserRole,
  Participant,
  ParticipantVisit,
  VisitDataRecord,
  Task,
  Document,
  SafetyEvent,
  ProtocolDeviation,
  Notification,
  AuditLogEvent,
  ProtocolVisitDefinition,
  ParticipantOnboardingRequest,
  ParticipantRequest,
} from '../types';
import { MOCK_ROLES } from '../data/mockData';

export const MODE_STORAGE_KEY = 'aiia_ctms_mode';
export const EMPTY_TEST_PREFIX = 'aiia_ctms_empty_test_';

export const EMPTY_TEST_KEYS = {
  WORKSPACE: `${EMPTY_TEST_PREFIX}workspace`,
  USERS: `${EMPTY_TEST_PREFIX}users`,
  USER_ROLES: `${EMPTY_TEST_PREFIX}user_roles`,
  ROLES: `${EMPTY_TEST_PREFIX}roles`,
  PARTICIPANTS: `${EMPTY_TEST_PREFIX}participants`,
  VISITS: `${EMPTY_TEST_PREFIX}visits`,
  VISIT_DATA: `${EMPTY_TEST_PREFIX}visit_data`,
  TASKS: `${EMPTY_TEST_PREFIX}tasks`,
  DOCUMENTS: `${EMPTY_TEST_PREFIX}documents`,
  SAFETY: `${EMPTY_TEST_PREFIX}safety`,
  DEVIATIONS: `${EMPTY_TEST_PREFIX}deviations`,
  NOTIFICATIONS: `${EMPTY_TEST_PREFIX}notifications`,
  AUDIT: `${EMPTY_TEST_PREFIX}audit`,
  PASSWORDS: `${EMPTY_TEST_PREFIX}passwords`,
  ONBOARDING_REQUESTS: `${EMPTY_TEST_PREFIX}onboarding_requests`,
  PARTICIPANT_REQUESTS: `${EMPTY_TEST_PREFIX}participant_requests`,
};

export const EMPTY_TEST_STUDY: Study = {
  id: 'EMPTY-STUDY-001',
  code: 'EMPTY-001',
  title: 'AIIA CTMS Empty Test Study',
  shortDescription: 'Clean workflow test study for institutional CTMS validation',
  protocolVersion: 'v1.0',
  status: 'Active',
  sponsorName: 'AIIA Research Directorate',
  targetEnrollment: 50,
  sites: [
    {
      id: 'EMPTY-SITE-001',
      name: 'Empty Test Site',
      siteCode: 'SITE-EMPTY-001',
      location: 'New Delhi',
      piId: 'USR-EMPTY-PI',
      piName: 'Dr. Test PI',
    },
  ],
};

export const BOOTSTRAP_PI_USER: User = {
  id: 'USR-EMPTY-PI',
  displayName: 'Dr. Test PI',
  email: 'demo.pi.empty@aiia-ctms.local',
  designation: 'Principal Investigator',
  status: 'ACTIVE',
  organization: 'All India Institute of Ayurveda',
  department: 'Clinical Research',
  phone: '+91 11 2999 0001',
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
};

export const BOOTSTRAP_PI_PASSWORD = 'PI@Empty123';
export const DEFAULT_TEMPORARY_PASSWORD = '128';

export const BOOTSTRAP_PI_USER_ROLE: UserRole = {
  id: 'UR-EMPTY-001',
  userId: 'USR-EMPTY-PI',
  roleId: 'ROLE_PI',
  studyId: 'EMPTY-STUDY-001',
  siteId: 'EMPTY-SITE-001',
  assignedAt: '2026-09-01T00:00:00Z',
  assignedBy: 'SYSTEM_BOOTSTRAP',
};

export const EMPTY_PROTOCOL_VISITS: ProtocolVisitDefinition[] = [
  {
    id: 'PV-EMPTY-01',
    studyId: 'EMPTY-STUDY-001',
    code: 'SCR',
    name: 'Screening Visit',
    sequence: 1,
    anchor: 'SCREENING_DATE',
    targetOffsetDays: 0,
    windowBeforeDays: 0,
    windowAfterDays: 0,
    requiredActivities: ['ICF', 'INC_EXC', 'VITALS'],
    description: 'Informed consent, eligibility screening, medical history.',
  },
  {
    id: 'PV-EMPTY-02',
    studyId: 'EMPTY-STUDY-001',
    code: 'DAY-01',
    name: 'Baseline & Randomization',
    sequence: 2,
    anchor: 'ENROLLMENT_DATE',
    targetOffsetDays: 0,
    windowBeforeDays: 0,
    windowAfterDays: 2,
    requiredActivities: ['VITALS', 'LAB', 'DISP'],
    description: 'Baseline vital signs, laboratory tests, initial dispensing.',
  },
  {
    id: 'PV-EMPTY-03',
    studyId: 'EMPTY-STUDY-001',
    code: 'WK-04',
    name: 'Week 4 Follow-up',
    sequence: 3,
    anchor: 'ENROLLMENT_DATE',
    targetOffsetDays: 28,
    windowBeforeDays: 3,
    windowAfterDays: 3,
    requiredActivities: ['VITALS', 'AE_CHECK'],
    description: 'Mid-term safety evaluation, compliance check.',
  },
  {
    id: 'PV-EMPTY-04',
    studyId: 'EMPTY-STUDY-001',
    code: 'WK-12',
    name: 'Week 12 Closeout Visit',
    sequence: 4,
    anchor: 'ENROLLMENT_DATE',
    targetOffsetDays: 84,
    windowBeforeDays: 5,
    windowAfterDays: 5,
    requiredActivities: ['FINAL_EXAM', 'DRUG_RET'],
    description: 'Study completion procedures, end-of-study assessments.',
  },
];

export interface EmptyWorkspaceMetadata {
  version: number;
  initializedAt: string;
  study: Study;
}

export class EmptyTestStore {
  /**
   * Initializes clean Empty Test workspace if not already present.
   */
  initWorkspace(): EmptyWorkspaceMetadata {
    const existing = browserStorage.get<EmptyWorkspaceMetadata>(EMPTY_TEST_KEYS.WORKSPACE);
    if (existing && existing.version === 1) {
      return existing;
    }

    const metadata: EmptyWorkspaceMetadata = {
      version: 1,
      initializedAt: new Date().toISOString(),
      study: EMPTY_TEST_STUDY,
    };

    browserStorage.set(EMPTY_TEST_KEYS.WORKSPACE, metadata);
    browserStorage.set(EMPTY_TEST_KEYS.USERS, [BOOTSTRAP_PI_USER]);
    browserStorage.set(EMPTY_TEST_KEYS.USER_ROLES, [BOOTSTRAP_PI_USER_ROLE]);
    browserStorage.set(EMPTY_TEST_KEYS.ROLES, structuredClone(MOCK_ROLES));
    browserStorage.set(EMPTY_TEST_KEYS.PARTICIPANTS, []);
    browserStorage.set(EMPTY_TEST_KEYS.VISITS, []);
    browserStorage.set(EMPTY_TEST_KEYS.VISIT_DATA, []);
    browserStorage.set(EMPTY_TEST_KEYS.TASKS, []);
    browserStorage.set(EMPTY_TEST_KEYS.DOCUMENTS, []);
    browserStorage.set(EMPTY_TEST_KEYS.SAFETY, []);
    browserStorage.set(EMPTY_TEST_KEYS.DEVIATIONS, []);
    browserStorage.set(EMPTY_TEST_KEYS.NOTIFICATIONS, []);
    browserStorage.set(EMPTY_TEST_KEYS.AUDIT, [
      {
        id: 'AUD-EMPTY-001',
        actorUserId: 'USR-EMPTY-PI',
        actorRole: 'ROLE_PI',
        studyId: 'EMPTY-STUDY-001',
        siteId: 'EMPTY-SITE-001',
        targetEntity: 'WORKSPACE',
        action: 'BOOTSTRAP_INITIALIZED',
        timestamp: new Date().toISOString(),
        metadata: { info: 'Fresh clean Empty Test environment initialized' },
      },
    ]);
    browserStorage.set(EMPTY_TEST_KEYS.PASSWORDS, {
      [BOOTSTRAP_PI_USER.email.toLowerCase()]: BOOTSTRAP_PI_PASSWORD,
    });
    browserStorage.set(EMPTY_TEST_KEYS.ONBOARDING_REQUESTS, []);
    browserStorage.set(EMPTY_TEST_KEYS.PARTICIPANT_REQUESTS, []);

    return metadata;
  }

  /**
   * Resets Empty Test workspace to fresh minimal bootstrap.
   * Completely removes all created empty test domain data without touching Mock data.
   */
  resetWorkspace(): EmptyWorkspaceMetadata {
    Object.values(EMPTY_TEST_KEYS).forEach((key) => {
      browserStorage.remove(key);
    });
    return this.initWorkspace();
  }

  getWorkspace(): EmptyWorkspaceMetadata {
    return this.initWorkspace();
  }

  // --- Collection Accessors ---

  getUsers(): User[] {
    this.initWorkspace();
    return browserStorage.get<User[]>(EMPTY_TEST_KEYS.USERS, [BOOTSTRAP_PI_USER]) || [BOOTSTRAP_PI_USER];
  }

  saveUsers(users: User[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.USERS, users);
  }

  getUserRoles(): UserRole[] {
    this.initWorkspace();
    return browserStorage.get<UserRole[]>(EMPTY_TEST_KEYS.USER_ROLES, [BOOTSTRAP_PI_USER_ROLE]) || [BOOTSTRAP_PI_USER_ROLE];
  }

  saveUserRoles(userRoles: UserRole[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.USER_ROLES, userRoles);
  }

  getRoles(): Role[] {
    this.initWorkspace();
    return browserStorage.get<Role[]>(EMPTY_TEST_KEYS.ROLES, MOCK_ROLES) || structuredClone(MOCK_ROLES);
  }

  saveRoles(roles: Role[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.ROLES, roles);
  }

  getParticipants(): Participant[] {
    this.initWorkspace();
    return browserStorage.get<Participant[]>(EMPTY_TEST_KEYS.PARTICIPANTS, []) || [];
  }

  saveParticipants(participants: Participant[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PARTICIPANTS, participants);
  }

  getVisits(): ParticipantVisit[] {
    this.initWorkspace();
    return browserStorage.get<ParticipantVisit[]>(EMPTY_TEST_KEYS.VISITS, []) || [];
  }

  saveVisits(visits: ParticipantVisit[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.VISITS, visits);
  }

  getVisitData(): VisitDataRecord[] {
    this.initWorkspace();
    return browserStorage.get<VisitDataRecord[]>(EMPTY_TEST_KEYS.VISIT_DATA, []) || [];
  }

  saveVisitData(records: VisitDataRecord[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.VISIT_DATA, records);
  }

  getTasks(): Task[] {
    this.initWorkspace();
    return browserStorage.get<Task[]>(EMPTY_TEST_KEYS.TASKS, []) || [];
  }

  saveTasks(tasks: Task[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.TASKS, tasks);
  }

  getDocuments(): Document[] {
    this.initWorkspace();
    return browserStorage.get<Document[]>(EMPTY_TEST_KEYS.DOCUMENTS, []) || [];
  }

  saveDocuments(documents: Document[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.DOCUMENTS, documents);
  }

  getSafety(): SafetyEvent[] {
    this.initWorkspace();
    return browserStorage.get<SafetyEvent[]>(EMPTY_TEST_KEYS.SAFETY, []) || [];
  }

  saveSafety(events: SafetyEvent[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.SAFETY, events);
  }

  getDeviations(): ProtocolDeviation[] {
    this.initWorkspace();
    return browserStorage.get<ProtocolDeviation[]>(EMPTY_TEST_KEYS.DEVIATIONS, []) || [];
  }

  saveDeviations(deviations: ProtocolDeviation[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.DEVIATIONS, deviations);
  }

  getNotifications(): Notification[] {
    this.initWorkspace();
    return browserStorage.get<Notification[]>(EMPTY_TEST_KEYS.NOTIFICATIONS, []) || [];
  }

  saveNotifications(notifications: Notification[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.NOTIFICATIONS, notifications);
  }

  getAuditHistory(): AuditLogEvent[] {
    this.initWorkspace();
    return browserStorage.get<AuditLogEvent[]>(EMPTY_TEST_KEYS.AUDIT, []) || [];
  }

  saveAuditHistory(events: AuditLogEvent[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.AUDIT, events);
  }

  logAuditEvent(event: Omit<AuditLogEvent, 'id' | 'timestamp'>): AuditLogEvent {
    const list = this.getAuditHistory();
    const newEvent: AuditLogEvent = {
      ...event,
      id: `AUD-EMPTY-${String(list.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newEvent);
    this.saveAuditHistory(list);
    return newEvent;
  }

  getUserPasswords(): Record<string, string> {
    this.initWorkspace();
    return browserStorage.get<Record<string, string>>(EMPTY_TEST_KEYS.PASSWORDS, {}) || {};
  }

  setUserPassword(email: string, password: string): void {
    const passwords = this.getUserPasswords();
    passwords[email.trim().toLowerCase()] = password;
    browserStorage.set(EMPTY_TEST_KEYS.PASSWORDS, passwords);
  }

  getOnboardingRequests(): ParticipantOnboardingRequest[] {
    this.initWorkspace();
    return browserStorage.get<ParticipantOnboardingRequest[]>(EMPTY_TEST_KEYS.ONBOARDING_REQUESTS, []) || [];
  }

  saveOnboardingRequests(requests: ParticipantOnboardingRequest[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.ONBOARDING_REQUESTS, requests);
  }

  getParticipantRequests(): ParticipantRequest[] {
    this.initWorkspace();
    return browserStorage.get<ParticipantRequest[]>(EMPTY_TEST_KEYS.PARTICIPANT_REQUESTS, []) || [];
  }

  saveParticipantRequests(requests: ParticipantRequest[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PARTICIPANT_REQUESTS, requests);
  }
}

export const emptyTestStore = new EmptyTestStore();
