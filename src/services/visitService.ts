import { IVisitRepository, ParticipantQueryContext } from '../repositories/interfaces';
import { environmentService } from './environmentService';
import {
  ProtocolVisitDefinition,
  ParticipantVisit,
  VisitFilters,
  VisitSummaryMetrics,
  ClinicalActivityStatus,
  CreateVisitInput,
} from '../types';

export class VisitService {
  private _customRepo?: IVisitRepository;

  constructor(repository?: IVisitRepository) {
    this._customRepo = repository;
  }

  private get repo(): IVisitRepository {
    return this._customRepo || environmentService.getVisitRepository();
  }

  async getProtocolVisits(studyId: string): Promise<ProtocolVisitDefinition[]> {
    if (!studyId) return [];
    return this.repo.getProtocolVisits(studyId);
  }

  async getVisits(
    context: ParticipantQueryContext,
    filters?: VisitFilters
  ): Promise<ParticipantVisit[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.getVisits(context, filters);
  }

  async getParticipantVisits(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<ParticipantVisit[]> {
    if (!context.studyId || !context.siteId || !participantId) {
      return [];
    }
    return this.repo.getParticipantVisits(context, participantId);
  }

  async getVisitById(
    context: ParticipantQueryContext,
    visitId: string
  ): Promise<ParticipantVisit | null> {
    if (!context.studyId || !context.siteId || !visitId) {
      return null;
    }
    return this.repo.getVisitById(context, visitId);
  }

  async getVisitSummary(context: ParticipantQueryContext): Promise<VisitSummaryMetrics> {
    if (!context.studyId || !context.siteId) {
      return {
        total: 0,
        due: 0,
        upcoming: 0,
        overdue: 0,
        completed: 0,
        missed: 0,
      };
    }
    return this.repo.getVisitSummary(context);
  }

  async updateActivityStatus(
    context: ParticipantQueryContext,
    visitId: string,
    activityId: string,
    status: ClinicalActivityStatus
  ): Promise<ParticipantVisit | null> {
    if (!context.studyId || !context.siteId || !visitId || !activityId || !this.repo.updateVisitActivityStatus) {
      return null;
    }
    return this.repo.updateVisitActivityStatus(context, visitId, activityId, status);
  }

  async createVisit(
    context: ParticipantQueryContext,
    input: CreateVisitInput
  ): Promise<ParticipantVisit> {
    if (!context.studyId || !context.siteId) {
      throw new Error('Study and site context are required to schedule a visit.');
    }
    if (!this.repo.createVisit) {
      throw new Error('Visit creation not supported by current repository.');
    }
    return this.repo.createVisit(context, input);
  }
}

export const visitService = new VisitService();
