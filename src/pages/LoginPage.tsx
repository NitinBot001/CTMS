import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
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
} from 'lucide-react';
import { DemoCredential } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, roleLandingRoute, getDemoCredentials } = useAuth();

  const demoCredentials: DemoCredential[] = getDemoCredentials();
  const defaultPi = demoCredentials.find((c) => c.roleId === 'ROLE_PI') || demoCredentials[0];

  const [email, setEmail] = useState(defaultPi ? defaultPi.email : 'demo.pi@aiia-ctms.local');
  const [password, setPassword] = useState(defaultPi ? defaultPi.password : 'PI@Demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoPanelExpanded, setDemoPanelExpanded] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname;
      const targetRoute = roleLandingRoute || '/pi';
      const destination = fromPath && fromPath !== '/login' ? fromPath : targetRoute;
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state, roleLandingRoute]);

  const executeLogin = async (userEmail: string, userPass: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await login(userEmail.trim(), userPass);
      if (result.success && result.session) {
        const targetRoute = authService.getRoleLandingRoute(result.role?.id) || '/pi';
        const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname;
        const destination = fromPath && fromPath !== '/login' ? fromPath : targetRoute;
        navigate(destination, { replace: true });
      } else {
        setErrorMessage(result.error || 'Invalid institutional credentials.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication service error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please provide both institutional email and password.');
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
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Sign In Card */}
          <div className="md:col-span-7 bg-white rounded-sm border border-stone-200 shadow-md p-6 sm:p-8">
            <div className="mb-6">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#1F5C3F]/10 text-[#1F5C3F] text-xs font-semibold uppercase tracking-wider mb-2">
                <Shield className="w-3.5 h-3.5" />
                <span>Authorized Clinical Access</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
                Institutional Sign In
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Access your designated clinical trial oversight, protocol compliance, and patient data portal.
              </p>
            </div>

            {/* Quick Demo Launch Banner */}
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
                  const piCred = demoCredentials.find((c) => c.roleId === 'ROLE_PI') || demoCredentials[0];
                  if (piCred) handleQuickLogin(piCred);
                }}
                className="px-3.5 py-1.5 bg-[#7A2A12] hover:bg-[#63220E] text-white text-xs font-semibold rounded-sm shadow-xs transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
              >
                Launch PI Dashboard &rarr;
              </button>
            </div>

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
                  Institutional Email / Username
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
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-semibold rounded-sm text-white bg-[#7A2A12] hover:bg-[#63220E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7A2A12] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <span>Sign In to Institutional Portal</span>
                  )}
                </button>
              </div>
            </form>

            {/* Disclaimer */}
            <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] text-stone-500 leading-relaxed">
              <span className="font-semibold text-stone-600">Compliance Notice:</span> All access and activity is logged in accordance with trial governance protocols. Unauthorized access attempts are subject to institutional review.
            </div>
          </div>

          {/* Right Column: Demo Persona Quick-Fill Panel */}
          <div className="md:col-span-5 bg-white rounded-sm border border-stone-200 shadow-sm p-5 sm:p-6">
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
                {demoPanelExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Select any clinical persona below to automatically load credentials for role-based portal testing:
            </p>

            {demoPanelExpanded && (
              <div className="space-y-2">
                {demoCredentials.map((cred) => {
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
                        <div className="text-[11px] text-stone-600 truncate">{cred.userName}</div>
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
                          Sign In &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-stone-200 text-[11px] text-stone-500">
              <span className="font-medium text-amber-900">Synthetic Environment:</span> In accordance with MVP boundaries, no external authentication providers, active SSO, or live credentials are used.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-3 px-6 text-center text-xs text-stone-500">
        <p>
          © 2026 All India Institute of Ayurveda (AIIA) CTMS · Ministry of Ayush · Phase 1 Multi-Role Clinical Portal
        </p>
      </footer>
    </div>
  );
};

export default LoginPage;
