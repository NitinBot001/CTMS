import React, { useState, useEffect } from 'react';
import { ProtocolVisitDefinition, Participant } from '../../types';
import { visitService } from '../../services/visitService';
import { participantService } from '../../services/participantService';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { X, Calendar, AlertTriangle, Clock } from 'lucide-react';

interface ScheduleVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedParticipantId?: string;
  onSuccess: () => void;
}

export const ScheduleVisitModal: React.FC<ScheduleVisitModalProps> = ({
  isOpen,
  onClose,
  preselectedParticipantId,
  onSuccess,
}) => {
  const { currentUser, currentRole, effectivePermissions } = useAuth();
  const { activeStudy: currentStudy, activeSite: currentSite } = useStudy();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [protocolVisits, setProtocolVisits] = useState<ProtocolVisitDefinition[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState(preselectedParticipantId || '');
  const [selectedProtocolVisitId, setSelectedProtocolVisitId] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10));
  const [assignedStaff, setAssignedStaff] = useState(currentUser?.displayName || 'CRC');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !currentStudy || !currentSite) return;

    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        const [pts, pVisits] = await Promise.all([
          participantService.getParticipants({ studyId: currentStudy.id, siteId: currentSite.id }),
          visitService.getProtocolVisits(currentStudy.id),
        ]);

        if (isMounted) {
          setParticipants(pts);
          setProtocolVisits(pVisits);

          if (preselectedParticipantId) {
            setSelectedParticipantId(preselectedParticipantId);
          } else if (pts.length > 0 && !selectedParticipantId) {
            setSelectedParticipantId(pts[0].id);
          }

          if (pVisits.length > 0 && !selectedProtocolVisitId) {
            setSelectedProtocolVisitId(pVisits[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load scheduling data.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentStudy, currentSite, preselectedParticipantId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedParticipantId) {
      setErrorMessage('Please select a participant.');
      return;
    }
    if (!selectedProtocolVisitId) {
      setErrorMessage('Please select a protocol visit definition.');
      return;
    }
    if (!targetDate) {
      setErrorMessage('Please select a target planned date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const studyId = currentStudy?.id || 'STUDY-001';
      const siteId = currentSite?.id || 'SITE-001';

      await visitService.createVisit(
        { studyId, siteId },
        {
          studyId,
          siteId,
          participantId: selectedParticipantId,
          visitDefinitionId: selectedProtocolVisitId,
          visitCode: selectedDef?.code || 'VIS',
          visitName: selectedDef?.name || 'Protocol Visit',
          visitType: selectedDef?.code?.includes('SCR')
            ? 'SCREENING'
            : selectedDef?.code?.includes('BL')
            ? 'BASELINE'
            : 'TREATMENT',
          plannedDate: targetDate,
          assignedStaff: assignedStaff.trim() || undefined,
          notes: notes.trim() || undefined,
          status: 'SCHEDULED',
        },
        {
          userId: currentUser?.id || 'USR-CRC',
          name: currentUser?.displayName || 'Study Coordinator',
          roleId: currentRole?.id || 'ROLE_CRC',
          roleName: currentRole?.name || 'CRC',
          role: currentRole?.id || 'ROLE_CRC',
          effectivePermissions: effectivePermissions.map((p) => p.id),
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to schedule visit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDef = protocolVisits.find((p) => p.id === selectedProtocolVisitId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
    >
      <div className="bg-white rounded-sm shadow-xl max-w-lg w-full border border-neutral-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 id="schedule-modal-title" className="font-serif font-semibold text-lg">
              Schedule Protocol Visit
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-sm text-neutral-500">
              Loading protocol definitions...
            </div>
          ) : (
            <>
              {/* Participant Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Participant Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedParticipantId}
                  onChange={(e) => setSelectedParticipantId(e.target.value)}
                  disabled={Boolean(preselectedParticipantId)}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  required
                >
                  {participants.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.participantCode} ({pt.initials}) — {pt.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Protocol Visit Definition */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Protocol Visit <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedProtocolVisitId}
                  onChange={(e) => setSelectedProtocolVisitId(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  required
                >
                  {protocolVisits.map((pv) => (
                    <option key={pv.id} value={pv.id}>
                      {pv.code}: {pv.name} (Day {pv.targetOffsetDays})
                    </option>
                  ))}
                </select>
                {selectedDef && (
                  <div className="mt-1.5 p-2 bg-neutral-50 rounded-xs border border-neutral-200 text-xs text-neutral-600 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      Target Offset: Day {selectedDef.targetOffsetDays}
                    </span>
                    <span>
                      Window: -{selectedDef.windowBeforeDays} / +{selectedDef.windowAfterDays} days
                    </span>
                  </div>
                )}
              </div>

              {/* Planned Target Date */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Target Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Assigned Staff */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Assigned Staff
                </label>
                <input
                  type="text"
                  value={assignedStaff}
                  onChange={(e) => setAssignedStaff(e.target.value)}
                  placeholder="e.g. CRC / Study Nurse"
                  className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Scheduling Notes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Fasting required, bring IP accountability container..."
                  className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-sm hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-5 py-2 text-sm font-medium text-white bg-amber-700 hover:bg-amber-800 rounded-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
