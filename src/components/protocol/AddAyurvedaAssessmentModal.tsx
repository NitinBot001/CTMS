import React, { useState, useEffect } from 'react';
import {
  CreateProtocolAyurvedaAssessmentInput,
  AyurvedaCategoryCode,
  AyurvedaAssessmentCategory,
  AyurvedaAssessmentInstrument,
  ProtocolVisitDefinition,
} from '../../types';
import { X, Sparkles, AlertCircle, Info, ShieldCheck } from 'lucide-react';

interface AddAyurvedaAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: AyurvedaAssessmentCategory[];
  instruments: AyurvedaAssessmentInstrument[];
  visits: ProtocolVisitDefinition[];
  nextOrder: number;
  onSubmit: (input: CreateProtocolAyurvedaAssessmentInput) => Promise<void>;
}

export const AddAyurvedaAssessmentModal: React.FC<AddAyurvedaAssessmentModalProps> = ({
  isOpen,
  onClose,
  categories,
  instruments,
  visits,
  nextOrder,
  onSubmit,
}) => {
  const [assessmentCode, setAssessmentCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AyurvedaCategoryCode>(
    categories[0]?.code || 'PRAKRITI'
  );
  const [instrumentId, setInstrumentId] = useState('');
  const [visitDefinitionId, setVisitDefinitionId] = useState(visits[0]?.id || '');
  const [required, setRequired] = useState(true);
  const [participantVisible, setParticipantVisible] = useState(false);
  const [requiredRole, setRequiredRole] = useState('SUB_INVESTIGATOR');
  const [trainingRequired, setTrainingRequired] = useState(false);
  const [trainingReference, setTrainingReference] = useState('');
  const [assessorNotes, setAssessorNotes] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(nextOrder);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter instruments by currently selected category
  const availableInstruments = instruments.filter(
    (i) => i.category === category && i.usageStatus !== 'DEPRECATED' && i.usageStatus !== 'RETIRED'
  );

  // Sync default instrument when category changes
  useEffect(() => {
    if (availableInstruments.length > 0) {
      const defaultInst = availableInstruments[0];
      setInstrumentId(defaultInst.id);
      setTrainingRequired(defaultInst.trainingRequired);
      setTrainingReference(defaultInst.trainingReference || defaultInst.sourceReference || '');
      setSourceReference(defaultInst.sourceReference || '');
    } else {
      setInstrumentId('');
      setTrainingRequired(false);
      setTrainingReference('');
      setSourceReference('');
    }
  }, [category, instruments]);

  // When selected instrument changes, pre-populate training requirements
  const handleInstrumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const instId = e.target.value;
    setInstrumentId(instId);
    const selected = instruments.find((i) => i.id === instId);
    if (selected) {
      setTrainingRequired(selected.trainingRequired);
      setTrainingReference(selected.trainingReference || selected.sourceReference || '');
      setSourceReference(selected.sourceReference || '');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentCode.trim() || !name.trim() || !instrumentId || !visitDefinitionId) {
      setErrorMessage('Assessment code, name, category instrument, and linked visit are required.');
      return;
    }

    const selectedInst = instruments.find((i) => i.id === instrumentId);
    if (!selectedInst || selectedInst.category !== category) {
      setErrorMessage(`Selected instrument does not belong to category "${category}".`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({
        assessmentCode: assessmentCode.trim().toUpperCase(),
        name: name.trim(),
        category,
        instrumentId,
        instrumentVersion: selectedInst.version,
        visitDefinitionId,
        required,
        participantVisible,
        assessorRequirement: {
          requiredRole: requiredRole || undefined,
          trainingRequired,
          trainingReference: trainingReference.trim() || undefined,
          notes: assessorNotes.trim() || undefined,
        },
        sourceReference: sourceReference.trim() || selectedInst.sourceReference,
        validationStatus: selectedInst.validationStatus,
        contentStatus: 'METADATA_ONLY',
        displayOrder: Number(displayOrder),
        status: 'ACTIVE',
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to link Ayurveda assessment to protocol.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-ayurveda-assessment-title"
    >
      <div className="relative w-full max-w-2xl rounded-sm border border-stone-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-amber-50 text-amber-900 border border-amber-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 id="add-ayurveda-assessment-title" className="font-serif text-lg font-bold text-stone-900">
                Link Ayurveda Protocol Assessment
              </h2>
              <p className="text-xs text-stone-600">
                Associate a standardized/validated Ayurveda clinical instrument to a protocol visit schedule
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mb-4 flex items-start gap-2 rounded-sm border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <span>
            <strong>Stage 2B Clinical Configuration:</strong> This links an assessment instrument as
            <code className="mx-1 px-1 py-0.5 bg-amber-100 rounded text-amber-900 font-mono">METADATA_ONLY</code>.
            Digital questionnaire items, response capture, and assessor scoring workflows belong to Stage 3.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Assessment Code *
              </label>
              <input
                type="text"
                value={assessmentCode}
                onChange={(e) => setAssessmentCode(e.target.value)}
                placeholder="e.g. PRAK-CCRAS-BL"
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm uppercase focus:border-amber-900 focus:outline-hidden"
                required
              />
              <span className="text-[11px] text-stone-600">Unique protocol code for this assessment instance</span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Assessment Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Baseline Prakriti Assessment"
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Ayurveda Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AyurvedaCategoryCode)}
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Assessment Instrument *
              </label>
              <select
                value={instrumentId}
                onChange={handleInstrumentChange}
                disabled={availableInstruments.length === 0}
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden disabled:bg-stone-100 disabled:text-stone-600"
                required
              >
                {availableInstruments.length === 0 ? (
                  <option value="">No instruments registered for {category}</option>
                ) : (
                  availableInstruments.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} (v{inst.version} • {inst.sourceAuthority})
                    </option>
                  ))
                )}
              </select>
              {availableInstruments.length === 0 && (
                <span className="text-[11px] text-red-600">
                  Please register an instrument under this category first.
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Applicable Visit *
              </label>
              <select
                value={visitDefinitionId}
                onChange={(e) => setVisitDefinitionId(e.target.value)}
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
                required
              >
                {visits.map((v) => (
                  <option key={v.id} value={v.id}>
                    Seq {v.sequence}: {v.name} ({v.code} • Day {v.targetOffsetDays})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                min="1"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="border border-stone-200 rounded-sm p-3 bg-stone-50/70 space-y-3">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              Assessor Governance & Requirements
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Required Assessor Role
                </label>
                <select
                  value={requiredRole}
                  onChange={(e) => setRequiredRole(e.target.value)}
                  className="w-full rounded-sm border border-stone-300 px-2 py-1.5 text-xs bg-white"
                >
                  <option value="PRINCIPAL_INVESTIGATOR">Principal Investigator</option>
                  <option value="SUB_INVESTIGATOR">Sub-Investigator / Research Investigator</option>
                  <option value="STUDY_NURSE">Study Nurse</option>
                  <option value="CRC">Clinical Research Coordinator</option>
                  <option value="ANY_CLINICAL_STAFF">Any Authorized Clinical Staff</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trainingRequired}
                    onChange={(e) => setTrainingRequired(e.target.checked)}
                    className="h-4 w-4 rounded-xs border-stone-300 text-amber-900 focus:ring-amber-900"
                  />
                  <span>Assessor Training Required by Source Authority</span>
                </label>
              </div>
            </div>

            {trainingRequired && (
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Training / SOP Reference
                </label>
                <input
                  type="text"
                  value={trainingReference}
                  onChange={(e) => setTrainingReference(e.target.value)}
                  placeholder="e.g. CCRAS Assessor Training Module on AYUR Prakriti Scale"
                  className="w-full rounded-sm border border-stone-300 px-2.5 py-1.5 text-xs bg-white"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Governance Notes
              </label>
              <input
                type="text"
                value={assessorNotes}
                onChange={(e) => setAssessorNotes(e.target.value)}
                placeholder="e.g. Must be administered prior to study drug administration"
                className="w-full rounded-sm border border-stone-300 px-2.5 py-1.5 text-xs bg-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="h-4 w-4 rounded-xs border-stone-300 text-amber-900 focus:ring-amber-900"
              />
              <span>Mandatory for Protocol Compliance</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={participantVisible}
                onChange={(e) => setParticipantVisible(e.target.checked)}
                className="h-4 w-4 rounded-xs border-stone-300 text-amber-900 focus:ring-amber-900"
              />
              <span>Visible in Participant Read Model (Stage 3)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableInstruments.length === 0}
              className="rounded-sm bg-amber-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Linking...' : 'Link Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
