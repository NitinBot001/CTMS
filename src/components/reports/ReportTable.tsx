import React from 'react';
import { ReportColumnConfig, ReportRow, ReportType } from '../../types';
import { EmptyReportState } from './EmptyReportState';

interface ReportTableProps {
  columns: ReportColumnConfig[];
  rows: ReportRow[];
  reportType: ReportType;
  isLoading?: boolean;
  onResetFilters?: () => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  columns,
  rows,
  isLoading,
  onResetFilters,
}) => {
  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-sm p-8 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-8 bg-surface-soft/60 animate-pulse rounded-sm"
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyReportState onResetFilters={onResetFilters} />;
  }

  const renderBadge = (key: string, value: unknown) => {
    const val = String(value || '');

    // Operational Status
    if (val === 'OPTIMAL' || val === 'ON_TRACK' || val === 'CLEAR' || val === 'CONTROLLED' || val === 'CURRENT' || val === 'COMPLIANT') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          {val}
        </span>
      );
    }
    if (val === 'ACTION_REQUIRED' || val === 'CRITICAL_ACTION' || val === 'RENEWAL_MANDATORY' || val === 'CRITICAL' || val === 'OVERDUE' || val === 'EXPIRED') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          {val}
        </span>
      );
    }
    if (val === 'MONITORING' || val === 'ATTENTION_NEEDED' || val === 'BACKLOG' || val === 'EXPIRING_SOON' || val === 'MAJOR' || val === 'Action Required') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          {val}
        </span>
      );
    }

    // Safety Severity
    if (key === 'severity') {
      const isSevere = val === 'SEVERE';
      const isMod = val === 'MODERATE';
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${
            isSevere
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : isMod
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-stone-50 text-stone-700 border-stone-200'
          }`}
        >
          {val}
        </span>
      );
    }

    // Safety Seriousness
    if (key === 'isSerious') {
      const isSae = val.includes('Yes');
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold border ${
            isSae
              ? 'bg-rose-100 text-rose-900 border-rose-400'
              : 'bg-stone-100 text-stone-700 border-stone-200'
          }`}
        >
          {val}
        </span>
      );
    }

    // Generic fallback badge
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium bg-stone-100 text-ink border border-border">
        {val}
      </span>
    );
  };

  return (
    <div className="bg-surface border border-border rounded-sm shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-stone-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-3.5 font-semibold text-ink-muted text-[11px] uppercase tracking-wider ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-surface-soft/40 transition-colors"
              >
                {columns.map((col) => {
                  const val = row[col.key];

                  return (
                    <td
                      key={col.key}
                      className={`py-2.5 px-3.5 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {col.format === 'badge' ? (
                        renderBadge(col.key, val)
                      ) : col.format === 'number' ? (
                        <span className="font-mono font-semibold text-ink">
                          {val != null ? String(val) : '—'}
                        </span>
                      ) : col.format === 'date' ? (
                        <span className="font-mono text-ink-muted text-[11px]">
                          {val ? String(val) : '—'}
                        </span>
                      ) : (
                        <span className="text-ink font-medium">
                          {val != null ? String(val) : '—'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-stone-50/60 border-t border-border flex items-center justify-between text-[11px] text-ink-muted">
        <span>Displaying {rows.length} operational records</span>
        <span className="italic">AIIA CTMS Audit Verified</span>
      </div>
    </div>
  );
};
