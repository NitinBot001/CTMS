import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import {
  DocumentCategory,
  DocumentType,
  TeamMemberSummary,
} from '../../types';
import { documentService } from '../../services/documentService';
import { FileUploadZone, SelectedFileMetadata } from './FileUploadZone';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studyId: string;
  siteId: string;
  teamMembers: TeamMemberSummary[];
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  studyId,
  siteId,
  teamMembers,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('PROTOCOL');
  const [documentType, setDocumentType] = useState<DocumentType>('Protocol');
  const [isRequired, setIsRequired] = useState(true);
  const [ownerUserId, setOwnerUserId] = useState(teamMembers[0]?.user.id || '');
  const [effectiveDate, setEffectiveDate] = useState('2026-09-29');
  const [expiryDate, setExpiryDate] = useState('2027-09-29');
  const [hasInitialVersion, setHasInitialVersion] = useState(true);
  const [versionNumber, setVersionNumber] = useState('1.0');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [fileSize, setFileSize] = useState('1.5 MB');
  const [fileBlobUrl, setFileBlobUrl] = useState<string | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<SelectedFileMetadata | null>(null);
  const [changeSummary, setChangeSummary] = useState('Initial protocol document submission.');
  const [relatedEntityType, setRelatedEntityType] = useState<
    'NONE' | 'COMPLIANCE' | 'SAFETY' | 'VISIT' | 'PARTICIPANT' | 'TASK'
  >('NONE');
  const [relatedEntityId, setRelatedEntityId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileSelect = (meta: SelectedFileMetadata) => {
    setSelectedFile(meta);
    setFileName(meta.fileName);
    setFileType(meta.fileType);
    setFileSize(meta.fileSize);
    setFileBlobUrl(meta.fileBlobUrl);

    if (!title.trim()) {
      const cleanTitle = meta.fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .replace(/\bv\d+(\.\d+)?\b/gi, '')
        .trim();
      if (cleanTitle) {
        setTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
      }
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setFileName('');
    setFileBlobUrl(undefined);
  };

  if (!isOpen) return null;

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

    if (hasInitialVersion && !fileName.trim()) {
      setErrorMessage('Please provide a file name for the initial version.');
      return;
    }

    setIsSubmitting(true);
    try {
      await documentService.createDocument(
        { studyId, siteId },
        {
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          documentType,
          isRequired,
          ownerUserId,
          effectiveDate: effectiveDate || undefined,
          expiryDate: expiryDate || undefined,
          initialVersionNumber: hasInitialVersion ? versionNumber.trim() : undefined,
          fileName: hasInitialVersion ? fileName.trim() : undefined,
          fileType: hasInitialVersion ? fileType : undefined,
          fileSize: hasInitialVersion ? fileSize : undefined,
          fileBlobUrl: hasInitialVersion ? fileBlobUrl : undefined,
          changeSummary: hasInitialVersion ? changeSummary.trim() : undefined,
          relatedEntityType: relatedEntityType !== 'NONE' ? relatedEntityType : undefined,
          relatedEntityId:
            relatedEntityType !== 'NONE' && relatedEntityId.trim()
              ? relatedEntityId.trim()
              : undefined,
        }
      );

      setSuccessMessage('Document registered successfully.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to create document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div className="bg-surface border border-border rounded-sm shadow-card w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-soft/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-headline" className="text-base font-bold text-ink font-heading leading-tight">
                Register New Document
              </h3>
              <p className="text-xs text-ink-muted">
                Add a controlled clinical trial record to site {siteId}
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

            <div className="pt-4">
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
                Unresolved expiry will trigger an operational Action Required flag.
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
                Expiry Date (Optional)
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
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the operational purpose and site authority of this document..."
              className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink placeholder:text-ink-muted/60"
            />
          </div>

          {/* Initial Version Details */}
          <div className="p-3 bg-surface-soft/40 border border-border/80 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-ink flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Initial Version File Metadata
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-ink-muted">
                <input
                  type="checkbox"
                  checked={hasInitialVersion}
                  onChange={(e) => setHasInitialVersion(e.target.checked)}
                  className="rounded-sm border-border text-primary focus:ring-primary"
                />
                <span>Attach Initial Version</span>
              </label>
            </div>

            {hasInitialVersion && (
              <div className="space-y-3">
                <FileUploadZone
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-ink mb-1">
                    Version Number
                  </label>
                  <input
                    type="text"
                    value={versionNumber}
                    onChange={(e) => setVersionNumber(e.target.value)}
                    placeholder="1.0"
                    className="w-full text-xs p-1.5 bg-surface border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-ink mb-1">
                    File Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="AYU_Doc_v1.0.pdf"
                    className="w-full text-xs p-1.5 bg-surface border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-ink mb-1">
                    File Type
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full text-xs p-1.5 bg-surface border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOCX">DOCX</option>
                    <option value="XLSX">XLSX</option>
                    <option value="ZIP">ZIP</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-medium text-ink mb-1">
                    Initial Change / Upload Summary
                  </label>
                  <input
                    type="text"
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    placeholder="Initial protocol document submission."
                    className="w-full text-xs p-1.5 bg-surface border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
                  />
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Related Clinical Entity Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-ink-muted mb-1">
                Related Entity Link (Optional)
              </label>
              <select
                value={relatedEntityType}
                onChange={(e) => setRelatedEntityType(e.target.value as any)}
                className="w-full text-xs p-1.5 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              >
                <option value="NONE">None</option>
                <option value="COMPLIANCE">Compliance Deviation</option>
                <option value="SAFETY">Safety Event</option>
                <option value="TASK">Task</option>
                <option value="PARTICIPANT">Participant</option>
                <option value="VISIT">Visit</option>
              </select>
            </div>

            {relatedEntityType !== 'NONE' && (
              <div>
                <label className="block text-[11px] font-medium text-ink mb-1">
                  Entity ID
                </label>
                <input
                  type="text"
                  value={relatedEntityId}
                  onChange={(e) => setRelatedEntityId(e.target.value)}
                  placeholder="e.g. DEV-003, SAE-003"
                  className="w-full text-xs p-1.5 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
                />
              </div>
            )}
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
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registering...' : 'Register Document'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
