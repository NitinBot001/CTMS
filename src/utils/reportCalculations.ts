import {
  ReportType,
  ReportDefinition,
  ReportColumnConfig,
  ReportRow,
  ReportRowValue,
  ReportFilters,
  GeneratedReport,
} from '../types';

export const REGULATORY_REPORT_DISCLAIMER =
  'Generated from CTMS operational records for review/export. Not a regulatory filing.';

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    reportType: 'OPERATIONAL',
    title: 'Site Operational Summary',
    domain: 'Operational',
    description:
      'High-level cross-domain operational audit snapshot covering recruitment, visits, safety, compliance, and binder readiness.',
    availableScope: 'Active Study + Site',
    defaultSortField: 'domain',
    iconName: 'Activity',
  },
  {
    reportType: 'PARTICIPANT',
    title: 'Participant Status Report',
    domain: 'Participants',
    description:
      'Subject screening, enrollment status, demographics, and study milestone tracking.',
    availableScope: 'Active Study + Site',
    defaultSortField: 'participantId',
    iconName: 'Users',
  },
  {
    reportType: 'VISIT',
    title: 'Visit Activity Report',
    domain: 'Visits',
    description:
      'Scheduled, due, overdue, completed, and missed visit activity with compliance window tracking.',
    availableScope: 'Active Study + Site',
    defaultSortField: 'targetDate',
    iconName: 'Calendar',
  },
  {
    reportType: 'SAFETY',
    title: 'Safety & AE Summary',
    domain: 'Safety',
    description:
      'Adverse events, serious adverse events (SAE), causality assessment, and PI review tracking.',
    availableScope: 'Active Study + Site',
    defaultSortField: 'onsetDate',
    iconName: 'AlertTriangle',
  },
  {
    reportType: 'COMPLIANCE',
    title: 'Protocol Deviations Report',
    domain: 'Compliance',
    description:
      'Protocol non-compliance log, deviation classifications (Minor/Major/Critical), and CAPA tracking.',
    availableScope: 'Active Study + Site',
    defaultSortField: 'identifiedDate',
    iconName: 'ShieldAlert',
  },
  {
    reportType: 'TASK',
    title: 'Task & Approval Report',
    domain: 'Tasks',
    description:
      'Site clinical operational tasks, delegation tracking, and PI approval oversight.',
    availableScope: 'Active Study + Site',
    defaultSortField: 'dueDate',
    iconName: 'CheckSquare',
  },
  {
    reportType: 'DOCUMENT',
    title: 'Document Expiry Report',
    domain: 'Documents',
    description:
      'Regulatory binder register, document version tracking, active vs expired, and renewal action items.',
    availableScope: 'Active Study + Site',
    defaultSortField: 'expiryDate',
    iconName: 'FileText',
  },
];

export const REPORT_COLUMNS: Record<ReportType, ReportColumnConfig[]> = {
  OPERATIONAL: [
    { key: 'domain', label: 'Functional Domain', align: 'left', format: 'badge' },
    { key: 'metricName', label: 'Operational Activity', align: 'left', format: 'text' },
    { key: 'totalCount', label: 'Total Tracked', align: 'right', format: 'number' },
    { key: 'activeCompliant', label: 'In Good Standing', align: 'right', format: 'number' },
    { key: 'attentionRequired', label: 'Action / Review Required', align: 'right', format: 'number' },
    { key: 'complianceRate', label: 'Compliance Index', align: 'center', format: 'text' },
    { key: 'operationalStatus', label: 'Operational Health', align: 'center', format: 'badge' },
  ],
  PARTICIPANT: [
    { key: 'participantId', label: 'Subject ID', align: 'left', format: 'text' },
    { key: 'screeningNumber', label: 'Screening #', align: 'left', format: 'text' },
    { key: 'initials', label: 'Initials', align: 'center', format: 'text' },
    { key: 'status', label: 'Status', align: 'center', format: 'badge' },
    { key: 'ageSex', label: 'Age / Sex', align: 'center', format: 'text' },
    { key: 'enrolledDate', label: 'Enrolled Date', align: 'center', format: 'date' },
    { key: 'cohortArm', label: 'Cohort / Arm', align: 'left', format: 'text' },
    { key: 'visitsProgress', label: 'Visits Completed', align: 'center', format: 'text' },
    { key: 'safetyFlags', label: 'Safety Events', align: 'center', format: 'badge' },
    { key: 'coordinator', label: 'Coordinator', align: 'left', format: 'text' },
  ],
  VISIT: [
    { key: 'visitId', label: 'Visit ID', align: 'left', format: 'text' },
    { key: 'participantId', label: 'Subject ID', align: 'left', format: 'text' },
    { key: 'visitName', label: 'Visit Protocol Name', align: 'left', format: 'text' },
    { key: 'status', label: 'Status', align: 'center', format: 'badge' },
    { key: 'targetDate', label: 'Target Date', align: 'center', format: 'date' },
    { key: 'windowRange', label: 'Compliance Window', align: 'center', format: 'text' },
    { key: 'actualDate', label: 'Actual Date', align: 'center', format: 'date' },
    { key: 'checklistStatus', label: 'Activities Done', align: 'center', format: 'text' },
    { key: 'piSignoff', label: 'PI Sign-Off', align: 'center', format: 'badge' },
  ],
  SAFETY: [
    { key: 'eventId', label: 'Event ID', align: 'left', format: 'text' },
    { key: 'participantId', label: 'Subject ID', align: 'left', format: 'text' },
    { key: 'term', label: 'Reported Term', align: 'left', format: 'text' },
    { key: 'severity', label: 'Severity', align: 'center', format: 'badge' },
    { key: 'isSerious', label: 'Seriousness', align: 'center', format: 'badge' },
    { key: 'causality', label: 'Investigator Causality', align: 'center', format: 'text' },
    { key: 'onsetDate', label: 'Onset Date', align: 'center', format: 'date' },
    { key: 'resolutionDate', label: 'Outcome Date', align: 'center', format: 'date' },
    { key: 'piReviewStatus', label: 'PI Review', align: 'center', format: 'badge' },
    { key: 'followUpStatus', label: 'Follow-Up Status', align: 'center', format: 'text' },
  ],
  COMPLIANCE: [
    { key: 'deviationId', label: 'Deviation ID', align: 'left', format: 'text' },
    { key: 'scope', label: 'Scope', align: 'center', format: 'text' },
    { key: 'participantId', label: 'Subject / Entity', align: 'left', format: 'text' },
    { key: 'classification', label: 'Classification', align: 'center', format: 'badge' },
    { key: 'category', label: 'Category', align: 'left', format: 'badge' },
    { key: 'status', label: 'Status', align: 'center', format: 'badge' },
    { key: 'identifiedDate', label: 'Identified Date', align: 'center', format: 'date' },
    { key: 'piReviewStatus', label: 'PI Review', align: 'center', format: 'badge' },
    { key: 'capaStatus', label: 'CAPA Status', align: 'center', format: 'badge' },
  ],
  TASK: [
    { key: 'taskId', label: 'Task ID', align: 'left', format: 'text' },
    { key: 'title', label: 'Task Description', align: 'left', format: 'text' },
    { key: 'category', label: 'Category', align: 'center', format: 'badge' },
    { key: 'priority', label: 'Priority', align: 'center', format: 'badge' },
    { key: 'status', label: 'Status', align: 'center', format: 'badge' },
    { key: 'dueDate', label: 'Due Date', align: 'center', format: 'date' },
    { key: 'assignee', label: 'Assignee', align: 'left', format: 'text' },
    { key: 'requiresApproval', label: 'PI Approval Required', align: 'center', format: 'text' },
    { key: 'approvalStatus', label: 'Review Decision', align: 'center', format: 'badge' },
    { key: 'relatedEntity', label: 'Linked Clinical Entity', align: 'left', format: 'text' },
  ],
  DOCUMENT: [
    { key: 'documentId', label: 'Document ID', align: 'left', format: 'text' },
    { key: 'title', label: 'Document Title', align: 'left', format: 'text' },
    { key: 'category', label: 'Category', align: 'center', format: 'badge' },
    { key: 'documentType', label: 'Document Type', align: 'left', format: 'text' },
    { key: 'version', label: 'Version', align: 'center', format: 'text' },
    { key: 'status', label: 'Status', align: 'center', format: 'badge' },
    { key: 'effectiveDate', label: 'Effective Date', align: 'center', format: 'date' },
    { key: 'expiryDate', label: 'Expiry Date', align: 'center', format: 'date' },
    { key: 'expiryHorizon', label: 'Expiry State', align: 'center', format: 'badge' },
    { key: 'obligation', label: 'Obligation', align: 'center', format: 'badge' },
    { key: 'owner', label: 'Responsible Staff', align: 'left', format: 'text' },
  ],
};

/**
 * Filter rows using strict AND semantics
 */
export function filterReportRows(
  rows: ReportRow[],
  filters?: ReportFilters,
  reportType?: ReportType
): ReportRow[] {
  if (!filters) return rows;

  return rows.filter((row) => {
    // 1. Text search across all fields
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const matchesSearch = Object.values(row).some((val) => {
        if (val == null) return false;
        return String(val).toLowerCase().includes(q);
      });
      if (!matchesSearch) return false;
    }

    // 2. Status filter
    if (filters.status && filters.status !== 'ALL') {
      const rowStatus = String(row.status || '').toUpperCase();
      const filterStatus = filters.status.toUpperCase();
      if (rowStatus !== filterStatus) return false;
    }

    // 3. Participant ID filter
    if (filters.participantId && filters.participantId !== 'ALL') {
      const rowPid = String(row.participantId || '').toUpperCase();
      if (rowPid !== filters.participantId.toUpperCase()) return false;
    }

    // 4. Category filter
    if (filters.category && filters.category !== 'ALL') {
      const rowCategory = String(row.category || '').toUpperCase();
      if (rowCategory !== filters.category.toUpperCase()) return false;
    }

    // 5. Priority filter (Task)
    if (filters.priority && filters.priority !== 'ALL') {
      const rowPriority = String(row.priority || '').toUpperCase();
      if (rowPriority !== filters.priority.toUpperCase()) return false;
    }

    // 6. Classification filter (Compliance)
    if (filters.classification && filters.classification !== 'ALL') {
      const rowClass = String(row.classification || '').toUpperCase();
      if (rowClass !== filters.classification.toUpperCase()) return false;
    }

    // 7. Review status filter
    if (filters.reviewStatus && filters.reviewStatus !== 'ALL') {
      const rowRev = String(row.piReviewStatus || row.approvalStatus || '').toUpperCase();
      if (rowRev !== filters.reviewStatus.toUpperCase()) return false;
    }

    // 8. Date Range filter (inspects date field based on report type)
    if (filters.dateFrom || filters.dateTo) {
      let targetDateVal: string | null = null;
      if (reportType === 'PARTICIPANT') targetDateVal = String(row.enrolledDate || '');
      else if (reportType === 'VISIT') targetDateVal = String(row.targetDate || row.actualDate || '');
      else if (reportType === 'SAFETY') targetDateVal = String(row.onsetDate || '');
      else if (reportType === 'COMPLIANCE') targetDateVal = String(row.identifiedDate || '');
      else if (reportType === 'TASK') targetDateVal = String(row.dueDate || '');
      else if (reportType === 'DOCUMENT') targetDateVal = String(row.expiryDate || row.effectiveDate || '');

      if (targetDateVal && /^\d{4}-\d{2}-\d{2}/.test(targetDateVal)) {
        const valDate = targetDateVal.slice(0, 10);
        if (filters.dateFrom && valDate < filters.dateFrom) return false;
        if (filters.dateTo && valDate > filters.dateTo) return false;
      }
    }

    return true;
  });
}

/**
 * Cleanly format individual cell value for CSV compliant output
 */
export function formatCsvCell(val: ReportRowValue): string {
  if (val === null || val === undefined) {
    return '""';
  }
  if (typeof val === 'boolean') {
    return val ? '"YES"' : '"NO"';
  }
  const str = String(val);
  // Escape internal double quotes with pair of double quotes
  const escaped = str.replace(/"/g, '""');
  // Always wrap strings in quotes for deterministic formatting
  return `"${escaped}"`;
}

/**
 * Generates properly escaped, UTF-8 BOM CSV text
 */
export function generateCsvContent(
  columns: ReportColumnConfig[],
  rows: ReportRow[]
): string {
  const headerLine = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map((row) =>
    columns.map((col) => formatCsvCell(row[col.key])).join(',')
  );

  // Prepend UTF-8 Byte Order Mark for Excel compatibility
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

export interface ReportPrintContextInfo {
  studyCode?: string;
  studyTitle?: string;
  protocolVersion?: string;
  siteCode?: string;
  siteName?: string;
  piName?: string;
  piRole?: string;
}

export function formatFilterDisplay(filters?: ReportFilters): string {
  if (!filters || Object.keys(filters).length === 0) return 'All Records (No active filters)';
  const parts: string[] = [];
  if (filters.search) parts.push(`Search: "${filters.search}"`);
  if (filters.status) parts.push(`Status: ${filters.status}`);
  if (filters.category) parts.push(`Category: ${filters.category}`);
  if (filters.classification) parts.push(`Classification: ${filters.classification}`);
  if (filters.priority) parts.push(`Priority: ${filters.priority}`);
  if (filters.reviewStatus) parts.push(`Review: ${filters.reviewStatus}`);
  if (filters.dateFrom || filters.dateTo) {
    parts.push(`Date: ${filters.dateFrom || 'Any'} to ${filters.dateTo || 'Any'}`);
  }
  return parts.length > 0 ? parts.join(' | ') : 'All Records';
}

function escapeHtml(str?: string | null): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates an Excel-compatible spreadsheet (HTML-based .xls format with XML workbook options)
 * embedding complete institutional header, source details, formatted grid table, summary metrics,
 * and authorized signatory review footer.
 */
export function generateExcelContent(
  report: GeneratedReport,
  contextInfo?: ReportPrintContextInfo
): string {
  const colSpan = Math.max(report.columns.length, 5);
  const studyCode = contextInfo?.studyCode || report.metadata.studyId;
  const studyTitle = contextInfo?.studyTitle || 'Ayurvedic Clinical Protocol Study';
  const protocolVersion = contextInfo?.protocolVersion || 'v2.1';
  const siteCode = contextInfo?.siteCode || report.metadata.siteId;
  const siteName = contextInfo?.siteName || 'All India Institute of Ayurveda Main Hospital';
  const piName = contextInfo?.piName || 'Dr. Arvind Sharma';
  const piRole = contextInfo?.piRole || 'Principal Investigator';
  const generatedDateFormatted = new Date(report.metadata.generatedAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const filterText = formatFilterDisplay(report.filters);

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>${escapeHtml(report.metadata.reportType)}</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<style>
  body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1f2937; }
  table { border-collapse: collapse; width: 100%; }
  .title-banner { background-color: #7A2A12; color: #ffffff; font-size: 15pt; font-weight: bold; text-align: center; padding: 12px; }
  .subtitle-banner { background-color: #f8f6f2; color: #1c1a17; font-size: 12pt; font-weight: bold; text-align: center; padding: 6px; }
  .meta-label { font-weight: bold; color: #374151; font-size: 10pt; }
  .meta-value { color: #111827; font-size: 10pt; }
  .disclaimer-box { background-color: #fef3c7; color: #92400e; font-size: 9pt; padding: 8px; border: 1px solid #fde68a; }
  .table-header th { background-color: #374151; color: #ffffff; font-weight: bold; font-size: 10pt; text-align: left; border: 1px solid #1f2937; padding: 6px 8px; }
  .data-cell { border: 1px solid #d1d5db; padding: 5px 8px; font-size: 10pt; vertical-align: top; }
  .data-cell-alt { background-color: #f9fafb; border: 1px solid #d1d5db; padding: 5px 8px; font-size: 10pt; vertical-align: top; }
  .summary-banner { background-color: #f3f4f6; border: 1px solid #d1d5db; font-weight: bold; font-size: 10pt; padding: 8px; }
  .signatory-box { border: 1.5px solid #374151; background-color: #ffffff; padding: 12px; }
</style>
</head>
<body>
  <table>
    <!-- 1. INSTITUTION & SYSTEM BANNER -->
    <tr>
      <td colspan="${colSpan}" class="title-banner">
        ALL INDIA INSTITUTE OF AYURVEDA (AIIA) — CLINICAL TRIAL MANAGEMENT SYSTEM
      </td>
    </tr>
    <tr>
      <td colspan="${colSpan}" class="subtitle-banner">
        ${escapeHtml(report.metadata.title)} (${escapeHtml(report.metadata.reportType)})
      </td>
    </tr>
    <tr height="8"><td></td></tr>

    <!-- 2. DATA SOURCE & METADATA ROWS -->
    <tr>
      <td colspan="${colSpan}">
        <span class="meta-label">Study / Protocol:</span>
        <span class="meta-value">${escapeHtml(studyCode)} (${escapeHtml(protocolVersion)}) — ${escapeHtml(studyTitle)}</span>
      </td>
    </tr>
    <tr>
      <td colspan="${colSpan}">
        <span class="meta-label">Investigator Site / Facility:</span>
        <span class="meta-value">${escapeHtml(siteCode)} — ${escapeHtml(siteName)}</span>
      </td>
    </tr>
    <tr>
      <td colspan="${colSpan}">
        <span class="meta-label">Data Domain / Source:</span>
        <span class="meta-value">CTMS Operational ${escapeHtml(report.metadata.reportType)} Register</span>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span class="meta-label">Total Records:</span>
        <span class="meta-value">${report.totalRows}</span>
      </td>
    </tr>
    <tr>
      <td colspan="${colSpan}">
        <span class="meta-label">Generated Date & Time:</span>
        <span class="meta-value">${escapeHtml(generatedDateFormatted)} (IST)</span>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span class="meta-label">Generated By:</span>
        <span class="meta-value">${escapeHtml(piName)} (${escapeHtml(piRole)}, ${escapeHtml(report.metadata.generatedBy)})</span>
      </td>
    </tr>
    <tr>
      <td colspan="${colSpan}">
        <span class="meta-label">Applied Filter Scope:</span>
        <span class="meta-value">${escapeHtml(filterText)}</span>
      </td>
    </tr>
    <tr>
      <td colspan="${colSpan}" class="disclaimer-box">
        <b>Notice of Operational Scope:</b> ${escapeHtml(report.metadata.disclaimer)}
      </td>
    </tr>
    <tr height="12"><td></td></tr>

    <!-- 3. DATA TABLE HEADERS -->
    <tr class="table-header">
      ${report.columns
        .map(
          (c) =>
            `<th style="background-color: #374151; color: #ffffff; font-weight: bold; border: 1px solid #1f2937; padding: 6px 8px;">${escapeHtml(
              c.label
            )}</th>`
        )
        .join('')}
    </tr>

    <!-- 4. DATA ROWS -->
    ${
      report.rows.length === 0
        ? `<tr><td colspan="${colSpan}" style="text-align: center; color: #6b7280; padding: 12px; border: 1px solid #d1d5db; font-style: italic;">No clinical trial records match the selected scope and criteria.</td></tr>`
        : report.rows
            .map((row, rIdx) => {
              const bgClass = rIdx % 2 === 0 ? 'data-cell' : 'data-cell-alt';
              return `<tr>${report.columns
                .map((c) => {
                  const val = row[c.key];
                  let display = '—';
                  if (val !== null && val !== undefined) {
                    if (typeof val === 'boolean') {
                      display = val ? 'YES' : 'NO';
                    } else {
                      display = String(val);
                    }
                  }
                  return `<td class="${bgClass}">${escapeHtml(display)}</td>`;
                })
                .join('')}</tr>`;
            })
            .join('')
    }
    <tr height="12"><td></td></tr>

    <!-- 5. SUMMARY METRICS STRIP -->
    ${
      report.summaryMetrics.length > 0
        ? `<tr>
      <td colspan="${colSpan}" class="summary-banner">
        OPERATIONAL SUMMARY METRICS: &nbsp;&nbsp; ${report.summaryMetrics
          .map((m) => `<b>${escapeHtml(m.label)}:</b> ${m.value}`)
          .join('&nbsp;&nbsp;|&nbsp;&nbsp;')}
      </td>
    </tr>
    <tr height="14"><td></td></tr>`
        : ''
    }

    <!-- 6. AUTHORISED SIGNATORY & OPERATIONAL REVIEW FOOTER -->
    <tr>
      <td colspan="${colSpan}" class="signatory-box">
        <div style="font-weight: bold; font-size: 11pt; color: #111827; margin-bottom: 4px;">
          AUTHORISED SIGNATORY & OPERATIONAL REVIEW VERIFICATION
        </div>
        <div style="font-size: 9.5pt; color: #4b5563; margin-bottom: 16px;">
          I hereby certify that I have reviewed the operational clinical trial data presented in this report.
          The records extracted above faithfully reflect the active status within the AIIA Clinical Trial Management System for Study ${escapeHtml(
            studyCode
          )} at Site ${escapeHtml(siteCode)} as of the generation timestamp.
        </div>
        <table style="width: 100%; border: none;">
          <tr>
            <td style="border: none; width: 45%; vertical-align: top; font-size: 10pt;">
              <b>Signature of Principal Investigator:</b> __________________________________<br/><br/>
              <b>Name:</b> ${escapeHtml(piName)}<br/>
              <b>Designation:</b> ${escapeHtml(piRole)}<br/>
              <b>Investigator ID:</b> ${escapeHtml(report.metadata.generatedBy)}
            </td>
            <td style="border: none; width: 30%; vertical-align: top; font-size: 10pt;">
              <b>Date of Verification:</b> ___________________<br/><br/>
              <b>Facility:</b> ${escapeHtml(siteName)}<br/>
              <b>Site Code:</b> ${escapeHtml(siteCode)}
            </td>
            <td style="border: 1px dashed #9ca3af; width: 25%; height: 70px; text-align: center; vertical-align: middle; font-size: 9pt; color: #6b7280; background-color: #fafafa;">
              [ Official Institutional Stamp / Seal ]
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- 7. SYSTEM FOOTER -->
    <tr>
      <td colspan="${colSpan}" style="text-align: right; font-size: 8pt; color: #9ca3af; padding-top: 8px;">
        AIIA CTMS Regulatory Operational Export • Document Ref: ${escapeHtml(
          report.metadata.reportType
        )}-${escapeHtml(studyCode)}-${escapeHtml(siteCode)} • Generated: ${escapeHtml(
    new Date().toISOString()
  )}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Deterministic file name generator
 */
export function generateReportExportFileName(
  reportType: ReportType,
  studyId: string,
  siteId: string,
  extension: 'xls' | 'csv' | 'json' | 'pdf'
): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  return `AIIA_CTMS_${reportType}_${studyId}_${siteId}_${dateStr}.${extension}`;
}

/**
 * Local browser download trigger
 */
export function downloadFile(
  content: string,
  fileName: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export generated report to Excel (.xls HTML Spreadsheet with full header metadata and signature footer)
 */
export function exportReportToExcel(
  report: GeneratedReport,
  contextInfo?: ReportPrintContextInfo
): void {
  const excelContent = generateExcelContent(report, contextInfo);
  const fileName = generateReportExportFileName(
    report.metadata.reportType,
    report.metadata.studyId,
    report.metadata.siteId,
    'xls'
  );
  downloadFile(excelContent, fileName, 'application/vnd.ms-excel;charset=utf-8;');
}

/**
 * Export generated report to CSV
 */
export function exportReportToCsv(report: GeneratedReport): void {
  const csvContent = generateCsvContent(report.columns, report.rows);
  const fileName = generateReportExportFileName(
    report.metadata.reportType,
    report.metadata.studyId,
    report.metadata.siteId,
    'csv'
  );
  downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
}

/**
 * Export generated report to JSON
 */
export function exportReportToJson(report: GeneratedReport): void {
  const payload = {
    reportType: report.metadata.reportType,
    title: report.metadata.title,
    studyId: report.metadata.studyId,
    siteId: report.metadata.siteId,
    generatedAt: report.metadata.generatedAt,
    generatedBy: report.metadata.generatedBy,
    disclaimer: report.metadata.disclaimer,
    filters: report.filters,
    summaryMetrics: report.summaryMetrics,
    totalRows: report.totalRows,
    columns: report.columns.map((c) => ({ key: c.key, label: c.label })),
    rows: report.rows,
  };
  const jsonContent = JSON.stringify(payload, null, 2);
  const fileName = generateReportExportFileName(
    report.metadata.reportType,
    report.metadata.studyId,
    report.metadata.siteId,
    'json'
  );
  downloadFile(jsonContent, fileName, 'application/json;charset=utf-8;');
}

