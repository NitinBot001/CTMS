import { IAuditRepository, ParticipantQueryContext } from './interfaces';
import { AuditLogEvent } from '../types';
import { browserStorage } from '../storage/browserStorage';

const MOCK_AUDIT_STORAGE_KEY = 'aiia_ctms_mock_audit_events';

export class MockAuditRepository implements IAuditRepository {
  private events: AuditLogEvent[];

  constructor(initialEvents?: AuditLogEvent[]) {
    this.events = initialEvents
      ? structuredClone(initialEvents)
      : browserStorage.get<AuditLogEvent[]>(MOCK_AUDIT_STORAGE_KEY, []) || [];
  }

  async getEvents(context: ParticipantQueryContext): Promise<AuditLogEvent[]> {
    return structuredClone(
      this.events.filter(
        (e) => e.studyId === context.studyId && e.siteId === context.siteId
      )
    );
  }

  async logEvent(event: Omit<AuditLogEvent, 'id' | 'timestamp'>): Promise<AuditLogEvent> {
    const newEvent: AuditLogEvent = {
      ...event,
      id: `AUD-MOCK-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.events.unshift(newEvent);
    browserStorage.set(MOCK_AUDIT_STORAGE_KEY, this.events);
    return structuredClone(newEvent);
  }
}

export const mockAuditRepository = new MockAuditRepository();
