import React from 'react';
import { ClinicalActivity, ClinicalActivityStatus } from '../../types';
import { CheckCircle2, Circle, Clock, Check, AlertCircle } from 'lucide-react';

interface ClinicalActivityListProps {
  activities: ClinicalActivity[];
  onToggleStatus?: (activityId: string, newStatus: ClinicalActivityStatus) => void;
  isReadOnly?: boolean;
}

export const ClinicalActivityList: React.FC<ClinicalActivityListProps> = ({
  activities,
  onToggleStatus,
  isReadOnly = false,
}) => {
  const getActivityStatusBadge = (status: ClinicalActivityStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary-dark bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
            <Check className="w-3 h-3 text-secondary" />
            <span>Completed</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-sm">
            <Clock className="w-3 h-3 text-sky-600" />
            <span>In Progress</span>
          </span>
        );
      case 'NOT_APPLICABLE':
        return (
          <span className="text-[11px] font-medium text-ink-muted bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-sm">
            N/A
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-secondary bg-stone-50 border border-border px-2 py-0.5 rounded-sm">
            <Circle className="w-2.5 h-2.5 text-ink-muted" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const completedCount = activities.filter((a) => a.status === 'COMPLETED').length;
  const totalCount = activities.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="bg-surface-soft p-3 rounded-sm border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-secondary" />
          <span className="text-xs font-semibold text-ink">
            Protocol Procedures Checklist ({completedCount}/{totalCount} Completed)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-36 bg-stone-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-secondary h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono font-medium text-ink-secondary">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Activity Items List */}
      <div className="divide-y divide-border border border-border rounded-sm bg-surface overflow-hidden shadow-subtle">
        {activities.map((activity, idx) => {
          const isDone = activity.status === 'COMPLETED';

          return (
            <div
              key={activity.id}
              className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isDone ? 'bg-stone-50/50' : 'hover:bg-stone-50/80'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                {/* Number / sequence */}
                <div className="w-6 h-6 rounded-full bg-stone-100 border border-border flex items-center justify-center shrink-0 text-[11px] font-mono font-medium text-ink-muted mt-0.5">
                  {idx + 1}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        isDone ? 'line-through text-ink-muted' : 'text-ink font-semibold'
                      }`}
                    >
                      {activity.name}
                    </span>

                    {activity.code && (
                      <span className="text-[10px] font-mono text-ink-muted bg-stone-100 px-1.5 py-0.2 rounded-sm border border-border">
                        {activity.code}
                      </span>
                    )}

                    {activity.category && (
                      <span className="text-[10px] font-medium text-ink-secondary bg-stone-100/70 px-1.5 py-0.2 rounded-sm border border-stone-200">
                        {activity.category}
                      </span>
                    )}

                    {activity.required ? (
                      <span className="text-[10px] font-semibold text-primary-dark bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-sm">
                        Required
                      </span>
                    ) : (
                      <span className="text-[10px] text-ink-muted italic">Optional</span>
                    )}
                  </div>

                  {/* Performed by / notes meta */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                    {activity.completedBy && (
                      <span>
                        Conducted by: <strong>{activity.completedBy}</strong>
                        {activity.completedAt && ` on ${activity.completedAt}`}
                      </span>
                    )}
                    {activity.notes && (
                      <span className="text-ink-secondary italic">Note: {activity.notes}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action / status buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {getActivityStatusBadge(activity.status)}

                {!isReadOnly && onToggleStatus && (
                  <button
                    type="button"
                    onClick={() =>
                      onToggleStatus(
                        activity.id,
                        activity.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
                      )
                    }
                    className={`text-xs px-2.5 py-1 rounded-sm border font-medium transition-colors ${
                      activity.status === 'COMPLETED'
                        ? 'border-border text-ink-muted hover:text-ink hover:bg-stone-100'
                        : 'bg-secondary text-surface border-secondary hover:bg-secondary-dark'
                    }`}
                    aria-label={`Toggle status for ${activity.name}`}
                  >
                    {activity.status === 'COMPLETED' ? 'Undo' : 'Sign Off'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-ink-muted px-1">
        <AlertCircle className="w-3.5 h-3.5 text-ink-muted shrink-0" />
        <span>
          Required activities must be signed off by authorized clinical site staff before this visit can be marked as fully completed.
        </span>
      </div>
    </div>
  );
};
