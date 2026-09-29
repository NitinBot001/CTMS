import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  AuthResult,
  AuthSession,
  AuthUser,
  DemoCredential,
  Permission,
  Role,
  UserRole,
} from '../types';
import { authService } from '../services/authService';

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

  // Restore session on application bootstrap
  const initSession = useCallback(async () => {
    setIsLoading(true);
    try {
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
