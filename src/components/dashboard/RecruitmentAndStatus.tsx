import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { RecruitmentData, ParticipantSummary } from '../../types';
import { Users, CheckCircle, Clock, UserMinus } from 'lucide-react';

interface RecruitmentAndStatusProps {
  recruitment: RecruitmentData;
  participantSummary: ParticipantSummary;
}

export const RecruitmentAndStatus: React.FC<RecruitmentAndStatusProps> = ({
  recruitment,
  participantSummary,
}) => {
  const { target, enrolled, remaining, progressPercent } = recruitment;
  const { screened, active, completed, withdrawn } = participantSummary;

  // Calculate percentages for participant distribution
  const activePercent = enrolled > 0 ? Math.round((active / enrolled) * 100) : 0;
  const completedPercent = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;
  const withdrawnPercent = enrolled > 0 ? Math.round((withdrawn / enrolled) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" id="recruitment">
      {/* Section 3: Recruitment Progress */}
      <Card>
        <CardHeader
          title="Site Recruitment Progress"
          subtitle="Participant accrual vs protocol site target"
          action={
            <span className="text-xs font-semibold px-2 py-0.5 bg-surface-soft border border-border text-ink rounded-sm">
              Target: {target}
            </span>
          }
        />
        <CardContent className="space-y-5">
          {/* Progress Bar & Percent */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm font-semibold text-ink">Enrollment Milestone</span>
              <span className="text-2xl font-bold font-heading text-secondary">
                {progressPercent.toFixed(1)}%
              </span>
            </div>

            {/* Custom accessible progress bar */}
            <div
              className="w-full h-3.5 bg-surface-soft rounded-sm overflow-hidden border border-border"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-secondary transition-all duration-500 rounded-sm"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
          </div>

          {/* Accrual Breakdown Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-surface-soft border border-border p-3 rounded-sm text-center">
              <span className="text-[11px] font-semibold text-ink-muted uppercase block">Enrolled</span>
              <span className="text-lg font-bold font-heading text-ink">{enrolled}</span>
              <span className="text-[10px] text-secondary font-medium block">Active in trial</span>
            </div>

            <div className="bg-surface-soft border border-border p-3 rounded-sm text-center">
              <span className="text-[11px] font-semibold text-ink-muted uppercase block">Remaining</span>
              <span className="text-lg font-bold font-heading text-primary">{remaining}</span>
              <span className="text-[10px] text-ink-muted block">To reach target</span>
            </div>

            <div className="bg-surface-soft border border-border p-3 rounded-sm text-center">
              <span className="text-[11px] font-semibold text-ink-muted uppercase block">Site Target</span>
              <span className="text-lg font-bold font-heading text-ink">{target}</span>
              <span className="text-[10px] text-ink-muted block">Protocol quota</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Participant Status Distribution */}
      <Card>
        <CardHeader
          title="Participant Trial Status"
          subtitle={`Total ${screened} participants screened across cohort`}
          action={
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-secondary border border-emerald-200 rounded-sm">
              {enrolled} Enrolled
            </span>
          }
        />
        <CardContent className="space-y-4">
          {/* Segmented Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-ink-muted mb-1.5 font-medium">
              <span>Active ({activePercent}%)</span>
              <span>Completed ({completedPercent}%)</span>
              <span>Withdrawn ({withdrawnPercent}%)</span>
            </div>
            <div className="w-full h-3.5 bg-surface-soft rounded-sm overflow-hidden border border-border flex">
              <div
                className="h-full bg-secondary"
                style={{ width: `${activePercent}%` }}
                title={`Active: ${active}`}
              />
              <div
                className="h-full bg-accent"
                style={{ width: `${completedPercent}%` }}
                title={`Completed: ${completed}`}
              />
              <div
                className="h-full bg-red-400"
                style={{ width: `${withdrawnPercent}%` }}
                title={`Withdrawn: ${withdrawn}`}
              />
            </div>
          </div>

          {/* Metric cards list */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 bg-surface-soft border border-border rounded-sm">
              <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-1">
                <Users className="w-3.5 h-3.5 text-ink-secondary" />
                <span>Screened</span>
              </div>
              <span className="text-base font-bold font-heading text-ink">{screened}</span>
            </div>

            <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-sm">
              <div className="flex items-center gap-1.5 text-xs text-secondary-dark mb-1">
                <Clock className="w-3.5 h-3.5 text-secondary" />
                <span>Active</span>
              </div>
              <span className="text-base font-bold font-heading text-secondary">{active}</span>
            </div>

            <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-sm">
              <div className="flex items-center gap-1.5 text-xs text-accent-dark mb-1">
                <CheckCircle className="w-3.5 h-3.5 text-accent" />
                <span>Completed</span>
              </div>
              <span className="text-base font-bold font-heading text-accent-dark">{completed}</span>
            </div>

            <div className="p-2.5 bg-red-50/50 border border-red-200 rounded-sm">
              <div className="flex items-center gap-1.5 text-xs text-semantic-danger mb-1">
                <UserMinus className="w-3.5 h-3.5 text-semantic-danger" />
                <span>Withdrawn</span>
              </div>
              <span className="text-base font-bold font-heading text-semantic-danger">{withdrawn}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
