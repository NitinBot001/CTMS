import React from 'react';
import { Card } from '../ui/Card';
import { SafetySummaryMetrics } from '../../types';
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Clock,
  CalendarClock,
  AlertOctagon,
  FileCheck,
} from 'lucide-react';

interface SafetySummaryCardsProps {
  metrics: SafetySummaryMetrics;
  activeFilter?: string;
  onFilterClick?: (filterKey: string) => void;
}

export const SafetySummaryCards: React.FC<SafetySummaryCardsProps> = ({
  metrics,
  activeFilter,
  onFilterClick,
}) => {
  const cards = [
    {
      label: 'Total Safety Events',
      value: metrics.total,
      subtext: 'Recorded at active site',
      icon: Activity,
      iconBg: 'bg-stone-100',
      iconColor: 'text-ink-secondary',
      filterKey: 'ALL',
      alert: false,
    },
    {
      label: 'Adverse Events (AE)',
      value: metrics.ae,
      subtext: 'Non-serious incidents',
      icon: ShieldAlert,
      iconBg: 'bg-amber-50',
      iconColor: 'text-accent-dark',
      filterKey: 'TYPE_AE',
      alert: false,
    },
    {
      label: 'Serious AEs (SAE)',
      value: metrics.sae,
      subtext: metrics.sae > 0 ? 'Requires regulatory vigilance' : 'Zero SAEs recorded',
      icon: AlertOctagon,
      iconBg: metrics.sae > 0 ? 'bg-rose-50' : 'bg-stone-100',
      iconColor: metrics.sae > 0 ? 'text-primary-dark' : 'text-ink-muted',
      filterKey: 'TYPE_SAE',
      alert: metrics.sae > 0,
    },
    {
      label: 'Ongoing Events',
      value: metrics.ongoing,
      subtext: 'Active clinical monitoring',
      icon: Clock,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-700',
      filterKey: 'ONGOING',
      alert: false,
    },
    {
      label: 'PI Review Required',
      value: metrics.piReviewRequired,
      subtext: metrics.piReviewRequired > 0 ? 'Pending medical sign-off' : 'All events reviewed',
      icon: FileCheck,
      iconBg: metrics.piReviewRequired > 0 ? 'bg-red-50' : 'bg-stone-100',
      iconColor: metrics.piReviewRequired > 0 ? 'text-semantic-danger' : 'text-ink-muted',
      filterKey: 'PI_REVIEW_REQUIRED',
      alert: metrics.piReviewRequired > 0,
    },
    {
      label: 'Follow-ups Due / Overdue',
      value: metrics.followUpDue + metrics.overdueFollowUp,
      subtext:
        metrics.overdueFollowUp > 0
          ? `${metrics.overdueFollowUp} follow-up overdue!`
          : metrics.followUpDue > 0
          ? `${metrics.followUpDue} due shortly`
          : 'Zero pending follow-ups',
      icon: metrics.overdueFollowUp > 0 ? AlertTriangle : CalendarClock,
      iconBg:
        metrics.overdueFollowUp > 0
          ? 'bg-red-50'
          : metrics.followUpDue > 0
          ? 'bg-amber-50'
          : 'bg-stone-100',
      iconColor:
        metrics.overdueFollowUp > 0
          ? 'text-semantic-danger'
          : metrics.followUpDue > 0
          ? 'text-accent-dark'
          : 'text-ink-muted',
      filterKey: metrics.overdueFollowUp > 0 ? 'OVERDUE_FOLLOWUP' : 'FOLLOWUP_DUE',
      alert: metrics.overdueFollowUp > 0 || metrics.followUpDue > 0,
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
                  card.alert && card.filterKey.includes('OVERDUE')
                    ? 'text-semantic-danger'
                    : card.alert && card.filterKey === 'TYPE_SAE'
                    ? 'text-primary-dark'
                    : card.alert && card.filterKey === 'PI_REVIEW_REQUIRED'
                    ? 'text-semantic-danger'
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
