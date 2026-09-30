import React, { useState } from 'react';
import { CreateEligibilityCriterionInput, ProtocolEligibilityType } from '../../types';
import { X, CheckSquare, AlertCircle } from 'lucide-react';

interface AddEligibilityCriterionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ProtocolEligibilityType;
  nextOrder: number;
  onSubmit: (input: CreateEligibilityCriterionInput) => Promise<void>;
}

export const AddEligibilityCriterionModal: React.FC<AddEligibilityCriterionModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'INCLUSION',
  nextOrder,
  onSubmit,
}) => {
  const [type, setType] = useState<ProtocolEligibilityType>(defaultType);
  const [criterionCode, setCriterionCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(nextOrder);
  const [required, setRequired] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!criterionCode.trim() || !title.trim()) {
      setErrorMessage('Criterion code and title are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({
        type,
        criterionCode: criterionCode.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim(),
        displayOrder: Number(displayOrder),
        required,
        active: true,
      });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add eligibility criterion.');
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
            <CheckSquare className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-base text-ink">
              Add Eligibility Criterion
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
              <label className="block font-semibold text-ink mb-1">Criterion Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProtocolEligibilityType)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden bg-white font-medium"
              >
                <option value="INCLUSION">Inclusion Criterion</option>
                <option value="EXCLUSION">Exclusion Criterion</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">
                Criterion Code <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder={type === 'INCLUSION' ? 'e.g. INC-04' : 'e.g. EXC-04'}
                value={criterionCode}
                onChange={(e) => setCriterionCode(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden uppercase font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              Title / Short Statement <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Adult participants aged 18 to 65 years"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">Detailed Criterion Description</label>
            <textarea
              rows={3}
              placeholder="Complete clinical description, laboratory cutoffs, and diagnostic requirements..."
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
                <span>Mandatory Requirement</span>
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
              {isSubmitting ? 'Adding...' : 'Add Criterion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
