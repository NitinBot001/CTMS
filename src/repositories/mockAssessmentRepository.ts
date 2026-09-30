/**
 * Mock Assessment Repository — Stage 3
 * 
 * Implements IAssessmentRepository with MockDataStore persistence,
 * strict study/site/participant scoping, version immutability,
 * session lifecycle validation, and response immutability.
 */

import {
  IAssessmentRepository,
} from './interfaces';
import {
  AssessmentInstrument,
  AssessmentInstrumentVersion,
  AssessmentSection,
  AssessmentItem,
  AssessmentRule,
  AssessmentAssignment,
  AssessmentSession,
  AssessmentResponse,
  AssessmentReview,
  CreateAssessmentInstrumentInput,
  CreateAssessmentVersionInput,
  CreateAssessmentSectionInput,
  CreateAssessmentItemInput,
  CreateAssessmentRuleInput,
  CreateAssessmentAssignmentInput,
  SaveAssessmentResponseInput,
  CreateAssessmentReviewInput,
  AssessmentInstrumentFilter,
  AssessmentAssignmentFilter,
  AssessmentSessionFilter,
  AssessmentAssignmentStatus,
  AssessmentSessionStatus,
} from '../types';
import { mockDataStore } from '../storage/mockDataStore';

export class MockAssessmentRepository implements IAssessmentRepository {
  // --- HELPERS ---

  private assertVersionIsDraft(versionId: string): void {
    const versions = mockDataStore.getStage3Versions();
    const ver = versions.find((v) => v.versionId === versionId);
    if (!ver) {
      throw new Error(`Assessment instrument version not found: ${versionId}`);
    }
    if (ver.status !== 'DRAFT') {
      throw new Error(`Cannot modify non-draft version ${versionId}. Current status: ${ver.status}. Version is immutable.`);
    }
  }

  private validateSessionTransition(currentStatus: AssessmentSessionStatus, newStatus: AssessmentSessionStatus): boolean {
    if (currentStatus === newStatus) return true;

    const validTransitions: Record<AssessmentSessionStatus, AssessmentSessionStatus[]> = {
      DRAFT: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['SUBMITTED', 'CANCELLED'],
      SUBMITTED: ['UNDER_REVIEW', 'COMPLETED', 'REVISION_REQUIRED'],
      UNDER_REVIEW: ['COMPLETED', 'REVISION_REQUIRED'],
      REVISION_REQUIRED: ['IN_PROGRESS'],
      COMPLETED: [],
      CANCELLED: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  // --- INSTRUMENTS ---

  async getInstruments(filter?: AssessmentInstrumentFilter): Promise<AssessmentInstrument[]> {
    let list = mockDataStore.getStage3Instruments();

    if (filter) {
      if (filter.category) {
        list = list.filter((i) => i.category === filter.category);
      }
      if (filter.administrationMode) {
        list = list.filter((i) => i.administrationMode === filter.administrationMode);
      }
      if (filter.contentSourceType) {
        list = list.filter((i) => i.contentSourceType === filter.contentSourceType);
      }
      if (filter.rightsStatus) {
        list = list.filter((i) => i.rightsStatus === filter.rightsStatus);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter((i) => i.name.toLowerCase().includes(q) || i.instrumentId.toLowerCase().includes(q));
      }
    }

    return structuredClone(list);
  }

  async getInstrumentById(instrumentId: string): Promise<AssessmentInstrument | null> {
    const list = mockDataStore.getStage3Instruments();
    const item = list.find((i) => i.instrumentId === instrumentId);
    return item ? structuredClone(item) : null;
  }

  async createInstrument(input: CreateAssessmentInstrumentInput): Promise<AssessmentInstrument> {
    const list = mockDataStore.getStage3Instruments();
    const newId = `AYU-ASSESS-INST-${Date.now().toString(36).toUpperCase()}`;

    const newInst: AssessmentInstrument = {
      instrumentId: newId,
      localConceptId: input.localConceptId || null,
      linkedStage2BInstrumentId: input.linkedStage2BInstrumentId,
      category: input.category,
      name: input.name,
      description: input.description || '',
      administrationMode: input.administrationMode || 'STAFF_ASSESSOR',
      sourceAuthority: input.sourceAuthority || 'INSTITUTIONAL',
      sourceReference: input.sourceReference || 'Protocol-defined research tool',
      contentStatus: 'METADATA_ONLY',
      rightsStatus: input.rightsStatus || 'VERIFIED',
      contentSourceType: input.contentSourceType || 'SYNTHETIC_DEMO',
      scoringStatus: 'NOT_CONFIGURED',
      trainingRequired: input.trainingRequired ?? false,
      trainingProvider: input.trainingProvider,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.push(newInst);
    mockDataStore.saveStage3Instruments(list);
    return structuredClone(newInst);
  }

  async updateInstrument(instrumentId: string, updates: Partial<AssessmentInstrument>): Promise<AssessmentInstrument | null> {
    const list = mockDataStore.getStage3Instruments();
    const idx = list.findIndex((i) => i.instrumentId === instrumentId);
    if (idx === -1) return null;

    const updated = {
      ...list[idx],
      ...updates,
      instrumentId, // Immutable
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updated;
    mockDataStore.saveStage3Instruments(list);
    return structuredClone(updated);
  }

  // --- VERSIONS ---

  async getInstrumentVersions(instrumentId: string): Promise<AssessmentInstrumentVersion[]> {
    const list = mockDataStore.getStage3Versions();
    return structuredClone(list.filter((v) => v.instrumentId === instrumentId));
  }

  async getInstrumentVersionById(versionId: string): Promise<AssessmentInstrumentVersion | null> {
    const list = mockDataStore.getStage3Versions();
    const ver = list.find((v) => v.versionId === versionId);
    return ver ? structuredClone(ver) : null;
  }

  async createInstrumentVersion(input: CreateAssessmentVersionInput): Promise<AssessmentInstrumentVersion> {
    const list = mockDataStore.getStage3Versions();
    const newVersionId = `VER-${input.instrumentId}-${Date.now().toString(36).toUpperCase()}`;

    const newVer: AssessmentInstrumentVersion = {
      versionId: newVersionId,
      instrumentId: input.instrumentId,
      versionLabel: input.versionLabel,
      status: 'DRAFT',
      itemCount: 0,
      contentSource: input.contentSource || 'SYNTHETIC_DEMO',
      rightsStatus: input.rightsStatus || 'VERIFIED',
      immutableAfterActivation: false,
      licenseNote: input.licenseNote,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.push(newVer);
    mockDataStore.saveStage3Versions(list);
    return structuredClone(newVer);
  }

  async updateInstrumentVersion(versionId: string, updates: Partial<AssessmentInstrumentVersion>): Promise<AssessmentInstrumentVersion | null> {
    this.assertVersionIsDraft(versionId);
    const list = mockDataStore.getStage3Versions();
    const idx = list.findIndex((v) => v.versionId === versionId);
    if (idx === -1) return null;

    const updated: AssessmentInstrumentVersion = {
      ...list[idx],
      ...updates,
      versionId,
      instrumentId: list[idx].instrumentId,
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updated;
    mockDataStore.saveStage3Versions(list);
    return structuredClone(updated);
  }

  async publishInstrumentVersion(versionId: string): Promise<AssessmentInstrumentVersion | null> {
    const list = mockDataStore.getStage3Versions();
    const idx = list.findIndex((v) => v.versionId === versionId);
    if (idx === -1) return null;

    const current = list[idx];
    if (current.status !== 'DRAFT' && current.status !== 'IN_REVIEW' && current.status !== 'APPROVED') {
      throw new Error(`Cannot publish version ${versionId} in status ${current.status}. Must be DRAFT, IN_REVIEW, or APPROVED.`);
    }

    // Freeze into ACTIVE and immutable
    const published: AssessmentInstrumentVersion = {
      ...current,
      status: 'ACTIVE',
      immutableAfterActivation: true,
      effectiveFrom: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list[idx] = published;
    mockDataStore.saveStage3Versions(list);

    // Update instrument activeVersionId
    const instruments = mockDataStore.getStage3Instruments();
    const instIdx = instruments.findIndex((i) => i.instrumentId === current.instrumentId);
    if (instIdx !== -1) {
      instruments[instIdx] = {
        ...instruments[instIdx],
        activeVersionId: versionId,
        contentStatus: 'ITEMS_CONFIGURED',
        updatedAt: new Date().toISOString(),
      };
      mockDataStore.saveStage3Instruments(instruments);
    }

    return structuredClone(published);
  }

  // --- SECTIONS ---

  async getSections(versionId: string): Promise<AssessmentSection[]> {
    const list = mockDataStore.getStage3Sections();
    const filtered = list.filter((s) => s.instrumentVersionId === versionId);
    return structuredClone(filtered.sort((a, b) => a.order - b.order));
  }

  async getSectionById(sectionId: string): Promise<AssessmentSection | null> {
    const list = mockDataStore.getStage3Sections();
    const s = list.find((sec) => sec.sectionId === sectionId);
    return s ? structuredClone(s) : null;
  }

  async createSection(input: CreateAssessmentSectionInput): Promise<AssessmentSection> {
    this.assertVersionIsDraft(input.instrumentVersionId);
    const list = mockDataStore.getStage3Sections();
    const newId = `SEC-${Date.now().toString(36).toUpperCase()}`;

    const newSec: AssessmentSection = {
      sectionId: newId,
      instrumentVersionId: input.instrumentVersionId,
      sectionCode: input.sectionCode,
      title: input.title,
      description: input.description,
      order: input.order ?? (list.filter((s) => s.instrumentVersionId === input.instrumentVersionId).length + 1),
      required: input.required ?? true,
    };

    list.push(newSec);
    mockDataStore.saveStage3Sections(list);
    return structuredClone(newSec);
  }

  async updateSection(sectionId: string, updates: Partial<AssessmentSection>): Promise<AssessmentSection | null> {
    const list = mockDataStore.getStage3Sections();
    const idx = list.findIndex((s) => s.sectionId === sectionId);
    if (idx === -1) return null;

    this.assertVersionIsDraft(list[idx].instrumentVersionId);

    const updated = {
      ...list[idx],
      ...updates,
      sectionId,
      instrumentVersionId: list[idx].instrumentVersionId,
    };

    list[idx] = updated;
    mockDataStore.saveStage3Sections(list);
    return structuredClone(updated);
  }

  async deleteSection(sectionId: string): Promise<boolean> {
    const list = mockDataStore.getStage3Sections();
    const idx = list.findIndex((s) => s.sectionId === sectionId);
    if (idx === -1) return false;

    this.assertVersionIsDraft(list[idx].instrumentVersionId);

    // Also delete child items
    const items = mockDataStore.getStage3Items();
    const remainingItems = items.filter((it) => it.sectionId !== sectionId);
    mockDataStore.saveStage3Items(remainingItems);

    list.splice(idx, 1);
    mockDataStore.saveStage3Sections(list);
    return true;
  }

  async reorderSections(versionId: string, sectionIds: string[]): Promise<AssessmentSection[]> {
    this.assertVersionIsDraft(versionId);
    const list = mockDataStore.getStage3Sections();

    sectionIds.forEach((id, idx) => {
      const s = list.find((sec) => sec.sectionId === id && sec.instrumentVersionId === versionId);
      if (s) {
        s.order = idx + 1;
      }
    });

    mockDataStore.saveStage3Sections(list);
    return this.getSections(versionId);
  }

  // --- ITEMS ---

  async getItems(versionId: string): Promise<AssessmentItem[]> {
    const list = mockDataStore.getStage3Items();
    const filtered = list.filter((it) => it.instrumentVersionId === versionId);
    return structuredClone(filtered.sort((a, b) => a.order - b.order));
  }

  async getItemById(itemId: string): Promise<AssessmentItem | null> {
    const list = mockDataStore.getStage3Items();
    const item = list.find((it) => it.itemId === itemId);
    return item ? structuredClone(item) : null;
  }

  async createItem(input: CreateAssessmentItemInput): Promise<AssessmentItem> {
    this.assertVersionIsDraft(input.instrumentVersionId);
    const list = mockDataStore.getStage3Items();
    const newId = `ITEM-${Date.now().toString(36).toUpperCase()}`;

    const newItem: AssessmentItem = {
      itemId: newId,
      instrumentVersionId: input.instrumentVersionId,
      sectionId: input.sectionId,
      itemCode: input.itemCode,
      itemType: input.itemType,
      questionText: input.questionText,
      helpText: input.helpText,
      order: input.order ?? (list.filter((it) => it.sectionId === input.sectionId).length + 1),
      required: input.required ?? true,
      responseDefinition: input.responseDefinition,
      validationRules: input.validationRules,
      administrationMode: input.administrationMode || 'STAFF_AND_PARTICIPANT',
      provenance: input.provenance,
      contentSource: input.contentSource || 'SYNTHETIC_DEMO',
      active: true,
    };

    list.push(newItem);
    mockDataStore.saveStage3Items(list);

    // Update version itemCount
    const versions = mockDataStore.getStage3Versions();
    const vIdx = versions.findIndex((v) => v.versionId === input.instrumentVersionId);
    if (vIdx !== -1) {
      versions[vIdx].itemCount = list.filter((it) => it.instrumentVersionId === input.instrumentVersionId).length;
      mockDataStore.saveStage3Versions(versions);
    }

    return structuredClone(newItem);
  }

  async updateItem(itemId: string, updates: Partial<AssessmentItem>): Promise<AssessmentItem | null> {
    const list = mockDataStore.getStage3Items();
    const idx = list.findIndex((it) => it.itemId === itemId);
    if (idx === -1) return null;

    this.assertVersionIsDraft(list[idx].instrumentVersionId);

    const updated = {
      ...list[idx],
      ...updates,
      itemId,
      instrumentVersionId: list[idx].instrumentVersionId,
    };

    list[idx] = updated;
    mockDataStore.saveStage3Items(list);
    return structuredClone(updated);
  }

  async deleteItem(itemId: string): Promise<boolean> {
    const list = mockDataStore.getStage3Items();
    const idx = list.findIndex((it) => it.itemId === itemId);
    if (idx === -1) return false;

    const versionId = list[idx].instrumentVersionId;
    this.assertVersionIsDraft(versionId);

    list.splice(idx, 1);
    mockDataStore.saveStage3Items(list);

    // Update version itemCount
    const versions = mockDataStore.getStage3Versions();
    const vIdx = versions.findIndex((v) => v.versionId === versionId);
    if (vIdx !== -1) {
      versions[vIdx].itemCount = list.filter((it) => it.instrumentVersionId === versionId).length;
      mockDataStore.saveStage3Versions(versions);
    }

    return true;
  }

  async reorderItems(versionId: string, sectionId: string, itemIds: string[]): Promise<AssessmentItem[]> {
    this.assertVersionIsDraft(versionId);
    const list = mockDataStore.getStage3Items();

    itemIds.forEach((id, idx) => {
      const it = list.find((item) => item.itemId === id && item.sectionId === sectionId);
      if (it) {
        it.order = idx + 1;
      }
    });

    mockDataStore.saveStage3Items(list);
    return this.getItems(versionId);
  }

  // --- RULES ---

  async getRules(versionId: string): Promise<AssessmentRule[]> {
    const list = mockDataStore.getStage3Rules();
    return structuredClone(list.filter((r) => r.instrumentVersionId === versionId));
  }

  async getRuleById(ruleId: string): Promise<AssessmentRule | null> {
    const list = mockDataStore.getStage3Rules();
    const r = list.find((rule) => rule.ruleId === ruleId);
    return r ? structuredClone(r) : null;
  }

  async createRule(input: CreateAssessmentRuleInput): Promise<AssessmentRule> {
    this.assertVersionIsDraft(input.instrumentVersionId);
    const list = mockDataStore.getStage3Rules();
    const newId = `RULE-${Date.now().toString(36).toUpperCase()}`;

    const newRule: AssessmentRule = {
      ruleId: newId,
      instrumentVersionId: input.instrumentVersionId,
      sourceItemId: input.sourceItemId,
      operator: input.operator,
      expectedValue: input.expectedValue,
      action: input.action,
      targetItemId: input.targetItemId,
      targetSectionId: input.targetSectionId,
      priority: input.priority ?? 10,
      active: true,
    };

    list.push(newRule);
    mockDataStore.saveStage3Rules(list);
    return structuredClone(newRule);
  }

  async updateRule(ruleId: string, updates: Partial<AssessmentRule>): Promise<AssessmentRule | null> {
    const list = mockDataStore.getStage3Rules();
    const idx = list.findIndex((r) => r.ruleId === ruleId);
    if (idx === -1) return null;

    this.assertVersionIsDraft(list[idx].instrumentVersionId);

    const updated = {
      ...list[idx],
      ...updates,
      ruleId,
      instrumentVersionId: list[idx].instrumentVersionId,
    };

    list[idx] = updated;
    mockDataStore.saveStage3Rules(list);
    return structuredClone(updated);
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const list = mockDataStore.getStage3Rules();
    const idx = list.findIndex((r) => r.ruleId === ruleId);
    if (idx === -1) return false;

    this.assertVersionIsDraft(list[idx].instrumentVersionId);

    list.splice(idx, 1);
    mockDataStore.saveStage3Rules(list);
    return true;
  }

  // --- ASSIGNMENTS ---

  async getAssignments(scope: { studyId: string; siteId: string }, filter?: AssessmentAssignmentFilter): Promise<AssessmentAssignment[]> {
    let list = mockDataStore.getStage3Assignments().filter(
      (a) => a.studyId === scope.studyId && a.siteId === scope.siteId
    );

    if (filter) {
      if (filter.participantId) {
        list = list.filter((a) => a.participantId === filter.participantId);
      }
      if (filter.instrumentId) {
        list = list.filter((a) => a.instrumentId === filter.instrumentId);
      }
      if (filter.status) {
        list = list.filter((a) => a.status === filter.status);
      }
      if (filter.assignedBy) {
        list = list.filter((a) => a.assignedBy === filter.assignedBy);
      }
    }

    return structuredClone(list);
  }

  async getAssignmentById(scope: { studyId: string; siteId: string }, assignmentId: string): Promise<AssessmentAssignment | null> {
    const list = mockDataStore.getStage3Assignments();
    const item = list.find((a) => a.assignmentId === assignmentId && a.studyId === scope.studyId && a.siteId === scope.siteId);
    return item ? structuredClone(item) : null;
  }

  async createAssignment(
    scope: { studyId: string; siteId: string },
    input: CreateAssessmentAssignmentInput,
    assignedBy: string
  ): Promise<AssessmentAssignment> {
    const instruments = mockDataStore.getStage3Instruments();
    const inst = instruments.find((i) => i.instrumentId === input.instrumentId);
    if (!inst) {
      throw new Error(`Assessment instrument not found: ${input.instrumentId}`);
    }

    const versionId = input.instrumentVersionId || inst.activeVersionId;
    if (!versionId) {
      throw new Error(`No active or specified version available for instrument ${input.instrumentId}`);
    }

    const list = mockDataStore.getStage3Assignments();
    const newId = `ASGN-${Date.now().toString(36).toUpperCase()}`;

    const newAssignment: AssessmentAssignment = {
      assignmentId: newId,
      studyId: scope.studyId,
      siteId: scope.siteId,
      participantId: input.participantId,
      instrumentId: input.instrumentId,
      instrumentVersionId: versionId,
      assignedBy,
      assignedAt: new Date().toISOString(),
      dueAt: input.dueAt,
      status: 'PENDING',
      notes: input.notes,
    };

    list.push(newAssignment);
    mockDataStore.saveStage3Assignments(list);
    return structuredClone(newAssignment);
  }

  async updateAssignmentStatus(
    scope: { studyId: string; siteId: string },
    assignmentId: string,
    status: AssessmentAssignmentStatus
  ): Promise<AssessmentAssignment | null> {
    const list = mockDataStore.getStage3Assignments();
    const idx = list.findIndex((a) => a.assignmentId === assignmentId && a.studyId === scope.studyId && a.siteId === scope.siteId);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      status,
    };

    mockDataStore.saveStage3Assignments(list);
    return structuredClone(list[idx]);
  }

  // --- SESSIONS ---

  async getSessions(scope: { studyId: string; siteId: string }, filter?: AssessmentSessionFilter): Promise<AssessmentSession[]> {
    let list = mockDataStore.getStage3Sessions().filter(
      (s) => s.studyId === scope.studyId && s.siteId === scope.siteId
    );

    if (filter) {
      if (filter.participantId) {
        list = list.filter((s) => s.participantId === filter.participantId);
      }
      if (filter.assignmentId) {
        list = list.filter((s) => s.assignmentId === filter.assignmentId);
      }
      if (filter.instrumentId) {
        list = list.filter((s) => s.instrumentId === filter.instrumentId);
      }
      if (filter.status) {
        list = list.filter((s) => s.status === filter.status);
      }
    }

    return structuredClone(list);
  }

  async getSessionById(scope: { studyId: string; siteId: string }, sessionId: string): Promise<AssessmentSession | null> {
    const list = mockDataStore.getStage3Sessions();
    const item = list.find((s) => s.sessionId === sessionId && s.studyId === scope.studyId && s.siteId === scope.siteId);
    return item ? structuredClone(item) : null;
  }

  async getSessionByAssignmentId(scope: { studyId: string; siteId: string }, assignmentId: string): Promise<AssessmentSession | null> {
    const list = mockDataStore.getStage3Sessions();
    const item = list.find((s) => s.assignmentId === assignmentId && s.studyId === scope.studyId && s.siteId === scope.siteId);
    return item ? structuredClone(item) : null;
  }

  async startSession(
    scope: { studyId: string; siteId: string },
    assignmentId: string,
    startedBy: string
  ): Promise<AssessmentSession> {
    const assignment = await this.getAssignmentById(scope, assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found in scope ${scope.studyId}/${scope.siteId}`);
    }

    const existing = await this.getSessionByAssignmentId(scope, assignmentId);
    if (existing) {
      return existing;
    }

    const list = mockDataStore.getStage3Sessions();
    const newSessionId = `SESS-${Date.now().toString(36).toUpperCase()}`;

    const newSession: AssessmentSession = {
      sessionId: newSessionId,
      assignmentId,
      studyId: scope.studyId,
      siteId: scope.siteId,
      participantId: assignment.participantId,
      instrumentId: assignment.instrumentId,
      instrumentVersionId: assignment.instrumentVersionId,
      startedAt: new Date().toISOString(),
      lastSavedAt: new Date().toISOString(),
      status: 'IN_PROGRESS',
      completionPercentage: 0,
      startedBy,
      isFinal: false,
    };

    list.push(newSession);
    mockDataStore.saveStage3Sessions(list);

    // Update assignment status to IN_PROGRESS
    await this.updateAssignmentStatus(scope, assignmentId, 'IN_PROGRESS');

    return structuredClone(newSession);
  }

  async saveSessionProgress(
    scope: { studyId: string; siteId: string },
    sessionId: string,
    currentItemId?: string,
    percentage?: number
  ): Promise<AssessmentSession | null> {
    const list = mockDataStore.getStage3Sessions();
    const idx = list.findIndex((s) => s.sessionId === sessionId && s.studyId === scope.studyId && s.siteId === scope.siteId);
    if (idx === -1) return null;

    const current = list[idx];
    if (current.status !== 'IN_PROGRESS' && current.status !== 'DRAFT') {
      throw new Error(`Cannot save progress for session ${sessionId} in status ${current.status}. Ordinary edits are locked.`);
    }

    list[idx] = {
      ...current,
      currentItemId: currentItemId || current.currentItemId,
      completionPercentage: percentage !== undefined ? percentage : current.completionPercentage,
      lastSavedAt: new Date().toISOString(),
    };

    mockDataStore.saveStage3Sessions(list);
    return structuredClone(list[idx]);
  }

  async submitSession(
    scope: { studyId: string; siteId: string },
    sessionId: string,
    submittedBy: string
  ): Promise<AssessmentSession | null> {
    const list = mockDataStore.getStage3Sessions();
    const idx = list.findIndex((s) => s.sessionId === sessionId && s.studyId === scope.studyId && s.siteId === scope.siteId);
    if (idx === -1) return null;

    const current = list[idx];
    if (!this.validateSessionTransition(current.status, 'SUBMITTED')) {
      throw new Error(`Illegal status transition from ${current.status} to SUBMITTED for session ${sessionId}`);
    }

    list[idx] = {
      ...current,
      status: 'SUBMITTED',
      completedAt: new Date().toISOString(),
      completedBy: submittedBy,
      completionPercentage: 100,
      lastSavedAt: new Date().toISOString(),
      isFinal: true,
    };

    mockDataStore.saveStage3Sessions(list);

    // Lock all responses for this session as final
    const responses = mockDataStore.getStage3Responses();
    responses.forEach((r) => {
      if (r.sessionId === sessionId) {
        r.isFinal = true;
      }
    });
    mockDataStore.saveStage3Responses(responses);

    // Update assignment status
    await this.updateAssignmentStatus(scope, current.assignmentId, 'SUBMITTED');

    return structuredClone(list[idx]);
  }

  async updateSessionStatus(
    scope: { studyId: string; siteId: string },
    sessionId: string,
    newStatus: AssessmentSessionStatus,
    _updatedBy: string
  ): Promise<AssessmentSession | null> {
    const list = mockDataStore.getStage3Sessions();
    const idx = list.findIndex((s) => s.sessionId === sessionId && s.studyId === scope.studyId && s.siteId === scope.siteId);
    if (idx === -1) return null;

    const current = list[idx];
    if (!this.validateSessionTransition(current.status, newStatus)) {
      throw new Error(`Illegal status transition from ${current.status} to ${newStatus} for session ${sessionId}`);
    }

    list[idx] = {
      ...current,
      status: newStatus,
      lastSavedAt: new Date().toISOString(),
    };

    mockDataStore.saveStage3Sessions(list);

    // Sync assignment status
    if (newStatus === 'COMPLETED') {
      await this.updateAssignmentStatus(scope, current.assignmentId, 'COMPLETED');
    } else if (newStatus === 'CANCELLED') {
      await this.updateAssignmentStatus(scope, current.assignmentId, 'CANCELLED');
    } else if (newStatus === 'IN_PROGRESS' || newStatus === 'REVISION_REQUIRED') {
      await this.updateAssignmentStatus(scope, current.assignmentId, 'IN_PROGRESS');
    }

    return structuredClone(list[idx]);
  }

  // --- RESPONSES ---

  async getResponses(scope: { studyId: string; siteId: string }, sessionId: string): Promise<AssessmentResponse[]> {
    const session = await this.getSessionById(scope, sessionId);
    if (!session) return [];

    const list = mockDataStore.getStage3Responses();
    return structuredClone(list.filter((r) => r.sessionId === sessionId));
  }

  async saveResponse(
    scope: { studyId: string; siteId: string },
    input: SaveAssessmentResponseInput,
    recordedBy: string
  ): Promise<AssessmentResponse> {
    const session = await this.getSessionById(scope, input.sessionId);
    if (!session) {
      throw new Error(`Session ${input.sessionId} not found in scope ${scope.studyId}/${scope.siteId}`);
    }

    if (session.status !== 'IN_PROGRESS' && session.status !== 'DRAFT') {
      throw new Error(`Cannot save response for session ${input.sessionId} in status ${session.status}. Responses are immutable.`);
    }

    const list = mockDataStore.getStage3Responses();
    const existingIdx = list.findIndex((r) => r.sessionId === input.sessionId && r.itemId === input.itemId);

    const newResp: AssessmentResponse = {
      responseId: existingIdx >= 0 ? list[existingIdx].responseId : `RESP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      sessionId: input.sessionId,
      assignmentId: input.assignmentId,
      studyId: scope.studyId,
      siteId: scope.siteId,
      participantId: input.participantId,
      instrumentId: input.instrumentId,
      instrumentVersionId: input.instrumentVersionId,
      itemId: input.itemId,
      valueType: input.valueType,
      value: input.value,
      selectedOptionIds: input.selectedOptionIds,
      textValue: input.textValue,
      numericValue: input.numericValue,
      booleanValue: input.booleanValue,
      dateValue: input.dateValue,
      bodyLocationValue: input.bodyLocationValue,
      recordedAt: new Date().toISOString(),
      recordedBy,
      isFinal: input.isFinal ?? false,
    };

    if (existingIdx >= 0) {
      list[existingIdx] = newResp;
    } else {
      list.push(newResp);
    }

    mockDataStore.saveStage3Responses(list);

    // Update lastSavedAt on session
    await this.saveSessionProgress(scope, input.sessionId);

    return structuredClone(newResp);
  }

  async saveResponsesBatch(
    scope: { studyId: string; siteId: string },
    inputs: SaveAssessmentResponseInput[],
    recordedBy: string
  ): Promise<AssessmentResponse[]> {
    const saved: AssessmentResponse[] = [];
    for (const inp of inputs) {
      const res = await this.saveResponse(scope, inp, recordedBy);
      saved.push(res);
    }
    return saved;
  }

  // --- REVIEWS ---

  async getReviews(scope: { studyId: string; siteId: string }, sessionId: string): Promise<AssessmentReview[]> {
    const session = await this.getSessionById(scope, sessionId);
    if (!session) return [];

    const list = mockDataStore.getStage3Reviews();
    return structuredClone(list.filter((r) => r.sessionId === sessionId));
  }

  async createReview(
    scope: { studyId: string; siteId: string },
    input: CreateAssessmentReviewInput,
    reviewerUser: { id: string; name: string; role: string }
  ): Promise<AssessmentReview> {
    const session = await this.getSessionById(scope, input.sessionId);
    if (!session) {
      throw new Error(`Session ${input.sessionId} not found in scope ${scope.studyId}/${scope.siteId}`);
    }

    const list = mockDataStore.getStage3Reviews();
    const newId = `REV-${Date.now().toString(36).toUpperCase()}`;

    const newReview: AssessmentReview = {
      reviewId: newId,
      sessionId: input.sessionId,
      assignmentId: input.assignmentId,
      studyId: scope.studyId,
      siteId: scope.siteId,
      reviewerUserId: reviewerUser.id,
      reviewerName: reviewerUser.name,
      reviewerRole: reviewerUser.role,
      reviewStatus: input.reviewStatus,
      reviewedAt: new Date().toISOString(),
      notes: input.notes,
      revisionReason: input.revisionReason,
    };

    list.push(newReview);
    mockDataStore.saveStage3Reviews(list);

    // Update session lifecycle
    if (input.reviewStatus === 'APPROVED') {
      await this.updateSessionStatus(scope, input.sessionId, 'COMPLETED', reviewerUser.id);
    } else if (input.reviewStatus === 'REVISION_REQUESTED') {
      if (!input.revisionReason || input.revisionReason.trim() === '') {
        throw new Error('Mandatory revision reason is required when requesting assessment revision.');
      }
      await this.updateSessionStatus(scope, input.sessionId, 'REVISION_REQUIRED', reviewerUser.id);
    }

    return structuredClone(newReview);
  }
}

export const mockAssessmentRepository = new MockAssessmentRepository();
