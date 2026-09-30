import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { environmentService } from '../services/environmentService';
import { BOOTSTRAP_PI_USER, BOOTSTRAP_PI_PASSWORD } from '../storage/emptyTestStore';
import {
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  UserCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FlaskConical,
  Database,
  RefreshCw,
  Info,
} from 'lucide-react';
import { AppEnvironmentMode, DemoCredential, Study, Site } from '../types';
import { studyService } from '../services/studyService';
import { ParticipantSelfOnboardingModal } from '../components/auth/ParticipantSelfOnboardingModal';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, roleLandingRoute, currentMode, setMode } = useAuth();

  // ── Mode ────────────────────────────────────────────────────────────
  const [selectedMode, setSelectedMode] = useState<AppEnvironmentMode>(currentMode);

  // When the user picks a tab, switch the environment before any login
  const handleModeSelect = useCallback(
    (mode: AppEnvironmentMode) => {
      if (mode === selectedMode) return;
      setSelectedMode(mode);
      setMode(mode);
      // Reset form fields to match new environment's credentials
      setEmail('');
      setPassword('');
      setErrorMessage(null);
    },
    [selectedMode, setMode]
  );

  // ── Credentials panel state ─────────────────────────────────────────
  // Mock mode credentials come from the mock auth repo (unchanged)
  const mockCredentials: DemoCredential[] = authService.getDemoCredentials();

  // Empty mode credentials are derived live from emptyTestStore users
  // getDemoCredentials() already delegates to the active environment's repo
  const [emptyCredentials, setEmptyCredentials] = useState<DemoCredential[]>([]);

  const refreshEmptyCredentials = useCallback(() => {
    const emptyRepo = environmentService.getEnvironment('EMPTY_TEST').authRepository;
    setEmptyCredentials(emptyRepo.getDemoCredentials());
  }, []);

  useEffect(() => {
    refreshEmptyCredentials();
  }, [refreshEmptyCredentials]);

  // ── Form state ───────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoPanelExpanded, setDemoPanelExpanded] = useState(true);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [studies, setStudies] = useState<Study[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    const loadStudiesAndSites = async () => {
      try {
        const studyList = await studyService.getStudies();
        setStudies(studyList);
        if (studyList.length > 0) {
          const siteList = await studyService.getSites(studyList[0].id);
          setSites(siteList);
        }
      } catch (err) {
        console.error('Failed to load studies in login page', err);
      }
    };
    loadStudiesAndSites();
  }, [selectedMode]);

  // Pre-fill for MOCK mode on initial mount
  useEffect(() => {
    if (selectedMode === 'MOCK' && mockCredentials.length > 0) {
      const piCred = mockCredentials.find((c) => c.roleId === 'ROLE_PI') || mockCredentials[0];
      setEmail(piCred.email);
      setPassword(piCred.password);
    } else if (selectedMode === 'EMPTY_TEST') {
      setEmail(BOOTSTRAP_PI_USER.email);
      setPassword(BOOTSTRAP_PI_PASSWORD);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode]);

  // ── Auth redirect ────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname;
      const targetRoute = roleLandingRoute || '/pi';
      const destination = fromPath && fromPath !== '/login' ? fromPath : targetRoute;
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state, roleLandingRoute]);

  // ── Login helpers ────────────────────────────────────────────────────
  const executeLogin = async (userEmail: string, userPass: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      // Ensure the environment is set to the selected mode right before auth
      if (environmentService.getMode() !== selectedMode) {
        environmentService.setMode(selectedMode);
      }
      const result = await login(userEmail.trim(), userPass);
      if (result.success && result.session) {
        const targetRoute = authService.getRoleLandingRoute(result.role?.id) || '/pi';
        const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname;
        const destination = fromPath && fromPath !== '/login' ? fromPath : targetRoute;
        navigate(destination, { replace: true });
      } else {
        setErrorMessage(result.error || 'Invalid credentials.');
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Authentication service error occurred.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }
    await executeLogin(email, password);
  };

  const handleSelectDemoUser = (cred: DemoCredential) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setErrorMessage(null);
  };

  const handleQuickLogin = (cred: DemoCredential) => {
    setEmail(cred.email);
    setPassword(cred.password);
    executeLogin(cred.email, cred.password);
  };

  const handleResetEmptyWorkspace = () => {
    environmentService.resetEmptyTestWorkspace();
    refreshEmptyCredentials();
    setEmail(BOOTSTRAP_PI_USER.email);
    setPassword(BOOTSTRAP_PI_PASSWORD);
    setErrorMessage(null);
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-between selection:bg-[#7A2A12] selection:text-white">
      {/* Top Institutional Header Bar */}
      <header className="bg-white border-b border-stone-200 py-3 px-6 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-sm bg-[#7A2A12] text-white flex items-center justify-center font-serif font-bold text-lg shadow-inner">
              अ
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7A2A12]">
                  Ministry of Ayush
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-xs text-stone-500 font-medium">Government of India</span>
              </div>
              <h1 className="font-serif text-sm md:text-base font-bold text-stone-900 leading-tight">
                All India Institute of Ayurveda — Clinical Trial Management System
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-xs text-stone-600 bg-stone-100 px-3 py-1.5 rounded-sm border border-stone-200">
            <Building2 className="w-3.5 h-3.5 text-[#1F5C3F]" />
            <span>Site 001 · New Delhi Main Campus</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl w-full space-y-5">

          {/* ── Environment Mode Selector ─────────────────────────────── */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center bg-white border border-stone-200 rounded-sm shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => handleModeSelect('MOCK')}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all ${
                  selectedMode === 'MOCK'
                    ? 'bg-[#7A2A12] text-white shadow-inner'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Mock
              </button>
              <div className="w-px h-8 bg-stone-200" />
              <button
                type="button"
                onClick={() => handleModeSelect('EMPTY_TEST')}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all ${
                  selectedMode === 'EMPTY_TEST'
                    ? 'bg-[#1F5C3F] text-white shadow-inner'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Empty Test
              </button>
            </div>
          </div>

          {/* Mode description strip */}
          {selectedMode === 'MOCK' ? (
            <div className="flex items-start gap-2 px-4 py-2.5 bg-[#7A2A12]/5 border border-[#7A2A12]/15 rounded-sm text-xs text-[#7A2A12] max-w-2xl mx-auto">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Mock Mode</strong> — Pre-populated synthetic demonstration environment with
                existing participants, visits, safety events, tasks, and documents. Use for
                regression testing or workflow demonstrations.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 px-4 py-2.5 bg-[#1F5C3F]/5 border border-[#1F5C3F]/15 rounded-sm text-xs text-[#1F5C3F] max-w-2xl mx-auto">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Empty Test Mode</strong> — Clean, browser-persistent workspace. Start from
                scratch: create team members, assign roles, onboard participants, and exercise the
                complete clinical workflow. All data is stored locally in your browser.
              </span>
            </div>
          )}

          {/* ── Two-column login layout ───────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: Sign In Card */}
            <div className="md:col-span-7 bg-white rounded-sm border border-stone-200 shadow-md p-6 sm:p-8">
              <div className="mb-6">
                <div
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider mb-2 ${
                    selectedMode === 'MOCK'
                      ? 'bg-[#1F5C3F]/10 text-[#1F5C3F]'
                      : 'bg-[#1F5C3F]/10 text-[#1F5C3F]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    {selectedMode === 'MOCK'
                      ? 'Authorized Clinical Access · Mock'
                      : 'Authorized Clinical Access · Empty Test'}
                  </span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
                  Institutional Sign In
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  {selectedMode === 'MOCK'
                    ? 'Access your designated clinical trial oversight, protocol compliance, and patient data portal.'
                    : 'Sign in to the clean-slate Empty Test workspace. Use the bootstrap PI or any user you create.'}
                </p>
              </div>

              {/* Quick Demo Launch Banner (Mock mode only) */}
              {selectedMode === 'MOCK' && (
                <div className="mb-5 p-3.5 bg-[#7A2A12]/5 border border-[#7A2A12]/20 rounded-sm flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#7A2A12]">
                      <Sparkles className="w-3.5 h-3.5 text-[#B8862E]" />
                      <span>Instant Demo Evaluation</span>
                    </div>
                    <div className="text-[11px] text-stone-600 mt-0.5">
                      Launch the Principal Investigator dashboard directly with 1 click
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      const piCred =
                        mockCredentials.find((c) => c.roleId === 'ROLE_PI') || mockCredentials[0];
                      if (piCred) handleQuickLogin(piCred);
                    }}
                    className="px-3.5 py-1.5 bg-[#7A2A12] hover:bg-[#63220E] text-white text-xs font-semibold rounded-sm shadow-xs transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
                  >
                    Launch PI Dashboard →
                  </button>
                </div>
              )}

              {/* Empty Test — Bootstrap PI Quick Login banner */}
              {selectedMode === 'EMPTY_TEST' && (
                <div className="mb-5 p-3.5 bg-[#1F5C3F]/5 border border-[#1F5C3F]/20 rounded-sm flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F5C3F]">
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Bootstrap PI — Quick Access</span>
                    </div>
                    <div className="text-[11px] text-stone-600 mt-0.5 font-mono">
                      {BOOTSTRAP_PI_USER.email} · {BOOTSTRAP_PI_PASSWORD}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      handleQuickLogin({
                        email: BOOTSTRAP_PI_USER.email,
                        password: BOOTSTRAP_PI_PASSWORD,
                        label: 'Bootstrap PI',
                        roleName: 'Principal Investigator',
                        userName: BOOTSTRAP_PI_USER.displayName,
                        roleId: 'ROLE_PI',
                        userId: BOOTSTRAP_PI_USER.id,
                        studyId: 'EMPTY-STUDY-001',
                        siteId: 'EMPTY-SITE-001',
                        description: 'Bootstrap PI in Empty Test Workspace',
                      })
                    }
                    className="px-3.5 py-1.5 bg-[#1F5C3F] hover:bg-[#174a31] text-white text-xs font-semibold rounded-sm shadow-xs transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
                  >
                    Start Testing →
                  </button>
                </div>
              )}

              {/* Error Alert Banner */}
              {errorMessage && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-sm flex items-start space-x-2.5 text-rose-800 text-xs sm:text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Authentication Failed</p>
                    <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-stone-700 mb-1">
                    {selectedMode === 'EMPTY_TEST' ? 'Email / Identifier' : 'Institutional Email / Username'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@aiia-ctms.local"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#7A2A12] focus:border-[#7A2A12] bg-white text-stone-900 font-sans transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium uppercase tracking-wider text-stone-700">
                      Security Passcode
                    </label>
                    <span className="text-[11px] text-stone-400">GCP Delegation Protected</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2 text-sm border border-stone-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#7A2A12] focus:border-[#7A2A12] bg-white text-stone-900 font-sans transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-semibold rounded-sm text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      selectedMode === 'MOCK'
                        ? 'bg-[#7A2A12] hover:bg-[#63220E] focus:ring-[#7A2A12]'
                        : 'bg-[#1F5C3F] hover:bg-[#174a31] focus:ring-[#1F5C3F]'
                    }`}
                  >
                    {isSubmitting ? (
                      <span>Verifying Credentials...</span>
                    ) : (
                      <span>Sign In to Institutional Portal</span>
                    )}
                  </button>
                </div>

                {/* Self-Onboarding Entry */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Trial Candidate?</span>
                  <button
                    type="button"
                    onClick={() => setIsOnboardingModalOpen(true)}
                    className="font-semibold text-emerald-800 hover:text-emerald-950 underline hover:no-underline cursor-pointer flex items-center gap-1"
                  >
                    <span>New Participant? Enroll Online →</span>
                  </button>
                </div>
              </form>

              {/* Disclaimer */}
              <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] text-stone-500 leading-relaxed">
                <span className="font-semibold text-stone-600">Compliance Notice:</span> All access
                and activity is logged in accordance with trial governance protocols. Unauthorized
                access attempts are subject to institutional review.
              </div>
            </div>

            {/* Right Column: Personas / Empty Test panel */}
            <div className="md:col-span-5 bg-white rounded-sm border border-stone-200 shadow-sm p-5 sm:p-6">
              {selectedMode === 'MOCK' ? (
                /* ── MOCK: Demo Persona Quick-Fill Panel ── */
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-[#B8862E]" />
                      <h3 className="font-serif text-sm font-bold text-stone-900">
                        Demo Evaluation Personas
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDemoPanelExpanded(!demoPanelExpanded)}
                      className="text-stone-400 hover:text-stone-600 p-1 rounded-sm text-xs"
                      aria-label="Toggle Demo Personas"
                    >
                      {demoPanelExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                    Select any clinical persona below to automatically load credentials for
                    role-based portal testing:
                  </p>

                  {demoPanelExpanded && (
                    <div className="space-y-2">
                      {mockCredentials.map((cred) => {
                        const isSelected = email === cred.email;
                        return (
                          <div
                            key={cred.email}
                            onClick={() => handleSelectDemoUser(cred)}
                            className={`w-full text-left p-2.5 rounded-sm border transition-all text-xs flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'border-[#7A2A12] bg-[#7A2A12]/5 ring-1 ring-[#7A2A12]'
                                : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-semibold text-stone-900 truncate">
                                  {cred.roleName}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7A2A12] shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] text-stone-600 truncate">
                                {cred.userName}
                              </div>
                              <div className="text-[10px] text-stone-400 font-mono truncate">
                                {cred.email}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickLogin(cred);
                                }}
                                className="text-[11px] font-semibold text-white bg-[#7A2A12] hover:bg-[#63220E] px-2.5 py-1 rounded-sm shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                              >
                                Sign In →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-stone-200 text-[11px] text-stone-500">
                    <span className="font-medium text-amber-900">Synthetic Environment:</span> In
                    accordance with MVP boundaries, no external authentication providers, active SSO,
                    or live credentials are used.
                  </div>
                </>
              ) : (
                /* ── EMPTY TEST: Workspace Users Panel ── */
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FlaskConical className="w-4 h-4 text-[#1F5C3F]" />
                      <h3 className="font-serif text-sm font-bold text-stone-900">
                        Empty Test Workspace
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={refreshEmptyCredentials}
                      className="text-stone-400 hover:text-[#1F5C3F] p-1 rounded-sm"
                      title="Refresh user list"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                    Local users in this browser workspace. Create additional team members after
                    signing in as the bootstrap PI.
                  </p>

                  {emptyCredentials.length > 0 ? (
                    <div className="space-y-2">
                      {emptyCredentials.map((cred) => {
                        const isSelected = email === cred.email;
                        return (
                          <div
                            key={cred.email}
                            onClick={() => handleSelectDemoUser(cred)}
                            className={`w-full text-left p-2.5 rounded-sm border transition-all text-xs flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'border-[#1F5C3F] bg-[#1F5C3F]/5 ring-1 ring-[#1F5C3F]'
                                : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-semibold text-stone-900 truncate">
                                  {cred.roleName}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1F5C3F] shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] text-stone-600 truncate">
                                {cred.userName}
                              </div>
                              <div className="text-[10px] text-stone-400 font-mono truncate">
                                {cred.email}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickLogin(cred);
                                }}
                                className="text-[11px] font-semibold text-white bg-[#1F5C3F] hover:bg-[#174a31] px-2.5 py-1 rounded-sm shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                              >
                                Sign In →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-stone-400 text-xs">
                      No users yet. The bootstrap PI is automatically available.
                    </div>
                  )}

                  {/* Reset workspace link */}
                  <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500">
                      <span className="font-medium text-[#1F5C3F]">Browser-local:</span> Data
                      persists across refreshes.
                    </span>
                    <button
                      type="button"
                      onClick={handleResetEmptyWorkspace}
                      className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline transition-colors"
                      title="Reset Empty Test workspace to factory state"
                    >
                      Reset workspace
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-3 px-6 text-center text-xs text-stone-500">
        <p>
          © 2026 All India Institute of Ayurveda (AIIA) CTMS · Ministry of Ayush · Phase 1
          Multi-Role Clinical Portal
        </p>
      </footer>

      {/* Participant Self-Onboarding Modal */}
      <ParticipantSelfOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        studies={studies}
        sites={sites}
        onRegistrationComplete={(regEmail) => {
          setEmail(regEmail);
          setPassword('128');
          setIsOnboardingModalOpen(false);
          refreshEmptyCredentials();
        }}
      />
    </div>
  );
};

export default LoginPage;
