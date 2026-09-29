import React from 'react';
import { Card } from '../ui/Card';
import { ComplianceSummaryMetrics } from '../../types';
import {
  FileText,
  AlertOctagon,
  AlertTriangle,
  FileCheck2,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface ComplianceSummaryCardsProps {
  metrics: ComplianceSummaryMetrics;
  activeFilter?: string;
  onFilterClick?: (filterKey: string) => void;
}

export const ComplianceSummaryCards: React.FC<ComplianceSummaryCardsProps> = ({
  metrics,
  activeFilter,
  onFilterClick,
}) => {
  const cards = [
    {
      label: 'Open Deviations',
      value: metrics.open,
      subtext: `${metrics.total} total recorded at site`,
      icon: FileText,
      iconBg: 'bg-stone-100',
      iconColor: 'text-ink-secondary',
      filterKey: 'STATUS_OPEN',
      alert: false,
    },
    {
      label: 'Critical Deviations',
      value: metrics.critical,
      subtext: metrics.critical > 0 ? 'Urgent CAPA & Sponsor alert' : 'Zero critical logged',
      icon: AlertOctagon,
      iconBg: metrics.critical > 0 ? 'bg-red-50' : 'bg-stone-100',
      iconColor: metrics.critical > 0 ? 'text-semantic-danger' : 'text-ink-muted',
      filterKey: 'CLASS_CRITICAL',
      alert: metrics.critical > 0,
    },
    {
      label: 'Major Deviations',
      value: metrics.major,
      subtext: 'Potential trial integrity impact',
      icon: AlertTriangle,
      iconBg: metrics.major > 0 ? 'bg-amber-50' : 'bg-stone-100',
      iconColor: metrics.major > 0 ? 'text-amber-800' : 'text-ink-muted',
      filterKey: 'CLASS_MAJOR',
      alert: false,
    },
    {
      label: 'PI Review Required',
      value: metrics.piReviewRequired,
      subtext: metrics.piReviewRequired > 0 ? 'Pending investigator sign-off' : 'All reviews completed',
      icon: FileCheck2,
      iconBg: metrics.piReviewRequired > 0 ? 'bg-red-50' : 'bg-stone-100',
      iconColor: metrics.piReviewRequired > 0 ? 'text-semantic-danger' : 'text-ink-muted',
      filterKey: 'REVIEW_REQUIRED',
      alert: metrics.piReviewRequired > 0,
    },
    {
      label: 'CAPA Pending',
      value: metrics.capaPending,
      subtext: 'Corrective actions underway',
      icon: Clock,
      iconBg: metrics.capaPending > 0 ? 'bg-blue-50' : 'bg-stone-100',
      iconColor: metrics.capaPending > 0 ? 'text-blue-800' : 'text-ink-muted',
      filterKey: 'CAPA_PENDING',
      alert: false,
    },
    {
      label: 'CAPA Overdue',
      value: metrics.capaOverdue,
      subtext: metrics.capaOverdue > 0 ? 'Exceeded remediation deadline' : 'Zero overdue milestones',
      icon: AlertCircle,
      iconBg: metrics.capaOverdue > 0 ? 'bg-red-50' : 'bg-stone-100',
      iconColor: metrics.capaOverdue > 0 ? 'text-semantic-danger' : 'text-ink-muted',
      filterKey: 'CAPA_OVERDUE',
      alert: metrics.capaOverdue > 0,
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
              <div className={`p-1.5 rounded-sm ${card.iconBg}`}>
                <Icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-bold font-mono ${
                    card.alert ? 'text-semantic-danger font-extrabold' : 'text-ink'
                  }`}
                >
                  {card.value}
                </span>
              </div>
              <p className="text-[10px] text-ink-muted truncate mt-0.5">{card.subtext}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
