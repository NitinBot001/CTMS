import React, { useState } from 'react';
import { ParticipantOnboardingRequest, ReviewOnboardingRequestInput } from '../../types';
import { participantService } from '../../services/participantService';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { X, CheckCircle, AlertTriangle, XCircle, User, Calendar, Mail, Phone, FileText } from 'lucide-react';

interface OnboardingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ParticipantOnboardingRequest;
  onSuccess: () => void;
}

export const OnboardingReviewModal: React.FC<OnboardingReviewModalProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess,
}) => {
  const { currentUser, currentRole, effectivePermissions } = useAuth();
  const { activeStudy: currentStudy, activeSite: currentSite } = useStudy();

  const [decision, setDecision] = useState<'APPROVE' | 'REQUEST_CLARIFICATION' | 'REJECT'>('APPROVE');
  const [reason, setReason] = useState('');
  const [customParticipantNumber, setCustomParticipantNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if ((decision === 'REQUEST_CLARIFICATION' || decision === 'REJECT') && !reason.trim()) {
      setErrorMessage(
        decision === 'REQUEST_CLARIFICATION'
          ? 'Clarification reason is mandatory.'
          : 'Rejection reason is mandatory.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const studyId = currentStudy?.id || request.studyId;
      const siteId = currentSite?.id || request.siteId;

      const reviewInput: ReviewOnboardingRequestInput = {
        decision,
        reason: reason.trim() || undefined,
        participantNumber: customParticipantNumber.trim() || undefined,
      };

      await participantService.reviewOnboardingRequest(
        { studyId, siteId },
        request.id,
        reviewInput,
        {
          userId: currentUser?.id || 'USR-CRC',
          name: currentUser?.displayName || 'Study Coordinator',
          roleId: currentRole?.id || 'ROLE_CRC',
          roleName: currentRole?.name || 'CRC',
          role: currentRole?.id || 'ROLE_CRC',
          effectivePermissions: effectivePermissions.map((p) => p.id),
        },
        currentStudy?.code
      );

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="bg-white rounded-sm shadow-xl max-w-2xl w-full border border-neutral-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <h2 id="review-modal-title" className="font-serif font-semibold text-lg">
              Review Onboarding Application
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Applicant Summary */}
          <div className="bg-neutral-50 rounded-sm p-4 border border-neutral-200 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Applicant Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-neutral-500">Full Name:</span>{' '}
                <span className="font-medium text-neutral-800">{request.requestedName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="text-neutral-800">{request.requestedEmail}</span>
              </div>
              {request.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span className="text-neutral-800">{request.phone}</span>
                </div>
              )}
              {request.dob && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span className="text-neutral-800">
                    DOB: {request.dob} {request.age ? `(${request.age} yrs)` : ''}
                  </span>
                </div>
              )}
              {request.gender && (
                <div>
                  <span className="text-neutral-500">Gender:</span>{' '}
                  <span className="font-medium text-neutral-800 capitalize">{request.gender.toLowerCase()}</span>
                </div>
              )}
              <div>
                <span className="text-neutral-500">Submitted:</span>{' '}
                <span className="text-neutral-700 text-xs">
                  {new Date(request.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {request.notes && (
              <div className="pt-2 border-t border-neutral-200 text-sm">
                <span className="text-neutral-500 text-xs flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Applicant Statement / Notes:
                </span>
                <p className="mt-1 text-neutral-700 italic bg-white p-2 rounded-xs border border-neutral-200">
                  {request.notes}
                </p>
              </div>
            )}
          </div>

          {/* Decision Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-neutral-800">
              Review Decision <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDecision('APPROVE')}
                className={`flex items-center justify-center gap-2 p-3 border rounded-sm font-medium text-sm transition-all ${
                  decision === 'APPROVE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Approve
              </button>

              <button
                type="button"
                onClick={() => setDecision('REQUEST_CLARIFICATION')}
                className={`flex items-center justify-center gap-2 p-3 border rounded-sm font-medium text-sm transition-all ${
                  decision === 'REQUEST_CLARIFICATION'
                    ? 'border-amber-600 bg-amber-50 text-amber-800 shadow-xs'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Request Info
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className={`flex items-center justify-center gap-2 p-3 border rounded-sm font-medium text-sm transition-all ${
                  decision === 'REJECT'
                    ? 'border-red-600 bg-red-50 text-red-800 shadow-xs'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-red-600" />
                Reject
              </button>
            </div>
          </div>

          {/* Approve Options */}
          {decision === 'APPROVE' && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-sm space-y-3">
              <p className="text-xs text-emerald-800">
                Approving this request will automatically generate a new Participant Subject record,
                assign an official study-scoped participant code, and activate the participant portal account.
              </p>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Custom Participant Number (Optional override)
                </label>
                <input
                  type="text"
                  value={customParticipantNumber}
                  onChange={(e) => setCustomParticipantNumber(e.target.value)}
                  placeholder={`Auto-assigned (e.g. ${currentStudy?.code || 'STUDY'}-PT-001)`}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Clarification or Rejection Reason */}
          {(decision === 'REQUEST_CLARIFICATION' || decision === 'REJECT') && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-800">
                {decision === 'REQUEST_CLARIFICATION'
                  ? 'Clarification Details for Applicant'
                  : 'Reason for Rejection'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
                placeholder={
                  decision === 'REQUEST_CLARIFICATION'
                    ? 'Explain what information or documents are required from the participant...'
                    : 'Explain the protocol eligibility or operational criteria not met...'
                }
                className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Action Buttons */}
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
              disabled={isSubmitting}
              className={`px-5 py-2 text-sm font-medium text-white rounded-sm transition-colors ${
                decision === 'APPROVE'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : decision === 'REQUEST_CLARIFICATION'
                  ? 'bg-amber-700 hover:bg-amber-800'
                  : 'bg-red-700 hover:bg-red-800'
              } disabled:opacity-50`}
            >
              {isSubmitting
                ? 'Processing...'
                : decision === 'APPROVE'
                ? 'Confirm & Enroll Participant'
                : decision === 'REQUEST_CLARIFICATION'
                ? 'Send Clarification Request'
                : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
