import { ITaskRepository, ParticipantQueryContext } from './interfaces';
import {
  Task,
  TaskAssignment,
  TaskApproval,
  TaskSummaryMetrics,
  TaskFilters,
  CreateTaskInput,
  AssignTaskInput,
  TaskStatus,
  User,
  UserRole,
  Role,
} from '../types';
import {
  MOCK_TASKS,
  MOCK_USERS,
  MOCK_USER_ROLES,
  MOCK_ROLES,
} from '../data/mockData';
import {
  isValidTaskTransition,
  isTaskOverdue,
  isTaskDueToday,
  TASK_REFERENCE_DATE,
} from '../utils/taskCalculations';

export class MockTaskRepository implements ITaskRepository {
  private tasks: Task[];
  private users: User[];
  private userRoles: UserRole[];
  private roles: Role[];
  private onSaveTasks?: (tasks: Task[]) => void;

  constructor(
    initialTasks?: Task[],
    initialUsers?: User[],
    initialUserRoles?: UserRole[],
    initialRoles?: Role[],
    onSaveTasks?: (tasks: Task[]) => void
  ) {
    this.tasks = initialTasks ? structuredClone(initialTasks) : structuredClone(MOCK_TASKS);
    this.users = initialUsers ? structuredClone(initialUsers) : structuredClone(MOCK_USERS);
    this.userRoles = initialUserRoles ? structuredClone(initialUserRoles) : structuredClone(MOCK_USER_ROLES);
    this.roles = initialRoles ? structuredClone(initialRoles) : structuredClone(MOCK_ROLES);
    this.onSaveTasks = onSaveTasks;
  }

  private notifySave(): void {
    this.onSaveTasks?.(this.tasks);
  }

  /**
   * Helper: validates that a user is an active member at the specified site
   */
  private validateSiteUser(context: ParticipantQueryContext, userId: string): User {
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error(`User with ID "${userId}" does not exist.`);
    }

    if (user.status === 'INACTIVE') {
      throw new Error(`Cannot assign task to inactive user: ${user.displayName}.`);
    }

    const hasSiteRole = this.userRoles.some(
      (ur) =>
        ur.userId === userId &&
        ur.studyId === context.studyId &&
        ur.siteId === context.siteId
    );

    if (!hasSiteRole) {
      throw new Error(
        `User ${user.displayName} (${userId}) does not belong to site scope "${context.siteId}". Cross-site task assignment is prohibited.`
      );
    }

    return user;
  }

  async getTasks(
    context: ParticipantQueryContext,
    filters?: TaskFilters
  ): Promise<Task[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    if (!context.studyId || !context.siteId) return [];

    // 1. Scope strictly to active study + site
    let results = this.tasks.filter(
      (t) => t.studyId === context.studyId && t.siteId === context.siteId
    );

    // 2. Apply combined multi-criteria filters with AND semantics
    if (filters) {
      if (filters.search && filters.search.trim().length > 0) {
        const query = filters.search.trim().toLowerCase();
        results = results.filter(
          (t) =>
            t.id.toLowerCase().includes(query) ||
            t.title.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            (t.assignee && t.assignee.displayName.toLowerCase().includes(query)) ||
            (t.relatedEntityId && t.relatedEntityId.toLowerCase().includes(query))
        );
      }

      if (filters.status && filters.status !== 'ALL') {
        if (filters.status === 'OPEN') {
          results = results.filter(
            (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
          );
        } else {
          results = results.filter((t) => t.status === filters.status);
        }
      }

      if (filters.priority && filters.priority !== 'ALL') {
        results = results.filter((t) => t.priority === filters.priority);
      }

      if (filters.category && filters.category !== 'ALL') {
        results = results.filter((t) => t.category === filters.category);
      }

      if (filters.assigneeId && filters.assigneeId !== 'ALL') {
        if (filters.assigneeId === 'UNASSIGNED') {
          results = results.filter((t) => !t.assignee);
        } else if (filters.assigneeId === 'MY_TASKS') {
          results = results.filter(
            (t) => t.assignee?.userId === 'USR-101' // Default PI ID
          );
        } else {
          results = results.filter((t) => t.assignee?.userId === filters.assigneeId);
        }
      }

      if (filters.dueDateFilter && filters.dueDateFilter !== 'ALL') {
        if (filters.dueDateFilter === 'TODAY') {
          results = results.filter(
            (t) =>
              isTaskDueToday(t.dueDate) &&
              t.status !== 'COMPLETED' &&
              t.status !== 'CANCELLED'
          );
        } else if (filters.dueDateFilter === 'OVERDUE') {
          results = results.filter((t) => isTaskOverdue(t.dueDate, t.status));
        } else if (filters.dueDateFilter === 'UPCOMING') {
          results = results.filter(
            (t) =>
              t.dueDate > TASK_REFERENCE_DATE &&
              t.status !== 'COMPLETED' &&
              t.status !== 'CANCELLED'
          );
        }
      }

      if (filters.requiresApproval !== undefined && filters.requiresApproval !== 'ALL') {
        results = results.filter((t) => t.requiresApproval === filters.requiresApproval);
      }
    }

    // 3. Sort: Priority (HIGH > MEDIUM > NORMAL), then Due Date ascending
    const priorityWeight: Record<string, number> = {
      HIGH: 3,
      MEDIUM: 2,
      NORMAL: 1,
    };

    results.sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return a.dueDate.localeCompare(b.dueDate);
    });

    return structuredClone(results);
  }

  async getTaskById(
    context: ParticipantQueryContext,
    taskId: string
  ): Promise<Task | null> {
    await new Promise((resolve) => setTimeout(resolve, 20));

    if (!context.studyId || !context.siteId || !taskId) return null;

    const found = this.tasks.find(
      (t) =>
        t.id.toLowerCase() === taskId.toLowerCase() &&
        t.studyId === context.studyId &&
        t.siteId === context.siteId
    );

    return found ? structuredClone(found) : null;
  }

  async getTaskSummary(
    context: ParticipantQueryContext,
    currentUserId: string = 'USR-101'
  ): Promise<TaskSummaryMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 20));

    if (!context.studyId || !context.siteId) {
      return {
        total: 0,
        myOpen: 0,
        dueToday: 0,
        overdue: 0,
        pendingReview: 0,
        completed: 0,
      };
    }

    const scoped = this.tasks.filter(
      (t) => t.studyId === context.studyId && t.siteId === context.siteId
    );

    const total = scoped.length;
    let myOpen = 0;
    let dueToday = 0;
    let overdue = 0;
    let pendingReview = 0;
    let completed = 0;

    for (const task of scoped) {
      const isOpen = task.status !== 'COMPLETED' && task.status !== 'CANCELLED';

      if (task.status === 'COMPLETED') {
        completed++;
      }

      if (isOpen) {
        if (task.assignee?.userId === currentUserId) {
          myOpen++;
        }

        if (isTaskDueToday(task.dueDate)) {
          dueToday++;
        }

        if (isTaskOverdue(task.dueDate, task.status)) {
          overdue++;
        }

        if (task.status === 'SUBMITTED' || task.status === 'UNDER_REVIEW') {
          pendingReview++;
        }
      }
    }

    return {
      total,
      myOpen,
      dueToday,
      overdue,
      pendingReview,
      completed,
    };
  }

  async getTaskAssignments(
    context: ParticipantQueryContext,
    taskId: string
  ): Promise<TaskAssignment[]> {
    const task = await this.getTaskById(context, taskId);
    if (!task) return [];
    return structuredClone(task.assignments);
  }

  async getMyTasks(
    context: ParticipantQueryContext,
    userId: string
  ): Promise<Task[]> {
    return this.getTasks(context, { assigneeId: userId, status: 'OPEN' });
  }

  async createTask(
    context: ParticipantQueryContext,
    input: CreateTaskInput
  ): Promise<Task> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    if (!context.studyId || !context.siteId) {
      throw new Error('Study and Site context are required.');
    }

    const title = input.title ? input.title.trim() : '';
    if (!title) {
      throw new Error('Task title is required.');
    }

    if (!input.dueDate) {
      throw new Error('Due date is required.');
    }

    let assignee: Task['assignee'] = undefined;
    const assignments: TaskAssignment[] = [];
    const newTaskId = `TSK-${Math.floor(100 + Math.random() * 900)}`;

    if (input.assigneeUserId) {
      const user = this.validateSiteUser(context, input.assigneeUserId);
      const userRole = this.userRoles.find(
        (ur) =>
          ur.userId === user.id &&
          ur.studyId === context.studyId &&
          ur.siteId === context.siteId
      );
      const role = userRole ? this.roles.find((r) => r.id === userRole.roleId) : undefined;

      assignee = {
        userId: user.id,
        displayName: user.displayName,
        email: user.email,
        designation: user.designation,
        roleId: role?.id,
        roleName: role?.name,
      };

      assignments.push({
        id: `TA-${Date.now().toString(36).toUpperCase()}`,
        taskId: newTaskId,
        userId: user.id,
        assignedBy: input.createdBy || 'Dr. Ananya Sharma (PI)',
        assignedAt: new Date().toISOString(),
        status: 'ACTIVE',
      });
    }

    const initialStatus: TaskStatus = assignee ? 'ASSIGNED' : 'DRAFT';

    const newTask: Task = {
      id: newTaskId,
      studyId: context.studyId,
      siteId: context.siteId,
      title,
      description: input.description ? input.description.trim() : '',
      category: input.category,
      priority: input.priority,
      status: initialStatus,
      dueDate: input.dueDate,
      createdBy: input.createdBy || 'Dr. Ananya Sharma (PI)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      requiresApproval: input.requiresApproval,
      approvalRequiredFromRoleId: input.approvalRequiredFromRoleId || 'ROLE_PI',
      assignee,
      assignments,
      approvals: [],
    };

    this.tasks.unshift(newTask);
    this.notifySave();
    return structuredClone(newTask);
  }

  async assignTask(
    context: ParticipantQueryContext,
    taskId: string,
    assignment: AssignTaskInput
  ): Promise<Task> {
    await new Promise((resolve) => setTimeout(resolve, 30));

    const taskIndex = this.tasks.findIndex(
      (t) =>
        t.id === taskId &&
        t.studyId === context.studyId &&
        t.siteId === context.siteId
    );

    if (taskIndex === -1) {
      throw new Error(`Task with ID "${taskId}" not found in current site scope.`);
    }

    const task = this.tasks[taskIndex];

    if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      throw new Error(`Cannot reassign a ${task.status.toLowerCase()} task.`);
    }

    const user = this.validateSiteUser(context, assignment.userId);

    // Prevent duplicate active assignment
    if (task.assignee?.userId === user.id) {
      throw new Error(`User ${user.displayName} is already actively assigned to this task.`);
    }

    // Mark previous active assignment as superseded
    task.assignments.forEach((a) => {
      if (a.status === 'ACTIVE') {
        a.status = 'SUPERSEDED';
      }
    });

    const userRole = this.userRoles.find(
      (ur) =>
        ur.userId === user.id &&
        ur.studyId === context.studyId &&
        ur.siteId === context.siteId
    );
    const role = userRole ? this.roles.find((r) => r.id === userRole.roleId) : undefined;

    const newAssignment: TaskAssignment = {
      id: `TA-${Date.now().toString(36).toUpperCase()}`,
      taskId: task.id,
      userId: user.id,
      assignedBy: assignment.assignedBy || 'Dr. Ananya Sharma (PI)',
      assignedAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    task.assignments.push(newAssignment);
    task.assignee = {
      userId: user.id,
      displayName: user.displayName,
      email: user.email,
      designation: user.designation,
      roleId: role?.id,
      roleName: role?.name,
    };

    if (task.status === 'DRAFT') {
      task.status = 'ASSIGNED';
    }

    task.updatedAt = new Date().toISOString();
    this.notifySave();
    return structuredClone(task);
  }

  async updateTaskStatus(
    context: ParticipantQueryContext,
    taskId: string,
    nextStatus: TaskStatus
  ): Promise<Task> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const taskIndex = this.tasks.findIndex(
      (t) =>
        t.id === taskId &&
        t.studyId === context.studyId &&
        t.siteId === context.siteId
    );

    if (taskIndex === -1) {
      throw new Error(`Task with ID "${taskId}" not found in current site scope.`);
    }

    const task = this.tasks[taskIndex];

    const isValid = isValidTaskTransition(
      task.status,
      nextStatus,
      task.requiresApproval
    );

    if (!isValid) {
      if (nextStatus === 'COMPLETED' && task.requiresApproval && task.status !== 'APPROVED') {
        throw new Error(
          `Invalid task status transition: Tasks requiring approval cannot transition from ${task.status} directly to COMPLETED. They must be submitted, reviewed, and approved.`
        );
      }
      throw new Error(
        `Invalid task status transition: Cannot transition from ${task.status} to ${nextStatus}.`
      );
    }

    task.status = nextStatus;
    task.updatedAt = new Date().toISOString();

    if (nextStatus === 'SUBMITTED' && !task.submittedAt) {
      task.submittedAt = new Date().toISOString();
    }

    if (nextStatus === 'COMPLETED') {
      task.completedAt = new Date().toISOString();
    }

    this.notifySave();
    return structuredClone(task);
  }

  async submitTask(
    context: ParticipantQueryContext,
    taskId: string
  ): Promise<Task> {
    return this.updateTaskStatus(context, taskId, 'SUBMITTED');
  }

  async approveTask(
    context: ParticipantQueryContext,
    taskId: string,
    reviewerId: string,
    comments: string
  ): Promise<Task> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const task = await this.getTaskById(context, taskId);
    if (!task) {
      throw new Error(`Task with ID "${taskId}" not found in current site scope.`);
    }

    if (task.status !== 'UNDER_REVIEW' && task.status !== 'SUBMITTED') {
      throw new Error(
        `Cannot approve task in "${task.status}" status. Task must be in SUBMITTED or UNDER_REVIEW state.`
      );
    }

    const reviewer = this.users.find((u) => u.id === reviewerId);
    const approvalRecord: TaskApproval = {
      id: `APPR-${Date.now().toString(36).toUpperCase()}`,
      taskId: task.id,
      reviewerId,
      reviewerName: reviewer ? `${reviewer.displayName} (${reviewer.designation})` : 'Principal Investigator',
      decision: 'APPROVED',
      comments: comments.trim() || 'Task approved by investigator.',
      reviewedAt: new Date().toISOString(),
    };

    const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
    this.tasks[taskIndex].approvals.push(approvalRecord);
    this.tasks[taskIndex].status = 'APPROVED';
    this.tasks[taskIndex].updatedAt = new Date().toISOString();

    this.notifySave();
    return structuredClone(this.tasks[taskIndex]);
  }

  async requestRevision(
    context: ParticipantQueryContext,
    taskId: string,
    reviewerId: string,
    comments: string
  ): Promise<Task> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const task = await this.getTaskById(context, taskId);
    if (!task) {
      throw new Error(`Task with ID "${taskId}" not found in current site scope.`);
    }

    if (task.status !== 'UNDER_REVIEW' && task.status !== 'SUBMITTED') {
      throw new Error(
        `Cannot request revision for task in "${task.status}" status. Task must be in SUBMITTED or UNDER_REVIEW state.`
      );
    }

    if (!comments || !comments.trim()) {
      throw new Error('Comments are required when requesting task revision.');
    }

    const reviewer = this.users.find((u) => u.id === reviewerId);
    const approvalRecord: TaskApproval = {
      id: `APPR-${Date.now().toString(36).toUpperCase()}`,
      taskId: task.id,
      reviewerId,
      reviewerName: reviewer ? `${reviewer.displayName} (${reviewer.designation})` : 'Principal Investigator',
      decision: 'REVISION_REQUIRED',
      comments: comments.trim(),
      reviewedAt: new Date().toISOString(),
    };

    const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
    this.tasks[taskIndex].approvals.push(approvalRecord);
    this.tasks[taskIndex].status = 'REVISION_REQUIRED';
    this.tasks[taskIndex].updatedAt = new Date().toISOString();

    this.notifySave();
    return structuredClone(this.tasks[taskIndex]);
  }

  async rejectTask(
    context: ParticipantQueryContext,
    taskId: string,
    reviewerId: string,
    comments: string
  ): Promise<Task> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const task = await this.getTaskById(context, taskId);
    if (!task) {
      throw new Error(`Task with ID "${taskId}" not found in current site scope.`);
    }

    if (!comments || !comments.trim()) {
      throw new Error('Comments are required when rejecting a task.');
    }

    const reviewer = this.users.find((u) => u.id === reviewerId);
    const approvalRecord: TaskApproval = {
      id: `APPR-${Date.now().toString(36).toUpperCase()}`,
      taskId: task.id,
      reviewerId,
      reviewerName: reviewer ? `${reviewer.displayName} (${reviewer.designation})` : 'Principal Investigator',
      decision: 'REJECTED',
      comments: comments.trim(),
      reviewedAt: new Date().toISOString(),
    };

    const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
    this.tasks[taskIndex].approvals.push(approvalRecord);
    this.tasks[taskIndex].status = 'CANCELLED';
    this.tasks[taskIndex].updatedAt = new Date().toISOString();

    this.notifySave();
    return structuredClone(this.tasks[taskIndex]);
  }

  async completeTask(
    context: ParticipantQueryContext,
    taskId: string
  ): Promise<Task> {
    return this.updateTaskStatus(context, taskId, 'COMPLETED');
  }
}

export const mockTaskRepository = new MockTaskRepository();
