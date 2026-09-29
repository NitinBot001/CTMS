import React from 'react';
import { Card } from '../ui/Card';
import { ParticipantSummaryMetrics } from '../../types';
import { Users, Clock, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';

interface ParticipantSummaryCardsProps {
  metrics: ParticipantSummaryMetrics;
  onFilterClick?: (status: string) => void;
}

export const ParticipantSummaryCards: React.FC<ParticipantSummaryCardsProps> = ({
  metrics,
  onFilterClick,
}) => {
  const cards = [
    {
      label: 'Total Participants',
      value: metrics.total,
      subtext: 'Across selected site',
      icon: Users,
      iconBg: 'bg-stone-100',
      iconColor: 'text-ink-secondary',
      filterKey: 'ALL',
    },
    {
      label: 'Screening / Eligible',
      value: metrics.screening,
      subtext: 'Pending full enrollment',
      icon: Clock,
      iconBg: 'bg-sky-50',
      iconColor: 'text-semantic-info',
      filterKey: 'SCREENING',
    },
    {
      label: 'Active on Trial',
      value: metrics.active,
      subtext: `${metrics.enrolled} total enrolled`,
      icon: UserCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-secondary',
      filterKey: 'ACTIVE',
    },
    {
      label: 'Completed Protocol',
      value: metrics.completed,
      subtext: 'Concluded follow-up',
      icon: CheckCircle2,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-700',
      filterKey: 'COMPLETED',
    },
    {
      label: 'Attention Required',
      value: metrics.attentionRequired,
      subtext: metrics.attentionRequired > 0 ? 'Requires PI action/review' : 'No overdue flags',
      icon: AlertTriangle,
      iconBg: metrics.attentionRequired > 0 ? 'bg-red-50' : 'bg-stone-100',
      iconColor: metrics.attentionRequired > 0 ? 'text-semantic-danger' : 'text-ink-muted',
      alert: metrics.attentionRequired > 0,
      filterKey: 'ATTENTION',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            className={`p-3.5 flex flex-col justify-between transition-all ${
              onFilterClick ? 'cursor-pointer hover:border-border-strong hover:shadow-card' : ''
            }`}
            onClick={() => onFilterClick && onFilterClick(card.filterKey)}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted truncate">
                {card.label}
              </span>
              <div
                className={`w-7 h-7 rounded-sm ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold font-heading ${
                  card.alert ? 'text-semantic-danger' : 'text-ink'
                }`}
              >
                {card.value}
              </span>
            </div>

            <p
              className={`text-[11px] mt-1 truncate ${
                card.alert ? 'text-semantic-danger font-medium' : 'text-ink-muted'
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
