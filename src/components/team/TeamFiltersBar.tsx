import React from 'react';
import { Link } from 'react-router-dom';
import { Search, X, RotateCcw, UserPlus, ShieldAlert } from 'lucide-react';
import { TeamFilters, Role, UserStatus } from '../../types';

interface TeamFiltersBarProps {
  filters: TeamFilters;
  onFilterChange: (newFilters: TeamFilters) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  roles: Role[];
  onOpenAssignModal: () => void;
}

export const TeamFiltersBar: React.FC<TeamFiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  roles,
  onOpenAssignModal,
}) => {
  const isFiltered =
    Boolean(filters.search && filters.search.trim().length > 0) ||
    Boolean(filters.status && filters.status !== 'ALL') ||
    Boolean(filters.roleId && filters.roleId !== 'ALL');

  return (
    <div className="bg-surface border border-border rounded-sm p-4 mb-6 shadow-xs space-y-3">
      {/* Top Bar: Search, Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, designation, email, or role..."
            value={filters.search || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                search: e.target.value,
              })
            }
            className="w-full pl-9 pr-8 py-2 text-xs bg-surface border border-border rounded-sm focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-ink placeholder:text-ink-muted"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <Link
            to="/pi/team/roles"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-serif font-semibold text-ink-secondary bg-surface-soft border border-border hover:border-ink-muted rounded-sm transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-ink-muted" />
            <span>Manage Roles</span>
          </Link>

          <button
            type="button"
            onClick={onOpenAssignModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-serif font-bold text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Assign Role</span>
          </button>
        </div>
      </div>

      {/* Filter Selectors Bar */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <label className="text-ink-muted font-medium whitespace-nowrap">Status:</label>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value as UserStatus | 'ALL',
              })
            }
            className="text-xs bg-surface border border-border rounded-sm px-2 py-1 text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Staff</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <label className="text-ink-muted font-medium whitespace-nowrap">Role:</label>
          <select
            value={filters.roleId || 'ALL'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                roleId: e.target.value,
              })
            }
            className="text-xs bg-surface border border-border rounded-sm px-2 py-1 text-ink focus:outline-hidden focus:ring-1 focus:ring-primary max-w-[200px] truncate"
          >
            <option value="ALL">All Assigned Roles</option>
            <optgroup label="System Roles">
              {roles
                .filter((r) => r.type === 'SYSTEM')
                .map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Custom Roles">
              {roles
                .filter((r) => r.type === 'CUSTOM')
                .map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>

        {/* Count & Reset */}
        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className="text-ink-muted">
            Showing <strong className="text-ink">{filteredCount}</strong> of{' '}
            <strong className="text-ink">{totalCount}</strong> team members
          </span>

          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-primary hover:text-primary-dark font-medium underline-offset-2 hover:underline transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
