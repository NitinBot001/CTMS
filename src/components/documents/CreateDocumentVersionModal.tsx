import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle, CheckCircle2, History } from 'lucide-react';
import { Document } from '../../types';
import { documentService } from '../../services/documentService';
import { FileUploadZone, SelectedFileMetadata } from './FileUploadZone';

interface CreateDocumentVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  document: Document | null;
  studyId: string;
  siteId: string;
  currentUserName?: string;
}

export const CreateDocumentVersionModal: React.FC<CreateDocumentVersionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  document: doc,
  studyId,
  siteId,
  currentUserName = 'Dr. Ananya Sharma (PI)',
}) => {
  // Suggest next version number (e.g., if current is "1.0", suggest "2.0")
  const currentNum = doc?.currentVersionNumber || '1.0';
  const parsedMajor = parseInt(currentNum.split('.')[0] || '1', 10);
  const suggestedNext = !isNaN(parsedMajor) ? `${parsedMajor + 1}.0` : '2.0';

  const [versionNumber, setVersionNumber] = useState(suggestedNext);
  const [versionLabel, setVersionLabel] = useState('');
  const [fileName, setFileName] = useState(
    doc ? `${doc.id}_v${suggestedNext}.pdf` : ''
  );
  const [fileType, setFileType] = useState('PDF');
  const [fileSize, setFileSize] = useState('2.4 MB');
  const [fileBlobUrl, setFileBlobUrl] = useState<string | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<SelectedFileMetadata | null>(null);
  const [effectiveDate, setEffectiveDate] = useState('2026-09-29');
  const [expiryDate, setExpiryDate] = useState(doc?.expiryDate || '2027-09-29');
  const [changeSummary, setChangeSummary] = useState('');
  const [uploadedBy, setUploadedBy] = useState(currentUserName);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileSelect = (meta: SelectedFileMetadata) => {
    setSelectedFile(meta);
    setFileName(meta.fileName);
    setFileType(meta.fileType);
    setFileSize(meta.fileSize);
    setFileBlobUrl(meta.fileBlobUrl);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setFileName(doc ? `${doc.id}_v${versionNumber}.pdf` : '');
    setFileBlobUrl(undefined);
  };

  if (!isOpen || !doc) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!versionNumber.trim()) {
      setErrorMessage('Version number is required.');
      return;
    }

    if (!fileName.trim()) {
      setErrorMessage('File name is required.');
      return;
    }

    if (doc.versions.some((v) => v.versionNumber === versionNumber.trim())) {
      setErrorMessage(
        `Version "${versionNumber.trim()}" already exists for this document.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await documentService.createDocumentVersion(
        { studyId, siteId },
        doc.id,
        {
          versionNumber: versionNumber.trim(),
          versionLabel: versionLabel.trim() || undefined,
          fileName: fileName.trim(),
          fileType,
          fileSize: fileSize.trim() || '1.5 MB',
          fileBlobUrl: fileBlobUrl || undefined,
          effectiveDate: effectiveDate || undefined,
          expiryDate: expiryDate || undefined,
          changeSummary:
            changeSummary.trim() || 'Updated version uploaded to document register.',
          uploadedBy: uploadedBy.trim() || currentUserName,
        }
      );

      setSuccessMessage('New version uploaded and previous version superseded.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      setErrorMessage((err as Error).message || 'Failed to create document version.');
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
      <div className="bg-surface border border-border rounded-sm shadow-card w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-soft/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-sm">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-headline" className="text-base font-bold text-ink font-heading leading-tight">
                Add New Version
              </h3>
              <p className="text-xs text-ink-muted">
                {doc.id} — {doc.title}
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

        {/* Current Version Notice */}
        <div className="px-5 py-2.5 bg-stone-50 border-b border-border text-[11px] text-ink-muted flex items-center justify-between">
          <span>
            Current Version: <strong className="text-ink font-mono font-bold">v{doc.currentVersionNumber}</strong>
          </span>
          <span className="italic">Previous active version will be superseded</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
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

          {/* Interactive Drag & Drop File Upload */}
          <FileUploadZone
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
          />

          {/* Version number & Label */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                New Version Number <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={versionNumber}
                onChange={(e) => setVersionNumber(e.target.value)}
                placeholder="e.g. 2.0 or 2.1"
                className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Version Label (Optional)
              </label>
              <input
                type="text"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="e.g. Amendment 2.0"
                className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              />
            </div>
          </div>

          {/* File Name & Type */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-ink mb-1">
                File Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Protocol_Amendment_v2.0.pdf"
                className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                File Type
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              >
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
                <option value="XLSX">XLSX</option>
                <option value="ZIP">ZIP</option>
              </select>
            </div>
          </div>

          {/* Effective & Expiry Dates */}
          <div className="grid grid-cols-2 gap-3">
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

          {/* Uploaded By & Simulated File Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Uploaded By
              </label>
              <input
                type="text"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                placeholder="Staff name"
                className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Simulated File Size
              </label>
              <input
                type="text"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                placeholder="2.4 MB"
                className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink"
              />
            </div>
          </div>

          {/* Change Summary */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Change Summary / Revision Rationale
            </label>
            <textarea
              rows={3}
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="Describe amendments, clinical rationale, or ethics approval notes..."
              className="w-full text-xs p-2 bg-surface-soft/30 border border-border rounded-sm focus:outline-none focus:ring-1 focus:ring-primary text-ink placeholder:text-ink-muted/60"
            />
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
              <span>{isSubmitting ? 'Saving...' : 'Add Version'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
