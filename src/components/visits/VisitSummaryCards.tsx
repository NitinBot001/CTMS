import React from 'react';
import { Card } from '../ui/Card';
import { VisitSummaryMetrics, VisitStatus } from '../../types';
import {
  CalendarDays,
  Clock,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface VisitSummaryCardsProps {
  metrics: VisitSummaryMetrics;
  activeFilter?: VisitStatus | 'ALL';
  onFilterClick?: (status: VisitStatus | 'ALL') => void;
}

export const VisitSummaryCards: React.FC<VisitSummaryCardsProps> = ({
  metrics,
  activeFilter,
  onFilterClick,
}) => {
  const cards = [
    {
      label: 'Total Visits',
      value: metrics.total,
      subtext: 'Across site schedule',
      icon: CalendarDays,
      iconBg: 'bg-stone-100',
      iconColor: 'text-ink-secondary',
      filterKey: 'ALL' as const,
      alert: false,
    },
    {
      label: 'Due Visits',
      value: metrics.due,
      subtext: 'Inside protocol window',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-accent-dark',
      filterKey: 'DUE' as const,
      alert: metrics.due > 0,
    },
    {
      label: 'Upcoming',
      value: metrics.upcoming,
      subtext: 'Future scheduled visits',
      icon: CalendarClock,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-700',
      filterKey: 'SCHEDULED' as const,
      alert: false,
    },
    {
      label: 'Overdue Visits',
      value: metrics.overdue,
      subtext: metrics.overdue > 0 ? 'Window closed; action needed' : 'Zero overdue visits',
      icon: AlertTriangle,
      iconBg: metrics.overdue > 0 ? 'bg-red-50' : 'bg-stone-100',
      iconColor: metrics.overdue > 0 ? 'text-semantic-danger' : 'text-ink-muted',
      filterKey: 'OVERDUE' as const,
      alert: metrics.overdue > 0,
    },
    {
      label: 'Completed',
      value: metrics.completed,
      subtext: 'Fully conducted & signed',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-secondary',
      filterKey: 'COMPLETED' as const,
      alert: false,
    },
    {
      label: 'Missed Visits',
      value: metrics.missed,
      subtext: metrics.missed > 0 ? 'Protocol violation flag' : 'Zero missed visits',
      icon: XCircle,
      iconBg: metrics.missed > 0 ? 'bg-rose-50' : 'bg-stone-100',
      iconColor: metrics.missed > 0 ? 'text-primary-dark' : 'text-ink-muted',
      filterKey: 'MISSED' as const,
      alert: metrics.missed > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.filterKey;

        return (
          <Card
            key={idx}
            className={`p-3 flex flex-col justify-between transition-all ${
              onFilterClick ? 'cursor-pointer hover:border-border-strong hover:shadow-card' : ''
            } ${isSelected ? 'ring-2 ring-primary border-primary bg-stone-50/50' : ''}`}
            onClick={() => onFilterClick && onFilterClick(card.filterKey)}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted truncate">
                {card.label}
              </span>
              <div
                className={`w-6 h-6 rounded-sm ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold font-heading ${
                  card.alert && card.filterKey === 'OVERDUE'
                    ? 'text-semantic-danger'
                    : card.alert && card.filterKey === 'DUE'
                    ? 'text-accent-dark'
                    : card.alert && card.filterKey === 'MISSED'
                    ? 'text-primary-dark'
                    : 'text-ink'
                }`}
              >
                {card.value}
              </span>
            </div>

            <p
              className={`text-[10px] mt-1 truncate ${
                card.alert ? 'font-medium text-ink-secondary' : 'text-ink-muted'
              }`}
            >
              {card.subtext}
            </p>
          </Card>
        );
      })}
    </div>
  );
};
