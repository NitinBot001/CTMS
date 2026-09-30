/**
 * Participant Number Generation Service
 * 
 * Generates study-scoped, deterministic, conflict-free participant identifiers.
 * Follows the pattern: `${studyCode}-PT-${sequence}` (e.g. `EMPTY-001-PT-0001`).
 */
import { Participant } from '../types';

export interface IParticipantNumberService {
  generateNextNumber(studyCode: string, existingParticipants: Participant[]): string;
  isNumberUnique(candidateNumber: string, existingParticipants: Participant[]): boolean;
}

export class ParticipantNumberService implements IParticipantNumberService {
  generateNextNumber(studyCode: string, existingParticipants: Participant[]): string {
    const cleanPrefix = (studyCode || 'STD').trim().toUpperCase();
    const pattern = new RegExp(`^${cleanPrefix}-PT-(\\d+)$`, 'i');

    let maxSeq = 0;
    for (const p of existingParticipants) {
      const codeToTest = p.participantNumber || p.participantCode || '';
      const match = pattern.exec(codeToTest);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }

    let nextSeq = maxSeq + 1;
    let candidate = `${cleanPrefix}-PT-${String(nextSeq).padStart(4, '0')}`;

    // Extra safety: loop until finding an unused number
    while (!this.isNumberUnique(candidate, existingParticipants)) {
      nextSeq++;
      candidate = `${cleanPrefix}-PT-${String(nextSeq).padStart(4, '0')}`;
    }

    return candidate;
  }

  isNumberUnique(candidateNumber: string, existingParticipants: Participant[]): boolean {
    const normalized = candidateNumber.trim().toLowerCase();
    return !existingParticipants.some(
      (p) =>
        (p.participantNumber && p.participantNumber.toLowerCase() === normalized) ||
        (p.participantCode && p.participantCode.toLowerCase() === normalized)
    );
  }
}

export const participantNumberService = new ParticipantNumberService();
