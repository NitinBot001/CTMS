import React, { useState } from 'react';
import {
  CreateAyurvedaInstrumentInput,
  AyurvedaCategoryCode,
  AyurvedaAssessmentCategory,
  AyurvedaValidationStatus,
  AyurvedaScoringMethod,
} from '../../types';
import { X, BookOpen, AlertCircle, Info } from 'lucide-react';

interface RegisterInstrumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: AyurvedaAssessmentCategory[];
  onSubmit: (input: CreateAyurvedaInstrumentInput) => Promise<void>;
}

export const RegisterInstrumentModal: React.FC<RegisterInstrumentModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSubmit,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AyurvedaCategoryCode>(
    categories[0]?.code || 'PRAKRITI'
  );
  const [description, setDescription] = useState('');
  const [sourceAuthority, setSourceAuthority] = useState('CCRAS');
  const [sourceReference, setSourceReference] = useState('');
  const [version, setVersion] = useState('1.0');
  const [validationStatus, setValidationStatus] = useState<AyurvedaValidationStatus>('SOURCE_REFERENCED');
  const [trainingRequired, setTrainingRequired] = useState(false);
  const [trainingProvider, setTrainingProvider] = useState('');
  const [trainingReference, setTrainingReference] = useState('');
  const [licenseNote, setLicenseNote] = useState('');
  const [languages, setLanguages] = useState<string>('en, hi, sa');
  const [scoringMethod, setScoringMethod] = useState<AyurvedaScoringMethod>('SOURCE_DEFINED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !sourceAuthority.trim() || !sourceReference.trim()) {
      setErrorMessage('Instrument code, name, source authority, and source reference are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const languageArray = languages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category,
        description: description.trim(),
        sourceAuthority: sourceAuthority.trim(),
        sourceReference: sourceReference.trim(),
        version: version.trim() || '1.0',
        validationStatus,
        usageStatus: 'ACTIVE',
        trainingRequired,
        trainingProvider: trainingProvider.trim() || undefined,
        trainingReference: trainingReference.trim() || undefined,
        licenseNote: licenseNote.trim() || undefined,
        languageSupport: languageArray.length > 0 ? languageArray : ['en'],
        scoringMethod,
        scoringStatus: scoringMethod === 'NONE' ? 'NOT_CONFIGURED' : 'SOURCE_DOCUMENTED',
        contentStatus: 'METADATA_ONLY',
        isActive: true,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register Ayurveda instrument.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-instrument-title"
    >
      <div className="relative w-full max-w-2xl rounded-sm border border-stone-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-stone-100 text-stone-800 border border-stone-300">
              <BookOpen className="h-5 w-5 text-amber-900" />
            </div>
            <div>
              <h2 id="register-instrument-title" className="font-serif text-lg font-bold text-stone-900">
                Register Ayurveda Assessment Instrument
              </h2>
              <p className="text-xs text-stone-600">
                Add an authoritative, validated or study-specific instrument to the CTMS registry
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

        <div className="mb-4 flex items-start gap-2 rounded-sm border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
          <span>
            <strong>Authoritative Source Rule:</strong> Instruments are registered with their source citations and validation status. Detailed questionnaire questions and scoring logic are registered as <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-900 font-mono">METADATA_ONLY</code> until approved digital content is configured.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Instrument Catalog Code *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. AYU-INST-CCRAS-PRAKRITI-01"
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm uppercase focus:border-amber-900 focus:outline-hidden"
                required
              />
              <span className="text-[11px] text-stone-500">
                Internal catalog identifier for this instrument. Not an official terminology code.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Instrument Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CCRAS Standardized Prakriti Assessment Scale"
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Assessment Category *
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
                Instrument Version *
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 1.0"
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Clinical and methodological summary of the instrument..."
              className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Source Authority *
              </label>
              <input
                type="text"
                value={sourceAuthority}
                onChange={(e) => setSourceAuthority(e.target.value)}
                placeholder="e.g. CCRAS, Ministry of Ayush, WHO, AIIA"
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Validation Status *
              </label>
              <select
                value={validationStatus}
                onChange={(e) => setValidationStatus(e.target.value as AyurvedaValidationStatus)}
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
              >
                <option value="SOURCE_REFERENCED">SOURCE_REFERENCED (Authoritative Official Document)</option>
                <option value="VALIDATED">VALIDATED (Clinically Validated & Formally Adopted)</option>
                <option value="PROTOCOL_DEFINED">PROTOCOL_DEFINED (Study Institutional Framework)</option>
                <option value="PENDING_VALIDATION">PENDING_VALIDATION (Under Institutional Review)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Source Reference / Citation *
            </label>
            <input
              type="text"
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
              placeholder="e.g. CCRAS Standardized Prakriti Assessment Scale Manual (2018)"
              className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Scoring Method Metadata
              </label>
              <select
                value={scoringMethod}
                onChange={(e) => setScoringMethod(e.target.value as AyurvedaScoringMethod)}
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
              >
                <option value="SOURCE_DEFINED">SOURCE_DEFINED (Derived by official methodology)</option>
                <option value="NONE">NONE (Observational / Qualitative)</option>
                <option value="IMPLEMENT_LATER">IMPLEMENT_LATER (Algorithmic scoring deferred)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Supported Languages
              </label>
              <input
                type="text"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="e.g. en, hi, sa"
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
              />
              <span className="text-[11px] text-stone-600">Comma-separated ISO codes (e.g. en, hi, sa)</span>
            </div>
          </div>

          <div className="border border-stone-200 rounded-sm p-3 bg-stone-50/70 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="regTrainingRequired"
                checked={trainingRequired}
                onChange={(e) => setTrainingRequired(e.target.checked)}
                className="h-4 w-4 rounded-xs border-stone-300 text-amber-900 focus:ring-amber-900"
              />
              <label htmlFor="regTrainingRequired" className="text-xs font-bold text-stone-800 cursor-pointer">
                Assessor Training / Certification Required by Source Authority
              </label>
            </div>

            {trainingRequired && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Training Provider
                  </label>
                  <input
                    type="text"
                    value={trainingProvider}
                    onChange={(e) => setTrainingProvider(e.target.value)}
                    placeholder="e.g. CCRAS / Ayush Training Directorate"
                    className="w-full rounded-sm border border-stone-300 px-2.5 py-1.5 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Training Reference / Module
                  </label>
                  <input
                    type="text"
                    value={trainingReference}
                    onChange={(e) => setTrainingReference(e.target.value)}
                    placeholder="e.g. SOP-PRAK-01 Assessor Certification"
                    className="w-full rounded-sm border border-stone-300 px-2.5 py-1.5 text-xs bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Licensing / Usage Note
            </label>
            <input
              type="text"
              value={licenseNote}
              onChange={(e) => setLicenseNote(e.target.value)}
              placeholder="e.g. Institutional use under CCRAS collaboration agreement."
              className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
            />
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
              disabled={isSubmitting}
              className="rounded-sm bg-amber-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Instrument'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
