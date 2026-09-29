import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Building } from 'lucide-react';
import { TeamMemberSummary } from '../../types';
import { RoleBadge } from './RoleBadge';
import { UserStatusBadge } from './UserStatusBadge';

interface TeamMemberMobileCardProps {
  member: TeamMemberSummary;
}

export const TeamMemberMobileCard: React.FC<TeamMemberMobileCardProps> = ({
  member,
}) => {
  const getInitials = (name: string): string => {
    return name
      .replace(/^Dr\.\s+/i, '')
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const initials = getInitials(member.user.displayName);

  return (
    <div className="bg-surface border border-border rounded-sm p-4 shadow-xs space-y-3">
      {/* Top Header: Avatar, Name, Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 text-primary font-serif font-bold text-sm flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div>
            <Link
              to={`/pi/team/${member.user.id}`}
              className="font-serif font-bold text-ink text-sm hover:text-primary transition-colors block"
            >
              {member.user.displayName}
            </Link>
            <span className="text-xs text-ink-muted block">
              {member.user.designation}
            </span>
          </div>
        </div>

        <UserStatusBadge status={member.user.status} size="xs" />
      </div>

      {/* Meta details */}
      <div className="text-xs space-y-1.5 pt-2 border-t border-border/50 text-ink-muted">
        <div className="flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
          <span className="truncate">{member.user.email}</span>
        </div>
        {member.user.department && (
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
            <span className="truncate">{member.user.department}</span>
          </div>
        )}
      </div>

      {/* Assigned Roles */}
      <div className="space-y-1.5 pt-2 border-t border-border/50">
        <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
          Assigned Roles ({member.roles.length})
        </span>
        <div className="flex flex-wrap gap-1.5">
          {member.roles.length > 0 ? (
            member.roles.map((role) => (
              <RoleBadge
                key={role.id}
                type={role.type}
                name={role.name}
                size="xs"
              />
            ))
          ) : (
            <span className="text-ink-muted italic text-xs">No assigned roles</span>
          )}
        </div>
      </div>

      {/* Footer Scope and Action */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="bg-blue-50 text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded-sm font-semibold">
            {member.siteId}
          </span>
          <span className="text-ink-muted">{member.studyId}</span>
        </div>

        <Link
          to={`/pi/team/${member.user.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-serif font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-sm transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
