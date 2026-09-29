import React from 'react';
import { Bell, AlertTriangle, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { NotificationSummaryMetrics, NotificationFilters } from '../../types';

interface NotificationSummaryCardsProps {
  metrics: NotificationSummaryMetrics;
  activeFilters: NotificationFilters;
  onFilterChange: (filters: NotificationFilters) => void;
  isLoading?: boolean;
}

export const NotificationSummaryCards: React.FC<NotificationSummaryCardsProps> = ({
  metrics,
  activeFilters,
  onFilterChange,
  isLoading = false,
}) => {
  const cards = [
    {
      id: 'total',
      label: 'Total Notifications',
      value: metrics.total,
      icon: Bell,
      variant: 'default',
      isActive: !activeFilters.unreadOnly && !activeFilters.priority && !activeFilters.status,
      onClick: () => {
        const { unreadOnly, priority, status, ...rest } = activeFilters;
        onFilterChange(rest);
      },
    },
    {
      id: 'unread',
      label: 'Unread Alerts',
      value: metrics.unread,
      icon: Clock,
      variant: 'primary',
      isActive: activeFilters.status === 'UNREAD' || activeFilters.unreadOnly === true,
      onClick: () => {
        onFilterChange({
          ...activeFilters,
          status: 'UNREAD',
          unreadOnly: true,
        });
      },
    },
    {
      id: 'highPriority',
      label: 'High Priority',
      value: metrics.highPriority,
      icon: AlertTriangle,
      variant: 'danger',
      isActive: activeFilters.priority === 'HIGH',
      onClick: () => {
        onFilterChange({
          ...activeFilters,
          priority: 'HIGH',
        });
      },
    },
    {
      id: 'actionRequired',
      label: 'Action Required',
      value: metrics.actionRequired,
      icon: ShieldAlert,
      variant: 'warning',
      isActive: activeFilters.status === 'UNREAD' && !activeFilters.priority,
      onClick: () => {
        onFilterChange({
          ...activeFilters,
          status: 'UNREAD',
          unreadOnly: true,
        });
      },
    },
    {
      id: 'today',
      label: 'Today',
      value: metrics.today ?? 0,
      icon: CheckCircle2,
      variant: 'success',
      isActive: false,
      onClick: () => {
        const todayStr = new Date().toISOString().slice(0, 10);
        onFilterChange({
          ...activeFilters,
          dateFrom: todayStr,
          dateTo: todayStr,
        });
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;

        let badgeBg = 'bg-surface-soft text-ink-muted';
        let borderColor = 'border-border';
        let iconColor = 'text-ink-muted';

        if (card.variant === 'primary') {
          badgeBg = 'bg-primary/10 text-primary';
          iconColor = 'text-primary';
        } else if (card.variant === 'danger') {
          badgeBg = 'bg-rose-50 text-rose-700';
          iconColor = 'text-rose-600';
        } else if (card.variant === 'warning') {
          badgeBg = 'bg-amber-50 text-amber-800';
          iconColor = 'text-amber-600';
        } else if (card.variant === 'success') {
          badgeBg = 'bg-emerald-50 text-emerald-700';
          iconColor = 'text-emerald-600';
        }

        if (card.isActive) {
          borderColor = 'border-primary ring-1 ring-primary/30';
        }

        return (
          <button
            type="button"
            key={card.id}
            onClick={card.onClick}
            disabled={isLoading}
            className={`p-3.5 bg-surface border rounded-sm shadow-subtle text-left transition-all hover:shadow-card hover:border-primary-light/60 flex flex-col justify-between ${borderColor} ${
              card.isActive ? 'bg-primary/[0.02]' : ''
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-semibold text-ink-secondary truncate pr-1">
                {card.label}
              </span>
              <div className={`p-1 rounded-xs ${badgeBg}`}>
                <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
              </div>
            </div>

            <div className="text-xl sm:text-2xl font-bold font-heading text-ink">
              {isLoading ? '...' : card.value}
            </div>
          </button>
        );
      })}
    </div>
  );
};
