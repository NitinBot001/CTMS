import React from 'react';
import { Card } from '../ui/Card';
import { DocumentSummaryMetrics } from '../../types';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface DocumentSummaryCardsProps {
  metrics: DocumentSummaryMetrics;
  activeFilter?: string;
  onFilterClick?: (filterKey: string) => void;
}

export const DocumentSummaryCards: React.FC<DocumentSummaryCardsProps> = ({
  metrics,
  activeFilter,
  onFilterClick,
}) => {
  const cards = [
    {
      label: 'Total Documents',
      value: metrics.total,
      subtext: 'Registered study documents',
      icon: FileText,
      iconBg: 'bg-stone-100',
      iconColor: 'text-primary',
      filterKey: 'ALL',
      alert: false,
    },
    {
      label: 'Active',
      value: metrics.active,
      subtext: 'Valid & current versions',
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-700',
      filterKey: 'ACTIVE',
      alert: false,
    },
    {
      label: 'Expiring Soon',
      value: metrics.expiringSoon,
      subtext: 'Expires within 30 days',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
      filterKey: 'EXPIRING_SOON',
      alert: metrics.expiringSoon > 0,
    },
    {
      label: 'Expired',
      value: metrics.expired,
      subtext: 'Past validity threshold',
      icon: AlertTriangle,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-700',
      filterKey: 'EXPIRED',
      alert: metrics.expired > 0,
    },
    {
      label: 'Required Documents',
      value: metrics.required,
      subtext: 'Mandatory trial records',
      icon: ShieldCheck,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-700',
      filterKey: 'REQUIRED',
      alert: false,
    },
    {
      label: 'Action Required',
      value: metrics.actionRequired,
      subtext: 'Expired/draft required docs',
      icon: AlertCircle,
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-800',
      filterKey: 'ACTION_REQUIRED',
      alert: metrics.actionRequired > 0,
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
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-ink-muted leading-tight">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-sm ${card.iconBg}`}>
                <IconComponent className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-bold font-heading ${
                    card.alert && card.value > 0
                      ? 'text-rose-700'
                      : 'text-ink'
                  }`}
                >
                  {card.value}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5 truncate">
                {card.subtext}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
