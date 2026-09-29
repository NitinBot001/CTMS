import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { complianceService } from '../services/complianceService';
import {
  ProtocolDeviation,
  DeviationStatus,
} from '../types';
import { DeviationClassificationBadge } from '../components/compliance/DeviationClassificationBadge';
import { DeviationStatusBadge } from '../components/compliance/DeviationStatusBadge';
import { DeviationCapaBadge } from '../components/compliance/DeviationCapaBadge';
import { DeviationReviewBadge } from '../components/compliance/DeviationReviewBadge';
import { DeviationScopeBadge } from '../components/compliance/DeviationScopeBadge';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  FileCheck2,
  Play,
  Check,
} from 'lucide-react';

export const ComplianceDeviationDetailPage: React.FC = () => {
  const { deviationId } = useParams<{ deviationId: string }>();
  const { activeStudy, activeSite, activeStudyId, activeSiteId, isLoading: isStudyLoading } =
    useStudy();

  const [deviation, setDeviation] = useState<ProtocolDeviation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadDeviation = useCallback(async () => {
    if (!activeStudyId || !activeSiteId || !deviationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const data = await complianceService.getDeviationById(context, deviationId);
      setDeviation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve deviation detail.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, deviationId]);

  useEffect(() => {
    loadDeviation();
  }, [loadDeviation]);

  // Handle PI Review Sign-Off
  const handlePISignOff = async () => {
    if (!activeStudyId || !activeSiteId || !deviationId) return;

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await complianceService.updateReviewStatus(
        context,
        deviationId,
        'REVIEWED',
        'Dr. Ananya Sharma (PI)'
      );

      if (updated) {
        setDeviation(updated);
        setFeedbackMessage('Principal Investigator sign-off successfully recorded in audit metadata.');
        setTimeout(() => setFeedbackMessage(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record PI review sign-off.');
    }
  };

  // Handle CAPA Start Action
  const handleStartCapa = async () => {
    if (!activeStudyId || !activeSiteId || !deviationId) return;

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await complianceService.updateCapaStatus(
        context,
        deviationId,
        'IN_PROGRESS',
        'CAPA action plan activated and assigned to clinical research team.'
      );

      // If deviation was in ACTION_REQUIRED, update status to CAPA_IN_PROGRESS
      if (updated && updated.status === 'ACTION_REQUIRED') {
        const withStatus = await complianceService.updateDeviationStatus(
          context,
          deviationId,
          'CAPA_IN_PROGRESS'
        );
        if (withStatus) setDeviation(withStatus);
      } else if (updated) {
        setDeviation(updated);
      }

      setFeedbackMessage('CAPA remediation status updated to In Progress.');
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch {
      setError('Failed to update CAPA status.');
    }
  };

  // Handle CAPA Complete Action
  const handleCompleteCapa = async () => {
    if (!activeStudyId || !activeSiteId || !deviationId) return;

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await complianceService.updateCapaStatus(
        context,
        deviationId,
        'COMPLETED',
        'CAPA remediation actions fully verified and completed.'
      );

      if (updated) {
        setDeviation(updated);
        setFeedbackMessage('CAPA marked as Completed. Deviation moved to Resolved status.');
        setTimeout(() => setFeedbackMessage(null), 5000);
      }
    } catch {
      setError('Failed to complete CAPA.');
    }
  };

  // Handle Closure Action
  const handleCloseDeviation = async () => {
    if (!activeStudyId || !activeSiteId || !deviationId) return;

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await complianceService.updateDeviationStatus(
        context,
        deviationId,
        'CLOSED'
      );

      if (updated) {
        setDeviation(updated);
        setFeedbackMessage('Protocol deviation formally closed.');
        setTimeout(() => setFeedbackMessage(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close deviation.');
    }
  };

  if (isStudyLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorState
          title="Error Loading Deviation Record"
          message={error}
          onRetry={loadDeviation}
        />
      </div>
    );
  }

  if (!deviation) {
    return (
      <div className="py-8">
        <EmptyState
          title="Protocol Deviation Record Not Found"
          description={`No deviation matching ID "${deviationId}" was found under the currently active study (${activeStudy?.code}) and site (${activeSite?.name}).`}
          actionLabel="Return to Compliance Directory"
          onAction={() => {}}
          icon={<AlertCircle className="w-6 h-6 text-semantic-danger" />}
        />
        <div className="mt-4 text-center">
          <Link to="/pi/compliance">
            <Button variant="primary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Compliance Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Lifecycle step tracker configuration
  const lifecycleSteps: { status: DeviationStatus; label: string }[] = [
    { status: 'REPORTED', label: '1. Reported' },
    { status: 'UNDER_REVIEW', label: '2. Under Review' },
    { status: 'ACTION_REQUIRED', label: '3. Action Required' },
    { status: 'CAPA_IN_PROGRESS', label: '4. CAPA Active' },
    { status: 'RESOLVED', label: '5. Resolved' },
    { status: 'CLOSED', label: '6. Closed' },
  ];

  const currentStepIdx = lifecycleSteps.findIndex((s) => s.status === deviation.status);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/pi/compliance"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Protocol Compliance Directory</span>
        </Link>

        <span className="text-xs text-ink-muted">
          Active Site: <strong className="text-ink">{activeSite?.name}</strong>
        </span>
      </div>

      {/* Confirmation / Feedback Message */}
      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-sm text-xs text-secondary-dark flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header Clinical Summary Card */}
      <div
        className={`p-5 rounded-sm border ${
          deviation.classification === 'CRITICAL'
            ? 'bg-red-50/20 border-red-200'
            : 'bg-surface border-border'
        } shadow-subtle`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-sm bg-surface border border-border px-2 py-0.5 rounded-sm text-ink">
                {deviation.id}
              </span>
              <DeviationScopeBadge scope={deviation.scope} size="sm" />
              <DeviationClassificationBadge
                classification={deviation.classification}
                size="md"
              />
              <DeviationStatusBadge status={deviation.status} size="md" />
            </div>

            <h1 className="text-xl font-heading font-bold text-ink leading-snug">
              {deviation.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-ink-secondary" />
                Occurred: <strong className="font-mono text-ink">{deviation.occurrenceDate}</strong>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-ink-secondary" />
                Detected: <strong className="font-mono text-ink">{deviation.detectionDate}</strong>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-ink-secondary" />
                Study: <strong className="text-ink">{activeStudy?.code}</strong> ({deviation.protocolVersion})
              </span>
            </div>
          </div>

          {/* Quick Status Badges */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                PI Oversight
              </span>
              <div className="mt-0.5">
                <DeviationReviewBadge status={deviation.reviewStatus} size="sm" />
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                Remediation
              </span>
              <div className="mt-0.5">
                <DeviationCapaBadge
                  status={deviation.capaStatus}
                  targetDate={deviation.capaTargetDate}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle Progress Track */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-[11px] font-semibold text-ink-muted mb-2">
            <span>Protocol Deviation Lifecycle</span>
            <span className="font-mono text-ink">
              Current: {deviation.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {lifecycleSteps.map((step, idx) => {
              const isCurrent = step.status === deviation.status;
              const isPast = idx < currentStepIdx;

              let stepBg = 'bg-surface-soft border-border text-ink-muted';
              if (isCurrent) {
                stepBg = 'bg-primary text-white border-primary font-bold shadow-sm';
              } else if (isPast) {
                stepBg = 'bg-emerald-50 text-secondary border-emerald-200 font-medium';
              }

              return (
                <div
                  key={step.status}
                  className={`p-2 rounded-sm border text-center text-xs transition-colors ${stepBg}`}
                >
                  <span className="block truncate">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Clinical & Protocol Context */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Protocol Context & Entity Linkage */}
          <Card>
            <CardHeader
              title="Protocol Context & Entity Linkage"
              subtitle="Protocol version, affected sections, and related trial records"
            />
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-surface-soft border border-border rounded-sm">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                    Protocol Version
                  </span>
                  <span className="font-bold text-sm text-ink block mt-0.5">
                    {deviation.protocolVersion}
                  </span>
                  <span className="text-[11px] text-ink-muted mt-1 block">
                    Active Study Protocol
                  </span>
                </div>

                <div className="p-3 bg-surface-soft border border-border rounded-sm">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                    Deviation Category
                  </span>
                  <span className="font-bold text-sm text-ink block mt-0.5">
                    {deviation.category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-ink-muted mt-1 block">
                    Operational Classification
                  </span>
                </div>

                <div className="p-3 bg-surface-soft border border-border rounded-sm sm:col-span-2">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                    Protocol Section
                  </span>
                  <span className="font-semibold text-xs text-ink block mt-0.5">
                    {deviation.protocolSection || 'Not explicitly specified'}
                  </span>
                </div>

                {/* Entity Linkage: Participant & Visit */}
                <div className="p-3 bg-surface-soft border border-border rounded-sm">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                    Subject Association
                  </span>
                  {deviation.participantId ? (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-ink">
                        {deviation.participantId}
                      </span>
                      <Link
                        to={`/pi/patients/${deviation.participantId}`}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        View Profile &rarr;
                      </Link>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-muted italic block mt-1">
                      No specific subject (Facility / Study-scoped)
                    </span>
                  )}
                </div>

                <div className="p-3 bg-surface-soft border border-border rounded-sm">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                    Related Visit
                  </span>
                  {deviation.visitId ? (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-ink">
                        {deviation.visitId}
                      </span>
                      <Link
                        to={`/pi/visits/${deviation.visitId}`}
                        className="text-xs text-primary hover:underline font-semibold"
                      >
                        View Visit &rarr;
                      </Link>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-muted italic block mt-1">
                      Not tied to a scheduled visit
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Narrative & Event Description */}
          <Card>
            <CardHeader
              title="Event Narrative & Circumstances"
              subtitle="Full narrative description recorded by site personnel"
            />
            <CardContent className="space-y-4 p-4 sm:p-5 text-xs">
              <div className="p-4 bg-surface-soft border border-border rounded-sm leading-relaxed text-ink font-body whitespace-pre-line">
                {deviation.description}
              </div>

              {/* Immediate Containment Action */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block mb-1">
                  Immediate Action Taken
                </span>
                {deviation.immediateAction ? (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-sm text-ink-secondary text-xs">
                    {deviation.immediateAction}
                  </div>
                ) : (
                  <p className="text-ink-muted italic">No immediate containment action recorded.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Root Cause Analysis */}
          <Card>
            <CardHeader
              title="Root Cause Analysis"
              subtitle="Investigator root cause categorization and systemic analysis"
            />
            <CardContent className="space-y-3 p-4 sm:p-5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase text-ink-muted">
                  Root Cause Category:
                </span>
                <span className="font-mono font-bold text-xs bg-stone-100 text-ink px-2 py-0.5 rounded-sm border border-border">
                  {deviation.rootCauseCategory.replace(/_/g, ' ')}
                </span>
              </div>

              {deviation.rootCauseDescription && (
                <div className="p-3 bg-surface-soft border border-border rounded-sm text-ink leading-relaxed">
                  {deviation.rootCauseDescription}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Actions, CAPA, Oversight & Audit */}
        <div className="space-y-6">
          {/* Classification & Regulatory Note */}
          <Card className="border-border">
            <CardHeader
              title="Deviation Classification"
              subtitle="Clinical & protocol impact categorization"
            />
            <CardContent className="space-y-3 p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Assigned Level:</span>
                <DeviationClassificationBadge
                  classification={deviation.classification}
                  size="md"
                />
              </div>

              <div className="p-3 bg-stone-50 border border-border rounded-sm text-[11px] text-ink-muted leading-relaxed">
                <span className="font-bold text-ink block mb-0.5">Clinical Protocol Note:</span>
                Classification is an operational compliance categorization for this prototype and
                should not be interpreted as a universal regulatory definition.
              </div>
            </CardContent>
          </Card>

          {/* CAPA Remediation Card */}
          <Card className="border-border">
            <CardHeader
              title="Corrective & Preventive Action"
              subtitle="CAPA plan and execution status"
            />
            <CardContent className="space-y-3.5 p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">CAPA Required:</span>
                <span className="font-bold text-ink">
                  {deviation.capaRequired ? 'Yes (Mandatory)' : 'No (Isolated Event)'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-muted">CAPA Status:</span>
                <DeviationCapaBadge
                  status={deviation.capaStatus}
                  targetDate={deviation.capaTargetDate}
                  size="sm"
                />
              </div>

              {deviation.capaTargetDate && (
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Remediation Target:</span>
                  <span className="font-mono font-bold text-ink">
                    {deviation.capaTargetDate}
                  </span>
                </div>
              )}

              {deviation.capaActionSummary && (
                <div className="p-2.5 bg-surface-soft border border-border rounded-sm">
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block mb-0.5">
                    Action Summary:
                  </span>
                  <p className="text-ink text-xs">{deviation.capaActionSummary}</p>
                </div>
              )}

              {/* Interactive CAPA Controls */}
              {deviation.capaRequired && (
                <div className="pt-2 border-t border-border flex flex-col gap-2">
                  {deviation.capaStatus === 'PENDING' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartCapa}
                      icon={<Play className="w-3.5 h-3.5 text-blue-600" />}
                      className="w-full justify-center"
                    >
                      Start CAPA Remediation
                    </Button>
                  )}

                  {deviation.capaStatus === 'IN_PROGRESS' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCompleteCapa}
                      icon={<Check className="w-3.5 h-3.5" />}
                      className="w-full justify-center"
                    >
                      Mark CAPA Completed
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* PI Review & Medical Sign-Off Card */}
          <Card className="border-border">
            <CardHeader
              title="Investigator Review & Sign-Off"
              subtitle="Principal Investigator clinical oversight"
            />
            <CardContent className="space-y-3.5 p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Review Status:</span>
                <DeviationReviewBadge status={deviation.reviewStatus} size="sm" />
              </div>

              {deviation.reviewedBy ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-sm space-y-1">
                  <div className="flex items-center gap-1.5 text-secondary font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Signed Off by PI</span>
                  </div>
                  <p className="font-mono text-ink text-[11px]">{deviation.reviewedBy}</p>
                  {deviation.reviewedAt && (
                    <p className="text-[10px] text-ink-muted">
                      Timestamp: {new Date(deviation.reviewedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-sm text-accent-dark flex items-start gap-2 text-[11px]">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      This protocol deviation requires formal review and acknowledgement by the Principal Investigator.
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePISignOff}
                    icon={<ClipboardCheck className="w-4 h-4" />}
                    className="w-full justify-center"
                  >
                    Sign Off as Principal Investigator
                  </Button>
                </div>
              )}

              {/* Closure Control */}
              {deviation.status === 'RESOLVED' && (
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCloseDeviation}
                    icon={<FileCheck2 className="w-3.5 h-3.5 text-secondary" />}
                    className="w-full justify-center"
                  >
                    Final Closure of Deviation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit Metadata Card */}
          <Card className="border-border">
            <CardHeader
              title="Audit Metadata"
              subtitle="System record & tracking metadata"
            />
            <CardContent className="space-y-2.5 p-4 text-xs font-mono text-ink-secondary">
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="font-sans text-ink-muted text-[11px]">Reported By</span>
                <span className="font-bold text-ink">{deviation.reportedBy}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="font-sans text-ink-muted text-[11px]">Reported At</span>
                <span className="text-[11px]">
                  {new Date(deviation.reportedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/60">
                <span className="font-sans text-ink-muted text-[11px]">Last Updated</span>
                <span className="text-[11px]">
                  {new Date(deviation.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {deviation.resolvedAt && (
                <div className="flex justify-between items-center py-1 border-b border-border/60">
                  <span className="font-sans text-ink-muted text-[11px]">Resolved At</span>
                  <span className="text-[11px] text-secondary">
                    {new Date(deviation.resolvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {deviation.closedAt && (
                <div className="flex justify-between items-center py-1">
                  <span className="font-sans text-ink-muted text-[11px]">Closed At</span>
                  <span className="text-[11px] text-ink-muted">
                    {new Date(deviation.closedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
