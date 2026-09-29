import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { visitService } from '../services/visitService';
import { complianceService } from '../services/complianceService';
import { ParticipantVisit, ClinicalActivityStatus, ProtocolDeviation } from '../types';
import { VisitStatusBadge } from '../components/visits/VisitStatusBadge';
import { VisitWindowDisplay } from '../components/visits/VisitWindowDisplay';
import { ClinicalActivityList } from '../components/visits/ClinicalActivityList';
import { DeviationClassificationBadge } from '../components/compliance/DeviationClassificationBadge';
import { DeviationStatusBadge } from '../components/compliance/DeviationStatusBadge';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Building2,
  CheckCircle2,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';

export const VisitDetailPage: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const { activeStudy, activeSite, activeStudyId, activeSiteId, isLoading: isStudyLoading } =
    useStudy();

  const [visit, setVisit] = useState<ParticipantVisit | null>(null);
  const [visitDeviations, setVisitDeviations] = useState<ProtocolDeviation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadVisit = useCallback(async () => {
    if (!activeStudyId || !activeSiteId || !visitId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [data, devs] = await Promise.all([
        visitService.getVisitById(context, visitId),
        complianceService.getVisitDeviations(context, visitId),
      ]);
      setVisit(data);
      setVisitDeviations(devs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve visit details.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, visitId]);

  useEffect(() => {
    loadVisit();
  }, [loadVisit]);

  const handleToggleActivityStatus = async (
    activityId: string,
    newStatus: ClinicalActivityStatus
  ) => {
    if (!activeStudyId || !activeSiteId || !visitId) return;

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await visitService.updateActivityStatus(
        context,
        visitId,
        activityId,
        newStatus
      );

      if (updated) {
        setVisit(updated);
        setFeedbackMessage(
          newStatus === 'COMPLETED'
            ? 'Procedure signed off successfully.'
            : 'Procedure status reverted to pending.'
        );
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update procedure status.');
    }
  };

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
        <ErrorState title="Error Loading Visit Details" message={error} onRetry={loadVisit} />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="py-8">
        <EmptyState
          title="Visit Record Not Found"
          description={`No scheduled visit record was found matching ID "${visitId}" under the currently selected study (${activeStudy?.code}) and site (${activeSite?.name}).`}
          actionLabel="Return to Visits Schedule"
          onAction={() => {}}
          icon={<AlertCircle className="w-6 h-6 text-semantic-danger" />}
        />
        <div className="mt-4 text-center">
          <Link to="/pi/visits">
            <Button variant="primary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Schedule
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
          to="/pi/visits"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Visits Schedule</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="font-mono">{activeStudy?.code}</span>
          <span>&bull;</span>
          <span>{activeSite?.siteCode}</span>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-secondary-dark px-4 py-2.5 rounded-sm text-xs flex items-center justify-between shadow-subtle animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
            <span className="font-medium">{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-secondary hover:text-secondary-dark font-semibold text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Visit Header Profile Card */}
      <div className="bg-surface border border-border rounded-sm p-5 shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-bold px-2 py-0.5 bg-rose-50 text-primary-dark border border-rose-200 rounded-sm">
                {visit.visitCode}
              </span>
              <VisitStatusBadge status={visit.status} size="md" />
              <span className="text-xs text-ink-secondary border-l border-border pl-2 font-medium">
                Sequence: <strong>{visit.sequence}</strong>
              </span>
              <span className="text-xs text-ink-secondary border-l border-border pl-2">
                Participant:{' '}
                <Link
                  to={`/pi/patients/${visit.participantId}`}
                  className="font-mono font-bold text-primary hover:underline"
                >
                  {visit.participantCode} ({visit.participantInitials})
                </Link>
              </span>
            </div>

            <h2 className="text-xl font-bold font-heading text-ink">{visit.visitName}</h2>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Visit ID: <strong className="font-mono">{visit.id}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                Site: <strong>{activeSite?.name}</strong>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Assigned Staff: <strong>{visit.assignedStaff || 'Unassigned'}</strong>
              </span>
            </div>
          </div>

          <div className="flex sm:items-center gap-2 shrink-0">
            <Link to={`/pi/patients/${visit.participantId}`}>
              <Button variant="outline" size="sm" icon={<User className="w-3.5 h-3.5" />}>
                Participant Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Protocol Window & Timing */}
      <VisitWindowDisplay
        targetDate={visit.targetDate}
        windowStart={visit.windowStart}
        windowEnd={visit.windowEnd}
        status={visit.status}
      />

      {/* Main Grid: Procedures vs Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Procedures Checklist (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Required & Optional Clinical Procedures"
              subtitle="Mandated clinical trial evaluations and sample collections for this visit"
            />
            <CardContent className="p-4 sm:p-5">
              <ClinicalActivityList
                activities={visit.activities}
                onToggleStatus={handleToggleActivityStatus}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Metadata & Notes (1 Col) */}
        <div className="space-y-6">
          {/* Visit Completion Metadata */}
          <Card>
            <CardHeader
              title="Operational Overview"
              subtitle="Completion and audit timestamps"
            />
            <CardContent className="space-y-3.5 text-xs">
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                  Target Date
                </span>
                <span className="font-mono font-medium text-ink flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {visit.targetDate}
                </span>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                  Completion Record
                </span>
                {visit.completedDate ? (
                  <span className="font-medium text-secondary-dark flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                    Concluded on {visit.completedDate}
                  </span>
                ) : (
                  <span className="text-ink-muted italic block mt-0.5">Pending completion</span>
                )}
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                  Procedures Summary
                </span>
                <div className="mt-1 flex items-center justify-between text-xs font-mono">
                  <span>Completed:</span>
                  <span className="font-bold text-secondary">
                    {visit.completedActivities} / {visit.totalActivities}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono mt-0.5">
                  <span>Required Incomplete:</span>
                  <span
                    className={
                      visit.requiredIncompleteActivities > 0
                        ? 'font-bold text-semantic-danger'
                        : 'text-ink-muted'
                    }
                  >
                    {visit.requiredIncompleteActivities}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Notes & Protocol Instructions */}
          <Card>
            <CardHeader
              title="Clinical Notes & Observations"
              subtitle="Recorded by site study team"
            />
            <CardContent className="space-y-3 text-xs">
              {visit.notes ? (
                <div className="p-3 bg-surface-soft border border-border rounded-sm text-ink-secondary leading-relaxed">
                  {visit.notes}
                </div>
              ) : (
                <span className="text-ink-muted italic block">
                  No investigator notes recorded for this visit.
                </span>
              )}

              <div className="pt-2 border-t border-border text-[11px] text-ink-muted flex items-start gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-ink-muted shrink-0 mt-0.5" />
                <span>
                  All changes made to procedure checklists and notes are tracked in the study audit trail.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Protocol Deviations Linked to this Visit (Segment E) */}
          <Card>
            <CardHeader
              title="Protocol Deviations"
              subtitle="Operational variances linked to this specific study visit"
              action={
                <Link
                  to="/pi/compliance"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>All Deviations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <CardContent className="space-y-3 text-xs p-4">
              {visitDeviations.length > 0 ? (
                <div className="space-y-2">
                  {visitDeviations.map((dev) => (
                    <div
                      key={dev.id}
                      className={`p-3 rounded-sm border ${
                        dev.classification === 'CRITICAL'
                          ? 'bg-red-50/30 border-red-200'
                          : 'bg-surface-soft border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-ink bg-surface border border-border px-1.5 py-0.5 rounded-sm">
                            {dev.id}
                          </span>
                          <DeviationClassificationBadge classification={dev.classification} size="xs" />
                        </div>
                        <DeviationStatusBadge status={dev.status} size="xs" />
                      </div>
                      <p className="font-semibold text-ink line-clamp-1">{dev.title}</p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/60 text-[11px] text-ink-muted">
                        <span>Category: {dev.category.replace(/_/g, ' ')}</span>
                        <Link
                          to={`/pi/compliance/${dev.id}`}
                          className="font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-sm text-secondary text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No protocol deviations recorded for this visit.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
