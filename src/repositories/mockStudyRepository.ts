import { IStudyRepository } from './interfaces';
import { Study, Site } from '../types';
import { MOCK_STUDIES } from '../data/mockData';

export class MockStudyRepository implements IStudyRepository {
  async getStudies(): Promise<Study[]> {
    // Simulate brief asynchronous tick
    await new Promise((resolve) => setTimeout(resolve, 60));
    return structuredClone(MOCK_STUDIES);
  }

  async getStudyById(studyId: string): Promise<Study | null> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const study = MOCK_STUDIES.find((s) => s.id === studyId);
    return study ? structuredClone(study) : null;
  }

  async getSitesByStudyId(studyId: string): Promise<Site[]> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const study = MOCK_STUDIES.find((s) => s.id === studyId);
    return study ? structuredClone(study.sites) : [];
  }
}

export const mockStudyRepository = new MockStudyRepository();
