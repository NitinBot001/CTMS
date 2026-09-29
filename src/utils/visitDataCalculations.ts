import {
  VisitDataRecord,
  VisitDataStatus,
  VisitDataFilters,
  DataEntrySummaryMetrics,
  ReviewNoteType,
  VerificationActionType,
} from '../types';

/**
 * Valid state transitions for the Clinical Visit Data Entry & Verification workflow.
 * Enforces strict, non-bypassable lifecycle rules:
 *
 * DRAFT -> SUBMITTED_FOR_VERIFICATION
 * SUBMITTED_FOR_VERIFICATION -> VERIFIED | RETURNED_FOR_CORRECTION
 * RETURNED_FOR_CORRECTION -> DRAFT | RESUBMITTED_FOR_VERIFICATION
 * RESUBMITTED_FOR_VERIFICATION -> VERIFIED | RETURNED_FOR_CORRECTION
 * VERIFIED -> PI_REVIEW | SUBMITTED_TO_CRO
 * PI_REVIEW -> SUBMITTED_TO_CRO
 * SUBMITTED_TO_CRO -> Terminal (no outbound transitions)
 */
export const VALID_WORKFLOW_TRANSITIONS: Record<VisitDataStatus, VisitDataStatus[]> = {
  DRAFT: ['SUBMITTED_FOR_VERIFICATION'],
  SUBMITTED_FOR_VERIFICATION: ['VERIFIED', 'RETURNED_FOR_CORRECTION'],
  RETURNED_FOR_CORRECTION: ['DRAFT', 'RESUBMITTED_FOR_VERIFICATION'],
  RESUBMITTED_FOR_VERIFICATION: ['VERIFIED', 'RETURNED_FOR_CORRECTION'],
  VERIFIED: ['PI_REVIEW', 'SUBMITTED_TO_CRO'],
  PI_REVIEW: ['SUBMITTED_TO_CRO'],
  SUBMITTED_TO_CRO: [], // Terminal
};

export function isValidTransition(from: VisitDataStatus, to: VisitDataStatus): boolean {
  if (from === to) return true; // Idempotent updates in same state
  const allowed = VALID_WORKFLOW_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Derives operational KPI summary metrics from a collection of visit data records.
 */
export function calculateDataEntrySummaryMetrics(
  records: VisitDataRecord[],
  referenceDateStr: string = '2026-09-29'
): DataEntrySummaryMetrics {
  let pendingDataEntry = 0;
  let enteredToday = 0;
  let pendingVerification = 0;
  let returnedForCorrection = 0;
  let documentsPending = 0;
  let verified = 0;

  for (const record of records) {
    // 1. Pending Data Entry: records in DRAFT or RETURNED_FOR_CORRECTION
    if (record.status === 'DRAFT' || record.status === 'RETURNED_FOR_CORRECTION') {
      pendingDataEntry++;
    }

    // 2. Entered Today: check if createdAt or submittedAt matches reference date
    const recordDate = record.submittedAt || record.createdAt;
    if (recordDate && recordDate.startsWith(referenceDateStr)) {
      enteredToday++;
    }

    // 3. Pending Verification: awaiting Sub-Investigator check
    if (
      record.status === 'SUBMITTED_FOR_VERIFICATION' ||
      record.status === 'RESUBMITTED_FOR_VERIFICATION'
    ) {
      pendingVerification++;
    }

    // 4. Returned for Correction: verifier found discrepancies
    if (record.status === 'RETURNED_FOR_CORRECTION') {
      returnedForCorrection++;
    }

    // 5. Documents Pending: zero source attachments uploaded
    if (record.attachments.length === 0) {
      documentsPending++;
    }

    // 6. Verified: successfully verified by verifier or advanced to PI/CRO
    if (
      record.status === 'VERIFIED' ||
      record.status === 'PI_REVIEW' ||
      record.status === 'SUBMITTED_TO_CRO'
    ) {
      verified++;
    }
  }

  return {
    pendingDataEntry,
    enteredToday,
    pendingVerification,
    returnedForCorrection,
    documentsPending,
    verified,
    totalRecords: records.length,
  };
}

/**
 * Composite filtering with case-insensitive search and multi-criteria AND semantics.
 */
export function filterVisitDataRecords(
  records: VisitDataRecord[],
  filters?: VisitDataFilters
): VisitDataRecord[] {
  if (!filters) return records;

  return records.filter((r) => {
    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      if (r.status !== filters.status) return false;
    }

    // Participant filter
    if (filters.participantId && r.participantId !== filters.participantId) {
      return false;
    }

    // Visit filter
    if (filters.visitId && r.visitId !== filters.visitId) {
      return false;
    }

    // Has attachments filter
    if (filters.hasAttachments !== undefined) {
      const has = r.attachments.length > 0;
      if (has !== filters.hasAttachments) return false;
    }

    // Search query
    if (filters.search && filters.search.trim()) {
      const query = filters.search.trim().toLowerCase();
      const match =
        r.id.toLowerCase().includes(query) ||
        r.participantCode.toLowerCase().includes(query) ||
        r.participantInitials.toLowerCase().includes(query) ||
        r.visitCode.toLowerCase().includes(query) ||
        r.visitName.toLowerCase().includes(query) ||
        r.enteredByName.toLowerCase().includes(query) ||
        (r.verifiedByName && r.verifiedByName.toLowerCase().includes(query));
      if (!match) return false;
    }

    return true;
  });
}

/**
 * UI Badging & Label Helpers
 */
export function getStatusLabel(status: VisitDataStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft (Entry In Progress)';
    case 'SUBMITTED_FOR_VERIFICATION':
      return 'Awaiting Verification';
    case 'RETURNED_FOR_CORRECTION':
      return 'Returned for Correction';
    case 'RESUBMITTED_FOR_VERIFICATION':
      return 'Resubmitted for Verification';
    case 'VERIFIED':
      return 'Verified by Sub-I';
    case 'PI_REVIEW':
      return 'Under PI Review';
    case 'SUBMITTED_TO_CRO':
      return 'Submitted to CRO';
    default:
      return status;
  }
}

export function getStatusBadgeClasses(status: VisitDataStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case 'DRAFT':
      return {
        bg: 'bg-stone-100',
        text: 'text-stone-700',
        border: 'border-stone-200',
        dot: 'bg-stone-400',
      };
    case 'SUBMITTED_FOR_VERIFICATION':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'RETURNED_FOR_CORRECTION':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
      };
    case 'RESUBMITTED_FOR_VERIFICATION':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
      };
    case 'VERIFIED':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'PI_REVIEW':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'SUBMITTED_TO_CRO':
      return {
        bg: 'bg-teal-50',
        text: 'text-teal-900',
        border: 'border-teal-200',
        dot: 'bg-teal-600',
      };
    default:
      return {
        bg: 'bg-stone-50',
        text: 'text-stone-700',
        border: 'border-stone-200',
        dot: 'bg-stone-400',
      };
  }
}

export function getNoteTypeBadgeClasses(type: ReviewNoteType): {
  bg: string;
  text: string;
  border: string;
} {
  switch (type) {
    case 'CLINICAL_REVIEW':
      return {
        bg: 'bg-[#7A2A12]/10',
        text: 'text-[#7A2A12]',
        border: 'border-[#7A2A12]/20',
      };
    case 'SUGGESTION':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
      };
    case 'COMMENT':
    default:
      return {
        bg: 'bg-stone-100',
        text: 'text-stone-700',
        border: 'border-stone-200',
      };
  }
}

export function getActionLabel(action: VerificationActionType): string {
  switch (action) {
    case 'CREATED':
      return 'Draft Created';
    case 'UPDATED':
      return 'Record Fields Updated';
    case 'SUBMITTED_FOR_VERIFICATION':
      return 'Submitted for Verification';
    case 'RETURNED_FOR_CORRECTION':
      return 'Returned for Correction';
    case 'RESUBMITTED_FOR_VERIFICATION':
      return 'Resubmitted for Verification';
    case 'VERIFIED':
      return 'Verified by Sub-Investigator';
    case 'PI_REVIEWED':
      return 'PI Review Completed';
    case 'SUBMITTED_TO_CRO':
      return 'Submitted to CRO';
    case 'REVIEW_NOTE_ADDED':
      return 'Review Note Added';
    case 'ATTACHMENT_ADDED':
      return 'Source Document Attached';
    case 'ATTACHMENT_REPLACED':
      return 'Source Document Replaced';
    default:
      return action;
  }
}

/**
 * Standard vital sign validation ranges (advisory warnings, not hard blocking)
 */
export interface VitalValidationResult {
  isValid: boolean;
  message?: string;
  isAbnormal?: boolean;
}

export function validateVitalField(fieldKey: string, value: string): VitalValidationResult {
  if (!value || !value.trim()) {
    return { isValid: true };
  }

  const cleanVal = value.trim();

  switch (fieldKey) {
    case 'bloodPressure': {
      // Expect format: 120/80
      const bpMatch = cleanVal.match(/^(\d{2,3})\/(\d{2,3})$/);
      if (!bpMatch) {
        return { isValid: false, message: 'Expected format: SBP/DBP (e.g. 120/80)' };
      }
      const sbp = parseInt(bpMatch[1], 10);
      const dbp = parseInt(bpMatch[2], 10);
      if (sbp < 60 || sbp > 250 || dbp < 40 || dbp > 150) {
        return { isValid: true, isAbnormal: true, message: 'Values outside normal physiological range' };
      }
      return { isValid: true };
    }
    case 'pulse': {
      const p = parseFloat(cleanVal);
      if (isNaN(p)) return { isValid: false, message: 'Pulse must be a number' };
      if (p < 40 || p > 180) {
        return { isValid: true, isAbnormal: true, message: 'Abnormal pulse rate' };
      }
      return { isValid: true };
    }
    case 'temperature': {
      const t = parseFloat(cleanVal);
      if (isNaN(t)) return { isValid: false, message: 'Temperature must be a number' };
      if (t < 94 || t > 106) {
        return { isValid: true, isAbnormal: true, message: 'Abnormal temperature (°F)' };
      }
      return { isValid: true };
    }
    case 'spo2': {
      const s = parseFloat(cleanVal);
      if (isNaN(s)) return { isValid: false, message: 'SpO2 must be a percentage' };
      if (s < 70 || s > 100) {
        return { isValid: true, isAbnormal: true, message: 'Critical oxygen saturation (< 90%)' };
      }
      return { isValid: true };
    }
    case 'respiratoryRate': {
      const r = parseFloat(cleanVal);
      if (isNaN(r)) return { isValid: false, message: 'Respiratory rate must be a number' };
      if (r < 8 || r > 40) {
        return { isValid: true, isAbnormal: true, message: 'Abnormal respiratory rate' };
      }
      return { isValid: true };
    }
    case 'weight': {
      const w = parseFloat(cleanVal);
      if (isNaN(w)) return { isValid: false, message: 'Weight must be a number (kg)' };
      return { isValid: true };
    }
    default:
      return { isValid: true };
  }
}
