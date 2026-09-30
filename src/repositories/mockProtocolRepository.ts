import { IProtocolRepository } from './interfaces';
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
import { mockDataStore } from '../storage/mockDataStore';

export class MockProtocolRepository implements IProtocolRepository {
  async getProtocols(studyId: string): Promise<Protocol[]> {
    const protocols = mockDataStore.getProtocols();
    return protocols.filter((p) => p.studyId === studyId);
  }

  async getProtocol(studyId: string, protocolId: string): Promise<Protocol | null> {
    const protocols = mockDataStore.getProtocols();
    return protocols.find((p) => p.studyId === studyId && p.id === protocolId) || null;
  }

  async getActiveProtocol(studyId: string): Promise<Protocol | null> {
    const protocols = mockDataStore.getProtocols();
    return protocols.find((p) => p.studyId === studyId && p.status === 'ACTIVE') || null;
  }

  async getProtocolVersions(protocolId: string): Promise<ProtocolVersion[]> {
    const versions = mockDataStore.getProtocolVersions();
    return versions.filter((v) => v.protocolId === protocolId);
  }

  async getProtocolVersion(versionId: string): Promise<ProtocolVersion | null> {
    const versions = mockDataStore.getProtocolVersions();
    return versions.find((v) => v.id === versionId) || null;
  }

  async getActiveProtocolVersion(studyId: string): Promise<ProtocolVersion | null> {
    const versions = mockDataStore.getProtocolVersions();
    return versions.find((v) => v.studyId === studyId && v.status === 'ACTIVE') || null;
  }

  async getStudyProtocolConfig(versionId: string): Promise<StudyProtocolConfig | null> {
    const version = await this.getProtocolVersion(versionId);
    if (!version) return null;

    const protocol = (await this.getProtocols(version.studyId)).find((p) => p.id === version.protocolId);
    if (!protocol) return null;

    const eligibility = await this.getEligibilityCriteria(versionId);
    const visits = await this.getVisitDefinitions(versionId);
    const assessments = await this.getAssessmentDefinitions(versionId);
    const investigations = await this.getInvestigationDefinitions(versionId);
    const outcomes = await this.getOutcomeDefinitions(versionId);
    const consentRequirements = await this.getConsentRequirements(versionId);
    const safetyRequirements = await this.getSafetyRequirements(versionId);
    const deviationRequirements = await this.getDeviationRequirements(versionId);
    const milestones = await this.getMilestones(versionId);
    const forms = await this.getFormDefinitions(versionId);

    return {
      protocol,
      activeVersion: version,
      eligibility,
      visits,
      assessments,
      investigations,
      outcomes,
      consentRequirements,
      safetyRequirements,
      deviationRequirements,
      milestones,
      forms,
    };
  }

  async getEligibilityCriteria(versionId: string): Promise<ProtocolEligibilityCriterion[]> {
    const criteria = mockDataStore.getEligibilityCriteria();
    return criteria
      .filter((c) => c.protocolVersionId === versionId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getVisitDefinitions(versionId: string): Promise<ProtocolVisitDefinition[]> {
    const visits = mockDataStore.getProtocolVisits();
    return visits
      .filter((v) => v.protocolVersionId === versionId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  async getAssessmentDefinitions(
    versionId: string,
    visitDefinitionId?: string
  ): Promise<ProtocolAssessmentDefinition[]> {
    const assessments = mockDataStore.getAssessments();
    return assessments
      .filter((a) => a.protocolVersionId === versionId && (!visitDefinitionId || a.visitDefinitionId === visitDefinitionId))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getInvestigationDefinitions(
    versionId: string,
    visitDefinitionId?: string
  ): Promise<ProtocolInvestigationDefinition[]> {
    const investigations = mockDataStore.getInvestigations();
    return investigations
      .filter((i) => i.protocolVersionId === versionId && (!visitDefinitionId || i.visitDefinitionId === visitDefinitionId))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getOutcomeDefinitions(
    versionId: string,
    visitDefinitionId?: string
  ): Promise<ProtocolOutcomeDefinition[]> {
    const outcomes = mockDataStore.getOutcomes();
    return outcomes
      .filter((o) => o.protocolVersionId === versionId && (!visitDefinitionId || o.visitDefinitionId === visitDefinitionId))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getFormDefinitions(
    versionId: string,
    visitDefinitionId?: string
  ): Promise<ProtocolFormDefinition[]> {
    const forms = mockDataStore.getForms();
    return forms
      .filter((f) => f.protocolVersionId === versionId && (!visitDefinitionId || f.applicableVisitDefinitionId === visitDefinitionId))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getConsentRequirements(versionId: string): Promise<ProtocolConsentRequirement[]> {
    const reqs = mockDataStore.getConsentRequirements();
    return reqs.filter((r) => r.protocolVersionId === versionId);
  }

  async getSafetyRequirements(versionId: string): Promise<ProtocolSafetyRequirement[]> {
    const reqs = mockDataStore.getSafetyRequirements();
    return reqs.filter((r) => r.protocolVersionId === versionId);
  }

  async getDeviationRequirements(versionId: string): Promise<ProtocolDeviationRequirement[]> {
    const reqs = mockDataStore.getDeviationRequirements();
    return reqs.filter((r) => r.protocolVersionId === versionId);
  }

  async getMilestones(versionId: string): Promise<ProtocolMilestone[]> {
    const milestones = mockDataStore.getMilestones();
    return milestones.filter((m) => m.protocolVersionId === versionId);
  }

  // --- Mutations ---

  async createProtocol(studyId: string, input: CreateProtocolInput): Promise<Protocol> {
    const protocols = mockDataStore.getProtocols();
    const newProtocol: Protocol = {
      id: `PROTO-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      studyId,
      name: input.name,
      shortTitle: input.shortTitle,
      protocolNumber: input.protocolNumber,
      currentVersionId: '',
      status: 'ACTIVE',
      description: input.description,
      sponsorName: input.sponsorName,
      therapeuticArea: input.therapeuticArea,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    protocols.push(newProtocol);
    mockDataStore.saveProtocols(protocols);
    return newProtocol;
  }

  async createProtocolVersion(
    protocolId: string,
    input: CreateProtocolVersionInput
  ): Promise<ProtocolVersion> {
    const protocols = mockDataStore.getProtocols();
    const protocol = protocols.find((p) => p.id === protocolId);
    if (!protocol) {
      throw new Error(`Protocol with ID "${protocolId}" not found`);
    }

    const versions = mockDataStore.getProtocolVersions();
    const newVersionId = `VER-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newVersion: ProtocolVersion = {
      id: newVersionId,
      protocolId,
      studyId: protocol.studyId,
      versionNumber: input.versionNumber,
      versionLabel: input.versionLabel || `Version ${input.versionNumber}`,
      status: 'DRAFT',
      changeSummary: input.changeSummary,
      createdBy: 'Dr. Ananya Sharma',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    versions.push(newVersion);
    mockDataStore.saveProtocolVersions(versions);

    // If cloning from an existing version, copy all configuration entities
    if (input.cloneFromVersionId) {
      const srcVersionId = input.cloneFromVersionId;

      // 1. Eligibility
      const srcEligibility = mockDataStore.getEligibilityCriteria().filter((c) => c.protocolVersionId === srcVersionId);
      const allEligibility = mockDataStore.getEligibilityCriteria();
      srcEligibility.forEach((c) => {
        allEligibility.push({
          ...c,
          id: `CRIT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          protocolVersionId: newVersionId,
        });
      });
      mockDataStore.saveEligibilityCriteria(allEligibility);

      // 2. Visits & map old visitDefId to new visitDefId
      const visitIdMap: Record<string, string> = {};
      const srcVisits = mockDataStore.getProtocolVisits().filter((v) => v.protocolVersionId === srcVersionId);
      const allVisits = mockDataStore.getProtocolVisits();
      srcVisits.forEach((v) => {
        const newVId = `PV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        visitIdMap[v.id] = newVId;
        allVisits.push({
          ...v,
          id: newVId,
          protocolVersionId: newVersionId,
        });
      });
      mockDataStore.saveProtocolVisits(allVisits);

      // 3. Assessments
      const srcAssessments = mockDataStore.getAssessments().filter((a) => a.protocolVersionId === srcVersionId);
      const allAssessments = mockDataStore.getAssessments();
      srcAssessments.forEach((a) => {
        allAssessments.push({
          ...a,
          id: `ASM-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          protocolVersionId: newVersionId,
          visitDefinitionId: visitIdMap[a.visitDefinitionId] || a.visitDefinitionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
      mockDataStore.saveAssessments(allAssessments);

      // 4. Investigations
      const srcInvestigations = mockDataStore.getInvestigations().filter((i) => i.protocolVersionId === srcVersionId);
      const allInvestigations = mockDataStore.getInvestigations();
      srcInvestigations.forEach((i) => {
        allInvestigations.push({
          ...i,
          id: `INV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          protocolVersionId: newVersionId,
          visitDefinitionId: visitIdMap[i.visitDefinitionId] || i.visitDefinitionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
      mockDataStore.saveInvestigations(allInvestigations);

      // 5. Outcomes
      const srcOutcomes = mockDataStore.getOutcomes().filter((o) => o.protocolVersionId === srcVersionId);
      const allOutcomes = mockDataStore.getOutcomes();
      srcOutcomes.forEach((o) => {
        allOutcomes.push({
          ...o,
          id: `OUT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          protocolVersionId: newVersionId,
          visitDefinitionId: o.visitDefinitionId ? (visitIdMap[o.visitDefinitionId] || o.visitDefinitionId) : undefined,
        });
      });
      mockDataStore.saveOutcomes(allOutcomes);

      // 6. Forms
      const srcForms = mockDataStore.getForms().filter((f) => f.protocolVersionId === srcVersionId);
      const allForms = mockDataStore.getForms();
      srcForms.forEach((f) => {
        allForms.push({
          ...f,
          id: `FORM-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          protocolVersionId: newVersionId,
          applicableVisitDefinitionId: f.applicableVisitDefinitionId ? (visitIdMap[f.applicableVisitDefinitionId] || f.applicableVisitDefinitionId) : undefined,
        });
      });
      mockDataStore.saveForms(allForms);

      // 7. Consent
      const srcConsent = mockDataStore.getConsentRequirements().filter((c) => c.protocolVersionId === srcVersionId);
      const allConsent = mockDataStore.getConsentRequirements();
      srcConsent.forEach((c) => {
        allConsent.push({
          ...c,
          id: `CNS-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          protocolVersionId: newVersionId,
        });
      });
      mockDataStore.saveConsentRequirements(allConsent);

      // 8. Safety
      const srcSafety = mockDataStore.getSafetyRequirements().filter((s) => s.protocolVersionId === srcVersionId);
      const allSafety = mockDataStore.getSafetyRequirements();
      srcSafety.forEach((s) => {
        allSafety.push({
          ...s,
          id: `SAF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          protocolVersionId: newVersionId,
        });
      });
      mockDataStore.saveSafetyRequirements(allSafety);

      // 9. Deviations
      const srcDeviations = mockDataStore.getDeviationRequirements().filter((d) => d.protocolVersionId === srcVersionId);
      const allDeviations = mockDataStore.getDeviationRequirements();
      srcDeviations.forEach((d) => {
        allDeviations.push({
          ...d,
          id: `DEV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          protocolVersionId: newVersionId,
        });
      });
      mockDataStore.saveDeviationRequirements(allDeviations);

      // 10. Milestones
      const srcMilestones = mockDataStore.getMilestones().filter((m) => m.protocolVersionId === srcVersionId);
      const allMilestones = mockDataStore.getMilestones();
      srcMilestones.forEach((m) => {
        allMilestones.push({
          ...m,
          id: `MLS-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          protocolVersionId: newVersionId,
        });
      });
      mockDataStore.saveMilestones(allMilestones);
    }

    return newVersion;
  }

  async updateProtocolVersion(
    versionId: string,
    updates: Partial<ProtocolVersion>
  ): Promise<ProtocolVersion | null> {
    const versions = mockDataStore.getProtocolVersions();
    const index = versions.findIndex((v) => v.id === versionId);
    if (index === -1) return null;

    const updated = {
      ...versions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    versions[index] = updated;
    mockDataStore.saveProtocolVersions(versions);

    // If marked ACTIVE, update protocol's currentVersionId and supersede any other active version
    if (updates.status === 'ACTIVE') {
      const protocols = mockDataStore.getProtocols();
      const protoIndex = protocols.findIndex((p) => p.id === updated.protocolId);
      if (protoIndex >= 0) {
        protocols[protoIndex].currentVersionId = updated.id;
        protocols[protoIndex].updatedAt = new Date().toISOString();
        mockDataStore.saveProtocols(protocols);
      }

      // Supersede other versions for the same study
      for (let i = 0; i < versions.length; i++) {
        if (versions[i].id !== versionId && versions[i].studyId === updated.studyId && versions[i].status === 'ACTIVE') {
          versions[i].status = 'SUPERSEDED';
          versions[i].updatedAt = new Date().toISOString();
        }
      }
      mockDataStore.saveProtocolVersions(versions);
    }

    return updated;
  }

  async addEligibilityCriterion(
    versionId: string,
    input: CreateEligibilityCriterionInput
  ): Promise<ProtocolEligibilityCriterion> {
    const list = mockDataStore.getEligibilityCriteria();
    const criterion: ProtocolEligibilityCriterion = {
      id: `CRIT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      protocolVersionId: versionId,
      type: input.type,
      criterionCode: input.criterionCode,
      title: input.title,
      description: input.description,
      displayOrder: input.displayOrder ?? (list.filter((c) => c.protocolVersionId === versionId).length + 1),
      required: input.required ?? true,
      active: input.active ?? true,
    };
    list.push(criterion);
    mockDataStore.saveEligibilityCriteria(list);
    return criterion;
  }

  async updateEligibilityCriterion(
    versionId: string,
    criterionId: string,
    updates: Partial<ProtocolEligibilityCriterion>
  ): Promise<ProtocolEligibilityCriterion | null> {
    const list = mockDataStore.getEligibilityCriteria();
    const index = list.findIndex((c) => c.id === criterionId && c.protocolVersionId === versionId);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates };
    mockDataStore.saveEligibilityCriteria(list);
    return list[index];
  }

  async addVisitDefinition(
    versionId: string,
    input: CreateProtocolVisitDefinitionInput
  ): Promise<ProtocolVisitDefinition> {
    const version = await this.getProtocolVersion(versionId);
    const list = mockDataStore.getProtocolVisits();
    const visit: ProtocolVisitDefinition = {
      id: `PV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      studyId: version ? version.studyId : '',
      protocolVersionId: versionId,
      code: input.code,
      name: input.name,
      sequence: input.sequence,
      anchor: input.anchor,
      targetOffsetDays: input.targetOffsetDays,
      targetDay: input.targetDay ?? input.targetOffsetDays,
      windowBeforeDays: input.windowBeforeDays,
      windowAfterDays: input.windowAfterDays,
      requiredActivities: input.requiredActivities ?? [],
      description: input.description ?? '',
      required: input.required ?? true,
      visitType: input.visitType ?? 'TREATMENT',
      status: input.status,
      notes: input.notes,
    };
    list.push(visit);
    mockDataStore.saveProtocolVisits(list);
    return visit;
  }

  async updateVisitDefinition(
    versionId: string,
    visitDefId: string,
    updates: Partial<ProtocolVisitDefinition>
  ): Promise<ProtocolVisitDefinition | null> {
    const list = mockDataStore.getProtocolVisits();
    const index = list.findIndex((v) => v.id === visitDefId && v.protocolVersionId === versionId);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates };
    mockDataStore.saveProtocolVisits(list);
    return list[index];
  }

  async addAssessmentDefinition(
    versionId: string,
    input: CreateAssessmentDefinitionInput
  ): Promise<ProtocolAssessmentDefinition> {
    const list = mockDataStore.getAssessments();
    const assessment: ProtocolAssessmentDefinition = {
      id: `ASM-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      protocolVersionId: versionId,
      code: input.code,
      name: input.name,
      category: input.category,
      visitDefinitionId: input.visitDefinitionId,
      description: input.description,
      required: input.required ?? true,
      displayOrder: input.displayOrder ?? (list.filter((a) => a.protocolVersionId === versionId).length + 1),
      status: input.status ?? 'ACTIVE',
      version: input.version ?? '1.0',
      sourceReference: input.sourceReference,
      participantVisible: input.participantVisible ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(assessment);
    mockDataStore.saveAssessments(list);
    return assessment;
  }

  async updateAssessmentDefinition(
    versionId: string,
    assessmentId: string,
    updates: Partial<ProtocolAssessmentDefinition>
  ): Promise<ProtocolAssessmentDefinition | null> {
    const list = mockDataStore.getAssessments();
    const index = list.findIndex((a) => a.id === assessmentId && a.protocolVersionId === versionId);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
    mockDataStore.saveAssessments(list);
    return list[index];
  }

  async addInvestigationDefinition(
    versionId: string,
    input: CreateInvestigationDefinitionInput
  ): Promise<ProtocolInvestigationDefinition> {
    const list = mockDataStore.getInvestigations();
    const investigation: ProtocolInvestigationDefinition = {
      id: `INV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      protocolVersionId: versionId,
      code: input.code,
      name: input.name,
      category: input.category,
      visitDefinitionId: input.visitDefinitionId,
      description: input.description,
      required: input.required ?? true,
      displayOrder: input.displayOrder ?? (list.filter((i) => i.protocolVersionId === versionId).length + 1),
      status: input.status ?? 'ACTIVE',
      participantVisible: input.participantVisible ?? false,
      sourceReference: input.sourceReference,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(investigation);
    mockDataStore.saveInvestigations(list);
    return investigation;
  }

  async updateInvestigationDefinition(
    versionId: string,
    investigationId: string,
    updates: Partial<ProtocolInvestigationDefinition>
  ): Promise<ProtocolInvestigationDefinition | null> {
    const list = mockDataStore.getInvestigations();
    const index = list.findIndex((i) => i.id === investigationId && i.protocolVersionId === versionId);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
    mockDataStore.saveInvestigations(list);
    return list[index];
  }

  async addOutcomeDefinition(
    versionId: string,
    input: CreateOutcomeDefinitionInput
  ): Promise<ProtocolOutcomeDefinition> {
    const list = mockDataStore.getOutcomes();
    const outcome: ProtocolOutcomeDefinition = {
      id: `OUT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      protocolVersionId: versionId,
      code: input.code,
      name: input.name,
      outcomeType: input.outcomeType,
      description: input.description,
      visitDefinitionId: input.visitDefinitionId,
      timepoint: input.timepoint,
      required: input.required ?? true,
      displayOrder: input.displayOrder ?? (list.filter((o) => o.protocolVersionId === versionId).length + 1),
      status: input.status ?? 'ACTIVE',
      sourceReference: input.sourceReference,
    };
    list.push(outcome);
    mockDataStore.saveOutcomes(list);
    return outcome;
  }

  async addConsentRequirement(
    versionId: string,
    input: CreateConsentRequirementInput
  ): Promise<ProtocolConsentRequirement> {
    const list = mockDataStore.getConsentRequirements();
    const req: ProtocolConsentRequirement = {
      id: `CNS-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      protocolVersionId: versionId,
      consentType: input.consentType,
      requiredBefore: input.requiredBefore,
      required: input.required ?? true,
      versionReference: input.versionReference,
      participantVisible: input.participantVisible,
      description: input.description,
    };
    list.push(req);
    mockDataStore.saveConsentRequirements(list);
    return req;
  }

  async addSafetyRequirement(
    versionId: string,
    input: CreateSafetyRequirementInput
  ): Promise<ProtocolSafetyRequirement> {
    const list = mockDataStore.getSafetyRequirements();
    const req: ProtocolSafetyRequirement = {
      id: `SAF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      protocolVersionId: versionId,
      eventType: input.eventType,
      required: input.required ?? true,
      reportingWindow: input.reportingWindow,
      description: input.description,
      active: input.active ?? true,
    };
    list.push(req);
    mockDataStore.saveSafetyRequirements(list);
    return req;
  }

  async addDeviationRequirement(
    versionId: string,
    input: CreateDeviationRequirementInput
  ): Promise<ProtocolDeviationRequirement> {
    const list = mockDataStore.getDeviationRequirements();
    const req: ProtocolDeviationRequirement = {
      id: `DEV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      protocolVersionId: versionId,
      category: input.category,
      description: input.description,
      required: input.required ?? true,
      active: input.active ?? true,
    };
    list.push(req);
    mockDataStore.saveDeviationRequirements(list);
    return req;
  }

  async addMilestone(
    versionId: string,
    input: CreateMilestoneInput
  ): Promise<ProtocolMilestone> {
    const list = mockDataStore.getMilestones();
    const milestone: ProtocolMilestone = {
      id: `MLS-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      protocolVersionId: versionId,
      type: input.type,
      name: input.name,
      plannedDate: input.plannedDate,
      relativeDay: input.relativeDay,
      status: input.status ?? 'PLANNED',
      required: input.required ?? true,
      description: input.description,
    };
    list.push(milestone);
    mockDataStore.saveMilestones(list);
    return milestone;
  }

  async addFormDefinition(
    versionId: string,
    input: CreateFormDefinitionInput
  ): Promise<ProtocolFormDefinition> {
    const list = mockDataStore.getForms();
    const form: ProtocolFormDefinition = {
      id: `FORM-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      protocolVersionId: versionId,
      code: input.code,
      name: input.name,
      formType: input.formType,
      description: input.description,
      applicableVisitDefinitionId: input.applicableVisitDefinitionId,
      required: input.required ?? true,
      displayOrder: input.displayOrder ?? (list.filter((f) => f.protocolVersionId === versionId).length + 1),
      status: input.status ?? 'ACTIVE',
      participantVisible: input.participantVisible ?? false,
      dataDomain: input.dataDomain ?? 'CLINICAL',
      version: input.version ?? '1.0',
    };
    list.push(form);
    mockDataStore.saveForms(list);
    return form;
  }
}

export const mockProtocolRepository = new MockProtocolRepository();
