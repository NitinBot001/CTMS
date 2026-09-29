import React from 'react';
import { ParticipantVisit } from '../../types';
import { VisitStatusBadge } from './VisitStatusBadge';
import { ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VisitWindowDisplay } from './VisitWindowDisplay';

interface VisitTableProps {
  visits: ParticipantVisit[];
}

export const VisitTable: React.FC<VisitTableProps> = ({ visits }) => {
  return (
    <div className="bg-surface border border-border rounded-sm shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs" aria-label="Clinical Trial Visit Schedule">
          <thead>
            <tr className="bg-surface-soft border-b border-border text-ink-muted uppercase font-semibold text-[11px] tracking-wider">
              <th scope="col" className="py-3 px-4">Participant</th>
              <th scope="col" className="py-3 px-4">Protocol Visit</th>
              <th scope="col" className="py-3 px-3">Target Date & Window</th>
              <th scope="col" className="py-3 px-3">Procedures</th>
              <th scope="col" className="py-3 px-3">Staff</th>
              <th scope="col" className="py-3 px-3">Status</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visits.map((v) => {
              const progressPercent =
                v.totalActivities > 0
                  ? Math.round((v.completedActivities / v.totalActivities) * 100)
                  : 0;

              return (
                <tr
                  key={v.id}
                  className="hover:bg-surface-soft/80 transition-colors group cursor-pointer"
                >
                  {/* Participant Code & Initials */}
                  <td className="py-3.5 px-4">
                    <Link
                      to={`/pi/patients/${v.participantId}`}
                      className="inline-flex items-center gap-2 hover:underline"
                      title="View Participant Profile"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="font-mono font-bold text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
                        {v.participantCode}
                      </span>
                      <span className="font-semibold text-ink-secondary">({v.participantInitials})</span>
                    </Link>
                  </td>

                  {/* Visit Code & Name */}
                  <td className="py-3.5 px-4 max-w-[240px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-xs text-primary-dark">
                        {v.visitCode}
                      </span>
                      <span className="text-[11px] text-ink-muted">(Seq {v.sequence})</span>
                    </div>
                    <span className="font-medium text-ink block truncate leading-tight mt-0.5">
                      {v.visitName}
                    </span>
                  </td>

                  {/* Target Date & Window */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <VisitWindowDisplay
                      targetDate={v.targetDate}
                      windowStart={v.windowStart}
                      windowEnd={v.windowEnd}
                      status={v.status}
                      compact
                    />
                  </td>

                  {/* Procedures Progress */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
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
                    {v.requiredIncompleteActivities > 0 && v.status !== 'COMPLETED' && (
                      <span className="text-[10px] text-primary block mt-0.5">
                        {v.requiredIncompleteActivities} req pending
                      </span>
                    )}
                  </td>

                  {/* Assigned Staff */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-ink-secondary">
                    {v.assignedStaff ? (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-ink-muted" />
                        <span>{v.assignedStaff}</span>
                      </div>
                    ) : (
                      <span className="text-ink-muted italic">Unassigned</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3">
                    <VisitStatusBadge status={v.status} size="sm" />
                  </td>

                  {/* Action Link */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      to={`/pi/visits/${v.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark group-hover:underline"
                    >
                      <span>View Visit</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
