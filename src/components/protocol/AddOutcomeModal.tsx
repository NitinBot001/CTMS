import React, { useState } from 'react';
import {
  CreateOutcomeDefinitionInput,
  ProtocolOutcomeType,
  ProtocolVisitDefinition,
} from '../../types';
import { X, Target, AlertCircle } from 'lucide-react';

interface AddOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  visits: ProtocolVisitDefinition[];
  nextOrder: number;
  onSubmit: (input: CreateOutcomeDefinitionInput) => Promise<void>;
}

export const AddOutcomeModal: React.FC<AddOutcomeModalProps> = ({
  isOpen,
  onClose,
  visits,
  nextOrder,
  onSubmit,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [outcomeType, setOutcomeType] = useState<ProtocolOutcomeType>('PRIMARY');
  const [visitDefinitionId, setVisitDefinitionId] = useState('');
  const [timepoint, setTimepoint] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(nextOrder);
  const [required, setRequired] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setErrorMessage('Outcome code and name are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        outcomeType,
        visitDefinitionId: visitDefinitionId || undefined,
        timepoint: timepoint.trim() || undefined,
        description: description.trim() || undefined,
        displayOrder: Number(displayOrder),
        required,
        status: 'ACTIVE',
      });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add outcome definition.');
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
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-base text-ink">
              Add Protocol Outcome / Endpoint
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
                Outcome Code <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. OUT-PRI-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden uppercase font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">Outcome Type</label>
              <select
                value={outcomeType}
                onChange={(e) => setOutcomeType(e.target.value as ProtocolOutcomeType)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden bg-white font-medium"
              >
                <option value="PRIMARY">Primary Endpoint</option>
                <option value="SECONDARY">Secondary Endpoint</option>
                <option value="EXPLORATORY">Exploratory Endpoint</option>
                <option value="SAFETY">Safety Endpoint</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              Outcome Measure Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Mean Reduction in Fasting Blood Sugar at Day 90"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1">
                Linked Protocol Visit (Optional)
              </label>
              <select
                value={visitDefinitionId}
                onChange={(e) => setVisitDefinitionId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden bg-white"
              >
                <option value="">-- Across All / Any Visit --</option>
                {visits.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.sequence}. {v.name} ({v.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">Measurement Timepoint</label>
              <input
                type="text"
                placeholder="e.g. Baseline & Day 90"
                value={timepoint}
                onChange={(e) => setTimepoint(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">Endpoint Description & Statistical Definition</label>
            <textarea
              rows={2}
              placeholder="Statistical analysis plan context, hypothesis, or measurement scale criteria..."
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
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-ink">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="rounded-xs text-primary focus:ring-primary"
                />
                <span>Mandatory Endpoint</span>
              </label>
            </div>
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
              {isSubmitting ? 'Adding...' : 'Add Outcome'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
