import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Task, TeamMemberSummary } from '../../types';
import { taskService } from '../../services/taskService';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studyId: string;
  siteId: string;
  task: Task;
  teamMembers: TeamMemberSummary[];
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studyId,
  siteId,
  task,
  teamMembers,
}) => {
  const activeMembers = teamMembers.filter((m) => m.user.status === 'ACTIVE');
  const [selectedUserId, setSelectedUserId] = useState<string>(
    task.assignee?.userId || activeMembers[0]?.user.id || ''
  );
  const [assignedBy, setAssignedBy] = useState<string>('Dr. Ananya Sharma (PI)');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedUserId) {
      setErrorMessage('Please select a staff member to assign.');
      return;
    }

    setIsSubmitting(true);
    try {
      await taskService.assignTask(
        { studyId, siteId },
        task.id,
        {
          userId: selectedUserId,
          assignedBy: assignedBy.trim() || 'Principal Investigator',
        }
      );

      const member = activeMembers.find((m) => m.user.id === selectedUserId);
      setSuccessMessage(
        `Task "${task.id}" successfully assigned to ${member?.user.displayName || 'staff member'}.`
      );

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 800);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to assign task.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-task-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-surface border border-border rounded-sm max-w-md w-full shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-soft">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 id="assign-task-title" className="text-base font-serif font-bold text-ink">
                Assign Study Task
              </h3>
              <p className="text-xs text-ink-muted">
                Task ID: <span className="font-mono font-bold text-ink">{task.id}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink p-1 rounded-sm"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Task Summary Banner */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm">
            <span className="text-xs font-semibold text-ink block leading-snug">
              {task.title}
            </span>
            <span className="text-[11px] text-ink-muted block mt-0.5">
              Current Status: <strong className="font-mono">{task.status}</strong> · Due:{' '}
              <strong className="font-mono">{task.dueDate}</strong>
            </span>
          </div>

          {/* Assignee Selection */}
          <div>
            <label className="block text-xs font-bold text-ink-secondary mb-1">
              SELECT SITE STAFF MEMBER *
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              required
            >
              {activeMembers.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.displayName} — {m.user.designation} (
                  {m.roles.map((r) => r.name).join(', ') || 'No Role'})
                </option>
              ))}
            </select>
          </div>

          {/* Delegated By */}
          <div>
            <label className="block text-xs font-bold text-ink-secondary mb-1">
              DELEGATED BY
            </label>
            <input
              type="text"
              value={assignedBy}
              onChange={(e) => setAssignedBy(e.target.value)}
              placeholder="e.g. Dr. Ananya Sharma (PI)"
              className="w-full px-3 py-2 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink hover:bg-stone-100 rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
