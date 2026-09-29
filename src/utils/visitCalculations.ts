import { CalculatedVisitWindow, VisitStatus, ClinicalActivity } from '../types';

/**
 * Global controlled reference date for deterministic testing and reproducible clinical trial operations.
 * Default: 2026-09-29 (current operational date)
 */
let simulatedReferenceDate: string = '2026-09-29';

export function setReferenceDate(dateStr: string): void {
  simulatedReferenceDate = dateStr;
}

export function getReferenceDate(): string {
  return simulatedReferenceDate;
}

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD string into a UTC Date
 */
export function parseDateISO(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

/**
 * Calculate target date and allowable window boundaries from anchor date and protocol offsets.
 * Deterministic and unit-testable.
 */
export function calculateVisitWindow(
  anchorDateStr: string,
  targetOffsetDays: number,
  windowBeforeDays: number,
  windowAfterDays: number
): CalculatedVisitWindow {
  const anchorDate = parseDateISO(anchorDateStr);

  // Target Date = anchorDate + targetOffsetDays
  const targetDate = new Date(anchorDate.getTime());
  targetDate.setUTCDate(targetDate.getUTCDate() + targetOffsetDays);

  // Window Start = targetDate - windowBeforeDays
  const windowStart = new Date(targetDate.getTime());
  windowStart.setUTCDate(windowStart.getUTCDate() - windowBeforeDays);

  // Window End = targetDate + windowAfterDays
  const windowEnd = new Date(targetDate.getTime());
  windowEnd.setUTCDate(windowEnd.getUTCDate() + windowAfterDays);

  return {
    targetDate: formatDateISO(targetDate),
    windowStart: formatDateISO(windowStart),
    windowEnd: formatDateISO(windowEnd),
  };
}

/**
 * Derive operational visit status according to protocol window rules.
 */
export function deriveVisitStatus(params: {
  targetDate: string;
  windowStart: string;
  windowEnd: string;
  completedDate?: string;
  cancelledDate?: string;
  isCancelled?: boolean;
  referenceDate?: string;
  activities?: ClinicalActivity[];
}): VisitStatus {
  const refDateStr = params.referenceDate || getReferenceDate();

  if (params.isCancelled || params.cancelledDate) {
    return 'CANCELLED';
  }

  if (params.completedDate) {
    return 'COMPLETED';
  }

  // Compare dates using ISO strings (YYYY-MM-DD string comparison is lexicographically identical to date comparison)
  if (refDateStr > params.windowEnd) {
    // If overdue by more than 14 days past window closure, consider MISSED
    const refDate = parseDateISO(refDateStr);
    const windowEndDate = parseDateISO(params.windowEnd);
    const diffDays = Math.round((refDate.getTime() - windowEndDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 14 ? 'MISSED' : 'OVERDUE';
  }

  if (refDateStr >= params.windowStart && refDateStr <= params.windowEnd) {
    return 'DUE';
  }

  return 'SCHEDULED';
}

/**
 * Calculate activity summary counts for a visit
 */
export function calculateActivityMetrics(activities: ClinicalActivity[] = []) {
  const total = activities.length;
  const completed = activities.filter((a) => a.status === 'COMPLETED').length;
  const pending = activities.filter((a) => a.status === 'PENDING').length;
  const requiredIncomplete = activities.filter(
    (a) => a.required && (a.status === 'PENDING' || a.status === 'IN_PROGRESS')
  ).length;

  return {
    total,
    completed,
    pending,
    requiredIncomplete,
  };
}
