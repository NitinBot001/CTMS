import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { teamService } from '../services/teamService';
import { TeamMemberDetail, Role, Permission, TeamMemberSummary } from '../types';
import { RoleBadge } from '../components/team/RoleBadge';
import { UserStatusBadge } from '../components/team/UserStatusBadge';
import { PermissionMatrix } from '../components/team/PermissionMatrix';
import { AssignRoleModal } from '../components/team/AssignRoleModal';
import { Skeleton } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  ShieldCheck,
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  UserX,
} from 'lucide-react';

export const TeamMemberDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { activeStudyId, activeSiteId, isLoading: isStudyLoading } = useStudy();

  const [memberDetail, setMemberDetail] = useState<TeamMemberDetail | null>(null);
  const [allSiteRoles, setAllSiteRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [allSiteMembers, setAllSiteMembers] = useState<TeamMemberSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);

  const loadMemberData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [detail, roles, perms, members] = await Promise.all([
        teamService.getTeamMemberById(context, userId),
        teamService.getRoles(context),
        teamService.getPermissions(),
        teamService.getTeamMembers(context),
      ]);

      setMemberDetail(detail);
      setAllSiteRoles(roles);
      setAllPermissions(perms);
      setAllSiteMembers(members);
    } catch (err) {
      setError(
        (err as Error).message || 'Failed to load member profile and assignments.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, userId]);

  useEffect(() => {
    loadMemberData();
  }, [loadMemberData]);

  const handleRemoveAssignment = async (assignmentId: string, roleName: string) => {
    if (!activeStudyId || !activeSiteId) return;

    const confirmed = window.confirm(
      `Are you sure you want to revoke the role "${roleName}" from ${memberDetail?.user.displayName}?`
    );
    if (!confirmed) return;

    setIsRemovingId(assignmentId);
    setActionFeedback(null);

    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const success = await teamService.removeRoleAssignment(context, assignmentId);

      if (success) {
        setActionFeedback({
          type: 'success',
          message: `Role "${roleName}" was successfully revoked.`,
        });
        await loadMemberData();
      } else {
        setActionFeedback({
          type: 'error',
          message: 'Unable to revoke role assignment.',
        });
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: (err as Error).message || 'Error removing role assignment.',
      });
    } finally {
      setIsRemovingId(null);
    }
  };

  if (isLoading || isStudyLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Team Member Load Failure"
          message={error}
          onRetry={loadMemberData}
        />
      </div>
    );
  }

  // Handle cross-site isolation: User belongs to another site or does not exist in current scope
  if (!memberDetail) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Link
            to="/pi/team"
            className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Team Directory</span>
          </Link>
          <span>/</span>
          <span className="font-mono">{userId}</span>
        </div>

        <EmptyState
          icon={<UserX className="w-8 h-8 text-ink-muted" />}
          title="Team Member Not Found at Current Site"
          description={`The requested user ID "${userId}" has no active delegations or profile within site scope "${activeSiteId}" (${activeStudyId}). Site isolation prevents access to cross-site staff records.`}
          actionLabel="Return to Site Team"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  const { user, roles, assignments, effectivePermissions, siteId, studyId } =
    memberDetail;

  const initials = user.displayName
    .replace(/^Dr\.\s+/i, '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

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
            <span>Site Team</span>
          </Link>
          <span>/</span>
          <span className="text-ink font-semibold">{user.displayName}</span>
        </div>

        <span className="font-mono text-xs text-ink-muted bg-surface-soft px-2 py-0.5 rounded border border-border">
          {siteId} · {studyId}
        </span>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-sm border flex items-start gap-2.5 text-xs ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-secondary'
              : 'bg-red-50 border-red-200 text-semantic-danger'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          )}
          <p className="font-medium">{actionFeedback.message}</p>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-surface border border-border rounded-sm p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-sm bg-primary/10 border border-primary/20 text-primary font-serif font-bold text-xl flex items-center justify-center flex-shrink-0">
              {initials}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif font-bold text-xl text-ink">
                  {user.displayName}
                </h1>
                <UserStatusBadge status={user.status} size="sm" />
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-soft border border-border text-ink-muted">
                  {user.id}
                </span>
              </div>

              <p className="text-sm font-medium text-ink-secondary mt-1">
                {user.designation}
              </p>

              {/* Contact & Meta Strip */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted mt-3 pt-3 border-t border-border/60">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-ink-muted" />
                  <a
                    href={`mailto:${user.email}`}
                    className="hover:text-primary transition-colors"
                  >
                    {user.email}
                  </a>
                </span>

                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-ink-muted" />
                    <span>{user.phone}</span>
                  </span>
                )}

                {user.department && (
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-ink-muted" />
                    <span>{user.department}</span>
                  </span>
                )}

                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Onboarded: {new Date(user.createdAt).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-serif font-bold text-white bg-primary hover:bg-primary-dark rounded-sm transition-colors shadow-xs self-start"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Assign Role</span>
          </button>
        </div>
      </div>

      {/* Active Role Assignments Section */}
      <div className="bg-surface border border-border rounded-sm shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-surface-soft border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-ink text-base">
              Active Delegated Roles at Current Site
            </h2>
            <p className="text-xs text-ink-muted">
              Scoped authority delegations for {siteId} ({studyId})
            </p>
          </div>

          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-white border border-border rounded text-ink">
            {assignments.length} {assignments.length === 1 ? 'Role' : 'Roles'} Assigned
          </span>
        </div>

        {assignments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-serif font-medium text-ink-muted">
              No active role assignments found for this staff member at {siteId}.
            </p>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-bold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-sm transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Assign First Role</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {assignments.map((assignment) => {
              const matchedRole = roles.find((r) => r.id === assignment.roleId);
              if (!matchedRole) return null;

              return (
                <div
                  key={assignment.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-soft/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <RoleBadge
                        type={matchedRole.type}
                        name={matchedRole.name}
                        size="sm"
                      />
                      <span className="font-mono text-[11px] text-ink-muted">
                        ID: {assignment.id}
                      </span>
                    </div>

                    <p className="text-xs text-ink-secondary leading-relaxed max-w-2xl">
                      {matchedRole.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted pt-1">
                      <span>
                        Delegated on:{' '}
                        <strong className="text-ink">
                          {new Date(assignment.assignedAt).toLocaleDateString()}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Authority:{' '}
                        <strong className="text-ink">{assignment.assignedBy}</strong>
                      </span>
                      <span>·</span>
                      <span className="font-mono bg-blue-50 text-blue-900 border border-blue-200 px-1 rounded">
                        Scope: {assignment.siteId}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <Link
                      to={`/pi/team/roles/${matchedRole.id}`}
                      className="px-2.5 py-1 text-xs font-serif font-semibold text-ink-secondary hover:text-ink bg-surface border border-border hover:border-ink-muted rounded-sm transition-colors"
                    >
                      Role Template
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveAssignment(assignment.id, matchedRole.name)
                      }
                      disabled={isRemovingId === assignment.id}
                      className="p-1.5 text-xs text-semantic-danger hover:bg-red-50 border border-transparent hover:border-red-200 rounded-sm transition-colors disabled:opacity-50"
                      title="Revoke Role Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dynamic Effective Permissions Section */}
      <div className="bg-surface border border-border rounded-sm shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-surface-soft border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-secondary" />
              <h2 className="font-serif font-bold text-ink text-base">
                Derived Effective Permissions
              </h2>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Calculated dynamically from the union of all active role assignments at{' '}
              <strong className="text-ink">{siteId}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-50 text-secondary border border-emerald-200 rounded">
              {effectivePermissions.length} of {allPermissions.length} Active Grants
            </span>
          </div>
        </div>

        <div className="p-5">
          <PermissionMatrix
            permissions={allPermissions}
            selectedPermissionIds={effectivePermissions.map((p) => p.id)}
            readOnly={true}
            showUnassignedInReadOnly={true}
          />
        </div>
      </div>

      {/* Assign Role Modal */}
      {isAssignModalOpen && (
        <AssignRoleModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={() => {
            loadMemberData();
          }}
          studyId={activeStudyId}
          siteId={activeSiteId}
          teamMembers={allSiteMembers}
          roles={allSiteRoles}
          preselectedUserId={user.id}
        />
      )}
    </div>
  );
};
