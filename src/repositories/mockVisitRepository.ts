import { IVisitRepository, ParticipantQueryContext } from './interfaces';
import {
  ProtocolVisitDefinition,
  ParticipantVisit,
  VisitFilters,
  VisitSummaryMetrics,
  ClinicalActivityStatus,
} from '../types';
import { MOCK_PROTOCOL_VISITS, MOCK_VISITS } from '../data/mockData';
import { calculateActivityMetrics, getReferenceDate, parseDateISO } from '../utils/visitCalculations';

export class MockVisitRepository implements IVisitRepository {
  // In-memory mutable copy to support interactive status updates in session
  private visitsStore: Record<string, Record<string, ParticipantVisit[]>>;

  constructor() {
    this.visitsStore = structuredClone(MOCK_VISITS);
  }

  async getProtocolVisits(studyId: string): Promise<ProtocolVisitDefinition[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const definitions = MOCK_PROTOCOL_VISITS[studyId] || [];
    return structuredClone(definitions);
  }

  async getVisits(
    context: ParticipantQueryContext,
    filters?: VisitFilters
  ): Promise<ParticipantVisit[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    const studyVisits = this.visitsStore[context.studyId];
    if (!studyVisits) return [];

    const siteVisits = studyVisits[context.siteId];
    if (!siteVisits) return [];

    let results = [...siteVisits];
    const refDate = getReferenceDate();

    if (filters) {
      // 1. Search filter: participant code, initials, visit code, visit name, assigned staff
      if (filters.search && filters.search.trim().length > 0) {
        const query = filters.search.trim().toLowerCase();
        results = results.filter(
          (v) =>
            v.participantCode.toLowerCase().includes(query) ||
            v.participantInitials.toLowerCase().includes(query) ||
            v.visitCode.toLowerCase().includes(query) ||
            v.visitName.toLowerCase().includes(query) ||
            (v.assignedStaff && v.assignedStaff.toLowerCase().includes(query))
        );
      }

      // 2. Status filter
      if (filters.status && filters.status !== 'ALL') {
        results = results.filter((v) => v.status === filters.status);
      }

      // 3. Participant ID filter
      if (filters.participantId && filters.participantId !== 'ALL') {
        results = results.filter(
          (v) =>
            v.participantId.toLowerCase() === filters.participantId!.toLowerCase() ||
            v.participantCode.toLowerCase() === filters.participantId!.toLowerCase()
        );
      }

      // 4. Visit Code filter
      if (filters.visitCode && filters.visitCode !== 'ALL') {
        results = results.filter((v) => v.visitCode === filters.visitCode);
      }

      // 5. Date Range filter relative to referenceDate
      if (filters.dateRange && filters.dateRange !== 'ALL') {
        const refParsed = parseDateISO(refDate);
        const refYear = refParsed.getUTCFullYear();
        const refMonth = refParsed.getUTCMonth();

        if (filters.dateRange === 'TODAY') {
          results = results.filter(
            (v) => v.targetDate === refDate || (refDate >= v.windowStart && refDate <= v.windowEnd)
          );
        } else if (filters.dateRange === 'NEXT_7_DAYS') {
          const sevenDaysLater = new Date(refParsed.getTime());
          sevenDaysLater.setUTCDate(sevenDaysLater.getUTCDate() + 7);
          const sevenDaysLaterStr = sevenDaysLater.toISOString().slice(0, 10);
          results = results.filter(
            (v) => v.targetDate >= refDate && v.targetDate <= sevenDaysLaterStr
          );
        } else if (filters.dateRange === 'OVERDUE') {
          results = results.filter((v) => v.status === 'OVERDUE');
        } else if (filters.dateRange === 'THIS_MONTH') {
          results = results.filter((v) => {
            const parsed = parseDateISO(v.targetDate);
            return parsed.getUTCFullYear() === refYear && parsed.getUTCMonth() === refMonth;
          });
        }
      }
    }

    // Sort by sequence then targetDate
    results.sort((a, b) => {
      if (a.targetDate !== b.targetDate) {
        return a.targetDate.localeCompare(b.targetDate);
      }
      return a.sequence - b.sequence;
    });

    return structuredClone(results);
  }

  async getParticipantVisits(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<ParticipantVisit[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyVisits = this.visitsStore[context.studyId];
    if (!studyVisits) return [];

    const siteVisits = studyVisits[context.siteId];
    if (!siteVisits) return [];

    const participantVisits = siteVisits
      .filter(
        (v) =>
          v.participantId.toLowerCase() === participantId.toLowerCase() ||
          v.participantCode.toLowerCase() === participantId.toLowerCase()
      )
      .sort((a, b) => a.sequence - b.sequence);

    return structuredClone(participantVisits);
  }

  async getVisitById(
    context: ParticipantQueryContext,
    visitId: string
  ): Promise<ParticipantVisit | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyVisits = this.visitsStore[context.studyId];
    if (!studyVisits) return null;

    const siteVisits = studyVisits[context.siteId];
    if (!siteVisits) return null;

    const found = siteVisits.find((v) => v.id.toLowerCase() === visitId.toLowerCase());
    return found ? structuredClone(found) : null;
  }

  async getVisitSummary(context: ParticipantQueryContext): Promise<VisitSummaryMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyVisits = this.visitsStore[context.studyId];
    const siteVisits = studyVisits?.[context.siteId] || [];

    const total = siteVisits.length;
    const due = siteVisits.filter((v) => v.status === 'DUE' || v.status === 'IN_PROGRESS').length;
    const upcoming = siteVisits.filter((v) => v.status === 'SCHEDULED').length;
    const overdue = siteVisits.filter((v) => v.status === 'OVERDUE').length;
    const completed = siteVisits.filter((v) => v.status === 'COMPLETED').length;
    const missed = siteVisits.filter((v) => v.status === 'MISSED').length;

    return {
      total,
      due,
      upcoming,
      overdue,
      completed,
      missed,
    };
  }

  async updateVisitActivityStatus(
    context: ParticipantQueryContext,
    visitId: string,
    activityId: string,
    status: ClinicalActivityStatus
  ): Promise<ParticipantVisit | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyVisits = this.visitsStore[context.studyId];
    if (!studyVisits) return null;

    const siteVisits = studyVisits[context.siteId];
    if (!siteVisits) return null;

    const visit = siteVisits.find((v) => v.id.toLowerCase() === visitId.toLowerCase());
    if (!visit) return null;

    const activity = visit.activities.find((a) => a.id === activityId);
    if (!activity) return null;

    activity.status = status;
    if (status === 'COMPLETED') {
      activity.completedAt = getReferenceDate();
      activity.completedBy = activity.completedBy || 'Current Investigator';
    } else {
      activity.completedAt = undefined;
    }

    // Recalculate activity counts
    const metrics = calculateActivityMetrics(visit.activities);
    visit.totalActivities = metrics.total;
    visit.completedActivities = metrics.completed;
    visit.pendingActivities = metrics.pending;
    visit.requiredIncompleteActivities = metrics.requiredIncomplete;

    // If all activities completed, transition visit to completed
    if (visit.requiredIncompleteActivities === 0 && visit.completedActivities === visit.totalActivities) {
      visit.status = 'COMPLETED';
      visit.completedDate = getReferenceDate();
    } else if (visit.status === 'COMPLETED' && visit.requiredIncompleteActivities > 0) {
      visit.status = 'IN_PROGRESS';
      visit.completedDate = undefined;
    }

    return structuredClone(visit);
  }
}

export const mockVisitRepository = new MockVisitRepository();
