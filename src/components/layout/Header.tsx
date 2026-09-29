import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  ChevronDown, 
  Menu, 
  Building2, 
  FileSpreadsheet, 
  User, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleMobileMenu, 
  pageTitle = 'PI Operations Overview' 
}) => {
  const { studies, activeStudy, activeSite, selectStudy, selectSite } = useStudy();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mockNotifications = [
    {
      id: 'N-1',
      title: 'Serious Adverse Event #SAE-023 requires PI signature',
      time: '10 min ago',
      unread: true,
      type: 'urgent',
    },
    {
      id: 'N-2',
      title: 'Participant P-1023 Day 30 visit completed by Nurse Pratibha',
      time: '1 hour ago',
      unread: true,
      type: 'info',
    },
    {
      id: 'N-3',
      title: 'Protocol Deviation #PD-017 submitted for evaluation',
      time: '3 hours ago',
      unread: true,
      type: 'warning',
    },
    {
      id: 'N-4',
      title: 'New protocol amendment v2.1 acknowledged by Ethics Committee',
      time: 'Yesterday',
      unread: false,
      type: 'info',
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-border shadow-subtle">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-ink-secondary hover:text-ink hover:bg-surface-soft rounded-sm focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-ink font-heading leading-tight truncate">
              {pageTitle}
            </h1>
            <p className="text-xs text-ink-muted hidden sm:block">
              Site Operations Control Center
            </p>
          </div>
        </div>

        {/* Center: Context Selectors (Study & Site) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Study Selector */}
          <div className="flex items-center gap-1.5 bg-surface-soft border border-border rounded-sm px-2.5 py-1 text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-semibold text-ink-secondary">Study:</span>
            <select
              aria-label="Active Study Selector"
              className="bg-transparent text-ink font-medium focus:outline-none cursor-pointer pr-1 truncate max-w-[140px] lg:max-w-[200px]"
              value={activeStudy?.id || ''}
              onChange={(e) => selectStudy(e.target.value)}
            >
              {studies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.title.substring(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          {/* Site Selector */}
          <div className="flex items-center gap-1.5 bg-surface-soft border border-border rounded-sm px-2.5 py-1 text-xs">
            <Building2 className="w-3.5 h-3.5 text-secondary shrink-0" />
            <span className="font-semibold text-ink-secondary">Site:</span>
            <select
              aria-label="Active Site Selector"
              className="bg-transparent text-ink font-medium focus:outline-none cursor-pointer pr-1 truncate max-w-[130px] lg:max-w-[180px]"
              value={activeSite?.id || ''}
              onChange={(e) => selectSite(e.target.value)}
              disabled={!activeStudy || activeStudy.sites.length <= 1}
            >
              {activeStudy?.sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.siteCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-ink-secondary hover:text-ink hover:bg-surface-soft rounded-sm focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-semantic-danger rounded-full ring-2 ring-surface" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-sm shadow-card z-50 animate-in fade-in duration-100">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink font-heading">Trial Notifications</span>
                  <span className="text-xs bg-rose-50 text-primary font-medium px-2 py-0.5 rounded-sm border border-rose-200">
                    3 Unread
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {mockNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 text-xs transition-colors hover:bg-surface-soft cursor-pointer flex items-start gap-2.5 ${
                        notif.unread ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {notif.type === 'urgent' ? (
                        <AlertTriangle className="w-4 h-4 text-semantic-danger shrink-0 mt-0.5" />
                      ) : notif.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-semantic-warning shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-ink leading-tight">{notif.title}</p>
                        <p className="text-ink-muted text-[11px] mt-1">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-border bg-surface-soft text-center">
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 text-left rounded-sm hover:bg-surface-soft focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="User profile options"
            >
              <div className="w-8 h-8 rounded-sm bg-primary text-white flex items-center justify-center font-bold text-xs">
                AS
              </div>
              <div className="hidden xl:block leading-tight">
                <span className="block text-xs font-semibold text-ink">Dr. Ananya Sharma</span>
                <span className="block text-[11px] text-ink-muted">Principal Investigator</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted hidden xl:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-sm shadow-card z-50 py-1">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-xs font-bold text-ink">Dr. Ananya Sharma</p>
                  <p className="text-[11px] text-ink-muted">ananya.sharma@aiims.edu</p>
                  <p className="text-[11px] text-secondary font-medium mt-0.5">Role: Principal Investigator</p>
                </div>
                <div className="py-1 text-xs">
                  <a
                    href="#profile"
                    onClick={(e) => { e.preventDefault(); setShowUserMenu(false); }}
                    className="flex items-center gap-2 px-4 py-2 text-ink hover:bg-surface-soft"
                  >
                    <User className="w-4 h-4 text-ink-muted" />
                    <span>Investigator Profile</span>
                  </a>
                  <a
                    href="#preferences"
                    onClick={(e) => { e.preventDefault(); setShowUserMenu(false); }}
                    className="flex items-center gap-2 px-4 py-2 text-ink hover:bg-surface-soft"
                  >
                    <Settings className="w-4 h-4 text-ink-muted" />
                    <span>Site Preferences</span>
                  </a>
                </div>
                <div className="border-t border-border pt-1">
                  <a
                    href="#logout"
                    onClick={(e) => { e.preventDefault(); setShowUserMenu(false); }}
                    className="flex items-center gap-2 px-4 py-2 text-semantic-danger hover:bg-red-50 text-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out (Session Lock)</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Context Selector Strip */}
      <div className="md:hidden px-4 py-2 bg-surface-soft border-t border-border flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink-muted">Study:</span>
          <select
            aria-label="Mobile Study Selector"
            className="bg-surface border border-border rounded-sm px-2 py-0.5 text-ink font-medium max-w-[220px]"
            value={activeStudy?.id || ''}
            onChange={(e) => selectStudy(e.target.value)}
          >
            {studies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink-muted">Site:</span>
          <select
            aria-label="Mobile Site Selector"
            className="bg-surface border border-border rounded-sm px-2 py-0.5 text-ink font-medium max-w-[220px]"
            value={activeSite?.id || ''}
            onChange={(e) => selectSite(e.target.value)}
          >
            {activeStudy?.sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
