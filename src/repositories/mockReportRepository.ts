import {
  ReportType,
  ReportDefinition,
  ReportSummaryMetricItem,
  GeneratedReport,
  ReportFilters,
  ReportRow,
} from '../types';
import { IReportRepository, ParticipantQueryContext } from './interfaces';
import {
  REPORT_DEFINITIONS,
  REPORT_COLUMNS,
  REGULATORY_REPORT_DISCLAIMER,
  filterReportRows,
} from '../utils/reportCalculations';
import { participantService } from '../services/participantService';
import { visitService } from '../services/visitService';
import { safetyService } from '../services/safetyService';
import { complianceService } from '../services/complianceService';
import { taskService } from '../services/taskService';
import { documentService } from '../services/documentService';
import { calculateDocumentExpiryState, isDocumentActionRequired } from '../utils/documentCalculations';

export class MockReportRepository implements IReportRepository {
  async getReportDefinitions(): Promise<ReportDefinition[]> {
    return REPORT_DEFINITIONS;
  }

  async generateReport(
    context: ParticipantQueryContext,
    reportType: ReportType,
    filters?: ReportFilters
  ): Promise<GeneratedReport> {
    const def = REPORT_DEFINITIONS.find((d) => d.reportType === reportType);
    if (!def) {
      throw new Error(`Unsupported report type: "${reportType}".`);
    }

    const columns = REPORT_COLUMNS[reportType] || [];
    const generatedAt = new Date().toISOString();

    // If context is incomplete or empty, return clean empty report
    if (!context.studyId || !context.siteId) {
      return {
        metadata: {
          reportType,
          title: def.title,
          studyId: context.studyId || 'N/A',
          siteId: context.siteId || 'N/A',
          generatedAt,
          disclaimer: REGULATORY_REPORT_DISCLAIMER,
        },
        filters: filters || {},
        columns,
        summaryMetrics: [],
        rows: [],
        totalRows: 0,
      };
    }

    let rawRows: ReportRow[] = [];
    let summaryMetrics: ReportSummaryMetricItem[] = [];

    switch (reportType) {
      case 'OPERATIONAL': {
        const [
          partSummary,
          visitSummary,
          safetySummary,
          compSummary,
          tskSummary,
          docSummary,
        ] = await Promise.all([
          participantService.getParticipantSummary(context),
          visitService.getVisitSummary(context),
          safetyService.getSafetySummary(context),
          complianceService.getComplianceSummary(context),
          taskService.getTaskSummary(context),
          documentService.getDocumentSummary(context),
        ]);

        const visitAdherence =
          visitSummary.total > 0
            ? `${Math.round((visitSummary.completed / visitSummary.total) * 100)}%`
            : '100%';

        const taskCompletion =
          tskSummary.total > 0
            ? `${Math.round((tskSummary.completed / tskSummary.total) * 100)}%`
            : '100%';

        const docHealth =
          docSummary.total > 0
            ? `${Math.round((docSummary.active / docSummary.total) * 100)}%`
            : '100%';

        rawRows = [
          {
            domain: 'PARTICIPANTS',
            metricName: 'Subject Screening & Recruitment Retention',
            totalCount: partSummary.total,
            activeCompliant: partSummary.active,
            attentionRequired: partSummary.screening,
            complianceRate: `${partSummary.total > 0 ? Math.round((partSummary.active / partSummary.total) * 100) : 0}% Active`,
            operationalStatus: partSummary.active >= 5 ? 'OPTIMAL' : 'MONITORING',
          },
          {
            domain: 'VISITS',
            metricName: 'Protocol Visit Schedule Compliance & Checklist Sign-offs',
            totalCount: visitSummary.total,
            activeCompliant: visitSummary.completed,
            attentionRequired: visitSummary.overdue + visitSummary.due,
            complianceRate: visitAdherence,
            operationalStatus: visitSummary.overdue === 0 ? 'ON_TRACK' : 'ACTION_REQUIRED',
          },
          {
            domain: 'SAFETY',
            metricName: 'Adverse Event Pharmacovigilance & Causality Assessment',
            totalCount: safetySummary.total,
            activeCompliant: safetySummary.total - safetySummary.piReviewRequired,
            attentionRequired: safetySummary.piReviewRequired,
            complianceRate: `${safetySummary.total > 0 ? Math.round(((safetySummary.total - safetySummary.piReviewRequired) / safetySummary.total) * 100) : 100}% Reviewed`,
            operationalStatus: safetySummary.piReviewRequired === 0 ? 'CLEAR' : 'ATTENTION_NEEDED',
          },
          {
            domain: 'COMPLIANCE',
            metricName: 'Protocol Deviations Log & Corrective Action (CAPA) Resolution',
            totalCount: compSummary.total,
            activeCompliant: compSummary.resolvedOrClosed,
            attentionRequired: compSummary.piReviewRequired + compSummary.capaOverdue,
            complianceRate: `${compSummary.total > 0 ? Math.round((compSummary.resolvedOrClosed / compSummary.total) * 100) : 100}% Closed`,
            operationalStatus: compSummary.critical === 0 ? 'CONTROLLED' : 'CRITICAL_ACTION',
          },
          {
            domain: 'TASKS',
            metricName: 'Site Clinical Delegations & PI Approvals Oversight',
            totalCount: tskSummary.total,
            activeCompliant: tskSummary.completed,
            attentionRequired: tskSummary.pendingReview + tskSummary.overdue,
            complianceRate: taskCompletion,
            operationalStatus: tskSummary.overdue === 0 ? 'CURRENT' : 'BACKLOG',
          },
          {
            domain: 'DOCUMENTS',
            metricName: 'Regulatory Binder Register & Document Expiration Governance',
            totalCount: docSummary.total,
            activeCompliant: docSummary.active,
            attentionRequired: docSummary.actionRequired,
            complianceRate: docHealth,
            operationalStatus: docSummary.actionRequired === 0 ? 'COMPLIANT' : 'RENEWAL_MANDATORY',
          },
        ];

        summaryMetrics = [
          { label: 'Total Tracked Subjects', value: partSummary.total, sublabel: `${partSummary.active} Active`, variant: 'default' },
          { label: 'Visit Compliance Rate', value: visitAdherence, sublabel: `${visitSummary.completed} Completed`, variant: 'success' },
          { label: 'Pending Safety Reviews', value: safetySummary.piReviewRequired, sublabel: `${safetySummary.sae} SAEs`, variant: safetySummary.piReviewRequired > 0 ? 'danger' : 'default' },
          { label: 'Open Protocol Deviations', value: compSummary.open, sublabel: `${compSummary.critical} Critical`, variant: compSummary.open > 0 ? 'warning' : 'default' },
          { label: 'Tasks Pending Review', value: tskSummary.pendingReview, sublabel: `${tskSummary.overdue} Overdue`, variant: tskSummary.pendingReview > 0 ? 'primary' : 'default' },
          { label: 'Action Required Docs', value: docSummary.actionRequired, sublabel: `${docSummary.expiringSoon} Expiring Soon`, variant: docSummary.actionRequired > 0 ? 'danger' : 'success' },
        ];
        break;
      }

      case 'PARTICIPANT': {
        const participants = await participantService.getParticipants(context);
        rawRows = participants.map((p) => ({
          participantId: p.id,
          screeningNumber: p.screeningCode,
          initials: p.initials,
          status: p.status,
          ageSex: `${p.age} / ${p.sex}`,
          enrolledDate: p.enrollmentDate || p.screeningDate || '—',
          cohortArm: p.phase || 'Intervention Arm A',
          visitsProgress: p.status === 'COMPLETED' ? 'Complete (All Visits)' : 'In Progress',
          safetyFlags: (p.safetyEvents?.length ?? 0) > 0 ? `${p.safetyEvents?.length} Event(s)` : 'None',
          coordinator: p.assignedCoordinatorName || 'Study Team',
        }));
        break;
      }

      case 'VISIT': {
        const visits = await visitService.getVisits(context);
        rawRows = visits.map((v) => ({
          visitId: v.id,
          participantId: v.participantId,
          visitName: v.visitName,
          status: v.status,
          targetDate: v.targetDate,
          windowRange: `${v.windowStart} to ${v.windowEnd}`,
          actualDate: v.completedDate || (v.status === 'COMPLETED' ? v.targetDate : '—'),
          checklistStatus: `${v.completedActivities} / ${v.totalActivities} Completed`,
          piSignoff: v.status === 'COMPLETED' ? 'Signed' : 'Pending',
        }));
        break;
      }

      case 'SAFETY': {
        const events = await safetyService.getSafetyEvents(context);
        rawRows = events.map((s) => ({
          eventId: s.id,
          participantId: s.participantId,
          term: s.title,
          severity: s.severity,
          isSerious: s.eventType === 'SAE' || s.seriousness !== 'NONE' ? 'Yes (SAE)' : 'No (AE)',
          causality: s.causality,
          onsetDate: s.onsetDate,
          resolutionDate: s.ongoing ? 'Ongoing' : (s.resolutionDate || 'Resolved'),
          piReviewStatus: s.piReviewStatus,
          followUpStatus: s.followUpStatus,
        }));
        break;
      }

      case 'COMPLIANCE': {
        const deviations = await complianceService.getDeviations(context);
        rawRows = deviations.map((d) => ({
          deviationId: d.id,
          scope: d.scope,
          participantId: d.participantId || 'Site-Level',
          classification: d.classification,
          category: d.category,
          status: d.status,
          identifiedDate: d.detectionDate || d.occurrenceDate,
          piReviewStatus: d.reviewStatus,
          capaStatus: d.capaStatus,
        }));
        break;
      }

      case 'TASK': {
        const tasks = await taskService.getTasks(context);
        rawRows = tasks.map((t) => {
          const latestApproval =
            t.approvals && t.approvals.length > 0
              ? t.approvals[t.approvals.length - 1].decision
              : t.requiresApproval
              ? 'Pending Review'
              : 'N/A';

          return {
            taskId: t.id,
            title: t.title,
            category: t.category,
            priority: t.priority,
            status: t.status,
            dueDate: t.dueDate,
            assignee: t.assignee?.displayName || 'Unassigned',
            requiresApproval: t.requiresApproval ? 'Yes' : 'No',
            approvalStatus: latestApproval,
            relatedEntity:
              t.relatedEntityType && t.relatedEntityId
                ? `${t.relatedEntityType}: ${t.relatedEntityId}`
                : 'None',
          };
        });
        break;
      }

      case 'DOCUMENT': {
        const docs = await documentService.getDocuments(context);
        rawRows = docs.map((doc) => {
          const expState = calculateDocumentExpiryState(doc);
          const actionReq = isDocumentActionRequired(doc);
          return {
            documentId: doc.id,
            title: doc.title,
            category: doc.category,
            documentType: doc.documentType,
            version: `v${doc.currentVersionNumber}`,
            status: doc.status,
            effectiveDate: doc.effectiveDate || 'Immediate',
            expiryDate: doc.expiryDate || 'No Expiry',
            expiryHorizon: expState,
            obligation: doc.isRequired ? 'Mandatory' : 'Optional',
            owner: doc.ownerName || doc.ownerUserId,
            actionRequired: actionReq ? 'Action Required' : 'Compliant',
          };
        });
        break;
      }
    }

    // Apply strict composite AND filtering
    const filteredRows = filterReportRows(rawRows, filters, reportType);

    // Compute deterministic summary metrics for domain reports if not OPERATIONAL
    if (reportType !== 'OPERATIONAL') {
      summaryMetrics = this.computeDomainSummaryMetrics(reportType, filteredRows);
    }

    return {
      metadata: {
        reportType,
        title: def.title,
        studyId: context.studyId,
        siteId: context.siteId,
        generatedAt,
        disclaimer: REGULATORY_REPORT_DISCLAIMER,
      },
      filters: filters || {},
      columns,
      summaryMetrics,
      rows: filteredRows,
      totalRows: filteredRows.length,
    };
  }

  async getReportSummary(
    context: ParticipantQueryContext,
    reportType: ReportType
  ): Promise<ReportSummaryMetricItem[]> {
    const report = await this.generateReport(context, reportType);
    return report.summaryMetrics;
  }

  private computeDomainSummaryMetrics(
    reportType: ReportType,
    rows: ReportRow[]
  ): ReportSummaryMetricItem[] {
    switch (reportType) {
      case 'PARTICIPANT': {
        const total = rows.length;
        const active = rows.filter((r) => r.status === 'ACTIVE' || r.status === 'ENROLLED').length;
        const screening = rows.filter((r) => r.status === 'SCREENING').length;
        const completed = rows.filter((r) => r.status === 'COMPLETED').length;
        const withdrawn = rows.filter(
          (r) => r.status === 'WITHDRAWN' || r.status === 'DISCONTINUED'
        ).length;

        return [
          { label: 'Total Subjects', value: total, sublabel: 'In Scope', variant: 'default' },
          { label: 'Active', value: active, sublabel: 'On Protocol', variant: 'success' },
          { label: 'Screening', value: screening, sublabel: 'Pending Eligibility', variant: 'primary' },
          { label: 'Completed', value: completed, sublabel: 'Study Finished', variant: 'default' },
          { label: 'Withdrawn', value: withdrawn, sublabel: 'Discontinued', variant: withdrawn > 0 ? 'warning' : 'default' },
        ];
      }

      case 'VISIT': {
        const total = rows.length;
        const due = rows.filter((r) => r.status === 'DUE').length;
        const overdue = rows.filter((r) => r.status === 'OVERDUE').length;
        const completed = rows.filter((r) => r.status === 'COMPLETED').length;
        const missed = rows.filter((r) => r.status === 'MISSED').length;

        return [
          { label: 'Total Visits', value: total, sublabel: 'Filtered Volume', variant: 'default' },
          { label: 'Completed', value: completed, sublabel: 'Attended', variant: 'success' },
          { label: 'Due in Window', value: due, sublabel: 'Upcoming / Current', variant: 'primary' },
          { label: 'Overdue', value: overdue, sublabel: 'Window Exceeded', variant: overdue > 0 ? 'danger' : 'default' },
          { label: 'Missed', value: missed, sublabel: 'Protocol Deviation', variant: missed > 0 ? 'warning' : 'default' },
        ];
      }

      case 'SAFETY': {
        const total = rows.length;
        const saeCount = rows.filter((r) => String(r.isSerious).includes('Yes')).length;
        const ongoing = rows.filter((r) => r.resolutionDate === 'Ongoing').length;
        const reviewReq = rows.filter((r) => r.piReviewStatus === 'PENDING').length;
        const folReq = rows.filter((r) => r.followUpStatus !== 'NONE' && r.followUpStatus !== 'RESOLVED').length;

        return [
          { label: 'Total Adverse Events', value: total, sublabel: 'Reported', variant: 'default' },
          { label: 'Serious (SAE)', value: saeCount, sublabel: 'Regulatory Seriousness', variant: saeCount > 0 ? 'danger' : 'default' },
          { label: 'Ongoing Events', value: ongoing, sublabel: 'Active Follow-up', variant: ongoing > 0 ? 'warning' : 'default' },
          { label: 'PI Review Required', value: reviewReq, sublabel: 'Pending Sign-Off', variant: reviewReq > 0 ? 'danger' : 'success' },
          { label: 'Follow-Up Pending', value: folReq, sublabel: 'Unresolved Actions', variant: 'primary' },
        ];
      }

      case 'COMPLIANCE': {
        const total = rows.length;
        const open = rows.filter((r) => r.status !== 'CLOSED' && r.status !== 'RESOLVED').length;
        const critical = rows.filter((r) => r.classification === 'CRITICAL').length;
        const piReview = rows.filter((r) => r.piReviewStatus === 'PENDING').length;
        const capaPending = rows.filter(
          (r) => r.capaStatus === 'PENDING' || r.capaStatus === 'IN_PROGRESS'
        ).length;
        const capaOverdue = rows.filter((r) => r.capaStatus === 'OVERDUE').length;

        return [
          { label: 'Total Deviations', value: total, sublabel: 'Protocol Non-Compliance', variant: 'default' },
          { label: 'Open Deviations', value: open, sublabel: 'Unresolved', variant: open > 0 ? 'warning' : 'default' },
          { label: 'Critical Non-Compliance', value: critical, sublabel: 'Immediate GCP Risk', variant: critical > 0 ? 'danger' : 'default' },
          { label: 'PI Review Required', value: piReview, sublabel: 'Pending Assessment', variant: piReview > 0 ? 'primary' : 'default' },
          { label: 'CAPA Pending / Active', value: capaPending, sublabel: 'Action Plans', variant: 'default' },
          { label: 'CAPA Overdue', value: capaOverdue, sublabel: 'Milestone Missed', variant: capaOverdue > 0 ? 'danger' : 'default' },
        ];
      }

      case 'TASK': {
        const total = rows.length;
        const open = rows.filter((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').length;
        const dueToday = rows.filter((r) => r.dueDate === '2026-09-29').length;
        const overdue = rows.filter(
          (r) => r.status !== 'COMPLETED' && String(r.dueDate || '') < '2026-09-29'
        ).length;
        const pendingReview = rows.filter(
          (r) => r.status === 'UNDER_REVIEW' || r.status === 'SUBMITTED'
        ).length;
        const completed = rows.filter((r) => r.status === 'COMPLETED').length;

        return [
          { label: 'Total Site Tasks', value: total, sublabel: 'Operational Items', variant: 'default' },
          { label: 'Open Tasks', value: open, sublabel: 'Active & Assigned', variant: 'primary' },
          { label: 'Due Today', value: dueToday, sublabel: '2026-09-29 Target', variant: 'warning' },
          { label: 'Overdue Tasks', value: overdue, sublabel: 'Schedule Past', variant: overdue > 0 ? 'danger' : 'default' },
          { label: 'Pending Review', value: pendingReview, sublabel: 'PI Determination Needed', variant: pendingReview > 0 ? 'danger' : 'default' },
          { label: 'Completed', value: completed, sublabel: 'Verified & Done', variant: 'success' },
        ];
      }

      case 'DOCUMENT': {
        const total = rows.length;
        const active = rows.filter((r) => r.status === 'ACTIVE').length;
        const expiringSoon = rows.filter((r) => r.expiryHorizon === 'EXPIRING_SOON').length;
        const expired = rows.filter((r) => r.expiryHorizon === 'EXPIRED').length;
        const mandatory = rows.filter((r) => r.obligation === 'Mandatory').length;
        const actionReq = rows.filter((r) => r.actionRequired === 'Action Required').length;

        return [
          { label: 'Total Trial Documents', value: total, sublabel: 'Site Register', variant: 'default' },
          { label: 'Active & Valid', value: active, sublabel: 'In Force', variant: 'success' },
          { label: 'Expiring Soon (≤30d)', value: expiringSoon, sublabel: 'Renewal Window', variant: expiringSoon > 0 ? 'warning' : 'default' },
          { label: 'Expired Documents', value: expired, sublabel: 'Validity Lapsed', variant: expired > 0 ? 'danger' : 'default' },
          { label: 'Mandatory Obligations', value: mandatory, sublabel: 'GCP Required', variant: 'default' },
          { label: 'Action Required', value: actionReq, sublabel: 'Urgent Binder Action', variant: actionReq > 0 ? 'danger' : 'success' },
        ];
      }

      default:
        return [];
    }
  }
}

export const mockReportRepository = new MockReportRepository();
