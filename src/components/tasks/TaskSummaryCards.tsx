import React from 'react';
import { Card } from '../ui/Card';
import { TaskSummaryMetrics } from '../../types';
import {
  ListTodo,
  UserCheck,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface TaskSummaryCardsProps {
  metrics: TaskSummaryMetrics;
  activeFilter?: string;
  onFilterClick?: (filterKey: string) => void;
}

export const TaskSummaryCards: React.FC<TaskSummaryCardsProps> = ({
  metrics,
  activeFilter,
  onFilterClick,
}) => {
  const cards = [
    {
      label: 'Total Tasks',
      value: metrics.total,
      subtext: 'Site operational actions',
      icon: ListTodo,
      iconBg: 'bg-stone-100',
      iconColor: 'text-primary',
      filterKey: 'ALL',
      alert: false,
    },
    {
      label: 'My Open Tasks',
      value: metrics.myOpen,
      subtext: 'Assigned to logged-in user',
      icon: UserCheck,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-800',
      filterKey: 'MY_OPEN',
      alert: false,
    },
    {
      label: 'Due Today',
      value: metrics.dueToday,
      subtext: 'Scheduled by 2026-09-29',
      icon: Calendar,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-800',
      filterKey: 'DUE_TODAY',
      alert: metrics.dueToday > 0,
    },
    {
      label: 'Overdue',
      value: metrics.overdue,
      subtext: 'Past protocol deadline',
      icon: AlertCircle,
      iconBg: 'bg-rose-50',
      iconColor: 'text-semantic-danger',
      filterKey: 'OVERDUE',
      alert: metrics.overdue > 0,
    },
    {
      label: 'Pending Review',
      value: metrics.pendingReview,
      subtext: 'Submitted & under review',
      icon: Clock,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-800',
      filterKey: 'PENDING_REVIEW',
      alert: metrics.pendingReview > 0,
    },
    {
      label: 'Completed',
      value: metrics.completed,
      subtext: 'Executed & verified',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-secondary',
      filterKey: 'COMPLETED',
      alert: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const isSelected = activeFilter === card.filterKey;

        return (
          <Card
            key={card.label}
            className={`p-3.5 flex flex-col justify-between transition-all ${
              onFilterClick ? 'cursor-pointer hover:shadow-xs hover:border-primary/40' : ''
            } ${isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}`}
            onClick={() => onFilterClick && onFilterClick(card.filterKey)}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-ink-secondary">
                {card.label}
              </span>
              <div
                className={`w-7 h-7 rounded-sm flex items-center justify-center ${card.iconBg} ${card.iconColor}`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-serif font-bold tracking-tight ${
                    card.alert && card.value > 0 ? 'text-semantic-danger' : 'text-ink'
                  }`}
                >
                  {card.value}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5 truncate">{card.subtext}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
