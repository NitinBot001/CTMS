import React from 'react';
import { DocumentVersion } from '../../types';
import {
  FileText,
  Calendar,
  User,
  Clock,
  CheckCircle,
  History,
  Download,
  Eye,
} from 'lucide-react';

interface DocumentVersionHistoryProps {
  versions: DocumentVersion[];
  currentVersionId?: string;
  onPreviewVersion?: (version: DocumentVersion) => void;
}

export const DocumentVersionHistory: React.FC<DocumentVersionHistoryProps> = ({
  versions,
  currentVersionId,
  onPreviewVersion,
}) => {
  // Sort versions newest first
  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  const handleDownload = (ver: DocumentVersion) => {
    let url = ver.fileBlobUrl;
    let cleanup = false;

    if (!url) {
      const simulatedContent = `================================================================================
AIIA CLINICAL TRIAL MANAGEMENT SYSTEM (CTMS)
DOCUMENT REPOSITORY — VERIFIED RECORD EXPORT
================================================================================
Document ID     : ${ver.documentId}
Version Number  : v${ver.versionNumber}
Version Label   : ${ver.versionLabel || 'N/A'}
File Name       : ${ver.fileName}
File Type       : ${ver.fileType}
File Size       : ${ver.fileSize || 'N/A'}
Status          : ${ver.status}
Uploaded By     : ${ver.uploadedBy}
Uploaded At     : ${ver.uploadedAt}
Effective Date  : ${ver.effectiveDate || 'Immediate'}
Expiry Date     : ${ver.expiryDate || 'No Expiration Set'}

================================================================================
CHANGE SUMMARY / AUDIT NOTE:
================================================================================
${ver.changeSummary || 'Initial document registration into site regulatory binder.'}

================================================================================
VERIFICATION NOTICE:
This file record was exported from the AIIA CTMS Document Management register.
In production environments, binary files are secured and audited per 21 CFR Part 11.
================================================================================
`;
      const blob = new Blob([simulatedContent], { type: 'text/plain;charset=utf-8' });
      url = URL.createObjectURL(blob);
      cleanup = true;
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = ver.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (cleanup) {
      setTimeout(() => URL.revokeObjectURL(url!), 1000);
    }
  };

  const handlePreview = (ver: DocumentVersion) => {
    if (onPreviewVersion) {
      onPreviewVersion(ver);
      return;
    }
    if (ver.fileBlobUrl) {
      window.open(ver.fileBlobUrl, '_blank');
      return;
    }
    const simulatedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${ver.fileName} — CTMS Document Preview</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; background: #faf9f6; color: #1a1a1a; margin: 0; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 28px; max-width: 720px; margin: 20px auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            h1 { color: #7A2A12; margin-top: 0; font-family: Georgia, serif; font-size: 22px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
            .field { border-top: 1px solid #f1f5f9; padding-top: 8px; }
            .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
            .value { font-size: 13px; color: #0f172a; margin-top: 2px; font-weight: 500; }
            .summary { margin-top: 20px; padding: 14px; background: #f8fafc; border-left: 4px solid #7A2A12; border-radius: 2px; font-size: 13px; color: #334155; line-height: 1.5; }
            .footer { margin-top: 24px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Version v${ver.versionNumber} • ${ver.status}</span>
            <h1>${ver.fileName}</h1>
            <div class="grid">
              <div class="field"><div class="label">Document ID</div><div class="value">${ver.documentId}</div></div>
              <div class="field"><div class="label">File Format & Size</div><div class="value">${ver.fileType} (${ver.fileSize || 'N/A'})</div></div>
              <div class="field"><div class="label">Uploaded By</div><div class="value">${ver.uploadedBy}</div></div>
              <div class="field"><div class="label">Upload Timestamp</div><div class="value">${new Date(ver.uploadedAt).toLocaleString()}</div></div>
              <div class="field"><div class="label">Effective Date</div><div class="value">${ver.effectiveDate || 'Immediate'}</div></div>
              <div class="field"><div class="label">Expiry Date</div><div class="value">${ver.expiryDate || 'No Expiration Set'}</div></div>
            </div>
            <div class="summary">
              <strong>Revision Note / Clinical Scope:</strong><br />
              ${ver.changeSummary || 'Initial document registration into site regulatory binder.'}
            </div>
            <div class="footer">
              AIIA Clinical Trial Management System — Verified Document Record
            </div>
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([simulatedHtml], { type: 'text/html;charset=utf-8' });
    const previewUrl = URL.createObjectURL(blob);
    window.open(previewUrl, '_blank');
  };

  return (
    <div className="space-y-3">
      {sortedVersions.map((ver) => {
        const isCurrent = ver.id === currentVersionId || ver.status === 'ACTIVE';

        return (
          <div
            key={ver.id}
            className={`border rounded-sm p-4 transition-all ${
              isCurrent
                ? 'bg-emerald-50/20 border-emerald-300 ring-1 ring-emerald-400/30'
                : 'bg-surface border-border text-ink'
            }`}
          >
            {/* Version Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold text-ink bg-surface-soft border border-border px-2 py-0.5 rounded-sm">
                  v{ver.versionNumber}
                </span>

                {isCurrent ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-sm">
                    <CheckCircle className="w-3 h-3 text-emerald-700" />
                    <span>Current Active Version</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200 px-2 py-0.5 rounded-sm">
                    <History className="w-3 h-3 text-stone-400" />
                    <span>{ver.status}</span>
                  </span>
                )}

                {ver.versionLabel && (
                  <span className="text-xs font-semibold text-ink">
                    {ver.versionLabel}
                  </span>
                )}
              </div>

              {/* Download & Preview controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePreview(ver)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-ink-muted hover:text-ink bg-surface-soft border border-border rounded-sm hover:bg-surface-soft/80 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(ver)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-ink-muted hover:text-ink bg-surface-soft border border-border rounded-sm hover:bg-surface-soft/80 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File ({ver.fileType})</span>
                </button>
              </div>
            </div>

            {/* Version File Details & Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                  File Name & Size
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 text-ink font-medium">
                  <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{ver.fileName}</span>
                  {ver.fileSize && (
                    <span className="text-[10px] text-ink-muted shrink-0">
                      ({ver.fileSize})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                  Uploaded By & Date
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 text-ink font-medium">
                  <User className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                  <span className="truncate">{ver.uploadedBy}</span>
                  <span className="text-[10px] text-ink-muted shrink-0">
                    • {new Date(ver.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                  Effective Date
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 text-ink font-medium">
                  <Calendar className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                  <span>{ver.effectiveDate || 'Immediate'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                  Expiry Date
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 text-ink font-medium">
                  <Clock className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                  <span>{ver.expiryDate || 'No Expiry'}</span>
                </div>
              </div>
            </div>

            {/* Change Summary */}
            {ver.changeSummary && (
              <div className="pt-2 border-t border-border/40 text-xs">
                <span className="text-[10px] uppercase font-semibold text-ink-muted block mb-0.5">
                  Version Change Summary
                </span>
                <p className="text-ink-muted italic leading-relaxed">
                  "{ver.changeSummary}"
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
