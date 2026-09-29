import React from 'react';
import { Document } from '../../types';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { DocumentCategoryBadge } from './DocumentCategoryBadge';
import { DocumentExpiryBadge } from './DocumentExpiryBadge';
import {
  ArrowRight,
  PlusCircle,
  ShieldAlert,
  Link as LinkIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isDocumentActionRequired } from '../../utils/documentCalculations';

interface DocumentTableProps {
  documents: Document[];
  onAddVersionClick?: (doc: Document) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onAddVersionClick,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-surface border border-border rounded-sm shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className="w-full text-left border-collapse text-xs"
          aria-label="Clinical Trial Document Register"
        >
          <thead>
            <tr className="bg-surface-soft border-b border-border text-ink-muted uppercase font-semibold text-[11px] tracking-wider">
              <th scope="col" className="py-3 px-4">Doc ID & Requirement</th>
              <th scope="col" className="py-3 px-3">Title & Document Type</th>
              <th scope="col" className="py-3 px-3">Category</th>
              <th scope="col" className="py-3 px-3">Current Version</th>
              <th scope="col" className="py-3 px-3">Status</th>
              <th scope="col" className="py-3 px-3">Expiry Horizon</th>
              <th scope="col" className="py-3 px-3">Owner</th>
              <th scope="col" className="py-3 px-3">Linked Entity</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.map((doc) => {
              const actionRequired = isDocumentActionRequired(doc);

              return (
                <tr
                  key={doc.id}
                  onClick={() => navigate(`/pi/documents/${doc.id}`)}
                  className={`hover:bg-surface-soft/80 transition-colors group cursor-pointer ${
                    actionRequired ? 'bg-rose-50/20' : ''
                  }`}
                >
                  {/* Doc ID & Required flag */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
                        {doc.id}
                      </span>
                      {doc.isRequired && (
                        <span
                          className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded-sm"
                          title="Mandatory GCP/Protocol requirement"
                        >
                          Required
                        </span>
                      )}
                    </div>
                    {actionRequired && (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-700 mt-1">
                        <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>Action Required</span>
                      </div>
                    )}
                  </td>

                  {/* Title & Document Type */}
                  <td className="py-3.5 px-3 max-w-[280px]">
                    <span className="font-semibold text-ink block truncate leading-tight group-hover:text-primary transition-colors">
                      {doc.title}
                    </span>
                    <span className="text-[11px] text-ink-muted block mt-0.5">
                      {doc.documentType}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <DocumentCategoryBadge category={doc.category} size="sm" />
                  </td>

                  {/* Current Version */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-ink bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-sm">
                        v{doc.currentVersionNumber}
                      </span>
                      <span className="text-[10px] text-ink-muted">
                        ({doc.versions.length} {doc.versions.length === 1 ? 'ver' : 'vers'})
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <DocumentStatusBadge status={doc.status} size="sm" />
                  </td>

                  {/* Expiry Horizon */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <DocumentExpiryBadge expiryDate={doc.expiryDate} size="sm" />
                  </td>

                  {/* Owner */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="leading-tight">
                      <span className="text-ink font-medium block">
                        {doc.ownerName || doc.ownerUserId}
                      </span>
                      {doc.ownerRoleId && (
                        <span className="text-[10px] text-ink-muted block">
                          {doc.ownerRoleId.replace('ROLE_', '')}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Linked Entity */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {doc.relatedEntityType && doc.relatedEntityId ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-ink-muted bg-stone-100 px-1.5 py-0.5 rounded-sm border border-border">
                        <LinkIcon className="w-2.5 h-2.5 text-ink-muted" />
                        <span>
                          {doc.relatedEntityType}: {doc.relatedEntityId}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-ink-muted/50">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div
                      className="inline-flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onAddVersionClick && doc.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => onAddVersionClick(doc)}
                          className="px-2 py-1 text-[11px] font-medium text-ink-muted hover:text-primary hover:bg-surface-soft border border-border rounded-sm transition-colors flex items-center gap-1"
                          title="Upload new document version"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>Version</span>
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/pi/documents/${doc.id}`)}
                        className="px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 border border-primary/30 rounded-sm transition-colors flex items-center gap-1"
                        title="View document details and history"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
