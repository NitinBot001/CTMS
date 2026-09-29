import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { teamService } from '../services/teamService';
import { RoleWithCounts, Permission, RoleType } from '../types';
import { RoleBadge } from '../components/team/RoleBadge';
import { CreateCustomRoleModal } from '../components/team/CreateCustomRoleModal';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import {
  ArrowLeft,
  Search,
  X,
  Sparkles,
  Shield,
  ArrowRight,
  ShieldAlert,
  Users,
  KeyRound,
} from 'lucide-react';

export const RoleManagementPage: React.FC = () => {
  const { activeStudyId, activeSiteId, isLoading: isStudyLoading } = useStudy();

  const [roles, setRoles] = useState<RoleWithCounts[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<RoleType | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const loadRoles = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) return;

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [rolesList, permsList] = await Promise.all([
        teamService.getRoles(context, {
          search: search.trim() || undefined,
          type: selectedType,
        }),
        teamService.getPermissions(),
      ]);

      setRoles(rolesList);
      setPermissions(permsList);
    } catch (err) {
      setError(
        (err as Error).message || 'Failed to load roles and permission catalog.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, search, selectedType]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const systemCount = roles.filter((r) => r.type === 'SYSTEM').length;
  const customCount = roles.filter((r) => r.type === 'CUSTOM').length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Link
            to="/pi/team"
            className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Site Team Directory</span>
          </Link>
          <span>/</span>
          <span className="text-ink font-semibold">Roles & Permission Catalog</span>
        </div>

        <span className="font-mono text-xs text-ink-muted bg-surface-soft px-2 py-0.5 rounded border border-border">
          {activeSiteId} · {activeStudyId}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="font-serif font-bold text-2xl text-ink tracking-tight">
            Roles & Access Permissions
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Standard ICH-GCP system roles and site-specific custom delegation templates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-serif font-bold text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors shadow-xs self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Create Custom Role</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-sm p-4 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span className="font-serif font-bold">Total Roles Catalog</span>
            <ShieldAlert className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-serif font-bold text-ink mt-2">
            {roles.length}
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5">
            {permissions.length} controlled permissions
          </p>
        </div>

        <div className="bg-surface border border-border rounded-sm p-4 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span className="font-serif font-bold">System Role Templates</span>
            <Shield className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-serif font-bold text-ink mt-2">
            {systemCount}
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5">
            Institutional baseline (read-only)
          </p>
        </div>

        <div className="bg-surface border border-border rounded-sm p-4 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span className="font-serif font-bold">Custom Roles</span>
            <Sparkles className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-serif font-bold text-ink mt-2">
            {customCount}
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5">
            Site-tailored delegation profiles
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border rounded-sm p-3.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roles by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-surface border border-border rounded-sm focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary text-ink placeholder:text-ink-muted"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 self-start md:self-auto">
          {(['ALL', 'SYSTEM', 'CUSTOM'] as const).map((typeKey) => (
            <button
              key={typeKey}
              onClick={() => setSelectedType(typeKey)}
              className={`px-3 py-1.5 text-xs font-serif font-semibold rounded-sm border transition-colors ${
                selectedType === typeKey
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-soft text-ink-secondary border-border hover:border-ink-muted'
              }`}
            >
              {typeKey === 'ALL'
                ? 'All Roles'
                : typeKey === 'SYSTEM'
                ? 'System Roles'
                : 'Custom Roles'}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {isLoading || isStudyLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-sm text-center">
          <p className="text-sm font-semibold text-semantic-danger">{error}</p>
          <button
            onClick={() => loadRoles()}
            className="mt-3 px-3 py-1.5 text-xs font-serif font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-sm"
          >
            Retry
          </button>
        </div>
      ) : roles.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="w-8 h-8 text-ink-muted" />}
          title="No Roles Matching Criteria"
          description="No roles were found matching your active filter and search terms."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setSelectedType('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => {
            const isSystem = role.type === 'SYSTEM';

            return (
              <div
                key={role.id}
                className="bg-surface border border-border rounded-sm p-4 shadow-xs flex flex-col justify-between hover:border-border/80 hover:shadow-subtle transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-serif font-bold text-base text-ink">
                          {role.name}
                        </h2>
                      </div>
                      <span className="font-mono text-[10px] text-ink-muted">
                        ID: {role.id}
                      </span>
                    </div>

                    <RoleBadge type={role.type} size="xs" />
                  </div>

                  <p className="text-xs text-ink-secondary mt-2.5 leading-relaxed line-clamp-2">
                    {role.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-ink-muted" />
                      <span>
                        <strong className="text-ink">{role.permissionIds.length}</strong>{' '}
                        grants
                      </span>
                    </span>

                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-ink-muted" />
                      <span>
                        <strong className="text-ink">{role.assignedUserCount}</strong>{' '}
                        at site
                      </span>
                    </span>
                  </div>

                  <Link
                    to={`/pi/team/roles/${role.id}`}
                    className="inline-flex items-center gap-1 text-xs font-serif font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    <span>{isSystem ? 'View Template' : 'Edit Matrix'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Custom Role Modal */}
      {isCreateModalOpen && (
        <CreateCustomRoleModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            loadRoles();
          }}
          permissions={permissions}
          studyId={activeStudyId}
          siteId={activeSiteId}
        />
      )}
    </div>
  );
};
