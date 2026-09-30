/**
 * Assessment Service — Stage 3
 * 
 * Coordinates the digital assessment lifecycle:
 * Instrument definitions -> Version management -> Section/Item/Rule authoring ->
 * Validation engine integration -> Participant assignments -> Session execution ->
 * Deterministic branching evaluation -> Response capture -> Review & revision loops.
 * 
 * Enforces:
 * - Deterministic, non-diagnostic data collection (NO AI scoring, NO auto-diagnosis)
 * - Immutability of active/historical versions
 * - Validation before publication
 * - Comprehensive audit logging
 */

import { environmentService } from './environmentService';
import { auditService } from './auditService';
import { AssessmentValidationEngine } from './assessmentValidationEngine';
import {
  AssessmentBranchingEngine,
  VisibilityState,
  CompletionState,
} from './assessmentBranchingEngine';
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
  AssessmentValidationResult,
  AssessmentSessionStatus,
  AssessmentAssignmentStatus,
} from '../types';

export class AssessmentService {
  private get repo() {
    return environmentService.getAssessmentRepository();
  }

  // =========================================================================
  // INSTRUMENTS & CATALOG
  // =========================================================================

  async getInstruments(filter?: AssessmentInstrumentFilter): Promise<AssessmentInstrument[]> {
    return this.repo.getInstruments(filter);
  }

  async getInstrumentById(id: string): Promise<AssessmentInstrument | null> {
    return this.repo.getInstrumentById(id);
  }

  async createInstrument(
    input: CreateAssessmentInstrumentInput,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AssessmentInstrument> {
    const instrument = await this.repo.createInstrument(input);

    if (actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_INSTRUMENT',
        action: 'ASSESSMENT_INSTRUMENT_CREATED',
        metadata: {
          instrumentId: instrument.instrumentId,
          linkedStage2BInstrumentId: instrument.linkedStage2BInstrumentId,
          name: instrument.name,
          category: instrument.category,
          contentSourceType: instrument.contentSourceType,
          rightsStatus: instrument.rightsStatus,
        },
      });
    }

    return instrument;
  }

  async updateInstrument(
    id: string,
    updates: Partial<AssessmentInstrument>,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AssessmentInstrument | null> {
    const updated = await this.repo.updateInstrument(id, updates);

    if (updated && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_INSTRUMENT',
        action: 'ASSESSMENT_INSTRUMENT_UPDATED',
        metadata: {
          instrumentId: id,
          updates,
        },
      });
    }

    return updated;
  }

  // =========================================================================
  // VERSIONS & LIFECYCLE
  // =========================================================================

  async getVersions(instrumentId: string): Promise<AssessmentInstrumentVersion[]> {
    return this.repo.getInstrumentVersions(instrumentId);
  }

  async getVersionById(versionId: string): Promise<AssessmentInstrumentVersion | null> {
    return this.repo.getInstrumentVersionById(versionId);
  }

  async createVersion(
    input: CreateAssessmentVersionInput,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AssessmentInstrumentVersion> {
    const version = await this.repo.createInstrumentVersion(input);

    if (actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_VERSION',
        action: 'ASSESSMENT_VERSION_CREATED',
        metadata: {
          versionId: version.versionId,
          instrumentId: version.instrumentId,
          versionLabel: version.versionLabel,
        },
      });
    }

    return version;
  }

  /**
   * Validates complete instrument version structure against the validation engine.
   */
  async validateVersion(versionId: string): Promise<AssessmentValidationResult> {
    const version = await this.repo.getInstrumentVersionById(versionId);
    if (!version) {
      throw new Error(`Instrument version not found: ${versionId}`);
    }

    const sections = await this.repo.getSections(versionId);
    const items = await this.repo.getItems(versionId);
    const rules = await this.repo.getRules(versionId);

    return AssessmentValidationEngine.validateVersionContent(version, sections, items, rules);
  }

  /**
   * Publishes a draft version to ACTIVE status.
   * Enforces validation engine checks: publication is strictly blocked if errors are detected.
   */
  async publishVersion(
    versionId: string,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<{ version: AssessmentInstrumentVersion; validation: AssessmentValidationResult }> {
    const version = await this.repo.getInstrumentVersionById(versionId);
    if (!version) {
      throw new Error(`Assessment version not found: ${versionId}`);
    }

    if (version.status !== 'DRAFT') {
      throw new Error(`Cannot publish version with status ${version.status}. Only DRAFT versions can be published.`);
    }

    const sections = await this.repo.getSections(versionId);
    const items = await this.repo.getItems(versionId);
    const rules = await this.repo.getRules(versionId);

    const validation = AssessmentValidationEngine.validateVersionContent(version, sections, items, rules);
    if (!validation.isValid) {
      const errorSummary = validation.errors.map((e) => `[${e.code}] ${e.message}`).join('; ');
      throw new Error(`Cannot publish instrument version. Validation failed with ${validation.errors.length} error(s): ${errorSummary}`);
    }

    const updated = await this.repo.publishInstrumentVersion(versionId);
    if (!updated) {
      throw new Error(`Failed to publish version: ${versionId}`);
    }

    if (actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_VERSION',
        action: 'ASSESSMENT_VERSION_PUBLISHED',
        metadata: {
          versionId: updated.versionId,
          instrumentId: updated.instrumentId,
          versionLabel: updated.versionLabel,
          itemCount: items.length,
          sectionCount: sections.length,
          ruleCount: rules.length,
        },
      });
    }

    return { version: updated, validation };
  }

  async retireVersion(
    versionId: string,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AssessmentInstrumentVersion | null> {
    const updated = await this.repo.updateInstrumentVersion(versionId, {
      status: 'RETIRED',
    });

    if (updated && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_VERSION',
        action: 'ASSESSMENT_VERSION_RETIRED',
        metadata: {
          versionId,
          instrumentId: updated.instrumentId,
        },
      });
    }

    return updated;
  }

  // =========================================================================
  // SECTIONS
  // =========================================================================

  async getSections(versionId: string): Promise<AssessmentSection[]> {
    return this.repo.getSections(versionId);
  }

  async createSection(
    input: CreateAssessmentSectionInput,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AssessmentSection> {
    const section = await this.repo.createSection(input);

    if (actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_SECTION',
        action: 'ASSESSMENT_SECTION_CREATED',
        metadata: {
          sectionId: section.sectionId,
          instrumentVersionId: section.instrumentVersionId,
          title: section.title,
          sectionCode: section.sectionCode,
        },
      });
    }

    return section;
  }

  async updateSection(
    sectionId: string,
    updates: Partial<AssessmentSection>,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AssessmentSection | null> {
    const updated = await this.repo.updateSection(sectionId, updates);

    if (updated && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_SECTION',
        action: 'ASSESSMENT_SECTION_UPDATED',
        metadata: {
          sectionId,
          updates,
        },
      });
    }

    return updated;
  }

  async deleteSection(
    sectionId: string,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<boolean> {
    const success = await this.repo.deleteSection(sectionId);

    if (success && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_SECTION',
        action: 'ASSESSMENT_SECTION_DELETED',
        metadata: { sectionId },
      });
    }

    return success;
  }

  async reorderSections(
    versionId: string,
    orderedSectionIds: string[],
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AssessmentSection[]> {
    const reordered = await this.repo.reorderSections(versionId, orderedSectionIds);

    if (actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_SECTION',
        action: 'ASSESSMENT_SECTIONS_REORDERED',
        metadata: { versionId, orderedSectionIds },
      });
    }

    return reordered;
  }

  // =========================================================================
  // ITEMS
  // =========================================================================

  async getItems(versionId: string, sectionId?: string): Promise<AssessmentItem[]> {
    const items = await this.repo.getItems(versionId);
    if (sectionId) {
      return items.filter((it) => it.sectionId === sectionId);
    }
    return items;
  }

  async getItemById(itemId: string): Promise<AssessmentItem | null> {
    return this.repo.getItemById(itemId);
  }

  async createItem(
    input: CreateAssessmentItemInput,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AssessmentItem> {
    const item = await this.repo.createItem(input);

    if (actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_ITEM',
        action: 'ASSESSMENT_ITEM_CREATED',
        metadata: {
          itemId: item.itemId,
          instrumentVersionId: item.instrumentVersionId,
          sectionId: item.sectionId,
          itemCode: item.itemCode,
          itemType: item.itemType,
        },
      });
    }

    return item;
  }

  async updateItem(
    itemId: string,
    updates: Partial<AssessmentItem>,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AssessmentItem | null> {
    const updated = await this.repo.updateItem(itemId, updates);

    if (updated && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_ITEM',
        action: 'ASSESSMENT_ITEM_UPDATED',
        metadata: { itemId, updates },
      });
    }

    return updated;
  }

  async deleteItem(
    itemId: string,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<boolean> {
    const success = await this.repo.deleteItem(itemId);

    if (success && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_ITEM',
        action: 'ASSESSMENT_ITEM_DELETED',
        metadata: { itemId },
      });
    }

    return success;
  }

  async reorderItems(
    versionId: string,
    sectionId: string,
    orderedItemIds: string[],
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AssessmentItem[]> {
    const reordered = await this.repo.reorderItems(versionId, sectionId, orderedItemIds);

    if (actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_ITEM',
        action: 'ASSESSMENT_ITEMS_REORDERED',
        metadata: { versionId, sectionId, orderedItemIds },
      });
    }

    return reordered;
  }

  // =========================================================================
  // RULES & BRANCHING LOGIC
  // =========================================================================

  async getRules(versionId: string): Promise<AssessmentRule[]> {
    return this.repo.getRules(versionId);
  }

  async createRule(
    input: CreateAssessmentRuleInput,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AssessmentRule> {
    const rule = await this.repo.createRule(input);

    if (actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_RULE',
        action: 'ASSESSMENT_RULE_CREATED',
        metadata: {
          ruleId: rule.ruleId,
          instrumentVersionId: rule.instrumentVersionId,
          sourceItemId: rule.sourceItemId,
          targetItemId: rule.targetItemId,
          targetSectionId: rule.targetSectionId,
          action: rule.action,
        },
      });
    }

    return rule;
  }

  async updateRule(
    ruleId: string,
    updates: Partial<AssessmentRule>,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AssessmentRule | null> {
    const updated = await this.repo.updateRule(ruleId, updates);

    if (updated && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_RULE',
        action: 'ASSESSMENT_RULE_UPDATED',
        metadata: { ruleId, updates },
      });
    }

    return updated;
  }

  async deleteRule(
    ruleId: string,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<boolean> {
    const success = await this.repo.deleteRule(ruleId);

    if (success && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'ASSESSMENT_RULE',
        action: 'ASSESSMENT_RULE_DELETED',
        metadata: { ruleId },
      });
    }

    return success;
  }

  // =========================================================================
  // ASSIGNMENTS
  // =========================================================================

  async getAssignments(
    scope: { studyId: string; siteId: string },
    filter?: AssessmentAssignmentFilter
  ): Promise<AssessmentAssignment[]> {
    return this.repo.getAssignments(scope, filter);
  }

  async getAssignmentById(
    scope: { studyId: string; siteId: string },
    assignmentId: string
  ): Promise<AssessmentAssignment | null> {
    return this.repo.getAssignmentById(scope, assignmentId);
  }

  async createAssignment(
    scope: { studyId: string; siteId: string },
    input: CreateAssessmentAssignmentInput,
    actor: { id: string; name: string; role: string }
  ): Promise<AssessmentAssignment> {
    const assignment = await this.repo.createAssignment(scope, input, actor.id);

    await auditService.logEvent({
      actorUserId: actor.id,
      actorRole: actor.role,
      studyId: scope.studyId,
      siteId: scope.siteId,
      targetEntity: 'ASSESSMENT_ASSIGNMENT',
      action: 'ASSESSMENT_ASSIGNED',
      metadata: {
        assignmentId: assignment.assignmentId,
        participantId: assignment.participantId,
        instrumentId: assignment.instrumentId,
        instrumentVersionId: assignment.instrumentVersionId,
        assignedBy: actor.name,
      },
    });

    return assignment;
  }

  async updateAssignmentStatus(
    scope: { studyId: string; siteId: string },
    assignmentId: string,
    status: AssessmentAssignmentStatus,
    actor?: { id: string; name: string; role: string }
  ): Promise<AssessmentAssignment | null> {
    const updated = await this.repo.updateAssignmentStatus(scope, assignmentId, status);

    if (updated && actor) {
      await auditService.logEvent({
        actorUserId: actor.id,
        actorRole: actor.role,
        studyId: scope.studyId,
        siteId: scope.siteId,
        targetEntity: 'ASSESSMENT_ASSIGNMENT',
        action: `ASSESSMENT_ASSIGNMENT_${status}`,
        metadata: {
          assignmentId,
          newStatus: status,
        },
      });
    }

    return updated;
  }

  async cancelAssignment(
    scope: { studyId: string; siteId: string },
    assignmentId: string,
    reason: string,
    actor: { id: string; name: string; role: string }
  ): Promise<AssessmentAssignment | null> {
    const updated = await this.repo.updateAssignmentStatus(scope, assignmentId, 'CANCELLED');

    if (updated) {
      await auditService.logEvent({
        actorUserId: actor.id,
        actorRole: actor.role,
        studyId: scope.studyId,
        siteId: scope.siteId,
        targetEntity: 'ASSESSMENT_ASSIGNMENT',
        action: 'ASSESSMENT_ASSIGNMENT_CANCELLED',
        metadata: {
          assignmentId,
          reason,
        },
      });
    }

    return updated;
  }

  // =========================================================================
  // SESSIONS
  // =========================================================================

  async getSessions(
    scope: { studyId: string; siteId: string },
    filter?: AssessmentSessionFilter
  ): Promise<AssessmentSession[]> {
    return this.repo.getSessions(scope, filter);
  }

  async getSessionById(
    scope: { studyId: string; siteId: string },
    sessionId: string
  ): Promise<AssessmentSession | null> {
    return this.repo.getSessionById(scope, sessionId);
  }

  async getSessionByAssignmentId(
    scope: { studyId: string; siteId: string },
    assignmentId: string
  ): Promise<AssessmentSession | null> {
    return this.repo.getSessionByAssignmentId(scope, assignmentId);
  }

  async startSession(
    scope: { studyId: string; siteId: string },
    assignmentId: string,
    actor: { id: string; name: string; role: string }
  ): Promise<AssessmentSession> {
    const session = await this.repo.startSession(scope, assignmentId, actor.id);

    await auditService.logEvent({
      actorUserId: actor.id,
      actorRole: actor.role,
      studyId: scope.studyId,
      siteId: scope.siteId,
      targetEntity: 'ASSESSMENT_SESSION',
      action: 'ASSESSMENT_SESSION_CREATED',
      metadata: {
        sessionId: session.sessionId,
        assignmentId: session.assignmentId,
        participantId: session.participantId,
        instrumentId: session.instrumentId,
        instrumentVersionId: session.instrumentVersionId,
      },
    });

    return session;
  }

  async saveSessionProgress(
    scope: { studyId: string; siteId: string },
    sessionId: string,
    currentItemId?: string,
    percentage?: number
  ): Promise<AssessmentSession | null> {
    return this.repo.saveSessionProgress(scope, sessionId, currentItemId, percentage);
  }

  async updateSessionStatus(
    scope: { studyId: string; siteId: string },
    sessionId: string,
    status: AssessmentSessionStatus,
    actor: { id: string; name: string; role: string }
  ): Promise<AssessmentSession | null> {
    const updated = await this.repo.updateSessionStatus(scope, sessionId, status, actor.id);

    if (updated) {
      await auditService.logEvent({
        actorUserId: actor.id,
        actorRole: actor.role,
        studyId: scope.studyId,
        siteId: scope.siteId,
        targetEntity: 'ASSESSMENT_SESSION',
        action: `ASSESSMENT_SESSION_STATUS_${status}`,
        metadata: {
          sessionId,
          newStatus: status,
        },
      });
    }

    return updated;
  }

  /**
   * Submits an in-progress or revision-required session for Sub-I / PI review.
   */
  async submitSession(
    scope: { studyId: string; siteId: string },
    sessionId: string,
    actor: { id: string; name: string; role: string }
  ): Promise<AssessmentSession | null> {
    const session = await this.repo.getSessionById(scope, sessionId);
    if (!session) {
      throw new Error(`Assessment session not found: ${sessionId}`);
    }

    if (session.status !== 'IN_PROGRESS' && session.status !== 'REVISION_REQUIRED' && session.status !== 'DRAFT') {
      throw new Error(`Cannot submit session with status ${session.status}. Must be IN_PROGRESS, REVISION_REQUIRED, or DRAFT.`);
    }

    const updated = await this.repo.submitSession(scope, sessionId, actor.id);

    if (updated) {
      await auditService.logEvent({
        actorUserId: actor.id,
        actorRole: actor.role,
        studyId: scope.studyId,
        siteId: scope.siteId,
        targetEntity: 'ASSESSMENT_SESSION',
        action: 'ASSESSMENT_SESSION_SUBMITTED',
        metadata: {
          sessionId,
          assignmentId: session.assignmentId,
          participantId: session.participantId,
        },
      });
    }

    return updated;
  }

  // =========================================================================
  // RESPONSES
  // =========================================================================

  async getResponses(
    scope: { studyId: string; siteId: string },
    sessionId: string
  ): Promise<AssessmentResponse[]> {
    return this.repo.getResponses(scope, sessionId);
  }

  async saveResponse(
    scope: { studyId: string; siteId: string },
    input: SaveAssessmentResponseInput,
    recordedBy: { id: string; name: string; role: string }
  ): Promise<AssessmentResponse> {
    return this.repo.saveResponse(scope, input, recordedBy.id);
  }

  async saveBatchResponses(
    scope: { studyId: string; siteId: string },
    inputs: SaveAssessmentResponseInput[],
    recordedBy: { id: string; name: string; role: string }
  ): Promise<AssessmentResponse[]> {
    const responses = await this.repo.saveResponsesBatch(scope, inputs, recordedBy.id);
    return responses;
  }

  // =========================================================================
  // REVIEWS & REVISION
  // =========================================================================

  async getReviews(
    scope: { studyId: string; siteId: string },
    sessionId: string
  ): Promise<AssessmentReview[]> {
    return this.repo.getReviews(scope, sessionId);
  }

  async createReview(
    scope: { studyId: string; siteId: string },
    input: CreateAssessmentReviewInput,
    reviewerUser: { id: string; name: string; role: string }
  ): Promise<AssessmentReview> {
    const review = await this.repo.createReview(scope, input, reviewerUser);

    await auditService.logEvent({
      actorUserId: reviewerUser.id,
      actorRole: reviewerUser.role,
      studyId: scope.studyId,
      siteId: scope.siteId,
      targetEntity: 'ASSESSMENT_REVIEW',
      action: input.reviewStatus === 'APPROVED' ? 'ASSESSMENT_SESSION_APPROVED' : 'ASSESSMENT_REVISION_REQUESTED',
      metadata: {
        reviewId: review.reviewId,
        sessionId: review.sessionId,
        assignmentId: review.assignmentId,
        reviewStatus: review.reviewStatus,
        notes: review.notes,
        revisionReason: review.revisionReason,
      },
    });

    return review;
  }

  // =========================================================================
  // DYNAMIC BRANCHING & COMPLETION COMPUTATION
  // =========================================================================

  async evaluateSessionVisibility(
    versionId: string,
    responses: AssessmentResponse[]
  ): Promise<VisibilityState> {
    const items = await this.repo.getItems(versionId);
    const sections = await this.repo.getSections(versionId);
    const rules = await this.repo.getRules(versionId);

    const responsesMap: Record<string, AssessmentResponse> = {};
    for (const r of responses) {
      responsesMap[r.itemId] = r;
    }

    return AssessmentBranchingEngine.computeVisibility(items, sections, rules, responsesMap);
  }

  async calculateSessionProgress(
    versionId: string,
    responses: AssessmentResponse[]
  ): Promise<CompletionState> {
    const items = await this.repo.getItems(versionId);
    const sections = await this.repo.getSections(versionId);
    const rules = await this.repo.getRules(versionId);

    const responsesMap: Record<string, AssessmentResponse> = {};
    for (const r of responses) {
      responsesMap[r.itemId] = r;
    }

    return AssessmentBranchingEngine.evaluateCompletion(items, sections, rules, responsesMap);
  }
}

export const assessmentService = new AssessmentService();
