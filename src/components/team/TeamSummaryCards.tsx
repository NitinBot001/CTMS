import React from 'react';
import { Card } from '../ui/Card';
import { TeamSummaryMetrics } from '../../types';
import { Users, UserCheck, Shield, Sparkles, Award } from 'lucide-react';

interface TeamSummaryCardsProps {
  metrics: TeamSummaryMetrics;
  activeFilter?: string;
  onFilterClick?: (filterKey: string) => void;
}

export const TeamSummaryCards: React.FC<TeamSummaryCardsProps> = ({
  metrics,
  activeFilter,
  onFilterClick,
}) => {
  const cards = [
    {
      label: 'Site Team Members',
      value: metrics.totalMembers,
      subtext: `${metrics.activeMembers} active · ${metrics.inactiveMembers} inactive`,
      icon: Users,
      iconBg: 'bg-stone-100',
      iconColor: 'text-primary',
      filterKey: 'ALL',
      alert: false,
    },
    {
      label: 'Active Staff',
      value: metrics.activeMembers,
      subtext: 'Operational in current scope',
      icon: UserCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-secondary',
      filterKey: 'STATUS_ACTIVE',
      alert: false,
    },
    {
      label: 'System Roles',
      value: metrics.systemRolesCount,
      subtext: 'Standard GCP clinical templates',
      icon: Shield,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-800',
      filterKey: 'ROLES_SYSTEM',
      alert: false,
    },
    {
      label: 'Custom Roles',
      value: metrics.customRolesCount,
      subtext: 'Site-specific delegated roles',
      icon: Sparkles,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-800',
      filterKey: 'ROLES_CUSTOM',
      alert: false,
    },
    {
      label: 'Total Delegations',
      value: metrics.totalAssignments,
      subtext: 'Active scoped assignments',
      icon: Award,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-800',
      filterKey: 'ASSIGNMENTS',
      alert: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
                <span className="text-2xl font-serif font-bold text-ink tracking-tight">
                  {card.value}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5 line-clamp-1">
                {card.subtext}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
