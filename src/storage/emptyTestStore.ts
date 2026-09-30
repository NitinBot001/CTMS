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
  AyurvedaAssessmentCategory,
  AyurvedaAssessmentInstrument,
  AyurvedaTerminologyEntry,
  ProtocolAyurvedaAssessment,
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
  PROTOCOLS: `${EMPTY_TEST_PREFIX}protocols`,
  PROTOCOL_VERSIONS: `${EMPTY_TEST_PREFIX}protocol_versions`,
  PROTOCOL_ELIGIBILITY: `${EMPTY_TEST_PREFIX}protocol_eligibility`,
  PROTOCOL_VISITS: `${EMPTY_TEST_PREFIX}protocol_visits`,
  PROTOCOL_ASSESSMENTS: `${EMPTY_TEST_PREFIX}protocol_assessments`,
  PROTOCOL_INVESTIGATIONS: `${EMPTY_TEST_PREFIX}protocol_investigations`,
  PROTOCOL_OUTCOMES: `${EMPTY_TEST_PREFIX}protocol_outcomes`,
  PROTOCOL_FORMS: `${EMPTY_TEST_PREFIX}protocol_forms`,
  PROTOCOL_CONSENT: `${EMPTY_TEST_PREFIX}protocol_consent`,
  PROTOCOL_SAFETY: `${EMPTY_TEST_PREFIX}protocol_safety`,
  PROTOCOL_DEVIATIONS: `${EMPTY_TEST_PREFIX}protocol_deviations`,
  PROTOCOL_MILESTONES: `${EMPTY_TEST_PREFIX}protocol_milestones`,
  AYURVEDA_CATEGORIES: `${EMPTY_TEST_PREFIX}ayurveda_categories`,
  AYURVEDA_INSTRUMENTS: `${EMPTY_TEST_PREFIX}ayurveda_instruments`,
  AYURVEDA_TERMINOLOGY: `${EMPTY_TEST_PREFIX}ayurveda_terminology`,
  PROTOCOL_AYURVEDA_ASSESSMENTS: `${EMPTY_TEST_PREFIX}protocol_ayurveda_assessments`,
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

export const EMPTY_PROTOCOL: Protocol = {
  id: 'PROTO-EMPTY-001',
  studyId: 'EMPTY-STUDY-001',
  name: 'AIIA Empty Test Clinical Protocol',
  shortTitle: 'Empty Test Protocol',
  protocolNumber: 'AIIA-PROTO-EMPTY-001',
  currentVersionId: 'VER-EMPTY-001-v1',
  status: 'ACTIVE',
  description: 'Clean synthetic workflow test protocol for clinical research operations.',
  sponsorName: 'AIIA Research Directorate',
  therapeuticArea: 'Ayurveda Clinical Research',
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
};

export const EMPTY_PROTOCOL_VERSION_V1: ProtocolVersion = {
  id: 'VER-EMPTY-001-v1',
  protocolId: 'PROTO-EMPTY-001',
  studyId: 'EMPTY-STUDY-001',
  versionNumber: '1.0',
  versionLabel: 'Version 1.0 (Initial Active)',
  status: 'ACTIVE',
  effectiveDate: '2026-09-01',
  approvalDate: '2026-09-01',
  changeSummary: 'Initial empty test study protocol configuration.',
  createdBy: 'Dr. Test PI',
  activatedBy: 'Dr. Test PI',
  activatedAt: '2026-09-01T00:00:00Z',
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
};

export const EMPTY_PROTOCOL_ELIGIBILITY: ProtocolEligibilityCriterion[] = [
  {
    id: 'CRIT-EMPTY-01',
    protocolVersionId: 'VER-EMPTY-001-v1',
    type: 'INCLUSION',
    criterionCode: 'INC-01',
    title: 'Adult participant aged 18 to 65 years',
    description: 'Participant must be willing and able to provide written informed consent.',
    displayOrder: 1,
    required: true,
    active: true,
  },
  {
    id: 'CRIT-EMPTY-02',
    protocolVersionId: 'VER-EMPTY-001-v1',
    type: 'EXCLUSION',
    criterionCode: 'EXC-01',
    title: 'Known hypersensitivity to investigational product',
    description: 'Any active severe medical illness confounding safety assessments.',
    displayOrder: 2,
    required: true,
    active: true,
  },
];

export const EMPTY_PROTOCOL_VISITS: ProtocolVisitDefinition[] = [
  {
    id: 'PV-EMPTY-01',
    studyId: 'EMPTY-STUDY-001',
    protocolVersionId: 'VER-EMPTY-001-v1',
    code: 'SCR',
    name: 'Screening Visit',
    sequence: 1,
    anchor: 'SCREENING_DATE',
    targetOffsetDays: 0,
    targetDay: 0,
    windowBeforeDays: 0,
    windowAfterDays: 0,
    required: true,
    visitType: 'SCREENING',
    requiredActivities: ['ICF', 'INC_EXC', 'VITALS'],
    description: 'Informed consent, eligibility screening, medical history.',
  },
  {
    id: 'PV-EMPTY-02',
    studyId: 'EMPTY-STUDY-001',
    protocolVersionId: 'VER-EMPTY-001-v1',
    code: 'DAY-01',
    name: 'Baseline & Randomization',
    sequence: 2,
    anchor: 'ENROLLMENT_DATE',
    targetOffsetDays: 0,
    targetDay: 0,
    windowBeforeDays: 0,
    windowAfterDays: 2,
    required: true,
    visitType: 'BASELINE',
    requiredActivities: ['VITALS', 'LAB', 'DISP'],
    description: 'Baseline vital signs, laboratory tests, initial dispensing.',
  },
  {
    id: 'PV-EMPTY-03',
    studyId: 'EMPTY-STUDY-001',
    protocolVersionId: 'VER-EMPTY-001-v1',
    code: 'WK-04',
    name: 'Week 4 Follow-up',
    sequence: 3,
    anchor: 'ENROLLMENT_DATE',
    targetOffsetDays: 28,
    targetDay: 28,
    windowBeforeDays: 3,
    windowAfterDays: 3,
    required: true,
    visitType: 'TREATMENT',
    requiredActivities: ['VITALS', 'AE_CHECK'],
    description: 'Mid-term safety evaluation, compliance check.',
  },
  {
    id: 'PV-EMPTY-04',
    studyId: 'EMPTY-STUDY-001',
    protocolVersionId: 'VER-EMPTY-001-v1',
    code: 'WK-12',
    name: 'Week 12 Closeout Visit',
    sequence: 4,
    anchor: 'ENROLLMENT_DATE',
    targetOffsetDays: 84,
    targetDay: 84,
    windowBeforeDays: 5,
    windowAfterDays: 5,
    required: true,
    visitType: 'END_OF_STUDY',
    requiredActivities: ['FINAL_EXAM', 'DRUG_RET'],
    description: 'Study completion procedures, end-of-study assessments.',
  },
];

export const EMPTY_PROTOCOL_ASSESSMENTS: ProtocolAssessmentDefinition[] = [
  {
    id: 'ASM-EMPTY-01',
    protocolVersionId: 'VER-EMPTY-001-v1',
    code: 'ASM-VITALS',
    name: 'Baseline Vitals & General Exam',
    category: 'VITALS',
    visitDefinitionId: 'PV-EMPTY-02',
    description: 'Measurement of heart rate, blood pressure, temperature, and BMI.',
    required: true,
    displayOrder: 1,
    status: 'ACTIVE',
    version: '1.0',
    participantVisible: false,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
];

export const EMPTY_PROTOCOL_INVESTIGATIONS: ProtocolInvestigationDefinition[] = [
  {
    id: 'INV-EMPTY-01',
    protocolVersionId: 'VER-EMPTY-001-v1',
    code: 'INV-LAB-CBC',
    name: 'Complete Blood Count (CBC)',
    category: 'LABORATORY',
    visitDefinitionId: 'PV-EMPTY-02',
    description: 'Hemoglobin, total leukocyte count, differential count, and platelet count.',
    required: true,
    displayOrder: 1,
    status: 'ACTIVE',
    participantVisible: false,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
];

export const EMPTY_PROTOCOL_OUTCOMES: ProtocolOutcomeDefinition[] = [
  {
    id: 'OUT-EMPTY-01',
    protocolVersionId: 'VER-EMPTY-001-v1',
    code: 'OUT-PRIMARY-01',
    name: 'Primary Symptom Reduction Score',
    description: 'Change in clinical symptom severity score from baseline to closeout.',
    outcomeType: 'PRIMARY',
    visitDefinitionId: 'PV-EMPTY-02',
    timepoint: 'Baseline & Closeout',
    required: true,
    displayOrder: 1,
    status: 'ACTIVE',
  },
];

export const EMPTY_PROTOCOL_FORMS: ProtocolFormDefinition[] = [
  {
    id: 'FORM-EMPTY-01',
    protocolVersionId: 'VER-EMPTY-001-v1',
    code: 'FORM-BASELINE-CRF',
    name: 'Baseline Clinical CRF',
    formType: 'VISIT',
    description: 'Case report form capturing baseline vital signs and eligibility confirmation.',
    applicableVisitDefinitionId: 'PV-EMPTY-02',
    required: true,
    displayOrder: 1,
    status: 'ACTIVE',
    participantVisible: false,
    dataDomain: 'CLINICAL',
    version: '1.0',
  },
];

export const EMPTY_PROTOCOL_CONSENT: ProtocolConsentRequirement[] = [
  {
    id: 'CNS-EMPTY-01',
    protocolVersionId: 'VER-EMPTY-001-v1',
    consentType: 'INFORMED_CONSENT',
    requiredBefore: 'SCREENING',
    required: true,
    versionReference: 'ICF-v1.0',
    participantVisible: true,
    description: 'Institutional Ethics Committee approved participant information sheet and consent form.',
  },
];

export const EMPTY_PROTOCOL_SAFETY: ProtocolSafetyRequirement[] = [
  {
    id: 'SFT-EMPTY-01',
    protocolVersionId: 'VER-EMPTY-001-v1',
    eventType: 'AE',
    required: true,
    reportingWindow: '24_HOURS',
    description: 'Adverse event documentation and medical causality assessment within 24 hours of occurrence.',
    active: true,
  },
];

export const EMPTY_PROTOCOL_DEVIATIONS: ProtocolDeviationRequirement[] = [
  {
    id: 'DEV-EMPTY-01',
    protocolVersionId: 'VER-EMPTY-001-v1',
    category: 'VISIT_WINDOW',
    description: 'Deviation logged if clinical visit occurs outside protocol-defined allowable window.',
    required: true,
    active: true,
  },
];

export const EMPTY_PROTOCOL_MILESTONES: ProtocolMilestone[] = [
  {
    id: 'MLS-EMPTY-01',
    protocolVersionId: 'VER-EMPTY-001-v1',
    type: 'ETHICS_APPROVAL',
    name: 'Institutional Ethics Committee Approval',
    status: 'ACHIEVED',
    required: true,
    description: 'Formal IEC approval certificate received for study protocol.',
  },
];

export const EMPTY_AYURVEDA_CATEGORIES: AyurvedaAssessmentCategory[] = [
  {
    id: 'AYU-CAT-EMPTY-01',
    code: 'PRAKRITI',
    name: 'Prakriti (Constitutional Assessment)',
    description: 'Assessment of psychosomatic constitution for trial research.',
    sourceAuthority: 'AIIA Empty Test Protocol',
    status: 'PROTOCOL_DEFINED',
    isActive: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
];

export const EMPTY_AYURVEDA_INSTRUMENTS: AyurvedaAssessmentInstrument[] = [
  {
    id: 'AYU-INST-EMPTY-01',
    code: 'AYU-EMPTY-PRAKRITI-001',
    name: 'AIIA Empty Test Prakriti Placeholder',
    category: 'PRAKRITI',
    description: 'Clinical instrument content not configured.',
    sourceAuthority: 'AIIA Research Directorate',
    sourceReference: 'Empty Test Workspace Placeholder',
    version: '1.0',
    validationStatus: 'PROTOCOL_DEFINED',
    usageStatus: 'ACTIVE',
    trainingRequired: false,
    languageSupport: ['en'],
    languageSupportStatus: 'NOT_SPECIFIED',
    scoringMethod: 'NONE',
    scoringStatus: 'NOT_CONFIGURED',
    contentStatus: 'METADATA_ONLY',
    isActive: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
];

export const EMPTY_PROTOCOL_AYURVEDA_ASSESSMENTS: ProtocolAyurvedaAssessment[] = [
  {
    id: 'AYU-ASSESS-EMPTY-01',
    protocolVersionId: 'VER-EMPTY-001-v1',
    assessmentCode: 'PRAK-EMPTY-BL',
    name: 'Baseline Prakriti Assessment (Placeholder)',
    category: 'PRAKRITI',
    instrumentId: 'AYU-INST-EMPTY-01',
    instrumentVersion: '1.0',
    visitDefinitionId: 'VIS-DEF-EMPTY-02',
    required: true,
    participantVisible: false,
    sourceReference: 'Empty Test Workspace Placeholder',
    validationStatus: 'PROTOCOL_DEFINED',
    contentStatus: 'METADATA_ONLY',
    terminologyCode: null,
    localConceptId: null,
    displayOrder: 1,
    status: 'ACTIVE',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
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
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOLS, [EMPTY_PROTOCOL]);
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_VERSIONS, [EMPTY_PROTOCOL_VERSION_V1]);
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_ELIGIBILITY, EMPTY_PROTOCOL_ELIGIBILITY);
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_VISITS, EMPTY_PROTOCOL_VISITS);
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_ASSESSMENTS, EMPTY_PROTOCOL_ASSESSMENTS);
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_INVESTIGATIONS, EMPTY_PROTOCOL_INVESTIGATIONS);
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_OUTCOMES, EMPTY_PROTOCOL_OUTCOMES);
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_FORMS, EMPTY_PROTOCOL_FORMS);
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_CONSENT, EMPTY_PROTOCOL_CONSENT);
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_SAFETY, EMPTY_PROTOCOL_SAFETY);
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_DEVIATIONS, EMPTY_PROTOCOL_DEVIATIONS);
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_MILESTONES, EMPTY_PROTOCOL_MILESTONES);
    browserStorage.set(EMPTY_TEST_KEYS.AYURVEDA_CATEGORIES, EMPTY_AYURVEDA_CATEGORIES);
    browserStorage.set(EMPTY_TEST_KEYS.AYURVEDA_INSTRUMENTS, EMPTY_AYURVEDA_INSTRUMENTS);
    browserStorage.set(EMPTY_TEST_KEYS.AYURVEDA_TERMINOLOGY, []);
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_AYURVEDA_ASSESSMENTS, EMPTY_PROTOCOL_AYURVEDA_ASSESSMENTS);

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

  // --- Protocol Domain Accessors ---

  getProtocols(): Protocol[] {
    this.initWorkspace();
    const stored = browserStorage.get<Protocol[]>(EMPTY_TEST_KEYS.PROTOCOLS);
    return stored !== null && stored !== undefined ? stored : [EMPTY_PROTOCOL];
  }

  saveProtocols(protocols: Protocol[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOLS, protocols);
  }

  getProtocolVersions(): ProtocolVersion[] {
    this.initWorkspace();
    const stored = browserStorage.get<ProtocolVersion[]>(EMPTY_TEST_KEYS.PROTOCOL_VERSIONS);
    return stored !== null && stored !== undefined ? stored : [EMPTY_PROTOCOL_VERSION_V1];
  }

  saveProtocolVersions(versions: ProtocolVersion[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_VERSIONS, versions);
  }

  getEligibilityCriteria(): ProtocolEligibilityCriterion[] {
    this.initWorkspace();
    const stored = browserStorage.get<ProtocolEligibilityCriterion[]>(EMPTY_TEST_KEYS.PROTOCOL_ELIGIBILITY);
    return stored !== null && stored !== undefined ? stored : structuredClone(EMPTY_PROTOCOL_ELIGIBILITY);
  }

  saveEligibilityCriteria(criteria: ProtocolEligibilityCriterion[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_ELIGIBILITY, criteria);
  }

  getProtocolVisits(): ProtocolVisitDefinition[] {
    this.initWorkspace();
    const stored = browserStorage.get<ProtocolVisitDefinition[]>(EMPTY_TEST_KEYS.PROTOCOL_VISITS);
    return stored !== null && stored !== undefined ? stored : structuredClone(EMPTY_PROTOCOL_VISITS);
  }

  saveProtocolVisits(visits: ProtocolVisitDefinition[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_VISITS, visits);
  }

  getAssessments(): ProtocolAssessmentDefinition[] {
    this.initWorkspace();
    const stored = browserStorage.get<ProtocolAssessmentDefinition[]>(EMPTY_TEST_KEYS.PROTOCOL_ASSESSMENTS);
    return stored !== null && stored !== undefined ? stored : structuredClone(EMPTY_PROTOCOL_ASSESSMENTS);
  }

  saveAssessments(assessments: ProtocolAssessmentDefinition[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_ASSESSMENTS, assessments);
  }

  getInvestigations(): ProtocolInvestigationDefinition[] {
    this.initWorkspace();
    const stored = browserStorage.get<ProtocolInvestigationDefinition[]>(EMPTY_TEST_KEYS.PROTOCOL_INVESTIGATIONS);
    return stored !== null && stored !== undefined ? stored : structuredClone(EMPTY_PROTOCOL_INVESTIGATIONS);
  }

  saveInvestigations(investigations: ProtocolInvestigationDefinition[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_INVESTIGATIONS, investigations);
  }

  getOutcomes(): ProtocolOutcomeDefinition[] {
    this.initWorkspace();
    const stored = browserStorage.get<ProtocolOutcomeDefinition[]>(EMPTY_TEST_KEYS.PROTOCOL_OUTCOMES);
    return stored !== null && stored !== undefined ? stored : structuredClone(EMPTY_PROTOCOL_OUTCOMES);
  }

  saveOutcomes(outcomes: ProtocolOutcomeDefinition[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_OUTCOMES, outcomes);
  }

  getForms(): ProtocolFormDefinition[] {
    this.initWorkspace();
    const stored = browserStorage.get<ProtocolFormDefinition[]>(EMPTY_TEST_KEYS.PROTOCOL_FORMS);
    return stored !== null && stored !== undefined ? stored : structuredClone(EMPTY_PROTOCOL_FORMS);
  }

  saveForms(forms: ProtocolFormDefinition[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_FORMS, forms);
  }

  getConsentRequirements(): ProtocolConsentRequirement[] {
    this.initWorkspace();
    const stored = browserStorage.get<ProtocolConsentRequirement[]>(EMPTY_TEST_KEYS.PROTOCOL_CONSENT);
    return stored !== null && stored !== undefined ? stored : structuredClone(EMPTY_PROTOCOL_CONSENT);
  }

  saveConsentRequirements(requirements: ProtocolConsentRequirement[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_CONSENT, requirements);
  }

  getSafetyRequirements(): ProtocolSafetyRequirement[] {
    this.initWorkspace();
    const stored = browserStorage.get<ProtocolSafetyRequirement[]>(EMPTY_TEST_KEYS.PROTOCOL_SAFETY);
    return stored !== null && stored !== undefined ? stored : structuredClone(EMPTY_PROTOCOL_SAFETY);
  }

  saveSafetyRequirements(requirements: ProtocolSafetyRequirement[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_SAFETY, requirements);
  }

  getDeviationRequirements(): ProtocolDeviationRequirement[] {
    this.initWorkspace();
    const stored = browserStorage.get<ProtocolDeviationRequirement[]>(EMPTY_TEST_KEYS.PROTOCOL_DEVIATIONS);
    return stored !== null && stored !== undefined ? stored : structuredClone(EMPTY_PROTOCOL_DEVIATIONS);
  }

  saveDeviationRequirements(requirements: ProtocolDeviationRequirement[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_DEVIATIONS, requirements);
  }

  getMilestones(): ProtocolMilestone[] {
    this.initWorkspace();
    const stored = browserStorage.get<ProtocolMilestone[]>(EMPTY_TEST_KEYS.PROTOCOL_MILESTONES);
    return stored !== null && stored !== undefined ? stored : structuredClone(EMPTY_PROTOCOL_MILESTONES);
  }

  saveMilestones(milestones: ProtocolMilestone[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_MILESTONES, milestones);
  }

  // --- Ayurveda Domain Accessors ---

  getAyurvedaCategories(): AyurvedaAssessmentCategory[] {
    this.initWorkspace();
    const stored = browserStorage.get<AyurvedaAssessmentCategory[]>(EMPTY_TEST_KEYS.AYURVEDA_CATEGORIES);
    return stored !== null && stored !== undefined ? stored : structuredClone(EMPTY_AYURVEDA_CATEGORIES);
  }

  saveAyurvedaCategories(categories: AyurvedaAssessmentCategory[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.AYURVEDA_CATEGORIES, categories);
  }

  getAyurvedaInstruments(): AyurvedaAssessmentInstrument[] {
    this.initWorkspace();
    const stored = browserStorage.get<AyurvedaAssessmentInstrument[]>(EMPTY_TEST_KEYS.AYURVEDA_INSTRUMENTS);
    return stored !== null && stored !== undefined ? stored : structuredClone(EMPTY_AYURVEDA_INSTRUMENTS);
  }

  saveAyurvedaInstruments(instruments: AyurvedaAssessmentInstrument[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.AYURVEDA_INSTRUMENTS, instruments);
  }

  getAyurvedaTerminology(): AyurvedaTerminologyEntry[] {
    this.initWorkspace();
    const stored = browserStorage.get<AyurvedaTerminologyEntry[]>(EMPTY_TEST_KEYS.AYURVEDA_TERMINOLOGY);
    return stored !== null && stored !== undefined ? stored : [];
  }

  saveAyurvedaTerminology(entries: AyurvedaTerminologyEntry[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.AYURVEDA_TERMINOLOGY, entries);
  }

  getProtocolAyurvedaAssessments(): ProtocolAyurvedaAssessment[] {
    this.initWorkspace();
    const stored = browserStorage.get<ProtocolAyurvedaAssessment[]>(EMPTY_TEST_KEYS.PROTOCOL_AYURVEDA_ASSESSMENTS);
    return stored !== null && stored !== undefined ? stored : structuredClone(EMPTY_PROTOCOL_AYURVEDA_ASSESSMENTS);
  }

  saveProtocolAyurvedaAssessments(assessments: ProtocolAyurvedaAssessment[]): void {
    browserStorage.set(EMPTY_TEST_KEYS.PROTOCOL_AYURVEDA_ASSESSMENTS, assessments);
  }
}

export const emptyTestStore = new EmptyTestStore();
