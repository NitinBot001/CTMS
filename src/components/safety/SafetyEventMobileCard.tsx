import React from 'react';
import { SafetyEvent } from '../../types';
import { SafetyEventTypeBadge } from './SafetyEventTypeBadge';
import { SafetySeverityBadge } from './SafetySeverityBadge';
import { SafetySeriousnessBadge } from './SafetySeriousnessBadge';
import { SafetyReviewBadge } from './SafetyReviewBadge';
import { SafetyFollowUpBadge } from './SafetyFollowUpBadge';
import { ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SafetyEventMobileCardProps {
  event: SafetyEvent;
}

export const SafetyEventMobileCard: React.FC<SafetyEventMobileCardProps> = ({ event: e }) => {
  const isSae = e.eventType === 'SAE';

  return (
    <div
      className={`bg-surface border border-border rounded-sm p-4 shadow-subtle space-y-3 ${
        isSae ? 'border-l-4 border-l-primary' : ''
      }`}
    >
      {/* Top row: ID, Type Badge, Participant */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-ink bg-surface-soft border border-border px-2 py-0.5 rounded-sm">
              {e.id}
            </span>
            <SafetyEventTypeBadge type={e.eventType} size="sm" />
          </div>
          <Link
            to={`/pi/patients/${e.participantId}`}
            className="text-xs font-semibold text-primary hover:underline block mt-1"
          >
            Subject: {e.participantCode} ({e.participantInitials})
          </Link>
        </div>

        <SafetyReviewBadge status={e.piReviewStatus} size="sm" />
      </div>

      {/* Title */}
      <div>
        <h4 className="text-xs font-semibold text-ink leading-snug">{e.title}</h4>
      </div>

      {/* Clinical Assessment Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs bg-surface-soft p-2.5 rounded-sm border border-border">
        <div>
          <span className="text-[10px] text-ink-muted uppercase font-semibold block">
            Severity
          </span>
          <div className="mt-0.5">
            <SafetySeverityBadge severity={e.severity} size="sm" />
          </div>
        </div>

        <div>
          <span className="text-[10px] text-ink-muted uppercase font-semibold block">
            Seriousness
          </span>
          <div className="mt-0.5">
            <SafetySeriousnessBadge seriousness={e.seriousness} size="sm" />
          </div>
        </div>

        <div>
          <span className="text-[10px] text-ink-muted uppercase font-semibold block">
            Onset Date
          </span>
          <div className="flex items-center gap-1 font-mono text-[11px] text-ink mt-0.5">
            <Calendar className="w-3 h-3 text-ink-muted" />
            <span>{e.onsetDate}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-ink-muted uppercase font-semibold block">
            Clinical Status
          </span>
          <span className="text-xs font-medium text-ink capitalize mt-0.5 block">
            {e.status.replace(/_/g, ' ').toLowerCase()}
            {e.ongoing && ' (Ongoing)'}
          </span>
        </div>
      </div>

      {/* Follow-up & Action CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
        <SafetyFollowUpBadge status={e.followUpStatus} dueDate={e.followUpDueDate} size="sm" />

        <Link
          to={`/pi/safety/${e.id}`}
          className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-dark group"
        >
          <span>View Event</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};
