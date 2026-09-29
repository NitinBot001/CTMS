import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ShieldAlert,
  FileCheck2,
  UserCheck,
  CheckSquare,
  FileText,
  BarChart3,
  Settings,
  X,
  Activity,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'danger' | 'warning' | 'neutral';
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeStudy, activeSite } = useStudy();

  const navigation: NavItem[] = [
    { name: 'Overview', path: '/pi/dashboard', icon: LayoutDashboard },
    { name: 'Patients', path: '/pi/patients', icon: Users },
    { name: 'Visits & Activities', path: '/pi/visits', icon: CalendarCheck },
    { name: 'Safety', path: '/pi/safety', icon: ShieldAlert, badge: '1 SAE', badgeVariant: 'danger' },
    { name: 'Compliance', path: '/pi/compliance', icon: FileCheck2 },
    { name: 'Team & Roles', path: '/pi/team', icon: UserCheck },
    { name: 'Tasks', path: '/pi/tasks', icon: CheckSquare, badge: '4', badgeVariant: 'warning' },
    { name: 'Documents', path: '/pi/documents', icon: FileText },
    { name: 'Reports', path: '/pi/reports', icon: BarChart3 },
    { name: 'Settings', path: '/pi/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-primary text-white flex items-center justify-center font-bold text-sm shadow-subtle">
              <Activity className="w-5 h-5 text-accent-light" />
            </div>
            <div>
              <span className="font-heading font-bold text-base text-primary-dark tracking-tight block">
                AIIA CTMS
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-ink-muted uppercase block">
                Clinical Research OS
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-ink-muted hover:text-ink rounded-sm focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PI Context Card */}
        <div className="p-3 bg-surface-soft border-b border-border text-xs">
          <p className="font-semibold text-primary-dark truncate">
            {activeStudy ? activeStudy.code : 'No Study'}
          </p>
          <p className="text-ink-secondary text-[11px] truncate mt-0.5">
            {activeSite ? activeSite.name : 'No Site Assigned'}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
            <span className="text-[11px] font-medium text-ink-muted">PI Operations Mode</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 text-xs font-medium rounded-sm transition-colors group ${
                    isActive
                      ? 'bg-rose-50/80 text-primary border-l-2 border-primary font-semibold'
                      : 'text-ink-secondary hover:bg-surface-soft hover:text-ink'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-primary" />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border shrink-0 ${
                      item.badgeVariant === 'danger'
                        ? 'bg-red-50 text-semantic-danger border-red-200'
                        : item.badgeVariant === 'warning'
                        ? 'bg-amber-50 text-accent-dark border-amber-200'
                        : 'bg-surface text-ink-muted border-border'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-border text-[11px] text-ink-muted bg-surface-soft">
          <div className="flex justify-between items-center text-[10px]">
            <span>GCP-Compliant</span>
            <span className="font-mono">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
