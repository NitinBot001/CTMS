import React from 'react';
import { DocumentCategory } from '../../types';
import {
  FileText,
  Shield,
  BookOpen,
  UserCheck,
  Building,
  GraduationCap,
  AlertCircle,
  Pill,
  TestTube,
  FileSpreadsheet,
  Tag,
} from 'lucide-react';

interface DocumentCategoryBadgeProps {
  category: DocumentCategory;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const DocumentCategoryBadge: React.FC<DocumentCategoryBadgeProps> = ({
  category,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses =
    size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  const iconSize = size === 'sm' ? 11 : 13;

  const config: Record<
    DocumentCategory,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    REGULATORY: {
      label: 'Regulatory',
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
      icon: <FileText size={iconSize} className="text-indigo-700 shrink-0" />,
    },
    ETHICS: {
      label: 'Ethics',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      icon: <Shield size={iconSize} className="text-emerald-700 shrink-0" />,
    },
    PROTOCOL: {
      label: 'Protocol',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
      icon: <BookOpen size={iconSize} className="text-blue-700 shrink-0" />,
    },
    INFORMED_CONSENT: {
      label: 'Informed Consent',
      bg: 'bg-cyan-50',
      text: 'text-cyan-800',
      border: 'border-cyan-200',
      icon: <UserCheck size={iconSize} className="text-cyan-700 shrink-0" />,
    },
    SITE: {
      label: 'Site',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: <Building size={iconSize} className="text-amber-700 shrink-0" />,
    },
    TRAINING: {
      label: 'Training',
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-200',
      icon: <GraduationCap size={iconSize} className="text-teal-700 shrink-0" />,
    },
    SAFETY: {
      label: 'Safety',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      icon: <AlertCircle size={iconSize} className="text-rose-700 shrink-0" />,
    },
    PHARMACY: {
      label: 'Pharmacy',
      bg: 'bg-purple-50',
      text: 'text-purple-800',
      border: 'border-purple-200',
      icon: <Pill size={iconSize} className="text-purple-700 shrink-0" />,
    },
    LABORATORY: {
      label: 'Laboratory',
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
      icon: <TestTube size={iconSize} className="text-sky-700 shrink-0" />,
    },
    STUDY_REPORT: {
      label: 'Study Report',
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: <FileSpreadsheet size={iconSize} className="text-orange-700 shrink-0" />,
    },
    OTHER: {
      label: 'Other',
      bg: 'bg-stone-100',
      text: 'text-stone-700',
      border: 'border-stone-200',
      icon: <Tag size={iconSize} className="text-stone-600 shrink-0" />,
    },
  };

  const item = config[category] || config.OTHER;

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-sm border ${item.bg} ${item.text} ${item.border} ${sizeClasses}`}
    >
      {showIcon && item.icon}
      <span>{item.label}</span>
    </span>
  );
};
