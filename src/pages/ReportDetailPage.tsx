import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { reportService } from '../services/reportService';
import { studyService } from '../services/studyService';
import { ReportType, GeneratedReport, ReportFilters } from '../types';
import { REPORT_DEFINITIONS, ReportPrintContextInfo } from '../utils/reportCalculations';
import { ReportMetaHeader } from '../components/reports/ReportMetaHeader';
import { ReportSummaryCards } from '../components/reports/ReportSummaryCards';
import { ReportFiltersBar } from '../components/reports/ReportFiltersBar';
import { ReportTable } from '../components/reports/ReportTable';
import { ExportButtons } from '../components/reports/ExportButtons';
import { ReportPrintDocument } from '../components/reports/ReportPrintDocument';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/SkeletonLoader';

export const ReportDetailPage: React.FC = () => {
  const { reportType: paramType } = useParams<{ reportType: string }>();
  const navigate = useNavigate();
  const { activeStudyId, activeSiteId, isLoading: isStudyLoading } = useStudy();

  const reportType = (paramType || '').toUpperCase() as ReportType;
  const isValidType = REPORT_DEFINITIONS.some((d) => d.reportType === reportType);

  const [filters, setFilters] = useState<ReportFilters>({});
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [contextInfo, setContextInfo] = useState<ReportPrintContextInfo>({});
  const [hasExportPermission, setHasExportPermission] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!isValidType) {
      setError(`Invalid report type "${paramType}". Please choose a valid report from the directory.`);
      setIsLoading(false);
      return;
    }

    if (!activeStudyId || !activeSiteId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [generated, canExport, ctx] = await Promise.all([
        reportService.generateReport(context, reportType, filters),
        // By default check PI permission (USR-101 has ROLE_PI)
        reportService.checkReportPermission('USR-101', context, 'REPORTS_EXPORT'),
        studyService.getCurrentContext(activeStudyId, activeSiteId),
      ]);

      setReport(generated);
      setHasExportPermission(canExport);

      if (ctx) {
        setContextInfo({
          studyCode: ctx.studyCode,
          studyTitle: ctx.studyTitle,
          protocolVersion: ctx.protocolVersion,
          siteCode: ctx.siteCode,
          siteName: ctx.siteName,
          piName: ctx.piName,
          piRole: ctx.piRole,
        });
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to generate report.');
    } finally {
      setIsLoading(false);
    }
  }, [isValidType, paramType, activeStudyId, activeSiteId, reportType, filters]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (!isValidType) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        <ErrorState
          title="Invalid Report Type"
          message={`"${paramType}" is not a recognized operational report domain.`}
          onRetry={() => navigate('/pi/reports')}
        />
      </div>
    );
  }

  if (isStudyLoading || (isLoading && !report)) {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState
          title="Report Generation Failed"
          message={error}
          onRetry={loadReport}
        />
      </div>
    );
  }

  return (
    <>
      {/* Screen Interactive View (hidden during print) */}
      <div className="no-print p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Report Header with Metadata and Export Buttons */}
        {report && (
          <ReportMetaHeader metadata={report.metadata}>
            <ExportButtons
              report={report}
              contextInfo={contextInfo}
              hasExportPermission={hasExportPermission}
              disabled={isLoading}
            />
          </ReportMetaHeader>
        )}

        {/* Summary KPI Cards */}
        {report && (
          <ReportSummaryCards
            metrics={report.summaryMetrics}
            isLoading={isLoading}
          />
        )}

        {/* Interactive Domain Filter Bar */}
        {report && (
          <ReportFiltersBar
            reportType={reportType}
            filters={filters}
            onFilterChange={(newFilters) => setFilters(newFilters)}
            onReset={() => setFilters({})}
            totalResults={report.totalRows}
          />
        )}

        {/* Operational Dense Report Table */}
        {report && (
          <ReportTable
            columns={report.columns}
            rows={report.rows}
            reportType={reportType}
            isLoading={isLoading}
            onResetFilters={() => setFilters({})}
          />
        )}
      </div>

      {/* Standalone Printable Document (strictly visible during window.print) */}
      {report && (
        <div className="hidden print:block">
          <ReportPrintDocument report={report} contextInfo={contextInfo} />
        </div>
      )}
    </>
  );
};
