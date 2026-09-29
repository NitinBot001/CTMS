import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import { Role, TeamMemberSummary } from '../../types';
import { teamService } from '../../services/teamService';

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studyId: string;
  siteId: string;
  teamMembers: TeamMemberSummary[];
  roles: Role[];
  preselectedUserId?: string;
}

export const AssignRoleModal: React.FC<AssignRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studyId,
  siteId,
  teamMembers,
  roles,
  preselectedUserId,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(
    preselectedUserId || (teamMembers[0]?.user.id || '')
  );
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    roles[0]?.id || ''
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
      setErrorMessage('Please select a team member.');
      return;
    }

    if (!selectedRoleId) {
      setErrorMessage('Please select a role to assign.');
      return;
    }

    setIsSubmitting(true);
    try {
      await teamService.assignRole(
        { studyId, siteId },
        {
          userId: selectedUserId,
          roleId: selectedRoleId,
          studyId,
          siteId,
          assignedBy: assignedBy.trim() || 'Principal Investigator',
        }
      );

      const targetMember = teamMembers.find((m) => m.user.id === selectedUserId);
      const targetRole = roles.find((r) => r.id === selectedRoleId);
      setSuccessMessage(
        `Role "${targetRole?.name}" successfully assigned to ${targetMember?.user.displayName || 'member'}.`
      );

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage((err as Error).message || 'Failed to assign role.');
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-surface border border-border rounded-sm shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-role-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-surface-soft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="assign-role-modal-title"
                className="font-serif font-bold text-ink text-base"
              >
                Assign Role to Team Member
              </h2>
              <p className="text-xs text-ink-muted">
                Delegate operational authority within site scope
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-sm flex items-start gap-2.5 text-xs text-semantic-danger">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Assignment Failed</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm flex items-start gap-2.5 text-xs text-secondary">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Role Assigned</p>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          {/* Scope Context Banner (Locked) */}
          <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-sm flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                Scope Context (Locked)
              </span>
              <p className="text-ink font-medium">
                Site: <span className="font-mono font-bold">{siteId}</span> · Study:{' '}
                <span className="font-mono">{studyId}</span>
              </p>
            </div>
            <span className="text-[10px] bg-white text-blue-900 border border-blue-200 font-mono font-semibold px-2 py-0.5 rounded">
              SITE SCOPED
            </span>
          </div>

          {/* Select Team Member */}
          <div className="space-y-1.5">
            <label className="block text-xs font-serif font-bold text-ink">
              Team Member <span className="text-semantic-danger">*</span>
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={Boolean(preselectedUserId)}
              className="w-full text-xs bg-surface border border-border rounded-sm px-3 py-2 text-ink focus:outline-hidden focus:ring-1 focus:ring-primary disabled:bg-surface-soft disabled:cursor-not-allowed"
            >
              {teamMembers.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.displayName} ({m.user.designation})
                </option>
              ))}
            </select>
          </div>

          {/* Select Role */}
          <div className="space-y-1.5">
            <label className="block text-xs font-serif font-bold text-ink">
              Role to Assign <span className="text-semantic-danger">*</span>
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full text-xs bg-surface border border-border rounded-sm px-3 py-2 text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <optgroup label="System Roles (Standard Templates)">
                {roles
                  .filter((r) => r.type === 'SYSTEM')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.permissionIds.length} permissions)
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Custom Roles (Site Specific)">
                {roles
                  .filter((r) => r.type === 'CUSTOM')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.permissionIds.length} permissions)
                    </option>
                  ))}
              </optgroup>
            </select>

            {/* Selected Role preview description */}
            {selectedRole && (
              <div className="p-2.5 bg-surface-soft border border-border rounded-sm text-xs mt-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-ink">
                  {selectedRole.type === 'SYSTEM' ? (
                    <Shield className="w-3.5 h-3.5 text-slate-700" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  )}
                  <span>{selectedRole.name}</span>
                  <span className="text-[10px] font-mono text-ink-muted">
                    ({selectedRole.permissionIds.length} permissions)
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                  {selectedRole.description}
                </p>
              </div>
            )}
          </div>

          {/* Delegated Authority Signature / Assigned By */}
          <div className="space-y-1.5">
            <label className="block text-xs font-serif font-bold text-ink">
              Delegated By / Authority <span className="text-semantic-danger">*</span>
            </label>
            <input
              type="text"
              value={assignedBy}
              onChange={(e) => setAssignedBy(e.target.value)}
              className="w-full text-xs bg-surface border border-border rounded-sm px-3 py-2 text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
              placeholder="e.g. Dr. Ananya Sharma (PI)"
            />
            <p className="text-[10px] text-ink-muted">
              Attaches PI audit signature to the delegation log for this site.
            </p>
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
              {isSubmitting ? 'Assigning Role...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
