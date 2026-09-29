import { ISafetyRepository, ParticipantQueryContext } from './interfaces';
import {
  SafetyEvent,
  SafetyFilters,
  SafetySummaryMetrics,
  PIReviewStatus,
  FollowUpStatus,
} from '../types';
import { MOCK_SAFETY_EVENTS } from '../data/mockData';
import { getReferenceDate, parseDateISO } from '../utils/visitCalculations';

export class MockSafetyRepository implements ISafetyRepository {
  private safetyStore: Record<string, Record<string, SafetyEvent[]>>;
  private onSaveStore?: (store: Record<string, Record<string, SafetyEvent[]>>) => void;

  constructor(
    initialSafety?: Record<string, Record<string, SafetyEvent[]>>,
    onSaveStore?: (store: Record<string, Record<string, SafetyEvent[]>>) => void
  ) {
    this.safetyStore = initialSafety ? structuredClone(initialSafety) : structuredClone(MOCK_SAFETY_EVENTS);
    this.onSaveStore = onSaveStore;
  }

  async getSafetyEvents(
    context: ParticipantQueryContext,
    filters?: SafetyFilters
  ): Promise<SafetyEvent[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    const studyEvents = this.safetyStore[context.studyId];
    if (!studyEvents) return [];

    const siteEvents = studyEvents[context.siteId];
    if (!siteEvents) return [];

    let results = [...siteEvents];
    const refDateStr = getReferenceDate();

    if (filters) {
      // 1. Search filter: event ID, title, participant code, initials, reportedBy
      if (filters.search && filters.search.trim().length > 0) {
        const query = filters.search.trim().toLowerCase();
        results = results.filter(
          (e) =>
            e.id.toLowerCase().includes(query) ||
            e.title.toLowerCase().includes(query) ||
            e.participantCode.toLowerCase().includes(query) ||
            e.participantInitials.toLowerCase().includes(query) ||
            e.reportedBy.toLowerCase().includes(query)
        );
      }

      // 2. Event Type filter: AE vs SAE
      if (filters.eventType && filters.eventType !== 'ALL') {
        results = results.filter((e) => e.eventType === filters.eventType);
      }

      // 3. Status filter
      if (filters.status && filters.status !== 'ALL') {
        results = results.filter((e) => e.status === filters.status);
      }

      // 4. Severity filter
      if (filters.severity && filters.severity !== 'ALL') {
        results = results.filter((e) => e.severity === filters.severity);
      }

      // 5. Seriousness filter
      if (filters.seriousness && filters.seriousness !== 'ALL') {
        results = results.filter((e) => e.seriousness === filters.seriousness);
      }

      // 6. PI Review Status filter
      if (filters.piReviewStatus && filters.piReviewStatus !== 'ALL') {
        results = results.filter((e) => e.piReviewStatus === filters.piReviewStatus);
      }

      // 7. Follow-up status filter
      if (filters.followUpStatus && filters.followUpStatus !== 'ALL') {
        results = results.filter((e) => e.followUpStatus === filters.followUpStatus);
      }

      // 8. Participant ID filter
      if (filters.participantId && filters.participantId !== 'ALL') {
        results = results.filter(
          (e) =>
            e.participantId.toLowerCase() === filters.participantId!.toLowerCase() ||
            e.participantCode.toLowerCase() === filters.participantId!.toLowerCase()
        );
      }

      // 9. Date Range filter relative to reference operational date
      if (filters.dateRange && filters.dateRange !== 'ALL') {
        const refParsed = parseDateISO(refDateStr);

        if (filters.dateRange === 'ONGOING') {
          results = results.filter((e) => e.ongoing);
        } else if (filters.dateRange === 'OVERDUE_FOLLOWUP') {
          results = results.filter((e) => e.followUpStatus === 'OVERDUE');
        } else if (filters.dateRange === 'LAST_7_DAYS') {
          const sevenDaysPrior = new Date(refParsed.getTime());
          sevenDaysPrior.setUTCDate(sevenDaysPrior.getUTCDate() - 7);
          const sevenDaysPriorStr = sevenDaysPrior.toISOString().slice(0, 10);
          results = results.filter(
            (e) => e.onsetDate >= sevenDaysPriorStr && e.onsetDate <= refDateStr
          );
        } else if (filters.dateRange === 'LAST_30_DAYS') {
          const thirtyDaysPrior = new Date(refParsed.getTime());
          thirtyDaysPrior.setUTCDate(thirtyDaysPrior.getUTCDate() - 30);
          const thirtyDaysPriorStr = thirtyDaysPrior.toISOString().slice(0, 10);
          results = results.filter(
            (e) => e.onsetDate >= thirtyDaysPriorStr && e.onsetDate <= refDateStr
          );
        }
      }
    }

    // Sort by onsetDate descending, and SAEs first
    results.sort((a, b) => {
      if (a.eventType !== b.eventType) {
        return a.eventType === 'SAE' ? -1 : 1;
      }
      return b.onsetDate.localeCompare(a.onsetDate);
    });

    return structuredClone(results);
  }

  async getSafetyEventById(
    context: ParticipantQueryContext,
    eventId: string
  ): Promise<SafetyEvent | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyEvents = this.safetyStore[context.studyId];
    if (!studyEvents) return null;

    const siteEvents = studyEvents[context.siteId];
    if (!siteEvents) return null;

    const found = siteEvents.find((e) => e.id.toLowerCase() === eventId.toLowerCase());
    return found ? structuredClone(found) : null;
  }

  async getParticipantSafetyEvents(
    context: ParticipantQueryContext,
    participantId: string
  ): Promise<SafetyEvent[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyEvents = this.safetyStore[context.studyId];
    if (!studyEvents) return [];

    const siteEvents = studyEvents[context.siteId];
    if (!siteEvents) return [];

    const participantEvents = siteEvents
      .filter(
        (e) =>
          e.participantId.toLowerCase() === participantId.toLowerCase() ||
          e.participantCode.toLowerCase() === participantId.toLowerCase()
      )
      .sort((a, b) => b.onsetDate.localeCompare(a.onsetDate));

    return structuredClone(participantEvents);
  }

  async getSafetySummary(context: ParticipantQueryContext): Promise<SafetySummaryMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyEvents = this.safetyStore[context.studyId];
    const siteEvents = studyEvents?.[context.siteId] || [];

    const total = siteEvents.length;
    const ae = siteEvents.filter((e) => e.eventType === 'AE').length;
    const sae = siteEvents.filter((e) => e.eventType === 'SAE').length;
    const ongoing = siteEvents.filter((e) => e.ongoing).length;
    const resolved = siteEvents.filter((e) => e.status === 'RESOLVED' || e.status === 'CLOSED').length;
    const piReviewRequired = siteEvents.filter(
      (e) => e.piReviewStatus === 'NOT_REVIEWED' || e.piReviewStatus === 'SIGN_OFF_REQUIRED'
    ).length;
    const followUpDue = siteEvents.filter((e) => e.followUpStatus === 'DUE').length;
    const overdueFollowUp = siteEvents.filter((e) => e.followUpStatus === 'OVERDUE').length;

    return {
      total,
      ae,
      sae,
      ongoing,
      resolved,
      piReviewRequired,
      followUpDue,
      overdueFollowUp,
    };
  }

  async updatePIReviewStatus(
    context: ParticipantQueryContext,
    eventId: string,
    status: PIReviewStatus,
    reviewedBy?: string
  ): Promise<SafetyEvent | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyEvents = this.safetyStore[context.studyId];
    if (!studyEvents) return null;

    const siteEvents = studyEvents[context.siteId];
    if (!siteEvents) return null;

    const event = siteEvents.find((e) => e.id.toLowerCase() === eventId.toLowerCase());
    if (!event) return null;

    event.piReviewStatus = status;
    const refDate = getReferenceDate();

    if (status === 'REVIEWED') {
      event.reviewedBy = reviewedBy || 'Dr. Ananya Sharma (PI)';
      event.reviewedAt = `${refDate}T12:00:00Z`;
      if (event.status === 'PI_REVIEW_REQUIRED') {
        event.status = event.ongoing ? 'UNDER_REVIEW' : 'RESOLVED';
      }
    } else if (status === 'NOT_REVIEWED') {
      event.reviewedBy = null;
      event.reviewedAt = null;
    }

    event.lastUpdatedAt = `${refDate}T12:00:00Z`;
    this.onSaveStore?.(this.safetyStore);
    return structuredClone(event);
  }

  async updateFollowUpStatus(
    context: ParticipantQueryContext,
    eventId: string,
    status: FollowUpStatus,
    notes?: string
  ): Promise<SafetyEvent | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const studyEvents = this.safetyStore[context.studyId];
    if (!studyEvents) return null;

    const siteEvents = studyEvents[context.siteId];
    if (!siteEvents) return null;

    const event = siteEvents.find((e) => e.id.toLowerCase() === eventId.toLowerCase());
    if (!event) return null;

    event.followUpStatus = status;
    if (notes) {
      event.followUpNotes = notes;
    }

    const refDate = getReferenceDate();
    event.lastUpdatedAt = `${refDate}T12:00:00Z`;
    this.onSaveStore?.(this.safetyStore);
    return structuredClone(event);
  }
}

export const mockSafetyRepository = new MockSafetyRepository();
