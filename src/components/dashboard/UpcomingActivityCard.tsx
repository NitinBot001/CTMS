import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { UpcomingActivityItem } from '../../types';
import { StatusBadge, BadgeVariant } from '../ui/StatusBadge';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UpcomingActivityCardProps {
  activities: UpcomingActivityItem[];
}

export const UpcomingActivityCard: React.FC<UpcomingActivityCardProps> = ({ activities }) => {
  const getBadgeVariant = (status: UpcomingActivityItem['status']): BadgeVariant => {
    switch (status) {
      case 'Due Today':
        return 'warning';
      case 'Overdue':
        return 'danger';
      case 'Completed':
        return 'success';
      case 'Upcoming':
      default:
        return 'info';
    }
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader
          title="Upcoming Clinical Activities"
          subtitle="Scheduled protocol assessments and patient visits"
          action={
            <Link
              to="/pi/visits"
              className="text-xs font-medium text-primary hover:text-primary-dark inline-flex items-center gap-1 group"
            >
              <span>Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          }
        />
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {activities.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-muted">
                No upcoming visits scheduled for this site.
              </div>
            ) : (
              activities.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 hover:bg-surface-soft transition-colors flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
                        {item.participantId}
                      </span>
                      <StatusBadge label={item.status} variant={getBadgeVariant(item.status)} size="sm" />
                    </div>
                    <p className="font-medium text-ink truncate">{item.activityName}</p>
                    <div className="flex items-center gap-3 text-[11px] text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.dateLabel}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.assignedStaff}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </div>

      <div className="p-3 border-t border-border bg-surface-soft text-right">
        <Link
          to="/pi/visits"
          className="text-xs text-primary font-semibold hover:underline"
        >
          View all 18 scheduled activities &rarr;
        </Link>
      </div>
    </Card>
  );
};
