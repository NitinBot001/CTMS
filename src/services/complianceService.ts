import { IComplianceRepository, ParticipantQueryContext } from '../repositories/interfaces';
import { mockComplianceRepository } from '../repositories/mockComplianceRepository';
import {
  ProtocolDeviation,
  DeviationFilters,
  ComplianceSummaryMetrics,
  DeviationStatus,
  ComplianceReviewStatus,
  CapaStatus,
  ParticipantComplianceSummary,
  isValidDeviationStatusTransition,
} from '../types';

export class ComplianceService {
  private repo: IComplianceRepository;

  constructor(repository: IComplianceRepository = mockComplianceRepository) {
    this.repo = repository;
  }

  async getDeviations(
    context: ParticipantQueryContext,
    filters?: DeviationFilters
  ): Promise<ProtocolDeviation[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.getDeviations(context, filters);
  }

  async getDeviationById(
    context: ParticipantQueryContext,
    deviationId: string
  ): Promise<ProtocolDeviation | null> {
    if (!context.studyId || !context.siteId || !deviationId) {
      return null;
    }
    return this.repo.getDeviationById(context, deviationId);
  }

  async getParticipantDeviations(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<ProtocolDeviation[]> {
    if (!context.studyId || !context.siteId || !participantId) {
      return [];
    }
    return this.repo.getParticipantDeviations(context, participantId);
  }

  async getParticipantComplianceSummary(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<ParticipantComplianceSummary> {
    const deviations = await this.getParticipantDeviations(context, participantId);
    const totalDeviations = deviations.length;
    const criticalCount = deviations.filter((d) => d.classification === 'CRITICAL').length;
    const majorCount = deviations.filter((d) => d.classification === 'MAJOR').length;
    const minorCount = deviations.filter((d) => d.classification === 'MINOR').length;
    const openCount = deviations.filter((d) => d.status !== 'RESOLVED' && d.status !== 'CLOSED').length;

    return {
      totalDeviations,
      criticalCount,
      majorCount,
      minorCount,
      openCount,
      deviations,
    };
  }

  async getVisitDeviations(
    context: ParticipantQueryContext,
    visitId: string
  ): Promise<ProtocolDeviation[]> {
    if (!context.studyId || !context.siteId || !visitId) {
      return [];
    }
    return this.repo.getVisitDeviations(context, visitId);
  }

  async getComplianceSummary(
    context: ParticipantQueryContext
  ): Promise<ComplianceSummaryMetrics> {
    if (!context.studyId || !context.siteId) {
      return {
        total: 0,
        open: 0,
        critical: 0,
        major: 0,
        minor: 0,
        piReviewRequired: 0,
        capaPending: 0,
        capaOverdue: 0,
        resolvedOrClosed: 0,
      };
    }
    return this.repo.getComplianceSummary(context);
  }

  isValidStatusTransition(
    currentStatus: DeviationStatus,
    targetStatus: DeviationStatus
  ): boolean {
    return isValidDeviationStatusTransition(currentStatus, targetStatus);
  }

  async updateDeviationStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    status: DeviationStatus
  ): Promise<ProtocolDeviation | null> {
    if (!context.studyId || !context.siteId || !deviationId) {
      return null;
    }
    return this.repo.updateDeviationStatus(context, deviationId, status);
  }

  async updateReviewStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    reviewStatus: ComplianceReviewStatus,
    reviewedBy?: string
  ): Promise<ProtocolDeviation | null> {
    if (!context.studyId || !context.siteId || !deviationId) {
      return null;
    }
    return this.repo.updateReviewStatus(context, deviationId, reviewStatus, reviewedBy);
  }

  async updateCapaStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    capaStatus: CapaStatus,
    summary?: string
  ): Promise<ProtocolDeviation | null> {
    if (!context.studyId || !context.siteId || !deviationId) {
      return null;
    }
    return this.repo.updateCapaStatus(context, deviationId, capaStatus, summary);
  }

  /**
   * Deterministic attention calculation:
   * A deviation requires operational attention by the PI when:
   * 1. classification === 'CRITICAL'
   * 2. reviewStatus === 'SIGN_OFF_REQUIRED'
   * 3. status === 'ACTION_REQUIRED'
   * 4. capaStatus === 'OVERDUE'
   */
  isAttentionRequired(deviation: ProtocolDeviation): boolean {
    return (
      deviation.classification === 'CRITICAL' ||
      deviation.reviewStatus === 'SIGN_OFF_REQUIRED' ||
      deviation.status === 'ACTION_REQUIRED' ||
      deviation.capaStatus === 'OVERDUE'
    );
  }
}

export const complianceService = new ComplianceService();
