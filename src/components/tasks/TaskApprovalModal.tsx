import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Task, TaskApprovalDecision } from '../../types';
import { taskService } from '../../services/taskService';

interface TaskApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studyId: string;
  siteId: string;
  task: Task;
}

export const TaskApprovalModal: React.FC<TaskApprovalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studyId,
  siteId,
  task,
}) => {
  const [decision, setDecision] = useState<TaskApprovalDecision>('APPROVED');
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (decision !== 'APPROVED' && !comments.trim()) {
      setErrorMessage('Detailed comments are required when requesting revision or rejecting a task.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewerId = 'USR-101'; // Dr. Ananya Sharma (PI)
      const reviewComments = comments.trim() || 'Clinically reviewed and approved by Principal Investigator.';

      if (decision === 'APPROVED') {
        await taskService.approveTask(
          { studyId, siteId },
          task.id,
          reviewerId,
          reviewComments
        );
        setSuccessMessage(`Task "${task.id}" has been APPROVED.`);
      } else if (decision === 'REVISION_REQUIRED') {
        await taskService.requestRevision(
          { studyId, siteId },
          task.id,
          reviewerId,
          reviewComments
        );
        setSuccessMessage(`Revision requested for task "${task.id}". Returned to assignee.`);
      } else if (decision === 'REJECTED') {
        await taskService.rejectTask(
          { studyId, siteId },
          task.id,
          reviewerId,
          reviewComments
        );
        setSuccessMessage(`Task "${task.id}" has been REJECTED and CANCELLED.`);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 800);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to record approval decision.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-surface border border-border rounded-sm max-w-lg w-full shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-soft">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-purple-50 flex items-center justify-center text-purple-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="approval-modal-title" className="text-base font-serif font-bold text-ink">
                PI Review & Approval Determination
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

          {/* Task Info Summary */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-sm">
            <span className="text-xs font-semibold text-ink block leading-snug">
              {task.title}
            </span>
            <span className="text-[11px] text-ink-muted block mt-0.5">
              Assignee: <strong>{task.assignee?.displayName || 'Unassigned'}</strong> · Category:{' '}
              <strong>{task.category}</strong>
            </span>
          </div>

          {/* Decision Selection */}
          <div>
            <label className="block text-xs font-bold text-ink-secondary mb-2">
              REVIEW DECISION *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`p-3 border rounded-sm cursor-pointer flex flex-col justify-between transition-colors ${
                  decision === 'APPROVED'
                    ? 'bg-emerald-50 border-emerald-400 text-secondary'
                    : 'bg-surface-soft border-border text-ink hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVED"
                    checked={decision === 'APPROVED'}
                    onChange={() => setDecision('APPROVED')}
                    className="text-secondary focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold">Approve</span>
                </div>
                <span className="text-[10px] text-ink-muted mt-1">
                  Verified & ready for completion.
                </span>
              </label>

              <label
                className={`p-3 border rounded-sm cursor-pointer flex flex-col justify-between transition-colors ${
                  decision === 'REVISION_REQUIRED'
                    ? 'bg-amber-50 border-amber-400 text-amber-900'
                    : 'bg-surface-soft border-border text-ink hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decision"
                    value="REVISION_REQUIRED"
                    checked={decision === 'REVISION_REQUIRED'}
                    onChange={() => setDecision('REVISION_REQUIRED')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold">Request Revision</span>
                </div>
                <span className="text-[10px] text-ink-muted mt-1">
                  Return to assignee with corrections.
                </span>
              </label>

              <label
                className={`p-3 border rounded-sm cursor-pointer flex flex-col justify-between transition-colors ${
                  decision === 'REJECTED'
                    ? 'bg-rose-50 border-rose-400 text-rose-900'
                    : 'bg-surface-soft border-border text-ink hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decision"
                    value="REJECTED"
                    checked={decision === 'REJECTED'}
                    onChange={() => setDecision('REJECTED')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold">Reject & Cancel</span>
                </div>
                <span className="text-[10px] text-ink-muted mt-1">
                  Invalidate or cancel action.
                </span>
              </label>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-bold text-ink-secondary mb-1">
              INVESTIGATOR REVIEW COMMENTS {decision !== 'APPROVED' ? '*' : '(OPTIONAL)'}
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                decision === 'APPROVED'
                  ? 'Confirm clinical source document verification or add approval notes...'
                  : 'Specify deficiencies, missing documents, or necessary amendments...'
              }
              className="w-full px-3 py-2 text-xs bg-surface-soft border border-border rounded-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              required={decision !== 'APPROVED'}
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
              className={`px-4 py-1.5 text-xs font-medium text-white rounded-sm transition-colors disabled:opacity-50 shadow-xs ${
                decision === 'APPROVED'
                  ? 'bg-secondary hover:bg-emerald-700'
                  : decision === 'REVISION_REQUIRED'
                  ? 'bg-amber-700 hover:bg-amber-800'
                  : 'bg-rose-700 hover:bg-rose-800'
              }`}
            >
              {isSubmitting
                ? 'Processing...'
                : decision === 'APPROVED'
                ? 'Submit Approval'
                : decision === 'REVISION_REQUIRED'
                ? 'Send Revision Request'
                : 'Reject & Cancel Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
