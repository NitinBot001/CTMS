import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Permission, Role } from '../../types';
import { teamService } from '../../services/teamService';
import { PermissionMatrix } from './PermissionMatrix';

interface CreateCustomRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdRole: Role) => void;
  permissions: Permission[];
  studyId: string;
  siteId: string;
}

export const CreateCustomRoleModal: React.FC<CreateCustomRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  permissions,
  studyId,
  siteId,
}) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Role name is required.');
      return;
    }

    if (selectedPermissionIds.length === 0) {
      setErrorMessage('At least one permission must be assigned to the role.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await teamService.createCustomRole(
        { studyId, siteId },
        {
          name: trimmedName,
          description: description.trim() || 'Custom delegated clinical role',
          permissionIds: selectedPermissionIds,
        }
      );

      setSuccessMessage(`Custom role "${created.name}" created successfully.`);
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess(created);
        onClose();
      }, 900);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage((err as Error).message || 'Failed to create custom role.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-surface border border-border rounded-sm shadow-xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-role-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-surface-soft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="create-role-modal-title"
                className="font-serif font-bold text-ink text-base"
              >
                Create Custom Role Template
              </h2>
              <p className="text-xs text-ink-muted">
                Configure tailored permission catalog for specialized site roles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors p-1 rounded hover:bg-surface"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2.5 text-xs text-semantic-danger">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Role Creation Error</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm flex items-start gap-2.5 text-xs text-secondary">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Role Created</p>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          {/* Role Name & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-serif font-bold text-ink">
                Role Name <span className="text-semantic-danger">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Clinical Trial Auditor, Phlebotomy Specialist"
                className="w-full text-xs bg-surface border border-border rounded-sm px-3 py-2 text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-ink-muted">
                Unique identifier for this custom role within the CTMS.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-serif font-bold text-ink">
                Description & Delegated Responsibilities
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Oversees quality audits and source data verification"
                className="w-full text-xs bg-surface border border-border rounded-sm px-3 py-2 text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-ink-muted">
                Summarize the operational scope of this custom role.
              </p>
            </div>
          </div>

          {/* Permission Matrix */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-ink text-sm">
                  Permission Matrix Configuration
                </h3>
                <p className="text-xs text-ink-muted">
                  Select the specific module actions permitted under this role
                </p>
              </div>
            </div>

            <PermissionMatrix
              permissions={permissions}
              selectedPermissionIds={selectedPermissionIds}
              onChange={setSelectedPermissionIds}
              readOnly={false}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-serif font-semibold text-ink-secondary hover:text-ink bg-surface-soft border border-border rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-serif font-bold text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Role...' : 'Create Custom Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
