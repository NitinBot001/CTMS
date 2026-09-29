import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Printer, Lock, X, CheckCircle2 } from 'lucide-react';
import { GeneratedReport } from '../../types';
import { reportService } from '../../services/reportService';
import { ReportPrintContextInfo } from '../../utils/reportCalculations';
import { ReportPrintDocument } from './ReportPrintDocument';

interface ExportButtonsProps {
  report: GeneratedReport | null;
  contextInfo?: ReportPrintContextInfo;
  hasExportPermission?: boolean;
  disabled?: boolean;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  report,
  contextInfo,
  hasExportPermission = true,
  disabled = false,
}) => {
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  const handleExportExcel = async () => {
    if (!report || disabled || !hasExportPermission) return;

    try {
      setIsExportingExcel(true);
      await reportService.exportReport(report, 'EXCEL', contextInfo);
    } catch (err) {
      alert((err as Error).message || 'Excel export failed.');
    } finally {
      setTimeout(() => setIsExportingExcel(false), 600);
    }
  };

  const handleOpenPdfPreview = () => {
    if (!report || disabled) return;
    setShowPdfModal(true);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const isActionDisabled = disabled || !report || report.totalRows === 0;

  return (
    <>
      <div className="inline-flex items-center gap-2 flex-wrap">
        {/* Export Excel Button (Replaces CSV) */}
        <button
          type="button"
          disabled={isActionDisabled || !hasExportPermission || isExportingExcel}
          onClick={handleExportExcel}
          title={
            !hasExportPermission
              ? 'Requires REPORTS_EXPORT permission'
              : isActionDisabled
              ? 'No rows to export'
              : 'Download structured Excel spreadsheet with header metadata and signature footer'
          }
          className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!hasExportPermission ? (
            <Lock className="w-3.5 h-3.5 text-white/80" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5" />
          )}
          <span>{isExportingExcel ? 'Generating Excel...' : 'Export Excel'}</span>
        </button>

        {/* Export PDF Button (Replaces JSON) */}
        <button
          type="button"
          disabled={isActionDisabled}
          onClick={handleOpenPdfPreview}
          title={
            isActionDisabled
              ? 'No rows to export'
              : 'Preview and generate official clinical trial report PDF with authorized signature block'
          }
          className="px-3 py-1.5 text-xs font-semibold text-ink bg-surface-soft hover:bg-surface-soft/80 border border-border rounded-sm transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span>Export PDF</span>
        </button>

        {/* Quick Print Button */}
        <button
          type="button"
          disabled={isActionDisabled}
          onClick={handleTriggerPrint}
          title="Direct print formatted clinical dossier"
          className="px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink bg-surface border border-border rounded-sm hover:bg-surface-soft transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Print</span>
        </button>
      </div>

      {/* PDF / Formal Report Preview Modal */}
      {showPdfModal && report && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 no-print">
          <div className="bg-surface rounded-sm border border-border shadow-modal w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-surface-soft border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    Clinical Trial Dossier — Print & PDF Export Preview
                  </h3>
                  <p className="text-[11px] text-ink-muted">
                    Excel-formatted grid with complete source metadata and authorized signatory footer.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfModal(false)}
                  className="p-1.5 text-ink-muted hover:text-ink rounded-sm hover:bg-border/40 transition-colors"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Instruction strip */}
            <div className="bg-amber-50/70 border-b border-amber-200/80 px-5 py-2 text-xs text-amber-900 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                Tip: When the print dialog opens, set <b>Destination</b> to <b>&ldquo;Save as PDF&rdquo;</b> and select <b>Landscape</b> layout for optimal formatting.
              </span>
            </div>

            {/* Modal Scrollable Content: Pristine Document Preview */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex-1">
              <div className="bg-white shadow-md mx-auto max-w-4xl border border-slate-300">
                <ReportPrintDocument report={report} contextInfo={contextInfo} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
