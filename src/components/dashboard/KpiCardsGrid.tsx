import React from 'react';
import { Users, TrendingUp, Calendar, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';

interface KpiCardsGridProps {
  enrolledParticipants: number;
  screenedParticipants: number;
  recruitmentPercent: number;
  recruitmentEnrolled: number;
  recruitmentTarget: number;
  upcomingVisits: number;
  overdueVisits: number;
  pendingActionsCount: number;
}

export const KpiCardsGrid: React.FC<KpiCardsGridProps> = ({
  enrolledParticipants,
  screenedParticipants,
  recruitmentPercent,
  recruitmentEnrolled,
  recruitmentTarget,
  upcomingVisits,
  overdueVisits,
  pendingActionsCount,
}) => {
  const cards = [
    {
      title: 'Enrolled Participants',
      value: enrolledParticipants.toString(),
      subtext: `${screenedParticipants} screened to date`,
      linkText: 'View Patients',
      linkTo: '/pi/patients',
      icon: Users,
      iconColor: 'text-primary',
      iconBg: 'bg-rose-50',
    },
    {
      title: 'Recruitment Progress',
      value: `${recruitmentPercent}%`,
      subtext: `${recruitmentEnrolled} of ${recruitmentTarget} target enrolled`,
      linkText: 'Recruitment Plan',
      linkTo: '#recruitment',
      icon: TrendingUp,
      iconColor: 'text-secondary',
      iconBg: 'bg-emerald-50',
    },
    {
      title: 'Upcoming Clinical Visits',
      value: upcomingVisits.toString(),
      subtext: overdueVisits > 0 ? `${overdueVisits} visits overdue` : 'All schedules on track',
      subtextWarning: overdueVisits > 0,
      linkText: 'View Schedule',
      linkTo: '/pi/visits',
      icon: Calendar,
      iconColor: 'text-accent-dark',
      iconBg: 'bg-amber-50',
    },
    {
      title: 'Pending PI Actions',
      value: pendingActionsCount.toString(),
      subtext: 'Requires investigator review/sign-off',
      subtextWarning: pendingActionsCount > 0,
      linkText: 'View All Actions',
      linkTo: '/pi/tasks',
      icon: AlertCircle,
      iconColor: 'text-semantic-danger',
      iconBg: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className="p-4 flex flex-col justify-between hover:border-border-strong transition-colors">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`w-8 h-8 rounded-sm ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl sm:text-3xl font-bold font-heading text-ink">
                {card.value}
              </div>

              <p className={`text-xs mt-1 ${card.subtextWarning ? 'text-semantic-danger font-medium' : 'text-ink-secondary'}`}>
                {card.subtext}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-border">
              <Link
                to={card.linkTo}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark group"
              >
                <span>{card.linkText}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
