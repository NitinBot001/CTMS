import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Menu, 
  Building2, 
  FileSpreadsheet, 
  User, 
  Settings, 
  LogOut, 
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { NotificationPopover } from '../notifications/NotificationPopover';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleMobileMenu, 
  pageTitle = 'PI Operations Overview' 
}) => {
  const navigate = useNavigate();
  const { studies, activeStudy, activeSite, selectStudy, selectSite } = useStudy();
  const { currentUser, currentRole, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  const userInitials = currentUser?.name
    ? currentUser.name
        .replace(/^(Dr\.|Prof\.|Sister)\s+/i, '')
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

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
          <NotificationPopover
            studyId={activeStudy?.id}
            siteId={activeSite?.id}
            recipientUserId={currentUser?.id || 'USR-101'}
          />

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 text-left rounded-sm hover:bg-surface-soft focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="User profile options"
            >
              <div className="w-8 h-8 rounded-sm bg-primary text-white flex items-center justify-center font-bold text-xs">
                {userInitials}
              </div>
              <div className="hidden xl:block leading-tight">
                <span className="block text-xs font-semibold text-ink truncate max-w-[140px]">
                  {currentUser?.name || 'Dr. Ananya Sharma'}
                </span>
                <span className="block text-[11px] text-ink-muted truncate max-w-[140px]">
                  {currentRole?.name || 'Principal Investigator'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted hidden xl:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-surface border border-border rounded-sm shadow-card z-50 py-1">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-xs font-bold text-ink">{currentUser?.name || 'Dr. Ananya Sharma'}</p>
                  <p className="text-[11px] text-ink-muted truncate">{currentUser?.email || 'ananya.sharma@aiims.edu'}</p>
                  <p className="text-[11px] text-secondary font-medium mt-0.5">
                    Role: {currentRole?.name || 'Principal Investigator'}
                  </p>
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
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-semantic-danger hover:bg-red-50 text-xs text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out (Session Lock)</span>
                  </button>
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
