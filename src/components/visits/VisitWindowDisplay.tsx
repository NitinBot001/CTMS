import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { getReferenceDate, parseDateISO } from '../../utils/visitCalculations';

interface VisitWindowDisplayProps {
  targetDate: string;
  windowStart: string;
  windowEnd: string;
  status: string;
  compact?: boolean;
}

export const VisitWindowDisplay: React.FC<VisitWindowDisplayProps> = ({
  targetDate,
  windowStart,
  windowEnd,
  status,
  compact = false,
}) => {
  const refDateStr = getReferenceDate();
  const refDate = parseDateISO(refDateStr);
  const targetParsed = parseDateISO(targetDate);
  const windowEndParsed = parseDateISO(windowEnd);

  // Calculate timing status message
  let timingLabel = '';
  let timingColor = 'text-ink-muted';

  if (status === 'COMPLETED') {
    timingLabel = 'Visit completed';
    timingColor = 'text-secondary';
  } else if (status === 'CANCELLED') {
    timingLabel = 'Visit cancelled';
    timingColor = 'text-ink-muted';
  } else if (refDateStr > windowEnd) {
    const daysOverdue = Math.round((refDate.getTime() - windowEndParsed.getTime()) / (1000 * 60 * 60 * 24));
    timingLabel = `${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} past window closure`;
    timingColor = 'text-semantic-danger font-medium';
  } else if (refDateStr >= windowStart && refDateStr <= windowEnd) {
    const daysLeft = Math.round((windowEndParsed.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
    timingLabel = `In window (${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} remaining)`;
    timingColor = 'text-accent-dark font-medium';
  } else {
    const daysUntil = Math.round((targetParsed.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 0) {
      timingLabel = `Target in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`;
      timingColor = 'text-ink-secondary';
    } else {
      timingLabel = 'Scheduled';
      timingColor = 'text-ink-secondary';
    }
  }

  if (compact) {
    return (
      <div className="flex flex-col text-xs">
        <span className="font-mono text-ink font-medium">{targetDate}</span>
        <span className="text-[11px] text-ink-muted">
          {windowStart} to {windowEnd}
        </span>
        <span className={`text-[10px] ${timingColor}`}>{timingLabel}</span>
      </div>
    );
  }

  return (
    <div className="bg-surface-soft border border-border rounded-sm p-4 text-xs">
      <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-ink">
          <Calendar className="w-4 h-4 text-primary" />
          <span>Protocol Visit Window</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span className={timingColor}>{timingLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface p-2.5 rounded-sm border border-border">
          <div className="text-[11px] text-ink-muted uppercase tracking-wider font-medium">Window Opens</div>
          <div className="font-mono font-bold text-ink text-sm mt-0.5">{windowStart}</div>
        </div>

        <div className="bg-surface p-2.5 rounded-sm border border-border border-l-2 border-l-primary">
          <div className="text-[11px] text-primary uppercase tracking-wider font-semibold">Target Date</div>
          <div className="font-mono font-bold text-ink text-sm mt-0.5">{targetDate}</div>
        </div>

        <div className="bg-surface p-2.5 rounded-sm border border-border">
          <div className="text-[11px] text-ink-muted uppercase tracking-wider font-medium">Window Closes</div>
          <div className="font-mono font-bold text-ink text-sm mt-0.5">{windowEnd}</div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-1.5 text-[11px] text-ink-muted">
        <AlertCircle className="w-3.5 h-3.5 text-ink-muted shrink-0 mt-0.5" />
        <span>
          Reference operational date is <strong>{refDateStr}</strong>. Visits conducted after the window closure date will require a protocol deviation report.
        </span>
      </div>
    </div>
  );
};
