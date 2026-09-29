import React from 'react';
import { SafetyEvent } from '../../types';
import { SafetyEventTypeBadge } from './SafetyEventTypeBadge';
import { SafetySeverityBadge } from './SafetySeverityBadge';
import { SafetySeriousnessBadge } from './SafetySeriousnessBadge';
import { SafetyReviewBadge } from './SafetyReviewBadge';
import { SafetyFollowUpBadge } from './SafetyFollowUpBadge';
import { ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SafetyEventTableProps {
  events: SafetyEvent[];
}

export const SafetyEventTable: React.FC<SafetyEventTableProps> = ({ events }) => {
  return (
    <div className="bg-surface border border-border rounded-sm shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs" aria-label="Clinical Trial Safety & Adverse Events Log">
          <thead>
            <tr className="bg-surface-soft border-b border-border text-ink-muted uppercase font-semibold text-[11px] tracking-wider">
              <th scope="col" className="py-3 px-4">Event Identity</th>
              <th scope="col" className="py-3 px-3">Subject</th>
              <th scope="col" className="py-3 px-3">Type</th>
              <th scope="col" className="py-3 px-3">Severity</th>
              <th scope="col" className="py-3 px-3">Seriousness Criterion</th>
              <th scope="col" className="py-3 px-3">Onset / Status</th>
              <th scope="col" className="py-3 px-3">PI Review</th>
              <th scope="col" className="py-3 px-3">Follow-Up</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.map((e) => {
              const isSae = e.eventType === 'SAE';

              return (
                <tr
                  key={e.id}
                  className={`hover:bg-surface-soft/80 transition-colors group cursor-pointer ${
                    isSae ? 'bg-rose-50/20' : ''
                  }`}
                >
                  {/* Event ID & Title */}
                  <td className="py-3.5 px-4 max-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
                        {e.id}
                      </span>
                      {e.ongoing && (
                        <span className="text-[10px] font-semibold text-accent-dark bg-amber-50 px-1 py-0.2 rounded-sm border border-amber-200">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-ink block truncate leading-tight mt-1">
                      {e.title}
                    </span>
                  </td>

                  {/* Subject Code & Initials */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <Link
                      to={`/pi/patients/${e.participantId}`}
                      className="inline-flex items-center gap-1 hover:underline"
                      title="View Participant Profile"
                      onClick={(evt) => evt.stopPropagation()}
                    >
                      <span className="font-mono font-bold text-ink">
                        {e.participantCode}
                      </span>
                      <span className="text-ink-secondary">({e.participantInitials})</span>
                    </Link>
                  </td>

                  {/* Type (AE / SAE) */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <SafetyEventTypeBadge type={e.eventType} size="sm" />
                  </td>

                  {/* Severity */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <SafetySeverityBadge severity={e.severity} size="sm" />
                  </td>

                  {/* Seriousness */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <SafetySeriousnessBadge seriousness={e.seriousness} size="sm" />
                  </td>

                  {/* Onset / Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-ink-secondary">
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="w-3 h-3 text-ink-muted" />
                      <span>{e.onsetDate}</span>
                    </div>
                    <span className="text-[10px] text-ink-muted block mt-0.5 capitalize">
                      {e.status.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </td>

                  {/* PI Review */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <SafetyReviewBadge status={e.piReviewStatus} size="sm" />
                  </td>

                  {/* Follow-Up */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <SafetyFollowUpBadge status={e.followUpStatus} dueDate={e.followUpDueDate} size="sm" />
                  </td>

                  {/* Action Link */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      to={`/pi/safety/${e.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark group-hover:underline"
                    >
                      <span>View</span>
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
