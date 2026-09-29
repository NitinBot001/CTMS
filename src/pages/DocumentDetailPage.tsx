import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { documentService } from '../services/documentService';
import { teamService } from '../services/teamService';
import { Document, TeamMemberSummary } from '../types';
import { DocumentStatusBadge } from '../components/documents/DocumentStatusBadge';
import { DocumentCategoryBadge } from '../components/documents/DocumentCategoryBadge';
import { DocumentExpiryBadge } from '../components/documents/DocumentExpiryBadge';
import { DocumentVersionHistory } from '../components/documents/DocumentVersionHistory';
import { CreateDocumentVersionModal } from '../components/documents/CreateDocumentVersionModal';
import { EditDocumentModal } from '../components/documents/EditDocumentModal';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  ArrowLeft,
  User,
  ShieldCheck,
  ShieldAlert,
  Archive,
  PlusCircle,
  ExternalLink,
  FileText,
  History,
  CheckCircle2,
  Edit3,
} from 'lucide-react';
import {
  isDocumentActionRequired,
  getDaysUntilExpiry,
} from '../utils/documentCalculations';

export const DocumentDetailPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const {
    activeStudyId,
    activeSiteId,
    isLoading: isStudyLoading,
  } = useStudy();

  const [document, setDocument] = useState<Document | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Modal states
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadDocument = useCallback(async () => {
    if (!activeStudyId || !activeSiteId || !documentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [doc, members] = await Promise.all([
        documentService.getDocumentById(context, documentId),
        teamService.getTeamMembers(context).catch(() => []),
      ]);
      setDocument(doc);
      setTeamMembers(members);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to retrieve document details.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, documentId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const handleArchive = async () => {
    if (!activeStudyId || !activeSiteId || !document) return;

    const confirmed = window.confirm(
      `Are you sure you want to archive "${document.title}" (${document.id})?\n\nThis will mark the document and all associated versions as ARCHIVED.`
    );
    if (!confirmed) return;

    setIsActionLoading(true);
    setActionSuccess(null);
    try {
      const updated = await documentService.archiveDocument(
        { studyId: activeStudyId, siteId: activeSiteId },
        document.id
      );
      setDocument(updated);
      setActionSuccess('Document and all version records archived successfully.');
    } catch (err) {
      alert((err as Error).message || 'Failed to archive document.');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isStudyLoading || isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full lg:col-span-1" />
          <Skeleton className="h-96 w-full lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState
          title="Failed to Load Document"
          message={error}
          onRetry={loadDocument}
        />
      </div>
    );
  }

  // Scope Guard: if document is null or not found at current site/study
  if (!document) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState
          icon={<FileText className="w-8 h-8 text-ink-muted" />}
          title="Document Not Found in Active Scope"
          description={`Document "${documentId}" was not found or is not accessible within study "${activeStudyId}" at site "${activeSiteId}". Multi-site clinical data isolation restricts cross-site access.`}
          actionLabel="Return to Document Register"
          onAction={() => navigate('/pi/documents')}
        />
      </div>
    );
  }

  const actionRequired = isDocumentActionRequired(document);
  const daysUntilExpiry = getDaysUntilExpiry(document.expiryDate);

  // Derive linked entity URL
  const getEntityUrl = (type: string, id: string): string => {
    switch (type) {
      case 'COMPLIANCE':
        return `/pi/compliance/${id}`;
      case 'SAFETY':
        return `/pi/safety/${id}`;
      case 'VISIT':
        return `/pi/visits/${id}`;
      case 'PARTICIPANT':
        return `/pi/patients/${id}`;
      case 'TASK':
        return `/pi/tasks/${id}`;
      default:
        return '#';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <Link
          to="/pi/documents"
          className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Document Register</span>
        </Link>
        <span>/</span>
        <span className="font-mono text-ink font-semibold">{document.id}</span>
      </div>

      {/* Header Banner */}
      <div className="bg-surface border border-border rounded-sm shadow-subtle p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold bg-surface-soft border border-border px-2 py-0.5 rounded-sm text-ink">
                {document.id}
              </span>
              <DocumentCategoryBadge category={document.category} size="md" />
              <DocumentStatusBadge status={document.status} size="md" />
              <DocumentExpiryBadge expiryDate={document.expiryDate} size="md" />
              {document.isRequired && (
                <span className="text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-sm flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                  Mandatory GCP Obligation
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-ink font-heading leading-tight">
              {document.title}
            </h1>

            <p className="text-xs text-ink-muted leading-relaxed max-w-3xl">
              {document.description || 'No detailed scope description provided.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {document.status !== 'ARCHIVED' && (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-ink bg-surface-soft hover:bg-surface-soft/80 border border-border rounded-sm transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Edit document classification, dates, or site ownership"
                >
                  <Edit3 className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Edit Metadata</span>
                </button>

                <button
                  onClick={() => setIsVersionModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Upload New Version</span>
                </button>

                <button
                  onClick={handleArchive}
                  disabled={isActionLoading}
                  className="px-3 py-1.5 text-xs font-medium text-rose-800 hover:text-white hover:bg-rose-700 bg-rose-50 border border-rose-300 rounded-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  title="Archive document and all historical versions"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </button>
              </>
            )}
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-sm flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Action Required Banner if active */}
        {actionRequired && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-sm flex items-start gap-3 text-xs text-rose-900">
            <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                Operational Compliance Action Required: Immediate Renewal Mandatory
              </span>
              <p className="text-[11px] text-rose-800 mt-0.5">
                This document is flagged as a mandatory trial obligation and its current regulatory validity is expired or incomplete. Upload an updated active version to maintain protocol compliance.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Metadata, Owner, Linkage) */}
        <div className="space-y-6">
          {/* Document Overview Metadata */}
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-bold text-ink font-heading border-b border-border pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>Document Details</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-ink-muted">Category</span>
                <span className="font-medium text-ink">{document.category}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-ink-muted">Document Type</span>
                <span className="font-medium text-ink">{document.documentType}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-ink-muted">GCP Obligation</span>
                <span className={`font-semibold ${document.isRequired ? 'text-indigo-800' : 'text-ink-muted'}`}>
                  {document.isRequired ? 'Mandatory Protocol Requirement' : 'Non-Mandatory / Informational'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-ink-muted">Current Active Version</span>
                <span className="font-mono font-bold text-ink bg-stone-100 border border-border px-1.5 py-0.5 rounded-sm">
                  v{document.currentVersionNumber}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-ink-muted">Effective Date</span>
                <span className="font-medium text-ink">
                  {document.effectiveDate || 'Not specified'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-ink-muted">Expiration Date</span>
                <div className="text-right">
                  <span className="font-medium text-ink block">
                    {document.expiryDate || 'No Expiration Date'}
                  </span>
                  {daysUntilExpiry !== null && (
                    <span
                      className={`text-[10px] block ${
                        daysUntilExpiry < 0
                          ? 'text-rose-700 font-semibold'
                          : daysUntilExpiry <= 30
                          ? 'text-amber-700 font-semibold'
                          : 'text-ink-muted'
                      }`}
                    >
                      {daysUntilExpiry < 0
                        ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                        : `${daysUntilExpiry} days remaining`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-ink-muted">Author / Created By</span>
                <span className="font-medium text-ink">{document.createdBy}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-ink-muted">Last Updated</span>
                <span className="font-medium text-ink">
                  {new Date(document.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Responsible Owner Card */}
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-ink font-heading border-b border-border pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>Responsible Owner</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                  Staff Member
                </span>
                <span className="font-semibold text-ink text-sm block mt-0.5">
                  {document.ownerName || document.ownerUserId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                    User ID
                  </span>
                  <span className="font-mono text-ink text-xs">
                    {document.ownerUserId}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                    Role ID
                  </span>
                  <span className="font-mono text-xs text-primary font-medium">
                    {document.ownerRoleId || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Linked Clinical Entity Card (if linked) */}
          {document.relatedEntityType && document.relatedEntityId && (
            <Card className="p-4 space-y-3 bg-stone-50/50">
              <h3 className="text-sm font-bold text-ink font-heading border-b border-border pb-2 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                <span>Linked Clinical Entity</span>
              </h3>

              <div className="space-y-2 text-xs">
                <p className="text-ink-muted text-[11px]">
                  This document serves as supporting regulatory or procedural evidence for the following trial record:
                </p>

                <div className="flex items-center justify-between p-2.5 bg-surface border border-border rounded-sm">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                      {document.relatedEntityType}
                    </span>
                    <span className="font-mono font-bold text-ink text-sm">
                      {document.relatedEntityId}
                    </span>
                  </div>

                  <Link
                    to={getEntityUrl(document.relatedEntityType, document.relatedEntityId)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 border border-primary/30 rounded-sm transition-colors"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Operational Audit Metadata Card */}
          <Card className="p-4 space-y-2 text-xs bg-surface-soft/40">
            <h3 className="text-xs font-bold text-ink font-heading flex items-center gap-1.5 uppercase tracking-wider text-ink-muted">
              <History className="w-3.5 h-3.5 text-ink-muted" />
              <span>Audit Metadata</span>
            </h3>
            <div className="space-y-1 text-[11px] text-ink-muted font-mono">
              <div>Record ID: {document.id}</div>
              <div>Study Context: {document.studyId}</div>
              <div>Site Context: {document.siteId}</div>
              <div>Created: {new Date(document.createdAt).toLocaleString()}</div>
              <div>Updated: {new Date(document.updatedAt).toLocaleString()}</div>
              <div>Total Versions: {document.versions.length}</div>
            </div>
          </Card>
        </div>

        {/* Right Column (Version History) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-ink font-heading flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  <span>Version History & Regulatory Trace</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Historical version records are preserved immutably. Older active versions are automatically superseded.
                </p>
              </div>

              {document.status !== 'ARCHIVED' && (
                <button
                  onClick={() => setIsVersionModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 border border-primary/30 rounded-sm transition-colors shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Version</span>
                </button>
              )}
            </div>

            {/* Version History List */}
            <DocumentVersionHistory
              versions={document.versions}
              currentVersionId={document.currentVersionId}
            />
          </Card>
        </div>
      </div>

      {/* Add New Version Modal */}
      {isVersionModalOpen && (
        <CreateDocumentVersionModal
          isOpen={isVersionModalOpen}
          onClose={() => setIsVersionModalOpen(false)}
          onSuccess={loadDocument}
          document={document}
          studyId={activeStudyId || 'STUDY-001'}
          siteId={activeSiteId || 'SITE-001'}
        />
      )}

      {/* Edit Metadata Modal */}
      {isEditModalOpen && (
        <EditDocumentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updated) => {
            setDocument(updated);
            setActionSuccess('Document metadata updated successfully.');
          }}
          document={document}
          studyId={activeStudyId || 'STUDY-001'}
          siteId={activeSiteId || 'SITE-001'}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
};
