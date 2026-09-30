/**
 * Audit Logging Service
 * 
 * Captures ICH-GCP compliant operational audit logs across CTMS workflows.
 * Never stores plaintext passwords, secrets, or OTP tokens in audit events.
 */
import { environmentService } from './environmentService';
import { AuditLogEvent } from '../types';

export class AuditService {
  async logEvent(event: Omit<AuditLogEvent, 'id' | 'timestamp'>): Promise<AuditLogEvent | null> {
    const repo = environmentService.getAuditRepository();
    if (!repo) {
      return null;
    }

    // Safety check: sanitize any sensitive keys from metadata
    const sanitizedMetadata: Record<string, unknown> = {};
    if (event.metadata) {
      for (const [key, value] of Object.entries(event.metadata)) {
        if (/password|secret|token|otp|credential|pin/i.test(key)) {
          sanitizedMetadata[key] = '[REDACTED]';
        } else {
          sanitizedMetadata[key] = value;
        }
      }
    }

    return repo.logEvent({
      ...event,
      metadata: sanitizedMetadata,
    });
  }

  async getEvents(context: { studyId: string; siteId: string }): Promise<AuditLogEvent[]> {
    const repo = environmentService.getAuditRepository();
    if (!repo) return [];
    return repo.getEvents(context);
  }
}

export const auditService = new AuditService();
