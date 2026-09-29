import React from 'react';
import { Check, Minus, CheckSquare, Square } from 'lucide-react';
import { Permission, PermissionModule } from '../../types';

interface PermissionMatrixProps {
  permissions: Permission[];
  selectedPermissionIds: string[];
  onChange?: (newSelectedIds: string[]) => void;
  readOnly?: boolean;
  showUnassignedInReadOnly?: boolean;
  className?: string;
}

const MODULE_DISPLAY_CONFIG: Record<
  PermissionModule,
  { label: string; description: string; badgeColor: string }
> = {
  STUDY: {
    label: 'Study Protocol & Site',
    description: 'Protocol configuration, site metadata, and study parameters',
    badgeColor: 'bg-blue-50 text-blue-900 border-blue-200',
  },
  PARTICIPANTS: {
    label: 'Participants & Screening',
    description: 'Subject enrollment, demographic data, and screening logs',
    badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  },
  VISITS: {
    label: 'Visits & Procedures',
    description: 'Protocol calendar, allowable windows, and clinical activities',
    badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  },
  SAFETY: {
    label: 'Safety & Pharmacovigilance',
    description: 'Adverse event logging, causality grading, and PI medical reviews',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  COMPLIANCE: {
    label: 'Protocol Compliance & Deviations',
    description: 'Non-compliance registers, root cause reviews, and CAPA actions',
    badgeColor: 'bg-rose-50 text-rose-900 border-rose-200',
  },
  TEAM: {
    label: 'Team & Role Assignments',
    description: 'Site staff directory, role assignments, and custom role templates',
    badgeColor: 'bg-purple-50 text-purple-900 border-purple-200',
  },
  DOCUMENTS: {
    label: 'Regulatory Documents',
    description: 'Investigator brochure, study binder, and versioned filings',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  TASKS: {
    label: 'Clinical Operational Tasks',
    description: 'Investigator to-do checklists, deadlines, and operational workflows',
    badgeColor: 'bg-teal-50 text-teal-900 border-teal-200',
  },
  REPORTS: {
    label: 'Analytics & Audit Exports',
    description: 'Recruitment velocity, visit compliance reports, and audit data export',
    badgeColor: 'bg-cyan-50 text-cyan-900 border-cyan-200',
  },
};

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  permissions,
  selectedPermissionIds,
  onChange,
  readOnly = false,
  showUnassignedInReadOnly = true,
  className = '',
}) => {
  const selectedSet = new Set(selectedPermissionIds);

  // Group permissions by module in controlled order
  const moduleOrder: PermissionModule[] = [
    'STUDY',
    'PARTICIPANTS',
    'VISITS',
    'SAFETY',
    'COMPLIANCE',
    'TEAM',
    'DOCUMENTS',
    'TASKS',
    'REPORTS',
  ];

  const grouped = permissions.reduce<Record<PermissionModule, Permission[]>>(
    (acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    },
    {} as Record<PermissionModule, Permission[]>
  );

  const handleToggle = (permId: string) => {
    if (readOnly || !onChange) return;
    if (selectedSet.has(permId)) {
      onChange(selectedPermissionIds.filter((id) => id !== permId));
    } else {
      onChange([...selectedPermissionIds, permId]);
    }
  };

  const handleToggleModule = (module: PermissionModule) => {
    if (readOnly || !onChange) return;
    const modulePerms = grouped[module] || [];
    const modulePermIds = modulePerms.map((p) => p.id);
    const allSelected = modulePermIds.every((id) => selectedSet.has(id));

    if (allSelected) {
      onChange(selectedPermissionIds.filter((id) => !modulePermIds.includes(id)));
    } else {
      const union = Array.from(new Set([...selectedPermissionIds, ...modulePermIds]));
      onChange(union);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Summary for interactive mode */}
      {!readOnly && (
        <div className="flex items-center justify-between p-3 bg-surface-soft border border-border rounded-sm text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">Permission Grants:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-border font-bold text-primary">
              {selectedPermissionIds.length} of {permissions.length}
            </span>
            <span className="text-ink-muted">permissions active</span>
          </div>
          {onChange && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange(permissions.map((p) => p.id))}
                className="text-primary hover:underline font-medium text-xs"
              >
                Select All
              </button>
              <span className="text-border">|</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-ink-muted hover:text-ink font-medium text-xs"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moduleOrder.map((modKey) => {
          const modPerms = grouped[modKey] || [];
          if (modPerms.length === 0) return null;

          const activeCount = modPerms.filter((p) => selectedSet.has(p.id)).length;
          const isAllSelected = activeCount === modPerms.length;
          const isPartiallySelected = activeCount > 0 && !isAllSelected;

          // In read-only mode without showUnassigned, skip modules with 0 permissions
          if (readOnly && !showUnassignedInReadOnly && activeCount === 0) {
            return null;
          }

          const config = MODULE_DISPLAY_CONFIG[modKey];

          return (
            <div
              key={modKey}
              className="border border-border rounded-sm bg-white overflow-hidden shadow-xs flex flex-col"
            >
              {/* Module Header */}
              <div className="px-3.5 py-2.5 bg-surface-soft border-b border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${config.badgeColor}`}
                    >
                      {modKey}
                    </span>
                    <span className="font-serif font-bold text-ink text-sm">
                      {config.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5 line-clamp-1">
                    {config.description}
                  </p>
                </div>

                {!readOnly && onChange ? (
                  <button
                    type="button"
                    onClick={() => handleToggleModule(modKey)}
                    className="text-ink-muted hover:text-primary transition-colors p-1"
                    title={isAllSelected ? 'Deselect Module' : 'Select Module'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : isPartiallySelected ? (
                      <Minus className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-border" />
                    )}
                  </button>
                ) : (
                  <span
                    className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                      activeCount > 0
                        ? 'bg-emerald-50 text-secondary'
                        : 'bg-gray-100 text-ink-muted'
                    }`}
                  >
                    {activeCount}/{modPerms.length}
                  </span>
                )}
              </div>

              {/* Permissions List */}
              <div className="p-3 divide-y divide-border/40 flex-1 space-y-1">
                {modPerms.map((perm) => {
                  const isChecked = selectedSet.has(perm.id);

                  if (readOnly && !showUnassignedInReadOnly && !isChecked) {
                    return null;
                  }

                  return (
                    <div
                      key={perm.id}
                      className={`pt-2 first:pt-0 flex items-start gap-2.5 ${
                        !readOnly ? 'cursor-pointer' : ''
                      } ${!isChecked && readOnly ? 'opacity-40' : ''}`}
                      onClick={() => !readOnly && handleToggle(perm.id)}
                    >
                      {/* Checkbox indicator */}
                      {!readOnly ? (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggle(perm.id)}
                          className="mt-0.5 rounded text-primary focus:ring-primary h-3.5 w-3.5 border-border"
                        />
                      ) : (
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-xs flex items-center justify-center flex-shrink-0 ${
                            isChecked
                              ? 'bg-secondary text-white'
                              : 'bg-surface-soft text-ink-muted border border-border'
                          }`}
                        >
                          {isChecked ? (
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          ) : (
                            <Minus className="w-2.5 h-2.5 text-border" />
                          )}
                        </div>
                      )}

                      {/* Permission Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-xs font-medium ${
                              isChecked ? 'text-ink font-semibold' : 'text-ink-muted'
                            }`}
                          >
                            {perm.name}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-surface-soft text-ink-muted border border-border/50">
                            {perm.action}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-muted leading-tight mt-0.5">
                          {perm.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
