import React, { useState } from 'react';
import { VisitAttachment } from '../../types';
import {
  FileText,
  UploadCloud,
  Trash2,
  Eye,
  FileCheck,
  Download,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface SourceDocumentViewerProps {
  attachments: VisitAttachment[];
  canUpload?: boolean;
  canRemove?: boolean;
  onUpload?: (attachment: {
    fileName: string;
    mimeType: string;
    size: number;
    storageReference: string;
    uploadedByUserId: string;
    uploadedByName: string;
    documentType?: string;
    description?: string;
    notes?: string;
  }) => Promise<void>;
  onRemove?: (attachmentId: string) => Promise<void>;
  currentUserName?: string;
  currentUserId?: string;
}

export const SourceDocumentViewer: React.FC<SourceDocumentViewerProps> = ({
  attachments,
  canUpload = false,
  canRemove = false,
  onUpload,
  onRemove,
  currentUserName = 'Current Staff',
  currentUserId = 'USR-CURRENT',
}) => {
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(
    attachments.length > 0 ? attachments[0].id : null
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docType, setDocType] = useState('Source CRF Worksheet');
  const [fileName, setFileName] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedAttachment =
    attachments.find((a) => a.id === selectedAttachmentId) || attachments[0] || null;

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) {
      setErrorMsg('Please specify document file name.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      if (onUpload) {
        await onUpload({
          fileName: fileName.trim(),
          mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          size: Math.floor(Math.random() * 800000) + 150000, // ~150KB - 950KB
          storageReference: `/mock-source-docs/${fileName.trim()}`,
          uploadedByUserId: currentUserId,
          uploadedByName: currentUserName,
          documentType: docType,
          description: docNotes.trim(),
          notes: docNotes.trim(),
        });
      }
      setFileName('');
      setDocNotes('');
      setShowUploadModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (attachmentId: string) => {
    if (!window.confirm('Are you sure you want to remove this source document attachment?')) {
      return;
    }
    if (onRemove) {
      await onRemove(attachmentId);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-sm bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Source Document & CRF Scans</h3>
            <p className="text-xs text-stone-500">
              Primary source artifacts used by Sub-Investigator for clinical verification.
            </p>
          </div>
        </div>

        {canUpload && (
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#7A2A12] hover:bg-[#5A1E0D] rounded-sm transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Source Doc</span>
          </button>
        )}
      </div>

      {attachments.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-stone-200 rounded-sm bg-stone-50/60 p-4">
          <FileText className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <p className="text-xs font-medium text-stone-700">No source documents attached yet</p>
          <p className="text-[11px] text-stone-500 mt-1 max-w-sm mx-auto">
            Clinical visit records require at least one verified source document (CRF scan, vitals chart, lab report) for Sub-Investigator verification.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Document selection sidebar */}
          <div className="space-y-2 lg:border-r lg:border-stone-200 lg:pr-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block mb-1">
              Attached Files ({attachments.length})
            </span>
            {attachments.map((att) => {
              const isSelected = selectedAttachment?.id === att.id;
              return (
                <div
                  key={att.id}
                  onClick={() => setSelectedAttachmentId(att.id)}
                  className={`p-3 rounded-sm border cursor-pointer transition-all text-xs flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#7A2A12]/5 border-[#7A2A12]/30 text-stone-900 shadow-xs'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center space-x-2 truncate">
                      <FileCheck
                        className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#7A2A12]' : 'text-stone-400'}`}
                      />
                      <span className="font-medium truncate">{att.fileName}</span>
                    </div>
                    {canRemove && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(att.id);
                        }}
                        className="text-stone-400 hover:text-rose-600 p-0.5 rounded-xs"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
                    <span className="inline-block px-1.5 py-0.5 rounded-xs bg-stone-100 font-mono text-[10px]">
                      {att.documentType || 'CRF Scan'}
                    </span>
                    <span>{(att.size / 1024).toFixed(0)} KB</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Document Preview Pane */}
          <div className="lg:col-span-2 bg-stone-50/70 border border-stone-200 rounded-sm p-4 flex flex-col justify-between min-h-[280px]">
            {selectedAttachment ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-stone-200 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#7A2A12]" />
                      {selectedAttachment.fileName}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Type: <strong className="text-stone-700">{selectedAttachment.documentType || 'Clinical Source Record'}</strong> · Uploaded by{' '}
                      <span className="text-stone-700">{selectedAttachment.uploadedByName}</span> on{' '}
                      <span className="font-mono text-stone-600">
                        {new Date(selectedAttachment.uploadedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <a
                      href={selectedAttachment.storageReference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-stone-700 bg-white border border-stone-200 rounded-sm hover:bg-stone-50"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>

                {/* Simulated Medical Document Scan Viewer */}
                <div className="bg-white border border-stone-200 rounded-sm p-4 font-mono text-xs text-stone-800 shadow-inner space-y-3">
                  <div className="flex justify-between border-b border-dashed border-stone-200 pb-2 text-[11px] text-stone-600">
                    <span>AIIA CLINICAL RESEARCH FACILITY</span>
                    <span className="font-bold text-[#7A2A12]">OFFICIAL CRF SOURCE RECORD</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-stone-50/80 p-2.5 rounded-sm">
                    <div>Document Ref: {selectedAttachment.storageReference}</div>
                    <div>MIME Type: {selectedAttachment.mimeType}</div>
                    <div>File Size: {(selectedAttachment.size / 1024).toFixed(1)} KB</div>
                    <div>Verification State: Available for Inspection</div>
                  </div>

                  {selectedAttachment.description && (
                    <div className="text-[11px] text-stone-600 italic border-l-2 border-[#B8862E] pl-2 py-0.5">
                      "{selectedAttachment.description}"
                    </div>
                  )}

                  <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-sm text-[11px] text-amber-900 flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>
                      High-resolution medical scan verified. Sub-Investigators must audit field numbers against this document before confirming sign-off.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="m-auto text-xs text-stone-500">Select an attachment to view preview</div>
            )}
          </div>
        </div>
      )}

      {/* Upload Source Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-stone-300 rounded-sm shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#7A2A12]" />
                Attach Clinical Source Document
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full border border-stone-300 rounded-sm p-2 bg-white text-stone-800"
                >
                  <option value="Source CRF Worksheet">Source CRF Worksheet</option>
                  <option value="Vitals & Nursing Flowsheet">Vitals & Nursing Flowsheet</option>
                  <option value="Laboratory Report Slip">Laboratory Report Slip</option>
                  <option value="Physician Progress Note">Physician Progress Note</option>
                  <option value="Other Clinical Observation">Other Clinical Observation</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">File Name</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. PT-101_Visit01_Vitals_CRF.pdf"
                  className="w-full border border-stone-300 rounded-sm p-2 text-stone-800 focus:outline-none focus:border-[#7A2A12]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Notes / Description (Optional)</label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="e.g. Vitals measured by Nurse Anjali on Day 1"
                  className="w-full border border-stone-300 rounded-sm p-2 text-stone-800 focus:outline-none focus:border-[#7A2A12]"
                />
              </div>

              {errorMsg && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-sm flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-sm hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-[#7A2A12] text-white font-semibold rounded-sm hover:bg-[#5A1E0D] disabled:opacity-50"
                >
                  {isProcessing ? 'Attaching...' : 'Upload & Attach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
