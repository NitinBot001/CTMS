import {
  Document,
  DocumentExpiryState,
  DocumentStatus,
} from '../types';

export const DOCUMENT_REFERENCE_DATE = '2026-09-29';
export const EXPIRING_SOON_DAYS_THRESHOLD = 30;

/**
 * Calculates days remaining until document expiry relative to reference date.
 * Returns null if the document does not have an expiry date.
 * Returns negative number if expired.
 */
export function getDaysUntilExpiry(
  expiryDate?: string | null,
  referenceDate: string = DOCUMENT_REFERENCE_DATE
): number | null {
  if (!expiryDate) return null;

  const target = new Date(expiryDate);
  const ref = new Date(referenceDate);

  if (isNaN(target.getTime()) || isNaN(ref.getTime())) {
    return null;
  }

  // Calculate day difference using UTC midnight normalization
  const targetUtc = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const refUtc = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((targetUtc - refUtc) / msPerDay);
}

/**
 * Determines the expiry state of a document:
 * - NO_EXPIRY: Document has no expiry date
 * - EXPIRED: Expiry date is before reference date (days < 0)
 * - EXPIRING_SOON: Expiry date is within threshold days (0 <= days <= 30)
 * - ACTIVE: Expiry date is further than 30 days away (days > 30)
 */
export function calculateDocumentExpiryState(
  document: { expiryDate?: string; status?: DocumentStatus },
  referenceDate: string = DOCUMENT_REFERENCE_DATE
): DocumentExpiryState {
  if (document.status === 'ARCHIVED' || document.status === 'SUPERSEDED') {
    return 'NO_EXPIRY';
  }

  if (!document.expiryDate) {
    return 'NO_EXPIRY';
  }

  const days = getDaysUntilExpiry(document.expiryDate, referenceDate);
  if (days === null) {
    return 'NO_EXPIRY';
  }

  if (days < 0) {
    return 'EXPIRED';
  }

  if (days <= EXPIRING_SOON_DAYS_THRESHOLD) {
    return 'EXPIRING_SOON';
  }

  return 'ACTIVE';
}

/**
 * Derives the active operational status for display and indexing.
 * Preserves ARCHIVED, SUPERSEDED, and DRAFT.
 * If status is ACTIVE/EXPIRING_SOON/EXPIRED, computes based on expiry date.
 */
export function deriveDocumentStatus(
  document: { status: DocumentStatus; expiryDate?: string },
  referenceDate: string = DOCUMENT_REFERENCE_DATE
): DocumentStatus {
  if (
    document.status === 'ARCHIVED' ||
    document.status === 'SUPERSEDED' ||
    document.status === 'DRAFT'
  ) {
    return document.status;
  }

  const expiryState = calculateDocumentExpiryState(document, referenceDate);
  if (expiryState === 'EXPIRED') {
    return 'EXPIRED';
  }
  if (expiryState === 'EXPIRING_SOON') {
    return 'EXPIRING_SOON';
  }

  return 'ACTIVE';
}

/**
 * Checks if a document requires urgent operational action:
 * Required by protocol/GCP + (Currently Expired OR Missing active version OR in Draft state).
 */
export function isDocumentActionRequired(
  document: Document,
  referenceDate: string = DOCUMENT_REFERENCE_DATE
): boolean {
  if (!document.isRequired) return false;

  if (document.status === 'ARCHIVED' || document.status === 'SUPERSEDED') {
    return false;
  }

  if (document.status === 'DRAFT' || !document.currentVersionId) {
    return true;
  }

  const expiryState = calculateDocumentExpiryState(document, referenceDate);
  return expiryState === 'EXPIRED';
}
