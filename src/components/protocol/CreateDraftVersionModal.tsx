import React, { useState } from 'react';
import { ProtocolVersion } from '../../types';
import { X, GitBranch, AlertCircle, Copy } from 'lucide-react';

interface CreateDraftVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocolId: string;
  existingVersions: ProtocolVersion[];
  selectedVersionId: string;
  onSubmit: (input: {
    versionNumber: string;
    versionLabel?: string;
    changeSummary?: string;
    cloneFromVersionId?: string;
  }) => Promise<void>;
}

export const CreateDraftVersionModal: React.FC<CreateDraftVersionModalProps> = ({
  isOpen,
  onClose,
  existingVersions,
  selectedVersionId,
  onSubmit,
}) => {
  const [versionNumber, setVersionNumber] = useState('');
  const [versionLabel, setVersionLabel] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [cloneFromVersionId, setCloneFromVersionId] = useState(selectedVersionId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionNumber.trim()) {
      setErrorMessage('Version number is required (e.g. "2.2" or "3.0").');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({
        versionNumber: versionNumber.trim(),
        versionLabel: versionLabel.trim() || `Version ${versionNumber.trim()} (Draft Amendment)`,
        changeSummary: changeSummary.trim() || undefined,
        cloneFromVersionId: cloneFromVersionId || undefined,
      });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create draft version.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-surface rounded-sm shadow-subtle border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 text-primary">
            <GitBranch className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-base text-ink">
              Create New Protocol Version / Amendment
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink p-1 rounded-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xs flex items-start gap-2">
            <Copy className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Creating a draft version establishes an editable workspace. Active and approved versions
              remain immutable.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              New Version Number <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 2.2 or 3.0"
              value={versionNumber}
              onChange={(e) => setVersionNumber(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              required
            />
            <span className="text-[11px] text-ink-muted mt-1 block">
              Must be unique for this protocol (e.g. minor increment 2.2, major 3.0).
            </span>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              Version Label
            </label>
            <input
              type="text"
              placeholder="e.g. Version 2.2 (Biomarker Sampling Amendment)"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              Clone Configuration From Existing Version
            </label>
            <select
              value={cloneFromVersionId}
              onChange={(e) => setCloneFromVersionId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden bg-white"
            >
              <option value="">-- Blank Version (Do not clone) --</option>
              {existingVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber} ({v.status}) — {v.versionLabel}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-ink-muted mt-1 block">
              Copies visits, criteria, assessments, investigations, outcomes, and forms from selected version into the new draft.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              Summary of Changes / Amendment Rationale
            </label>
            <textarea
              rows={3}
              placeholder="Describe protocol adjustments, ethical committee amendment notes, or expanded visit windows..."
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-ink-muted hover:text-ink font-semibold rounded-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xs shadow-subtle transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Version...' : 'Create Draft Version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
