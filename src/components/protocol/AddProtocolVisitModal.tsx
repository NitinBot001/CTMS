import React, { useState } from 'react';
import { CreateProtocolVisitDefinitionInput, VisitAnchor, VisitType } from '../../types';
import { X, Calendar, AlertCircle } from 'lucide-react';

interface AddProtocolVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextSequence: number;
  onSubmit: (input: CreateProtocolVisitDefinitionInput) => Promise<void>;
}

export const AddProtocolVisitModal: React.FC<AddProtocolVisitModalProps> = ({
  isOpen,
  onClose,
  nextSequence,
  onSubmit,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [sequence, setSequence] = useState<number>(nextSequence);
  const [visitType, setVisitType] = useState<VisitType>('TREATMENT');
  const [anchor, setAnchor] = useState<VisitAnchor>('ENROLLMENT_DATE');
  const [targetOffsetDays, setTargetOffsetDays] = useState<number>(0);
  const [windowBeforeDays, setWindowBeforeDays] = useState<number>(2);
  const [windowAfterDays, setWindowAfterDays] = useState<number>(2);
  const [requiredActivitiesStr, setRequiredActivitiesStr] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setErrorMessage('Visit code and name are required.');
      return;
    }

    if (windowBeforeDays < 0 || windowAfterDays < 0) {
      setErrorMessage('Allowable window days cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const activities = requiredActivitiesStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await onSubmit({
        code: code.trim(),
        name: name.trim(),
        sequence: Number(sequence),
        anchor,
        targetOffsetDays: Number(targetOffsetDays),
        targetDay: Number(targetOffsetDays),
        windowBeforeDays: Number(windowBeforeDays),
        windowAfterDays: Number(windowAfterDays),
        visitType,
        requiredActivities: activities,
        description: description.trim() || undefined,
        required: true,
      });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add protocol visit definition.');
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
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-base text-ink">
              Add Protocol Visit Definition
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
                Visit Code <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. V3-D14"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">
                Sequence Order <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={sequence}
                onChange={(e) => setSequence(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              Visit Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Day 14 Safety & Vital Assessment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1">Visit Type</label>
              <select
                value={visitType}
                onChange={(e) => setVisitType(e.target.value as VisitType)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden bg-white"
              >
                <option value="SCREENING">Screening</option>
                <option value="BASELINE">Baseline & Allocation</option>
                <option value="TREATMENT">Treatment / Follow-up</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="CLOSE_OUT">Close-out</option>
                <option value="END_OF_STUDY">End of Study</option>
                <option value="UNSCHEDULED">Unscheduled</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">Anchor Event</label>
              <select
                value={anchor}
                onChange={(e) => setAnchor(e.target.value as VisitAnchor)}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden bg-white"
              >
                <option value="SCREENING_DATE">Screening Date</option>
                <option value="ENROLLMENT_DATE">Enrollment / Baseline Date</option>
                <option value="PREVIOUS_VISIT">Previous Visit Date</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1">Target Day (Offset)</label>
              <input
                type="number"
                value={targetOffsetDays}
                onChange={(e) => setTargetOffsetDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">- Window (Days)</label>
              <input
                type="number"
                min={0}
                value={windowBeforeDays}
                onChange={(e) => setWindowBeforeDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">+ Window (Days)</label>
              <input
                type="number"
                min={0}
                value={windowAfterDays}
                onChange={(e) => setWindowAfterDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">
              Required Activities (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Vitals, Adverse Event Inquiry, IP Pill Count"
              value={requiredActivitiesStr}
              onChange={(e) => setRequiredActivitiesStr(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">Description / Clinical Notes</label>
            <textarea
              rows={2}
              placeholder="Operational details, fasting guidelines, or sample collection requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {isSubmitting ? 'Adding...' : 'Add Protocol Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
