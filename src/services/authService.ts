import { IAuthRepository } from '../repositories/interfaces';
import { environmentService } from './environmentService';
import {
  AuthResult,
  AuthSession,
  AuthUser,
  DemoCredential,
  Permission,
  User,
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

  /**
   * Registers a participant user account with ROLE_PARTICIPANT in active environment.
   */
  async registerParticipantUser(input: {
    email: string;
    name: string;
    password?: string;
    studyId: string;
    siteId: string;
  }): Promise<User> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const mode = environmentService.getMode();
    const userId = `USR-PT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const newUser: User = {
      id: userId,
      displayName: input.name.trim(),
      email: normalizedEmail,
      designation: 'Study Participant',
      status: 'ACTIVE',
      organization: 'Clinical Trial Participant',
      department: 'Subject Panel',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newUserRole: UserRole = {
      id: `UR-PT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      roleId: 'ROLE_PARTICIPANT',
      studyId: input.studyId,
      siteId: input.siteId,
      assignedAt: new Date().toISOString(),
      assignedBy: 'SELF_REGISTRATION',
    };

    const pwd = input.password?.trim() || 'Participant@123';

    if (mode === 'EMPTY_TEST') {
      const { emptyTestStore } = await import('../storage/emptyTestStore');
      const users = emptyTestStore.getUsers().filter((u) => u.email.toLowerCase() !== normalizedEmail);
      users.push(newUser);
      emptyTestStore.saveUsers(users);

      const roles = emptyTestStore.getUserRoles().filter((ur) => ur.userId !== userId);
      roles.push(newUserRole);
      emptyTestStore.saveUserRoles(roles);

      emptyTestStore.setUserPassword(normalizedEmail, pwd);
    } else {
      const { mockDataStore } = await import('../storage/mockDataStore');
      mockDataStore.addMockUser(newUser);
      mockDataStore.addMockUserRole(newUserRole);
      mockDataStore.setUserPassword(normalizedEmail, pwd);
    }

    return newUser;
  }
}

export const authService = new AuthService();
