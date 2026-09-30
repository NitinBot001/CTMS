import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { participantService } from '../../services/participantService';
import { visitService } from '../../services/visitService';
import {
  Participant,
  ParticipantVisit,
  ParticipantOnboardingRequest,
  ParticipantRequest,
  CreateParticipantRequestInput,
  ParticipantRequestType,
} from '../../types';
import {
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  LogOut,
  Send,
  Building,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react';

export const ParticipantPortalPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { activeStudy: currentStudy, activeSite: currentSite } = useStudy();

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [onboardingRequest, setOnboardingRequest] = useState<ParticipantOnboardingRequest | null>(null);
  const [visits, setVisits] = useState<ParticipantVisit[]>([]);
  const [participantRequests, setParticipantRequests] = useState<ParticipantRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clarification resubmit state
  const [showClarifyModal, setShowClarifyModal] = useState(false);
  const [clarifyNotes, setClarifyNotes] = useState('');
  const [isSubmittingClarification, setIsSubmittingClarification] = useState(false);

  // New Request Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<ParticipantRequestType>('RESCHEDULE_VISIT');
  const [selectedVisitId, setSelectedVisitId] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestFormError, setRequestFormError] = useState<string | null>(null);

  const loadParticipantData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setErrorMessage(null);

    const studyId = currentStudy?.id || 'STUDY-001';
    const siteId = currentSite?.id || 'SITE-001';

    try {
      // 1. Fetch onboarding requests by applicant user ID or email
      const allOnboardingReqs = await participantService.getOnboardingRequests({ studyId, siteId });
      const myOnboardingReqs = allOnboardingReqs.filter(
        (r) =>
          r.participantAccountId === currentUser.id ||
          r.requestedEmail.toLowerCase() === currentUser.email?.toLowerCase()
      );
      const activeOnboardingReq = myOnboardingReqs[0] || null;
      setOnboardingRequest(activeOnboardingReq);

      // 2. Fetch linked participant record
      let linkedPt: Participant | null = null;
      if (activeOnboardingReq?.participantId) {
        linkedPt = await participantService.getParticipant(
          { studyId, siteId },
          activeOnboardingReq.participantId
        );
      } else {
        // Look up by matching email
        const allPts = await participantService.getParticipants({ studyId, siteId });
        const matched = allPts.find(
          (p) => p.email?.toLowerCase() === currentUser.email?.toLowerCase()
        );
        if (matched) {
          linkedPt = await participantService.getParticipant({ studyId, siteId }, matched.id);
        }
      }
      setParticipant(linkedPt);

      // 3. If linked participant exists, fetch visits and participant requests
      if (linkedPt) {
        const [vList, reqList] = await Promise.all([
          visitService.getParticipantVisits({ studyId, siteId }, linkedPt.id),
          participantService.getParticipantRequests({ studyId, siteId }, linkedPt.id),
        ]);
        setVisits(vList);
        setParticipantRequests(reqList);
        if (vList.length > 0 && !selectedVisitId) {
          setSelectedVisitId(vList[0].id);
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load participant portal data.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, currentStudy?.id, currentSite?.id, selectedVisitId]);

  useEffect(() => {
    loadParticipantData();
  }, [loadParticipantData]);

  // Handle Clarification Resubmission
  const handleResubmitClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingRequest) return;

    try {
      setIsSubmittingClarification(true);
      const studyId = currentStudy?.id || onboardingRequest.studyId;
      const siteId = currentSite?.id || onboardingRequest.siteId;

      await participantService.resubmitOnboardingRequest(
        { studyId, siteId },
        onboardingRequest.id,
        { notes: clarifyNotes.trim() }
      );

      setShowClarifyModal(false);
      setClarifyNotes('');
      await loadParticipantData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resubmit application.');
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  // Handle Participant Request Submission (Cannot Attend / Reschedule)
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestFormError(null);

    if (!participant) {
      setRequestFormError('No approved participant record linked to your account.');
      return;
    }
    if (!requestMessage.trim()) {
      setRequestFormError('Please enter a message explaining your request.');
      return;
    }
    if (requestType === 'RESCHEDULE_VISIT' && !proposedDate) {
      setRequestFormError('Please select a proposed new date for rescheduling.');
      return;
    }

    try {
      setIsSubmittingRequest(true);
      const studyId = currentStudy?.id || participant.studyId;
      const siteId = currentSite?.id || participant.siteId;
      const matchedVisit = visits.find((v) => v.id === selectedVisitId);

      const input: CreateParticipantRequestInput = {
        participantId: participant.id,
        studyId,
        siteId,
        requestType,
        visitId: selectedVisitId || undefined,
        visitName: matchedVisit?.visitName || undefined,
        message: requestMessage.trim(),
        proposedDate: proposedDate || undefined,
      };

      await participantService.createParticipantRequest(
        { studyId, siteId },
        input,
        {
          userId: currentUser?.id || 'USR-PT',
          name: currentUser?.displayName || 'Participant',
          roleId: 'ROLE_PARTICIPANT',
          roleName: 'Participant',
          role: 'ROLE_PARTICIPANT',
          effectivePermissions: ['PARTICIPANT_SELF_REQUEST'],
        }
      );

      setShowRequestModal(false);
      setRequestMessage('');
      setProposedDate('');
      await loadParticipantData();
    } catch (err) {
      setRequestFormError(err instanceof Error ? err.message : 'Failed to submit request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white shadow-md border-b border-emerald-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-emerald-800/80 border border-emerald-600 flex items-center justify-center font-serif font-bold text-amber-300">
              AIIA
            </div>
            <div>
              <h1 className="font-serif font-semibold text-lg leading-tight">
                AIIA CTMS — Participant Self-Service Portal
              </h1>
              <span className="text-xs text-emerald-200">
                Ayurveda Clinical Research Subject Desk
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium">{currentUser?.displayName || 'Participant'}</div>
              <div className="text-xs text-emerald-300">{currentUser?.email}</div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-100 bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-600 rounded-sm transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-16 text-center text-neutral-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-sm">Loading your trial details...</p>
          </div>
        ) : (
          <>
            {/* Onboarding Status Alert Banner */}
            {onboardingRequest && (
              <div
                className={`p-4 rounded-sm border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  onboardingRequest.status === 'APPROVED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : onboardingRequest.status === 'NEEDS_CLARIFICATION'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : onboardingRequest.status === 'REJECTED'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  {onboardingRequest.status === 'APPROVED' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  ) : onboardingRequest.status === 'NEEDS_CLARIFICATION' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  ) : onboardingRequest.status === 'REJECTED' ? (
                    <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h2 className="font-semibold text-base">
                      Application Status:{' '}
                      <span className="uppercase">{onboardingRequest.status.replace(/_/g, ' ')}</span>
                    </h2>
                    <p className="text-xs mt-1">
                      {onboardingRequest.status === 'APPROVED' &&
                        `Enrollment confirmed. Your assigned Participant Code is: ${
                          onboardingRequest.participantNumber || participant?.participantCode
                        }.`}
                      {onboardingRequest.status === 'NEEDS_CLARIFICATION' &&
                        `Study Coordinator Note: "${onboardingRequest.decisionReason}". Please provide the requested details.`}
                      {onboardingRequest.status === 'REJECTED' &&
                        `Rejection Reason: "${onboardingRequest.decisionReason}".`}
                      {onboardingRequest.status === 'SUBMITTED' &&
                        'Your application has been received and is queued for verification by the Clinical Research Coordinator.'}
                    </p>
                  </div>
                </div>

                {onboardingRequest.status === 'NEEDS_CLARIFICATION' && (
                  <button
                    onClick={() => setShowClarifyModal(true)}
                    className="px-4 py-2 text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white rounded-sm transition-colors shrink-0"
                  >
                    Provide Clarification & Resubmit
                  </button>
                )}
              </div>
            )}

            {/* Grid: Study & Profile Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Study Overview */}
              <div className="bg-white rounded-sm shadow-xs border border-neutral-200 p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
                  <Building className="w-4 h-4 text-emerald-700" />
                  <h2 className="font-serif font-semibold text-sm text-neutral-800">My Clinical Study</h2>
                </div>
                <div className="space-y-2 text-xs text-neutral-700">
                  <div>
                    <span className="text-neutral-500 font-medium">Protocol Code:</span>{' '}
                    <span className="font-mono font-bold text-neutral-900">
                      {currentStudy?.code || 'AIIA-CT-2026-01'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-medium">Study Title:</span>{' '}
                    <p className="mt-0.5 text-neutral-800 font-medium leading-relaxed">
                      {currentStudy?.title || 'Evaluation of Ayurvedic Formulations in Clinical Operations'}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-medium">Assigned Site:</span>{' '}
                    <span className="font-medium text-neutral-900">
                      {currentSite?.name || 'AIIA Main Hospital Campus'} ({currentSite?.siteCode || 'SITE-001'})
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-medium">Principal Investigator:</span>{' '}
                    <span className="font-medium text-neutral-900">
                      {currentSite?.piName || 'Dr. Rajesh Sharma'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Participant Profile */}
              <div className="bg-white rounded-sm shadow-xs border border-neutral-200 p-5 space-y-3 md:col-span-2">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-700" />
                    <h2 className="font-serif font-semibold text-sm text-neutral-800">My Participant Profile</h2>
                  </div>
                  {participant && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-xs">
                      Enrolled: {participant.status}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-500 block mb-0.5">Subject Number:</span>
                    <span className="font-mono font-bold text-sm text-emerald-800">
                      {participant?.participantCode || onboardingRequest?.participantNumber || 'Pending Assignment'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block mb-0.5">Full Name:</span>
                    <span className="font-medium text-neutral-900">
                      {participant?.initials
                        ? `${currentUser?.displayName} (${participant.initials})`
                        : currentUser?.displayName}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block mb-0.5">Registered Email:</span>
                    <span className="font-medium text-neutral-900">{currentUser?.email}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block mb-0.5">Demographics:</span>
                    <span className="font-medium text-neutral-900 capitalize">
                      {participant?.age || onboardingRequest?.age || '—'} yrs,{' '}
                      {(participant?.sex || onboardingRequest?.gender || '—').toLowerCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block mb-0.5">Date of Birth:</span>
                    <span className="font-medium text-neutral-900">
                      {onboardingRequest?.dob || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block mb-0.5">Screening ID:</span>
                    <span className="font-mono text-neutral-700">
                      {participant?.screeningCode || 'SCR-001'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduled Protocol Visits */}
            <div className="bg-white rounded-sm shadow-xs border border-neutral-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-50">
                <div>
                  <h2 className="font-serif font-semibold text-base text-neutral-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-700" />
                    My Protocol Visits
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Schedule of study evaluations, dispensations, and clinical assessments.
                  </p>
                </div>

                {participant && (
                  <button
                    onClick={() => {
                      setRequestType('RESCHEDULE_VISIT');
                      setShowRequestModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-sm shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cannot Attend / Reschedule</span>
                  </button>
                )}
              </div>

              {visits.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  No protocol visits scheduled yet. Visits will appear here once planned by the study team.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100 text-neutral-700 uppercase tracking-wider font-semibold border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3">Visit Code</th>
                        <th className="px-4 py-3">Visit Name</th>
                        <th className="px-4 py-3">Planned Target Date</th>
                        <th className="px-4 py-3">Allowable Window</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Assigned Staff</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {visits.map((v) => (
                        <tr key={v.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium text-neutral-900">{v.visitCode}</td>
                          <td className="px-4 py-3 font-medium text-neutral-800">{v.visitName}</td>
                          <td className="px-4 py-3 font-medium text-neutral-900">{v.targetDate}</td>
                          <td className="px-4 py-3 text-neutral-600">
                            {v.windowStart} to {v.windowEnd}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-xs font-semibold text-[11px] ${
                                v.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : v.status === 'SCHEDULED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : v.status === 'OVERDUE'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-neutral-100 text-neutral-800'
                              }`}
                            >
                              {v.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-600">{v.assignedStaff || 'Study Team'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* My Submitted Requests */}
            {participantRequests.length > 0 && (
              <div className="bg-white rounded-sm shadow-xs border border-neutral-200 p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
                  <Send className="w-4 h-4 text-emerald-700" />
                  <h2 className="font-serif font-semibold text-sm text-neutral-800">My Requests to Study Team</h2>
                </div>
                <div className="space-y-3">
                  {participantRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-900 capitalize">
                            {req.requestType.replace(/_/g, ' ').toLowerCase()}
                          </span>
                          {req.visitName && (
                            <span className="text-neutral-500">for {req.visitName}</span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-xs font-semibold text-[10px] ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-neutral-700 italic">"{req.message}"</p>
                      {req.proposedDate && (
                        <div className="text-neutral-600">
                          Proposed Date: <span className="font-medium text-neutral-900">{req.proposedDate}</span>
                        </div>
                      )}
                      {req.reviewerComment && (
                        <div className="pt-2 border-t border-neutral-200 text-emerald-900">
                          <span className="font-semibold">CRC Response:</span> {req.reviewerComment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Clarification Resubmission Modal */}
      {showClarifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
        >
          <div className="bg-white rounded-sm shadow-xl max-w-md w-full border border-neutral-200 overflow-hidden">
            <div className="bg-amber-800 px-5 py-3 text-white flex items-center justify-between">
              <h3 className="font-serif font-semibold text-sm">Resubmit Application with Clarifications</h3>
              <button
                type="button"
                onClick={() => setShowClarifyModal(false)}
                className="text-amber-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResubmitClarification} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-amber-900">
                <span className="font-semibold">Coordinator Note:</span>{' '}
                {onboardingRequest?.decisionReason}
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Your Response / Clarification Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={clarifyNotes}
                  onChange={(e) => setClarifyNotes(e.target.value)}
                  rows={4}
                  required
                  placeholder="Enter the requested clinical information, medical records, or clarification..."
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowClarifyModal(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-sm hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClarification}
                  className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-sm disabled:opacity-50"
                >
                  {isSubmittingClarification ? 'Submitting...' : 'Submit Clarification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cannot Attend / Reschedule Visit Modal */}
      {showRequestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
        >
          <div className="bg-white rounded-sm shadow-xl max-w-md w-full border border-neutral-200 overflow-hidden">
            <div className="bg-emerald-900 px-5 py-3 text-white flex items-center justify-between">
              <h3 className="font-serif font-semibold text-sm">Submit Visit Request to Study Team</h3>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitRequest} className="p-5 space-y-4 text-xs">
              {requestFormError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-sm">
                  {requestFormError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Request Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as ParticipantRequestType)}
                  className="w-full p-2 border border-neutral-300 rounded-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="RESCHEDULE_VISIT">Request Rescheduling of Visit</option>
                  <option value="CANNOT_ATTEND">Report Inability to Attend Visit</option>
                  <option value="GENERAL_STUDY_REQUEST">General Inquiry / Message</option>
                </select>
              </div>

              {visits.length > 0 && (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Select Visit <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedVisitId}
                    onChange={(e) => setSelectedVisitId(e.target.value)}
                    className="w-full p-2 border border-neutral-300 rounded-sm bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  >
                    {visits.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.visitCode}: {v.visitName} ({v.targetDate})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {requestType === 'RESCHEDULE_VISIT' && (
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Proposed New Planned Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    required
                    className="w-full p-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Reason / Explanation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={3}
                  required
                  placeholder="Explain why you cannot attend on the planned date, or request assistance..."
                  className="w-full p-2 border border-neutral-300 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-3 py-1.5 border border-neutral-300 rounded-sm hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-sm disabled:opacity-50"
                >
                  {isSubmittingRequest ? 'Sending...' : 'Send Request to CRC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
