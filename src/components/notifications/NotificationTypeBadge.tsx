import React from 'react';
import {
  ShieldAlert,
  FileCheck2,
  CheckSquare,
  FileText,
  CalendarCheck,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { NotificationType } from '../../types';

interface NotificationTypeBadgeProps {
  type: NotificationType;
  showIcon?: boolean;
}

export const NotificationTypeBadge: React.FC<NotificationTypeBadgeProps> = ({
  type,
  showIcon = true,
}) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'SAFETY_REVIEW':
        return {
          label: 'Safety Review',
          icon: ShieldAlert,
          classes: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'SAFETY_FOLLOWUP':
        return {
          label: 'Safety Follow-up',
          icon: ShieldAlert,
          classes: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'COMPLIANCE_REVIEW':
        return {
          label: 'Compliance Review',
          icon: FileCheck2,
          classes: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'CAPA_OVERDUE':
        return {
          label: 'CAPA Overdue',
          icon: AlertTriangle,
          classes: 'bg-red-50 text-red-800 border-red-200',
        };
      case 'TASK_ASSIGNED':
        return {
          label: 'Task Assigned',
          icon: CheckSquare,
          classes: 'bg-sky-50 text-sky-800 border-sky-200',
        };
      case 'TASK_REVIEW':
        return {
          label: 'Task Review',
          icon: CheckSquare,
          classes: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
      case 'TASK_REVISION':
        return {
          label: 'Task Revision',
          icon: CheckSquare,
          classes: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'TASK_OVERDUE':
        return {
          label: 'Task Overdue',
          icon: AlertTriangle,
          classes: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'DOCUMENT_EXPIRING':
        return {
          label: 'Doc Expiring',
          icon: FileText,
          classes: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'DOCUMENT_EXPIRED':
        return {
          label: 'Doc Expired',
          icon: FileText,
          classes: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'VISIT_DUE':
        return {
          label: 'Visit Due',
          icon: CalendarCheck,
          classes: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'VISIT_OVERDUE':
        return {
          label: 'Visit Overdue',
          icon: CalendarCheck,
          classes: 'bg-purple-50 text-purple-800 border-purple-200',
        };
      case 'TEAM_ASSIGNMENT':
        return {
          label: 'Team Assignment',
          icon: UserCheck,
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      default:
        return {
          label: type,
          icon: FileText,
          classes: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  const { label, icon: Icon, classes } = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-xs border ${classes}`}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{label}</span>
    </span>
  );
};
