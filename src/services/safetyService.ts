import { ISafetyRepository, ParticipantQueryContext } from '../repositories/interfaces';
import { mockSafetyRepository } from '../repositories/mockSafetyRepository';
import {
  SafetyEvent,
  SafetyFilters,
  SafetySummaryMetrics,
  PIReviewStatus,
  FollowUpStatus,
  ParticipantSafetySummary,
} from '../types';

export class SafetyService {
  private repo: ISafetyRepository;

  constructor(repository: ISafetyRepository = mockSafetyRepository) {
    this.repo = repository;
  }

  async getSafetyEvents(
    context: ParticipantQueryContext,
    filters?: SafetyFilters
  ): Promise<SafetyEvent[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.getSafetyEvents(context, filters);
  }

  async getSafetyEventById(
    context: ParticipantQueryContext,
    eventId: string
  ): Promise<SafetyEvent | null> {
    if (!context.studyId || !context.siteId || !eventId) {
      return null;
    }
    return this.repo.getSafetyEventById(context, eventId);
  }

  async getParticipantSafetyEvents(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<SafetyEvent[]> {
    if (!context.studyId || !context.siteId || !participantId) {
      return [];
    }
    return this.repo.getParticipantSafetyEvents(context, participantId);
  }

  async getParticipantSafetySummary(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<ParticipantSafetySummary> {
    const events = await this.getParticipantSafetyEvents(context, participantId);
    const totalEvents = events.length;
    const aeCount = events.filter((e) => e.eventType === 'AE').length;
    const saeCount = events.filter((e) => e.eventType === 'SAE').length;
    const ongoingCount = events.filter((e) => e.ongoing).length;
    const piReviewRequiredCount = events.filter(
      (e) => e.piReviewStatus === 'NOT_REVIEWED' || e.piReviewStatus === 'SIGN_OFF_REQUIRED'
    ).length;

    return {
      totalEvents,
      aeCount,
      saeCount,
      ongoingCount,
      piReviewRequiredCount,
      events,
    };
  }

  async getSafetySummary(context: ParticipantQueryContext): Promise<SafetySummaryMetrics> {
    if (!context.studyId || !context.siteId) {
      return {
        total: 0,
        ae: 0,
        sae: 0,
        ongoing: 0,
        resolved: 0,
        piReviewRequired: 0,
        followUpDue: 0,
        overdueFollowUp: 0,
      };
    }
    return this.repo.getSafetySummary(context);
  }

  async updatePIReviewStatus(
    context: ParticipantQueryContext,
    eventId: string,
    status: PIReviewStatus,
    reviewedBy?: string
  ): Promise<SafetyEvent | null> {
    if (!context.studyId || !context.siteId || !eventId) {
      return null;
    }
    return this.repo.updatePIReviewStatus(context, eventId, status, reviewedBy);
  }

  async updateFollowUpStatus(
    context: ParticipantQueryContext,
    eventId: string,
    status: FollowUpStatus,
    notes?: string
  ): Promise<SafetyEvent | null> {
    if (!context.studyId || !context.siteId || !eventId || !this.repo.updateFollowUpStatus) {
      return null;
    }
    return this.repo.updateFollowUpStatus(context, eventId, status, notes);
  }

  /**
   * Determine whether an event requires operational attention by the PI.
   * Derived from event workflow state, not automated medical diagnosis.
   */
  isAttentionRequired(event: SafetyEvent): boolean {
    return (
      event.piReviewStatus === 'SIGN_OFF_REQUIRED' ||
      event.piReviewStatus === 'NOT_REVIEWED' ||
      event.followUpStatus === 'OVERDUE' ||
      event.followUpStatus === 'DUE' ||
      (event.eventType === 'SAE' && event.status !== 'RESOLVED' && event.status !== 'CLOSED')
    );
  }
}

export const safetyService = new SafetyService();
