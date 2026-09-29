import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { safetyService } from '../services/safetyService';
import { SafetyEvent, PIReviewStatus, FollowUpStatus } from '../types';
import { SafetyEventTypeBadge } from '../components/safety/SafetyEventTypeBadge';
import { SafetySeverityBadge } from '../components/safety/SafetySeverityBadge';
import { SafetySeriousnessBadge } from '../components/safety/SafetySeriousnessBadge';
import { SafetyReviewBadge } from '../components/safety/SafetyReviewBadge';
import { SafetyFollowUpBadge } from '../components/safety/SafetyFollowUpBadge';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  ArrowLeft,
  Calendar,
  User,
  AlertCircle,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
} from 'lucide-react';

export const SafetyEventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { activeStudy, activeSite, activeStudyId, activeSiteId, isLoading: isStudyLoading } =
    useStudy();

  const [event, setEvent] = useState<SafetyEvent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!activeStudyId || !activeSiteId || !eventId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const data = await safetyService.getSafetyEventById(context, eventId);
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve safety event detail.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleUpdatePIReview = async (newStatus: PIReviewStatus) => {
    if (!activeStudyId || !activeSiteId || !eventId) return;

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await safetyService.updatePIReviewStatus(context, eventId, newStatus);
      if (updated) {
        setEvent(updated);
        setFeedbackMessage(
          newStatus === 'REVIEWED'
            ? 'Safety event successfully reviewed and signed off by PI.'
            : 'Event review status updated.'
        );
        setTimeout(() => setFeedbackMessage(null), 3500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update PI review status.');
    }
  };

  const handleUpdateFollowUp = async (newStatus: FollowUpStatus) => {
    if (!activeStudyId || !activeSiteId || !eventId) return;

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await safetyService.updateFollowUpStatus(
        context,
        eventId,
        newStatus,
        'Follow-up resolution confirmed by clinical research team.'
      );
      if (updated) {
        setEvent(updated);
        setFeedbackMessage('Safety follow-up status updated.');
        setTimeout(() => setFeedbackMessage(null), 3500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update follow-up status.');
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
        <ErrorState title="Error Loading Safety Event" message={error} onRetry={loadEvent} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-8">
        <EmptyState
          title="Safety Event Not Found"
          description={`No safety record was found matching ID "${eventId}" under the currently selected study (${activeStudy?.code}) and site (${activeSite?.name}).`}
          actionLabel="Return to Safety Directory"
          onAction={() => {}}
          icon={<AlertCircle className="w-6 h-6 text-semantic-danger" />}
        />
        <div className="mt-4 text-center">
          <Link to="/pi/safety">
            <Button variant="primary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Safety Log
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isSae = event.eventType === 'SAE';

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/pi/safety"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Safety Log</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="font-mono">{activeStudy?.code}</span>
          <span>&bull;</span>
          <span>{activeSite?.siteCode}</span>
        </div>
      </div>

      {/* Feedback Banner */}
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

      {/* Event Header Card */}
      <div
        className={`bg-surface border border-border rounded-sm p-5 shadow-subtle space-y-4 ${
          isSae ? 'border-l-4 border-l-primary' : ''
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-bold px-2 py-0.5 bg-rose-50 text-primary-dark border border-rose-200 rounded-sm">
                {event.id}
              </span>
              <SafetyEventTypeBadge type={event.eventType} size="md" />
              <SafetyReviewBadge status={event.piReviewStatus} size="md" />
              <span className="text-xs text-ink-secondary border-l border-border pl-2">
                Participant:{' '}
                <Link
                  to={`/pi/patients/${event.participantId}`}
                  className="font-mono font-bold text-primary hover:underline"
                >
                  {event.participantCode} ({event.participantInitials})
                </Link>
              </span>
            </div>

            <h2 className="text-xl font-bold font-heading text-ink">{event.title}</h2>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                Onset: <strong>{event.onsetDate}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                Site: <strong>{activeSite?.name}</strong>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Reported by: <strong>{event.reportedBy}</strong>
              </span>
            </div>
          </div>

          <div className="flex sm:items-center gap-2 shrink-0">
            <Link to={`/pi/patients/${event.participantId}`}>
              <Button variant="outline" size="sm" icon={<User className="w-3.5 h-3.5" />}>
                Subject Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* SAE Alert Banner if applicable */}
        {isSae && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm text-xs text-primary-dark flex items-start gap-2 leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            <div>
              <strong className="block font-semibold">Serious Adverse Event (SAE) Vigilance:</strong>
              <span>
                This event satisfies protocol seriousness criteria ({event.seriousness.replace(/_/g, ' ')}).
                Expedited sponsor and ethics board notifications must be verified by the Principal Investigator.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Clinical Narrative & Assessment vs Workflow & Follow-Up */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Narrative & Assessment (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Clinical Description Card */}
          <Card>
            <CardHeader
              title="Clinical Narrative & Event Description"
              subtitle="Detailed clinical observations, progression, and physical symptoms"
            />
            <CardContent className="space-y-4 text-xs">
              <div className="p-3.5 bg-surface-soft border border-border rounded-sm text-ink-secondary leading-relaxed text-xs">
                {event.description}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
                <div>
                  <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                    Onset Date
                  </span>
                  <span className="font-mono font-medium text-ink mt-0.5 block">
                    {event.onsetDate}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                    Resolution Date
                  </span>
                  <span className="font-mono font-medium text-ink mt-0.5 block">
                    {event.resolutionDate ? event.resolutionDate : 'Event Ongoing (Active)'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                    Lifecycle Status
                  </span>
                  <span className="font-semibold text-ink capitalize mt-0.5 block">
                    {event.status.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Assessment Card (Severity vs Seriousness separation) */}
          <Card>
            <CardHeader
              title="Clinical Assessment & Protocol Classifications"
              subtitle="Strict separation between intensity (severity) and regulatory criteria (seriousness)"
            />
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Severity Field */}
                <div className="p-3 bg-surface-soft border border-border rounded-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-ink-muted uppercase font-semibold">
                      Symptom Severity (Intensity)
                    </span>
                    <SafetySeverityBadge severity={event.severity} size="sm" />
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Graded per CTCAE criteria according to intensity of discomfort/pain.
                  </p>
                </div>

                {/* Seriousness Field */}
                <div className="p-3 bg-surface-soft border border-border rounded-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-ink-muted uppercase font-semibold">
                      Seriousness Criterion (Regulatory)
                    </span>
                    <SafetySeriousnessBadge seriousness={event.seriousness} size="sm" />
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1">
                    Independent of severity; based on regulatory outcome standards.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                {/* Causality Assessment */}
                <div>
                  <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                    Causality / Relatedness Assessment
                  </span>
                  <span className="font-semibold text-ink text-sm mt-0.5 block">
                    {event.causality.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-ink-muted mt-0.5 block italic">
                    Medical causality assessed by site investigator team.
                  </span>
                </div>

                {/* Action Taken */}
                <div>
                  <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                    Action Taken with Study Product
                  </span>
                  <span className="font-semibold text-ink text-sm mt-0.5 block">
                    {event.actionTaken.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-ink-muted mt-0.5 block italic">
                    Protocol intervention following event onset.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Workflow, PI Review & Follow-Up (1 Col) */}
        <div className="space-y-6">
          {/* PI Medical Review Card */}
          <Card>
            <CardHeader
              title="PI Medical Oversight"
              subtitle="Principal Investigator review & sign-off"
            />
            <CardContent className="space-y-4 text-xs">
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                  Current Review State
                </span>
                <div className="mt-1">
                  <SafetyReviewBadge status={event.piReviewStatus} size="md" />
                </div>
              </div>

              {event.reviewedBy ? (
                <div className="space-y-1 pt-2 border-t border-border">
                  <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                    Reviewer Sign-off
                  </span>
                  <div className="flex items-center gap-1.5 text-secondary-dark font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                    <span>{event.reviewedBy}</span>
                  </div>
                  {event.reviewedAt && (
                    <span className="text-[11px] text-ink-muted block font-mono">
                      {new Date(event.reviewedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              ) : (
                <div className="pt-2 border-t border-border text-ink-muted italic">
                  Event pending formal PI sign-off.
                </div>
              )}

              {/* Interactive Prototype Review Action Buttons */}
              <div className="pt-3 border-t border-border space-y-2">
                <span className="text-[11px] font-semibold text-primary block">
                  PI Review Actions (Prototype):
                </span>
                <div className="flex flex-col gap-2">
                  {event.piReviewStatus !== 'REVIEWED' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdatePIReview('REVIEWED')}
                      className="w-full py-1.5 px-3 bg-secondary text-surface text-xs font-semibold rounded-sm hover:bg-secondary-dark transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>Sign Off / Mark as Reviewed</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdatePIReview('UNDER_REVIEW')}
                      className="w-full py-1.5 px-3 bg-surface-soft border border-border text-ink-secondary text-xs font-medium rounded-sm hover:bg-stone-200 transition-colors"
                    >
                      <span>Re-open for Review</span>
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-ink-muted block italic">
                  Actions persist in active browser session.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Follow-up Tracking Card */}
          <Card>
            <CardHeader
              title="Clinical Follow-Up Tracking"
              subtitle="Resolution monitoring and repeat testing"
            />
            <CardContent className="space-y-3.5 text-xs">
              <div>
                <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                  Follow-up Status
                </span>
                <div className="mt-1">
                  <SafetyFollowUpBadge
                    status={event.followUpStatus}
                    dueDate={event.followUpDueDate}
                    size="md"
                  />
                </div>
              </div>

              {event.followUpNotes && (
                <div className="pt-2 border-t border-border">
                  <span className="text-[11px] text-ink-muted uppercase font-semibold block">
                    Follow-up Instructions / Notes
                  </span>
                  <p className="mt-1 text-ink leading-relaxed bg-surface-soft p-2 rounded-sm border border-border">
                    {event.followUpNotes}
                  </p>
                </div>
              )}

              {event.followUpStatus !== 'COMPLETED' && event.followUpStatus !== 'NOT_REQUIRED' && (
                <div className="pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => handleUpdateFollowUp('COMPLETED')}
                    className="w-full py-1 px-2.5 bg-surface-soft border border-border text-ink text-xs font-medium rounded-sm hover:bg-stone-200 transition-colors"
                  >
                    <span>Mark Follow-up as Completed</span>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reporting Timeline Metadata Card */}
          <Card>
            <CardHeader
              title="Audit & Regulatory Log"
              subtitle="Reporting timestamps"
            />
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Reported By:</span>
                <span className="font-medium text-ink">{event.reportedBy}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Reported Timestamp:</span>
                <span className="font-mono text-ink-secondary">
                  {new Date(event.reportedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-ink-muted">Last System Update:</span>
                <span className="font-mono text-ink-muted">
                  {new Date(event.lastUpdatedAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
