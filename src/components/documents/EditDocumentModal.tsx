import React, { useState, useEffect } from 'react';
import { X, Edit3, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import {
  Document,
  DocumentCategory,
  DocumentType,
  TeamMemberSummary,
} from '../../types';
import { documentService } from '../../services/documentService';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedDoc: Document) => void;
  document: Document | null;
  studyId: string;
  siteId: string;
  teamMembers: TeamMemberSummary[];
}

export const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  document: doc,
  studyId,
  siteId,
  teamMembers,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('PROTOCOL');
  const [documentType, setDocumentType] = useState<DocumentType>('Protocol');
  const [isRequired, setIsRequired] = useState(true);
  const [ownerUserId, setOwnerUserId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [relatedEntityType, setRelatedEntityType] = useState<
    'NONE' | 'COMPLIANCE' | 'SAFETY' | 'VISIT' | 'PARTICIPANT' | 'TASK'
  >('NONE');
  const [relatedEntityId, setRelatedEntityId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (doc) {
      setTitle(doc.title);
      setDescription(doc.description || '');
      setCategory(doc.category);
      setDocumentType(doc.documentType);
      setIsRequired(doc.isRequired);
      setOwnerUserId(doc.ownerUserId);
      setEffectiveDate(doc.effectiveDate || '');
      setExpiryDate(doc.expiryDate || '');
      setRelatedEntityType(
        (doc.relatedEntityType as
          | 'NONE'
          | 'COMPLIANCE'
          | 'SAFETY'
          | 'VISIT'
          | 'PARTICIPANT'
          | 'TASK') || 'NONE'
      );
      setRelatedEntityId(doc.relatedEntityId || '');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [doc, isOpen]);

  if (!isOpen || !doc) return null;

  const categories: { value: DocumentCategory; label: string }[] = [
    { value: 'PROTOCOL', label: 'Protocol' },
    { value: 'REGULATORY', label: 'Regulatory' },
    { value: 'ETHICS', label: 'Ethics' },
    { value: 'INFORMED_CONSENT', label: 'Informed Consent' },
    { value: 'SITE', label: 'Site' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'PHARMACY', label: 'Pharmacy' },
    { value: 'LABORATORY', label: 'Laboratory' },
    { value: 'STUDY_REPORT', label: 'Study Report' },
    { value: 'OTHER', label: 'Other' },
  ];

  const documentTypes: DocumentType[] = [
    'Protocol',
    'Protocol Amendment',
    'Investigator Document',
    'Ethics Approval',
    'Site Approval',
    'Consent Form',
    'Training Certificate',
    'Safety Report',
    'Pharmacy Record',
    'Laboratory Certification',
    'Monitoring Report',
    'Study Report',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setErrorMessage('Document title is required.');
      return;
    }

    if (!ownerUserId) {
      setErrorMessage('Please assign a document owner from the site team.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await documentService.updateDocument(
        { studyId, siteId },
        doc.id,
        {
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          documentType,
          isRequired,
          ownerUserId,
          effectiveDate: effectiveDate || undefined,
          expiryDate: expiryDate || undefined,
          relatedEntityType:
            relatedEntityType !== 'NONE'
              ? (relatedEntityType as 'PARTICIPANT' | 'VISIT' | 'COMPLIANCE' | 'SAFETY' | 'TASK')
              : undefined,
          relatedEntityId:
            relatedEntityType !== 'NONE' && relatedEntityId.trim()
              ? relatedEntityId.trim()
              : undefined,
        }
      );

      setSuccessMessage('Document metadata updated successfully.');
      setTimeout(() => {
        onSuccess(updated);
        onClose();
      }, 700);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to update document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-document-modal-title"
    >
      <div className="bg-surface border border-border rounded-sm shadow-card w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-soft/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-sm">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="edit-document-modal-title" className="text-base font-bold text-ink font-heading leading-tight">
                Edit Document Metadata
              </h3>
              <p className="text-xs text-ink-muted">
                {doc.id} — Manage regulatory classification, dates, and site ownership
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink rounded-sm hover:bg-surface-soft transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-sm flex items-start gap-2 text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-sm flex items-start gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Document Title <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Ethics Committee Re-Approval Certificate"
              className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink placeholder:text-ink-muted/60"
            />
          </div>

          {/* Category & Document Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Category <span className="text-rose-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Document Type <span className="text-rose-600">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              >
                {documentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Owner & Requirement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Responsible Owner / Staff <span className="text-rose-600">*</span>
              </label>
              <select
                value={ownerUserId}
                onChange={(e) => setOwnerUserId(e.target.value)}
                className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              >
                {teamMembers.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.displayName} ({m.user.designation})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="rounded-sm border-border text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs font-semibold text-ink">
                  Mandatory GCP / Protocol Requirement
                </span>
              </label>
              <p className="text-[11px] text-ink-muted ml-6">
                Unresolved expiry triggers an operational Action Required alert.
              </p>
            </div>
          </div>

          {/* Dates: Effective & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Effective Date
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Expiry Date (Renewal)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Description & Clinical Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the operational purpose and site authority of this document..."
              className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink placeholder:text-ink-muted/60"
            />
          </div>

          {/* Related Clinical Entity Linkage */}
          <div className="p-3 bg-surface-soft/40 border border-border/80 rounded-sm space-y-3">
            <span className="font-semibold text-xs text-ink block">
              Related Clinical Entity Linkage (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Entity Category
                </label>
                <select
                  value={relatedEntityType}
                  onChange={(e) =>
                    setRelatedEntityType(
                      e.target.value as
                        | 'NONE'
                        | 'COMPLIANCE'
                        | 'SAFETY'
                        | 'VISIT'
                        | 'PARTICIPANT'
                        | 'TASK'
                    )
                  }
                  className="w-full text-xs p-2 bg-surface border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
                >
                  <option value="NONE">None / General Site Document</option>
                  <option value="COMPLIANCE">Protocol Deviation (Compliance)</option>
                  <option value="SAFETY">Safety Event (SAE / AE)</option>
                  <option value="VISIT">Study Visit Record</option>
                  <option value="PARTICIPANT">Subject / Patient File</option>
                  <option value="TASK">Operational Site Task</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-ink-muted mb-1">
                  Target Entity ID
                </label>
                <input
                  type="text"
                  disabled={relatedEntityType === 'NONE'}
                  value={relatedEntityId}
                  onChange={(e) => setRelatedEntityId(e.target.value)}
                  placeholder={
                    relatedEntityType === 'COMPLIANCE'
                      ? 'e.g. DEV-002'
                      : relatedEntityType === 'SAFETY'
                      ? 'e.g. SAE-001'
                      : relatedEntityType === 'VISIT'
                      ? 'e.g. VIS-101'
                      : relatedEntityType === 'PARTICIPANT'
                      ? 'e.g. PT-1001'
                      : relatedEntityType === 'TASK'
                      ? 'e.g. TSK-101'
                      : 'Select entity category first'
                  }
                  className="w-full text-xs p-2 bg-surface border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink disabled:opacity-50 disabled:bg-stone-100"
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink bg-surface-soft border border-border rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
