/**
 * Identity & Credential Delivery Service
 * 
 * Abstraction boundary for challenge delivery (OTP / Temporary Credential).
 * In this browser-only MVP, uses MockIdentityDeliveryService for local offline operation.
 * Designed for future swap with EmailIdentityDeliveryService / Twilio / backend SMS.
 */
import { browserStorage } from '../storage/browserStorage';
import { environmentService } from './environmentService';
import { EMPTY_TEST_PREFIX } from '../storage/emptyTestStore';
import { MOCK_MUTATION_PREFIX } from '../storage/mockDataStore';

export interface VerificationChallenge {
  challengeId: string;
  email: string;
  code: string;
  expiresAt: string;
  verified: boolean;
  purpose: 'ONBOARDING' | 'PASSWORD_SETUP' | 'LOGIN';
  createdAt: string;
}

export interface IIdentityDeliveryService {
  requestChallenge(
    email: string,
    purpose?: 'ONBOARDING' | 'PASSWORD_SETUP' | 'LOGIN'
  ): Promise<VerificationChallenge>;
  verifyChallenge(email: string, code: string): Promise<boolean>;
  getLatestChallenge(email: string): Promise<VerificationChallenge | null>;
  hasVerifiedChallenge(email: string): Promise<boolean>;
  clearChallenge(email: string): Promise<void>;
}

export class MockIdentityDeliveryService implements IIdentityDeliveryService {
  private getStorageKey(): string {
    const mode = environmentService.getMode();
    const prefix = mode === 'EMPTY_TEST' ? EMPTY_TEST_PREFIX : MOCK_MUTATION_PREFIX;
    return `${prefix}challenges`;
  }

  private getAllChallenges(): Record<string, VerificationChallenge> {
    return browserStorage.get<Record<string, VerificationChallenge>>(this.getStorageKey(), {}) || {};
  }

  private saveChallenges(challenges: Record<string, VerificationChallenge>): void {
    browserStorage.set(this.getStorageKey(), challenges);
  }

  async requestChallenge(
    email: string,
    purpose: 'ONBOARDING' | 'PASSWORD_SETUP' | 'LOGIN' = 'ONBOARDING'
  ): Promise<VerificationChallenge> {
    const normalizedEmail = email.trim().toLowerCase();
    const challenges = this.getAllChallenges();

    // Deterministic demo OTP for predictable manual and automated testing
    // If testing or empty test mode, generate a reliable 6-digit code
    const code = '654321';

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 mins

    const challenge: VerificationChallenge = {
      challengeId: `CHAL-${Date.now().toString(36).toUpperCase()}`,
      email: normalizedEmail,
      code,
      expiresAt,
      verified: false,
      purpose,
      createdAt: now.toISOString(),
    };

    challenges[normalizedEmail] = challenge;
    this.saveChallenges(challenges);

    return structuredClone(challenge);
  }

  async verifyChallenge(email: string, code: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const challenges = this.getAllChallenges();
    const challenge = challenges[normalizedEmail];

    if (!challenge) {
      return false;
    }

    if (challenge.code !== code.trim()) {
      return false;
    }

    // Check expiration
    if (new Date(challenge.expiresAt).getTime() < Date.now()) {
      return false;
    }

    challenge.verified = true;
    challenges[normalizedEmail] = challenge;
    this.saveChallenges(challenges);
    return true;
  }

  async getLatestChallenge(email: string): Promise<VerificationChallenge | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const challenges = this.getAllChallenges();
    const challenge = challenges[normalizedEmail];
    return challenge ? structuredClone(challenge) : null;
  }

  async hasVerifiedChallenge(email: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const challenge = await this.getLatestChallenge(normalizedEmail);
    return !!challenge && challenge.verified;
  }

  async clearChallenge(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const challenges = this.getAllChallenges();
    delete challenges[normalizedEmail];
    this.saveChallenges(challenges);
  }
}

export const identityDeliveryService = new MockIdentityDeliveryService();
