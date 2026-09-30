import { IAyurvedaConfigurationRepository } from './interfaces';
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
} from '../types';
import { mockDataStore } from '../storage/mockDataStore';

export class MockAyurvedaRepository implements IAyurvedaConfigurationRepository {
  // --- Categories ---

  async getCategories(activeOnly: boolean = false): Promise<AyurvedaAssessmentCategory[]> {
    const categories = mockDataStore.getAyurvedaCategories();
    if (activeOnly) {
      return categories.filter((c) => c.isActive);
    }
    return categories;
  }

  async getCategoryById(id: string): Promise<AyurvedaAssessmentCategory | null> {
    const categories = mockDataStore.getAyurvedaCategories();
    return categories.find((c) => c.id === id) || null;
  }

  async getCategoryByCode(code: AyurvedaCategoryCode): Promise<AyurvedaAssessmentCategory | null> {
    const categories = mockDataStore.getAyurvedaCategories();
    return categories.find((c) => c.code === code) || null;
  }

  async createCategory(input: CreateAyurvedaCategoryInput): Promise<AyurvedaAssessmentCategory> {
    const categories = mockDataStore.getAyurvedaCategories();
    const existing = categories.find((c) => c.code === input.code);
    if (existing) {
      throw new Error(`Ayurveda category with code "${input.code}" already exists.`);
    }

    const now = new Date().toISOString();
    const newCategory: AyurvedaAssessmentCategory = {
      id: `AYU-CAT-${String(categories.length + 1).padStart(2, '0')}`,
      code: input.code,
      name: input.name,
      description: input.description,
      sourceAuthority: input.sourceAuthority,
      sourceReference: input.sourceReference,
      status: input.status || 'PROTOCOL_DEFINED',
      isActive: input.isActive !== undefined ? input.isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    categories.push(newCategory);
    mockDataStore.saveAyurvedaCategories(categories);
    return newCategory;
  }

  async updateCategory(
    id: string,
    updates: Partial<AyurvedaAssessmentCategory>
  ): Promise<AyurvedaAssessmentCategory | null> {
    const categories = mockDataStore.getAyurvedaCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const updated: AyurvedaAssessmentCategory = {
      ...categories[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    categories[index] = updated;
    mockDataStore.saveAyurvedaCategories(categories);
    return updated;
  }

  // --- Instruments ---

  async getInstruments(filter?: AyurvedaInstrumentFilter): Promise<AyurvedaAssessmentInstrument[]> {
    let instruments = mockDataStore.getAyurvedaInstruments();
    if (!filter) return instruments;

    if (filter.category) {
      instruments = instruments.filter((i) => i.category === filter.category);
    }
    if (filter.sourceAuthority) {
      instruments = instruments.filter(
        (i) => i.sourceAuthority.toLowerCase() === filter.sourceAuthority!.toLowerCase()
      );
    }
    if (filter.validationStatus) {
      instruments = instruments.filter((i) => i.validationStatus === filter.validationStatus);
    }
    if (filter.usageStatus) {
      instruments = instruments.filter((i) => i.usageStatus === filter.usageStatus);
    }
    if (filter.isActive !== undefined) {
      instruments = instruments.filter((i) => i.isActive === filter.isActive);
    }

    return instruments;
  }

  async getInstrumentById(id: string): Promise<AyurvedaAssessmentInstrument | null> {
    const instruments = mockDataStore.getAyurvedaInstruments();
    return instruments.find((i) => i.id === id) || null;
  }

  async getInstrumentByCode(code: string): Promise<AyurvedaAssessmentInstrument | null> {
    const instruments = mockDataStore.getAyurvedaInstruments();
    return instruments.find((i) => i.code === code) || null;
  }

  async createInstrument(input: CreateAyurvedaInstrumentInput): Promise<AyurvedaAssessmentInstrument> {
    const instruments = mockDataStore.getAyurvedaInstruments();
    const existing = instruments.find((i) => i.code === input.code);
    if (existing) {
      throw new Error(`Ayurveda instrument with code "${input.code}" already exists.`);
    }

    // Verify category exists
    const categories = mockDataStore.getAyurvedaCategories();
    const categoryExists = categories.some((c) => c.code === input.category);
    if (!categoryExists) {
      throw new Error(`Invalid category "${input.category}" for instrument.`);
    }

    const now = new Date().toISOString();
    const newInstrument: AyurvedaAssessmentInstrument = {
      id: `AYU-INST-${String(instruments.length + 1).padStart(2, '0')}`,
      code: input.code,
      name: input.name,
      category: input.category,
      description: input.description || input.name,
      sourceAuthority: input.sourceAuthority,
      sourceReference: input.sourceReference || 'Institutional Reference',
      version: input.version || '1.0',
      validationStatus: input.validationStatus || 'PROTOCOL_DEFINED',
      usageStatus: input.usageStatus || 'ACTIVE',
      trainingRequired: input.trainingRequired !== undefined ? input.trainingRequired : false,
      trainingProvider: input.trainingProvider,
      trainingReference: input.trainingReference,
      licenseNote: input.licenseNote,
      languageSupport: input.languageSupport && input.languageSupport.length > 0 ? input.languageSupport : ['en'],
      languageSupportStatus: input.languageSupportStatus || 'NOT_SPECIFIED',
      scoringMethod: input.scoringMethod || 'NONE',
      scoringStatus: input.scoringStatus || 'NOT_CONFIGURED',
      itemSourceReference: input.itemSourceReference,
      contentStatus: input.contentStatus || 'METADATA_ONLY',
      isActive: input.isActive !== undefined ? input.isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    instruments.push(newInstrument);
    mockDataStore.saveAyurvedaInstruments(instruments);
    return newInstrument;
  }

  async updateInstrument(
    id: string,
    updates: UpdateAyurvedaInstrumentInput
  ): Promise<AyurvedaAssessmentInstrument | null> {
    const instruments = mockDataStore.getAyurvedaInstruments();
    const index = instruments.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const updated: AyurvedaAssessmentInstrument = {
      ...instruments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    instruments[index] = updated;
    mockDataStore.saveAyurvedaInstruments(instruments);
    return updated;
  }

  async deprecateInstrument(id: string): Promise<AyurvedaAssessmentInstrument | null> {
    const instruments = mockDataStore.getAyurvedaInstruments();
    const index = instruments.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const updated: AyurvedaAssessmentInstrument = {
      ...instruments[index],
      usageStatus: 'DEPRECATED',
      updatedAt: new Date().toISOString(),
    };
    instruments[index] = updated;
    mockDataStore.saveAyurvedaInstruments(instruments);
    return updated;
  }

  // --- Terminology ---

  async getTerminologyEntries(filter?: AyurvedaTerminologyFilter): Promise<AyurvedaTerminologyEntry[]> {
    let entries = mockDataStore.getAyurvedaTerminology();
    if (!filter) return entries;

    if (filter.system) {
      entries = entries.filter((e) => e.system === filter.system);
    }
    if (filter.status) {
      entries = entries.filter((e) => e.status === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.display.toLowerCase().includes(q) ||
          (e.code && e.code.toLowerCase().includes(q)) ||
          (e.shortDefinition && e.shortDefinition.toLowerCase().includes(q))
      );
    }

    return entries;
  }

  async getTerminologyEntryById(id: string): Promise<AyurvedaTerminologyEntry | null> {
    const entries = mockDataStore.getAyurvedaTerminology();
    return entries.find((e) => e.id === id) || null;
  }

  async createTerminologyEntry(input: CreateAyurvedaTerminologyInput): Promise<AyurvedaTerminologyEntry> {
    const entries = mockDataStore.getAyurvedaTerminology();

    const hasCode = input.code !== null && input.code !== undefined && input.code.trim() !== '';
    const formattedCode = hasCode ? input.code!.trim() : null;

    // Determine verification status
    const verificationStatus =
      input.officialCodeVerification ||
      (formattedCode
        ? 'VERIFIED_SOURCE'
        : input.system === 'INSTITUTIONAL' || input.system === 'PROTOCOL_SPECIFIC'
        ? 'INTERNAL_ONLY'
        : 'PENDING_MAPPING');

    // Rule 1: Pending or internal mappings cannot have an official code
    if ((verificationStatus === 'PENDING_MAPPING' || verificationStatus === 'INTERNAL_ONLY') && formattedCode !== null) {
      throw new Error(`Pending or internal terminology mappings cannot have an official terminology code.`);
    }

    // Rule 2: Verified source requires official code, source authority, and source reference
    if (verificationStatus === 'VERIFIED_SOURCE') {
      if (!formattedCode) {
        throw new Error(`Verified source terminology entries must specify an official terminology code.`);
      }
      if (!input.sourceAuthority || !input.sourceAuthority.trim() || !input.sourceReference || !input.sourceReference.trim()) {
        throw new Error(`Verified source terminology entries require sourceAuthority and sourceReference.`);
      }
    }

    if (formattedCode !== null) {
      const existing = entries.find((e) => e.system === input.system && e.code === formattedCode);
      if (existing) {
        throw new Error(`Terminology entry with code "${formattedCode}" already exists in system "${input.system}".`);
      }
    }

    const now = new Date().toISOString();
    const newEntry: AyurvedaTerminologyEntry = {
      id: `AYU-TERM-${String(entries.length + 1).padStart(2, '0')}`,
      localConceptId: input.localConceptId || null,
      system: input.system,
      code: formattedCode,
      officialCodeVerification: verificationStatus,
      display: input.display,
      shortDefinition: input.shortDefinition,
      longDefinition: input.longDefinition,
      language: input.language || 'sa-Latn',
      sourceAuthority: input.sourceAuthority,
      sourceReference: input.sourceReference,
      version: input.version || '1.0',
      parentCode: input.parentCode || null,
      status: formattedCode
        ? input.status || 'SOURCE_REFERENCED'
        : verificationStatus === 'INTERNAL_ONLY'
        ? 'PROTOCOL_DEFINED'
        : 'PENDING_TERMINOLOGY_MAPPING',
      createdAt: now,
      updatedAt: now,
    };

    entries.push(newEntry);
    mockDataStore.saveAyurvedaTerminology(entries);
    return newEntry;
  }

  async updateTerminologyEntry(
    id: string,
    updates: Partial<AyurvedaTerminologyEntry>
  ): Promise<AyurvedaTerminologyEntry | null> {
    const entries = mockDataStore.getAyurvedaTerminology();
    const index = entries.findIndex((e) => e.id === id);
    if (index === -1) return null;

    const current = entries[index];
    const newVerification =
      updates.officialCodeVerification !== undefined
        ? updates.officialCodeVerification
        : current.officialCodeVerification;
    const newCode =
      updates.code !== undefined
        ? updates.code !== null && updates.code.trim() !== ''
          ? updates.code.trim()
          : null
        : current.code;

    // Rule 1: Pending or internal mappings cannot have an official code
    if ((newVerification === 'PENDING_MAPPING' || newVerification === 'INTERNAL_ONLY') && newCode !== null) {
      throw new Error(`Pending or internal terminology mappings cannot have an official terminology code.`);
    }

    // Rule 2: Verified source requires official code
    if (newVerification === 'VERIFIED_SOURCE' && !newCode) {
      throw new Error(`Verified source terminology entries must specify an official terminology code.`);
    }

    const updated: AyurvedaTerminologyEntry = {
      ...current,
      ...updates,
      code: newCode,
      officialCodeVerification: newVerification,
      updatedAt: new Date().toISOString(),
    };
    entries[index] = updated;
    mockDataStore.saveAyurvedaTerminology(entries);
    return updated;
  }

  // --- Protocol-Linked Ayurveda Assessments ---

  async getProtocolAyurvedaAssessments(protocolVersionId: string): Promise<ProtocolAyurvedaAssessment[]> {
    const all = mockDataStore.getProtocolAyurvedaAssessments();
    return all.filter((a) => a.protocolVersionId === protocolVersionId);
  }

  async getProtocolAyurvedaAssessmentById(id: string): Promise<ProtocolAyurvedaAssessment | null> {
    const all = mockDataStore.getProtocolAyurvedaAssessments();
    return all.find((a) => a.id === id) || null;
  }

  async addProtocolAyurvedaAssessment(
    protocolVersionId: string,
    input: CreateProtocolAyurvedaAssessmentInput
  ): Promise<ProtocolAyurvedaAssessment> {
    const all = mockDataStore.getProtocolAyurvedaAssessments();

    // Check duplicate code within the same protocol version
    const duplicate = all.find(
      (a) => a.protocolVersionId === protocolVersionId && a.assessmentCode === input.assessmentCode
    );
    if (duplicate) {
      throw new Error(`Ayurveda assessment with code "${input.assessmentCode}" already exists in this version.`);
    }

    // Check instrument existence and category match
    const instruments = mockDataStore.getAyurvedaInstruments();
    const instrument = instruments.find((i) => i.id === input.instrumentId || i.code === input.instrumentId);
    if (!instrument) {
      throw new Error(`Referenced instrument "${input.instrumentId}" not found.`);
    }
    if (instrument.category !== input.category) {
      throw new Error(
        `Instrument category "${instrument.category}" does not match assessment category "${input.category}".`
      );
    }

    const now = new Date().toISOString();
    const newAssessment: ProtocolAyurvedaAssessment = {
      id: `AYU-ASSESS-${String(all.length + 1).padStart(3, '0')}`,
      protocolVersionId,
      assessmentCode: input.assessmentCode,
      name: input.name,
      category: input.category,
      instrumentId: input.instrumentId,
      instrumentVersion: input.instrumentVersion || instrument.version,
      visitDefinitionId: input.visitDefinitionId,
      required: input.required !== undefined ? input.required : true,
      participantVisible: input.participantVisible !== undefined ? input.participantVisible : false,
      assessorRequirement: input.assessorRequirement,
      sourceReference: input.sourceReference || instrument.sourceReference,
      validationStatus: input.validationStatus || instrument.validationStatus,
      contentStatus: input.contentStatus || instrument.contentStatus || 'METADATA_ONLY',
      terminologySystem: input.terminologySystem,
      terminologyCode: input.terminologyCode !== undefined ? input.terminologyCode : null,
      localConceptId: input.localConceptId || null,
      displayOrder: input.displayOrder || all.length + 1,
      status: input.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    all.push(newAssessment);
    mockDataStore.saveProtocolAyurvedaAssessments(all);
    return newAssessment;
  }

  async updateProtocolAyurvedaAssessment(
    protocolVersionId: string,
    assessmentId: string,
    updates: UpdateProtocolAyurvedaAssessmentInput
  ): Promise<ProtocolAyurvedaAssessment | null> {
    const all = mockDataStore.getProtocolAyurvedaAssessments();
    const index = all.findIndex((a) => a.protocolVersionId === protocolVersionId && a.id === assessmentId);
    if (index === -1) return null;

    const updated: ProtocolAyurvedaAssessment = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    all[index] = updated;
    mockDataStore.saveProtocolAyurvedaAssessments(all);
    return updated;
  }

  async deleteProtocolAyurvedaAssessment(protocolVersionId: string, assessmentId: string): Promise<boolean> {
    const all = mockDataStore.getProtocolAyurvedaAssessments();
    const filtered = all.filter((a) => !(a.protocolVersionId === protocolVersionId && a.id === assessmentId));
    if (filtered.length === all.length) return false;

    mockDataStore.saveProtocolAyurvedaAssessments(filtered);
    return true;
  }

  // --- Downstream Visit Queries ---

  async getAyurvedaAssessmentsForVisit(
    protocolVersionId: string,
    visitDefinitionId: string
  ): Promise<ProtocolAyurvedaAssessment[]> {
    const all = mockDataStore.getProtocolAyurvedaAssessments();
    return all.filter(
      (a) => a.protocolVersionId === protocolVersionId && a.visitDefinitionId === visitDefinitionId
    );
  }
}

export const mockAyurvedaRepository = new MockAyurvedaRepository();
