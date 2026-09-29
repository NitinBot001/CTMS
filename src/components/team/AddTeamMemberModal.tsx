import React, { useState } from 'react';
import {
  X,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  KeyRound,
  FlaskConical,
  Database,
} from 'lucide-react';
import { Role, CreateTeamMemberInput, AppEnvironmentMode } from '../../types';
import { teamService } from '../../services/teamService';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studyId: string;
  studyName?: string;
  siteId: string;
  siteName?: string;
  roles: Role[];
  environmentMode?: AppEnvironmentMode;
}

interface CreatedMemberInfo {
  displayName: string;
  email: string;
  roleName: string;
  roleId: string;
  temporaryPassword: string;
  study: string;
  site: string;
}

export const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studyId,
  studyName,
  siteId,
  siteName,
  roles,
  environmentMode = 'MOCK',
}) => {
  const [step, setStep] = useState<'FORM' | 'CONFIRMATION'>('FORM');

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || 'ROLE_SUB_I');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('Clinical Research');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdInfo, setCreatedInfo] = useState<CreatedMemberInfo | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setDisplayName('');
    setEmail('');
    setSelectedRoleId(roles[0]?.id || 'ROLE_SUB_I');
    setEmployeeId('');
    setDesignation('');
    setDepartment('Clinical Research');
    setPhone('');
    setNotes('');
    setErrorMessage(null);
    setCreatedInfo(null);
    setStep('FORM');
    setCopied(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!displayName.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Email is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('A valid email address is required.');
      return;
    }

    if (!selectedRoleId) {
      setErrorMessage('Please select a role for this team member.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedRole = roles.find((r) => r.id === selectedRoleId);
      const roleName = selectedRole?.name || selectedRoleId;

      const payload: CreateTeamMemberInput = {
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        roleId: selectedRoleId,
        studyId,
        siteId,
        employeeId: employeeId.trim() || undefined,
        designation: designation.trim() || roleName,
        department: department.trim() || 'Clinical Research',
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        password: '128',
      };

      await teamService.createTeamMember({ studyId, siteId }, payload);

      setCreatedInfo({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        roleName,
        roleId: selectedRoleId,
        temporaryPassword: '128',
        study: studyName || studyId,
        site: siteName || siteId,
      });

      setStep('CONFIRMATION');
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to create team member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdInfo) return;
    const text = `AIIA CTMS Credentials (${createdInfo.roleName})\nEmail: ${createdInfo.email}\nTemporary Password: ${createdInfo.temporaryPassword}\nStudy: ${createdInfo.study}\nSite: ${createdInfo.site}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    handleResetForm();
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-surface border border-border rounded-sm shadow-xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-team-member-modal-title"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border bg-surface-soft flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="add-team-member-modal-title"
                className="font-serif font-bold text-base text-ink tracking-tight"
              >
                {step === 'FORM' ? 'Add Team Member' : 'Team Member Created'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-ink-muted">
                  {siteId} · {studyId}
                </span>
                <span className="text-border">•</span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase px-1.5 py-0.2 rounded border ${
                    environmentMode === 'EMPTY_TEST'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`}
                >
                  {environmentMode === 'EMPTY_TEST' ? (
                    <>
                      <FlaskConical className="w-2.5 h-2.5" /> Empty Test
                    </>
                  ) : (
                    <>
                      <Database className="w-2.5 h-2.5" /> Mock Mode
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-sm text-ink-muted hover:text-ink hover:bg-surface border border-transparent hover:border-border transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {step === 'FORM' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Synthetic Environment Notice */}
              <div className="p-3 rounded-sm bg-surface-soft border border-border flex items-start gap-2.5 text-ink-secondary">
                <KeyRound className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-semibold text-ink">Local Staff Account:</span> Accounts are
                  created locally in this browser workspace. A default temporary password{' '}
                  <strong className="font-mono text-primary font-bold">128</strong> will be generated
                  for initial sign-in.
                </div>
              </div>

              {/* Error banner */}
              {errorMessage && (
                <div className="p-3 rounded-sm bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <span className="font-semibold">Creation Error:</span> {errorMessage}
                  </div>
                </div>
              )}

              {/* Study & Site Read-only Scope */}
              <div className="grid grid-cols-2 gap-3 p-2.5 bg-surface-soft/60 rounded-sm border border-border/70 text-[11px]">
                <div>
                  <span className="text-ink-muted block uppercase tracking-wider text-[10px] font-mono">
                    Assigned Study Scope
                  </span>
                  <span className="font-semibold text-ink truncate block">
                    {studyName || studyId}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block uppercase tracking-wider text-[10px] font-mono">
                    Assigned Site Scope
                  </span>
                  <span className="font-semibold text-ink truncate block">
                    {siteName || siteId}
                  </span>
                </div>
              </div>

              {/* Required Fields */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-ink mb-1">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Rahul Kumar, Dr. Sneha Rao"
                    className="w-full px-3 py-2 text-xs border border-border rounded-sm bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink mb-1">
                    Institutional Email / Login Identifier <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahul@example.test"
                    className="w-full px-3 py-2 text-xs border border-border rounded-sm bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <span className="text-[10px] text-ink-muted mt-0.5 block">
                    Must be unique. Case-insensitive matching is enforced.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink mb-1">
                    Assigned Role <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-sm bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.type === 'SYSTEM' ? 'System Role' : 'Custom Role'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Fields Divider */}
              <div className="pt-2 border-t border-border">
                <span className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wider block mb-2 font-mono">
                  Additional Details (Optional)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-ink mb-1">Staff ID / Employee ID</label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g. EMP-2026-088"
                      className="w-full px-3 py-1.5 text-xs border border-border rounded-sm bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-ink mb-1">Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Defaults to role title"
                      className="w-full px-3 py-1.5 text-xs border border-border rounded-sm bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-ink mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Clinical Research"
                      className="w-full px-3 py-1.5 text-xs border border-border rounded-sm bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-ink mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 11 2999 0000"
                      className="w-full px-3 py-1.5 text-xs border border-border rounded-sm bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] text-ink mb-1">Delegation Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes regarding delegation of authority or site assignment"
                    className="w-full px-3 py-1.5 text-xs border border-border rounded-sm bg-surface text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold text-ink-secondary bg-surface border border-border hover:bg-surface-soft rounded-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Creating Staff Account...' : 'Create Team Member'}
                </button>
              </div>
            </form>
          ) : (
            /* Confirmation View (Section 7) */
            <div className="space-y-4 py-2 animate-in fade-in">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-serif font-bold text-sm text-emerald-900">
                    Team Member Created Successfully
                  </h3>
                  <p className="text-[11px] text-emerald-700">
                    User account and role delegation established. The team member can now log in
                    using the temporary credential below.
                  </p>
                </div>
              </div>

              {/* Credential Card */}
              <div className="bg-surface-soft border border-border rounded-sm p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                      Name
                    </span>
                    <span className="font-bold text-ink text-sm block mt-0.5">
                      {createdInfo?.displayName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                      Assigned Role
                    </span>
                    <span className="font-semibold text-primary block mt-0.5">
                      {createdInfo?.roleName}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                      Institutional Email (Login ID)
                    </span>
                    <span className="font-mono text-xs font-semibold text-ink block mt-0.5 bg-surface px-2.5 py-1 rounded border border-border select-all">
                      {createdInfo?.email}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                      Temporary Password
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-sm font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded select-all">
                        {createdInfo?.temporaryPassword}
                      </span>
                      <span className="text-[11px] text-ink-muted italic">
                        (Active demo temporary credential)
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                      Study
                    </span>
                    <span className="text-ink text-xs block mt-0.5">{createdInfo?.study}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                      Site
                    </span>
                    <span className="text-ink text-xs block mt-0.5">{createdInfo?.site}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-sm text-[11px] text-amber-900 leading-relaxed">
                  <span className="font-semibold">Security Notice:</span> This temporary password
                  is displayed only during creation confirmation and will not be displayed in team
                  lists. The staff user should reset their password upon first login.
                </div>
              </div>

              {/* Confirmation Actions */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-secondary bg-surface border border-border hover:bg-surface-soft rounded-sm transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Credentials</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDone}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
