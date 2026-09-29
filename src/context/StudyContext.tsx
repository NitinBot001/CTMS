import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Study, Site } from '../types';
import { studyService } from '../services/studyService';
import { useAuth } from './AuthContext';

interface StudyContextValue {
  studies: Study[];
  activeStudy: Study | null;
  activeSite: Site | null;
  activeStudyId: string;
  activeSiteId: string;
  isLoading: boolean;
  error: string | null;
  selectStudy: (studyId: string) => void;
  selectSite: (siteId: string) => void;
  refreshStudies: () => Promise<void>;
  permittedSiteIds: string[];
}

const StudyContext = createContext<StudyContextValue | undefined>(undefined);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, studyId: authStudyId, siteId: authSiteId, userAssignments } = useAuth();

  const [allStudies, setAllStudies] = useState<Study[]>([]);
  const [activeStudyId, setActiveStudyId] = useState<string>('');
  const [activeSiteId, setActiveSiteId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await studyService.getStudies();
      setAllStudies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load studies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  // Synchronize study and site selection with authentication context
  useEffect(() => {
    if (isAuthenticated && authStudyId && authSiteId) {
      setActiveStudyId(authStudyId);
      setActiveSiteId(authSiteId);
    } else if (!isAuthenticated && allStudies.length > 0) {
      const initialStudy = allStudies[0];
      setActiveStudyId(initialStudy.id);
      if (initialStudy.sites.length > 0) {
        setActiveSiteId(initialStudy.sites[0].id);
      }
    }
  }, [isAuthenticated, authStudyId, authSiteId, allStudies]);

  // Compute permitted studies and sites based on authenticated user assignments
  const { permittedStudies, permittedSiteIds } = useMemo(() => {
    if (!isAuthenticated || userAssignments.length === 0) {
      const allSiteIds = allStudies.flatMap((s) => s.sites.map((st) => st.id));
      return { permittedStudies: allStudies, permittedSiteIds: allSiteIds };
    }

    const assignedStudyIds = new Set(userAssignments.map((a) => a.studyId));
    const assignedSiteIds = new Set(userAssignments.map((a) => a.siteId));

    const filtered = allStudies
      .filter((s) => assignedStudyIds.has(s.id))
      .map((s) => ({
        ...s,
        sites: s.sites.filter((st) => assignedSiteIds.has(st.id)),
      }));

    return {
      permittedStudies: filtered,
      permittedSiteIds: Array.from(assignedSiteIds),
    };
  }, [isAuthenticated, userAssignments, allStudies]);

  const selectStudy = useCallback(
    (studyId: string) => {
      // Validate that study is permitted
      const study = permittedStudies.find((s) => s.id === studyId);
      if (!study) {
        console.warn(`[StudyContext] Study "${studyId}" is not in user's permitted assignments.`);
        return;
      }

      setActiveStudyId(studyId);
      if (study.sites.length > 0) {
        setActiveSiteId(study.sites[0].id);
      } else {
        setActiveSiteId('');
      }
    },
    [permittedStudies]
  );

  const selectSite = useCallback(
    (siteId: string) => {
      // Validate that site is permitted for current user
      if (permittedSiteIds.length > 0 && !permittedSiteIds.includes(siteId)) {
        console.warn(`[StudyContext] Cross-site selection rejected: User is not assigned to site "${siteId}".`);
        return;
      }
      setActiveSiteId(siteId);
    },
    [permittedSiteIds]
  );

  const activeStudy = permittedStudies.find((s) => s.id === activeStudyId) || null;
  const activeSite = activeStudy?.sites.find((s) => s.id === activeSiteId) || null;

  const value: StudyContextValue = {
    studies: permittedStudies,
    activeStudy,
    activeSite,
    activeStudyId,
    activeSiteId,
    isLoading,
    error,
    selectStudy,
    selectSite,
    refreshStudies: fetchStudies,
    permittedSiteIds,
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
};

export const useStudy = (): StudyContextValue => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
