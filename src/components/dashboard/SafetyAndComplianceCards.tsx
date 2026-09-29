import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { SafetySummary, ComplianceSummary, ComplianceSummaryMetrics } from '../../types';
import { useStudy } from '../../context/StudyContext';
import { complianceService } from '../../services/complianceService';
import { AlertTriangle, ArrowRight, AlertOctagon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SafetyAndComplianceProps {
  safety: SafetySummary;
  compliance: ComplianceSummary;
}

export const SafetyAndComplianceCards: React.FC<SafetyAndComplianceProps> = ({
  safety,
  compliance,
}) => {
  const { activeStudyId, activeSiteId } = useStudy();
  const [liveCompliance, setLiveCompliance] = useState<ComplianceSummaryMetrics | null>(null);

  useEffect(() => {
    if (activeStudyId && activeSiteId) {
      complianceService
        .getComplianceSummary({ studyId: activeStudyId, siteId: activeSiteId })
        .then(setLiveCompliance)
        .catch(() => {});
    }
  }, [activeStudyId, activeSiteId]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Section 6: Safety Summary */}
      <Card className="flex flex-col justify-between">
        <div>
          <CardHeader
            title="Trial Safety Vigilance"
            subtitle="Adverse events and safety reports requiring investigator oversight"
            action={
              safety.seriousAdverseEvents > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 bg-red-50 text-semantic-danger border border-red-200 rounded-sm">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {safety.seriousAdverseEvents} SAE Logged
                </span>
              ) : null
            }
          />
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-surface-soft border border-border rounded-sm text-center">
                <span className="text-[11px] font-semibold text-ink-muted uppercase block">Total AEs</span>
                <span className="text-xl font-bold font-heading text-ink">{safety.adverseEvents}</span>
                <span className="text-[10px] text-ink-muted block">Non-serious</span>
              </div>

              <div className="p-3 bg-red-50/70 border border-red-200 rounded-sm text-center">
                <span className="text-[11px] font-semibold text-semantic-danger uppercase block">SAE Events</span>
                <span className="text-xl font-bold font-heading text-semantic-danger">
                  {safety.seriousAdverseEvents}
                </span>
                <span className="text-[10px] text-semantic-danger font-medium block">Expedited</span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-sm text-center">
                <span className="text-[11px] font-semibold text-accent-dark uppercase block">Pending Sign-off</span>
                <span className="text-xl font-bold font-heading text-accent-dark">{safety.pendingReview}</span>
                <span className="text-[10px] text-accent-dark font-medium block">Requires PI</span>
              </div>

              <div className="p-3 bg-surface-soft border border-border rounded-sm text-center">
                <span className="text-[11px] font-semibold text-ink-muted uppercase block">Follow-up Req.</span>
                <span className="text-xl font-bold font-heading text-ink">{safety.followUpRequired}</span>
                <span className="text-[10px] text-ink-muted block">In progress</span>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="p-3 border-t border-border bg-surface-soft flex items-center justify-between text-xs">
          <span className="text-ink-secondary">ICH-GCP E6(R2) expedited reporting</span>
          <Link
            to="/pi/safety"
            className="text-primary font-semibold hover:underline inline-flex items-center gap-1 group"
          >
            <span>Open Safety Log</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Card>

      {/* Section 7: Protocol Compliance Summary */}
      <Card className="flex flex-col justify-between">
        <div>
          <CardHeader
            title="Protocol Compliance & Deviations"
            subtitle="Adherence tracking, deviations and corrective action plans (CAPA)"
            action={
              (liveCompliance ? liveCompliance.critical : compliance.criticalDeviations) === 0 ? (
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-secondary border border-emerald-200 rounded-sm">
                  0 Critical
                </span>
              ) : (
                <span className="text-xs font-bold px-2 py-0.5 bg-red-50 text-semantic-danger border border-red-200 rounded-sm flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" />
                  {liveCompliance ? liveCompliance.critical : compliance.criticalDeviations} Critical
                </span>
              )
            }
          />
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-surface-soft border border-border rounded-sm text-center">
                <span className="text-[11px] font-semibold text-ink-muted uppercase block">Open Deviations</span>
                <span className="text-xl font-bold font-heading text-ink">
                  {liveCompliance ? liveCompliance.open : compliance.openDeviations}
                </span>
                <span className="text-[10px] text-ink-muted block">Minor / Major</span>
              </div>

              <div className="p-3 bg-surface-soft border border-border rounded-sm text-center">
                <span className="text-[11px] font-semibold text-ink-muted uppercase block">Critical Deviations</span>
                <span className="text-xl font-bold font-heading text-semantic-danger">
                  {liveCompliance ? liveCompliance.critical : compliance.criticalDeviations}
                </span>
                <span className="text-[10px] text-secondary font-medium block">Zero Tolerance</span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-sm text-center">
                <span className="text-[11px] font-semibold text-accent-dark uppercase block">Pending CAPA</span>
                <span className="text-xl font-bold font-heading text-accent-dark">
                  {liveCompliance ? liveCompliance.capaPending : compliance.pendingCorrectiveActions}
                </span>
                <span className="text-[10px] text-accent-dark font-medium block">
                  {liveCompliance && liveCompliance.capaOverdue > 0
                    ? `${liveCompliance.capaOverdue} Overdue (!)`
                    : 'Action required'}
                </span>
              </div>
            </div>
          </CardContent>
        </div>

        <div className="p-3 border-t border-border bg-surface-soft flex items-center justify-between text-xs">
          <span className="text-ink-secondary">
            Last site audit: <strong>{compliance.lastAuditDate}</strong>
          </span>
          <Link
            to="/pi/compliance"
            className="text-primary font-semibold hover:underline inline-flex items-center gap-1 group"
          >
            <span>Review Compliance</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Card>
    </div>
  );
};
