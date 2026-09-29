import { ITaskRepository, ParticipantQueryContext } from '../repositories/interfaces';
import { environmentService } from './environmentService';
import {
  Task,
  TaskAssignment,
  TaskSummaryMetrics,
  TaskFilters,
  CreateTaskInput,
  AssignTaskInput,
  TaskStatus,
} from '../types';

export class TaskService {
  private _customRepo?: ITaskRepository;

  constructor(repository?: ITaskRepository) {
    this._customRepo = repository;
  }

  private get repo(): ITaskRepository {
    return this._customRepo || environmentService.getTaskRepository();
  }

  async getTasks(
    context: ParticipantQueryContext,
    filters?: TaskFilters
  ): Promise<Task[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.getTasks(context, filters);
  }

  async getTaskById(
    context: ParticipantQueryContext,
    taskId: string
  ): Promise<Task | null> {
    if (!context.studyId || !context.siteId || !taskId) {
      return null;
    }
    return this.repo.getTaskById(context, taskId);
  }

  async getTaskSummary(
    context: ParticipantQueryContext,
    currentUserId?: string
  ): Promise<TaskSummaryMetrics> {
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
    return this.repo.getTaskSummary(context, currentUserId);
  }

  async getTaskAssignments(
    context: ParticipantQueryContext,
    taskId: string
  ): Promise<TaskAssignment[]> {
    if (!context.studyId || !context.siteId || !taskId) {
      return [];
    }
    return this.repo.getTaskAssignments(context, taskId);
  }

  async getMyTasks(
    context: ParticipantQueryContext,
    userId: string
  ): Promise<Task[]> {
    if (!context.studyId || !context.siteId || !userId) {
      return [];
    }
    return this.repo.getMyTasks(context, userId);
  }

  async createTask(
    context: ParticipantQueryContext,
    input: CreateTaskInput
  ): Promise<Task> {
    if (!context.studyId || !context.siteId) {
      throw new Error('Study and site context are required to create a task.');
    }
    return this.repo.createTask(context, input);
  }

  async assignTask(
    context: ParticipantQueryContext,
    taskId: string,
    assignment: AssignTaskInput
  ): Promise<Task> {
    if (!context.studyId || !context.siteId || !taskId) {
      throw new Error('Valid context and task ID are required for assignment.');
    }
    return this.repo.assignTask(context, taskId, assignment);
  }

  async updateTaskStatus(
    context: ParticipantQueryContext,
    taskId: string,
    status: TaskStatus
  ): Promise<Task> {
    if (!context.studyId || !context.siteId || !taskId) {
      throw new Error('Valid context and task ID are required to update status.');
    }
    return this.repo.updateTaskStatus(context, taskId, status);
  }

  async submitTask(
    context: ParticipantQueryContext,
    taskId: string
  ): Promise<Task> {
    if (!context.studyId || !context.siteId || !taskId) {
      throw new Error('Valid context and task ID are required to submit task.');
    }
    return this.repo.submitTask(context, taskId);
  }

  async approveTask(
    context: ParticipantQueryContext,
    taskId: string,
    reviewerId: string,
    comments: string
  ): Promise<Task> {
    if (!context.studyId || !context.siteId || !taskId) {
      throw new Error('Valid context and task ID are required to approve task.');
    }
    return this.repo.approveTask(context, taskId, reviewerId, comments);
  }

  async requestRevision(
    context: ParticipantQueryContext,
    taskId: string,
    reviewerId: string,
    comments: string
  ): Promise<Task> {
    if (!context.studyId || !context.siteId || !taskId) {
      throw new Error('Valid context and task ID are required to request revision.');
    }
    return this.repo.requestRevision(context, taskId, reviewerId, comments);
  }

  async rejectTask(
    context: ParticipantQueryContext,
    taskId: string,
    reviewerId: string,
    comments: string
  ): Promise<Task> {
    if (!context.studyId || !context.siteId || !taskId) {
      throw new Error('Valid context and task ID are required to reject task.');
    }
    return this.repo.rejectTask(context, taskId, reviewerId, comments);
  }

  async completeTask(
    context: ParticipantQueryContext,
    taskId: string
  ): Promise<Task> {
    if (!context.studyId || !context.siteId || !taskId) {
      throw new Error('Valid context and task ID are required to complete task.');
    }
    return this.repo.completeTask(context, taskId);
  }
}

export const taskService = new TaskService();
