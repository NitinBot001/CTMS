import React from 'react';
import {
  getDaysUntilExpiry,
  calculateDocumentExpiryState,
  DOCUMENT_REFERENCE_DATE,
} from '../../utils/documentCalculations';
import { Calendar, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface DocumentExpiryBadgeProps {
  expiryDate?: string;
  referenceDate?: string;
  size?: 'sm' | 'md';
  showDaysOnly?: boolean;
}

export const DocumentExpiryBadge: React.FC<DocumentExpiryBadgeProps> = ({
  expiryDate,
  referenceDate = DOCUMENT_REFERENCE_DATE,
  size = 'md',
  showDaysOnly = false,
}) => {
  const sizeClasses =
    size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  const iconSize = size === 'sm' ? 11 : 13;

  if (!expiryDate) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-medium bg-stone-50 text-stone-600 border border-stone-200 rounded-sm ${sizeClasses}`}
      >
        <Calendar size={iconSize} className="text-stone-400 shrink-0" />
        <span>No Expiration</span>
      </span>
    );
  }

  const days = getDaysUntilExpiry(expiryDate, referenceDate);
  const state = calculateDocumentExpiryState({ expiryDate }, referenceDate);

  if (state === 'EXPIRED') {
    const absDays = days !== null ? Math.abs(days) : 0;
    const label =
      absDays === 0
        ? 'Expired today'
        : absDays === 1
        ? 'Expired yesterday'
        : `Expired ${absDays}d ago`;

    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold bg-rose-50 text-rose-800 border border-rose-300 rounded-sm ${sizeClasses}`}
        title={`Expired on ${expiryDate} (${absDays} days past threshold)`}
      >
        <AlertTriangle size={iconSize} className="text-rose-700 shrink-0" />
        <span>{showDaysOnly ? label : `${label} (${expiryDate})`}</span>
      </span>
    );
  }

  if (state === 'EXPIRING_SOON') {
    const label =
      days === 0
        ? 'Expires today'
        : days === 1
        ? 'Expires tomorrow'
        : `Expires in ${days}d`;

    return (
      <span
        className={`inline-flex items-center gap-1 font-medium bg-amber-50 text-amber-900 border border-amber-300 rounded-sm ${sizeClasses}`}
        title={`Document expires on ${expiryDate} (${days} days remaining)`}
      >
        <Clock size={iconSize} className="text-amber-700 shrink-0" />
        <span>{showDaysOnly ? label : `${label} (${expiryDate})`}</span>
      </span>
    );
  }

  // Active (> 30 days)
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium bg-emerald-50/70 text-emerald-800 border border-emerald-200 rounded-sm ${sizeClasses}`}
      title={`Valid until ${expiryDate} (${days} days remaining)`}
    >
      <CheckCircle size={iconSize} className="text-emerald-600 shrink-0" />
      <span>{showDaysOnly ? `${days}d left` : `${expiryDate} (${days}d)`}</span>
    </span>
  );
};
