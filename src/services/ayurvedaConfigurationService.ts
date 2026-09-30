/**
 * Ayurveda Clinical Configuration Service (Stage 2B)
 * 
 * Provides domain business logic, validation, audit trail integration, and
 * downstream query contracts for Ayurveda assessment categories, instruments,
 * terminology references, and protocol-linked assessments.
 * 
 * Enforces strict separation of:
 * Terminology != Assessment Category != Assessment Instrument != Assessment Item != Response != Score != Interpretation
 * 
 * Authoritative sources: NAMASTE Portal, WHO Ayurveda Terminologies, CCRAS AYUR Prakriti.
 */

import { environmentService } from './environmentService';
import { auditService } from './auditService';
import {
  AyurvedaAssessmentCategory,
  AyurvedaAssessmentInstrument,
  AyurvedaTerminologyEntry,
  ProtocolAyurvedaAssessment,
  CreateAyurvedaCategoryInput,
  CreateAyurvedaInstrumentInput,
  UpdateAyurvedaInstrumentInput,
  CreateAyurvedaTerminologyInput,
  CreateProtocolAyurvedaAssessmentInput,
  UpdateProtocolAyurvedaAssessmentInput,
  AyurvedaInstrumentFilter,
  AyurvedaTerminologyFilter,
  AyurvedaCategoryCode,
  ProtocolValidationResult,
} from '../types';

export class AyurvedaConfigurationService {
  private get repo() {
    return environmentService.getAyurvedaConfigurationRepository();
  }

  private get protocolRepo() {
    return environmentService.getProtocolRepository();
  }

  // --- Category Registry ---

  async listCategories(activeOnly: boolean = false): Promise<AyurvedaAssessmentCategory[]> {
    return this.repo.getCategories(activeOnly);
  }

  async getCategories(activeOnly: boolean = false): Promise<AyurvedaAssessmentCategory[]> {
    return this.listCategories(activeOnly);
  }

  async getCategory(code: AyurvedaCategoryCode): Promise<AyurvedaAssessmentCategory | null> {
    return this.repo.getCategoryByCode(code);
  }

  async getCategoryByCode(code: AyurvedaCategoryCode): Promise<AyurvedaAssessmentCategory | null> {
    return this.repo.getCategoryByCode(code);
  }

  async createCategory(
    input: CreateAyurvedaCategoryInput,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AyurvedaAssessmentCategory> {
    const category = await this.repo.createCategory(input);

    if (actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'AYURVEDA_CATEGORY',
        action: 'AYURVEDA_CATEGORY_CREATED',
        metadata: {
          categoryId: category.id,
          code: category.code,
          name: category.name,
          sourceAuthority: category.sourceAuthority,
        },
      });
    }

    return category;
  }

  async updateCategory(
    id: string,
    updates: Partial<AyurvedaAssessmentCategory>,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AyurvedaAssessmentCategory | null> {
    const category = await this.repo.updateCategory(id, updates);

    if (category && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'AYURVEDA_CATEGORY',
        action: 'AYURVEDA_CATEGORY_UPDATED',
        metadata: {
          categoryId: category.id,
          code: category.code,
          updates,
        },
      });
    }

    return category;
  }

  // --- Instrument Registry ---

  async listInstruments(filter?: AyurvedaInstrumentFilter): Promise<AyurvedaAssessmentInstrument[]> {
    return this.repo.getInstruments(filter);
  }

  async getInstrument(id: string): Promise<AyurvedaAssessmentInstrument | null> {
    return this.repo.getInstrumentById(id);
  }

  async getInstrumentByCode(code: string): Promise<AyurvedaAssessmentInstrument | null> {
    return this.repo.getInstrumentByCode(code);
  }

  async createInstrument(
    input: CreateAyurvedaInstrumentInput,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AyurvedaAssessmentInstrument> {
    // Validate that category exists
    const category = await this.repo.getCategoryByCode(input.category);
    if (!category) {
      throw new Error(`Ayurveda category "${input.category}" does not exist in registry.`);
    }

    const instrument = await this.repo.createInstrument(input);

    if (actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'AYURVEDA_INSTRUMENT',
        action: 'AYURVEDA_INSTRUMENT_CREATED',
        metadata: {
          instrumentId: instrument.id,
          code: instrument.code,
          name: instrument.name,
          category: instrument.category,
          sourceAuthority: instrument.sourceAuthority,
          trainingRequired: instrument.trainingRequired,
        },
      });
    }

    return instrument;
  }

  async updateInstrument(
    id: string,
    updates: UpdateAyurvedaInstrumentInput,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AyurvedaAssessmentInstrument | null> {
    const instrument = await this.repo.updateInstrument(id, updates);

    if (instrument && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'AYURVEDA_INSTRUMENT',
        action: 'AYURVEDA_INSTRUMENT_UPDATED',
        metadata: {
          instrumentId: instrument.id,
          code: instrument.code,
          updates,
        },
      });
    }

    return instrument;
  }

  async deprecateInstrument(
    id: string,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AyurvedaAssessmentInstrument | null> {
    const instrument = await this.repo.deprecateInstrument(id);

    if (instrument && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'AYURVEDA_INSTRUMENT',
        action: 'AYURVEDA_INSTRUMENT_DEPRECATED',
        metadata: {
          instrumentId: instrument.id,
          code: instrument.code,
          name: instrument.name,
        },
      });
    }

    return instrument;
  }

  // --- Terminology Registry ---

  async listTerminologyEntries(filter?: AyurvedaTerminologyFilter): Promise<AyurvedaTerminologyEntry[]> {
    return this.repo.getTerminologyEntries(filter);
  }

  async getTerminologyEntry(id: string): Promise<AyurvedaTerminologyEntry | null> {
    return this.repo.getTerminologyEntryById(id);
  }

  async createTerminologyEntry(
    input: CreateAyurvedaTerminologyInput,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AyurvedaTerminologyEntry> {
    const hasCode = input.code !== null && input.code !== undefined && input.code.trim() !== '';
    const formattedCode = hasCode ? input.code!.trim() : null;

    const verificationStatus =
      input.officialCodeVerification ||
      (formattedCode
        ? 'VERIFIED_SOURCE'
        : input.system === 'INSTITUTIONAL' || input.system === 'PROTOCOL_SPECIFIC'
        ? 'INTERNAL_ONLY'
        : 'PENDING_MAPPING');

    if ((verificationStatus === 'PENDING_MAPPING' || verificationStatus === 'INTERNAL_ONLY') && formattedCode !== null) {
      throw new Error(`Pending or internal terminology mappings cannot have an official terminology code.`);
    }

    if (verificationStatus === 'VERIFIED_SOURCE') {
      if (!formattedCode) {
        throw new Error(`Verified source terminology entries must specify an official terminology code.`);
      }
      if (!input.sourceAuthority || !input.sourceAuthority.trim() || !input.sourceReference || !input.sourceReference.trim()) {
        throw new Error(`Verified source terminology entries require sourceAuthority and sourceReference.`);
      }
    }

    const entry = await this.repo.createTerminologyEntry({
      ...input,
      code: formattedCode,
      officialCodeVerification: verificationStatus,
    });

    if (actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'AYURVEDA_TERMINOLOGY',
        action: 'AYURVEDA_TERMINOLOGY_REFERENCE_ADDED',
        metadata: {
          entryId: entry.id,
          system: entry.system,
          code: entry.code,
          localConceptId: entry.localConceptId,
          officialCodeVerification: entry.officialCodeVerification,
          display: entry.display,
          status: entry.status,
        },
      });
    }

    return entry;
  }

  async updateTerminologyEntry(
    id: string,
    updates: Partial<AyurvedaTerminologyEntry>,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<AyurvedaTerminologyEntry | null> {
    const entry = await this.repo.updateTerminologyEntry(id, updates);

    if (entry && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'AYURVEDA_TERMINOLOGY',
        action: 'AYURVEDA_TERMINOLOGY_MAPPING_UPDATED',
        metadata: {
          entryId: entry.id,
          system: entry.system,
          code: entry.code,
          localConceptId: entry.localConceptId,
          officialCodeVerification: entry.officialCodeVerification,
          updates,
        },
      });
    }

    return entry;
  }

  // --- Protocol-Linked Ayurveda Assessments ---

  private async assertVersionIsDraft(versionId: string): Promise<void> {
    const version = await this.protocolRepo.getProtocolVersion(versionId);
    if (!version) {
      throw new Error(`Protocol version with ID "${versionId}" not found.`);
    }
    if (version.status !== 'DRAFT') {
      throw new Error(
        `Cannot modify non-draft protocol version "${version.versionNumber}" because it is immutable in "${version.status}" status. Create a new draft amendment to make changes.`
      );
    }
  }

  async getProtocolAyurvedaAssessments(protocolVersionId: string): Promise<ProtocolAyurvedaAssessment[]> {
    return this.repo.getProtocolAyurvedaAssessments(protocolVersionId);
  }

  async getProtocolAyurvedaAssessment(id: string): Promise<ProtocolAyurvedaAssessment | null> {
    return this.repo.getProtocolAyurvedaAssessmentById(id);
  }

  async addProtocolAyurvedaAssessment(
    protocolVersionId: string,
    input: CreateProtocolAyurvedaAssessmentInput,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<ProtocolAyurvedaAssessment> {
    // 1. Immutability guard: must be DRAFT
    await this.assertVersionIsDraft(protocolVersionId);

    // 2. Validate instrument existence and category consistency
    let instrument = await this.repo.getInstrumentById(input.instrumentId);
    if (!instrument) {
      instrument = await this.repo.getInstrumentByCode(input.instrumentId);
    }
    if (!instrument) {
      throw new Error(`Referenced Ayurveda instrument "${input.instrumentId}" not found.`);
    }
    if (instrument.category !== input.category) {
      throw new Error(
        `Instrument category "${instrument.category}" does not match assessment category "${input.category}".`
      );
    }

    // 3. Prohibit linking deprecated instrument to newly authored protocol assessment
    if (instrument.usageStatus === 'DEPRECATED' || instrument.usageStatus === 'RETIRED') {
      throw new Error(
        `Cannot link ${instrument.usageStatus.toLowerCase()} instrument "${instrument.name}" to protocol version.`
      );
    }

    // 4. Validate visit definition belongs to this protocol version
    const visits = await this.protocolRepo.getVisitDefinitions(protocolVersionId);
    const visitExists = visits.some((v) => v.id === input.visitDefinitionId);
    if (!visitExists) {
      throw new Error(
        `Referenced visit definition "${input.visitDefinitionId}" not found in protocol version "${protocolVersionId}".`
      );
    }

    // 5. Create assessment
    const assessment = await this.repo.addProtocolAyurvedaAssessment(protocolVersionId, input);

    if (actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'PROTOCOL_AYURVEDA_ASSESSMENT',
        action: 'AYURVEDA_PROTOCOL_ASSESSMENT_CREATED',
        metadata: {
          assessmentId: assessment.id,
          protocolVersionId,
          assessmentCode: assessment.assessmentCode,
          name: assessment.name,
          category: assessment.category,
          instrumentId: assessment.instrumentId,
          visitDefinitionId: assessment.visitDefinitionId,
          required: assessment.required,
        },
      });
    }

    return assessment;
  }

  async updateProtocolAyurvedaAssessment(
    protocolVersionId: string,
    assessmentId: string,
    updates: UpdateProtocolAyurvedaAssessmentInput,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<ProtocolAyurvedaAssessment | null> {
    await this.assertVersionIsDraft(protocolVersionId);

    const assessment = await this.repo.updateProtocolAyurvedaAssessment(
      protocolVersionId,
      assessmentId,
      updates
    );

    if (assessment && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'PROTOCOL_AYURVEDA_ASSESSMENT',
        action: 'AYURVEDA_PROTOCOL_ASSESSMENT_UPDATED',
        metadata: {
          assessmentId: assessment.id,
          protocolVersionId,
          updates,
        },
      });
    }

    return assessment;
  }

  async deleteProtocolAyurvedaAssessment(
    protocolVersionId: string,
    assessmentId: string,
    actor?: { userId: string; role: string; studyId?: string; siteId?: string }
  ): Promise<boolean> {
    await this.assertVersionIsDraft(protocolVersionId);

    const deleted = await this.repo.deleteProtocolAyurvedaAssessment(protocolVersionId, assessmentId);

    if (deleted && actor) {
      await auditService.logEvent({
        actorUserId: actor.userId,
        actorRole: actor.role,
        studyId: actor.studyId || '',
        siteId: actor.siteId || '',
        targetEntity: 'PROTOCOL_AYURVEDA_ASSESSMENT',
        action: 'AYURVEDA_PROTOCOL_ASSESSMENT_DELETED',
        metadata: {
          assessmentId,
          protocolVersionId,
        },
      });
    }

    return deleted;
  }

  // --- Downstream Query Contracts ---

  async getAyurvedaAssessmentsForVisit(
    protocolVersionId: string,
    visitDefinitionId: string
  ): Promise<ProtocolAyurvedaAssessment[]> {
    if (!protocolVersionId || !visitDefinitionId) return [];
    return this.repo.getAyurvedaAssessmentsForVisit(protocolVersionId, visitDefinitionId);
  }

  async getAyurvedaAssessmentDefinition(
    protocolVersionId: string,
    assessmentId: string
  ): Promise<ProtocolAyurvedaAssessment | null> {
    const list = await this.repo.getProtocolAyurvedaAssessments(protocolVersionId);
    return list.find((a) => a.id === assessmentId) || null;
  }

  // --- Validation Engine ---

  async validateAyurvedaConfiguration(protocolVersionId: string): Promise<ProtocolValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const version = await this.protocolRepo.getProtocolVersion(protocolVersionId);
    if (!version) {
      errors.push(`Protocol version "${protocolVersionId}" does not exist.`);
      return { valid: false, errors, warnings };
    }

    const assessments = await this.repo.getProtocolAyurvedaAssessments(protocolVersionId);
    const instruments = await this.repo.getInstruments();
    const categories = await this.repo.getCategories();
    const visits = await this.protocolRepo.getVisitDefinitions(protocolVersionId);

    const validVisitIds = new Set(visits.map((v) => v.id));
    const seenCodes = new Set<string>();

    for (const assessment of assessments) {
      // 1. Check duplicate assessment code
      if (seenCodes.has(assessment.assessmentCode)) {
        errors.push(`Duplicate Ayurveda assessment code "${assessment.assessmentCode}".`);
      }
      seenCodes.add(assessment.assessmentCode);

      // 2. Check category existence
      const categoryExists = categories.some((c) => c.code === assessment.category);
      if (!categoryExists) {
        errors.push(`Ayurveda assessment "${assessment.name}" references invalid category "${assessment.category}".`);
      }

      // 3. Check instrument existence and category consistency
      const instrument = instruments.find((i) => i.id === assessment.instrumentId || i.code === assessment.instrumentId);
      if (!instrument) {
        errors.push(
          `Ayurveda assessment "${assessment.name}" references non-existent instrument "${assessment.instrumentId}".`
        );
      } else {
        if (instrument.category !== assessment.category) {
          errors.push(
            `Ayurveda assessment "${assessment.name}" has category "${assessment.category}" which mismatches instrument category "${instrument.category}".`
          );
        }

        // Deprecated check: emit warning so historical and cloned protocols retain linkage without blocking
        if (instrument.usageStatus === 'DEPRECATED' || instrument.usageStatus === 'RETIRED') {
          warnings.push(
            `Ayurveda assessment "${assessment.name}" references deprecated instrument "${instrument.name}".`
          );
        }

        // Content status warning: METADATA_ONLY does NOT block activation, but emits a warning (Section 68)
        if (instrument.contentStatus === 'METADATA_ONLY' || assessment.contentStatus === 'METADATA_ONLY') {
          warnings.push(
            `Assessment instrument "${instrument.name}" registered as METADATA_ONLY; Clinical instrument content / digital response not configured.`
          );
        }
      }

      // 4. Check visit definition linkage
      if (!validVisitIds.has(assessment.visitDefinitionId)) {
        errors.push(
          `Ayurveda assessment "${assessment.name}" references orphan visit definition "${assessment.visitDefinitionId}".`
        );
      }

      // 5. Terminology mapping warning if pending
      if (
        assessment.terminologyCode === null &&
        assessment.terminologySystem
      ) {
        warnings.push(
          `Terminology mapping is pending for assessment "${assessment.name}" under system "${assessment.terminologySystem}".`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export const ayurvedaConfigurationService = new AyurvedaConfigurationService();
