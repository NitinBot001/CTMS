import React, { useState } from 'react';
import {
  CreateAyurvedaTerminologyInput,
  AyurvedaTerminologySystem,
  OfficialCodeVerificationStatus,
} from '../../types';
import { X, Languages, AlertCircle, Info } from 'lucide-react';

interface AddTerminologyEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateAyurvedaTerminologyInput) => Promise<void>;
}

export const AddTerminologyEntryModal: React.FC<AddTerminologyEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [system, setSystem] = useState<AyurvedaTerminologySystem>('NAMASTE');
  const [display, setDisplay] = useState('');
  const [officialCodeVerification, setOfficialCodeVerification] =
    useState<OfficialCodeVerificationStatus>('PENDING_MAPPING');
  const [code, setCode] = useState('');
  const [localConceptId, setLocalConceptId] = useState('');
  const [shortDefinition, setShortDefinition] = useState('');
  const [longDefinition, setLongDefinition] = useState('');
  const [language, setLanguage] = useState('sa-Latn');
  const [sourceAuthority, setSourceAuthority] = useState('Ministry of Ayush');
  const [sourceReference, setSourceReference] = useState('');
  const [version, setVersion] = useState('2023.1');
  const [parentCode, setParentCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSystemChange = (s: AyurvedaTerminologySystem) => {
    setSystem(s);
    if (s === 'NAMASTE') {
      setSourceAuthority('Ministry of Ayush');
      setOfficialCodeVerification('PENDING_MAPPING');
      setCode('');
    } else if (s === 'WHO_AYURVEDA_TERMINOLOGY') {
      setSourceAuthority('World Health Organization');
      setOfficialCodeVerification('PENDING_MAPPING');
      setCode('');
    } else if (s === 'CCRAS') {
      setSourceAuthority('CCRAS');
      setOfficialCodeVerification('PENDING_MAPPING');
      setCode('');
    } else if (s === 'INSTITUTIONAL') {
      setSourceAuthority('All India Institute of Ayurveda (AIIA)');
      setOfficialCodeVerification('INTERNAL_ONLY');
      setCode('');
    } else if (s === 'PROTOCOL_SPECIFIC') {
      setSourceAuthority('Trial Protocol Directorate');
      setOfficialCodeVerification('INTERNAL_ONLY');
      setCode('');
    }
  };

  const handleVerificationChange = (v: OfficialCodeVerificationStatus) => {
    setOfficialCodeVerification(v);
    if (v === 'PENDING_MAPPING' || v === 'INTERNAL_ONLY') {
      setCode('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!display.trim() || !sourceAuthority.trim() || !sourceReference.trim()) {
      setErrorMessage('Concept display name, source authority, and reference citation are required.');
      return;
    }

    if (officialCodeVerification === 'VERIFIED_SOURCE' && !code.trim()) {
      setErrorMessage('Verified source terminology entries must specify an official published terminology code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const formattedCode =
        officialCodeVerification === 'VERIFIED_SOURCE' && code.trim() ? code.trim() : null;
      await onSubmit({
        system,
        code: formattedCode,
        localConceptId: localConceptId.trim() || null,
        officialCodeVerification,
        display: display.trim(),
        shortDefinition: shortDefinition.trim() || undefined,
        longDefinition: longDefinition.trim() || undefined,
        language: language.trim() || 'sa-Latn',
        sourceAuthority: sourceAuthority.trim(),
        sourceReference: sourceReference.trim(),
        version: version.trim() || '1.0',
        parentCode: parentCode.trim() || null,
        status:
          formattedCode
            ? 'SOURCE_REFERENCED'
            : officialCodeVerification === 'INTERNAL_ONLY'
            ? 'PROTOCOL_DEFINED'
            : 'PENDING_TERMINOLOGY_MAPPING',
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add terminology entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-terminology-title"
    >
      <div className="relative w-full max-w-xl rounded-sm border border-stone-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-stone-100 text-stone-800 border border-stone-300">
              <Languages className="h-5 w-5 text-amber-900" />
            </div>
            <div>
              <h2 id="add-terminology-title" className="font-serif text-lg font-bold text-stone-900">
                Add Ayurveda Terminology Reference
              </h2>
              <p className="text-xs text-stone-600">
                Link standardized Ayurveda clinical concepts to authoritative nomenclature
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
            <strong>Terminology Governance (Stage 2B.1):</strong> Never invent fake codes. Internal IDs (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">AYU-TERM-XX</code>) and Local Concept IDs (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">AIIA-CONCEPT-XX</code>) are local identifiers and must never be recorded as official terminology codes. An official code is permitted only with <code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-mono">VERIFIED_SOURCE</code> from a published standard.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Terminology System *
              </label>
              <select
                value={system}
                onChange={(e) => handleSystemChange(e.target.value as AyurvedaTerminologySystem)}
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
              >
                <option value="NAMASTE">NAMASTE (National Ayush Morbidity & Terminology)</option>
                <option value="WHO_AYURVEDA_TERMINOLOGY">WHO International Standard Terminologies</option>
                <option value="CCRAS">CCRAS (Central Council for Research in Ayurvedic Sciences)</option>
                <option value="INSTITUTIONAL">INSTITUTIONAL (AIIA Standardized Nomenclature)</option>
                <option value="PROTOCOL_SPECIFIC">PROTOCOL_SPECIFIC (Study-Defined Term)</option>
                <option value="OTHER_VALIDATED">OTHER_VALIDATED (Peer-Reviewed Vocabulary)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Display Name (Concept) *
              </label>
              <input
                type="text"
                value={display}
                onChange={(e) => setDisplay(e.target.value)}
                placeholder="e.g. Prakriti, Agni, Samhanana"
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Official Code Verification State *
              </label>
              <select
                value={officialCodeVerification}
                onChange={(e) =>
                  handleVerificationChange(e.target.value as OfficialCodeVerificationStatus)
                }
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
              >
                <option value="PENDING_MAPPING">
                  PENDING_MAPPING (Official code not yet confirmed; code remains null)
                </option>
                <option value="VERIFIED_SOURCE">
                  VERIFIED_SOURCE (Exact code verified from published standard)
                </option>
                <option value="INTERNAL_ONLY">
                  INTERNAL_ONLY (Local institutional concept; not an official national code)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Local Concept Identifier (Optional)
              </label>
              <input
                type="text"
                value={localConceptId}
                onChange={(e) => setLocalConceptId(e.target.value)}
                placeholder="e.g. NAMASTE-CONCEPT-PRAKRITI or AIIA-CONCEPT-DASHAVIDHA"
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm uppercase focus:border-amber-900 focus:outline-hidden"
              />
              <span className="text-[11px] text-stone-500">
                Institutional concept ID. Never presented as an official national ontology code.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Official Terminology Code {officialCodeVerification === 'VERIFIED_SOURCE' ? '*' : '(Disabled)'}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={officialCodeVerification !== 'VERIFIED_SOURCE'}
                placeholder={
                  officialCodeVerification === 'VERIFIED_SOURCE'
                    ? 'e.g. NAM-04-102 (exact verified code)'
                    : 'Code is strictly null for pending/internal concepts'
                }
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm uppercase focus:border-amber-900 focus:outline-hidden disabled:bg-stone-100 disabled:text-stone-500"
              />
              <span className="text-[11px] text-stone-500">
                {officialCodeVerification === 'VERIFIED_SOURCE'
                  ? 'Must match published authoritative standard.'
                  : 'Official code is strictly null to prevent fake codes.'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Language / Script
              </label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. sa-Latn, sa-Deva, en, hi"
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Short Definition
            </label>
            <input
              type="text"
              value={shortDefinition}
              onChange={(e) => setShortDefinition(e.target.value)}
              placeholder="Concise definition of clinical concept..."
              className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Parent Code / Category (Optional)
              </label>
              <input
                type="text"
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value)}
                placeholder="e.g. NAM-04"
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Long / Classical Definition (Optional)
              </label>
              <input
                type="text"
                value={longDefinition}
                onChange={(e) => setLongDefinition(e.target.value)}
                placeholder="Extended clinical definition..."
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
              />
            </div>
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
                placeholder="e.g. Ministry of Ayush"
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Version / Release
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 2023.1"
                className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Source Reference Citation *
            </label>
            <input
              type="text"
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
              placeholder="e.g. NAMASTE Portal Morbidity Registry Publication"
              className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm focus:border-amber-900 focus:outline-hidden"
              required
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
              {isSubmitting ? 'Saving...' : 'Add Terminology Reference'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
