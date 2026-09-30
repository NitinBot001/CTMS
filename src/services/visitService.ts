import { IVisitRepository, ParticipantQueryContext, WorkflowActor } from '../repositories/interfaces';
import { environmentService } from './environmentService';
import {
  ProtocolVisitDefinition,
  ParticipantVisit,
  VisitFilters,
  VisitSummaryMetrics,
  ClinicalActivityStatus,
  CreateVisitInput,
} from '../types';
import { auditService } from './auditService';

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
    input: CreateVisitInput,
    actor?: WorkflowActor
  ): Promise<ParticipantVisit> {
    if (!context.studyId || !context.siteId) {
      throw new Error('Study and site context are required to schedule a visit.');
    }

    // Role check: Only CRC or PI can schedule visits
    if (actor) {
      const canSchedule =
        actor.effectivePermissions?.includes('VISITS_EDIT') ||
        actor.role === 'ROLE_CRC' ||
        actor.role === 'ROLE_PI';
      if (!canSchedule) {
        throw new Error('You do not have permission to schedule clinical visits.');
      }
    }

    // Validation: Participant must exist and belong to scope
    const participantRepo = environmentService.getParticipantRepository();
    const participant = await participantRepo.getParticipantById(context, input.participantId);
    if (!participant) {
      throw new Error(`Participant "${input.participantId}" not found in current study/site scope.`);
    }

    if (!input.plannedDate) {
      throw new Error('Target planned date is required to schedule a visit.');
    }

    if (!this.repo.createVisit) {
      throw new Error('Visit creation not supported by current repository.');
    }

    let protocolVersionId = input.protocolVersionId;
    let protocolVersionNumber = input.protocolVersionNumber;

    if (!protocolVersionId || !protocolVersionNumber) {
      try {
        const protocolRepo = environmentService.getProtocolRepository();
        const activeVersion = await protocolRepo.getActiveProtocolVersion(context.studyId);
        if (activeVersion) {
          if (!protocolVersionId) protocolVersionId = activeVersion.id;
          if (!protocolVersionNumber) protocolVersionNumber = activeVersion.versionNumber;
        }
      } catch {
        // Fallback gracefully
      }
    }

    const visitInput: CreateVisitInput = {
      ...input,
      protocolVersionId,
      protocolVersionNumber,
    };

    const created = await this.repo.createVisit(context, visitInput);

    // Audit Logging
    await auditService.logEvent({
      actorUserId: actor?.userId || 'SYSTEM_OPERATOR',
      actorRole: actor?.role || 'ROLE_CRC',
      studyId: context.studyId,
      siteId: context.siteId,
      targetEntity: 'VISIT',
      action: 'VISIT_CREATED',
      metadata: {
        visitId: created.id,
        participantId: created.participantId,
        visitCode: created.visitCode,
        plannedDate: created.targetDate,
      },
    });

    return created;
  }

  async updateVisit(
    context: ParticipantQueryContext,
    visitId: string,
    updates: Partial<ParticipantVisit>,
    actor?: WorkflowActor
  ): Promise<ParticipantVisit | null> {
    if (!context.studyId || !context.siteId || !visitId) {
      throw new Error('Study, site, and visit ID are required.');
    }

    if (!this.repo.updateVisit) {
      throw new Error('Visit update not supported by current repository.');
    }

    const updated = await this.repo.updateVisit(context, visitId, updates);
    if (updated) {
      await auditService.logEvent({
        actorUserId: actor?.userId || 'SYSTEM_OPERATOR',
        actorRole: actor?.role || 'ROLE_CRC',
        studyId: context.studyId,
        siteId: context.siteId,
        targetEntity: 'VISIT',
        action: 'VISIT_UPDATED',
        metadata: {
          visitId: updated.id,
          updatedFields: Object.keys(updates),
        },
      });
    }

    return updated;
  }
}

export const visitService = new VisitService();
