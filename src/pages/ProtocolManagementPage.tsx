import React, { useState, useEffect, useCallback } from 'react';
import { useStudy } from '../context/StudyContext';
import { useAuth } from '../context/AuthContext';
import { protocolService } from '../services/protocolService';
import {
  Protocol,
  ProtocolVersion,
  StudyProtocolConfig,
  ProtocolValidationResult,
  CreateProtocolVisitDefinitionInput,
  CreateEligibilityCriterionInput,
  CreateAssessmentDefinitionInput,
  CreateInvestigationDefinitionInput,
  CreateOutcomeDefinitionInput,
  CreateFormDefinitionInput,
} from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { CreateDraftVersionModal } from '../components/protocol/CreateDraftVersionModal';
import { AddProtocolVisitModal } from '../components/protocol/AddProtocolVisitModal';
import { AddEligibilityCriterionModal } from '../components/protocol/AddEligibilityCriterionModal';
import { AddAssessmentModal } from '../components/protocol/AddAssessmentModal';
import { AddInvestigationModal } from '../components/protocol/AddInvestigationModal';
import { AddOutcomeModal } from '../components/protocol/AddOutcomeModal';
import { AddFormModal } from '../components/protocol/AddFormModal';
import {
  BookOpen,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  Lock,
  Calendar,
  CheckSquare,
  Activity,
  FlaskConical,
  Target,
  FileText,
  Shield,
  Sparkles,
} from 'lucide-react';

type TabType =
  | 'overview'
  | 'visits'
  | 'eligibility'
  | 'assessments'
  | 'investigations'
  | 'outcomes'
  | 'forms'
  | 'governance';

export const ProtocolManagementPage: React.FC = () => {
  const { activeStudy, activeStudyId, isLoading: isStudyLoading } = useStudy();
  const { currentUser, currentRole, effectivePermissions } = useAuth();

  const canManage = effectivePermissions.some((p) => p.id === 'STUDY_MANAGE');

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [versions, setVersions] = useState<ProtocolVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [config, setConfig] = useState<StudyProtocolConfig | null>(null);
  const [validationResult, setValidationResult] = useState<ProtocolValidationResult | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isCriterionModalOpen, setIsCriterionModalOpen] = useState(false);
  const [criterionDefaultType, setCriterionDefaultType] = useState<'INCLUSION' | 'EXCLUSION'>('INCLUSION');
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isInvestigationModalOpen, setIsInvestigationModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const loadProtocolData = useCallback(async (preferredVersionId?: string) => {
    if (!activeStudyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const activeProto = await protocolService.getActiveProtocol(activeStudyId);
      setProtocol(activeProto);

      if (activeProto) {
        const protoVersions = await protocolService.getProtocolVersions(activeProto.id);
        setVersions(protoVersions);

        // Determine which version to select
        let targetVerId = preferredVersionId;
        if (!targetVerId || !protoVersions.some((v) => v.id === targetVerId)) {
          const activeVer = protoVersions.find((v) => v.status === 'ACTIVE') || protoVersions[0];
          targetVerId = activeVer ? activeVer.id : '';
        }
        setSelectedVersionId(targetVerId);

        if (targetVerId) {
          const [cfg, val] = await Promise.all([
            protocolService.getStudyProtocolConfig(activeStudyId, targetVerId),
            protocolService.validateProtocolConfiguration(targetVerId),
          ]);
          setConfig(cfg);
          setValidationResult(val);
        } else {
          setConfig(null);
          setValidationResult(null);
        }
      } else {
        setVersions([]);
        setConfig(null);
        setValidationResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve protocol configuration.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId]);

  useEffect(() => {
    loadProtocolData();
  }, [loadProtocolData]);

  const handleVersionChange = async (verId: string) => {
    setSelectedVersionId(verId);
    try {
      const [cfg, val] = await Promise.all([
        protocolService.getStudyProtocolConfig(activeStudyId, verId),
        protocolService.validateProtocolConfiguration(verId),
      ]);
      setConfig(cfg);
      setValidationResult(val);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load version details.');
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);
  const isDraft = selectedVersion?.status === 'DRAFT';

  const actor = currentUser
    ? {
        userId: currentUser.id,
        name: currentUser.displayName,
        roleId: currentRole?.id || 'ROLE_PI',
        roleName: currentRole?.name || 'Principal Investigator',
        role: currentRole?.id || 'ROLE_PI',
      }
    : undefined;

  // Lifecycle Action Handlers
  const handleCreateDraftVersion = async (input: {
    versionNumber: string;
    versionLabel?: string;
    changeSummary?: string;
    cloneFromVersionId?: string;
  }) => {
    if (!protocol) return;
    const newVer = await protocolService.createDraftVersion(protocol.id, input, actor);
    showSuccess(`Draft Version ${newVer.versionNumber} created successfully.`);
    await loadProtocolData(newVer.id);
  };

  const handleSubmitForReview = async () => {
    if (!selectedVersionId) return;
    try {
      await protocolService.submitForReview(selectedVersionId, actor);
      showSuccess(`Version ${selectedVersion?.versionNumber} submitted for review.`);
      await loadProtocolData(selectedVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit version for review.');
    }
  };

  const handleApproveVersion = async () => {
    if (!selectedVersionId) return;
    try {
      await protocolService.approveVersion(selectedVersionId, actor);
      showSuccess(`Version ${selectedVersion?.versionNumber} approved.`);
      await loadProtocolData(selectedVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve version.');
    }
  };

  const handleActivateVersion = async () => {
    if (!selectedVersionId) return;
    try {
      await protocolService.activateVersion(selectedVersionId, actor);
      showSuccess(`Version ${selectedVersion?.versionNumber} activated as the canonical active study protocol.`);
      await loadProtocolData(selectedVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate version.');
    }
  };

  const handleRetireVersion = async () => {
    if (!selectedVersionId) return;
    if (!window.confirm('Are you sure you want to retire this protocol version?')) return;
    try {
      await protocolService.retireVersion(selectedVersionId, actor, 'Retired by investigator via management console.');
      showSuccess(`Version ${selectedVersion?.versionNumber} retired.`);
      await loadProtocolData(selectedVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retire version.');
    }
  };

  // Add Item Handlers
  const handleAddVisit = async (input: CreateProtocolVisitDefinitionInput) => {
    if (!selectedVersionId) return;
    await protocolService.addVisitDefinition(selectedVersionId, input, actor);
    showSuccess(`Visit "${input.name}" (${input.code}) added.`);
    await loadProtocolData(selectedVersionId);
  };

  const handleAddCriterion = async (input: CreateEligibilityCriterionInput) => {
    if (!selectedVersionId) return;
    await protocolService.addEligibilityCriterion(selectedVersionId, input, actor);
    showSuccess(`Eligibility criterion "${input.criterionCode}" added.`);
    await loadProtocolData(selectedVersionId);
  };

  const handleAddAssessment = async (input: CreateAssessmentDefinitionInput) => {
    if (!selectedVersionId) return;
    await protocolService.addAssessmentDefinition(selectedVersionId, input, actor);
    showSuccess(`Assessment "${input.name}" added.`);
    await loadProtocolData(selectedVersionId);
  };

  const handleAddInvestigation = async (input: CreateInvestigationDefinitionInput) => {
    if (!selectedVersionId) return;
    await protocolService.addInvestigationDefinition(selectedVersionId, input, actor);
    showSuccess(`Investigation "${input.name}" added.`);
    await loadProtocolData(selectedVersionId);
  };

  const handleAddOutcome = async (input: CreateOutcomeDefinitionInput) => {
    if (!selectedVersionId) return;
    await protocolService.addOutcomeDefinition(selectedVersionId, input, actor);
    showSuccess(`Outcome "${input.name}" added.`);
    await loadProtocolData(selectedVersionId);
  };

  const handleAddForm = async (input: CreateFormDefinitionInput) => {
    if (!selectedVersionId) return;
    await protocolService.addFormDefinition(selectedVersionId, input, actor);
    showSuccess(`Form "${input.name}" added.`);
    await loadProtocolData(selectedVersionId);
  };

  if (isStudyLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error && !protocol) {
    return (
      <ErrorState
        title="Protocol Configuration Unavailable"
        message={error}
        onRetry={() => loadProtocolData()}
      />
    );
  }

  if (!protocol) {
    return (
      <EmptyState
        title="No Protocol Configured"
        description={`No clinical protocol configuration was found for the active study (${activeStudy?.code}).`}
        actionLabel="Refresh Study Scope"
        onAction={() => loadProtocolData()}
        icon={<BookOpen className="w-8 h-8 text-ink-muted" />}
      />
    );
  }

  const getStatusBadgeClass = (st?: string) => {
    switch (st) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'APPROVED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'UNDER_REVIEW':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'DRAFT':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'SUPERSEDED':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'RETIRED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast message */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xs text-xs flex items-center justify-between shadow-subtle animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Protocol Header Card */}
      <div className="bg-surface border border-border rounded-sm p-6 shadow-subtle space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-rose-50 text-primary-dark border border-rose-200 rounded-xs">
                {protocol.protocolNumber}
              </span>
              <span className="text-xs text-ink-muted">&bull;</span>
              <span className="text-xs font-medium text-ink-muted">
                Study: <strong>{activeStudy?.code}</strong>
              </span>
              <span className="text-xs text-ink-muted">&bull;</span>
              <span className="text-xs text-ink-muted">
                Therapeutic Area: <strong>{protocol.therapeuticArea || 'Ayurveda Clinical Research'}</strong>
              </span>
            </div>

            <h1 className="text-2xl font-bold font-heading text-ink">{protocol.name}</h1>
            <p className="text-xs text-ink-muted">{protocol.description}</p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                icon={<GitBranch className="w-4 h-4 text-primary" />}
                onClick={() => setIsVersionModalOpen(true)}
              >
                + New Version / Amendment
              </Button>
            )}

            {/* Version Lifecycle progression buttons */}
            {canManage && isDraft && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSubmitForReview}
                >
                  Submit for Review
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleActivateVersion}
                  disabled={Boolean(validationResult && !validationResult.valid)}
                  title={validationResult && !validationResult.valid ? 'Resolve validation errors to activate' : ''}
                >
                  Activate Version
                </Button>
              </>
            )}

            {canManage && selectedVersion?.status === 'UNDER_REVIEW' && (
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleApproveVersion}
              >
                Approve Version
              </Button>
            )}

            {canManage && selectedVersion?.status === 'APPROVED' && (
              <Button
                variant="primary"
                size="sm"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={handleActivateVersion}
                disabled={Boolean(validationResult && !validationResult.valid)}
              >
                Activate Version
              </Button>
            )}

            {canManage && selectedVersion?.status === 'ACTIVE' && (
              <Button
                variant="outline"
                size="sm"
                className="text-rose-700 hover:bg-rose-50 border-rose-300"
                onClick={handleRetireVersion}
              >
                Retire Version
              </Button>
            )}
          </div>
        </div>

        {/* Version Selector Ribbon */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-ink">Selected Version:</span>
            <select
              value={selectedVersionId}
              onChange={(e) => handleVersionChange(e.target.value)}
              className="px-3 py-1.5 border border-border rounded-xs bg-white font-medium text-ink focus:ring-1 focus:ring-primary outline-hidden"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.versionNumber} ({v.status}) &mdash; {v.versionLabel}
                </option>
              ))}
            </select>

            <span
              className={`px-2 py-0.5 border rounded-xs font-semibold text-[11px] uppercase tracking-wider ${getStatusBadgeClass(
                selectedVersion?.status
              )}`}
            >
              {selectedVersion?.status}
            </span>
          </div>

          <div className="flex items-center gap-4 text-ink-muted text-[11px]">
            {selectedVersion?.effectiveDate && (
              <span>
                Effective Date: <strong>{selectedVersion.effectiveDate}</strong>
              </span>
            )}
            {selectedVersion?.approvalDate && (
              <span>
                Approved: <strong>{selectedVersion.approvalDate}</strong>
              </span>
            )}
            <span>
              Author: <strong>{selectedVersion?.createdBy}</strong>
            </span>
          </div>
        </div>

        {/* Immutability Alert Banner for Non-Drafts */}
        {!isDraft && (
          <div className="bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xs text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-600 shrink-0" />
              <span>
                <strong>Version Immutable:</strong> This protocol version is in status{' '}
                <strong>{selectedVersion?.status}</strong>. Direct modifications are locked to preserve regulatory audit trails. Use <strong>"+ New Version / Amendment"</strong> to author modifications in a draft version.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Validation Engine Banner */}
      {validationResult && (
        <div>
          {!validationResult.valid && (
            <div className="bg-rose-50 border border-rose-300 text-rose-900 p-4 rounded-xs text-xs space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Protocol Validation Alert: {validationResult.errors.length} Critical Issue(s) Blocking Activation</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-2 text-rose-800">
                {validationResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.valid && validationResult.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xs text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Configuration Warnings ({validationResult.warnings.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-2 text-amber-800">
                {validationResult.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.valid && validationResult.warnings.length === 0 && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xs text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Protocol Configuration Valid:</strong> All protocol visits, allowable windows, eligibility criteria, and assessment linkages satisfy protocol specification rules.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-border flex items-center gap-1 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Overview & Versions</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visits')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'visits'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Protocol Visits ({config?.visits.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('eligibility')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'eligibility'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Eligibility ({config?.eligibility.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assessments')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'assessments'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Assessments ({config?.assessments.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('investigations')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'investigations'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Investigations ({config?.investigations.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('outcomes')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'outcomes'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Outcomes ({config?.outcomes.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('forms')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'forms'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>eCRF Forms ({config?.forms.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('governance')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'governance'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Governance & Milestones</span>
        </button>
      </div>

      {/* Tab 1: Overview & Versions */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-surface border border-border p-3.5 rounded-sm shadow-subtle">
              <span className="text-[11px] text-ink-muted font-medium block">Visits Defined</span>
              <span className="text-xl font-bold font-heading text-ink">{config?.visits.length || 0}</span>
            </div>
            <div className="bg-surface border border-border p-3.5 rounded-sm shadow-subtle">
              <span className="text-[11px] text-ink-muted font-medium block">Inclusion Criteria</span>
              <span className="text-xl font-bold font-heading text-emerald-700">
                {config?.eligibility.filter((c) => c.type === 'INCLUSION').length || 0}
              </span>
            </div>
            <div className="bg-surface border border-border p-3.5 rounded-sm shadow-subtle">
              <span className="text-[11px] text-ink-muted font-medium block">Exclusion Criteria</span>
              <span className="text-xl font-bold font-heading text-rose-700">
                {config?.eligibility.filter((c) => c.type === 'EXCLUSION').length || 0}
              </span>
            </div>
            <div className="bg-surface border border-border p-3.5 rounded-sm shadow-subtle">
              <span className="text-[11px] text-ink-muted font-medium block">Assessments</span>
              <span className="text-xl font-bold font-heading text-ink">{config?.assessments.length || 0}</span>
            </div>
            <div className="bg-surface border border-border p-3.5 rounded-sm shadow-subtle">
              <span className="text-[11px] text-ink-muted font-medium block">Investigations</span>
              <span className="text-xl font-bold font-heading text-ink">{config?.investigations.length || 0}</span>
            </div>
            <div className="bg-surface border border-border p-3.5 rounded-sm shadow-subtle">
              <span className="text-[11px] text-ink-muted font-medium block">Endpoints / Outcomes</span>
              <span className="text-xl font-bold font-heading text-ink">{config?.outcomes.length || 0}</span>
            </div>
          </div>

          {/* Versions History Table */}
          <Card>
            <CardHeader title="Protocol Version History & Regulatory Amendments" />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-alt border-b border-border font-semibold text-ink-muted">
                    <tr>
                      <th className="px-4 py-3">Version</th>
                      <th className="px-4 py-3">Label</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Author</th>
                      <th className="px-4 py-3">Effective Date</th>
                      <th className="px-4 py-3">Approval Date</th>
                      <th className="px-4 py-3">Change Summary</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {versions.map((ver) => (
                      <tr
                        key={ver.id}
                        className={`hover:bg-surface-hover ${
                          ver.id === selectedVersionId ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-ink">v{ver.versionNumber}</td>
                        <td className="px-4 py-3 font-medium text-ink">{ver.versionLabel}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 border rounded-xs font-semibold text-[10px] uppercase tracking-wider ${getStatusBadgeClass(
                              ver.status
                            )}`}
                          >
                            {ver.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{ver.createdBy}</td>
                        <td className="px-4 py-3 font-mono text-ink-muted">{ver.effectiveDate || '&mdash;'}</td>
                        <td className="px-4 py-3 font-mono text-ink-muted">{ver.approvalDate || '&mdash;'}</td>
                        <td className="px-4 py-3 text-ink-muted max-w-xs truncate" title={ver.changeSummary}>
                          {ver.changeSummary || 'Initial protocol design'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleVersionChange(ver.id)}
                            className="text-primary hover:text-primary-dark font-semibold text-xs hover:underline"
                          >
                            {ver.id === selectedVersionId ? 'Viewing' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Protocol Visits */}
      {activeTab === 'visits' && (
        <Card>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-ink">
                Protocol Visit Definitions (Schedule of Activities)
              </h3>
              <p className="text-xs text-ink-muted">
                Anchors, allowable target windows, and compulsory procedure activities for v{selectedVersion?.versionNumber}
              </p>
            </div>
            {canManage && isDraft && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsVisitModalOpen(true)}
              >
                + Add Protocol Visit
              </Button>
            )}
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-alt border-b border-border font-semibold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Seq</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Visit Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Target Day</th>
                    <th className="px-4 py-3">Allowable Window</th>
                    <th className="px-4 py-3">Anchor</th>
                    <th className="px-4 py-3">Required Activities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {config?.visits.map((v) => (
                    <tr key={v.id} className="hover:bg-surface-hover">
                      <td className="px-4 py-3 font-mono font-bold text-ink-secondary">{v.sequence}</td>
                      <td className="px-4 py-3 font-mono font-bold text-primary">{v.code}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-ink block">{v.name}</span>
                        {v.description && <span className="text-[11px] text-ink-muted">{v.description}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-ink-secondary rounded-xs text-[10px] font-semibold">
                          {v.visitType || 'TREATMENT'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-ink">Day {v.targetOffsetDays}</td>
                      <td className="px-4 py-3 font-mono text-ink-muted">
                        -{v.windowBeforeDays}d / +{v.windowAfterDays}d
                      </td>
                      <td className="px-4 py-3 text-ink-muted text-[11px] font-mono">{v.anchor}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {v.requiredActivities?.map((act, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-xs font-medium"
                            >
                              {act}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!config?.visits || config.visits.length === 0) && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-ink-muted">
                        No visits defined for this protocol version.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Eligibility Criteria */}
      {activeTab === 'eligibility' && (
        <div className="space-y-6">
          {/* Inclusion Criteria */}
          <Card>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-emerald-800 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  Inclusion Criteria ({config?.eligibility.filter((c) => c.type === 'INCLUSION').length || 0})
                </h3>
                <p className="text-xs text-ink-muted">Mandatory conditions for participant trial eligibility</p>
              </div>
              {canManage && isDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setCriterionDefaultType('INCLUSION');
                    setIsCriterionModalOpen(true);
                  }}
                >
                  + Add Inclusion Criterion
                </Button>
              )}
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-alt border-b border-border font-semibold text-ink-muted">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3 text-right">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {config?.eligibility
                      .filter((c) => c.type === 'INCLUSION')
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-surface-hover">
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700">{c.criterionCode}</td>
                          <td className="px-4 py-3 font-semibold text-ink">{c.title}</td>
                          <td className="px-4 py-3 text-ink-muted">{c.description}</td>
                          <td className="px-4 py-3 font-mono text-ink-muted">{c.displayOrder}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xs font-semibold text-[10px]">
                              MANDATORY
                            </span>
                          </td>
                        </tr>
                      ))}
                    {(!config?.eligibility || config.eligibility.filter((c) => c.type === 'INCLUSION').length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-ink-muted">
                          No inclusion criteria defined.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Exclusion Criteria */}
          <Card>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Exclusion Criteria ({config?.eligibility.filter((c) => c.type === 'EXCLUSION').length || 0})
                </h3>
                <p className="text-xs text-ink-muted">Disqualifying clinical conditions and safety contraindications</p>
              </div>
              {canManage && isDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setCriterionDefaultType('EXCLUSION');
                    setIsCriterionModalOpen(true);
                  }}
                >
                  + Add Exclusion Criterion
                </Button>
              )}
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-alt border-b border-border font-semibold text-ink-muted">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3 text-right">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {config?.eligibility
                      .filter((c) => c.type === 'EXCLUSION')
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-surface-hover">
                          <td className="px-4 py-3 font-mono font-bold text-rose-700">{c.criterionCode}</td>
                          <td className="px-4 py-3 font-semibold text-ink">{c.title}</td>
                          <td className="px-4 py-3 text-ink-muted">{c.description}</td>
                          <td className="px-4 py-3 font-mono text-ink-muted">{c.displayOrder}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xs font-semibold text-[10px]">
                              MANDATORY
                            </span>
                          </td>
                        </tr>
                      ))}
                    {(!config?.eligibility || config.eligibility.filter((c) => c.type === 'EXCLUSION').length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-ink-muted">
                          No exclusion criteria defined.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Assessments */}
      {activeTab === 'assessments' && (
        <Card>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-ink">
                Protocol Assessment Definitions
              </h3>
              <p className="text-xs text-ink-muted">Clinical examinations, questionnaires, and phenotypic assessments</p>
            </div>
            {canManage && isDraft && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAssessmentModalOpen(true)}
              >
                + Add Assessment
              </Button>
            )}
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-alt border-b border-border font-semibold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Assessment Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Linked Protocol Visit</th>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Portal Visible</th>
                    <th className="px-4 py-3 text-right">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {config?.assessments.map((a) => {
                    const linkedVisit = config.visits.find((v) => v.id === a.visitDefinitionId);
                    return (
                      <tr key={a.id} className="hover:bg-surface-hover">
                        <td className="px-4 py-3 font-mono font-bold text-primary">{a.code}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-ink block">{a.name}</span>
                          {a.description && <span className="text-[11px] text-ink-muted">{a.description}</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink-secondary">{a.category}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-ink">
                            {linkedVisit ? `${linkedVisit.name} (${linkedVisit.code})` : a.visitDefinitionId}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-ink-muted">{a.version || '1.0'}</td>
                        <td className="px-4 py-3">
                          {a.participantVisible ? (
                            <span className="text-emerald-700 font-semibold">Yes</span>
                          ) : (
                            <span className="text-ink-muted">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {a.required ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-xs text-[10px] font-semibold">
                              REQUIRED
                            </span>
                          ) : (
                            <span className="text-ink-muted text-[10px]">OPTIONAL</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!config?.assessments || config.assessments.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                        No assessments defined for this protocol version.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Investigations */}
      {activeTab === 'investigations' && (
        <Card>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-ink">
                Protocol Investigation Definitions
              </h3>
              <p className="text-xs text-ink-muted">Laboratory assays, biochemistry panels, imaging, and diagnostic tests</p>
            </div>
            {canManage && isDraft && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsInvestigationModalOpen(true)}
              >
                + Add Investigation
              </Button>
            )}
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-alt border-b border-border font-semibold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Investigation Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Linked Protocol Visit</th>
                    <th className="px-4 py-3">Portal Visible</th>
                    <th className="px-4 py-3 text-right">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {config?.investigations.map((i) => {
                    const linkedVisit = config.visits.find((v) => v.id === i.visitDefinitionId);
                    return (
                      <tr key={i.id} className="hover:bg-surface-hover">
                        <td className="px-4 py-3 font-mono font-bold text-primary">{i.code}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-ink block">{i.name}</span>
                          {i.description && <span className="text-[11px] text-ink-muted">{i.description}</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink-secondary">{i.category}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-ink">
                            {linkedVisit ? `${linkedVisit.name} (${linkedVisit.code})` : i.visitDefinitionId}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {i.participantVisible ? (
                            <span className="text-emerald-700 font-semibold">Yes</span>
                          ) : (
                            <span className="text-ink-muted">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {i.required ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-xs text-[10px] font-semibold">
                              REQUIRED
                            </span>
                          ) : (
                            <span className="text-ink-muted text-[10px]">OPTIONAL</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!config?.investigations || config.investigations.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                        No investigations defined for this protocol version.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 6: Outcomes */}
      {activeTab === 'outcomes' && (
        <Card>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-ink">
                Protocol Outcomes & Study Endpoints
              </h3>
              <p className="text-xs text-ink-muted">Primary, secondary, exploratory efficacy outcomes, and safety endpoints</p>
            </div>
            {canManage && isDraft && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsOutcomeModalOpen(true)}
              >
                + Add Outcome
              </Button>
            )}
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-alt border-b border-border font-semibold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Endpoint Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Timepoint</th>
                    <th className="px-4 py-3">Linked Visit</th>
                    <th className="px-4 py-3 text-right">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {config?.outcomes.map((o) => {
                    const linkedVisit = config.visits.find((v) => v.id === o.visitDefinitionId);
                    return (
                      <tr key={o.id} className="hover:bg-surface-hover">
                        <td className="px-4 py-3 font-mono font-bold text-primary">{o.code}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-ink block">{o.name}</span>
                          {o.description && <span className="text-[11px] text-ink-muted">{o.description}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                              o.outcomeType === 'PRIMARY'
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : o.outcomeType === 'SECONDARY'
                                ? 'bg-indigo-50 text-indigo-700'
                                : o.outcomeType === 'SAFETY'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {o.outcomeType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-ink-muted">{o.timepoint || 'All visits'}</td>
                        <td className="px-4 py-3 text-ink-muted">
                          {linkedVisit ? `${linkedVisit.name} (${linkedVisit.code})` : 'All Visits'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {o.required ? (
                            <span className="text-emerald-700 font-semibold">Yes</span>
                          ) : (
                            <span className="text-ink-muted">Optional</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!config?.outcomes || config.outcomes.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                        No outcomes defined for this protocol version.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 7: Forms */}
      {activeTab === 'forms' && (
        <Card>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-ink">
                Case Report Form (eCRF) Definitions
              </h3>
              <p className="text-xs text-ink-muted">Form shells, data collection domains, and visit mapping</p>
            </div>
            {canManage && isDraft && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsFormModalOpen(true)}
              >
                + Add Form
              </Button>
            )}
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-alt border-b border-border font-semibold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Form Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Domain</th>
                    <th className="px-4 py-3">Applicable Visit</th>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3 text-right">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {config?.forms.map((f) => {
                    const linkedVisit = config.visits.find((v) => v.id === f.applicableVisitDefinitionId);
                    return (
                      <tr key={f.id} className="hover:bg-surface-hover">
                        <td className="px-4 py-3 font-mono font-bold text-primary">{f.code}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-ink block">{f.name}</span>
                          {f.description && <span className="text-[11px] text-ink-muted">{f.description}</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink-secondary">{f.formType}</td>
                        <td className="px-4 py-3 font-mono text-ink-muted">{f.dataDomain}</td>
                        <td className="px-4 py-3 text-ink-muted">
                          {linkedVisit ? `${linkedVisit.name} (${linkedVisit.code})` : 'All Visits'}
                        </td>
                        <td className="px-4 py-3 font-mono text-ink-muted">v{f.version || '1.0'}</td>
                        <td className="px-4 py-3 text-right">
                          {f.required ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-xs text-[10px] font-semibold">
                              REQUIRED
                            </span>
                          ) : (
                            <span className="text-ink-muted text-[10px]">OPTIONAL</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {(!config?.forms || config.forms.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                        No forms defined for this protocol version.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 8: Governance & Milestones */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          {/* Milestones */}
          <Card>
            <CardHeader title="Protocol Operational Milestones" />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-alt border-b border-border font-semibold text-ink-muted">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Milestone Name</th>
                      <th className="px-4 py-3">Planned Target Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {config?.milestones.map((m) => (
                      <tr key={m.id} className="hover:bg-surface-hover">
                        <td className="px-4 py-3 font-mono font-bold text-primary">{m.type}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-ink block">{m.name}</span>
                          {m.description && <span className="text-[11px] text-ink-muted">{m.description}</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-ink">{m.plannedDate || 'Ongoing'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                              m.status === 'ACHIEVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.status === 'IN_PROGRESS'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {m.required ? (
                            <span className="text-emerald-700 font-semibold">Yes</span>
                          ) : (
                            <span className="text-ink-muted">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Consent & Safety Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Informed Consent Requirements" />
              <CardContent className="p-0">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-alt border-b border-border font-semibold text-ink-muted">
                    <tr>
                      <th className="px-4 py-2.5">Consent Type</th>
                      <th className="px-4 py-2.5">Required Before</th>
                      <th className="px-4 py-2.5">Version Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {config?.consentRequirements.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-2.5 font-bold text-ink">{c.consentType}</td>
                        <td className="px-4 py-2.5 text-ink-muted">{c.requiredBefore}</td>
                        <td className="px-4 py-2.5 font-mono text-primary">{c.versionReference || '&mdash;'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Safety Reporting Requirements" />
              <CardContent className="p-0">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-alt border-b border-border font-semibold text-ink-muted">
                    <tr>
                      <th className="px-4 py-2.5">Event Type</th>
                      <th className="px-4 py-2.5">Reporting Window</th>
                      <th className="px-4 py-2.5">Mandatory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {config?.safetyRequirements.map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-2.5 font-bold text-rose-700">{s.eventType}</td>
                        <td className="px-4 py-2.5 text-ink-muted">{s.reportingWindow || 'Standard'}</td>
                        <td className="px-4 py-2.5">
                          {s.required ? (
                            <span className="text-emerald-700 font-semibold">Yes</span>
                          ) : (
                            <span className="text-ink-muted">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateDraftVersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        protocolId={protocol.id}
        existingVersions={versions}
        selectedVersionId={selectedVersionId}
        onSubmit={handleCreateDraftVersion}
      />

      <AddProtocolVisitModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        nextSequence={(config?.visits.length || 0) + 1}
        onSubmit={handleAddVisit}
      />

      <AddEligibilityCriterionModal
        isOpen={isCriterionModalOpen}
        onClose={() => setIsCriterionModalOpen(false)}
        defaultType={criterionDefaultType}
        nextOrder={(config?.eligibility.filter((c) => c.type === criterionDefaultType).length || 0) + 1}
        onSubmit={handleAddCriterion}
      />

      <AddAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        visits={config?.visits || []}
        nextOrder={(config?.assessments.length || 0) + 1}
        onSubmit={handleAddAssessment}
      />

      <AddInvestigationModal
        isOpen={isInvestigationModalOpen}
        onClose={() => setIsInvestigationModalOpen(false)}
        visits={config?.visits || []}
        nextOrder={(config?.investigations.length || 0) + 1}
        onSubmit={handleAddInvestigation}
      />

      <AddOutcomeModal
        isOpen={isOutcomeModalOpen}
        onClose={() => setIsOutcomeModalOpen(false)}
        visits={config?.visits || []}
        nextOrder={(config?.outcomes.length || 0) + 1}
        onSubmit={handleAddOutcome}
      />

      <AddFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        visits={config?.visits || []}
        nextOrder={(config?.forms.length || 0) + 1}
        onSubmit={handleAddForm}
      />
    </div>
  );
};
