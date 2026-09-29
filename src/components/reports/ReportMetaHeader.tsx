import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, ShieldAlert } from 'lucide-react';
import { ReportType, ReportMetadata } from '../../types';
import { ReportTypeBadge } from './ReportTypeBadge';
import { REGULATORY_REPORT_DISCLAIMER } from '../../utils/reportCalculations';

interface ReportMetaHeaderProps {
  metadata: ReportMetadata;
  children?: React.ReactNode;
}

export const ReportMetaHeader: React.FC<ReportMetaHeaderProps> = ({
  metadata,
  children,
}) => {
  return (
    <div className="space-y-4">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <Link
          to="/pi/reports"
          className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Reports Directory</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-ink">{metadata.title}</span>
      </div>

      {/* Main Header Card */}
      <div className="bg-surface border border-border rounded-sm shadow-subtle p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <ReportTypeBadge type={metadata.reportType as ReportType} size="md" />
              <span className="font-mono text-xs font-bold bg-surface-soft border border-border px-2 py-0.5 rounded-sm text-ink">
                {metadata.studyId}
              </span>
              <span className="font-mono text-xs font-bold bg-surface-soft border border-border px-2 py-0.5 rounded-sm text-primary">
                {metadata.siteId}
              </span>
              <span className="text-[11px] text-ink-muted flex items-center gap-1">
                <Calendar className="w-3 h-3 text-ink-muted" />
                <span>Generated: {new Date(metadata.generatedAt).toLocaleString()}</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-ink font-heading leading-tight">
              {metadata.title}
            </h1>
          </div>

          {/* Action and Export Controls */}
          {children && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {children}
            </div>
          )}
        </div>

        {/* Regulatory Governance Disclaimer Banner */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-sm flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Notice of Operational Scope: </span>
            <span className="text-amber-800">{REGULATORY_REPORT_DISCLAIMER}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
