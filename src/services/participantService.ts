import { IParticipantRepository, ParticipantQueryContext } from '../repositories/interfaces';
import { mockParticipantRepository } from '../repositories/mockParticipantRepository';
import { Participant, ParticipantFilters, ParticipantSummaryMetrics } from '../types';

export class ParticipantService {
  private repo: IParticipantRepository;

  constructor(repository: IParticipantRepository = mockParticipantRepository) {
    this.repo = repository;
  }

  async getParticipants(
    context: ParticipantQueryContext,
    filters?: ParticipantFilters
  ): Promise<Participant[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.getParticipants(context, filters);
  }

  async getParticipant(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<Participant | null> {
    if (!context.studyId || !context.siteId || !participantId) {
      return null;
    }
    return this.repo.getParticipantById(context, participantId);
  }

  async getParticipantSummary(context: ParticipantQueryContext): Promise<ParticipantSummaryMetrics> {
    if (!context.studyId || !context.siteId) {
      return {
        total: 0,
        screening: 0,
        enrolled: 0,
        active: 0,
        completed: 0,
        withdrawn: 0,
        screenFailed: 0,
        attentionRequired: 0,
      };
    }
    return this.repo.getParticipantSummary(context);
  }
}

export const participantService = new ParticipantService();
