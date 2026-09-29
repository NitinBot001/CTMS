import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { teamService } from '../services/teamService';
import { Role, Permission, TeamMemberSummary } from '../types';
import { RoleBadge } from '../components/team/RoleBadge';
import { PermissionMatrix } from '../components/team/PermissionMatrix';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  ArrowLeft,
  Shield,
  Sparkles,
  Save,
  AlertCircle,
  CheckCircle2,
  Users,
  Lock,
  RotateCcw,
} from 'lucide-react';

export const RoleDetailPage: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const { activeStudyId, activeSiteId, isLoading: isStudyLoading } = useStudy();

  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [assignedMembers, setAssignedMembers] = useState<TeamMemberSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state for custom roles
  const [editName, setEditName] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadRoleData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId || !roleId) return;

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [roleData, permsList, teamMembers] = await Promise.all([
        teamService.getRoleById(context, roleId),
        teamService.getPermissions(),
        teamService.getTeamMembers(context),
      ]);

      if (roleData) {
        setRole(roleData);
        setEditName(roleData.name);
        setEditDescription(roleData.description);
        setSelectedPermissionIds(roleData.permissionIds);

        // Find members who hold this role at this site
        const holders = teamMembers.filter((m) =>
          m.roles.some((r) => r.id.toLowerCase() === roleData.id.toLowerCase())
        );
        setAssignedMembers(holders);
      } else {
        setRole(null);
      }

      setPermissions(permsList);
    } catch (err) {
      setError((err as Error).message || 'Failed to load role details.');
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, roleId]);

  useEffect(() => {
    loadRoleData();
  }, [loadRoleData]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || role.type === 'SYSTEM' || !activeStudyId || !activeSiteId) return;

    setSaveFeedback(null);

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setSaveFeedback({
        type: 'error',
        message: 'Role name cannot be empty.',
      });
      return;
    }

    if (selectedPermissionIds.length === 0) {
      setSaveFeedback({
        type: 'error',
        message: 'At least one permission must be selected.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const updated = await teamService.updateCustomRole(context, role.id, {
        name: trimmedName,
        description: editDescription.trim(),
        permissionIds: selectedPermissionIds,
      });

      setRole(updated);
      setSaveFeedback({
        type: 'success',
        message: `Role "${updated.name}" updated successfully. Active assignments updated.`,
      });
    } catch (err) {
      setSaveFeedback({
        type: 'error',
        message: (err as Error).message || 'Failed to save role changes.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDraft = () => {
    if (!role) return;
    setEditName(role.name);
    setEditDescription(role.description);
    setSelectedPermissionIds(role.permissionIds);
    setSaveFeedback(null);
  };

  if (isLoading || isStudyLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Role Detail Load Failure"
          message={error}
          onRetry={loadRoleData}
        />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Link
            to="/pi/team/roles"
            className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Roles Catalog</span>
          </Link>
          <span>/</span>
          <span className="font-mono">{roleId}</span>
        </div>

        <EmptyState
          icon={<AlertCircle className="w-8 h-8 text-ink-muted" />}
          title="Role Not Found"
          description={`No clinical role with ID "${roleId}" was found in the catalog.`}
          actionLabel="Return to Roles Directory"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  const isSystem = role.type === 'SYSTEM';
  const hasChanges =
    !isSystem &&
    (editName !== role.name ||
      editDescription !== role.description ||
      JSON.stringify(selectedPermissionIds.sort()) !==
        JSON.stringify([...role.permissionIds].sort()));

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Link
            to="/pi/team"
            className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
          >
            <span>Team Directory</span>
          </Link>
          <span>/</span>
          <Link
            to="/pi/team/roles"
            className="hover:text-primary transition-colors font-medium"
          >
            <span>Roles Catalog</span>
          </Link>
          <span>/</span>
          <span className="text-ink font-semibold">{role.name}</span>
        </div>

        <span className="font-mono text-xs text-ink-muted bg-surface-soft px-2 py-0.5 rounded border border-border">
          {activeSiteId} · {activeStudyId}
        </span>
      </div>

      {/* Save Feedback Banner */}
      {saveFeedback && (
        <div
          className={`p-3 rounded-sm border flex items-start gap-2.5 text-xs ${
            saveFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-secondary'
              : 'bg-red-50 border-red-200 text-semantic-danger'
          }`}
        >
          {saveFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <p className="font-medium">{saveFeedback.message}</p>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-surface border border-border rounded-sm p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 ${
                isSystem
                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {isSystem ? (
                <Shield className="w-6 h-6" />
              ) : (
                <Sparkles className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif font-bold text-xl text-ink">
                  {isSystem ? role.name : editName || role.name}
                </h1>
                <RoleBadge type={role.type} size="sm" />
                <span className="font-mono text-xs text-ink-muted px-2 py-0.5 bg-surface-soft border border-border rounded">
                  {role.id}
                </span>
              </div>

              <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed max-w-2xl">
                {isSystem ? role.description : editDescription || role.description}
              </p>
            </div>
          </div>

          {/* Type Notice Pill */}
          <div className="self-start">
            {isSystem ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-sm text-xs text-slate-800">
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-medium">System Template (Protected)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span className="font-medium">Editable Custom Role</span>
              </div>
            )}
          </div>
        </div>

        {/* System Protected Notice */}
        {isSystem && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-700 flex items-start gap-2.5">
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-500" />
            <p className="leading-relaxed">
              <strong>Institutional Baseline Role:</strong> This system template adheres
              to standard ICH-GCP protocol oversight rules and is protected against
              destructive editing. Site-specific responsibilities can be defined by
              creating a custom role.
            </p>
          </div>
        )}

        {/* Custom Role Editable Fields */}
        {!isSystem && (
          <form onSubmit={handleSaveChanges} className="space-y-3 pt-3 border-t border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-serif font-bold text-ink">
                  Role Title <span className="text-semantic-danger">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs bg-surface border border-border rounded-sm px-3 py-2 text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-serif font-bold text-ink">
                  Role Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-xs bg-surface border border-border rounded-sm px-3 py-2 text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {hasChanges && (
                <button
                  type="button"
                  onClick={handleResetDraft}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-serif font-semibold text-ink-secondary hover:text-ink bg-surface-soft border border-border rounded-sm transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Changes</span>
                </button>
              )}
              <button
                type="submit"
                disabled={isSaving || !hasChanges}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-serif font-bold text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Role Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Assigned Site Staff Section */}
      <div className="bg-surface border border-border rounded-sm shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-surface-soft border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-ink-muted" />
            <h2 className="font-serif font-bold text-ink text-sm">
              Staff Delegated at Current Site
            </h2>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-white border border-border rounded text-ink">
            {assignedMembers.length} {assignedMembers.length === 1 ? 'Member' : 'Members'}
          </span>
        </div>

        {assignedMembers.length === 0 ? (
          <div className="p-4 text-xs text-ink-muted text-center italic">
            No team members are currently assigned this role at {activeSiteId}.
          </div>
        ) : (
          <div className="p-4 flex flex-wrap gap-2">
            {assignedMembers.map((member) => (
              <Link
                key={member.user.id}
                to={`/pi/team/${member.user.id}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-soft hover:bg-surface border border-border hover:border-ink-muted rounded-sm transition-colors text-xs"
              >
                <div className="w-5 h-5 rounded-xs bg-primary/10 text-primary font-serif font-bold text-[10px] flex items-center justify-center">
                  {member.user.displayName[0]}
                </div>
                <span className="font-semibold text-ink">{member.user.displayName}</span>
                <span className="text-[10px] text-ink-muted">({member.user.designation})</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Permission Matrix Section */}
      <div className="bg-surface border border-border rounded-sm shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-surface-soft border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif font-bold text-ink text-base">
              Permission Grants Matrix
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              {isSystem
                ? 'Standard permission grants specified for this system role template'
                : 'Configure authorized actions permitted under this site custom role'}
            </p>
          </div>

          <div className="text-xs font-mono font-bold px-2.5 py-1 bg-white border border-border rounded text-ink">
            {isSystem
              ? `${role.permissionIds.length} of ${permissions.length} Grants`
              : `${selectedPermissionIds.length} of ${permissions.length} Selected`}
          </div>
        </div>

        <div className="p-5">
          <PermissionMatrix
            permissions={permissions}
            selectedPermissionIds={
              isSystem ? role.permissionIds : selectedPermissionIds
            }
            onChange={!isSystem ? setSelectedPermissionIds : undefined}
            readOnly={isSystem}
            showUnassignedInReadOnly={true}
          />
        </div>
      </div>
    </div>
  );
};
