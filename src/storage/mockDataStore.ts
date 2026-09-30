/**
 * Mock Data Mutation Storage Manager
 * 
 * Manages mutable overlay data in Mock Mode under `aiia_ctms_mock_mutation_*`.
 * Preserves canonical seed fixtures in `src/data/mockData.ts` as immutable templates.
 * 
 * Strictly isolated from Empty Test Mode (`aiia_ctms_empty_test_*`).
 */
import { browserStorage } from './browserStorage';
import {
  User,
  UserRole,
  UserStatus,
  Participant,
  ParticipantVisit,
  ParticipantOnboardingRequest,
  ParticipantRequest,
  Protocol,
  ProtocolVersion,
  ProtocolEligibilityCriterion,
  ProtocolVisitDefinition,
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
  AssessmentInstrument,
  AssessmentInstrumentVersion,
  AssessmentSection,
  AssessmentItem,
  AssessmentRule,
  AssessmentAssignment,
  AssessmentSession,
  AssessmentResponse,
  AssessmentReview,
} from '../types';
import { MOCK_USERS, MOCK_USER_ROLES } from '../data/mockData';
import {
  MOCK_PROTOCOLS,
  MOCK_PROTOCOL_VERSIONS,
  MOCK_PROTOCOL_ELIGIBILITY,
  MOCK_PROTOCOL_VISITS_STAGE2A,
  MOCK_PROTOCOL_ASSESSMENTS,
  MOCK_PROTOCOL_INVESTIGATIONS,
  MOCK_PROTOCOL_OUTCOMES,
  MOCK_PROTOCOL_FORMS,
  MOCK_PROTOCOL_CONSENT,
  MOCK_PROTOCOL_SAFETY,
  MOCK_PROTOCOL_DEVIATIONS,
  MOCK_PROTOCOL_MILESTONES,
} from '../data/mockProtocolSeed';
import {
  MOCK_AYURVEDA_CATEGORIES,
  MOCK_AYURVEDA_INSTRUMENTS,
  MOCK_AYURVEDA_TERMINOLOGY,
  MOCK_PROTOCOL_AYURVEDA_ASSESSMENTS,
} from '../data/mockAyurvedaSeed';
import {
  MOCK_STAGE3_INSTRUMENTS,
  MOCK_STAGE3_VERSIONS,
  MOCK_STAGE3_SECTIONS,
  MOCK_STAGE3_ITEMS,
  MOCK_STAGE3_RULES,
  MOCK_STAGE3_ASSIGNMENTS,
  MOCK_STAGE3_SESSIONS,
  MOCK_STAGE3_RESPONSES,
  MOCK_STAGE3_REVIEWS,
} from '../data/mockAssessmentSeed';

export const MOCK_MUTATION_PREFIX = 'aiia_ctms_mock_mutation_';

export const MOCK_MUTATION_KEYS = {
  USERS: `${MOCK_MUTATION_PREFIX}users`,
  USER_ROLES: `${MOCK_MUTATION_PREFIX}user_roles`,
  PASSWORDS: `${MOCK_MUTATION_PREFIX}passwords`,
  USER_STATUSES: `${MOCK_MUTATION_PREFIX}user_statuses`,
  PARTICIPANTS: `${MOCK_MUTATION_PREFIX}participants`,
  VISITS: `${MOCK_MUTATION_PREFIX}visits`,
  ONBOARDING_REQUESTS: `${MOCK_MUTATION_PREFIX}onboarding_requests`,
  PARTICIPANT_REQUESTS: `${MOCK_MUTATION_PREFIX}participant_requests`,
  PROTOCOLS: `${MOCK_MUTATION_PREFIX}protocols`,
  PROTOCOL_VERSIONS: `${MOCK_MUTATION_PREFIX}protocol_versions`,
  PROTOCOL_ELIGIBILITY: `${MOCK_MUTATION_PREFIX}protocol_eligibility`,
  PROTOCOL_VISITS: `${MOCK_MUTATION_PREFIX}protocol_visits`,
  PROTOCOL_ASSESSMENTS: `${MOCK_MUTATION_PREFIX}protocol_assessments`,
  PROTOCOL_INVESTIGATIONS: `${MOCK_MUTATION_PREFIX}protocol_investigations`,
  PROTOCOL_OUTCOMES: `${MOCK_MUTATION_PREFIX}protocol_outcomes`,
  PROTOCOL_FORMS: `${MOCK_MUTATION_PREFIX}protocol_forms`,
  PROTOCOL_CONSENT: `${MOCK_MUTATION_PREFIX}protocol_consent`,
  PROTOCOL_SAFETY: `${MOCK_MUTATION_PREFIX}protocol_safety`,
  PROTOCOL_DEVIATIONS: `${MOCK_MUTATION_PREFIX}protocol_deviations`,
  PROTOCOL_MILESTONES: `${MOCK_MUTATION_PREFIX}protocol_milestones`,
  AYURVEDA_CATEGORIES: `${MOCK_MUTATION_PREFIX}ayurveda_categories`,
  AYURVEDA_INSTRUMENTS: `${MOCK_MUTATION_PREFIX}ayurveda_instruments`,
  AYURVEDA_TERMINOLOGY: `${MOCK_MUTATION_PREFIX}ayurveda_terminology`,
  PROTOCOL_AYURVEDA_ASSESSMENTS: `${MOCK_MUTATION_PREFIX}protocol_ayurveda_assessments`,
  STAGE3_INSTRUMENTS: `${MOCK_MUTATION_PREFIX}stage3_instruments`,
  STAGE3_VERSIONS: `${MOCK_MUTATION_PREFIX}stage3_versions`,
  STAGE3_SECTIONS: `${MOCK_MUTATION_PREFIX}stage3_sections`,
  STAGE3_ITEMS: `${MOCK_MUTATION_PREFIX}stage3_items`,
  STAGE3_RULES: `${MOCK_MUTATION_PREFIX}stage3_rules`,
  STAGE3_ASSIGNMENTS: `${MOCK_MUTATION_PREFIX}stage3_assignments`,
  STAGE3_SESSIONS: `${MOCK_MUTATION_PREFIX}stage3_sessions`,
  STAGE3_RESPONSES: `${MOCK_MUTATION_PREFIX}stage3_responses`,
  STAGE3_REVIEWS: `${MOCK_MUTATION_PREFIX}stage3_reviews`,
};

export const MOCK_DEFAULT_TEMPORARY_PASSWORD = '128';

export class MockDataStore {
  /**
   * Retrieves locally added users in Mock Mode.
   */
  getAddedUsers(): User[] {
    return browserStorage.get<User[]>(MOCK_MUTATION_KEYS.USERS, []) || [];
  }

  saveAddedUsers(users: User[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.USERS, users);
  }

  /**
   * Adds a newly created user to Mock Mode mutations overlay.
   */
  addMockUser(user: User): void {
    const current = this.getAddedUsers();
    const filtered = current.filter(
      (u) => u.id !== user.id && u.email.toLowerCase() !== user.email.toLowerCase()
    );
    filtered.push(user);
    this.saveAddedUsers(filtered);
  }

  /**
   * Retrieves locally added UserRole assignments in Mock Mode.
   */
  getAddedUserRoles(): UserRole[] {
    return browserStorage.get<UserRole[]>(MOCK_MUTATION_KEYS.USER_ROLES, []) || [];
  }

  saveAddedUserRoles(userRoles: UserRole[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.USER_ROLES, userRoles);
  }

  addMockUserRole(userRole: UserRole): void {
    const current = this.getAddedUserRoles();
    const filtered = current.filter((ur) => ur.id !== userRole.id);
    filtered.push(userRole);
    this.saveAddedUserRoles(filtered);
  }

  /**
   * Status overrides for existing or added users (e.g. deactivated users).
   */
  getUserStatuses(): Record<string, UserStatus> {
    return (
      browserStorage.get<Record<string, UserStatus>>(MOCK_MUTATION_KEYS.USER_STATUSES, {}) || {}
    );
  }

  setUserStatus(userId: string, status: UserStatus): void {
    const statuses = this.getUserStatuses();
    statuses[userId] = status;
    browserStorage.set(MOCK_MUTATION_KEYS.USER_STATUSES, statuses);

    // Also update in added users if present
    const added = this.getAddedUsers();
    const target = added.find((u) => u.id === userId);
    if (target) {
      target.status = status;
      target.updatedAt = new Date().toISOString();
      this.saveAddedUsers(added);
    }
  }

  /**
   * Passwords for mock users (synthetic local demo credentials).
   */
  getUserPasswords(): Record<string, string> {
    return (
      browserStorage.get<Record<string, string>>(MOCK_MUTATION_KEYS.PASSWORDS, {}) || {}
    );
  }

  setUserPassword(email: string, password: string): void {
    const passwords = this.getUserPasswords();
    passwords[email.trim().toLowerCase()] = password;
    browserStorage.set(MOCK_MUTATION_KEYS.PASSWORDS, passwords);
  }

  getUserPassword(email: string): string {
    const passwords = this.getUserPasswords();
    return passwords[email.trim().toLowerCase()] || MOCK_DEFAULT_TEMPORARY_PASSWORD;
  }

  /**
   * Returns merged full list of Mock users:
   * Canonical MOCK_USERS (with status overrides applied) + locally added users.
   */
  getAllUsers(): User[] {
    const statuses = this.getUserStatuses();
    const canonical = MOCK_USERS.map((u) => {
      const copy = { ...u };
      if (statuses[u.id]) {
        copy.status = statuses[u.id];
      }
      return copy;
    });

    const added = this.getAddedUsers();
    return [...canonical, ...added];
  }

  /**
   * Returns merged full list of Mock UserRole assignments:
   * Canonical MOCK_USER_ROLES + locally added UserRole assignments.
   */
  getAllUserRoles(): UserRole[] {
    const canonical = MOCK_USER_ROLES.map((ur) => ({ ...ur }));
    const added = this.getAddedUserRoles();
    return [...canonical, ...added];
  }

  /**
   * Participants added or mutated in Mock Mode
   */
  getAddedParticipants(): Participant[] {
    return browserStorage.get<Participant[]>(MOCK_MUTATION_KEYS.PARTICIPANTS, []) || [];
  }

  saveAddedParticipants(participants: Participant[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PARTICIPANTS, participants);
  }

  addMockParticipant(participant: Participant): void {
    const list = this.getAddedParticipants();
    const filtered = list.filter((p) => p.id !== participant.id);
    filtered.push(participant);
    this.saveAddedParticipants(filtered);
  }

  updateMockParticipant(participant: Participant): void {
    const list = this.getAddedParticipants();
    const index = list.findIndex((p) => p.id === participant.id);
    if (index >= 0) {
      list[index] = participant;
    } else {
      list.push(participant);
    }
    this.saveAddedParticipants(list);
  }

  /**
   * Visits added or mutated in Mock Mode
   */
  getAddedVisits(): ParticipantVisit[] {
    return browserStorage.get<ParticipantVisit[]>(MOCK_MUTATION_KEYS.VISITS, []) || [];
  }

  saveAddedVisits(visits: ParticipantVisit[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.VISITS, visits);
  }

  addMockVisit(visit: ParticipantVisit): void {
    const list = this.getAddedVisits();
    const filtered = list.filter((v) => v.id !== visit.id);
    filtered.push(visit);
    this.saveAddedVisits(filtered);
  }

  updateMockVisit(visit: ParticipantVisit): void {
    const list = this.getAddedVisits();
    const index = list.findIndex((v) => v.id === visit.id);
    if (index >= 0) {
      list[index] = visit;
    } else {
      list.push(visit);
    }
    this.saveAddedVisits(list);
  }

  /**
   * Onboarding requests in Mock Mode
   */
  getAddedOnboardingRequests(): ParticipantOnboardingRequest[] {
    return (
      browserStorage.get<ParticipantOnboardingRequest[]>(
        MOCK_MUTATION_KEYS.ONBOARDING_REQUESTS,
        []
      ) || []
    );
  }

  saveAddedOnboardingRequests(requests: ParticipantOnboardingRequest[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.ONBOARDING_REQUESTS, requests);
  }

  addOnboardingRequest(req: ParticipantOnboardingRequest): void {
    const list = this.getAddedOnboardingRequests();
    const filtered = list.filter((r) => r.id !== req.id);
    filtered.push(req);
    this.saveAddedOnboardingRequests(filtered);
  }

  updateOnboardingRequest(req: ParticipantOnboardingRequest): void {
    const list = this.getAddedOnboardingRequests();
    const index = list.findIndex((r) => r.id === req.id);
    if (index >= 0) {
      list[index] = req;
    } else {
      list.push(req);
    }
    this.saveAddedOnboardingRequests(list);
  }

  /**
   * Participant requests in Mock Mode
   */
  getAddedParticipantRequests(): ParticipantRequest[] {
    return (
      browserStorage.get<ParticipantRequest[]>(
        MOCK_MUTATION_KEYS.PARTICIPANT_REQUESTS,
        []
      ) || []
    );
  }

  saveAddedParticipantRequests(requests: ParticipantRequest[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PARTICIPANT_REQUESTS, requests);
  }

  addParticipantRequest(req: ParticipantRequest): void {
    const list = this.getAddedParticipantRequests();
    const filtered = list.filter((r) => r.id !== req.id);
    filtered.push(req);
    this.saveAddedParticipantRequests(filtered);
  }

  updateParticipantRequest(req: ParticipantRequest): void {
    const list = this.getAddedParticipantRequests();
    const index = list.findIndex((r) => r.id === req.id);
    if (index >= 0) {
      list[index] = req;
    } else {
      list.push(req);
    }
    this.saveAddedParticipantRequests(list);
  }

  // --- Protocol Domain Accessors (Mock Mode) ---

  getProtocols(): Protocol[] {
    const stored = browserStorage.get<Protocol[]>(MOCK_MUTATION_KEYS.PROTOCOLS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_PROTOCOLS);
  }

  saveProtocols(protocols: Protocol[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PROTOCOLS, protocols);
  }

  getProtocolVersions(): ProtocolVersion[] {
    const stored = browserStorage.get<ProtocolVersion[]>(MOCK_MUTATION_KEYS.PROTOCOL_VERSIONS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_PROTOCOL_VERSIONS);
  }

  saveProtocolVersions(versions: ProtocolVersion[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PROTOCOL_VERSIONS, versions);
  }

  getEligibilityCriteria(): ProtocolEligibilityCriterion[] {
    const stored = browserStorage.get<ProtocolEligibilityCriterion[]>(MOCK_MUTATION_KEYS.PROTOCOL_ELIGIBILITY);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_PROTOCOL_ELIGIBILITY);
  }

  saveEligibilityCriteria(criteria: ProtocolEligibilityCriterion[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PROTOCOL_ELIGIBILITY, criteria);
  }

  getProtocolVisits(): ProtocolVisitDefinition[] {
    const stored = browserStorage.get<ProtocolVisitDefinition[]>(MOCK_MUTATION_KEYS.PROTOCOL_VISITS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_PROTOCOL_VISITS_STAGE2A);
  }

  saveProtocolVisits(visits: ProtocolVisitDefinition[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PROTOCOL_VISITS, visits);
  }

  getAssessments(): ProtocolAssessmentDefinition[] {
    const stored = browserStorage.get<ProtocolAssessmentDefinition[]>(MOCK_MUTATION_KEYS.PROTOCOL_ASSESSMENTS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_PROTOCOL_ASSESSMENTS);
  }

  saveAssessments(assessments: ProtocolAssessmentDefinition[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PROTOCOL_ASSESSMENTS, assessments);
  }

  getInvestigations(): ProtocolInvestigationDefinition[] {
    const stored = browserStorage.get<ProtocolInvestigationDefinition[]>(MOCK_MUTATION_KEYS.PROTOCOL_INVESTIGATIONS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_PROTOCOL_INVESTIGATIONS);
  }

  saveInvestigations(investigations: ProtocolInvestigationDefinition[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PROTOCOL_INVESTIGATIONS, investigations);
  }

  getOutcomes(): ProtocolOutcomeDefinition[] {
    const stored = browserStorage.get<ProtocolOutcomeDefinition[]>(MOCK_MUTATION_KEYS.PROTOCOL_OUTCOMES);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_PROTOCOL_OUTCOMES);
  }

  saveOutcomes(outcomes: ProtocolOutcomeDefinition[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PROTOCOL_OUTCOMES, outcomes);
  }

  getForms(): ProtocolFormDefinition[] {
    const stored = browserStorage.get<ProtocolFormDefinition[]>(MOCK_MUTATION_KEYS.PROTOCOL_FORMS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_PROTOCOL_FORMS);
  }

  saveForms(forms: ProtocolFormDefinition[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PROTOCOL_FORMS, forms);
  }

  getConsentRequirements(): ProtocolConsentRequirement[] {
    const stored = browserStorage.get<ProtocolConsentRequirement[]>(MOCK_MUTATION_KEYS.PROTOCOL_CONSENT);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_PROTOCOL_CONSENT);
  }

  saveConsentRequirements(requirements: ProtocolConsentRequirement[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PROTOCOL_CONSENT, requirements);
  }

  getSafetyRequirements(): ProtocolSafetyRequirement[] {
    const stored = browserStorage.get<ProtocolSafetyRequirement[]>(MOCK_MUTATION_KEYS.PROTOCOL_SAFETY);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_PROTOCOL_SAFETY);
  }

  saveSafetyRequirements(requirements: ProtocolSafetyRequirement[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PROTOCOL_SAFETY, requirements);
  }

  getDeviationRequirements(): ProtocolDeviationRequirement[] {
    const stored = browserStorage.get<ProtocolDeviationRequirement[]>(MOCK_MUTATION_KEYS.PROTOCOL_DEVIATIONS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_PROTOCOL_DEVIATIONS);
  }

  saveDeviationRequirements(requirements: ProtocolDeviationRequirement[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PROTOCOL_DEVIATIONS, requirements);
  }

  getMilestones(): ProtocolMilestone[] {
    const stored = browserStorage.get<ProtocolMilestone[]>(MOCK_MUTATION_KEYS.PROTOCOL_MILESTONES);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_PROTOCOL_MILESTONES);
  }

  saveMilestones(milestones: ProtocolMilestone[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PROTOCOL_MILESTONES, milestones);
  }

  // --- Ayurveda Domain Accessors ---

  getAyurvedaCategories(): AyurvedaAssessmentCategory[] {
    const stored = browserStorage.get<AyurvedaAssessmentCategory[]>(MOCK_MUTATION_KEYS.AYURVEDA_CATEGORIES);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_AYURVEDA_CATEGORIES);
  }

  saveAyurvedaCategories(categories: AyurvedaAssessmentCategory[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.AYURVEDA_CATEGORIES, categories);
  }

  getAyurvedaInstruments(): AyurvedaAssessmentInstrument[] {
    const stored = browserStorage.get<AyurvedaAssessmentInstrument[]>(MOCK_MUTATION_KEYS.AYURVEDA_INSTRUMENTS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_AYURVEDA_INSTRUMENTS);
  }

  saveAyurvedaInstruments(instruments: AyurvedaAssessmentInstrument[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.AYURVEDA_INSTRUMENTS, instruments);
  }

  getAyurvedaTerminology(): AyurvedaTerminologyEntry[] {
    const stored = browserStorage.get<AyurvedaTerminologyEntry[]>(MOCK_MUTATION_KEYS.AYURVEDA_TERMINOLOGY);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_AYURVEDA_TERMINOLOGY);
  }

  saveAyurvedaTerminology(entries: AyurvedaTerminologyEntry[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.AYURVEDA_TERMINOLOGY, entries);
  }

  getProtocolAyurvedaAssessments(): ProtocolAyurvedaAssessment[] {
    const stored = browserStorage.get<ProtocolAyurvedaAssessment[]>(MOCK_MUTATION_KEYS.PROTOCOL_AYURVEDA_ASSESSMENTS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_PROTOCOL_AYURVEDA_ASSESSMENTS);
  }

  saveProtocolAyurvedaAssessments(assessments: ProtocolAyurvedaAssessment[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.PROTOCOL_AYURVEDA_ASSESSMENTS, assessments);
  }

  // --- STAGE 3 ASSESSMENTS ---

  getStage3Instruments(): AssessmentInstrument[] {
    const stored = browserStorage.get<AssessmentInstrument[]>(MOCK_MUTATION_KEYS.STAGE3_INSTRUMENTS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_STAGE3_INSTRUMENTS);
  }

  saveStage3Instruments(instruments: AssessmentInstrument[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.STAGE3_INSTRUMENTS, instruments);
  }

  getStage3Versions(): AssessmentInstrumentVersion[] {
    const stored = browserStorage.get<AssessmentInstrumentVersion[]>(MOCK_MUTATION_KEYS.STAGE3_VERSIONS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_STAGE3_VERSIONS);
  }

  saveStage3Versions(versions: AssessmentInstrumentVersion[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.STAGE3_VERSIONS, versions);
  }

  getStage3Sections(): AssessmentSection[] {
    const stored = browserStorage.get<AssessmentSection[]>(MOCK_MUTATION_KEYS.STAGE3_SECTIONS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_STAGE3_SECTIONS);
  }

  saveStage3Sections(sections: AssessmentSection[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.STAGE3_SECTIONS, sections);
  }

  getStage3Items(): AssessmentItem[] {
    const stored = browserStorage.get<AssessmentItem[]>(MOCK_MUTATION_KEYS.STAGE3_ITEMS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_STAGE3_ITEMS);
  }

  saveStage3Items(items: AssessmentItem[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.STAGE3_ITEMS, items);
  }

  getStage3Rules(): AssessmentRule[] {
    const stored = browserStorage.get<AssessmentRule[]>(MOCK_MUTATION_KEYS.STAGE3_RULES);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_STAGE3_RULES);
  }

  saveStage3Rules(rules: AssessmentRule[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.STAGE3_RULES, rules);
  }

  getStage3Assignments(): AssessmentAssignment[] {
    const stored = browserStorage.get<AssessmentAssignment[]>(MOCK_MUTATION_KEYS.STAGE3_ASSIGNMENTS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_STAGE3_ASSIGNMENTS);
  }

  saveStage3Assignments(assignments: AssessmentAssignment[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.STAGE3_ASSIGNMENTS, assignments);
  }

  getStage3Sessions(): AssessmentSession[] {
    const stored = browserStorage.get<AssessmentSession[]>(MOCK_MUTATION_KEYS.STAGE3_SESSIONS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_STAGE3_SESSIONS);
  }

  saveStage3Sessions(sessions: AssessmentSession[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.STAGE3_SESSIONS, sessions);
  }

  getStage3Responses(): AssessmentResponse[] {
    const stored = browserStorage.get<AssessmentResponse[]>(MOCK_MUTATION_KEYS.STAGE3_RESPONSES);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_STAGE3_RESPONSES);
  }

  saveStage3Responses(responses: AssessmentResponse[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.STAGE3_RESPONSES, responses);
  }

  getStage3Reviews(): AssessmentReview[] {
    const stored = browserStorage.get<AssessmentReview[]>(MOCK_MUTATION_KEYS.STAGE3_REVIEWS);
    return stored !== null && stored !== undefined ? stored : structuredClone(MOCK_STAGE3_REVIEWS);
  }

  saveStage3Reviews(reviews: AssessmentReview[]): void {
    browserStorage.set(MOCK_MUTATION_KEYS.STAGE3_REVIEWS, reviews);
  }

  /**
   * Resets mock mutations to pure canonical seed fixtures.
   */
  resetWorkspace(): void {
    Object.values(MOCK_MUTATION_KEYS).forEach((key) => {
      browserStorage.remove(key);
    });
  }
}

export const mockDataStore = new MockDataStore();
