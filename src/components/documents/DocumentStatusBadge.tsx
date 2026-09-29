import React from 'react';
import { DocumentStatus } from '../../types';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  FileEdit,
  Archive,
  History,
} from 'lucide-react';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses =
    size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  const iconSize = size === 'sm' ? 11 : 13;

  switch (status) {
    case 'ACTIVE':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-sm ${sizeClasses}`}
        >
          {showIcon && <CheckCircle size={iconSize} className="text-emerald-700 shrink-0" />}
          <span>Active</span>
        </span>
      );

    case 'EXPIRING_SOON':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium bg-amber-50 text-amber-800 border border-amber-300 rounded-sm ${sizeClasses}`}
        >
          {showIcon && <Clock size={iconSize} className="text-amber-700 shrink-0" />}
          <span>Expiring Soon</span>
        </span>
      );

    case 'EXPIRED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold bg-rose-50 text-rose-800 border border-rose-300 rounded-sm ${sizeClasses}`}
        >
          {showIcon && <AlertTriangle size={iconSize} className="text-rose-700 shrink-0" />}
          <span>Expired</span>
        </span>
      );

    case 'DRAFT':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium bg-stone-100 text-stone-700 border border-stone-300 rounded-sm ${sizeClasses}`}
        >
          {showIcon && <FileEdit size={iconSize} className="text-stone-600 shrink-0" />}
          <span>Draft</span>
        </span>
      );

    case 'ARCHIVED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium bg-purple-50 text-purple-800 border border-purple-200 rounded-sm ${sizeClasses}`}
        >
          {showIcon && <Archive size={iconSize} className="text-purple-600 shrink-0" />}
          <span>Archived</span>
        </span>
      );

    case 'SUPERSEDED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium bg-stone-50 text-stone-500 border border-stone-200 rounded-sm ${sizeClasses}`}
        >
          {showIcon && <History size={iconSize} className="text-stone-400 shrink-0" />}
          <span>Superseded</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium bg-surface-soft text-ink-muted border border-border rounded-sm ${sizeClasses}`}
        >
          <span>{status}</span>
        </span>
      );
  }
};
