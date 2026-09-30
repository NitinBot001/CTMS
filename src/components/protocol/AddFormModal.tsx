import React, { useState } from 'react';
import {
  CreateFormDefinitionInput,
  ProtocolFormType,
  ProtocolVisitDefinition,
} from '../../types';
import { X, FileText, AlertCircle } from 'lucide-react';

interface AddFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  visits: ProtocolVisitDefinition[];
  nextOrder: number;
  onSubmit: (input: CreateFormDefinitionInput) => Promise<void>;
}

export const AddFormModal: React.FC<AddFormModalProps> = ({
  isOpen,
  onClose,
  visits,
  nextOrder,
  onSubmit,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [formType, setFormType] = useState<ProtocolFormType>('VISIT');
  const [dataDomain, setDataDomain] = useState('CLINICAL');
  const [applicableVisitDefinitionId, setApplicableVisitDefinitionId] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0');
  const [displayOrder, setDisplayOrder] = useState<number>(nextOrder);
  const [required, setRequired] = useState(true);
  const [participantVisible, setParticipantVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setErrorMessage('Form code and name are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        formType,
        dataDomain: dataDomain.trim() || 'CLINICAL',
        applicableVisitDefinitionId: applicableVisitDefinitionId || undefined,
        description: description.trim() || undefined,
        version: version.trim() || '1.0',
        displayOrder: Number(displayOrder),
        required,
        participantVisible,
        status: 'ACTIVE',
      });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add form definition.');
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
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-base text-ink">
              Add Protocol Case Report Form (eCRF) Definition
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1">
                Form Code <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CRF-V4-PRIMARY"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden uppercase font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">Form Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as ProtocolFormType)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden bg-white"
              >
                <option value="VISIT">Visit Clinical CRF</option>
                <option value="ASSESSMENT">Assessment / Questionnaire</option>
                <option value="INVESTIGATION">Laboratory / Diagnostic</option>
                <option value="OUTCOME">Endpoint / Efficacy</option>
                <option value="SAFETY">Safety / Adverse Event</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              Form Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Day 30 Primary Biomarkers & Safety eCRF"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1">Data Domain</label>
              <input
                type="text"
                placeholder="e.g. CLINICAL, AYURVEDA, LAB"
                value={dataDomain}
                onChange={(e) => setDataDomain(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">
                Applicable Visit (Optional)
              </label>
              <select
                value={applicableVisitDefinitionId}
                onChange={(e) => setApplicableVisitDefinitionId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden bg-white"
              >
                <option value="">-- Unrestricted / Multiple Visits --</option>
                {visits.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.sequence}. {v.name} ({v.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Purpose, data collection guidelines, or transcription instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1">Display Order</label>
              <input
                type="number"
                min={1}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-ink">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="rounded-xs text-primary focus:ring-primary"
              />
              <span>Mandatory Form</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-ink">
              <input
                type="checkbox"
                checked={participantVisible}
                onChange={(e) => setParticipantVisible(e.target.checked)}
                className="rounded-xs text-primary focus:ring-primary"
              />
              <span>Visible in Participant Portal</span>
            </label>
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
              {isSubmitting ? 'Adding...' : 'Add Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
