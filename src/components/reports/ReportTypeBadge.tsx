import React from 'react';
import { ReportType } from '../../types';

interface ReportTypeBadgeProps {
  type: ReportType;
  size?: 'sm' | 'md';
}

const TYPE_CONFIG: Record<
  ReportType,
  { label: string; bg: string; text: string; border: string }
> = {
  OPERATIONAL: {
    label: 'Operational Summary',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  PARTICIPANT: {
    label: 'Participants',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  VISIT: {
    label: 'Visits & Schedule',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
  },
  SAFETY: {
    label: 'Safety Pharmacovigilance',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
  COMPLIANCE: {
    label: 'Protocol Compliance',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  TASK: {
    label: 'Site Tasks & Approvals',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
  },
  DOCUMENT: {
    label: 'Regulatory Binder',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
};

export const ReportTypeBadge: React.FC<ReportTypeBadgeProps> = ({
  type,
  size = 'sm',
}) => {
  const config = TYPE_CONFIG[type] || {
    label: type,
    bg: 'bg-stone-50',
    text: 'text-stone-700',
    border: 'border-stone-200',
  };

  const sizeClasses =
    size === 'md'
      ? 'px-2.5 py-1 text-xs font-semibold'
      : 'px-2 py-0.5 text-[11px] font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-sm border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
};
