import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { visitDataService } from '../../services/visitDataService';
import { VisitDataRecord, VisitDataField, ReviewNoteType, VisitAttachment } from '../../types';
import { getStatusLabel, getStatusBadgeClasses } from '../../utils/visitDataCalculations';
import { SourceDocumentViewer } from '../../components/dataEntry/SourceDocumentViewer';
import { VitalsEntrySection } from '../../components/dataEntry/VitalsEntrySection';
import { TestsObservationsSection } from '../../components/dataEntry/TestsObservationsSection';
import { ReviewNotesPanel } from '../../components/dataEntry/ReviewNotesPanel';
import { WorkflowHistoryTimeline } from '../../components/dataEntry/WorkflowHistoryTimeline';
import {
  ArrowLeft,
  Save,
  Send,
  RotateCcw,
  AlertTriangle,
  Lock,
  Calendar,
  User,
  Building,
} from 'lucide-react';

export const DataEntryRecordPage: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const { currentUser, currentRole, effectivePermissions } = useAuth();
  const { activeStudyId, activeSiteId, activeSite } = useStudy();

  const [record, setRecord] = useState<VisitDataRecord | null>(null);
  const [fields, setFields] = useState<VisitDataField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const loadRecord = useCallback(async () => {
    if (!activeStudyId || !activeSiteId || !recordId) return;
    setIsLoading(true);
    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const fetched = await visitDataService.getRecord(context, recordId);
      if (fetched) {
        setRecord(fetched);
        setFields(fetched.fields);
        setHasUnsavedChanges(false);
      } else {
        setRecord(null);
      }
    } catch (err: any) {
      console.error('Failed to load visit data record', err);
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
        <p className="text-xs text-stone-500 font-medium">Loading clinical visit record...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="bg-white border border-stone-200 rounded-sm p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-stone-900">Record Not Found</h2>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          The requested clinical visit record "{recordId}" does not exist in the active study and site scope.
        </p>
        <Link
          to="/data-entry"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#7A2A12] rounded-sm hover:bg-[#5A1E0D]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Data Entry Queue</span>
        </Link>
      </div>
    );
  }

  const isEditable = visitDataService.canEditRecord(record, effectivePermissions);
  const canSubmit = visitDataService.canSubmitRecord(record, effectivePermissions);
  const isReturned = record.status === 'RETURNED_FOR_CORRECTION';
  const badgeClasses = getStatusBadgeClasses(record.status);

  const actor = {
    userId: currentUser?.id || 'USR-CURRENT',
    name: currentUser?.displayName || currentUser?.name || 'Staff Member',
    roleId: currentRole?.id || 'ROLE_DATA_ENTRY',
    roleName: currentRole?.name || 'Data Entry Operator',
  };

  const context = { studyId: activeStudyId, siteId: activeSiteId };

  const handleFieldChange = (fieldKey: string, value: string) => {
    setFields((prev) =>
      prev.map((f) => (f.fieldKey === fieldKey ? { ...f, value } : f))
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      setActionMessage(null);
      const updated = await visitDataService.updateRecordFields(context, record.id, fields, actor);
      setRecord(updated);
      setFields(updated.fields);
      setHasUnsavedChanges(false);
      setActionMessage({ type: 'success', text: 'Draft values saved successfully.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to save draft.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForVerification = async () => {
    if (record.attachments.length === 0) {
      setActionMessage({
        type: 'error',
        text: 'Source document missing: You must upload at least one source document or CRF scan before submitting.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setActionMessage(null);
      // Save fields first if modified
      if (hasUnsavedChanges) {
        await visitDataService.updateRecordFields(context, record.id, fields, actor);
      }

      let updated: VisitDataRecord;
      if (isReturned) {
        updated = await visitDataService.resubmitForVerification(context, record.id, actor);
      } else {
        updated = await visitDataService.submitForVerification(context, record.id, actor);
      }
      setRecord(updated);
      setFields(updated.fields);
      setHasUnsavedChanges(false);
      setActionMessage({
        type: 'success',
        text: isReturned
          ? 'Record successfully resubmitted for Sub-Investigator re-verification.'
          : 'Record successfully submitted for Sub-Investigator verification.',
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Submission failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadAttachment = async (attachment: Omit<VisitAttachment, 'id' | 'recordId' | 'uploadedAt'>) => {
    const updated = await visitDataService.uploadAttachment(context, record.id, attachment, actor);
    setRecord(updated);
    setActionMessage({ type: 'success', text: 'Source document attached successfully.' });
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    const updated = await visitDataService.removeAttachment(context, record.id, attachmentId, actor);
    setRecord(updated);
    setActionMessage({ type: 'success', text: 'Source document removed.' });
  };

  const handleAddReviewNote = async (note: { type: ReviewNoteType; message: string }) => {
    const updated = await visitDataService.addReviewNote(context, record.id, note, actor);
    setRecord(updated);
    setActionMessage({ type: 'success', text: 'Review note recorded.' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/data-entry"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-stone-600 hover:text-[#7A2A12] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Data Entry Workspace</span>
        </Link>

        {hasUnsavedChanges && (
          <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-xs">
            Unsaved Changes in Form
          </span>
        )}
      </div>

      {/* Record Header Banner */}
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
            {record.visitName}
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

        {/* Status Badge & Primary Action Bar */}
        <div className="flex flex-col items-start md:items-end gap-2.5">
          <div
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xs border text-xs font-semibold ${badgeClasses.bg} ${badgeClasses.text} ${badgeClasses.border}`}
          >
            <span className={`w-2 h-2 rounded-full ${badgeClasses.dot}`} />
            <span>{getStatusLabel(record.status)}</span>
          </div>

          {isEditable && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving || isSubmitting}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
              </button>

              {canSubmit && (
                <button
                  type="button"
                  onClick={handleSubmitForVerification}
                  disabled={isSubmitting || isSaving}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-sm transition-colors disabled:opacity-50 shadow-xs cursor-pointer ${
                    isReturned
                      ? 'bg-cyan-700 hover:bg-cyan-800'
                      : 'bg-[#7A2A12] hover:bg-[#5A1E0D]'
                  }`}
                >
                  {isReturned ? <RotateCcw className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                  <span>
                    {isSubmitting
                      ? 'Processing...'
                      : isReturned
                      ? 'Resubmit for Verification'
                      : 'Submit for Verification'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Toast / Feedback Banner */}
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

      {/* Return for Correction Warning Banner */}
      {isReturned && (
        <div className="bg-rose-50 border border-rose-300 rounded-sm p-4 text-xs space-y-2">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-rose-950 text-sm">
                Record Returned for Correction by Sub-Investigator
              </h3>
              <p className="text-rose-900 font-medium mt-1 leading-relaxed">
                Reason: "{record.returnReason}"
              </p>
              <div className="mt-2 text-[11px] text-rose-800 flex items-center gap-3">
                <span>Returned by: <strong>{record.returnedBy || 'Sub-Investigator'}</strong></span>
                <span>•</span>
                <span>
                  Date:{' '}
                  {record.returnedAt
                    ? new Date(record.returnedAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Recent'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Locked State Alert */}
      {!isEditable && (
        <div className="bg-stone-50 border border-stone-200 rounded-sm p-3.5 text-xs text-stone-700 flex items-center space-x-2.5">
          <Lock className="w-4 h-4 text-stone-500 shrink-0" />
          <span>
            This visit record is currently in <strong>{getStatusLabel(record.status)}</strong> state and is locked for editing. Field values are shown in read-only mode.
          </span>
        </div>
      )}

      {/* Source Document Section */}
      <SourceDocumentViewer
        attachments={record.attachments}
        canUpload={isEditable}
        canRemove={isEditable}
        onUpload={handleUploadAttachment}
        onRemove={handleRemoveAttachment}
        currentUserName={actor.name}
        currentUserId={actor.userId}
      />

      {/* Vitals Entry Section */}
      <VitalsEntrySection
        fields={fields}
        readOnly={!isEditable}
        onFieldChange={handleFieldChange}
      />

      {/* Laboratory & Clinical Observations Section */}
      <TestsObservationsSection
        fields={fields}
        readOnly={!isEditable}
        onFieldChange={handleFieldChange}
      />

      {/* Multi-role Review Notes */}
      <ReviewNotesPanel
        recordId={record.id}
        notes={record.reviewNotes}
        userPermissions={effectivePermissions}
        onAddNote={handleAddReviewNote}
      />

      {/* Workflow History Audit Log */}
      <WorkflowHistoryTimeline history={record.history} />
    </div>
  );
};
