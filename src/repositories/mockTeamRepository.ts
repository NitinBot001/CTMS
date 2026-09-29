import { ITeamRepository, ParticipantQueryContext } from './interfaces';
import {
  User,
  Role,
  Permission,
  UserRole,
  TeamMemberSummary,
  TeamMemberDetail,
  TeamFilters,
  RoleFilters,
  TeamSummaryMetrics,
  RoleWithCounts,
  CreateCustomRoleInput,
  UpdateCustomRoleInput,
  AssignRoleInput,
  CreateTeamMemberInput,
} from '../types';
import {
  MOCK_USERS,
  MOCK_ROLES,
  MOCK_PERMISSIONS,
  MOCK_USER_ROLES,
} from '../data/mockData';

export class MockTeamRepository implements ITeamRepository {
  private users: User[];
  private roles: Role[];
  private permissions: Permission[];
  private userRoles: UserRole[];
  private onSaveUsers?: (users: User[]) => void;
  private onSaveRoles?: (roles: Role[]) => void;
  private onSaveUserRoles?: (userRoles: UserRole[]) => void;

  constructor(
    initialUsers?: User[],
    initialRoles?: Role[],
    initialPermissions?: Permission[],
    initialUserRoles?: UserRole[],
    onSaveUsers?: (users: User[]) => void,
    onSaveRoles?: (roles: Role[]) => void,
    onSaveUserRoles?: (userRoles: UserRole[]) => void
  ) {
    this.users = initialUsers ? structuredClone(initialUsers) : structuredClone(MOCK_USERS);
    this.roles = initialRoles ? structuredClone(initialRoles) : structuredClone(MOCK_ROLES);
    this.permissions = initialPermissions ? structuredClone(initialPermissions) : structuredClone(MOCK_PERMISSIONS);
    this.userRoles = initialUserRoles ? structuredClone(initialUserRoles) : structuredClone(MOCK_USER_ROLES);
    this.onSaveUsers = onSaveUsers;
    this.onSaveRoles = onSaveRoles;
    this.onSaveUserRoles = onSaveUserRoles;
  }

  async getTeamMembers(
    context: ParticipantQueryContext,
    filters?: TeamFilters
  ): Promise<TeamMemberSummary[]> {
    await new Promise((resolve) => setTimeout(resolve, 35));

    if (!context.studyId || !context.siteId) return [];

    // 1. Find all active assignments in this study & site scope
    const scopedAssignments = this.userRoles.filter(
      (ur) => ur.studyId === context.studyId && ur.siteId === context.siteId
    );

    // 2. Group by userId
    const userAssignmentsMap = new Map<string, UserRole[]>();
    for (const assignment of scopedAssignments) {
      const list = userAssignmentsMap.get(assignment.userId) || [];
      list.push(assignment);
      userAssignmentsMap.set(assignment.userId, list);
    }

    // 3. Hydrate team members
    const summaries: TeamMemberSummary[] = [];

    for (const [userId, assignments] of userAssignmentsMap.entries()) {
      const user = this.users.find((u) => u.id === userId);
      if (!user) continue;

      const roles = assignments
        .map((a) => this.roles.find((r) => r.id === a.roleId))
        .filter((r): r is Role => Boolean(r));

      summaries.push({
        user: structuredClone(user),
        roles: structuredClone(roles),
        assignments: structuredClone(assignments),
        studyId: context.studyId,
        siteId: context.siteId,
      });
    }

    let results = summaries;

    // 4. Apply filters
    if (filters) {
      if (filters.search && filters.search.trim().length > 0) {
        const query = filters.search.trim().toLowerCase();
        results = results.filter(
          (m) =>
            m.user.displayName.toLowerCase().includes(query) ||
            m.user.email.toLowerCase().includes(query) ||
            m.user.designation.toLowerCase().includes(query) ||
            m.roles.some((r) => r.name.toLowerCase().includes(query))
        );
      }

      if (filters.status && filters.status !== 'ALL') {
        results = results.filter((m) => m.user.status === filters.status);
      }

      if (filters.roleId && filters.roleId !== 'ALL') {
        results = results.filter((m) =>
          m.roles.some((r) => r.id === filters.roleId)
        );
      }
    }

    // Sort: PI first, then alphabetically by display name
    results.sort((a, b) => {
      const aIsPI = a.roles.some((r) => r.id === 'ROLE_PI');
      const bIsPI = b.roles.some((r) => r.id === 'ROLE_PI');
      if (aIsPI && !bIsPI) return -1;
      if (!aIsPI && bIsPI) return 1;
      return a.user.displayName.localeCompare(b.user.displayName);
    });

    return structuredClone(results);
  }

  async getTeamMemberById(
    context: ParticipantQueryContext,
    userId: string
  ): Promise<TeamMemberDetail | null> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    if (!context.studyId || !context.siteId || !userId) return null;

    // Strict scope isolation: user MUST have an assignment in this context
    const scopedAssignments = this.userRoles.filter(
      (ur) =>
        ur.userId.toLowerCase() === userId.toLowerCase() &&
        ur.studyId === context.studyId &&
        ur.siteId === context.siteId
    );

    if (scopedAssignments.length === 0) {
      return null; // Reject cross-site retrieval
    }

    const user = this.users.find((u) => u.id.toLowerCase() === userId.toLowerCase());
    if (!user) return null;

    const roles = scopedAssignments
      .map((a) => this.roles.find((r) => r.id === a.roleId))
      .filter((r): r is Role => Boolean(r));

    // Derive effective permissions: union of all role permissionIds
    const permissionIdSet = new Set<string>();
    for (const role of roles) {
      for (const permId of role.permissionIds) {
        permissionIdSet.add(permId);
      }
    }

    const effectivePermissions = this.permissions.filter((p) =>
      permissionIdSet.has(p.id)
    );

    return {
      user: structuredClone(user),
      roles: structuredClone(roles),
      assignments: structuredClone(scopedAssignments),
      effectivePermissions: structuredClone(effectivePermissions),
      studyId: context.studyId,
      siteId: context.siteId,
    };
  }

  async getRoles(
    context: ParticipantQueryContext,
    filters?: RoleFilters
  ): Promise<RoleWithCounts[]> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    let results = this.roles.map((role) => {
      const assignedUsersInContext = new Set(
        this.userRoles
          .filter(
            (ur) =>
              ur.roleId === role.id &&
              ur.studyId === context.studyId &&
              ur.siteId === context.siteId
          )
          .map((ur) => ur.userId)
      );

      return {
        ...structuredClone(role),
        assignedUserCount: assignedUsersInContext.size,
      };
    });

    if (filters) {
      if (filters.search && filters.search.trim().length > 0) {
        const query = filters.search.trim().toLowerCase();
        results = results.filter(
          (r) =>
            r.name.toLowerCase().includes(query) ||
            r.description.toLowerCase().includes(query)
        );
      }

      const typeFilter = filters.type || filters.roleType;
      if (typeFilter && typeFilter !== 'ALL') {
        results = results.filter((r) => r.type === typeFilter);
      }
    }

    // Sort: SYSTEM roles first, then CUSTOM, then by name
    results.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'SYSTEM' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return results;
  }

  async getRoleById(
    _context: ParticipantQueryContext,
    roleId: string
  ): Promise<Role | null> {
    await new Promise((resolve) => setTimeout(resolve, 20));

    if (!roleId) return null;
    const found = this.roles.find((r) => r.id.toLowerCase() === roleId.toLowerCase());
    return found ? structuredClone(found) : null;
  }

  async getPermissions(): Promise<Permission[]> {
    await new Promise((resolve) => setTimeout(resolve, 15));
    return structuredClone(this.permissions);
  }

  async getUserRoleAssignments(
    context: ParticipantQueryContext,
    userId: string
  ): Promise<UserRole[]> {
    await new Promise((resolve) => setTimeout(resolve, 20));

    if (!context.studyId || !context.siteId || !userId) return [];

    const scoped = this.userRoles.filter(
      (ur) =>
        ur.userId.toLowerCase() === userId.toLowerCase() &&
        ur.studyId === context.studyId &&
        ur.siteId === context.siteId
    );

    return structuredClone(scoped);
  }

  async getEffectivePermissions(
    context: ParticipantQueryContext,
    userId: string
  ): Promise<Permission[]> {
    const detail = await this.getTeamMemberById(context, userId);
    return detail ? detail.effectivePermissions : [];
  }

  async getTeamSummaryMetrics(
    context: ParticipantQueryContext
  ): Promise<TeamSummaryMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 20));

    const scopedAssignments = this.userRoles.filter(
      (ur) => ur.studyId === context.studyId && ur.siteId === context.siteId
    );

    const userIdsInContext = new Set(scopedAssignments.map((ur) => ur.userId));
    const members = this.users.filter((u) => userIdsInContext.has(u.id));

    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === 'ACTIVE').length;
    const inactiveMembers = members.filter((m) => m.status === 'INACTIVE').length;
    const systemRolesCount = this.roles.filter((r) => r.type === 'SYSTEM').length;
    const customRolesCount = this.roles.filter((r) => r.type === 'CUSTOM').length;
    const totalAssignments = scopedAssignments.length;

    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      systemRolesCount,
      customRolesCount,
      totalAssignments,
    };
  }

  async assignRole(
    context: ParticipantQueryContext,
    input: AssignRoleInput
  ): Promise<UserRole> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    if (!context.studyId || !context.siteId) {
      throw new Error('Study and Site context are required.');
    }

    const user = this.users.find(
      (u) => u.id.toLowerCase() === input.userId.toLowerCase()
    );
    if (!user) {
      throw new Error(`User not found with ID ${input.userId}.`);
    }

    const role = this.roles.find(
      (r) => r.id.toLowerCase() === input.roleId.toLowerCase()
    );
    if (!role) {
      throw new Error(`Role not found with ID ${input.roleId}.`);
    }

    // Check duplicate assignment in this scope
    const duplicate = this.userRoles.some(
      (ur) =>
        ur.userId.toLowerCase() === input.userId.toLowerCase() &&
        ur.roleId.toLowerCase() === role.id.toLowerCase() &&
        ur.studyId === context.studyId &&
        ur.siteId === context.siteId
    );

    if (duplicate) {
      throw new Error(
        `User is already assigned this role in the specified study and site scope (${user.displayName} already holds "${role.name}").`
      );
    }

    const newAssignment: UserRole = {
      id: `UR-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: user.id,
      roleId: role.id,
      studyId: context.studyId,
      siteId: context.siteId,
      assignedAt: new Date().toISOString(),
      assignedBy: input.assignedBy || 'Dr. Ananya Sharma (PI)',
    };

    this.userRoles.push(newAssignment);
    this.onSaveUserRoles?.(this.userRoles);
    return structuredClone(newAssignment);
  }

  async removeRoleAssignment(
    context: ParticipantQueryContext,
    userRoleId: string
  ): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const index = this.userRoles.findIndex(
      (ur) =>
        ur.id === userRoleId &&
        ur.studyId === context.studyId &&
        ur.siteId === context.siteId
    );

    if (index === -1) return false;

    this.userRoles.splice(index, 1);
    this.onSaveUserRoles?.(this.userRoles);
    return true;
  }

  async createCustomRole(
    _context: ParticipantQueryContext,
    input: CreateCustomRoleInput
  ): Promise<Role> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const trimmedName = input.name ? input.name.trim() : '';
    if (!trimmedName) {
      throw new Error('Role name is required.');
    }

    // Check unique name (case-insensitive)
    const nameExists = this.roles.some(
      (r) => r.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
      throw new Error(`Role with this name already exists: "${trimmedName}".`);
    }

    if (!input.permissionIds || input.permissionIds.length === 0) {
      throw new Error('At least one permission must be assigned to the role.');
    }

    // Verify all permission IDs exist
    for (const pid of input.permissionIds) {
      if (!this.permissions.some((p) => p.id === pid)) {
        throw new Error(`Invalid permission ID: ${pid}.`);
      }
    }

    const now = new Date().toISOString();
    const newRole: Role = {
      id: `ROLE_CUSTOM_${Date.now().toString(36).toUpperCase()}`,
      name: trimmedName,
      description: input.description ? input.description.trim() : '',
      type: 'CUSTOM',
      permissionIds: [...input.permissionIds],
      createdAt: now,
      updatedAt: now,
    };

    this.roles.push(newRole);
    this.onSaveRoles?.(this.roles);
    return structuredClone(newRole);
  }

  async updateCustomRole(
    _context: ParticipantQueryContext,
    roleId: string,
    input: UpdateCustomRoleInput
  ): Promise<Role> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const role = this.roles.find((r) => r.id.toLowerCase() === roleId.toLowerCase());
    if (!role) {
      throw new Error(`Role not found with ID ${roleId}.`);
    }

    // System role protection
    if (role.type === 'SYSTEM') {
      throw new Error('System roles cannot be modified.');
    }

    if (input.name !== undefined) {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        throw new Error('Role name cannot be empty.');
      }
      const duplicate = this.roles.some(
        (r) =>
          r.id !== role.id &&
          r.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`A role named "${trimmedName}" already exists.`);
      }
      role.name = trimmedName;
    }

    if (input.description !== undefined) {
      role.description = input.description.trim();
    }

    if (input.permissionIds !== undefined) {
      if (input.permissionIds.length === 0) {
        throw new Error('At least one permission must be selected for the custom role.');
      }
      for (const pid of input.permissionIds) {
        if (!this.permissions.some((p) => p.id === pid)) {
          throw new Error(`Invalid permission ID: ${pid}.`);
        }
      }
      role.permissionIds = [...input.permissionIds];
    }

    role.updatedAt = new Date().toISOString();
    this.onSaveRoles?.(this.roles);
    return structuredClone(role);
  }

  async createTeamMember(
    context: ParticipantQueryContext,
    input: CreateTeamMemberInput
  ): Promise<TeamMemberSummary> {
    const existing = this.users.find((u) => u.email.toLowerCase() === input.email.trim().toLowerCase());
    if (existing) {
      throw new Error(`A team member with email "${input.email}" already exists.`);
    }

    const role = this.roles.find((r) => r.id === input.roleId);
    if (!role) {
      throw new Error(`Role "${input.roleId}" not found.`);
    }

    const newUser: User = {
      id: `USR-${Date.now().toString(36).toUpperCase()}`,
      displayName: input.displayName.trim(),
      email: input.email.trim().toLowerCase(),
      designation: input.designation || role.name,
      status: input.status || 'ACTIVE',
      organization: 'All India Institute of Ayurveda',
      department: input.department || 'Clinical Research',
      phone: input.phone || '+91 11 2999 0000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.push(newUser);

    const newAssignment: UserRole = {
      id: `UR-${Date.now().toString(36).toUpperCase()}`,
      userId: newUser.id,
      roleId: role.id,
      studyId: context.studyId,
      siteId: context.siteId,
      assignedAt: new Date().toISOString(),
      assignedBy: 'Principal Investigator',
    };

    this.userRoles.push(newAssignment);
    this.onSaveUsers?.(this.users);
    this.onSaveUserRoles?.(this.userRoles);

    return {
      user: structuredClone(newUser),
      roles: [structuredClone(role)],
      assignments: [structuredClone(newAssignment)],
      studyId: context.studyId,
      siteId: context.siteId,
    };
  }

  async toggleUserStatus(
    _context: ParticipantQueryContext,
    userId: string,
    status: 'ACTIVE' | 'INACTIVE'
  ): Promise<User> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error(`User "${userId}" not found.`);
    user.status = status;
    user.updatedAt = new Date().toISOString();
    this.onSaveUsers?.(this.users);
    return structuredClone(user);
  }
}

export const mockTeamRepository = new MockTeamRepository();
