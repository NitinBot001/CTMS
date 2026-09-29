import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  AppEnvironmentMode,
  AuthResult,
  AuthSession,
  AuthUser,
  DemoCredential,
  Permission,
  Role,
  UserRole,
} from '../types';
import { authService } from '../services/authService';
import { environmentService } from '../services/environmentService';
import { browserStorage, SESSION_STORAGE_KEY } from '../storage/browserStorage';
import { MODE_STORAGE_KEY } from '../storage/emptyTestStore';

interface AuthContextValue {
  currentUser: AuthUser | null;
  currentRole: Role | null;
  studyId: string;
  siteId: string;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  effectivePermissions: Permission[];
  userAssignments: UserRole[];
  roleLandingRoute: string;
  /** Active environment mode — 'MOCK' | 'EMPTY_TEST' */
  currentMode: AppEnvironmentMode;
  /** Switch environment mode before or after login */
  setMode: (mode: AppEnvironmentMode) => void;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  hasPermission: (permissionId: string) => boolean;
  getDemoCredentials: () => DemoCredential[];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [studyId, setStudyId] = useState<string>('');
  const [siteId, setSiteId] = useState<string>('');
  const [effectivePermissions, setEffectivePermissions] = useState<Permission[]>([]);
  const [userAssignments, setUserAssignments] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentMode, setCurrentModeState] = useState<AppEnvironmentMode>(
    () => environmentService.getMode()
  );

  // Keep local mode state in sync when environmentService mode changes externally
  useEffect(() => {
    const unsub = environmentService.subscribe((mode) => {
      setCurrentModeState(mode);
    });
    return unsub;
  }, []);

  const setMode = useCallback((mode: AppEnvironmentMode) => {
    environmentService.setMode(mode);
    // setCurrentModeState will be triggered by the subscribe callback above
  }, []);

  // Restore session on application bootstrap
  const initSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // Re-apply persisted mode BEFORE restoring session so the correct
      // repository (Mock vs Empty) is used during session validation.
      const persistedMode = browserStorage.get<AppEnvironmentMode>(MODE_STORAGE_KEY);
      if (persistedMode && persistedMode !== environmentService.getMode()) {
        environmentService.setMode(persistedMode);
      }

      const result = await authService.restoreSession();
      if (result.success && result.session && result.user && result.role) {
        setSession(result.session);
        setCurrentUser(result.user);
        setCurrentRole(result.role);
        setStudyId(result.session.studyId);
        setSiteId(result.session.siteId);
        setEffectivePermissions(result.effectivePermissions || []);

        const assignments = await authService.getUserAssignments(result.user.id);
        setUserAssignments(assignments);
      } else {
        setSession(null);
        setCurrentUser(null);
        setCurrentRole(null);
        setStudyId('');
        setSiteId('');
        setEffectivePermissions([]);
        setUserAssignments([]);
      }
    } catch (err) {
      console.error('[AuthContext] Session restore error:', err);
      setSession(null);
      setCurrentUser(null);
      setCurrentRole(null);
      setStudyId('');
      setSiteId('');
      setEffectivePermissions([]);
      setUserAssignments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setIsLoading(true);
      try {
        const result = await authService.login(email, password);
        if (result.success && result.session && result.user && result.role) {
          setSession(result.session);
          setCurrentUser(result.user);
          setCurrentRole(result.role);
          setStudyId(result.session.studyId);
          setSiteId(result.session.siteId);
          setEffectivePermissions(result.effectivePermissions || []);

          const assignments = await authService.getUserAssignments(result.user.id);
          setUserAssignments(assignments);
        }
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
    // Clear session storage key so mode persists but session does not
    browserStorage.remove(SESSION_STORAGE_KEY);
    setSession(null);
    setCurrentUser(null);
    setCurrentRole(null);
    setStudyId('');
    setSiteId('');
    setEffectivePermissions([]);
    setUserAssignments([]);
  }, []);

  const hasPermission = useCallback(
    (permissionId: string): boolean => {
      return authService.hasPermission(permissionId, effectivePermissions);
    },
    [effectivePermissions]
  );

  const roleLandingRoute = useMemo(() => {
    return authService.getRoleLandingRoute(currentRole?.id);
  }, [currentRole?.id]);

  const getDemoCredentials = useCallback(() => {
    return authService.getDemoCredentials();
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({
      currentUser,
      currentRole,
      studyId,
      siteId,
      session,
      isAuthenticated: Boolean(session?.authenticated && currentUser),
      isLoading,
      effectivePermissions,
      userAssignments,
      roleLandingRoute,
      currentMode,
      setMode,
      login,
      logout,
      hasPermission,
      getDemoCredentials,
    }),
    [
      currentUser,
      currentRole,
      studyId,
      siteId,
      session,
      isLoading,
      effectivePermissions,
      userAssignments,
      roleLandingRoute,
      currentMode,
      setMode,
      login,
      logout,
      hasPermission,
      getDemoCredentials,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
