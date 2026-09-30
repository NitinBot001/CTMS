import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { participantService } from '../../services/participantService';
import { ParticipantLifecycleStatus } from '../../types';

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddParticipantModal: React.FC<AddParticipantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, currentRole, effectivePermissions } = useAuth();
  const { activeStudyId, activeSiteId, activeStudy, activeSite } = useStudy();

  const [screeningNumber, setScreeningNumber] = useState('');
  const [participantCode, setParticipantCode] = useState('');
  const [initials, setInitials] = useState('');
  const [age, setAge] = useState<number | ''>(35);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [screeningDate, setScreeningDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<ParticipantLifecycleStatus>('SCREENING');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!screeningNumber.trim()) {
      setErrorMessage('Screening number is required.');
      return;
    }
    if (!initials.trim()) {
      setErrorMessage('Participant initials are required.');
      return;
    }
    if (age === '' || age <= 0) {
      setErrorMessage('Please enter a valid age greater than 0.');
      return;
    }

    if (!activeStudyId || !activeSiteId) {
      setErrorMessage('Active study and site context are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await participantService.createParticipant(
        { studyId: activeStudyId, siteId: activeSiteId },
        {
          studyId: activeStudyId,
          siteId: activeSiteId,
          screeningNumber: screeningNumber.trim().toUpperCase(),
          participantCode: participantCode.trim() ? participantCode.trim().toUpperCase() : undefined,
          initials: initials.trim().toUpperCase(),
          demographics: {
            age: Number(age),
            gender,
          },
          screeningDate,
          status,
          assignedInvestigatorId: currentUser?.id,
          assignedInvestigatorName: currentUser?.displayName,
          notes: notes.trim() || undefined,
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
      setErrorMessage(err instanceof Error ? err.message : 'Failed to register participant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-sm bg-surface p-6 shadow-xl border border-divider">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-divider pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-text-primary">
                Add Trial Participant
              </h2>
              <p className="text-xs text-text-muted">
                {activeStudy?.code} — {activeSite?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1 rounded-sm focus:outline-none"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-sm bg-red-50 p-3 text-sm text-red-800 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Screening Number *
              </label>
              <input
                type="text"
                value={screeningNumber}
                onChange={(e) => setScreeningNumber(e.target.value)}
                placeholder="e.g. SCR-001"
                required
                className="w-full rounded-sm border border-divider px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Participant Code (Optional)
              </label>
              <input
                type="text"
                value={participantCode}
                onChange={(e) => setParticipantCode(e.target.value)}
                placeholder="Auto-generated if empty"
                className="w-full rounded-sm border border-divider px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Initials *
              </label>
              <input
                type="text"
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                placeholder="e.g. R.K."
                maxLength={6}
                required
                className="w-full rounded-sm border border-divider px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Age (Years) *
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                required
                className="w-full rounded-sm border border-divider px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Biological Sex
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full rounded-sm border border-divider px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-surface"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Screening Date
              </label>
              <input
                type="date"
                value={screeningDate}
                onChange={(e) => setScreeningDate(e.target.value)}
                className="w-full rounded-sm border border-divider px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ParticipantLifecycleStatus)}
                className="w-full rounded-sm border border-divider px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-surface"
              >
                <option value="SCREENING">Screening</option>
                <option value="ELIGIBLE">Eligible</option>
                <option value="ENROLLED">Enrolled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Clinical & Recruitment Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial intake observations, reference contact details..."
              className="w-full rounded-sm border border-divider px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-divider">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-divider px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-soft focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark focus:outline-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Registering...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Register Participant</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
