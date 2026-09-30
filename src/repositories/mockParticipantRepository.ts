import { IParticipantRepository, ParticipantQueryContext } from './interfaces';
import {
  Participant,
  ParticipantFilters,
  ParticipantSummaryMetrics,
  CreateParticipantInput,
  ParticipantOnboardingRequest,
  ParticipantRequest,
  ParticipantSelfRegistrationInput,
  CreateParticipantRequestInput,
} from '../types';
import { MOCK_PARTICIPANTS } from '../data/mockData';
import { mockDataStore } from '../storage/mockDataStore';

export class MockParticipantRepository implements IParticipantRepository {
  private store: Record<string, Record<string, Participant[]>>;
  private onboardingRequests: ParticipantOnboardingRequest[];
  private participantRequests: ParticipantRequest[];
  private onSaveStore?: (store: Record<string, Record<string, Participant[]>>) => void;
  private onSaveOnboardingRequests?: (requests: ParticipantOnboardingRequest[]) => void;
  private onSaveParticipantRequests?: (requests: ParticipantRequest[]) => void;

  constructor(
    initialStore?: Record<string, Record<string, Participant[]>>,
    onSaveStore?: (store: Record<string, Record<string, Participant[]>>) => void,
    initialOnboardingRequests?: ParticipantOnboardingRequest[],
    onSaveOnboardingRequests?: (requests: ParticipantOnboardingRequest[]) => void,
    initialParticipantRequests?: ParticipantRequest[],
    onSaveParticipantRequests?: (requests: ParticipantRequest[]) => void
  ) {
    if (initialStore) {
      this.store = structuredClone(initialStore);
    } else {
      // In Mock Mode, overlay canonical MOCK_PARTICIPANTS with mockDataStore added participants
      this.store = structuredClone(MOCK_PARTICIPANTS);
      const added = mockDataStore.getAddedParticipants();
      for (const p of added) {
        if (!this.store[p.studyId]) this.store[p.studyId] = {};
        if (!this.store[p.studyId][p.siteId]) this.store[p.studyId][p.siteId] = [];
        const existingIdx = this.store[p.studyId][p.siteId].findIndex((x) => x.id === p.id);
        if (existingIdx >= 0) {
          this.store[p.studyId][p.siteId][existingIdx] = p;
        } else {
          this.store[p.studyId][p.siteId].push(p);
        }
      }
    }

    this.onSaveStore = onSaveStore;

    this.onboardingRequests = initialOnboardingRequests
      ? structuredClone(initialOnboardingRequests)
      : mockDataStore.getAddedOnboardingRequests();
    this.onSaveOnboardingRequests = onSaveOnboardingRequests;

    this.participantRequests = initialParticipantRequests
      ? structuredClone(initialParticipantRequests)
      : mockDataStore.getAddedParticipantRequests();
    this.onSaveParticipantRequests = onSaveParticipantRequests;
  }

  async getParticipants(
    context: ParticipantQueryContext,
    filters?: ParticipantFilters
  ): Promise<Participant[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyParticipants = this.store[context.studyId];
    if (!studyParticipants) return [];

    const siteParticipants = studyParticipants[context.siteId];
    if (!siteParticipants) return [];

    let results = siteParticipants;

    if (filters) {
      // 1. Search filter
      if (filters.search && filters.search.trim().length > 0) {
        const query = filters.search.trim().toLowerCase();
        results = results.filter(
          (p) =>
            p.participantCode.toLowerCase().includes(query) ||
            (p.participantNumber && p.participantNumber.toLowerCase().includes(query)) ||
            p.screeningCode.toLowerCase().includes(query) ||
            p.initials.toLowerCase().includes(query)
        );
      }

      // 2. Status filter
      if (filters.status && filters.status !== 'ALL') {
        results = results.filter((p) => p.status === filters.status);
      }

      // 3. Sex filter
      if (filters.sex && filters.sex !== 'ALL') {
        results = results.filter((p) => p.sex === filters.sex);
      }

      // 4. Coordinator filter
      if (filters.coordinatorId && filters.coordinatorId.trim().length > 0) {
        results = results.filter((p) => p.assignedCoordinatorId === filters.coordinatorId);
      }

      // 5. Attention filter
      if (filters.attentionRequired !== undefined) {
        results = results.filter((p) => p.attentionRequired === filters.attentionRequired);
      }
    }

    return structuredClone(results);
  }

  async getParticipantById(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<Participant | null> {
    await new Promise((resolve) => setTimeout(resolve, 20));

    const studyParticipants = this.store[context.studyId];
    if (!studyParticipants) return null;

    const siteParticipants = studyParticipants[context.siteId];
    if (!siteParticipants) return null;

    const query = participantId.toLowerCase();
    const found = siteParticipants.find(
      (p) =>
        p.id.toLowerCase() === query ||
        p.participantCode.toLowerCase() === query ||
        (p.participantNumber && p.participantNumber.toLowerCase() === query)
    );

    return found ? structuredClone(found) : null;
  }

  async getParticipantSummary(context: ParticipantQueryContext): Promise<ParticipantSummaryMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 20));

    const studyParticipants = this.store[context.studyId];
    const siteParticipants = studyParticipants?.[context.siteId] || [];

    const total = siteParticipants.length;
    const screening = siteParticipants.filter(
      (p) => p.status === 'SCREENING' || p.status === 'SCREENED' || p.status === 'ELIGIBLE'
    ).length;
    const enrolled = siteParticipants.filter((p) => p.enrollmentDate !== null).length;
    const active = siteParticipants.filter((p) => p.status === 'ACTIVE').length;
    const completed = siteParticipants.filter((p) => p.status === 'COMPLETED').length;
    const withdrawn = siteParticipants.filter(
      (p) => p.status === 'WITHDRAWN' || p.status === 'LOST_TO_FOLLOW_UP'
    ).length;
    const screenFailed = siteParticipants.filter((p) => p.status === 'SCREEN_FAILED').length;
    const attentionRequired = siteParticipants.filter((p) => p.attentionRequired).length;

    return {
      total,
      screening,
      enrolled,
      active,
      completed,
      withdrawn,
      screenFailed,
      attentionRequired,
    };
  }

  async createParticipant(
    context: ParticipantQueryContext,
    input: CreateParticipantInput
  ): Promise<Participant> {
    if (!context.studyId || !context.siteId) {
      throw new Error('Study and site context are required to create a participant.');
    }

    if (!this.store[context.studyId]) {
      this.store[context.studyId] = {};
    }
    if (!this.store[context.studyId][context.siteId]) {
      this.store[context.studyId][context.siteId] = [];
    }

    const siteParticipants = this.store[context.studyId][context.siteId];

    // Validation: Duplicate screening code
    const existingScreening = siteParticipants.find(
      (p) => p.screeningCode.trim().toLowerCase() === input.screeningNumber.trim().toLowerCase()
    );
    if (existingScreening) {
      throw new Error(`Screening code "${input.screeningNumber}" already exists at this site.`);
    }

    // Validation: Duplicate participant code if provided
    if (input.participantCode) {
      const existingCode = siteParticipants.find(
        (p) =>
          p.participantCode.trim().toLowerCase() === input.participantCode!.trim().toLowerCase() ||
          (p.participantNumber && p.participantNumber.trim().toLowerCase() === input.participantCode!.trim().toLowerCase())
      );
      if (existingCode) {
        throw new Error(`Participant code "${input.participantCode}" already exists at this site.`);
      }
    }

    const count = siteParticipants.length + 1;
    const participantId =
      input.participantId ||
      `PT-${context.studyId.replace('STUDY-', '').replace('EMPTY-', '')}${context.siteId.replace('SITE-', '').replace('EMPTY-', '')}-${String(count).padStart(3, '0')}`;

    const newParticipant: Participant = {
      id: participantId,
      participantCode: input.participantCode || participantId,
      participantNumber: input.participantCode || participantId,
      screeningCode: input.screeningNumber,
      initials: input.initials || 'P.T.',
      age: input.demographics?.age || 35,
      sex: input.demographics?.gender === 'MALE' ? 'M' : input.demographics?.gender === 'FEMALE' ? 'F' : 'Other',
      screeningDate: input.screeningDate || new Date().toISOString().slice(0, 10),
      enrollmentDate: input.enrollmentDate || null,
      status: input.status || 'SCREENING',
      phase: 'Phase II',
      studyId: context.studyId,
      siteId: context.siteId,
      assignedCoordinatorId: input.assignedInvestigatorId || 'USR-103',
      assignedCoordinatorName: input.assignedInvestigatorName || 'Pratibha Joshi (CRC)',
      lastActivityDate: new Date().toISOString().slice(0, 10),
      lastActivityName: 'Initial Screening Registration',
      nextActivityDate: null,
      nextActivityName: null,
      attentionRequired: false,
      attentionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    siteParticipants.push(newParticipant);

    if (this.onSaveStore) {
      this.onSaveStore(this.store);
    } else {
      mockDataStore.addMockParticipant(newParticipant);
    }

    return structuredClone(newParticipant);
  }

  async updateParticipant(
    context: ParticipantQueryContext,
    participantId: string,
    updates: Partial<Participant>
  ): Promise<Participant | null> {
    const studyParticipants = this.store[context.studyId];
    if (!studyParticipants) return null;

    const siteParticipants = studyParticipants[context.siteId];
    if (!siteParticipants) return null;

    const query = participantId.toLowerCase();
    const index = siteParticipants.findIndex(
      (p) =>
        p.id.toLowerCase() === query ||
        p.participantCode.toLowerCase() === query ||
        (p.participantNumber && p.participantNumber.toLowerCase() === query)
    );

    if (index === -1) return null;

    const existing = siteParticipants[index];
    const updated: Participant = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
      studyId: existing.studyId, // Immutable scope
      siteId: existing.siteId,
      updatedAt: new Date().toISOString(),
    };

    siteParticipants[index] = updated;

    if (this.onSaveStore) {
      this.onSaveStore(this.store);
    } else {
      mockDataStore.updateMockParticipant(updated);
    }

    return structuredClone(updated);
  }

  // --- Onboarding Requests ---

  async getOnboardingRequests(
    context: ParticipantQueryContext
  ): Promise<ParticipantOnboardingRequest[]> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return structuredClone(
      this.onboardingRequests.filter(
        (r) => r.studyId === context.studyId && r.siteId === context.siteId
      )
    );
  }

  async getOnboardingRequestById(
    context: ParticipantQueryContext,
    requestId: string
  ): Promise<ParticipantOnboardingRequest | null> {
    await new Promise((resolve) => setTimeout(resolve, 15));
    const found = this.onboardingRequests.find(
      (r) =>
        r.id === requestId &&
        r.studyId === context.studyId &&
        r.siteId === context.siteId
    );
    return found ? structuredClone(found) : null;
  }

  async createOnboardingRequest(
    input: ParticipantSelfRegistrationInput
  ): Promise<ParticipantOnboardingRequest> {
    const now = new Date().toISOString();
    const id = `ONB-REQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const newReq: ParticipantOnboardingRequest = {
      id,
      studyId: input.studyId,
      siteId: input.siteId,
      participantAccountId: input.participantAccountId,
      requestedEmail: input.requestedEmail.trim().toLowerCase(),
      requestedName: input.requestedName.trim(),
      age: input.age,
      dob: input.dob,
      gender: input.gender,
      phone: input.phone,
      preferredLanguage: input.preferredLanguage || 'English',
      notes: input.notes,
      status: 'SUBMITTED',
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.onboardingRequests.push(newReq);

    if (this.onSaveOnboardingRequests) {
      this.onSaveOnboardingRequests(this.onboardingRequests);
    } else {
      mockDataStore.addOnboardingRequest(newReq);
    }

    return structuredClone(newReq);
  }

  async updateOnboardingRequest(
    req: ParticipantOnboardingRequest
  ): Promise<ParticipantOnboardingRequest> {
    const index = this.onboardingRequests.findIndex((r) => r.id === req.id);
    const updated = {
      ...req,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      this.onboardingRequests[index] = updated;
    } else {
      this.onboardingRequests.push(updated);
    }

    if (this.onSaveOnboardingRequests) {
      this.onSaveOnboardingRequests(this.onboardingRequests);
    } else {
      mockDataStore.updateOnboardingRequest(updated);
    }

    return structuredClone(updated);
  }

  // --- Participant Requests (Reschedule / Cannot Attend) ---

  async getParticipantRequests(
    context: ParticipantQueryContext,
    participantId?: string
  ): Promise<ParticipantRequest[]> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    let list = this.participantRequests.filter(
      (r) => r.studyId === context.studyId && r.siteId === context.siteId
    );

    if (participantId) {
      list = list.filter((r) => r.participantId === participantId);
    }

    return structuredClone(list);
  }

  async createParticipantRequest(
    input: CreateParticipantRequestInput
  ): Promise<ParticipantRequest> {
    const now = new Date().toISOString();
    const id = `PREQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const newReq: ParticipantRequest = {
      id,
      participantId: input.participantId,
      studyId: input.studyId,
      siteId: input.siteId,
      requestType: input.requestType,
      visitId: input.visitId,
      visitName: input.visitName,
      message: input.message,
      proposedDate: input.proposedDate,
      status: 'SUBMITTED',
      submittedAt: now,
    };

    this.participantRequests.push(newReq);

    if (this.onSaveParticipantRequests) {
      this.onSaveParticipantRequests(this.participantRequests);
    } else {
      mockDataStore.addParticipantRequest(newReq);
    }

    return structuredClone(newReq);
  }

  async updateParticipantRequest(req: ParticipantRequest): Promise<ParticipantRequest> {
    const index = this.participantRequests.findIndex((r) => r.id === req.id);
    if (index >= 0) {
      this.participantRequests[index] = req;
    } else {
      this.participantRequests.push(req);
    }

    if (this.onSaveParticipantRequests) {
      this.onSaveParticipantRequests(this.participantRequests);
    } else {
      mockDataStore.updateParticipantRequest(req);
    }

    return structuredClone(req);
  }
}

export const mockParticipantRepository = new MockParticipantRepository();
