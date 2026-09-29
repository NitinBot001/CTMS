import { IDashboardRepository } from '../repositories/interfaces';
import { mockDashboardRepository } from '../repositories/mockDashboardRepository';
import { DashboardOverviewData } from '../types';

export class DashboardService {
  private repo: IDashboardRepository;

  constructor(repository: IDashboardRepository = mockDashboardRepository) {
    this.repo = repository;
  }

  async getOverview(studyId: string, siteId: string): Promise<DashboardOverviewData | null> {
    if (!studyId || !siteId) return null;
    return this.repo.getOverview(studyId, siteId);
  }
}

export const dashboardService = new DashboardService();
