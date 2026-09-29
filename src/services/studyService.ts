import { IStudyRepository } from '../repositories/interfaces';
import { mockStudyRepository } from '../repositories/mockStudyRepository';
import { Study, Site, CurrentStudyContext } from '../types';

export class StudyService {
  private repo: IStudyRepository;

  constructor(repository: IStudyRepository = mockStudyRepository) {
    this.repo = repository;
  }

  async getStudies(): Promise<Study[]> {
    return this.repo.getStudies();
  }

  async getStudyById(studyId: string): Promise<Study | null> {
    return this.repo.getStudyById(studyId);
  }

  async getSites(studyId: string): Promise<Site[]> {
    return this.repo.getSitesByStudyId(studyId);
  }

  async getCurrentContext(studyId: string, siteId: string): Promise<CurrentStudyContext | null> {
    const study = await this.repo.getStudyById(studyId);
    if (!study) return null;
    const site = study.sites.find((s) => s.id === siteId) || study.sites[0];
    if (!site) return null;

    return {
      studyId: study.id,
      studyCode: study.code,
      studyTitle: study.title,
      protocolVersion: study.protocolVersion,
      studyStatus: study.status,
      siteId: site.id,
      siteName: site.name,
      siteCode: site.siteCode,
      piId: site.piId,
      piName: site.piName,
      piRole: 'Principal Investigator',
    };
  }
}

export const studyService = new StudyService();
