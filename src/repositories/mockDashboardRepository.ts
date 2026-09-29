import { IDashboardRepository } from './interfaces';
import { DashboardOverviewData } from '../types';
import { MOCK_OVERVIEWS } from '../data/mockData';

export class MockDashboardRepository implements IDashboardRepository {
  async getOverview(studyId: string, siteId: string): Promise<DashboardOverviewData | null> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const studyOverviews = MOCK_OVERVIEWS[studyId];
    if (!studyOverviews) return null;
    const overview = studyOverviews[siteId];
    return overview ? structuredClone(overview) : null;
  }
}

export const mockDashboardRepository = new MockDashboardRepository();
