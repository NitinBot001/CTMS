import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { useAuth } from '../context/AuthContext';
import { participantService } from '../services/participantService';
import { visitService } from '../services/visitService';
import { safetyService } from '../services/safetyService';
import { complianceService } from '../services/complianceService';
import { Participant, ParticipantVisit, ParticipantSafetySummary, ParticipantComplianceSummary } from '../types';
import { ParticipantStatusBadge } from '../components/participants/ParticipantStatusBadge';
import { VisitStatusBadge } from '../components/visits/VisitStatusBadge';
import { SafetyEventTypeBadge } from '../components/safety/SafetyEventTypeBadge';
import { SafetySeverityBadge } from '../components/safety/SafetySeverityBadge';
import { SafetyReviewBadge } from '../components/safety/SafetyReviewBadge';
import { DeviationClassificationBadge } from '../components/compliance/DeviationClassificationBadge';
import { DeviationStatusBadge } from '../components/compliance/DeviationStatusBadge';
import { DeviationCapaBadge } from '../components/compliance/DeviationCapaBadge';
import { ScheduleVisitModal } from '../components/visits/ScheduleVisitModal';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Plus,
} from 'lucide-react';

export const ParticipantDetailPage: React.FC = () => {
  const { participantId } = useParams<{ participantId: string }>();
  const { activeStudy, activeSite, activeStudyId, activeSiteId, isLoading: isStudyLoading } = useStudy();
  const { effectivePermissions } = useAuth();
  const canEditVisits = effectivePermissions.some((p) => p.id === 'VISITS_EDIT');

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participantVisits, setParticipantVisits] = useState<ParticipantVisit[]>([]);
  const [safetySummary, setSafetySummary] = useState<ParticipantSafetySummary | null>(null);
  const [complianceSummary, setComplianceSummary] = useState<ParticipantComplianceSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const loadParticipant = useCallback(async () => {
    if (!activeStudyId || !activeSiteId || !participantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [data, visitsData, safetyData, complianceData] = await Promise.all([
        participantService.getParticipant(context, participantId),
        visitService.getParticipantVisits(context, participantId),
        safetyService.getParticipantSafetySummary(context, participantId),
        complianceService.getParticipantComplianceSummary(context, participantId),
      ]);
      setParticipant(data);
      setParticipantVisits(visitsData);
      setSafetySummary(safetyData);
      setComplianceSummary(complianceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve participant detail.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, participantId]);

  useEffect(() => {
    loadParticipant();
  }, [loadParticipant]);

  if (isStudyLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="bg-surface p-6 border border-border rounded-sm space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface p-6 border border-border rounded-sm h-48" />
          <div className="bg-surface p-6 border border-border rounded-sm h-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorState
          title="Error Loading Participant Detail"
          message={error}
          onRetry={loadParticipant}
        />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="py-8">
        <EmptyState
          title="Participant Not Found"
          description={`No participant record was found matching ID "${participantId}" under the currently selected study (${activeStudy?.code}) and site (${activeSite?.name}).`}
          actionLabel="Return to Participants Directory"
          onAction={() => {}}
          icon={<AlertCircle className="w-6 h-6 text-semantic-danger" />}
        />
        <div className="mt-4 text-center">
          <Link to="/pi/patients">
            <Button variant="primary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/pi/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Participants Directory</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="font-mono">{activeStudy?.code}</span>
          <span>&bull;</span>
          <span>{activeSite?.siteCode}</span>
        </div>
      </div>

      {/* Participant Header Profile Card */}
      <div className="bg-surface border border-border rounded-sm p-5 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-bold px-2 py-0.5 bg-rose-50 text-primary-dark border border-rose-200 rounded-sm">
                {participant.participantCode}
              </span>
              <ParticipantStatusBadge status={participant.status} size="md" />
              <span className="text-xs text-ink-secondary border-l border-border pl-2 font-medium">
                Initials: <strong>{participant.initials}</strong>
              </span>
              <span className="text-xs text-ink-secondary border-l border-border pl-2">
                {participant.age} Years &bull; {participant.sex === 'M' ? 'Male' : participant.sex === 'F' ? 'Female' : participant.sex}
              </span>
            </div>

            <h2 className="text-xl font-bold font-heading text-ink">
              Subject Overview — {participant.participantCode}
            </h2>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Screening ID: <strong>{participant.screeningCode}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                Site: <strong>{activeSite?.name}</strong>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Coordinator: <strong>{participant.assignedCoordinatorName}</strong>
              </span>
            </div>
          </div>

          <div className="flex sm:items-center gap-2 shrink-0">
            <span className="text-xs bg-surface-soft border border-border px-3 py-1.5 rounded-sm text-ink-secondary font-medium">
              Protocol Phase: <strong>{participant.phase}</strong>
            </span>
          </div>
        </div>

        {/* Attention Banner if flagged */}
        {participant.attentionRequired && participant.attentionReason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-semantic-danger flex items-start gap-2 leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Operational Oversight Alert:</strong>
              <span>{participant.attentionReason}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Identity & Enrollment vs Operational Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity & Enrollment Card */}
        <Card>
          <CardHeader
            title="Screening & Enrollment Information"
            subtitle="Protocol milestones and eligibility verification"
          />
          <CardContent className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3 py-1">
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">Screening Date</span>
                <span className="font-medium text-ink">{participant.screeningDate}</span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">Enrollment Date</span>
                <span className="font-medium text-ink">
                  {participant.enrollmentDate ? participant.enrollmentDate : 'Not Enrolled (In Screening/Pre-screen)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-1 border-t border-border">
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">Current Protocol Phase</span>
                <span className="font-medium text-ink">{participant.phase}</span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">Record Created</span>
                <span className="font-medium text-ink">
                  {new Date(participant.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <span className="text-[11px] text-ink-muted uppercase font-semibold block">Informed Consent Status</span>
              <div className="flex items-center gap-1.5 text-secondary font-medium mt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Signed GCP-Compliant Written Informed Consent on Record</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational & Clinical Oversight Card */}
        <Card>
          <CardHeader
            title="Operational & Visit Schedule"
            subtitle="Upcoming appointments and site coordinator assignments"
          />
          <CardContent className="space-y-3.5 text-xs">
            <div className="py-1">
              <span className="text-[11px] text-ink-muted uppercase font-semibold block">Next Scheduled Activity</span>
              {participant.nextActivityName ? (
                <div className="mt-1 p-2.5 bg-surface-soft border border-border rounded-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{participant.nextActivityName}</span>
                    <span className="font-mono text-accent-dark font-medium flex items-center gap-1 shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      {participant.nextActivityDate}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-ink-muted italic block mt-1">No pending visits scheduled.</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 py-1 border-t border-border">
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">Last Recorded Activity</span>
                <span className="font-medium text-ink block mt-0.5">{participant.lastActivityName}</span>
                <span className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {participant.lastActivityDate}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">Assigned Coordinator</span>
                <span className="font-medium text-ink block mt-0.5">{participant.assignedCoordinatorName}</span>
                <span className="text-[11px] text-ink-muted">Clinical Research Team</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protocol Visit Schedule Section (Segment C) */}
      <Card>
        <CardHeader
          title="Protocol Visit Schedule"
          subtitle="Participant-specific timeline of study visits, windows, and procedural checklists"
          action={
            canEditVisits ? (
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Visit</span>
              </button>
            ) : undefined
          }
        />
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {participantVisits && participantVisits.length > 0 ? (
              participantVisits.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-surface-soft/60"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
                        {v.visitCode}
                      </span>
                      <span className="font-semibold text-ink">{v.visitName}</span>
                      <VisitStatusBadge status={v.status} size="sm" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-muted">
                      <span>Target: <strong className="font-mono text-ink-secondary">{v.targetDate}</strong></span>
                      <span>&bull;</span>
                      <span>Window: {v.windowStart} to {v.windowEnd}</span>
                      <span>&bull;</span>
                      <span>Procedures: {v.completedActivities}/{v.totalActivities} completed</span>
                    </div>
                  </div>

                  <Link
                    to={`/pi/visits/${v.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark shrink-0"
                  >
                    <span>View Visit Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-ink-muted text-center flex items-center justify-center gap-2">
                <CalendarDays className="w-4 h-4 text-ink-muted" />
                <span>No protocol visits currently scheduled for this participant.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary Section */}
      <Card>
        <CardHeader
          title="Clinical Activity Log Summary"
          subtitle="Chronological list of visits, procedures, and laboratory evaluations"
        />
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {participant.recentActivities && participant.recentActivities.length > 0 ? (
              participant.recentActivities.map((act) => (
                <div key={act.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-surface-soft/60">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{act.activityName}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded-sm border ${
                          act.status === 'Completed'
                            ? 'bg-emerald-50 text-secondary border-emerald-200'
                            : act.status === 'Overdue'
                            ? 'bg-red-50 text-semantic-danger border-red-200'
                            : 'bg-surface-soft text-ink-secondary border-border'
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>
                    {act.performedBy && (
                      <span className="text-[11px] text-ink-muted flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Performed by: {act.performedBy}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-ink-muted font-mono">{act.date}</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-ink-muted text-center">
                No recent activity records available for this participant.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Safety History & Pharmacovigilance (Segment D) */}
      <Card>
        <CardHeader
          title="Safety History & Pharmacovigilance Log"
          subtitle="Adverse events, serious adverse events, and PI medical oversight for this participant"
        />
        <CardContent className="space-y-4 p-4 sm:p-5">
          {/* Safety Summary Metric Strip */}
          {safetySummary && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pb-3 border-b border-border text-center">
              <div className="bg-surface-soft p-2 rounded-sm border border-border">
                <span className="text-[10px] text-ink-muted uppercase font-semibold block">Total Events</span>
                <span className="font-mono font-bold text-sm text-ink">{safetySummary.totalEvents}</span>
              </div>
              <div className="bg-amber-50/50 p-2 rounded-sm border border-amber-200">
                <span className="text-[10px] text-accent-dark uppercase font-semibold block">AE Count</span>
                <span className="font-mono font-bold text-sm text-ink">{safetySummary.aeCount}</span>
              </div>
              <div className="bg-rose-50/50 p-2 rounded-sm border border-rose-200">
                <span className="text-[10px] text-primary-dark uppercase font-semibold block">SAE Count</span>
                <span className="font-mono font-bold text-sm text-primary-dark">{safetySummary.saeCount}</span>
              </div>
              <div className="bg-sky-50/50 p-2 rounded-sm border border-sky-200">
                <span className="text-[10px] text-sky-800 uppercase font-semibold block">Ongoing</span>
                <span className="font-mono font-bold text-sm text-sky-800">{safetySummary.ongoingCount}</span>
              </div>
              <div className="bg-stone-50 p-2 rounded-sm border border-border">
                <span className="text-[10px] text-ink-muted uppercase font-semibold block">Review Pending</span>
                <span className={`font-mono font-bold text-sm ${safetySummary.piReviewRequiredCount > 0 ? 'text-semantic-danger' : 'text-ink'}`}>
                  {safetySummary.piReviewRequiredCount}
                </span>
              </div>
            </div>
          )}

          {/* Safety Events List */}
          {safetySummary && safetySummary.events.length > 0 ? (
            <div className="space-y-2">
              {safetySummary.events.map((se) => (
                <div
                  key={se.id}
                  className={`p-3 rounded-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    se.eventType === 'SAE' ? 'bg-rose-50/30 border-rose-200' : 'bg-surface-soft border-border'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-ink bg-surface border border-border px-1.5 py-0.5 rounded-sm">
                        {se.id}
                      </span>
                      <SafetyEventTypeBadge type={se.eventType} size="sm" />
                      <SafetySeverityBadge severity={se.severity} size="sm" />
                      <span className="font-semibold text-ink">{se.title}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-muted">
                      <span>Onset: <strong className="font-mono text-ink-secondary">{se.onsetDate}</strong></span>
                      <span>&bull;</span>
                      <span>Status: {se.status.replace(/_/g, ' ')}</span>
                      <span>&bull;</span>
                      <span>Seriousness: {se.seriousness.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <SafetyReviewBadge status={se.piReviewStatus} size="sm" />
                    <Link
                      to={`/pi/safety/${se.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark ml-1"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-secondary bg-emerald-50/50 p-3 rounded-sm border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              <span>No adverse events or safety incidents reported for this subject.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Protocol Compliance & Deviations History (Segment E) */}
      <Card>
        <CardHeader
          title="Protocol Compliance History"
          subtitle="Protocol adherence, variances, and CAPA remediation tracking for this participant"
          action={
            <Link
              to="/pi/compliance"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Compliance Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <CardContent className="space-y-4 p-4 sm:p-5">
          {/* Summary strip if deviations exist */}
          {complianceSummary && complianceSummary.totalDeviations > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-3 border-b border-border text-center">
              <div className="bg-surface-soft p-2 rounded-sm border border-border">
                <span className="text-[10px] text-ink-muted uppercase font-semibold block">Total Deviations</span>
                <span className="font-mono font-bold text-sm text-ink">{complianceSummary.totalDeviations}</span>
              </div>
              <div className="bg-red-50/50 p-2 rounded-sm border border-red-200">
                <span className="text-[10px] text-semantic-danger uppercase font-semibold block">Critical</span>
                <span className="font-mono font-bold text-sm text-semantic-danger">{complianceSummary.criticalCount}</span>
              </div>
              <div className="bg-amber-50/50 p-2 rounded-sm border border-amber-200">
                <span className="text-[10px] text-amber-800 uppercase font-semibold block">Major</span>
                <span className="font-mono font-bold text-sm text-amber-800">{complianceSummary.majorCount}</span>
              </div>
              <div className="bg-stone-50 p-2 rounded-sm border border-border">
                <span className="text-[10px] text-ink-muted uppercase font-semibold block">Open Actions</span>
                <span className="font-mono font-bold text-sm text-ink">{complianceSummary.openCount}</span>
              </div>
            </div>
          )}

          {complianceSummary && complianceSummary.deviations.length > 0 ? (
            <div className="space-y-2">
              {complianceSummary.deviations.map((dev) => (
                <div
                  key={dev.id}
                  className={`p-3 rounded-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    dev.classification === 'CRITICAL' ? 'bg-red-50/20 border-red-200' : 'bg-surface-soft border-border'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-ink bg-surface border border-border px-1.5 py-0.5 rounded-sm">
                        {dev.id}
                      </span>
                      <DeviationClassificationBadge classification={dev.classification} size="sm" />
                      <span className="font-semibold text-ink">{dev.title}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-muted">
                      <span>Category: <strong className="text-ink-secondary">{dev.category.replace(/_/g, ' ')}</strong></span>
                      <span>&bull;</span>
                      <span>Occurred: <strong className="font-mono text-ink-secondary">{dev.occurrenceDate}</strong></span>
                      <span>&bull;</span>
                      <span>Status: {dev.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <DeviationStatusBadge status={dev.status} size="sm" />
                    <DeviationCapaBadge status={dev.capaStatus} targetDate={dev.capaTargetDate} size="sm" />
                    <Link
                      to={`/pi/compliance/${dev.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark ml-1"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-secondary bg-emerald-50/50 p-3 rounded-sm border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>No protocol deviations recorded for this participant.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {participant && (
        <ScheduleVisitModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          preselectedParticipantId={participant.id}
          onSuccess={loadParticipant}
        />
      )}
    </div>
  );
};
