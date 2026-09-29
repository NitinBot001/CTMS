import React from 'react';
import { ParticipantVisit } from '../../types';
import { VisitStatusBadge } from './VisitStatusBadge';
import { ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VisitWindowDisplay } from './VisitWindowDisplay';

interface VisitMobileCardProps {
  visit: ParticipantVisit;
}

export const VisitMobileCard: React.FC<VisitMobileCardProps> = ({ visit: v }) => {
  const progressPercent =
    v.totalActivities > 0
      ? Math.round((v.completedActivities / v.totalActivities) * 100)
      : 0;

  return (
    <div className="bg-surface border border-border rounded-sm p-4 shadow-subtle space-y-3">
      {/* Top row: Participant code, Visit code, Status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to={`/pi/patients/${v.participantId}`}
              className="font-mono font-bold text-sm text-ink bg-surface-soft border border-border px-2 py-0.5 rounded-sm hover:underline"
            >
              {v.participantCode}
            </Link>
            <span className="font-semibold text-ink-secondary text-xs">
              ({v.participantInitials})
            </span>
          </div>
          <span className="text-xs font-semibold text-primary-dark block mt-1">
            {v.visitCode}: {v.visitName}
          </span>
        </div>

        <VisitStatusBadge status={v.status} size="sm" />
      </div>

      {/* Timing and Window */}
      <div className="bg-surface-soft p-2.5 rounded-sm border border-border">
        <VisitWindowDisplay
          targetDate={v.targetDate}
          windowStart={v.windowStart}
          windowEnd={v.windowEnd}
          status={v.status}
          compact
        />
      </div>

      {/* Procedures Progress & Staff */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
        <div className="space-y-1">
          <span className="text-[10px] text-ink-muted uppercase font-semibold block">
            Procedures
          </span>
          <div className="flex items-center gap-2">
            <div className="w-16 bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-secondary h-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-ink-secondary">
              {v.completedActivities}/{v.totalActivities}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-ink-muted uppercase font-semibold block">
            Staff
          </span>
          <div className="flex items-center gap-1 text-[11px] text-ink-secondary">
            <User className="w-3 h-3 text-ink-muted" />
            <span>{v.assignedStaff || 'Unassigned'}</span>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="pt-2 border-t border-border flex justify-end">
        <Link
          to={`/pi/visits/${v.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark group"
        >
          <span>View Visit Details</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};
