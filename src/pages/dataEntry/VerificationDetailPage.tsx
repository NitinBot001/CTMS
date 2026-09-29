import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { visitDataService } from '../../services/visitDataService';
import { VisitDataRecord, ReviewNoteType } from '../../types';
import { getStatusLabel, getStatusBadgeClasses } from '../../utils/visitDataCalculations';
import { SourceDocumentViewer } from '../../components/dataEntry/SourceDocumentViewer';
import { VitalsEntrySection } from '../../components/dataEntry/VitalsEntrySection';
import { TestsObservationsSection } from '../../components/dataEntry/TestsObservationsSection';
import { ReviewNotesPanel } from '../../components/dataEntry/ReviewNotesPanel';
import { WorkflowHistoryTimeline } from '../../components/dataEntry/WorkflowHistoryTimeline';
import { ReturnForCorrectionModal } from '../../components/dataEntry/ReturnForCorrectionModal';
import {
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  Send,
  Building,
  User,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const VerificationDetailPage: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const { currentUser, currentRole, effectivePermissions } = useAuth();
  const { activeStudyId, activeSiteId, activeSite } = useStudy();

  const [record, setRecord] = useState<VisitDataRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationComment, setVerificationComment] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRecord = useCallback(async () => {
    if (!activeStudyId || !activeSiteId || !recordId) return;
    setIsLoading(true);
    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const fetched = await visitDataService.getRecord(context, recordId);
      setRecord(fetched);
    } catch (err: any) {
      console.error('Failed to load record for verification', err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to load record' });
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, recordId]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#7A2A12] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone-500 font-medium">Loading clinical verification inspection sheet...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="bg-white border border-stone-200 rounded-sm p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-stone-900">Record Not Found</h2>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          The requested clinical visit record "{recordId}" is not available in the active site scope.
        </p>
        <Link
          to="/sub-investigator"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#7A2A12] rounded-sm hover:bg-[#5A1E0D]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sub-Investigator Dashboard</span>
        </Link>
      </div>
    );
  }

  const context = { studyId: activeStudyId, siteId: activeSiteId };
  const actor = {
    userId: currentUser?.id || 'USR-CURRENT',
    name: currentUser?.displayName || currentUser?.name || 'Sub-Investigator',
    roleId: currentRole?.id || 'ROLE_SUB_I',
    roleName: currentRole?.name || 'Sub-Investigator',
  };

  const isSelfVerification = currentUser?.id === record.enteredByUserId;
  const canVerify =
    visitDataService.canVerifyRecord(record, currentUser?.id || '', effectivePermissions) &&
    !isSelfVerification;
  const canReturn = visitDataService.canReturnRecord(record, effectivePermissions);
  const badgeClasses = getStatusBadgeClasses(record.status);

  const handleConfirmVerification = async () => {
    try {
      setIsVerifying(true);
      setActionMessage(null);
      const updated = await visitDataService.verifyRecord(
        context,
        record.id,
        verificationComment.trim() || undefined,
        actor
      );
      setRecord(updated);
      setShowVerifyModal(false);
      setVerificationComment('');
      setActionMessage({
        type: 'success',
        text: 'Record verified successfully. Clinical values confirmed against source document.',
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Verification failed.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmReturn = async (reason: string, affectedFields: string[]) => {
    try {
      setActionMessage(null);
      const updated = await visitDataService.returnForCorrection(
        context,
        record.id,
        reason,
        affectedFields,
        actor
      );
      setRecord(updated);
      setActionMessage({
        type: 'success',
        text: 'Record returned for correction. Data entry operator has been notified.',
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to return record.' });
    }
  };

  const handleMoveToPiReview = async () => {
    try {
      setActionMessage(null);
      const updated = await visitDataService.moveToPiReview(context, record.id, actor);
      setRecord(updated);
      setActionMessage({ type: 'success', text: 'Record advanced to Principal Investigator review queue.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to advance record.' });
    }
  };

  const handleAddReviewNote = async (note: { type: ReviewNoteType; message: string }) => {
    const updated = await visitDataService.addReviewNote(context, record.id, note, actor);
    setRecord(updated);
    setActionMessage({ type: 'success', text: 'Advisory review note recorded.' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/sub-investigator"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-600 hover:text-[#7A2A12] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Verification Queue</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-sm p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-stone-500 font-mono">
            <span className="font-semibold text-[#7A2A12]">{record.id}</span>
            <span>•</span>
            <span>Participant: {record.participantCode} ({record.participantInitials})</span>
            <span>•</span>
            <span>{record.visitCode}</span>
          </div>

          <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-1">
            Clinical Verification: {record.visitName}
          </h1>

          <div className="flex items-center gap-4 text-xs text-stone-600 mt-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              Visit Date: <strong className="text-stone-800">{record.visitDate}</strong>
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-stone-400" />
              Entered By: <strong className="text-stone-800">{record.enteredByName}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-stone-400" />
              Site: <strong className="text-stone-800">{activeSite?.name || record.siteId}</strong>
            </span>
          </div>
        </div>

        {/* Verification Status & Action Buttons */}
        <div className="flex flex-col items-start md:items-end gap-2.5">
          <div
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xs border text-xs font-semibold ${badgeClasses.bg} ${badgeClasses.text} ${badgeClasses.border}`}
          >
            <span className={`w-2 h-2 rounded-full ${badgeClasses.dot}`} />
            <span>{getStatusLabel(record.status)}</span>
          </div>

          <div className="flex items-center space-x-2">
            {canReturn && (
              <button
                type="button"
                onClick={() => setShowReturnModal(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-sm transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Return for Correction</span>
              </button>
            )}

            {canVerify && (
              <button
                type="button"
                onClick={() => setShowVerifyModal(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-sm shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify Record</span>
              </button>
            )}

            {record.status === 'VERIFIED' && (
              <button
                type="button"
                onClick={handleMoveToPiReview}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-sm shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Queue for PI Review</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Self-verification Warning Defense */}
      {isSelfVerification && (
        <div className="bg-amber-50 border border-amber-300 rounded-sm p-4 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold text-amber-900">
              Self-Verification Prohibited by ICH-GCP Integrity Protocols
            </strong>
            <p className="text-amber-800 mt-0.5">
              You entered this clinical record as <strong>{record.enteredByName}</strong>. To prevent conflicts of interest and preserve data integrity, clinical verification must be performed by an independent authorized Sub-Investigator.
            </p>
          </div>
        </div>
      )}

      {/* Action Toast / Feedback */}
      {actionMessage && (
        <div
          className={`p-3 rounded-sm border text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-stone-400 hover:text-stone-700 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Verification Instructions Callout */}
      <div className="bg-[#7A2A12]/5 border border-[#7A2A12]/20 rounded-sm p-4 text-xs text-stone-700 flex items-start gap-2.5">
        <FileText className="w-4 h-4 text-[#7A2A12] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-stone-900">Sub-Investigator Verification Instructions:</span>
          <p>
            Audit each entered vital sign and laboratory observation against the attached source CRF scan on the left/top.
            If values match and comply with protocol tolerances, click <strong>Verify Record</strong>. If discrepancies are found (e.g. blood pressure or lab value mismatches), click <strong>Return for Correction</strong> and identify the affected fields.
          </p>
        </div>
      </div>

      {/* Source Document Viewer */}
      <SourceDocumentViewer
        attachments={record.attachments}
        canUpload={false}
        canRemove={false}
      />

      {/* Side-by-side or stacked inspection panels */}
      <div className="space-y-6">
        <VitalsEntrySection fields={record.fields} readOnly={true} />
        <TestsObservationsSection fields={record.fields} readOnly={true} />
      </div>

      {/* Multi-role Review Notes Panel */}
      <ReviewNotesPanel
        recordId={record.id}
        notes={record.reviewNotes}
        userPermissions={effectivePermissions}
        onAddNote={handleAddReviewNote}
      />

      {/* Workflow Audit Trail */}
      <WorkflowHistoryTimeline history={record.history} />

      {/* Verify Confirmation Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-white border border-stone-300 rounded-sm shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-stone-200 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h3 className="text-sm font-bold text-stone-900">Confirm Clinical Verification</h3>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              By confirming verification, you certify that you have audited all entered clinical values for{' '}
              <strong>{record.participantCode}</strong> against the attached source documents and found them accurate.
            </p>

            <div>
              <label htmlFor="verify-comment" className="block text-xs font-semibold text-stone-700 mb-1">
                Verification Sign-off Comment (Optional)
              </label>
              <textarea
                id="verify-comment"
                rows={2}
                value={verificationComment}
                onChange={(e) => setVerificationComment(e.target.value)}
                placeholder="e.g. Verified against CRF Page 1 and CBC slip. Values match source."
                className="w-full text-xs border border-stone-300 rounded-sm p-2 text-stone-800 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                disabled={isVerifying}
                className="px-3 py-1.5 text-xs border border-stone-200 text-stone-600 rounded-sm hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVerification}
                disabled={isVerifying}
                className="px-3.5 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-sm shadow-xs disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Confirm Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return for Correction Modal */}
      <ReturnForCorrectionModal
        isOpen={showReturnModal}
        fields={record.fields}
        onClose={() => setShowReturnModal(false)}
        onConfirm={handleConfirmReturn}
      />
    </div>
  );
};
