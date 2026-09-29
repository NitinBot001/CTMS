import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  TaskCategory,
  TaskPriority,
  RelatedEntityType,
  TeamMemberSummary,
} from '../../types';
import { taskService } from '../../services/taskService';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studyId: string;
  siteId: string;
  teamMembers: TeamMemberSummary[];
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studyId,
  siteId,
  teamMembers,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('OTHER');
  const [priority, setPriority] = useState<TaskPriority>('NORMAL');
  const [dueDate, setDueDate] = useState('2026-10-05');
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [relatedEntityType, setRelatedEntityType] = useState<RelatedEntityType | 'NONE'>('NONE');
  const [relatedEntityId, setRelatedEntityId] = useState('');
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setErrorMessage('Task title is required.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Task description is required.');
      return;
    }

    if (!dueDate) {
      setErrorMessage('Due date is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await taskService.createTask(
        { studyId, siteId },
        {
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          dueDate,
          requiresApproval,
          approvalRequiredFromRoleId: requiresApproval ? 'ROLE_PI' : undefined,
          relatedEntityType: relatedEntityType !== 'NONE' ? relatedEntityType : undefined,
          relatedEntityId: relatedEntityType !== 'NONE' && relatedEntityId.trim() ? relatedEntityId.trim() : undefined,
          assigneeUserId: assigneeUserId || undefined,
          createdBy: 'Dr. Ananya Sharma (PI)',
        }
      );

      setSuccessMessage('Task created successfully.');
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 800);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to create task.'
      );
    }
  };

  const activeMembers = teamMembers.filter((m) => m.user.status === 'ACTIVE');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-task-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-surface border border-border rounded-sm max-w-xl w-full shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-soft">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="create-task-title" className="text-base font-serif font-bold text-ink">
                Create Clinical Trial Task
              </h3>
              <p className="text-xs text-ink-muted">
                Assign operational study responsibility at site {siteId}
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

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-ink-secondary mb-1">
              TASK TITLE *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Expedited Safety Narrative Review for SAE-003"
              className="w-full px-3 py-2 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-ink-secondary mb-1">
              ACTION DESCRIPTION *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the operational actions required, protocols to consult, and completion criteria..."
              className="w-full px-3 py-2 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
          </div>

          {/* Row: Category, Priority, Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1">
                CATEGORY *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-2.5 py-1.5 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="SAFETY">Safety</option>
                <option value="COMPLIANCE">Compliance</option>
                <option value="PARTICIPANT">Participant</option>
                <option value="VISIT">Visit</option>
                <option value="DOCUMENT">Document</option>
                <option value="REPORT">Report</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="TRAINING">Training</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1">
                PRIORITY *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-1.5 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="NORMAL">Normal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1">
                DUE DATE *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent font-mono"
                required
              />
            </div>
          </div>

          {/* Row: Assignee & Approval Rule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1">
                ASSIGNEE (SITE STAFF)
              </label>
              <select
                value={assigneeUserId}
                onChange={(e) => setAssigneeUserId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Leave Unassigned (Draft)</option>
                {activeMembers.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.displayName} ({m.user.designation})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-2 cursor-pointer mt-3">
                <input
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="rounded text-primary focus:ring-accent h-4 w-4"
                />
                <span className="text-xs font-medium text-ink">
                  Requires PI Review & Sign-Off
                </span>
              </label>
              <p className="text-[11px] text-ink-muted pl-6">
                When checked, task cannot complete directly; must pass PI approval.
              </p>
            </div>
          </div>

          {/* Row: Related Clinical Entity Linkage */}
          <div className="pt-2 border-t border-border/60">
            <label className="block text-xs font-bold text-ink-secondary mb-1">
              CROSS-LINK CLINICAL ENTITY (OPTIONAL)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={relatedEntityType}
                onChange={(e) =>
                  setRelatedEntityType(e.target.value as RelatedEntityType | 'NONE')
                }
                className="w-full px-2.5 py-1.5 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="NONE">No Entity Linkage</option>
                <option value="SAFETY">Safety Event (SAE / AE)</option>
                <option value="COMPLIANCE">Protocol Deviation (DEV)</option>
                <option value="VISIT">Scheduled Visit (VIS)</option>
                <option value="PARTICIPANT">Study Subject (PT)</option>
              </select>

              {relatedEntityType !== 'NONE' && (
                <input
                  type="text"
                  value={relatedEntityId}
                  onChange={(e) => setRelatedEntityId(e.target.value)}
                  placeholder="e.g. SAE-003, DEV-001, VIS-1023-04, PT-1011"
                  className="w-full px-2.5 py-1.5 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent font-mono uppercase"
                />
              )}
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
