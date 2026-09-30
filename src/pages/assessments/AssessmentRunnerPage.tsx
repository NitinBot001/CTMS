import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  AssessmentRule,
  AssessmentResponse,
  AssessmentReview,
  Participant,
  BodyLocationValue,
} from '../../types';
import {
  AssessmentBranchingEngine,
  VisibilityState,
  CompletionState,
} from '../../services/assessmentBranchingEngine';
import {
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Save,
  Send,
  Lock,
  Sparkles,
  Info,
  Activity,
  Check,
} from 'lucide-react';

const ANATOMICAL_REGIONS = [
  { id: 'HEAD_SCALP', name: 'Head & Scalp (Shirah)' },
  { id: 'FACE_EYES_NOSE', name: 'Face, Eyes, ENT' },
  { id: 'NECK_THROAT', name: 'Neck & Cervical (Greeva)' },
  { id: 'CHEST_THORAX', name: 'Chest & Thorax (Urah)' },
  { id: 'EPIGASTRIC', name: 'Epigastrium / Stomach (Amashaya)' },
  { id: 'UMBILICAL_LOWER_ABDOMEN', name: 'Umbilical & Lower Abdomen (Pakwashaya)' },
  { id: 'UPPER_BACK', name: 'Upper Back & Scapular' },
  { id: 'LUMBAR_LOWER_BACK', name: 'Lumbar & Sacral Spine (Kati)' },
  { id: 'SHOULDER_UPPER_EXTREMITY', name: 'Shoulders & Arms (Bahu)' },
  { id: 'ELBOW_WRIST_HAND', name: 'Elbows, Wrists, Hands (Hasta)' },
  { id: 'HIP_PELVIS', name: 'Hips & Pelvis (Shroni)' },
  { id: 'KNEE_JOINT', name: 'Knee Joints (Janu)' },
  { id: 'ANKLE_FOOT', name: 'Ankles & Feet (Pada)' },
];

export const AssessmentRunnerPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { activeStudy, activeSite } = useStudy();

  const isParticipantView = location.pathname.startsWith('/participant');

  const [assignment, setAssignment] = useState<AssessmentAssignment | null>(null);
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [instrument, setInstrument] = useState<AssessmentInstrument | null>(null);
  const [version, setVersion] = useState<AssessmentInstrumentVersion | null>(null);
  const [sections, setSections] = useState<AssessmentSection[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [rules, setRules] = useState<AssessmentRule[]>([]);
  const [latestReview, setLatestReview] = useState<AssessmentReview | null>(null);

  // Response Map: itemId -> AssessmentResponse
  const [responses, setResponses] = useState<Record<string, AssessmentResponse>>({});

  // Active section tab
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  // Engine derived state
  const [visibility, setVisibility] = useState<VisibilityState>({
    hiddenItemIds: new Set(),
    hiddenSectionIds: new Set(),
    skippedItemIds: new Set(),
  });
  const [completion, setCompletion] = useState<CompletionState>({
    isComplete: false,
    totalVisibleItems: 0,
    answeredItemsCount: 0,
    completionPercentage: 0,
    unansweredRequiredItemIds: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRunnerData = useCallback(async () => {
    if (!assignmentId) return;
    setIsLoading(true);
    setErrorMessage(null);

    const studyId = activeStudy?.id || 'STUDY-001';
    const siteId = activeSite?.id || 'SITE-001';

    try {
      // 1. Get Assignment
      const assign = await assessmentService.getAssignmentById({ studyId, siteId }, assignmentId);
      if (!assign) {
        throw new Error(`Assessment assignment not found: ${assignmentId}`);
      }
      setAssignment(assign);

      // 2. Get Linked Participant
      const pt = await participantService.getParticipant({ studyId, siteId }, assign.participantId);
      setParticipant(pt);

      // 3. Get or Start Session
      let sess = await assessmentService.getSessionByAssignmentId({ studyId, siteId }, assignmentId);
      if (!sess) {
        sess = await assessmentService.startSession(
          { studyId, siteId },
          assignmentId,
          {
            id: currentUser?.id || 'USR-ACTOR',
            name: currentUser?.displayName || 'Trial User',
            role: currentUser?.designation || 'ROLE_CRC',
          }
        );
      }
      setSession(sess);

      // 4. If revision required, fetch latest review
      if (sess.status === 'REVISION_REQUIRED') {
        const revs = await assessmentService.getReviews({ studyId, siteId }, sess.sessionId);
        if (revs.length > 0) {
          setLatestReview(revs[revs.length - 1]);
        }
      }

      // 5. Get Instrument & Version
      const [inst, ver] = await Promise.all([
        assessmentService.getInstrumentById(assign.instrumentId),
        assessmentService.getVersionById(assign.instrumentVersionId),
      ]);
      setInstrument(inst);
      setVersion(ver);

      // 6. Get Sections, Items, Rules
      const [secList, itList, ruleList, respList] = await Promise.all([
        assessmentService.getSections(assign.instrumentVersionId),
        assessmentService.getItems(assign.instrumentVersionId),
        assessmentService.getRules(assign.instrumentVersionId),
        assessmentService.getResponses({ studyId, siteId }, sess.sessionId),
      ]);

      setSections(secList);
      setItems(itList);
      setRules(ruleList);

      if (secList.length > 0 && !activeSectionId) {
        setActiveSectionId(secList[0].sectionId);
      }

      // Map existing responses
      const respMap: Record<string, AssessmentResponse> = {};
      respList.forEach((r) => {
        respMap[r.itemId] = r;
      });
      setResponses(respMap);

      // Compute initial visibility and completion
      const vis = AssessmentBranchingEngine.computeVisibility(itList, secList, ruleList, respMap);
      setVisibility(vis);

      const comp = AssessmentBranchingEngine.evaluateCompletion(itList, secList, ruleList, respMap);
      setCompletion(comp);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load assessment runner.');
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, activeStudy, activeSite, currentUser]);

  useEffect(() => {
    loadRunnerData();
  }, [loadRunnerData]);

  // Reactive Branching Re-evaluation
  const recomputeEngineState = (updatedResponses: Record<string, AssessmentResponse>) => {
    const vis = AssessmentBranchingEngine.computeVisibility(items, sections, rules, updatedResponses);
    setVisibility(vis);

    const comp = AssessmentBranchingEngine.evaluateCompletion(items, sections, rules, updatedResponses);
    setCompletion(comp);
  };

  // Response Value Mutation Handler
  const handleValueChange = (item: AssessmentItem, value: any, extraFields?: Partial<AssessmentResponse>) => {
    if (isReadOnly) return;

    const existing = responses[item.itemId];
    const updatedResp: AssessmentResponse = {
      responseId: existing?.responseId || `RESP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId: session?.sessionId || '',
      assignmentId: assignment?.assignmentId || '',
      studyId: activeStudy?.id || 'STUDY-001',
      siteId: activeSite?.id || 'SITE-001',
      participantId: assignment?.participantId || '',
      instrumentId: assignment?.instrumentId || '',
      instrumentVersionId: assignment?.instrumentVersionId || '',
      itemId: item.itemId,
      valueType: item.itemType,
      value,
      recordedAt: new Date().toISOString(),
      recordedBy: currentUser?.displayName || 'Investigator',
      isFinal: false,
      ...extraFields,
    };

    const nextResponses = {
      ...responses,
      [item.itemId]: updatedResp,
    };

    setResponses(nextResponses);
    recomputeEngineState(nextResponses);
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!session || isReadOnly) return;
    setIsSaving(true);
    setStatusFeedback(null);
    try {
      const studyId = activeStudy?.id || 'STUDY-001';
      const siteId = activeSite?.id || 'SITE-001';

      const inputs = Object.values(responses).map((r) => ({
        sessionId: session.sessionId,
        assignmentId: session.assignmentId,
        participantId: session.participantId,
        instrumentId: session.instrumentId,
        instrumentVersionId: session.instrumentVersionId,
        itemId: r.itemId,
        valueType: r.valueType,
        value: r.value,
        selectedOptionIds: r.selectedOptionIds,
        textValue: r.textValue,
        numericValue: r.numericValue,
        booleanValue: r.booleanValue,
        dateValue: r.dateValue,
        bodyLocationValue: r.bodyLocationValue,
      }));

      await assessmentService.saveBatchResponses(
        { studyId, siteId },
        inputs,
        {
          id: currentUser?.id || 'USR-ACTOR',
          name: currentUser?.displayName || 'User',
          role: currentUser?.designation || 'ROLE_CRC',
        }
      );

      await assessmentService.saveSessionProgress(
        { studyId, siteId },
        session.sessionId,
        undefined,
        completion.completionPercentage
      );

      setStatusFeedback(`Progress saved (${completion.completionPercentage}% complete).`);
      setTimeout(() => setStatusFeedback(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save responses draft.');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Session
  const handleSubmit = async () => {
    if (!session || isReadOnly) return;

    if (!completion.isComplete) {
      setErrorMessage(
        `Cannot submit assessment. ${completion.unansweredRequiredItemIds.length} required question(s) are unanswered.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const studyId = activeStudy?.id || 'STUDY-001';
      const siteId = activeSite?.id || 'SITE-001';

      // 1. Save all responses first
      const inputs = Object.values(responses).map((r) => ({
        sessionId: session.sessionId,
        assignmentId: session.assignmentId,
        participantId: session.participantId,
        instrumentId: session.instrumentId,
        instrumentVersionId: session.instrumentVersionId,
        itemId: r.itemId,
        valueType: r.valueType,
        value: r.value,
        selectedOptionIds: r.selectedOptionIds,
        textValue: r.textValue,
        numericValue: r.numericValue,
        booleanValue: r.booleanValue,
        dateValue: r.dateValue,
        bodyLocationValue: r.bodyLocationValue,
      }));

      await assessmentService.saveBatchResponses(
        { studyId, siteId },
        inputs,
        {
          id: currentUser?.id || 'USR-ACTOR',
          name: currentUser?.displayName || 'User',
          role: currentUser?.designation || 'ROLE_CRC',
        }
      );

      // 2. Submit session
      const submitted = await assessmentService.submitSession(
        { studyId, siteId },
        session.sessionId,
        {
          id: currentUser?.id || 'USR-ACTOR',
          name: currentUser?.displayName || 'User',
          role: currentUser?.designation || 'ROLE_CRC',
        }
      );

      setSession(submitted);
      setStatusFeedback('Assessment submitted successfully for Sub-Investigator / PI review!');

      setTimeout(() => {
        if (isParticipantView) {
          navigate('/participant');
        } else {
          navigate('/pi/assessments');
        }
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly =
    session?.status === 'SUBMITTED' ||
    session?.status === 'UNDER_REVIEW' ||
    session?.status === 'COMPLETED' ||
    session?.status === 'CANCELLED';

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-neutral-500">
        Loading clinical assessment runner...
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
          onClick={() => navigate(isParticipantView ? '/participant' : '/pi/assessments')}
          className="px-4 py-2 bg-neutral-800 text-white text-xs rounded-sm"
        >
          Return to Assessments
        </button>
      </div>
    );
  }

  const currentSection = sections.find((s) => s.sectionId === activeSectionId) || sections[0];
  const visibleItemsInSection = items.filter(
    (it) =>
      it.sectionId === currentSection?.sectionId &&
      !visibility.hiddenItemIds.has(it.itemId) &&
      !visibility.skippedItemIds.has(it.itemId)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-sm border border-neutral-200 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-red-950 via-amber-950 to-emerald-950 text-white p-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(isParticipantView ? '/participant' : '/pi/assessments')}
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
            <h1 className="font-serif text-xl font-bold">{instrument?.name}</h1>
            <div className="text-xs text-amber-200 mt-0.5 flex flex-wrap items-center gap-3">
              <span>Category: <strong>{instrument?.category}</strong></span>
              <span>Subject: <strong>{participant?.participantCode || assignment?.participantId}</strong></span>
              <span>Version: <strong>v{version?.versionLabel}</strong></span>
            </div>
          </div>
        </div>

        {/* Progress Bar & Summary Stats */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-full max-w-xs bg-neutral-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  completion.isComplete ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
                style={{ width: `${completion.completionPercentage}%` }}
              />
            </div>
            <span className="font-semibold text-neutral-800 shrink-0">
              {completion.completionPercentage}% Complete
            </span>
          </div>

          <div className="text-neutral-500 text-[11px] shrink-0">
            Answered {completion.answeredItemsCount} of {completion.totalVisibleItems} visible questions
          </div>
        </div>
      </div>

      {/* Revision Required Feedback Banner */}
      {session?.status === 'REVISION_REQUIRED' && latestReview && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-sm text-xs text-red-900 shadow-xs space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-sm text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Clinical Revision Requested by {latestReview.reviewerName} ({latestReview.reviewerRole})
          </div>
          <div className="text-neutral-800 pl-5 leading-relaxed">
            <strong className="text-red-900">Correction Reason:</strong> {latestReview.revisionReason}
          </div>
          {latestReview.notes && (
            <div className="text-neutral-600 pl-5 text-[11px]">
              Notes: {latestReview.notes}
            </div>
          )}
        </div>
      )}

      {/* Read-Only Notice */}
      {isReadOnly && (
        <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-sm text-xs text-neutral-700 flex items-center gap-2">
          <Lock className="w-4 h-4 text-neutral-500 shrink-0" />
          <span>
            This assessment session is currently <strong>{session?.status}</strong>. Responses are locked for verification audit.
          </span>
        </div>
      )}

      {/* Notifications / Alerts */}
      {statusFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusFeedback}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-900 text-xs rounded-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section Stepper / Tabs */}
      <div className="flex border-b border-neutral-300 overflow-x-auto gap-2 pb-1">
        {sections.map((sec, idx) => {
          const isHidden = visibility.hiddenSectionIds.has(sec.sectionId);
          if (isHidden) return null;

          const isCurrent = sec.sectionId === currentSection?.sectionId;
          const secItems = items.filter(
            (it) =>
              it.sectionId === sec.sectionId &&
              !visibility.hiddenItemIds.has(it.itemId) &&
              !visibility.skippedItemIds.has(it.itemId) &&
              it.itemType !== 'INSTRUCTION'
          );
          const answeredInSec = secItems.filter((it) => {
            const resp = responses[it.itemId];
            return resp && AssessmentBranchingEngine.extractValue(resp) !== undefined;
          }).length;
          const isSecDone = secItems.length > 0 && answeredInSec === secItems.length;

          return (
            <button
              key={sec.sectionId}
              onClick={() => setActiveSectionId(sec.sectionId)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-sm whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
                isCurrent
                  ? 'border-amber-800 bg-white text-amber-900 shadow-xs'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 bg-neutral-100/60'
              }`}
            >
              <span>{idx + 1}. {sec.title}</span>
              {isSecDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
            </button>
          );
        })}
      </div>

      {/* Section Content & Questionnaire Items Canvas */}
      <div className="bg-white rounded-sm border border-neutral-200 shadow-xs p-6 space-y-6">
        {currentSection && (
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="font-serif text-lg font-bold text-neutral-900">
              {currentSection.title}
            </h2>
            {currentSection.description && (
              <p className="text-xs text-neutral-500 mt-1">{currentSection.description}</p>
            )}
          </div>
        )}

        {visibleItemsInSection.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            No active questions in this section based on current conditional branching rules.
          </div>
        ) : (
          <div className="space-y-6">
            {visibleItemsInSection.map((item, itemIdx) => {
              const resp = responses[item.itemId];
              const val = resp?.value;

              return (
                <div
                  key={item.itemId}
                  className="p-4 bg-neutral-50/70 rounded-sm border border-neutral-200 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-neutral-500 font-bold uppercase">
                          Q{itemIdx + 1} · {item.itemCode}
                        </span>
                        {item.required && item.itemType !== 'INSTRUCTION' && (
                          <span className="text-[10px] text-red-600 font-bold">* Required</span>
                        )}
                      </div>
                      <div className="font-semibold text-sm text-neutral-900">
                        {item.questionText}
                      </div>
                      {item.helpText && (
                        <div className="text-xs text-neutral-500 italic">{item.helpText}</div>
                      )}
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* TYPED INPUT RENDERERS */}
                  {/* ========================================================= */}

                  {/* 1. SINGLE CHOICE (Radio) */}
                  {item.itemType === 'SINGLE_CHOICE' && (
                    <div className="space-y-2 pt-1">
                      {item.responseDefinition?.options?.map((opt) => {
                        const isChecked = val === opt.value || resp?.selectedOptionIds?.includes(opt.optionId);

                        return (
                          <label
                            key={opt.optionId}
                            className={`flex items-center gap-3 p-2.5 rounded-sm border cursor-pointer text-xs transition-colors ${
                              isChecked
                                ? 'bg-amber-50 border-amber-600 text-amber-950 font-medium'
                                : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={item.itemId}
                              checked={isChecked}
                              disabled={isReadOnly}
                              onChange={() =>
                                handleValueChange(item, opt.value, {
                                  selectedOptionIds: [opt.optionId],
                                  textValue: opt.label,
                                })
                              }
                              className="text-amber-800"
                            />
                            <span>{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. MULTI CHOICE (Checkboxes) */}
                  {item.itemType === 'MULTI_CHOICE' && (
                    <div className="space-y-2 pt-1">
                      {item.responseDefinition?.options?.map((opt) => {
                        const selectedIds = resp?.selectedOptionIds || [];
                        const isChecked = selectedIds.includes(opt.optionId);

                        return (
                          <label
                            key={opt.optionId}
                            className={`flex items-center gap-3 p-2.5 rounded-sm border cursor-pointer text-xs transition-colors ${
                              isChecked
                                ? 'bg-amber-50 border-amber-600 text-amber-950 font-medium'
                                : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isReadOnly}
                              onChange={() => {
                                const nextSelected = isChecked
                                  ? selectedIds.filter((id) => id !== opt.optionId)
                                  : [...selectedIds, opt.optionId];
                                handleValueChange(item, nextSelected, {
                                  selectedOptionIds: nextSelected,
                                });
                              }}
                              className="rounded-xs text-amber-800"
                            />
                            <span>{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* 3. YES / NO TOGGLE */}
                  {item.itemType === 'YES_NO' && (
                    <div className="flex gap-3 pt-1">
                      {['YES', 'NO'].map((choice) => {
                        const isSelected = val === choice || (choice === 'YES' && resp?.booleanValue === true) || (choice === 'NO' && resp?.booleanValue === false);

                        return (
                          <button
                            key={choice}
                            type="button"
                            disabled={isReadOnly}
                            onClick={() =>
                              handleValueChange(item, choice, {
                                booleanValue: choice === 'YES',
                                textValue: choice,
                              })
                            }
                            className={`px-5 py-2 rounded-sm text-xs font-bold border transition-colors ${
                              isSelected
                                ? 'bg-amber-800 text-white border-amber-900 shadow-xs'
                                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                            }`}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 4. DISCRETE SCALE (1 to 5) */}
                  {item.itemType === 'SCALE' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        {Array.from(
                          { length: (item.responseDefinition?.maxVal ?? 5) - (item.responseDefinition?.minVal ?? 1) + 1 },
                          (_, i) => (item.responseDefinition?.minVal ?? 1) + i
                        ).map((num) => {
                          const isSelected = Number(val) === num || resp?.numericValue === num;

                          return (
                            <button
                              key={num}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() =>
                                handleValueChange(item, num, {
                                  numericValue: num,
                                })
                              }
                              className={`w-12 h-10 rounded-sm text-xs font-bold border transition-colors flex items-center justify-center ${
                                isSelected
                                  ? 'bg-amber-800 text-white border-amber-900 shadow-xs scale-105'
                                  : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-between max-w-sm text-[11px] text-neutral-500 px-1">
                        <span>{item.responseDefinition?.scaleMinLabel || 'Mild / Low'}</span>
                        <span>{item.responseDefinition?.scaleMaxLabel || 'Severe / High'}</span>
                      </div>
                    </div>
                  )}

                  {/* 5. SHORT TEXT */}
                  {item.itemType === 'TEXT' && (
                    <input
                      type="text"
                      value={resp?.textValue || (typeof val === 'string' ? val : '')}
                      disabled={isReadOnly}
                      onChange={(e) =>
                        handleValueChange(item, e.target.value, {
                          textValue: e.target.value,
                        })
                      }
                      placeholder="Enter response..."
                      className="w-full max-w-md border border-neutral-300 rounded-sm px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden disabled:bg-neutral-100"
                    />
                  )}

                  {/* 6. LONG TEXT */}
                  {item.itemType === 'LONG_TEXT' && (
                    <textarea
                      rows={3}
                      value={resp?.textValue || (typeof val === 'string' ? val : '')}
                      disabled={isReadOnly}
                      onChange={(e) =>
                        handleValueChange(item, e.target.value, {
                          textValue: e.target.value,
                        })
                      }
                      placeholder="Enter detailed clinical observations..."
                      className="w-full border border-neutral-300 rounded-sm px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden disabled:bg-neutral-100"
                    />
                  )}

                  {/* 7. INTEGER / DECIMAL */}
                  {(item.itemType === 'INTEGER' || item.itemType === 'DECIMAL') && (
                    <input
                      type="number"
                      step={item.itemType === 'DECIMAL' ? 'any' : '1'}
                      value={resp?.numericValue ?? (typeof val === 'number' ? val : '')}
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const num = e.target.value === '' ? undefined : Number(e.target.value);
                        handleValueChange(item, num, {
                          numericValue: num,
                        });
                      }}
                      placeholder="Numeric value..."
                      className="w-48 border border-neutral-300 rounded-sm px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden disabled:bg-neutral-100"
                    />
                  )}

                  {/* 8. DATE */}
                  {item.itemType === 'DATE' && (
                    <input
                      type="date"
                      value={resp?.dateValue || (typeof val === 'string' ? val : '')}
                      disabled={isReadOnly}
                      onChange={(e) =>
                        handleValueChange(item, e.target.value, {
                          dateValue: e.target.value,
                        })
                      }
                      className="w-56 border border-neutral-300 rounded-sm px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-700 focus:outline-hidden disabled:bg-neutral-100"
                    />
                  )}

                  {/* 9. BODY DIAGRAM / ANATOMICAL LOCATION */}
                  {item.itemType === 'BODY_DIAGRAM' && (
                    <div className="space-y-3 p-3 bg-white border border-neutral-200 rounded-sm max-w-lg">
                      <div className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-700" />
                        <span>Ayurveda Anatomical Site Specification</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="block text-neutral-600 mb-1">Anatomical Region</label>
                          <select
                            value={resp?.bodyLocationValue?.regionId || ''}
                            disabled={isReadOnly}
                            onChange={(e) => {
                              const nextLoc: BodyLocationValue = {
                                regionId: e.target.value,
                                side: resp?.bodyLocationValue?.side || 'BILATERAL',
                                locationNotes: resp?.bodyLocationValue?.locationNotes,
                              };
                              handleValueChange(item, nextLoc, {
                                bodyLocationValue: nextLoc,
                              });
                            }}
                            className="w-full border border-neutral-300 rounded-sm px-2 py-1 text-xs"
                          >
                            <option value="">-- Select Body Region --</option>
                            {ANATOMICAL_REGIONS.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-neutral-600 mb-1">Laterality / Side</label>
                          <select
                            value={resp?.bodyLocationValue?.side || 'BILATERAL'}
                            disabled={isReadOnly}
                            onChange={(e) => {
                              const nextLoc: BodyLocationValue = {
                                regionId: resp?.bodyLocationValue?.regionId || 'KNEE_JOINT',
                                side: e.target.value as any,
                                locationNotes: resp?.bodyLocationValue?.locationNotes,
                              };
                              handleValueChange(item, nextLoc, {
                                bodyLocationValue: nextLoc,
                              });
                            }}
                            className="w-full border border-neutral-300 rounded-sm px-2 py-1 text-xs"
                          >
                            <option value="LEFT">Left</option>
                            <option value="RIGHT">Right</option>
                            <option value="BILATERAL">Bilateral</option>
                            <option value="MIDLINE">Midline</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-neutral-600 mb-1">Specific Location Notes</label>
                        <input
                          type="text"
                          value={resp?.bodyLocationValue?.locationNotes || ''}
                          disabled={isReadOnly}
                          placeholder="e.g. Medial aspect, joint effusion present"
                          onChange={(e) => {
                            const nextLoc: BodyLocationValue = {
                              regionId: resp?.bodyLocationValue?.regionId || 'KNEE_JOINT',
                              side: resp?.bodyLocationValue?.side || 'BILATERAL',
                              locationNotes: e.target.value,
                            };
                            handleValueChange(item, nextLoc, {
                              bodyLocationValue: nextLoc,
                            });
                          }}
                          className="w-full border border-neutral-300 rounded-sm px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* 10. INSTRUCTION CALLOUT */}
                  {item.itemType === 'INSTRUCTION' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-900 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">{item.questionText}</div>
                        {item.helpText && <div className="mt-0.5 text-neutral-700">{item.helpText}</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Runner Footer Controls */}
      <div className="bg-white p-4 rounded-sm border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-neutral-500">
          {isReadOnly ? (
            <span>Assessment is locked in <strong>{session?.status}</strong> state.</span>
          ) : (
            <span>
              {completion.isComplete
                ? 'All required items answered. Ready to submit.'
                : `${completion.unansweredRequiredItemIds.length} required item(s) remaining.`}
            </span>
          )}
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !completion.isComplete}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm shadow-xs transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Assessment'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
