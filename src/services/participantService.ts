import { IParticipantRepository, ParticipantQueryContext } from '../repositories/interfaces';
import { environmentService } from './environmentService';
import { Participant, ParticipantFilters, ParticipantSummaryMetrics, CreateParticipantInput } from '../types';

export class ParticipantService {
  private _customRepo?: IParticipantRepository;

  constructor(repository?: IParticipantRepository) {
    this._customRepo = repository;
  }

  private get repo(): IParticipantRepository {
    return this._customRepo || environmentService.getParticipantRepository();
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

  async createParticipant(
    context: ParticipantQueryContext,
    input: CreateParticipantInput
  ): Promise<Participant> {
    if (!context.studyId || !context.siteId) {
      throw new Error('Study and site context are required to onboard a participant.');
    }
    if (!this.repo.createParticipant) {
      throw new Error('Participant creation not supported by current repository.');
    }
    return this.repo.createParticipant(context, input);
  }
}

export const participantService = new ParticipantService();
