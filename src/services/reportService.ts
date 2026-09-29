import {
  ReportType,
  ReportDefinition,
  GeneratedReport,
  ReportFilters,
  ReportSummaryMetricItem,
} from '../types';
import { IReportRepository, ParticipantQueryContext } from '../repositories/interfaces';
import { environmentService } from './environmentService';
import { teamService } from './teamService';
import {
  exportReportToCsv,
  exportReportToJson,
  exportReportToExcel,
  ReportPrintContextInfo,
  REPORT_DEFINITIONS,
} from '../utils/reportCalculations';

export class ReportService {
  private _customRepo?: IReportRepository;

  constructor(repo?: IReportRepository) {
    this._customRepo = repo;
  }

  private get repo(): IReportRepository {
    return this._customRepo || environmentService.getReportRepository();
  }

  /**
   * Retrieves all available report catalog definitions
   */
  async getReportDefinitions(): Promise<ReportDefinition[]> {
    return this.repo.getReportDefinitions();
  }

  /**
   * Retrieves definition for a specific report type
   */
  async getReportDefinitionByType(
    reportType: ReportType
  ): Promise<ReportDefinition | null> {
    const all = await this.repo.getReportDefinitions();
    return all.find((d) => d.reportType === reportType) || null;
  }

  /**
   * Generates a deterministic report snapshot for the given study/site context and filters
   */
  async generateReport(
    context: ParticipantQueryContext,
    reportType: ReportType,
    filters?: ReportFilters
  ): Promise<GeneratedReport> {
    if (!context.studyId || !context.siteId) {
      throw new Error('Study and site context are mandatory for report generation.');
    }

    const isValidType = REPORT_DEFINITIONS.some((d) => d.reportType === reportType);
    if (!isValidType) {
      throw new Error(`Invalid report type: "${reportType}".`);
    }

    return this.repo.generateReport(context, reportType, filters);
  }

  /**
   * Retrieves summary metric strip for a report
   */
  async getReportSummary(
    context: ParticipantQueryContext,
    reportType: ReportType
  ): Promise<ReportSummaryMetricItem[]> {
    if (!context.studyId || !context.siteId) {
      return [];
    }
    return this.repo.getReportSummary(context, reportType);
  }

  /**
   * Verifies if a user possesses the required report permission in the active study/site scope
   */
  async checkReportPermission(
    userId: string,
    context: ParticipantQueryContext,
    requiredPermission: 'REPORTS_VIEW' | 'REPORTS_EXPORT'
  ): Promise<boolean> {
    if (!userId || !context.studyId || !context.siteId) {
      return false;
    }

    try {
      const perms = await teamService.getEffectivePermissions(context, userId);
      return perms.some((p) => p.id === requiredPermission);
    } catch {
      return false;
    }
  }

  /**
   * Client-side export trigger for EXCEL, PDF, CSV, or JSON
   */
  async exportReport(
    report: GeneratedReport,
    format: 'EXCEL' | 'PDF' | 'CSV' | 'JSON',
    contextInfo?: ReportPrintContextInfo
  ): Promise<void> {
    if (!report) {
      throw new Error('No report provided for export.');
    }

    if (format === 'EXCEL') {
      exportReportToExcel(report, contextInfo);
    } else if (format === 'PDF') {
      window.print();
    } else if (format === 'CSV') {
      exportReportToCsv(report);
    } else if (format === 'JSON') {
      exportReportToJson(report);
    } else {
      throw new Error(`Unsupported export format: "${format}".`);
    }
  }
}

export const reportService = new ReportService();
