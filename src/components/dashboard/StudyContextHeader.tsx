import React from 'react';
import { CurrentStudyContext } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { Building2, FileText, UserCheck, ShieldCheck } from 'lucide-react';

interface StudyContextHeaderProps {
  context: CurrentStudyContext;
}

export const StudyContextHeader: React.FC<StudyContextHeaderProps> = ({ context }) => {
  return (
    <div className="bg-surface border border-border rounded-sm p-4 sm:p-5 shadow-subtle mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Study Details */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-rose-50 text-primary-dark border border-rose-200 rounded-sm">
              {context.studyCode}
            </span>
            <StatusBadge label={context.studyStatus} variant="success" size="sm" />
            <span className="text-xs text-ink-muted border-l border-border pl-2 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-accent" />
              Protocol {context.protocolVersion}
            </span>
            <span className="text-xs text-ink-muted border-l border-border pl-2 flex items-center gap-1 hidden sm:flex">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              GCP Active
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-ink font-heading leading-snug">
            {context.studyTitle}
          </h2>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-secondary">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              <span>
                <strong>Site:</strong> {context.siteName} ({context.siteCode})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              <span>
                <strong>PI:</strong> {context.piName}
              </span>
            </div>
          </div>
        </div>

        {/* Action / Context summary badge */}
        <div className="flex sm:items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
          <div className="bg-surface-soft border border-border rounded-sm px-3.5 py-2 text-right">
            <span className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              Site Jurisdiction
            </span>
            <span className="text-xs font-bold text-ink">Assigned Site Scope</span>
          </div>
        </div>
      </div>
    </div>
  );
};
