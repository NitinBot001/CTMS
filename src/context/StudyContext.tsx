import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Study, Site } from '../types';
import { studyService } from '../services/studyService';

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
}

const StudyContext = createContext<StudyContextValue | undefined>(undefined);

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [activeStudyId, setActiveStudyId] = useState<string>('');
  const [activeSiteId, setActiveSiteId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await studyService.getStudies();
      setStudies(data);
      if (data.length > 0) {
        // Default to first study and its first site if none selected or invalid
        const initialStudy = data[0];
        setActiveStudyId(initialStudy.id);
        if (initialStudy.sites.length > 0) {
          setActiveSiteId(initialStudy.sites[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load studies');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  const selectStudy = useCallback(
    (studyId: string) => {
      setActiveStudyId(studyId);
      const study = studies.find((s) => s.id === studyId);
      if (study && study.sites.length > 0) {
        setActiveSiteId(study.sites[0].id);
      } else {
        setActiveSiteId('');
      }
    },
    [studies]
  );

  const selectSite = useCallback((siteId: string) => {
    setActiveSiteId(siteId);
  }, []);

  const activeStudy = studies.find((s) => s.id === activeStudyId) || null;
  const activeSite = activeStudy?.sites.find((s) => s.id === activeSiteId) || null;

  const value: StudyContextValue = {
    studies,
    activeStudy,
    activeSite,
    activeStudyId,
    activeSiteId,
    isLoading,
    error,
    selectStudy,
    selectSite,
    refreshStudies: fetchStudies,
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
