import { IDashboardRepository } from '../repositories/interfaces';
import { environmentService } from './environmentService';
import { DashboardOverviewData } from '../types';

export class DashboardService {
  private _customRepo?: IDashboardRepository;

  constructor(repository?: IDashboardRepository) {
    this._customRepo = repository;
  }

  private get repo(): IDashboardRepository {
    return this._customRepo || environmentService.getDashboardRepository();
  }

  async getOverview(studyId: string, siteId: string): Promise<DashboardOverviewData | null> {
    if (!studyId || !siteId) return null;
    return this.repo.getOverview(studyId, siteId);
  }
}

export const dashboardService = new DashboardService();
