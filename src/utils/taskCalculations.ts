import { TaskStatus } from '../types';

export const TASK_REFERENCE_DATE = '2026-09-29';

/**
 * Standard ICH-GCP clinical task lifecycle transition map.
 * Enforces controlled state progression without arbitrary status jumps.
 */
export const VALID_TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  DRAFT: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'ASSIGNED', 'CANCELLED'],
  IN_PROGRESS: ['SUBMITTED', 'COMPLETED', 'CANCELLED'],
  SUBMITTED: ['UNDER_REVIEW', 'COMPLETED', 'REVISION_REQUIRED', 'CANCELLED'],
  UNDER_REVIEW: ['APPROVED', 'REVISION_REQUIRED', 'CANCELLED'],
  REVISION_REQUIRED: ['IN_PROGRESS', 'CANCELLED'],
  APPROVED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Validates whether a requested task status transition is permitted.
 * Strictly enforces approval rules: tasks requiring approval CANNOT transition
 * to COMPLETED directly from IN_PROGRESS or SUBMITTED.
 */
export function isValidTaskTransition(
  currentStatus: TaskStatus,
  nextStatus: TaskStatus,
  requiresApproval: boolean = true
): boolean {
  if (currentStatus === nextStatus && currentStatus !== 'ASSIGNED') {
    return false;
  }

  const allowedTransitions = VALID_TASK_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(nextStatus)) {
    return false;
  }

  // Approval Rule: A task requiring approval must not become COMPLETED directly from IN_PROGRESS or SUBMITTED
  if (nextStatus === 'COMPLETED' && requiresApproval && currentStatus !== 'APPROVED') {
    return false;
  }

  return true;
}

/**
 * Returns available next statuses for a given task state and approval requirement.
 */
export function getAvailableTaskTransitions(
  currentStatus: TaskStatus,
  requiresApproval: boolean = true
): TaskStatus[] {
  const allowed = VALID_TASK_TRANSITIONS[currentStatus] || [];
  if (requiresApproval) {
    return allowed.filter((status) => {
      if (status === 'COMPLETED' && currentStatus !== 'APPROVED') {
        return false;
      }
      return true;
    });
  }
  return allowed;
}

/**
 * Calculates whether a task is overdue based on reference date.
 * Completed and Cancelled tasks are never overdue.
 */
export function isTaskOverdue(
  dueDate: string,
  status: TaskStatus,
  refDate: string = TASK_REFERENCE_DATE
): boolean {
  if (status === 'COMPLETED' || status === 'CANCELLED') {
    return false;
  }
  return dueDate < refDate;
}

/**
 * Calculates whether a task is due today.
 */
export function isTaskDueToday(
  dueDate: string,
  refDate: string = TASK_REFERENCE_DATE
): boolean {
  return dueDate === refDate;
}
