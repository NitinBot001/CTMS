import { IComplianceRepository, ParticipantQueryContext } from './interfaces';
import {
  ProtocolDeviation,
  DeviationFilters,
  ComplianceSummaryMetrics,
  DeviationStatus,
  ComplianceReviewStatus,
  CapaStatus,
} from '../types';
import { MOCK_PROTOCOL_DEVIATIONS } from '../data/mockData';
import { getReferenceDate, parseDateISO } from '../utils/visitCalculations';

export class MockComplianceRepository implements IComplianceRepository {
  private deviationStore: Record<string, Record<string, ProtocolDeviation[]>>;

  constructor() {
    this.deviationStore = structuredClone(MOCK_PROTOCOL_DEVIATIONS);
  }

  async getDeviations(
    context: ParticipantQueryContext,
    filters?: DeviationFilters
  ): Promise<ProtocolDeviation[]> {
    await new Promise((resolve) => setTimeout(resolve, 40));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return [];

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return [];

    let results = [...siteDeviations];
    const refDateStr = getReferenceDate();

    if (filters) {
      // 1. Search filter: ID, title, description, participantId, protocolSection, category, reportedBy
      if (filters.search && filters.search.trim().length > 0) {
        const query = filters.search.trim().toLowerCase();
        results = results.filter(
          (d) =>
            d.id.toLowerCase().includes(query) ||
            d.title.toLowerCase().includes(query) ||
            d.description.toLowerCase().includes(query) ||
            (d.participantId && d.participantId.toLowerCase().includes(query)) ||
            (d.protocolSection && d.protocolSection.toLowerCase().includes(query)) ||
            d.category.toLowerCase().includes(query) ||
            d.reportedBy.toLowerCase().includes(query)
        );
      }

      // 2. Scope filter: PARTICIPANT, SITE, STUDY
      if (filters.scope && filters.scope !== 'ALL') {
        results = results.filter((d) => d.scope === filters.scope);
      }

      // 3. Classification filter: MINOR, MAJOR, CRITICAL
      if (filters.classification && filters.classification !== 'ALL') {
        results = results.filter((d) => d.classification === filters.classification);
      }

      // 4. Status filter
      if (filters.status && filters.status !== 'ALL') {
        results = results.filter((d) => d.status === filters.status);
      }

      // 5. CAPA status filter
      if (filters.capaStatus && filters.capaStatus !== 'ALL') {
        results = results.filter((d) => d.capaStatus === filters.capaStatus);
      }

      // 6. Review status filter
      if (filters.reviewStatus && filters.reviewStatus !== 'ALL') {
        results = results.filter((d) => d.reviewStatus === filters.reviewStatus);
      }

      // 7. Category filter
      if (filters.category && filters.category !== 'ALL') {
        results = results.filter((d) => d.category === filters.category);
      }

      // 8. Participant filter
      if (filters.participantId && filters.participantId !== 'ALL') {
        results = results.filter(
          (d) => d.participantId && d.participantId.toLowerCase() === filters.participantId!.toLowerCase()
        );
      }

      // 9. Date Range filter
      if (filters.dateRange && filters.dateRange !== 'ALL') {
        const refParsed = parseDateISO(refDateStr);

        if (filters.dateRange === 'CAPA_PENDING') {
          results = results.filter((d) => d.capaStatus === 'PENDING' || d.capaStatus === 'IN_PROGRESS');
        } else if (filters.dateRange === 'CAPA_OVERDUE') {
          results = results.filter((d) => d.capaStatus === 'OVERDUE');
        } else if (filters.dateRange === 'LAST_7_DAYS') {
          const sevenDaysPrior = new Date(refParsed.getTime());
          sevenDaysPrior.setUTCDate(sevenDaysPrior.getUTCDate() - 7);
          const sevenDaysPriorStr = sevenDaysPrior.toISOString().slice(0, 10);
          results = results.filter(
            (d) => d.occurrenceDate >= sevenDaysPriorStr && d.occurrenceDate <= refDateStr
          );
        } else if (filters.dateRange === 'LAST_30_DAYS') {
          const thirtyDaysPrior = new Date(refParsed.getTime());
          thirtyDaysPrior.setUTCDate(thirtyDaysPrior.getUTCDate() - 30);
          const thirtyDaysPriorStr = thirtyDaysPrior.toISOString().slice(0, 10);
          results = results.filter(
            (d) => d.occurrenceDate >= thirtyDaysPriorStr && d.occurrenceDate <= refDateStr
          );
        }
      }
    }

    // Sort: CRITICAL first, then MAJOR, then MINOR, and within each by occurrenceDate descending
    const classificationOrder: Record<string, number> = {
      CRITICAL: 0,
      MAJOR: 1,
      MINOR: 2,
    };

    results.sort((a, b) => {
      const orderA = classificationOrder[a.classification] ?? 3;
      const orderB = classificationOrder[b.classification] ?? 3;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return b.occurrenceDate.localeCompare(a.occurrenceDate);
    });

    return structuredClone(results);
  }

  async getDeviationById(
    context: ParticipantQueryContext,
    deviationId: string
  ): Promise<ProtocolDeviation | null> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return null;

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return null;

    const found = siteDeviations.find((d) => d.id.toLowerCase() === deviationId.toLowerCase());
    return found ? structuredClone(found) : null;
  }

  async getParticipantDeviations(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<ProtocolDeviation[]> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return [];

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return [];

    const participantDeviations = siteDeviations
      .filter(
        (d) => d.participantId && d.participantId.toLowerCase() === participantId.toLowerCase()
      )
      .sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate));

    return structuredClone(participantDeviations);
  }

  async getVisitDeviations(
    context: ParticipantQueryContext,
    visitId: string
  ): Promise<ProtocolDeviation[]> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return [];

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return [];

    const visitDeviations = siteDeviations
      .filter((d) => d.visitId && d.visitId.toLowerCase() === visitId.toLowerCase())
      .sort((a, b) => b.occurrenceDate.localeCompare(a.occurrenceDate));

    return structuredClone(visitDeviations);
  }

  async getComplianceSummary(
    context: ParticipantQueryContext
  ): Promise<ComplianceSummaryMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) {
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

    const siteDeviations = studyDeviations[context.siteId] || [];

    const total = siteDeviations.length;
    const open = siteDeviations.filter(
      (d) => d.status !== 'RESOLVED' && d.status !== 'CLOSED'
    ).length;
    const critical = siteDeviations.filter((d) => d.classification === 'CRITICAL').length;
    const major = siteDeviations.filter((d) => d.classification === 'MAJOR').length;
    const minor = siteDeviations.filter((d) => d.classification === 'MINOR').length;
    const piReviewRequired = siteDeviations.filter(
      (d) => d.reviewStatus === 'SIGN_OFF_REQUIRED' || d.reviewStatus === 'NOT_REVIEWED'
    ).length;
    const capaPending = siteDeviations.filter(
      (d) => d.capaStatus === 'PENDING' || d.capaStatus === 'IN_PROGRESS'
    ).length;
    const capaOverdue = siteDeviations.filter((d) => d.capaStatus === 'OVERDUE').length;
    const resolvedOrClosed = siteDeviations.filter(
      (d) => d.status === 'RESOLVED' || d.status === 'CLOSED'
    ).length;

    return {
      total,
      open,
      critical,
      major,
      minor,
      piReviewRequired,
      capaPending,
      capaOverdue,
      resolvedOrClosed,
    };
  }

  async updateDeviationStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    status: DeviationStatus
  ): Promise<ProtocolDeviation | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return null;

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return null;

    const deviation = siteDeviations.find((d) => d.id.toLowerCase() === deviationId.toLowerCase());
    if (!deviation) return null;

    deviation.status = status;
    deviation.updatedAt = new Date().toISOString();

    if (status === 'RESOLVED') {
      deviation.resolvedAt = deviation.updatedAt;
    } else if (status === 'CLOSED') {
      if (!deviation.resolvedAt) deviation.resolvedAt = deviation.updatedAt;
      deviation.closedAt = deviation.updatedAt;
    }

    return structuredClone(deviation);
  }

  async updateReviewStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    reviewStatus: ComplianceReviewStatus,
    reviewedBy: string = 'Dr. Ananya Sharma (PI)'
  ): Promise<ProtocolDeviation | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return null;

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return null;

    const deviation = siteDeviations.find((d) => d.id.toLowerCase() === deviationId.toLowerCase());
    if (!deviation) return null;

    deviation.reviewStatus = reviewStatus;
    deviation.updatedAt = new Date().toISOString();

    if (reviewStatus === 'REVIEWED') {
      deviation.reviewedBy = reviewedBy;
      deviation.reviewedAt = deviation.updatedAt;
    }

    return structuredClone(deviation);
  }

  async updateCapaStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    capaStatus: CapaStatus,
    summary?: string
  ): Promise<ProtocolDeviation | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyDeviations = this.deviationStore[context.studyId];
    if (!studyDeviations) return null;

    const siteDeviations = studyDeviations[context.siteId];
    if (!siteDeviations) return null;

    const deviation = siteDeviations.find((d) => d.id.toLowerCase() === deviationId.toLowerCase());
    if (!deviation) return null;

    deviation.capaStatus = capaStatus;
    if (summary) {
      deviation.capaActionSummary = summary;
    }
    deviation.updatedAt = new Date().toISOString();

    // If CAPA is moved to COMPLETED, allow deviation to be moved to RESOLVED if currently in CAPA_IN_PROGRESS
    if (capaStatus === 'COMPLETED' && deviation.status === 'CAPA_IN_PROGRESS') {
      deviation.status = 'RESOLVED';
      deviation.resolvedAt = deviation.updatedAt;
    }

    return structuredClone(deviation);
  }
}

export const mockComplianceRepository = new MockComplianceRepository();
