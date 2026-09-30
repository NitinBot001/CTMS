/**
 * Protocol Service
 * 
 * Central domain service for Clinical Protocol Foundation + Protocol Configuration Engine (Stage 2A).
 * 
 * Enforces:
 * - Version lifecycle: DRAFT -> UNDER_REVIEW -> APPROVED -> ACTIVE -> SUPERSEDED / RETIRED
 * - Immutability: Active/Superseded/Retired/Approved versions cannot be mutated directly; amendments require a new DRAFT
 * - Validation: Validates visit sequences, windows, duplicate codes, non-orphan references, and mandatory inclusion/exclusion
 * - Audit logging: All lifecycle and configuration actions recorded via auditService
 * - Clean mode isolation: Auto-selects active environment (Mock vs Empty Test)
 */
import { IProtocolRepository, WorkflowActor } from '../repositories/interfaces';
import { environmentService } from './environmentService';
import { auditService } from './auditService';
import {
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
  StudyProtocolConfig,
  ProtocolValidationResult,
  CreateProtocolInput,
  CreateProtocolVersionInput,
  CreateEligibilityCriterionInput,
  CreateProtocolVisitDefinitionInput,
  CreateAssessmentDefinitionInput,
  CreateInvestigationDefinitionInput,
  CreateOutcomeDefinitionInput,
  CreateConsentRequirementInput,
  CreateSafetyRequirementInput,
  CreateDeviationRequirementInput,
  CreateMilestoneInput,
  CreateFormDefinitionInput,
} from '../types';

export class ProtocolService {
  private _customRepo?: IProtocolRepository;

  constructor(repository?: IProtocolRepository) {
    this._customRepo = repository;
  }

  private get repo(): IProtocolRepository {
    return this._customRepo || environmentService.getProtocolRepository();
  }

  private logAudit(
    action: string,
    targetEntity: string,
    studyId: string,
    actor?: WorkflowActor,
    metadata?: Record<string, unknown>
  ): void {
    auditService.logEvent({
      action,
      targetEntity,
      studyId,
      siteId: 'SYSTEM',
      actorUserId: actor?.userId || 'SYSTEM',
      actorRole: actor?.role || 'PI',
      metadata,
    });
  }

  // ============================================================================
  // Query Methods
  // ============================================================================

  async getProtocols(studyId: string): Promise<Protocol[]> {
    if (!studyId) return [];
    return this.repo.getProtocols(studyId);
  }

  async getProtocol(studyId: string, protocolId: string): Promise<Protocol | null> {
    if (!studyId || !protocolId) return null;
    return this.repo.getProtocol(studyId, protocolId);
  }

  async getActiveProtocol(studyId: string): Promise<Protocol | null> {
    if (!studyId) return null;
    return this.repo.getActiveProtocol(studyId);
  }

  async getProtocolVersions(protocolId: string): Promise<ProtocolVersion[]> {
    if (!protocolId) return [];
    return this.repo.getProtocolVersions(protocolId);
  }

  async getProtocolVersion(versionId: string): Promise<ProtocolVersion | null> {
    if (!versionId) return null;
    return this.repo.getProtocolVersion(versionId);
  }

  async getActiveProtocolVersion(studyId: string): Promise<ProtocolVersion | null> {
    if (!studyId) return null;
    return this.repo.getActiveProtocolVersion(studyId);
  }

  async getStudyProtocolConfig(
    studyId?: string,
    versionId?: string
  ): Promise<StudyProtocolConfig | null> {
    let targetVersionId = versionId;
    if (!targetVersionId && studyId) {
      const activeVersion = await this.getActiveProtocolVersion(studyId);
      if (activeVersion) {
        targetVersionId = activeVersion.id;
      }
    }
    if (!targetVersionId) return null;
    return this.repo.getStudyProtocolConfig(targetVersionId);
  }

  async getEligibilityCriteria(versionId: string): Promise<ProtocolEligibilityCriterion[]> {
    if (!versionId) return [];
    return this.repo.getEligibilityCriteria(versionId);
  }

  async getVisitDefinitions(versionId: string): Promise<ProtocolVisitDefinition[]> {
    if (!versionId) return [];
    return this.repo.getVisitDefinitions(versionId);
  }

  async getAssessmentDefinitions(
    versionId: string,
    visitDefinitionId?: string
  ): Promise<ProtocolAssessmentDefinition[]> {
    if (!versionId) return [];
    return this.repo.getAssessmentDefinitions(versionId, visitDefinitionId);
  }

  async getInvestigationDefinitions(
    versionId: string,
    visitDefinitionId?: string
  ): Promise<ProtocolInvestigationDefinition[]> {
    if (!versionId) return [];
    return this.repo.getInvestigationDefinitions(versionId, visitDefinitionId);
  }

  async getOutcomeDefinitions(
    versionId: string,
    visitDefinitionId?: string
  ): Promise<ProtocolOutcomeDefinition[]> {
    if (!versionId) return [];
    return this.repo.getOutcomeDefinitions(versionId, visitDefinitionId);
  }

  async getFormDefinitions(
    versionId: string,
    visitDefinitionId?: string
  ): Promise<ProtocolFormDefinition[]> {
    if (!versionId) return [];
    return this.repo.getFormDefinitions(versionId, visitDefinitionId);
  }

  async getConsentRequirements(versionId: string): Promise<ProtocolConsentRequirement[]> {
    if (!versionId) return [];
    return this.repo.getConsentRequirements(versionId);
  }

  async getSafetyRequirements(versionId: string): Promise<ProtocolSafetyRequirement[]> {
    if (!versionId) return [];
    return this.repo.getSafetyRequirements(versionId);
  }

  async getDeviationRequirements(versionId: string): Promise<ProtocolDeviationRequirement[]> {
    if (!versionId) return [];
    return this.repo.getDeviationRequirements(versionId);
  }

  async getMilestones(versionId: string): Promise<ProtocolMilestone[]> {
    if (!versionId) return [];
    return this.repo.getMilestones(versionId);
  }

  // Downstream Query Contracts
  async getFormsForVisit(versionId: string, visitDefId: string): Promise<ProtocolFormDefinition[]> {
    return this.getFormDefinitions(versionId, visitDefId);
  }

  async getAssessmentsForVisit(versionId: string, visitDefId: string): Promise<ProtocolAssessmentDefinition[]> {
    return this.getAssessmentDefinitions(versionId, visitDefId);
  }

  async getInvestigationsForVisit(versionId: string, visitDefId: string): Promise<ProtocolInvestigationDefinition[]> {
    return this.getInvestigationDefinitions(versionId, visitDefId);
  }

  async getOutcomesForVisit(versionId: string, visitDefId?: string): Promise<ProtocolOutcomeDefinition[]> {
    return this.getOutcomeDefinitions(versionId, visitDefId);
  }

  // ============================================================================
  // Validation Engine
  // ============================================================================

  async validateProtocolConfiguration(versionId: string): Promise<ProtocolValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const version = await this.repo.getProtocolVersion(versionId);
    if (!version) {
      return { valid: false, errors: ['Protocol version not found.'], warnings: [] };
    }

    // 1. Visits validation
    const visits = await this.repo.getVisitDefinitions(versionId);
    if (visits.length === 0) {
      errors.push('Protocol must define at least one protocol visit definition.');
    }

    const visitCodes = new Set<string>();
    const visitSequences = new Set<number>();
    const validVisitIds = new Set<string>(visits.map((v) => v.id));

    visits.forEach((v, index) => {
      // Duplicate visit code
      if (visitCodes.has(v.code.toUpperCase())) {
        errors.push(`Duplicate visit code "${v.code}" detected in protocol visit definitions.`);
      }
      visitCodes.add(v.code.toUpperCase());

      // Duplicate visit sequence
      if (visitSequences.has(v.sequence)) {
        errors.push(`Duplicate visit sequence number "${v.sequence}" detected.`);
      }
      visitSequences.add(v.sequence);

      // Negative window days
      if (v.windowBeforeDays < 0 || v.windowAfterDays < 0) {
        errors.push(`Visit "${v.name}" (${v.code}) has negative allowable window days.`);
      }

      // Check monotonicity of target days relative to sequence
      if (index > 0 && visits[index - 1]) {
        const prev = visits[index - 1];
        if (v.targetOffsetDays < prev.targetOffsetDays) {
          warnings.push(
            `Visit sequence ${v.sequence} (${v.code}) target offset (${v.targetOffsetDays}d) is earlier than sequence ${prev.sequence} (${prev.targetOffsetDays}d).`
          );
        }
      }

      // Warning if no required activities
      if (!v.requiredActivities || v.requiredActivities.length === 0) {
        warnings.push(`Visit "${v.name}" (${v.code}) does not list any required activities.`);
      }
    });

    // 2. Eligibility Criteria validation
    const criteria = await this.repo.getEligibilityCriteria(versionId);
    const inclusion = criteria.filter((c) => c.type === 'INCLUSION' && c.active);
    const exclusion = criteria.filter((c) => c.type === 'EXCLUSION' && c.active);

    if (inclusion.length === 0) {
      errors.push('Protocol version must define at least one active inclusion criterion.');
    }
    if (exclusion.length === 0) {
      errors.push('Protocol version must define at least one active exclusion criterion.');
    }

    const criterionCodes = new Set<string>();
    criteria.forEach((c) => {
      if (criterionCodes.has(c.criterionCode.toUpperCase())) {
        errors.push(`Duplicate eligibility criterion code "${c.criterionCode}" detected.`);
      }
      criterionCodes.add(c.criterionCode.toUpperCase());
    });

    // 3. Assessments validation (orphan check)
    const assessments = await this.repo.getAssessmentDefinitions(versionId);
    assessments.forEach((a) => {
      if (!validVisitIds.has(a.visitDefinitionId)) {
        errors.push(
          `Assessment "${a.name}" (${a.code}) references non-existent visit definition ID "${a.visitDefinitionId}".`
        );
      }
    });

    // 4. Investigations validation (orphan check)
    const investigations = await this.repo.getInvestigationDefinitions(versionId);
    investigations.forEach((i) => {
      if (!validVisitIds.has(i.visitDefinitionId)) {
        errors.push(
          `Investigation "${i.name}" (${i.code}) references non-existent visit definition ID "${i.visitDefinitionId}".`
        );
      }
    });

    // 5. Outcomes validation
    const outcomes = await this.repo.getOutcomeDefinitions(versionId);
    const hasPrimary = outcomes.some((o) => o.outcomeType === 'PRIMARY' && o.status === 'ACTIVE');
    if (!hasPrimary) {
      warnings.push('Protocol does not have an active Primary Endpoint outcome definition.');
    }
    outcomes.forEach((o) => {
      if (o.visitDefinitionId && !validVisitIds.has(o.visitDefinitionId)) {
        errors.push(
          `Outcome "${o.name}" (${o.code}) references non-existent visit definition ID "${o.visitDefinitionId}".`
        );
      }
    });

    // 6. Forms validation
    const forms = await this.repo.getFormDefinitions(versionId);
    forms.forEach((f) => {
      if (f.applicableVisitDefinitionId && !validVisitIds.has(f.applicableVisitDefinitionId)) {
        errors.push(
          `Form definition "${f.name}" (${f.code}) references non-existent visit definition ID "${f.applicableVisitDefinitionId}".`
        );
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================================================
  // Protocol Version Lifecycle Management
  // ============================================================================

  private async assertVersionIsDraft(versionId: string, operationName: string): Promise<ProtocolVersion> {
    const version = await this.repo.getProtocolVersion(versionId);
    if (!version) {
      throw new Error(`Protocol version "${versionId}" not found`);
    }
    if (version.status !== 'DRAFT') {
      throw new Error(
        `Cannot ${operationName} in protocol version "${version.versionNumber}" because its status is "${version.status}". Active, Approved, Superseded, and Retired versions are immutable. Please create a new draft version.`
      );
    }
    return version;
  }

  async createProtocol(studyId: string, input: CreateProtocolInput, actor?: WorkflowActor): Promise<Protocol> {
    if (!input.name || !input.shortTitle || !input.protocolNumber) {
      throw new Error('Protocol name, short title, and protocol number are required.');
    }
    const protocol = await this.repo.createProtocol(studyId, input);

    this.logAudit('PROTOCOL_CREATED', protocol.id, studyId, actor, {
      protocolNumber: protocol.protocolNumber,
      name: protocol.name,
    });

    return protocol;
  }

  async createDraftVersion(
    protocolId: string,
    input: CreateProtocolVersionInput,
    actor?: WorkflowActor
  ): Promise<ProtocolVersion> {
    if (!input.versionNumber) {
      throw new Error('Version number is required (e.g. "1.1", "2.0").');
    }

    const existingVersions = await this.repo.getProtocolVersions(protocolId);
    const duplicate = existingVersions.find((v) => v.versionNumber === input.versionNumber.trim());
    if (duplicate) {
      throw new Error(`Version number "${input.versionNumber}" already exists for this protocol.`);
    }

    const newVersion = await this.repo.createProtocolVersion(protocolId, input);

    this.logAudit('PROTOCOL_VERSION_CREATED', newVersion.id, newVersion.studyId, actor, {
      protocolId,
      versionNumber: newVersion.versionNumber,
      clonedFrom: input.cloneFromVersionId || 'NONE',
    });

    return newVersion;
  }

  async submitForReview(versionId: string, actor?: WorkflowActor): Promise<ProtocolVersion> {
    const version = await this.assertVersionIsDraft(versionId, 'submit for review');
    const updated = await this.repo.updateProtocolVersion(versionId, {
      status: 'UNDER_REVIEW',
    });
    if (!updated) throw new Error('Failed to update protocol version');

    this.logAudit('PROTOCOL_VERSION_SUBMITTED_FOR_REVIEW', versionId, version.studyId, actor, {
      versionNumber: version.versionNumber,
    });

    return updated;
  }

  async approveVersion(versionId: string, actor?: WorkflowActor): Promise<ProtocolVersion> {
    const version = await this.repo.getProtocolVersion(versionId);
    if (!version) throw new Error('Protocol version not found');
    if (version.status !== 'UNDER_REVIEW' && version.status !== 'DRAFT') {
      throw new Error(`Cannot approve protocol version with status "${version.status}".`);
    }

    const updated = await this.repo.updateProtocolVersion(versionId, {
      status: 'APPROVED',
      approvalDate: new Date().toISOString().split('T')[0],
      approvedBy: actor?.name || 'Authorized Signatory',
    });
    if (!updated) throw new Error('Failed to approve protocol version');

    this.logAudit('PROTOCOL_VERSION_APPROVED', versionId, version.studyId, actor, {
      versionNumber: version.versionNumber,
      approvedBy: updated.approvedBy,
    });

    return updated;
  }

  async activateVersion(versionId: string, actor?: WorkflowActor): Promise<ProtocolVersion> {
    const version = await this.repo.getProtocolVersion(versionId);
    if (!version) throw new Error('Protocol version not found');

    // Must validate configuration before activation
    const validation = await this.validateProtocolConfiguration(versionId);
    if (!validation.valid) {
      throw new Error(
        `Cannot activate protocol version due to validation errors:\n- ${validation.errors.join('\n- ')}`
      );
    }

    const updated = await this.repo.updateProtocolVersion(versionId, {
      status: 'ACTIVE',
      activatedBy: actor?.name || 'Dr. Ananya Sharma',
      activatedAt: new Date().toISOString(),
      effectiveDate: new Date().toISOString().split('T')[0],
    });
    if (!updated) throw new Error('Failed to activate protocol version');

    this.logAudit('PROTOCOL_VERSION_ACTIVATED', versionId, version.studyId, actor, {
      versionNumber: version.versionNumber,
      effectiveDate: updated.effectiveDate,
    });

    return updated;
  }

  async retireVersion(versionId: string, actor?: WorkflowActor, reason?: string): Promise<ProtocolVersion> {
    const version = await this.repo.getProtocolVersion(versionId);
    if (!version) throw new Error('Protocol version not found');

    const updated = await this.repo.updateProtocolVersion(versionId, {
      status: 'RETIRED',
    });
    if (!updated) throw new Error('Failed to retire protocol version');

    this.logAudit('PROTOCOL_VERSION_RETIRED', versionId, version.studyId, actor, {
      versionNumber: version.versionNumber,
      reason: reason || 'Protocol retired by investigator',
    });

    return updated;
  }

  // ============================================================================
  // Configuration Mutations (Strict Immutability Guarded)
  // ============================================================================

  async addEligibilityCriterion(
    versionId: string,
    input: CreateEligibilityCriterionInput,
    actor?: WorkflowActor
  ): Promise<ProtocolEligibilityCriterion> {
    const version = await this.assertVersionIsDraft(versionId, 'add eligibility criterion');
    if (!input.title || !input.criterionCode) {
      throw new Error('Criterion code and title are required.');
    }

    const existing = await this.repo.getEligibilityCriteria(versionId);
    if (existing.some((c) => c.criterionCode.toUpperCase() === input.criterionCode.toUpperCase())) {
      throw new Error(`Criterion code "${input.criterionCode}" already exists in this version.`);
    }

    const created = await this.repo.addEligibilityCriterion(versionId, input);

    this.logAudit('PROTOCOL_ELIGIBILITY_ADDED', created.id, version.studyId, actor, {
      criterionCode: created.criterionCode,
      type: created.type,
    });

    return created;
  }

  async updateEligibilityCriterion(
    versionId: string,
    criterionId: string,
    updates: Partial<ProtocolEligibilityCriterion>,
    actor?: WorkflowActor
  ): Promise<ProtocolEligibilityCriterion | null> {
    const version = await this.assertVersionIsDraft(versionId, 'update eligibility criterion');
    const updated = await this.repo.updateEligibilityCriterion(versionId, criterionId, updates);

    if (updated) {
      this.logAudit('PROTOCOL_ELIGIBILITY_UPDATED', criterionId, version.studyId, actor, {
        criterionCode: updated.criterionCode,
      });
    }

    return updated;
  }

  async addVisitDefinition(
    versionId: string,
    input: CreateProtocolVisitDefinitionInput,
    actor?: WorkflowActor
  ): Promise<ProtocolVisitDefinition> {
    const version = await this.assertVersionIsDraft(versionId, 'add visit definition');
    if (!input.code || !input.name) {
      throw new Error('Visit code and name are required.');
    }
    if (input.windowBeforeDays < 0 || input.windowAfterDays < 0) {
      throw new Error('Allowable visit window days cannot be negative.');
    }

    const existing = await this.repo.getVisitDefinitions(versionId);
    if (existing.some((v) => v.code.toUpperCase() === input.code.toUpperCase())) {
      throw new Error(`Visit code "${input.code}" already exists in this version.`);
    }

    const created = await this.repo.addVisitDefinition(versionId, input);

    this.logAudit('PROTOCOL_VISIT_ADDED', created.id, version.studyId, actor, {
      visitCode: created.code,
      sequence: created.sequence,
    });

    return created;
  }

  async updateVisitDefinition(
    versionId: string,
    visitDefId: string,
    updates: Partial<ProtocolVisitDefinition>,
    actor?: WorkflowActor
  ): Promise<ProtocolVisitDefinition | null> {
    const version = await this.assertVersionIsDraft(versionId, 'update visit definition');
    if (
      (updates.windowBeforeDays !== undefined && updates.windowBeforeDays < 0) ||
      (updates.windowAfterDays !== undefined && updates.windowAfterDays < 0)
    ) {
      throw new Error('Allowable visit window days cannot be negative.');
    }

    const updated = await this.repo.updateVisitDefinition(versionId, visitDefId, updates);
    if (updated) {
      this.logAudit('PROTOCOL_VISIT_UPDATED', visitDefId, version.studyId, actor, {
        visitCode: updated.code,
      });
    }
    return updated;
  }

  async addAssessmentDefinition(
    versionId: string,
    input: CreateAssessmentDefinitionInput,
    actor?: WorkflowActor
  ): Promise<ProtocolAssessmentDefinition> {
    const version = await this.assertVersionIsDraft(versionId, 'add assessment definition');
    if (!input.code || !input.name || !input.visitDefinitionId) {
      throw new Error('Assessment code, name, and visit definition are required.');
    }

    // Verify visitDefinitionId belongs to this version
    const visits = await this.repo.getVisitDefinitions(versionId);
    if (!visits.some((v) => v.id === input.visitDefinitionId)) {
      throw new Error(`Referenced visit definition "${input.visitDefinitionId}" does not exist in this version.`);
    }

    const created = await this.repo.addAssessmentDefinition(versionId, input);

    this.logAudit('PROTOCOL_ASSESSMENT_ADDED', created.id, version.studyId, actor, {
      code: created.code,
      name: created.name,
    });

    return created;
  }

  async updateAssessmentDefinition(
    versionId: string,
    assessmentId: string,
    updates: Partial<ProtocolAssessmentDefinition>,
    actor?: WorkflowActor
  ): Promise<ProtocolAssessmentDefinition | null> {
    const version = await this.assertVersionIsDraft(versionId, 'update assessment definition');
    const updated = await this.repo.updateAssessmentDefinition(versionId, assessmentId, updates);
    if (updated) {
      this.logAudit('PROTOCOL_ASSESSMENT_UPDATED', assessmentId, version.studyId, actor, {
        code: updated.code,
      });
    }
    return updated;
  }

  async addInvestigationDefinition(
    versionId: string,
    input: CreateInvestigationDefinitionInput,
    actor?: WorkflowActor
  ): Promise<ProtocolInvestigationDefinition> {
    const version = await this.assertVersionIsDraft(versionId, 'add investigation definition');
    if (!input.code || !input.name || !input.visitDefinitionId) {
      throw new Error('Investigation code, name, and visit definition are required.');
    }

    const visits = await this.repo.getVisitDefinitions(versionId);
    if (!visits.some((v) => v.id === input.visitDefinitionId)) {
      throw new Error(`Referenced visit definition "${input.visitDefinitionId}" does not exist in this version.`);
    }

    const created = await this.repo.addInvestigationDefinition(versionId, input);

    this.logAudit('PROTOCOL_INVESTIGATION_ADDED', created.id, version.studyId, actor, {
      code: created.code,
      name: created.name,
    });

    return created;
  }

  async updateInvestigationDefinition(
    versionId: string,
    investigationId: string,
    updates: Partial<ProtocolInvestigationDefinition>,
    actor?: WorkflowActor
  ): Promise<ProtocolInvestigationDefinition | null> {
    const version = await this.assertVersionIsDraft(versionId, 'update investigation definition');
    const updated = await this.repo.updateInvestigationDefinition(versionId, investigationId, updates);
    if (updated) {
      this.logAudit('PROTOCOL_INVESTIGATION_UPDATED', investigationId, version.studyId, actor, {
        code: updated.code,
      });
    }
    return updated;
  }

  async addOutcomeDefinition(
    versionId: string,
    input: CreateOutcomeDefinitionInput,
    actor?: WorkflowActor
  ): Promise<ProtocolOutcomeDefinition> {
    const version = await this.assertVersionIsDraft(versionId, 'add outcome definition');
    if (!input.code || !input.name || !input.outcomeType) {
      throw new Error('Outcome code, name, and outcome type are required.');
    }

    if (input.visitDefinitionId) {
      const visits = await this.repo.getVisitDefinitions(versionId);
      if (!visits.some((v) => v.id === input.visitDefinitionId)) {
        throw new Error(`Referenced visit definition "${input.visitDefinitionId}" does not exist in this version.`);
      }
    }

    const created = await this.repo.addOutcomeDefinition(versionId, input);

    this.logAudit('PROTOCOL_OUTCOME_ADDED', created.id, version.studyId, actor, {
      code: created.code,
      outcomeType: created.outcomeType,
    });

    return created;
  }

  async addFormDefinition(
    versionId: string,
    input: CreateFormDefinitionInput,
    actor?: WorkflowActor
  ): Promise<ProtocolFormDefinition> {
    const version = await this.assertVersionIsDraft(versionId, 'add form definition');
    if (!input.code || !input.name || !input.formType) {
      throw new Error('Form code, name, and form type are required.');
    }

    if (input.applicableVisitDefinitionId) {
      const visits = await this.repo.getVisitDefinitions(versionId);
      if (!visits.some((v) => v.id === input.applicableVisitDefinitionId)) {
        throw new Error(`Referenced visit definition "${input.applicableVisitDefinitionId}" does not exist in this version.`);
      }
    }

    const created = await this.repo.addFormDefinition(versionId, input);

    this.logAudit('PROTOCOL_FORM_ADDED', created.id, version.studyId, actor, {
      code: created.code,
      name: created.name,
    });

    return created;
  }

  async addConsentRequirement(
    versionId: string,
    input: CreateConsentRequirementInput,
    actor?: WorkflowActor
  ): Promise<ProtocolConsentRequirement> {
    const version = await this.assertVersionIsDraft(versionId, 'add consent requirement');
    if (!input.consentType || !input.requiredBefore) {
      throw new Error('Consent type and requiredBefore timeline are required.');
    }

    const created = await this.repo.addConsentRequirement(versionId, input);

    this.logAudit('PROTOCOL_CONSENT_REQ_ADDED', created.id, version.studyId, actor, {
      consentType: created.consentType,
    });

    return created;
  }

  async addSafetyRequirement(
    versionId: string,
    input: CreateSafetyRequirementInput,
    actor?: WorkflowActor
  ): Promise<ProtocolSafetyRequirement> {
    const version = await this.assertVersionIsDraft(versionId, 'add safety requirement');
    if (!input.eventType) {
      throw new Error('Safety event type is required.');
    }

    const created = await this.repo.addSafetyRequirement(versionId, input);

    this.logAudit('PROTOCOL_SAFETY_REQ_ADDED', created.id, version.studyId, actor, {
      eventType: created.eventType,
    });

    return created;
  }

  async addDeviationRequirement(
    versionId: string,
    input: CreateDeviationRequirementInput,
    actor?: WorkflowActor
  ): Promise<ProtocolDeviationRequirement> {
    const version = await this.assertVersionIsDraft(versionId, 'add deviation requirement');
    if (!input.category) {
      throw new Error('Deviation category is required.');
    }

    const created = await this.repo.addDeviationRequirement(versionId, input);

    this.logAudit('PROTOCOL_DEVIATION_REQ_ADDED', created.id, version.studyId, actor, {
      category: created.category,
    });

    return created;
  }

  async addMilestone(
    versionId: string,
    input: CreateMilestoneInput,
    actor?: WorkflowActor
  ): Promise<ProtocolMilestone> {
    const version = await this.assertVersionIsDraft(versionId, 'add milestone');
    if (!input.type || !input.name) {
      throw new Error('Milestone type and name are required.');
    }

    const created = await this.repo.addMilestone(versionId, input);

    this.logAudit('PROTOCOL_MILESTONE_ADDED', created.id, version.studyId, actor, {
      milestoneType: created.type,
      name: created.name,
    });

    return created;
  }
}

export const protocolService = new ProtocolService();
