import { IAuthRepository } from './interfaces';
import {
  AuthResult,
  AuthSession,
  AuthUser,
  DemoCredential,
  Permission,
  Role,
  User,
  UserRole,
} from '../types';
import {
  MOCK_USERS,
  MOCK_ROLES,
  MOCK_USER_ROLES,
  MOCK_PERMISSIONS,
} from '../data/mockData';

export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    email: 'demo.pi@aiia-ctms.local',
    password: 'PI@Demo123',
    label: 'Principal Investigator (PI)',
    roleName: 'Principal Investigator',
    userName: 'Dr. Ananya Sharma',
    roleId: 'ROLE_PI',
    userId: 'USR-101',
    studyId: 'STUDY-001',
    siteId: 'SITE-001',
    description: 'Dr. Ananya Sharma — Full site oversight, approvals, safety review, and compliance governance.',
  },
  {
    email: 'demo.subi@aiia-ctms.local',
    password: 'SUBI@Demo123',
    label: 'Sub-Investigator',
    roleName: 'Sub-Investigator',
    userName: 'Dr. Rajesh Kulkarni',
    roleId: 'ROLE_SUB_I',
    userId: 'USR-102',
    studyId: 'STUDY-001',
    siteId: 'SITE-001',
    description: 'Dr. Rajesh Kulkarni — Delegated medical evaluations, visits, and safety reviews.',
  },
  {
    email: 'demo.crc@aiia-ctms.local',
    password: 'CRC@Demo123',
    label: 'Clinical Research Coordinator (CRC)',
    roleName: 'Clinical Research Coordinator',
    userName: 'Pratibha Joshi',
    roleId: 'ROLE_CRC',
    userId: 'USR-103',
    studyId: 'STUDY-001',
    siteId: 'SITE-001',
    description: 'Pratibha Joshi — Participant operations, schedule coordination, and task management.',
  },
  {
    email: 'demo.nurse@aiia-ctms.local',
    password: 'NURSE@Demo123',
    label: 'Study Nurse',
    roleName: 'Study Nurse',
    userName: 'Sunita Patel',
    roleId: 'ROLE_STUDY_NURSE',
    userId: 'USR-104',
    studyId: 'STUDY-001',
    siteId: 'SITE-001',
    description: 'Sunita Patel — Clinical procedures, vital signs, participant checklists, and nursing tasks.',
  },
  {
    email: 'demo.pharmacist@aiia-ctms.local',
    password: 'PHARM@Demo123',
    label: 'Study Pharmacist',
    roleName: 'Study Pharmacist',
    userName: 'Vikram Malhotra',
    roleId: 'ROLE_STUDY_PHARMACIST',
    userId: 'USR-105',
    studyId: 'STUDY-001',
    siteId: 'SITE-001',
    description: 'Vikram Malhotra — Investigational product accountability, dispensing logs, and temperature monitoring.',
  },
  {
    email: 'demo.data@aiia-ctms.local',
    password: 'DATA@Demo123',
    label: 'Data Entry Operator',
    roleName: 'Data Entry Operator',
    userName: 'Amit Deshmukh',
    roleId: 'ROLE_DATA_ENTRY',
    userId: 'USR-106',
    studyId: 'STUDY-001',
    siteId: 'SITE-001',
    description: 'Amit Deshmukh — eCRF transcription, data queries, and clerical operational records.',
  },
];

export class MockAuthRepository implements IAuthRepository {
  private users: User[];
  private roles: Role[];
  private userRoles: UserRole[];
  private permissions: Permission[];
  private demoCredentials: DemoCredential[];

  constructor() {
    this.users = [...MOCK_USERS];
    this.roles = [...MOCK_ROLES];
    this.userRoles = [...MOCK_USER_ROLES];
    this.permissions = [...MOCK_PERMISSIONS];
    this.demoCredentials = [...DEMO_CREDENTIALS];
  }

  getDemoCredentials(): DemoCredential[] {
    return [...this.demoCredentials];
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === userId);
    return user ? { ...user } : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    // Check demo credentials first
    const demo = this.demoCredentials.find((d) => d.email.toLowerCase() === normalized);
    if (demo) {
      return this.getUserById(demo.userId);
    }
    // Check official users
    const user = this.users.find((u) => u.email.toLowerCase() === normalized);
    return user ? { ...user } : null;
  }

  async getUserAssignments(userId: string): Promise<UserRole[]> {
    return this.userRoles
      .filter((ur) => ur.userId === userId)
      .map((ur) => ({ ...ur }));
  }

  async getRoleById(roleId: string): Promise<Role | null> {
    const role = this.roles.find((r) => r.id === roleId);
    return role ? { ...role } : null;
  }

  async getEffectivePermissions(
    userId: string,
    studyId: string,
    siteId: string
  ): Promise<Permission[]> {
    const userAssignments = this.userRoles.filter(
      (ur) => ur.userId === userId && ur.studyId === studyId && ur.siteId === siteId
    );

    const permissionIdSet = new Set<string>();
    for (const ur of userAssignments) {
      const role = this.roles.find((r) => r.id === ur.roleId);
      if (role) {
        for (const pId of role.permissionIds) {
          permissionIdSet.add(pId);
        }
      }
    }

    return this.permissions
      .filter((p) => permissionIdSet.has(p.id))
      .map((p) => ({ ...p }));
  }

  async authenticate(email: string, password: string): Promise<AuthResult> {
    const trimmedEmail = email?.trim() || '';
    const trimmedPassword = password?.trim() || '';

    if (!trimmedEmail || !trimmedPassword) {
      return {
        success: false,
        error: 'Email and password are required.',
      };
    }

    const normalizedEmail = trimmedEmail.toLowerCase();

    // 1. Check against Demo Credentials
    const demo = this.demoCredentials.find(
      (d) => d.email.toLowerCase() === normalizedEmail && d.password === trimmedPassword
    );

    let targetUserId: string | null = null;
    let preferredRoleId: string | null = null;
    let preferredStudyId: string | null = null;
    let preferredSiteId: string | null = null;

    if (demo) {
      targetUserId = demo.userId;
      preferredRoleId = demo.roleId;
      preferredStudyId = demo.studyId;
      preferredSiteId = demo.siteId;
    } else {
      // 2. Fallback: match by official user email with demo standard password pattern
      const user = this.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (user) {
        // Find if user corresponds to one of the demo users
        const correspondingDemo = this.demoCredentials.find((d) => d.userId === user.id);
        if (correspondingDemo && correspondingDemo.password === trimmedPassword) {
          targetUserId = user.id;
          preferredRoleId = correspondingDemo.roleId;
          preferredStudyId = correspondingDemo.studyId;
          preferredSiteId = correspondingDemo.siteId;
        }
      }
    }

    if (!targetUserId) {
      const err = 'Invalid credentials. Please verify your email and password.';
      return {
        success: false,
        error: err,
        errorMessage: err,
      };
    }

    const user = await this.getUserById(targetUserId);
    if (!user) {
      const err = 'User account not found in system records.';
      return {
        success: false,
        error: err,
        errorMessage: err,
      };
    }

    if (user.status === 'INACTIVE') {
      const err = 'This user account is inactive. Please contact the site administrator.';
      return {
        success: false,
        error: err,
        errorMessage: err,
      };
    }

    // Verify user has valid study/site assignments
    const assignments = await this.getUserAssignments(user.id);
    if (assignments.length === 0) {
      const err = 'User has no authorized clinical study/site assignments.';
      return {
        success: false,
        error: err,
        errorMessage: err,
      };
    }

    // Resolve primary assignment
    const activeAssignment =
      assignments.find(
        (a) =>
          a.studyId === preferredStudyId &&
          a.siteId === preferredSiteId &&
          (!preferredRoleId || a.roleId === preferredRoleId)
      ) || assignments[0];

    const role = await this.getRoleById(activeAssignment.roleId);
    if (!role) {
      const err = `Assigned role "${activeAssignment.roleId}" could not be resolved.`;
      return {
        success: false,
        error: err,
        errorMessage: err,
      };
    }

    const effectivePermissions = await this.getEffectivePermissions(
      user.id,
      activeAssignment.studyId,
      activeAssignment.siteId
    );

      const authUser: AuthUser = {
      id: user.id,
      displayName: user.displayName,
      name: user.displayName,
      email: user.email,
      designation: user.designation,
      status: user.status,
      organization: user.organization,
      department: user.department,
      phone: user.phone,
    };

    const session: AuthSession = {
      userId: user.id,
      roleId: role.id,
      studyId: activeAssignment.studyId,
      siteId: activeAssignment.siteId,
      authenticated: true,
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      session,
      user: authUser,
      role,
      effectivePermissions,
    };
  }
}

export const mockAuthRepository = new MockAuthRepository();
