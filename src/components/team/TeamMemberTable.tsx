import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, Building } from 'lucide-react';
import { TeamMemberSummary } from '../../types';
import { RoleBadge } from './RoleBadge';
import { UserStatusBadge } from './UserStatusBadge';

interface TeamMemberTableProps {
  members: TeamMemberSummary[];
}

export const TeamMemberTable: React.FC<TeamMemberTableProps> = ({ members }) => {
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

  return (
    <div className="bg-surface border border-border rounded-sm shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className="w-full text-left border-collapse text-xs"
          aria-label="Site Team Directory"
        >
          <thead>
            <tr className="bg-surface-soft border-b border-border text-ink-muted uppercase font-semibold text-[11px] tracking-wider">
              <th scope="col" className="py-3 px-4">Team Member</th>
              <th scope="col" className="py-3 px-3">Designation & Department</th>
              <th scope="col" className="py-3 px-3">Assigned Roles</th>
              <th scope="col" className="py-3 px-3">Scope Context</th>
              <th scope="col" className="py-3 px-3">Status</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => {
              const initials = getInitials(m.user.displayName);

              return (
                <tr
                  key={m.user.id}
                  className="hover:bg-surface-soft/80 transition-colors group"
                >
                  {/* Team Member */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-sm bg-primary/10 border border-primary/20 text-primary font-serif font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/pi/team/${m.user.id}`}
                          className="font-serif font-bold text-ink hover:text-primary transition-colors block truncate"
                        >
                          {m.user.displayName}
                        </Link>
                        <div className="flex items-center gap-2 text-[11px] text-ink-muted mt-0.5">
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 text-ink-muted" />
                            {m.user.email}
                          </span>
                          {m.user.phone && (
                            <span className="hidden xl:flex items-center gap-1 text-ink-muted">
                              <Phone className="w-3 h-3 text-ink-muted" />
                              {m.user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Designation */}
                  <td className="py-3 px-3 max-w-[220px]">
                    <span className="font-medium text-ink block line-clamp-1">
                      {m.user.designation}
                    </span>
                    {m.user.department && (
                      <span className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5 line-clamp-1">
                        <Building className="w-3 h-3 flex-shrink-0 text-ink-muted" />
                        {m.user.department}
                      </span>
                    )}
                  </td>

                  {/* Assigned Roles */}
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                      {m.roles.length > 0 ? (
                        m.roles.map((role) => (
                          <RoleBadge
                            key={role.id}
                            type={role.type}
                            name={role.name}
                            size="xs"
                          />
                        ))
                      ) : (
                        <span className="text-ink-muted italic text-[11px]">
                          No assigned roles
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Scope Context */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <span className="inline-block font-mono text-[10px] font-semibold px-1.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-sm">
                        {m.siteId}
                      </span>
                      <span className="block text-[10px] font-mono text-ink-muted">
                        {m.studyId}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    <UserStatusBadge status={m.user.status} size="xs" />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/pi/team/${m.user.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-serif font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-sm transition-colors"
                      title="View Member Profile & Effective Permissions"
                    >
                      <span>View Profile</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
