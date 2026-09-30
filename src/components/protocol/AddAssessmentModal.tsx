import React, { useState } from 'react';
import {
  CreateAssessmentDefinitionInput,
  ProtocolAssessmentCategory,
  ProtocolVisitDefinition,
} from '../../types';
import { X, Activity, AlertCircle } from 'lucide-react';

interface AddAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  visits: ProtocolVisitDefinition[];
  nextOrder: number;
  onSubmit: (input: CreateAssessmentDefinitionInput) => Promise<void>;
}

export const AddAssessmentModal: React.FC<AddAssessmentModalProps> = ({
  isOpen,
  onClose,
  visits,
  nextOrder,
  onSubmit,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProtocolAssessmentCategory>('ASSESSMENT');
  const [visitDefinitionId, setVisitDefinitionId] = useState(visits[0]?.id || '');
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
    if (!code.trim() || !name.trim() || !visitDefinitionId) {
      setErrorMessage('Assessment code, name, and linked visit are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category,
        visitDefinitionId,
        description: description.trim() || undefined,
        version: version.trim() || '1.0',
        displayOrder: Number(displayOrder),
        required,
        participantVisible,
        status: 'ACTIVE',
      });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add assessment definition.');
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
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-base text-ink">
              Add Assessment Definition
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
                Assessment Code <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ASM-PRAKRITI"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden uppercase font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProtocolAssessmentCategory)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden bg-white"
              >
                <option value="VITALS">Vital Signs</option>
                <option value="CLINICAL_EXAM">Clinical Exam / Anthropometry</option>
                <option value="ASSESSMENT">Ayurvedic / General Assessment</option>
                <option value="QUESTIONNAIRE">Questionnaire / Scale</option>
                <option value="GENERAL">General</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              Assessment Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ayurvedic Prakriti Assessment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              Linked Protocol Visit <span className="text-rose-600">*</span>
            </label>
            <select
              value={visitDefinitionId}
              onChange={(e) => setVisitDefinitionId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden bg-white font-medium"
              required
            >
              {visits.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.sequence}. {v.name} ({v.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Procedure instructions, validated scale reference, or clinical guidelines..."
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
              <span>Mandatory Assessment</span>
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
              {isSubmitting ? 'Adding...' : 'Add Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
