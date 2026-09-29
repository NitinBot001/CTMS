import React, { useState, useEffect, useCallback } from 'react';
import { useStudy } from '../context/StudyContext';
import { documentService } from '../services/documentService';
import { teamService } from '../services/teamService';
import {
  Document,
  DocumentFilters,
  DocumentSummaryMetrics,
  TeamMemberSummary,
} from '../types';
import { DocumentSummaryCards } from '../components/documents/DocumentSummaryCards';
import { DocumentFiltersBar } from '../components/documents/DocumentFiltersBar';
import { DocumentTable } from '../components/documents/DocumentTable';
import { DocumentMobileCard } from '../components/documents/DocumentMobileCard';
import { CreateDocumentModal } from '../components/documents/CreateDocumentModal';
import { CreateDocumentVersionModal } from '../components/documents/CreateDocumentVersionModal';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { RefreshCw, FileText, Plus, ShieldAlert } from 'lucide-react';
import { isDocumentActionRequired } from '../utils/documentCalculations';

export const DocumentManagementPage: React.FC = () => {
  const {
    activeStudy,
    activeSite,
    activeStudyId,
    activeSiteId,
    isLoading: isStudyLoading,
  } = useStudy();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [totalSiteCount, setTotalSiteCount] = useState<number>(0);
  const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>([]);
  const [metrics, setMetrics] = useState<DocumentSummaryMetrics>({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    required: 0,
    actionRequired: 0,
  });

  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    category: 'ALL',
    documentType: 'ALL',
    status: 'ALL',
    expiryFilter: 'ALL',
    isRequired: 'ALL',
    ownerUserId: 'ALL',
  });

  const [activeCardFilter, setActiveCardFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDocForVersion, setSelectedDocForVersion] = useState<Document | null>(null);

  // QA simulation state
  const [simulatedError, setSimulatedError] = useState<boolean>(false);
  const [simulatedEmpty, setSimulatedEmpty] = useState<boolean>(false);

  const loadDocumentsData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (simulatedError) {
        throw new Error('Simulated repository error: unable to load study documents register.');
      }

      if (simulatedEmpty) {
        setDocuments([]);
        setTotalSiteCount(0);
        setMetrics({
          total: 0,
          active: 0,
          expiringSoon: 0,
          expired: 0,
          required: 0,
          actionRequired: 0,
        });
        setIsLoading(false);
        return;
      }

      const context = { studyId: activeStudyId, siteId: activeSiteId };

      const [filteredData, summary, allDocs, members] = await Promise.all([
        documentService.getDocuments(context, filters),
        documentService.getDocumentSummary(context),
        documentService.getDocuments(context),
        teamService.getTeamMembers(context).catch(() => []),
      ]);

      // If active card filter is ACTION_REQUIRED, filter client-side for action required
      let displayedDocs = filteredData;
      if (activeCardFilter === 'ACTION_REQUIRED') {
        displayedDocs = filteredData.filter((d) => isDocumentActionRequired(d));
      }

      setDocuments(displayedDocs);
      setTotalSiteCount(allDocs.length);
      setMetrics(summary);
      setTeamMembers(members);
    } catch (err) {
      setError((err as Error).message || 'Failed to load document register.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, filters, activeCardFilter, simulatedError, simulatedEmpty]);

  useEffect(() => {
    loadDocumentsData();
  }, [loadDocumentsData]);

  // Handle Summary Card filter click
  const handleSummaryCardClick = (cardKey: string) => {
    if (activeCardFilter === cardKey) {
      // Toggle off
      setActiveCardFilter('ALL');
      setFilters((prev) => ({
        ...prev,
        status: 'ALL',
        expiryFilter: 'ALL',
        isRequired: 'ALL',
      }));
      return;
    }

    setActiveCardFilter(cardKey);

    switch (cardKey) {
      case 'ALL':
        setFilters((prev) => ({
          ...prev,
          status: 'ALL',
          expiryFilter: 'ALL',
          isRequired: 'ALL',
        }));
        break;
      case 'ACTIVE':
        setFilters((prev) => ({
          ...prev,
          status: 'ACTIVE',
          expiryFilter: 'ALL',
        }));
        break;
      case 'EXPIRING_SOON':
        setFilters((prev) => ({
          ...prev,
          expiryFilter: 'EXPIRING_SOON',
          status: 'ALL',
        }));
        break;
      case 'EXPIRED':
        setFilters((prev) => ({
          ...prev,
          expiryFilter: 'EXPIRED',
          status: 'ALL',
        }));
        break;
      case 'REQUIRED':
        setFilters((prev) => ({
          ...prev,
          isRequired: true,
        }));
        break;
      case 'ACTION_REQUIRED':
        // Reset individual status filters so the client-side predicate can run
        setFilters((prev) => ({
          ...prev,
          status: 'ALL',
          expiryFilter: 'ALL',
          isRequired: true,
        }));
        break;
    }
  };

  const handleResetFilters = () => {
    setActiveCardFilter('ALL');
    setFilters({
      search: '',
      category: 'ALL',
      documentType: 'ALL',
      status: 'ALL',
      expiryFilter: 'ALL',
      isRequired: 'ALL',
      ownerUserId: 'ALL',
    });
  };

  if (isStudyLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-ink font-heading leading-tight">
              Document Management & Expiry Tracking
            </h1>
            <span className="text-xs font-mono font-semibold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-sm">
              Segment H
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Institutional document register, GCP version control, and automated regulatory expiration tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDocumentsData()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink bg-surface border border-border rounded-sm hover:bg-surface-soft transition-colors shadow-subtle disabled:opacity-50"
            title="Refresh documents list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* Study & Site Context Banner */}
      <div className="bg-surface-soft/60 border border-border rounded-sm p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-ink">Active Protocol Context:</span>
          <span className="font-mono bg-surface border border-border px-1.5 py-0.5 rounded-sm text-ink">
            {activeStudy?.code || activeStudyId}
          </span>
          <span className="text-ink-muted">•</span>
          <span className="font-medium text-ink">
            {activeSite?.name || activeSiteId} ({activeSiteId})
          </span>
        </div>
        <div className="text-ink-muted text-[11px]">
          Reference Date: <strong className="text-ink font-mono">2026-09-29</strong> (Deterministic Engine)
        </div>
      </div>

      {/* KPI Summary Cards */}
      <DocumentSummaryCards
        metrics={metrics}
        activeFilter={activeCardFilter}
        onFilterClick={handleSummaryCardClick}
      />

      {/* Action Required Banner if active */}
      {metrics.actionRequired > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-300 rounded-sm flex items-start justify-between gap-3 text-xs text-rose-900">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                {metrics.actionRequired} Mandatory Clinical Document{metrics.actionRequired > 1 ? 's Require' : ' Requires'} Immediate Action
              </span>
              <p className="text-[11px] text-rose-800 mt-0.5">
                Required trial documents are either currently expired or lacking an active valid version. Timely renewal is mandatory to preserve GCP compliance.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleSummaryCardClick('ACTION_REQUIRED')}
            className="px-2.5 py-1 text-[11px] font-semibold text-rose-800 hover:text-white hover:bg-rose-700 bg-white border border-rose-300 rounded-sm transition-colors shrink-0 shadow-xs"
          >
            Review Deficiencies
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <DocumentFiltersBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        totalCount={totalSiteCount}
        filteredCount={documents.length}
        teamMembers={teamMembers.map((m) => ({
          id: m.user.id,
          displayName: m.user.displayName,
          designation: m.user.designation,
        }))}
        onCreateDocumentClick={() => setIsCreateModalOpen(true)}
      />

      {/* Documents Directory: Loading / Error / Empty / Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Document Register Error"
          message={error}
          onRetry={loadDocumentsData}
        />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6 text-ink-muted" />}
          title={
            totalSiteCount === 0
              ? 'No Documents at Current Site'
              : 'No Documents Match Active Filters'
          }
          description={
            totalSiteCount === 0
              ? 'No regulatory, ethics, or trial records are registered for this study/site. Register a new document to begin tracking.'
              : 'Try clearing your search query or broadening the filter parameters to view registered documents.'
          }
          actionLabel={totalSiteCount > 0 ? 'Reset All Filters' : 'Register First Document'}
          onAction={
            totalSiteCount > 0
              ? handleResetFilters
              : () => setIsCreateModalOpen(true)
          }
        />
      ) : (
        <div>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DocumentTable
              documents={documents}
              onAddVersionClick={(doc) => setSelectedDocForVersion(doc)}
            />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {documents.map((doc) => (
              <DocumentMobileCard
                key={doc.id}
                document={doc}
                onAddVersionClick={(d) => setSelectedDocForVersion(d)}
              />
            ))}
          </div>
        </div>
      )}

      {/* QA Edge State Sandbox Controls */}
      <div className="p-3 bg-surface-soft/40 border border-border/60 rounded-sm flex items-center justify-between flex-wrap gap-2 text-[11px] text-ink-muted">
        <span className="font-semibold text-ink">QA Simulation Sandbox:</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={simulatedError}
              onChange={(e) => setSimulatedError(e.target.checked)}
              className="rounded-sm border-border text-primary focus:ring-primary w-3.5 h-3.5"
            />
            <span>Simulate Error State</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={simulatedEmpty}
              onChange={(e) => setSimulatedEmpty(e.target.checked)}
              className="rounded-sm border-border text-primary focus:ring-primary w-3.5 h-3.5"
            />
            <span>Simulate Zero Documents</span>
          </label>
        </div>
      </div>

      {/* Create Document Modal */}
      {isCreateModalOpen && (
        <CreateDocumentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={loadDocumentsData}
          studyId={activeStudyId || 'STUDY-001'}
          siteId={activeSiteId || 'SITE-001'}
          teamMembers={teamMembers}
        />
      )}

      {/* Add New Version Modal */}
      {selectedDocForVersion && (
        <CreateDocumentVersionModal
          isOpen={Boolean(selectedDocForVersion)}
          onClose={() => setSelectedDocForVersion(null)}
          onSuccess={loadDocumentsData}
          document={selectedDocForVersion}
          studyId={activeStudyId || 'STUDY-001'}
          siteId={activeSiteId || 'SITE-001'}
        />
      )}
    </div>
  );
};
