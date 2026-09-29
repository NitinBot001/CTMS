import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { RecentActivityItem } from '../../types';
import { Activity, Clock } from 'lucide-react';

interface RecentActivityCardProps {
  activities: RecentActivityItem[];
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ activities }) => {
  return (
    <Card className="mb-6">
      <CardHeader
        title="Recent Site Operations Feed"
        subtitle="Chronological audit trail of site coordinator, nursing and pharmacy actions"
      />
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-muted">
              No recent site activity recorded.
            </div>
          ) : (
            activities.map((item) => (
              <div
                key={item.id}
                className="p-3.5 hover:bg-surface-soft transition-colors flex items-start gap-3 text-xs"
              >
                <div className="w-7 h-7 rounded-sm bg-surface-soft border border-border flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <Activity className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-ink leading-tight">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-ink-muted flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {item.timestampLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-ink-secondary">
                    <span>
                      Actor: <strong>{item.actor}</strong> ({item.role})
                    </span>
                    <span className="text-border-strong">&bull;</span>
                    <span className="px-1.5 py-0.2 bg-surface-soft border border-border rounded-sm text-[10px]">
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
