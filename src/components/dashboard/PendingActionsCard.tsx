import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { PendingActionItem } from '../../types';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PendingActionsCardProps {
  actions: PendingActionItem[];
}

export const PendingActionsCard: React.FC<PendingActionsCardProps> = ({ actions }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAction = (item: PendingActionItem) => {
    setToastMessage(`Action triggered: "${item.title}" — Opening task review dialog`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getPriorityBadge = (priority: PendingActionItem['priority']) => {
    switch (priority) {
      case 'High':
        return <StatusBadge label="High Priority" variant="danger" size="sm" />;
      case 'Medium':
        return <StatusBadge label="Medium" variant="warning" size="sm" />;
      case 'Normal':
      default:
        return <StatusBadge label="Normal" variant="neutral" size="sm" />;
    }
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader
          title="My Pending Actions"
          subtitle="Required investigator decisions, approvals, and sign-offs"
          action={
            <Link
              to="/pi/tasks"
              className="text-xs font-medium text-primary hover:text-primary-dark inline-flex items-center gap-1 group"
            >
              <span>All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          }
        />
        <CardContent className="p-0">
          {toastMessage && (
            <div className="mx-4 my-2 p-2 bg-emerald-50 border border-emerald-300 rounded-sm text-xs text-secondary-dark font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-secondary shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          <div className="divide-y divide-border">
            {actions.length === 0 ? (
              <div className="p-6 text-center text-xs text-ink-muted">
                No pending actions requiring PI attention.
              </div>
            ) : (
              actions.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 hover:bg-surface-soft transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-ink-muted px-1.5 py-0.2 bg-surface-soft border border-border rounded-sm">
                        {item.category}
                      </span>
                      {getPriorityBadge(item.priority)}
                      <span className="text-[11px] text-ink-muted flex items-center gap-1">
                        <Clock className="w-3 h-3 text-accent" />
                        {item.dueDateLabel}
                      </span>
                    </div>

                    <p className="font-semibold text-ink leading-snug">{item.title}</p>
                    <p className="text-[11px] text-ink-muted">Status: {item.status}</p>
                  </div>

                  <div className="shrink-0 self-end sm:self-center">
                    <Button
                      variant={item.priority === 'High' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleAction(item)}
                    >
                      {item.actionLabel}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </div>

      <div className="p-3 border-t border-border bg-surface-soft text-right">
        <Link
          to="/pi/tasks"
          className="text-xs text-primary font-semibold hover:underline"
        >
          Manage complete task queue &rarr;
        </Link>
      </div>
    </Card>
  );
};
