import { IParticipantRepository, ParticipantQueryContext } from './interfaces';
import { Participant, ParticipantFilters, ParticipantSummaryMetrics, CreateParticipantInput } from '../types';
import { MOCK_PARTICIPANTS } from '../data/mockData';

export class MockParticipantRepository implements IParticipantRepository {
  private store: Record<string, Record<string, Participant[]>>;
  private onSaveStore?: (store: Record<string, Record<string, Participant[]>>) => void;

  constructor(
    initialStore?: Record<string, Record<string, Participant[]>>,
    onSaveStore?: (store: Record<string, Record<string, Participant[]>>) => void
  ) {
    this.store = initialStore ? structuredClone(initialStore) : structuredClone(MOCK_PARTICIPANTS);
    this.onSaveStore = onSaveStore;
  }

  async getParticipants(
    context: ParticipantQueryContext,
    filters?: ParticipantFilters
  ): Promise<Participant[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    const studyParticipants = this.store[context.studyId];
    if (!studyParticipants) return [];

    const siteParticipants = studyParticipants[context.siteId];
    if (!siteParticipants) return [];

    let results = siteParticipants;

    if (filters) {
      // 1. Search filter: case-insensitive match on participantCode, screeningCode, or initials
      if (filters.search && filters.search.trim().length > 0) {
        const query = filters.search.trim().toLowerCase();
        results = results.filter(
          (p) =>
            p.participantCode.toLowerCase().includes(query) ||
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
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyParticipants = this.store[context.studyId];
    if (!studyParticipants) return null;

    const siteParticipants = studyParticipants[context.siteId];
    if (!siteParticipants) return null;

    const found = siteParticipants.find(
      (p) =>
        p.id.toLowerCase() === participantId.toLowerCase() ||
        p.participantCode.toLowerCase() === participantId.toLowerCase()
    );

    return found ? structuredClone(found) : null;
  }

  async getParticipantSummary(context: ParticipantQueryContext): Promise<ParticipantSummaryMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 30));

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
    if (!this.store[context.studyId]) {
      this.store[context.studyId] = {};
    }
    if (!this.store[context.studyId][context.siteId]) {
      this.store[context.studyId][context.siteId] = [];
    }

    const siteParticipants = this.store[context.studyId][context.siteId];
    const count = siteParticipants.length + 1;
    const participantId = input.participantId || `PT-${context.studyId.replace('STUDY-', '')}${context.siteId.replace('SITE-', '')}-${String(count).padStart(2, '0')}`;

    const newParticipant: Participant = {
      id: participantId,
      participantCode: input.participantCode || participantId,
      screeningCode: input.screeningNumber || `SCR-${String(count).padStart(3, '0')}`,
      initials: input.initials || 'P.T.',
      age: input.demographics?.age || 40,
      sex: input.demographics?.gender === 'MALE' ? 'M' : input.demographics?.gender === 'FEMALE' ? 'F' : 'Other',
      screeningDate: input.screeningDate || new Date().toISOString().slice(0, 10),
      enrollmentDate: input.enrollmentDate || new Date().toISOString().slice(0, 10),
      status: input.status || 'ENROLLED',
      phase: 'Phase II',
      studyId: context.studyId,
      siteId: context.siteId,
      assignedCoordinatorId: 'USR-103',
      assignedCoordinatorName: 'Pratibha Joshi',
      lastActivityDate: new Date().toISOString().slice(0, 10),
      lastActivityName: 'Screening Evaluation',
      nextActivityDate: null,
      nextActivityName: null,
      attentionRequired: false,
      attentionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    siteParticipants.push(newParticipant);
    this.onSaveStore?.(this.store);
    return structuredClone(newParticipant);
  }
}

export const mockParticipantRepository = new MockParticipantRepository();
