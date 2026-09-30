import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { assessmentService } from '../../services/assessmentService';
import { participantService } from '../../services/participantService';
import {
  AssessmentAssignment,
  AssessmentSession,
  AssessmentInstrument,
  AssessmentInstrumentVersion,
  AssessmentSection,
  AssessmentItem,
  AssessmentResponse,
  AssessmentReview,
  Participant,
  AssessmentReviewStatus,
} from '../../types';
import {
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  FileCheck2,
  Clock,
  Send,
  Sparkles,
} from 'lucide-react';

export const AssessmentReviewPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { activeStudy, activeSite } = useStudy();

  const [assignment, setAssignment] = useState<AssessmentAssignment | null>(null);
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [instrument, setInstrument] = useState<AssessmentInstrument | null>(null);
  const [version, setVersion] = useState<AssessmentInstrumentVersion | null>(null);
  const [sections, setSections] = useState<AssessmentSection[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [pastReviews, setPastReviews] = useState<AssessmentReview[]>([]);

  // Review Form
  const [decision, setDecision] = useState<AssessmentReviewStatus>('APPROVED');
  const [revisionReason, setRevisionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReviewData = useCallback(async () => {
    if (!assignmentId) return;
    setIsLoading(true);
    setErrorMessage(null);

    const studyId = activeStudy?.id || 'STUDY-001';
    const siteId = activeSite?.id || 'SITE-001';

    try {
      const assign = await assessmentService.getAssignmentById({ studyId, siteId }, assignmentId);
      if (!assign) throw new Error(`Assignment not found: ${assignmentId}`);
      setAssignment(assign);

      const pt = await participantService.getParticipant({ studyId, siteId }, assign.participantId);
      setParticipant(pt);

      const sess = await assessmentService.getSessionByAssignmentId({ studyId, siteId }, assignmentId);
      if (!sess) throw new Error(`Assessment session not found for assignment ${assignmentId}`);
      setSession(sess);

      const [inst, ver, secList, itList, respList, revList] = await Promise.all([
        assessmentService.getInstrumentById(assign.instrumentId),
        assessmentService.getVersionById(assign.instrumentVersionId),
        assessmentService.getSections(assign.instrumentVersionId),
        assessmentService.getItems(assign.instrumentVersionId),
        assessmentService.getResponses({ studyId, siteId }, sess.sessionId),
        assessmentService.getReviews({ studyId, siteId }, sess.sessionId),
      ]);

      setInstrument(inst);
      setVersion(ver);
      setSections(secList);
      setItems(itList);
      setResponses(respList);
      setPastReviews(revList);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load assessment review.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, activeStudy, activeSite]);

  useEffect(() => {
    loadReviewData();
  }, [loadReviewData]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    if (decision === 'REVISION_REQUESTED' && !revisionReason.trim()) {
      setErrorMessage('A mandatory revision reason is required when returning an assessment for correction.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const studyId = activeStudy?.id || 'STUDY-001';
    const siteId = activeSite?.id || 'SITE-001';

    try {
      await assessmentService.createReview(
        { studyId, siteId },
        {
          sessionId: session.sessionId,
          assignmentId: session.assignmentId,
          reviewStatus: decision,
          notes: reviewNotes.trim() || undefined,
          revisionReason: decision === 'REVISION_REQUESTED' ? revisionReason.trim() : undefined,
        },
        {
          id: currentUser?.id || 'USR-SUBI',
          name: currentUser?.displayName || 'Sub-Investigator',
          role: currentUser?.designation || 'ROLE_SUB_I',
        }
      );

      navigate('/pi/assessments');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit review decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCompleted = session?.status === 'COMPLETED';

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-neutral-500">
        Loading assessment responses for clinical review...
      </div>
    );
  }

  if (errorMessage && !session) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
          {errorMessage}
        </div>
        <button
          onClick={() => navigate('/pi/assessments')}
          className="px-4 py-2 bg-neutral-800 text-white text-xs rounded-sm"
        >
          Return to Assessments
        </button>
      </div>
    );
  }

  const responseMap: Record<string, AssessmentResponse> = {};
  responses.forEach((r) => {
    responseMap[r.itemId] = r;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-sm border border-neutral-200 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-red-950 via-amber-950 to-emerald-950 text-white p-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/pi/assessments')}
              className="flex items-center gap-1 text-xs text-amber-200 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Assessments</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-white/20 text-white border border-white/30">
                {session?.status.replace('_', ' ')}
              </span>
              {instrument?.rightsStatus === 'VERIFIED' && (
                <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-emerald-800 text-emerald-200 border border-emerald-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Synthetic Demo
                </span>
              )}
            </div>
          </div>

          <div className="mt-3">
            <h1 className="font-serif text-xl font-bold">
              Sub-Investigator & PI Clinical Assessment Verification
            </h1>
            <div className="text-xs text-amber-200 mt-1 flex flex-wrap items-center gap-3">
              <span>Instrument: <strong>{instrument?.name}</strong></span>
              <span>Subject: <strong>{participant?.participantCode || assignment?.participantId}</strong></span>
              <span>Version: <strong>v{version?.versionLabel}</strong></span>
            </div>
          </div>
        </div>

        {/* Audit Meta Grid */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-neutral-500 block">Participant:</span>
            <span className="font-semibold text-neutral-900">{participant?.initials || 'Subject'}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Session Started:</span>
            <span className="font-semibold text-neutral-900">
              {session?.startedAt ? new Date(session.startedAt).toLocaleString() : '—'}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block">Submitted By:</span>
            <span className="font-semibold text-neutral-900">{session?.startedBy || 'Investigator'}</span>
          </div>
          <div>
            <span className="text-neutral-500 block">Total Responses:</span>
            <span className="font-semibold text-neutral-900">{responses.length} Captured</span>
          </div>
        </div>
      </div>

      {/* Prior Review History if any */}
      {pastReviews.length > 0 && (
        <div className="bg-white rounded-sm border border-neutral-200 p-4 shadow-xs space-y-3">
          <h3 className="font-serif font-bold text-xs text-neutral-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-neutral-500" />
            Previous Review Audits ({pastReviews.length})
          </h3>
          <div className="divide-y divide-neutral-100 text-xs">
            {pastReviews.map((rev) => (
              <div key={rev.reviewId} className="py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-800">
                    {rev.reviewerName} ({rev.reviewerRole})
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${
                      rev.reviewStatus === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {rev.reviewStatus}
                  </span>
                </div>
                {rev.revisionReason && (
                  <div className="text-red-800">
                    <strong>Revision Reason:</strong> {rev.revisionReason}
                  </div>
                )}
                {rev.notes && <div className="text-neutral-600">Notes: {rev.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submitted Responses Breakdown By Section */}
      <div className="space-y-4">
        {sections.map((sec, secIdx) => {
          const secItems = items.filter((it) => it.sectionId === sec.sectionId);

          return (
            <div key={sec.sectionId} className="bg-white rounded-sm border border-neutral-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3 bg-neutral-100/70 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-neutral-500 font-semibold">
                    Section {secIdx + 1}
                  </span>
                  <h3 className="font-serif font-bold text-sm text-neutral-900">{sec.title}</h3>
                </div>
                <span className="text-[11px] text-neutral-500">{secItems.length} Items</span>
              </div>

              <div className="divide-y divide-neutral-100 p-2">
                {secItems.map((item, itemIdx) => {
                  const resp = responseMap[item.itemId];

                  // Format captured value
                  let formattedValue = '—';
                  if (resp) {
                    if (resp.selectedOptionIds && resp.selectedOptionIds.length > 0) {
                      const optLabels = item.responseDefinition?.options
                        ?.filter((o) => resp.selectedOptionIds?.includes(o.optionId))
                        .map((o) => o.label)
                        .join(', ');
                      formattedValue = optLabels || resp.selectedOptionIds.join(', ');
                    } else if (resp.bodyLocationValue) {
                      formattedValue = `${resp.bodyLocationValue.regionId} (${resp.bodyLocationValue.side || 'BILATERAL'}) ${
                        resp.bodyLocationValue.locationNotes ? `— ${resp.bodyLocationValue.locationNotes}` : ''
                      }`;
                    } else if (resp.numericValue !== undefined) {
                      formattedValue = String(resp.numericValue);
                    } else if (resp.booleanValue !== undefined) {
                      formattedValue = resp.booleanValue ? 'YES' : 'NO';
                    } else if (resp.textValue) {
                      formattedValue = resp.textValue;
                    } else if (resp.value !== undefined && resp.value !== null) {
                      formattedValue = String(resp.value);
                    }
                  }

                  return (
                    <div key={item.itemId} className="p-3 text-xs flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-neutral-500">
                            Q{itemIdx + 1} · {item.itemCode}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-xs text-[9px] bg-neutral-100 text-neutral-600 font-mono">
                            {item.itemType}
                          </span>
                        </div>
                        <div className="font-medium text-neutral-900">{item.questionText}</div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <div className="text-[10px] text-neutral-400 uppercase font-semibold">Captured Response</div>
                        <div className="font-semibold text-neutral-800 bg-neutral-50 px-2.5 py-1 rounded-sm border border-neutral-200 mt-0.5 inline-block">
                          {formattedValue}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Decision Form */}
      {isCompleted ? (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-sm text-xs text-emerald-900 flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            This assessment has been verified and marked <strong>COMPLETED</strong>. All responses are immutably archived.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmitReview} className="bg-white rounded-sm border border-neutral-200 shadow-xs p-6 space-y-4 text-xs">
          <h2 className="font-serif font-bold text-base text-neutral-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-amber-800" />
            Investigator Review Decision Gate
          </h2>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-900 rounded-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-neutral-800 mb-2">Review Decision *</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-3 border rounded-sm cursor-pointer transition-colors ${
                  decision === 'APPROVED'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-semibold'
                    : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <input
                  type="radio"
                  name="reviewDecision"
                  value="APPROVED"
                  checked={decision === 'APPROVED'}
                  onChange={() => setDecision('APPROVED')}
                  className="text-emerald-700"
                />
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                <span>Approve & Complete Assessment</span>
              </label>

              <label
                className={`flex items-center gap-2 p-3 border rounded-sm cursor-pointer transition-colors ${
                  decision === 'REVISION_REQUESTED'
                    ? 'border-red-600 bg-red-50/50 text-red-950 font-semibold'
                    : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <input
                  type="radio"
                  name="reviewDecision"
                  value="REVISION_REQUESTED"
                  checked={decision === 'REVISION_REQUESTED'}
                  onChange={() => setDecision('REVISION_REQUESTED')}
                  className="text-red-700"
                />
                <AlertTriangle className="w-4 h-4 text-red-700" />
                <span>Request Revision / Correction</span>
              </label>
            </div>
          </div>

          {/* Revision Reason (Mandatory if REVISION_REQUESTED) */}
          {decision === 'REVISION_REQUESTED' && (
            <div className="space-y-1">
              <label className="block font-semibold text-red-900">
                Mandatory Revision Reason / Clinical Feedback *
              </label>
              <textarea
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                required
                rows={3}
                placeholder="Specify exact responses requiring clarification or correction..."
                className="w-full border border-red-300 rounded-sm px-3 py-2 text-xs focus:ring-1 focus:ring-red-600 focus:outline-hidden bg-red-50/20"
              />
            </div>
          )}

          {/* General Notes */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Clinical Review Notes (Optional)
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Constitutional responses consistent with baseline screening."
              className="w-full border border-neutral-300 rounded-sm px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/pi/assessments')}
              className="px-4 py-2 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-1.5 px-5 py-2 text-white font-semibold rounded-sm shadow-xs transition-colors ${
                decision === 'APPROVED'
                  ? 'bg-emerald-800 hover:bg-emerald-900'
                  : 'bg-red-800 hover:bg-red-900'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Decision...' : 'Submit Verification Decision'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
