import React, { useState, useEffect } from 'react';
import { useStudy } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';
import { assessmentService } from '../../services/assessmentService';
import { participantService } from '../../services/participantService';
import {
  AssessmentInstrument,
  AssessmentInstrumentVersion,
  Participant,
  AssessmentAdministrationMode,
} from '../../types';
import { X, AlertCircle, ShieldAlert, CheckCircle, FileText } from 'lucide-react';

interface AssignAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export const AssignAssessmentModal: React.FC<AssignAssessmentModalProps> = ({
  isOpen,
  onClose,
  onAssigned,
}) => {
  const { activeStudy, activeSite } = useStudy();
  const { currentUser } = useAuth();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [instruments, setInstruments] = useState<AssessmentInstrument[]>([]);
  const [versions, setVersions] = useState<AssessmentInstrumentVersion[]>([]);

  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [selectedInstrumentId, setSelectedInstrumentId] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [administrationMode, setAdministrationMode] = useState<AssessmentAdministrationMode>('STAFF_ASSESSOR');
  const [dueAt, setDueAt] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const studyId = activeStudy?.id || 'STUDY-001';
        const siteId = activeSite?.id || 'SITE-001';

        const [ptList, instList] = await Promise.all([
          participantService.getParticipants({ studyId, siteId }),
          assessmentService.getInstruments(),
        ]);

        setParticipants(ptList.filter((p) => p.status === 'ENROLLED' || p.status === 'ACTIVE' || p.status === 'SCREENED'));
        setInstruments(instList.filter((i) => i.isActive));

        if (instList.length > 0) {
          // Pre-select first synthetic demo instrument if available
          const demoInst = instList.find((i) => i.rightsStatus === 'VERIFIED');
          const chosen = demoInst || instList[0];
          setSelectedInstrumentId(chosen.instrumentId);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load assignment options');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, activeStudy, activeSite]);

  useEffect(() => {
    if (!selectedInstrumentId) {
      setVersions([]);
      setSelectedVersionId('');
      return;
    }

    const loadVersions = async () => {
      try {
        const vList = await assessmentService.getVersions(selectedInstrumentId);
        setVersions(vList);
        const activeVer = vList.find((v) => v.status === 'ACTIVE');
        if (activeVer) {
          setSelectedVersionId(activeVer.versionId);
        } else if (vList.length > 0) {
          setSelectedVersionId(vList[0].versionId);
        }
      } catch (err: any) {
        console.error('Failed to load instrument versions:', err);
      }
    };

    loadVersions();
  }, [selectedInstrumentId]);

  if (!isOpen) return null;

  const currentInstrument = instruments.find((i) => i.instrumentId === selectedInstrumentId);
  const isRestricted = currentInstrument?.rightsStatus === 'RESTRICTED' || currentInstrument?.contentStatus === 'METADATA_ONLY';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipantId || !selectedInstrumentId || !selectedVersionId) {
      setError('Please select a participant, instrument, and version.');
      return;
    }

    if (isRestricted) {
      setError('Cannot assign restricted metadata-only instrument for data collection.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const studyId = activeStudy?.id || 'STUDY-001';
      const siteId = activeSite?.id || 'SITE-001';

      await assessmentService.createAssignment(
        { studyId, siteId },
        {
          participantId: selectedParticipantId,
          instrumentId: selectedInstrumentId,
          instrumentVersionId: selectedVersionId,
          dueAt: dueAt || undefined,
          notes: notes.trim() || undefined,
        },
        {
          id: currentUser?.id || 'USR-PI-01',
          name: currentUser?.displayName || 'Principal Investigator',
          role: currentUser?.designation || 'ROLE_PI',
        }
      );

      onAssigned();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create assessment assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-sm shadow-xl border border-neutral-300 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-950 via-amber-950 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-300" />
            <h2 className="font-serif font-semibold text-base">Assign Clinical Assessment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Participant Selector */}
          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Select Participant *
            </label>
            <select
              value={selectedParticipantId}
              onChange={(e) => setSelectedParticipantId(e.target.value)}
              required
              className="w-full border border-neutral-300 rounded-sm px-3 py-2 text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden"
              disabled={isLoading || isSubmitting}
            >
              <option value="">-- Choose Trial Participant --</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.participantCode} ({p.initials}) — Status: {p.status}
                </option>
              ))}
            </select>
          </div>

          {/* Instrument Selector */}
          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Assessment Instrument *
            </label>
            <select
              value={selectedInstrumentId}
              onChange={(e) => setSelectedInstrumentId(e.target.value)}
              required
              className="w-full border border-neutral-300 rounded-sm px-3 py-2 text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden"
              disabled={isLoading || isSubmitting}
            >
              {instruments.map((i) => (
                <option key={i.instrumentId} value={i.instrumentId}>
                  {i.name} [{i.category}] — {i.rightsStatus === 'VERIFIED' ? 'Synthetic Demo' : 'Source Referenced (Restricted)'}
                </option>
              ))}
            </select>
          </div>

          {/* Content Rights & Governance Notice */}
          {currentInstrument && (
            <div className={`p-3 rounded-sm border ${isRestricted ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'}`}>
              <div className="flex items-start gap-2">
                {isRestricted ? (
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">
                    {isRestricted ? 'Restricted Source-Referenced Scale (Metadata Only)' : 'Verified Synthetic Demo Instrument (Data Collection Ready)'}
                  </div>
                  <div className="text-[11px] mt-0.5 text-neutral-700">
                    {isRestricted
                      ? 'In accordance with CCRAS reproduction restrictions, questionnaire items are not transcribed. Assignment for live data collection is disabled.'
                      : 'This instrument contains structured synthetic questionnaire items, dynamic branching logic, and response scales ready for execution.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Version Selector */}
          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Instrument Version *
            </label>
            <select
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              required
              disabled={isRestricted || versions.length === 0}
              className="w-full border border-neutral-300 rounded-sm px-3 py-2 text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden disabled:bg-neutral-100"
            >
              {versions.map((v) => (
                <option key={v.versionId} value={v.versionId}>
                  v{v.versionLabel} ({v.status}) — {v.itemCount} Items
                </option>
              ))}
            </select>
          </div>

          {/* Administration Mode */}
          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Administration Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center gap-2 p-2 border rounded-sm cursor-pointer ${administrationMode === 'STAFF_ASSESSOR' ? 'border-amber-700 bg-amber-50/50' : 'border-neutral-200'}`}>
                <input
                  type="radio"
                  name="adminMode"
                  value="STAFF_ASSESSOR"
                  checked={administrationMode === 'STAFF_ASSESSOR'}
                  onChange={() => setAdministrationMode('STAFF_ASSESSOR')}
                  disabled={isRestricted}
                />
                <span className="text-neutral-800 font-medium">Staff Assessor</span>
              </label>
              <label className={`flex items-center gap-2 p-2 border rounded-sm cursor-pointer ${administrationMode === 'PARTICIPANT_SELF_REPORT' ? 'border-amber-700 bg-amber-50/50' : 'border-neutral-200'}`}>
                <input
                  type="radio"
                  name="adminMode"
                  value="PARTICIPANT_SELF_REPORT"
                  checked={administrationMode === 'PARTICIPANT_SELF_REPORT'}
                  onChange={() => setAdministrationMode('PARTICIPANT_SELF_REPORT')}
                  disabled={isRestricted}
                />
                <span className="text-neutral-800 font-medium">Participant Self-Report</span>
              </label>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              disabled={isRestricted}
              className="w-full border border-neutral-300 rounded-sm px-3 py-2 text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden disabled:bg-neutral-100"
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block font-semibold text-neutral-800 mb-1">
              Assignment Notes / Context (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Baseline constitutional evaluation, Day 1."
              rows={2}
              disabled={isRestricted}
              className="w-full border border-neutral-300 rounded-sm px-3 py-2 text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden disabled:bg-neutral-100"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isRestricted || !selectedParticipantId}
              className="px-4 py-2 text-xs font-medium text-white bg-amber-800 hover:bg-amber-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm shadow-xs transition-colors"
            >
              {isSubmitting ? 'Assigning...' : 'Assign Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
