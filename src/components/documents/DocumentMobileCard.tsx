import React from 'react';
import { Document } from '../../types';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { DocumentCategoryBadge } from './DocumentCategoryBadge';
import { DocumentExpiryBadge } from './DocumentExpiryBadge';
import { Card } from '../ui/Card';
import {
  ArrowRight,
  PlusCircle,
  ShieldAlert,
  Link as LinkIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isDocumentActionRequired } from '../../utils/documentCalculations';

interface DocumentMobileCardProps {
  document: Document;
  onAddVersionClick?: (doc: Document) => void;
}

export const DocumentMobileCard: React.FC<DocumentMobileCardProps> = ({
  document: doc,
  onAddVersionClick,
}) => {
  const navigate = useNavigate();
  const actionRequired = isDocumentActionRequired(doc);

  return (
    <Card
      className={`p-3.5 space-y-3 cursor-pointer hover:border-primary/40 transition-colors ${
        actionRequired ? 'border-rose-300 bg-rose-50/15' : ''
      }`}
      onClick={() => navigate(`/pi/documents/${doc.id}`)}
    >
      {/* Top Header: ID, Required tag, and Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-xs font-bold text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
            {doc.id}
          </span>
          {doc.isRequired && (
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.5 rounded-sm">
              Required
            </span>
          )}
          {actionRequired && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.5 rounded-sm">
              <ShieldAlert className="w-2.5 h-2.5" />
              Action Req.
            </span>
          )}
        </div>
        <DocumentStatusBadge status={doc.status} size="sm" />
      </div>

      {/* Title & Document Type */}
      <div>
        <h4 className="text-xs font-bold text-ink leading-snug line-clamp-2">
          {doc.title}
        </h4>
        <p className="text-[11px] text-ink-muted mt-0.5">{doc.documentType}</p>
      </div>

      {/* Badges strip: Category + Expiry */}
      <div className="flex items-center gap-2 flex-wrap">
        <DocumentCategoryBadge category={doc.category} size="sm" />
        <DocumentExpiryBadge expiryDate={doc.expiryDate} size="sm" />
      </div>

      {/* Metadata strip: Version + Owner + Linkage */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] bg-stone-100 px-1.5 py-0.5 rounded-sm border border-border text-ink font-semibold">
            v{doc.currentVersionNumber}
          </span>
          <span className="truncate max-w-[120px] text-ink">
            {doc.ownerName || doc.ownerUserId}
          </span>
        </div>

        {doc.relatedEntityType && doc.relatedEntityId && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-ink-muted bg-stone-100 px-1.5 py-0.5 rounded-sm border border-border">
            <LinkIcon className="w-2.5 h-2.5" />
            <span>{doc.relatedEntityId}</span>
          </span>
        )}
      </div>

      {/* Actions */}
      <div
        className="flex items-center justify-end gap-2 pt-2 border-t border-border/40"
        onClick={(e) => e.stopPropagation()}
      >
        {onAddVersionClick && doc.status !== 'ARCHIVED' && (
          <button
            onClick={() => onAddVersionClick(doc)}
            className="px-2.5 py-1 text-xs font-medium text-ink-muted hover:text-primary bg-surface-soft border border-border rounded-sm transition-colors flex items-center gap-1"
          >
            <PlusCircle className="w-3 h-3" />
            <span>Add Version</span>
          </button>
        )}
        <button
          onClick={() => navigate(`/pi/documents/${doc.id}`)}
          className="px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 border border-primary/30 rounded-sm transition-colors flex items-center gap-1"
        >
          <span>View Details</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </Card>
  );
};
