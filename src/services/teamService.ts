import { ITeamRepository, ParticipantQueryContext } from '../repositories/interfaces';
import { environmentService } from './environmentService';
import {
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
  PermissionModule,
  CreateTeamMemberInput,
  User,
} from '../types';

export class TeamService {
  private _customRepo?: ITeamRepository;

  constructor(repository?: ITeamRepository) {
    this._customRepo = repository;
  }

  private get repo(): ITeamRepository {
    return this._customRepo || environmentService.getTeamRepository();
  }

  async getTeamMembers(
    context: ParticipantQueryContext,
    filters?: TeamFilters
  ): Promise<TeamMemberSummary[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.getTeamMembers(context, filters);
  }

  async getTeamMemberById(
    context: ParticipantQueryContext,
    userId: string
  ): Promise<TeamMemberDetail | null> {
    if (!context.studyId || !context.siteId || !userId) {
      return null;
    }
    return this.repo.getTeamMemberById(context, userId);
  }

  async getRoles(
    context: ParticipantQueryContext,
    filters?: RoleFilters
  ): Promise<RoleWithCounts[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.getRoles(context, filters);
  }

  async getRoleById(
    context: ParticipantQueryContext,
    roleId: string
  ): Promise<Role | null> {
    if (!roleId) return null;
    return this.repo.getRoleById(context, roleId);
  }

  async getPermissions(): Promise<Permission[]> {
    return this.repo.getPermissions();
  }

  async getUserRoleAssignments(
    context: ParticipantQueryContext,
    userId: string
  ): Promise<UserRole[]> {
    if (!context.studyId || !context.siteId || !userId) {
      return [];
    }
    return this.repo.getUserRoleAssignments(context, userId);
  }

  async getEffectivePermissions(
    context: ParticipantQueryContext,
    userId: string
  ): Promise<Permission[]> {
    if (!context.studyId || !context.siteId || !userId) {
      return [];
    }
    return this.repo.getEffectivePermissions(context, userId);
  }

  async getTeamSummaryMetrics(
    context: ParticipantQueryContext
  ): Promise<TeamSummaryMetrics> {
    if (!context.studyId || !context.siteId) {
      return {
        totalMembers: 0,
        activeMembers: 0,
        inactiveMembers: 0,
        systemRolesCount: 0,
        customRolesCount: 0,
        totalAssignments: 0,
      };
    }
    return this.repo.getTeamSummaryMetrics(context);
  }

  async assignRole(
    context: ParticipantQueryContext,
    input: AssignRoleInput
  ): Promise<UserRole> {
    if (!context.studyId || !context.siteId) {
      throw new Error('Study and site context are required to assign a role.');
    }
    if (!input.userId) {
      throw new Error('User ID is required.');
    }
    if (!input.roleId) {
      throw new Error('Role ID is required.');
    }
    return this.repo.assignRole(context, input);
  }

  async removeRoleAssignment(
    context: ParticipantQueryContext,
    userRoleId: string
  ): Promise<boolean> {
    if (!context.studyId || !context.siteId || !userRoleId) {
      return false;
    }
    return this.repo.removeRoleAssignment(context, userRoleId);
  }

  async createCustomRole(
    context: ParticipantQueryContext,
    input: CreateCustomRoleInput
  ): Promise<Role> {
    return this.repo.createCustomRole(context, input);
  }

  async updateCustomRole(
    context: ParticipantQueryContext,
    roleId: string,
    input: UpdateCustomRoleInput
  ): Promise<Role> {
    if (!roleId) {
      throw new Error('Role ID is required.');
    }
    return this.repo.updateCustomRole(context, roleId, input);
  }

  async createTeamMember(
    context: ParticipantQueryContext,
    input: CreateTeamMemberInput
  ): Promise<TeamMemberSummary> {
    if (!context.studyId || !context.siteId) {
      throw new Error('Study and site context are required to create a team member.');
    }
    if (!input.displayName || !input.displayName.trim()) {
      throw new Error('Full Name is required.');
    }
    if (!input.email || !input.email.trim()) {
      throw new Error('Email is required.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email.trim())) {
      throw new Error('A valid email address is required.');
    }
    if (!input.roleId || !input.roleId.trim()) {
      throw new Error('Role is required.');
    }

    if (!this.repo.createTeamMember) {
      throw new Error('Team member creation not supported by current repository.');
    }

    const payload: CreateTeamMemberInput = {
      ...input,
      displayName: input.displayName.trim(),
      email: input.email.trim().toLowerCase(),
      studyId: context.studyId,
      siteId: context.siteId,
      password: input.password?.trim() || '128',
    };

    return this.repo.createTeamMember(context, payload);
  }

  async toggleUserStatus(
    context: ParticipantQueryContext,
    userId: string,
    status: 'ACTIVE' | 'INACTIVE'
  ): Promise<User> {
    if (!context.studyId || !context.siteId || !userId) {
      throw new Error('Study, site context, and user ID are required.');
    }
    if (!this.repo.toggleUserStatus) {
      throw new Error('Toggle user status not supported by current repository.');
    }
    return this.repo.toggleUserStatus(context, userId, status);
  }

  /**
   * Helper utility to group a flat array of permissions by their module.
   */
  groupPermissionsByModule(
    permissions: Permission[]
  ): Record<PermissionModule, Permission[]> {
    const modules: PermissionModule[] = [
      'STUDY',
      'PARTICIPANTS',
      'VISITS',
      'SAFETY',
      'COMPLIANCE',
      'TEAM',
      'DOCUMENTS',
      'TASKS',
      'REPORTS',
      'DATA_ENTRY',
    ];

    const grouped = {} as Record<PermissionModule, Permission[]>;
    for (const mod of modules) {
      grouped[mod] = [];
    }

    for (const perm of permissions) {
      if (grouped[perm.module]) {
        grouped[perm.module].push(perm);
      }
    }

    return grouped;
  }
}

export const teamService = new TeamService();
