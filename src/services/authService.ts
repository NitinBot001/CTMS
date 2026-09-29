import { IAuthRepository } from '../repositories/interfaces';
import { environmentService } from './environmentService';
import {
  AuthResult,
  AuthSession,
  AuthUser,
  DemoCredential,
  Permission,
  UserRole,
} from '../types';
import { browserStorage, SESSION_STORAGE_KEY } from '../storage/browserStorage';
import { getRoleLandingRoute } from '../config/navigationConfig';

export class AuthService {
  private _customRepo?: IAuthRepository;

  constructor(repo?: IAuthRepository) {
    this._customRepo = repo;
  }

  private get repo(): IAuthRepository {
    return this._customRepo || environmentService.getAuthRepository();
  }

  /**
   * Authenticates user against synthetic demo credentials repository.
   * On success, establishes session in browserStorage.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const result = await this.repo.authenticate(email, password);

    if (result.success && result.session) {
      browserStorage.set(SESSION_STORAGE_KEY, result.session);
    }

    return result;
  }

  /**
   * Restores authenticated session from browserStorage and validates user status & assignments.
   */
  async restoreSession(): Promise<AuthResult> {
    const session = browserStorage.get<AuthSession>(SESSION_STORAGE_KEY);

    if (!session || !session.authenticated || !session.userId) {
      return { success: false, error: 'No active session found.' };
    }

    // Verify user exists and remains active
    const user = await this.repo.getUserById(session.userId);
    if (!user || user.status === 'INACTIVE') {
      this.logout();
      return {
        success: false,
        error: 'Session expired or user account is no longer active.',
      };
    }

    // Verify role exists
    const role = await this.repo.getRoleById(session.roleId);
    if (!role) {
      this.logout();
      return {
        success: false,
        error: 'Session role could not be resolved.',
      };
    }

    // Verify study/site assignment remains valid
    const assignments = await this.repo.getUserAssignments(user.id);
    const hasValidScope = assignments.some(
      (a) => a.studyId === session.studyId && a.siteId === session.siteId
    );

    if (!hasValidScope && assignments.length > 0) {
      // Re-anchor to user's first valid assignment
      session.studyId = assignments[0].studyId;
      session.siteId = assignments[0].siteId;
      session.roleId = assignments[0].roleId;
      browserStorage.set(SESSION_STORAGE_KEY, session);
    } else if (!hasValidScope) {
      this.logout();
      return {
        success: false,
        error: 'User has no authorized site assignments.',
      };
    }

    const effectivePermissions = await this.repo.getEffectivePermissions(
      user.id,
      session.studyId,
      session.siteId
    );

    const authUser: AuthUser = {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      designation: user.designation,
      status: user.status,
      organization: user.organization,
      department: user.department,
      phone: user.phone,
    };

    return {
      success: true,
      session,
      user: authUser,
      role,
      effectivePermissions,
    };
  }

  /**
   * Terminates active session and removes persistence artifact.
   */
  logout(): void {
    browserStorage.remove(SESSION_STORAGE_KEY);
  }

  /**
   * Checks whether the given permission ID exists in the effective permissions list.
   */
  hasPermission(permissionId: string, effectivePermissions: Permission[] = []): boolean {
    return effectivePermissions.some((p) => p.id === permissionId);
  }

  /**
   * Retrieves user role assignments across studies/sites.
   */
  async getUserAssignments(userId: string): Promise<UserRole[]> {
    return this.repo.getUserAssignments(userId);
  }

  /**
   * Returns list of demo credentials for rapid login testing.
   */
  getDemoCredentials(): DemoCredential[] {
    return this.repo.getDemoCredentials();
  }

  /**
   * Returns role-specific landing route.
   */
  getRoleLandingRoute(roleId?: string): string {
    return getRoleLandingRoute(roleId);
  }
}

export const authService = new AuthService();
