import { apiClient } from './client'
import type {
  StudyRead,
  StudyCreate,
  StudyUpdate,
  StudyMilestoneRead,
  StudyTeamMemberRead,
  StudyTeamMemberCreate,
  StudySiteRead,
  StudySiteCreate,
  StatusTransitionRequest,
} from '@/types/api'

export const studiesApi = {
  list: (params?: {
    status?: string
    phase?: string
    sponsor_org_id?: string
    cro_org_id?: string
    skip?: number
    limit?: number
  }) => apiClient.get<StudyRead[]>('/studies', { params }),

  get: (studyId: string) => apiClient.get<StudyRead>(`/studies/${studyId}`),
  getById: (studyId: string) => apiClient.get<StudyRead>(`/studies/${studyId}`),

  create: (data: StudyCreate) => apiClient.post<StudyRead>('/studies', data),

  update: (studyId: string, data: StudyUpdate) =>
    apiClient.patch<StudyRead>(`/studies/${studyId}`, data),

  transition: (studyId: string, data: StatusTransitionRequest) =>
    apiClient.post<StudyRead>(`/studies/${studyId}/transition`, data),

  listMilestones: (studyId: string) =>
    apiClient.get<StudyMilestoneRead[]>(`/studies/${studyId}/milestones`),

  listTeam: (studyId: string) =>
    apiClient.get<StudyTeamMemberRead[]>(`/studies/${studyId}/team`),
  listTeamMembers: (studyId: string) =>
    apiClient.get<StudyTeamMemberRead[]>(`/studies/${studyId}/team`),

  addTeamMember: (studyId: string, data: StudyTeamMemberCreate) =>
    apiClient.post<StudyTeamMemberRead>(`/studies/${studyId}/team`, data),

  listSites: (studyId: string) =>
    apiClient.get<StudySiteRead[]>(`/studies/${studyId}/sites`),

  assignSite: (studyId: string, data: StudySiteCreate) =>
    apiClient.post<StudySiteRead>(`/studies/${studyId}/sites`, data),

  transitionSite: (studyId: string, siteId: string, data: StatusTransitionRequest) =>
    apiClient.post<StudySiteRead>(`/studies/${studyId}/sites/${siteId}/transition`, data),
  transitionSiteActivation: (studyId: string, siteId: string, data: StatusTransitionRequest) =>
    apiClient.post<StudySiteRead>(`/studies/${studyId}/sites/${siteId}/transition`, data),
}
