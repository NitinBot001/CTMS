import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { reportService } from '../services/reportService';
import { ReportDefinition, ReportType } from '../types';
import { ReportTypeBadge } from '../components/reports/ReportTypeBadge';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/SkeletonLoader';
import {
  FileText,
  Activity,
  Users,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { REGULATORY_REPORT_DISCLAIMER } from '../utils/reportCalculations';

export const ReportsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeStudyId, activeSiteId, isLoading: isStudyLoading } = useStudy();

  const [definitions, setDefinitions] = useState<ReportDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDefinitions = async () => {
      setIsLoading(true);
      try {
        const defs = await reportService.getReportDefinitions();
        setDefinitions(defs);
      } catch (err) {
        console.error('Failed to load report definitions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDefinitions();
  }, []);

  const getReportIcon = (reportType: ReportType) => {
    switch (reportType) {
      case 'OPERATIONAL':
        return <Activity className="w-5 h-5 text-purple-700" />;
      case 'PARTICIPANT':
        return <Users className="w-5 h-5 text-blue-700" />;
      case 'VISIT':
        return <Calendar className="w-5 h-5 text-teal-700" />;
      case 'SAFETY':
        return <AlertTriangle className="w-5 h-5 text-rose-700" />;
      case 'COMPLIANCE':
        return <ShieldAlert className="w-5 h-5 text-amber-700" />;
      case 'TASK':
        return <CheckSquare className="w-5 h-5 text-indigo-700" />;
      case 'DOCUMENT':
        return <FileText className="w-5 h-5 text-emerald-700" />;
      default:
        return <FileText className="w-5 h-5 text-primary" />;
    }
  };

  if (isStudyLoading || isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Context Header */}
      <div className="bg-surface border border-border rounded-sm shadow-subtle p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold bg-surface-soft border border-border px-2 py-0.5 rounded-sm text-ink">
                {activeStudyId || 'STUDY-001'}
              </span>
              <span className="font-mono text-xs font-bold bg-surface-soft border border-border px-2 py-0.5 rounded-sm text-primary">
                {activeSiteId || 'SITE-001'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink font-heading leading-tight">
              Reports & Operational Exports
            </h1>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed max-w-3xl">
              Access standardized clinical trial datasets, operational audit summaries, and regulatory review packages. All reports are strictly scoped to the active study site and exportable to CSV and JSON formats.
            </p>
          </div>
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

      {/* Reports Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {definitions.map((def) => {
          const isOperationalSummary = def.reportType === 'OPERATIONAL';

          return (
            <Card
              key={def.reportType}
              className={`p-5 flex flex-col justify-between hover:shadow-card transition-all border ${
                isOperationalSummary
                  ? 'border-purple-300 ring-1 ring-purple-400/20 bg-purple-50/10'
                  : 'border-border bg-surface'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 bg-surface-soft rounded-sm border border-border/80">
                    {getReportIcon(def.reportType)}
                  </div>
                  <ReportTypeBadge type={def.reportType} size="sm" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-ink font-heading leading-snug">
                    {def.title}
                  </h3>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                    {def.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <div className="text-[11px] text-ink-muted">
                  <span className="font-semibold text-ink">Scope: </span>
                  <span>{def.availableScope}</span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/pi/reports/${def.reportType}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 border border-primary/30 rounded-sm transition-colors"
                >
                  <span>View Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Feature capabilities footer */}
      <div className="bg-surface-soft/40 border border-border rounded-sm p-4 text-xs text-ink-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Strict scope isolation enforced: Reports only contain records for the selected site context.</span>
        </div>
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-primary shrink-0" />
          <span>Local browser CSV & JSON downloads comply with 21 CFR Part 11 anonymized exports.</span>
        </div>
      </div>
    </div>
  );
};
