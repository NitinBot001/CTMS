import { apiClient } from './client'
import type {
  PortfolioOverviewResponse,
  PortfolioHealthResponse,
  PortfolioAlertItem,
  UpcomingMilestoneItem,
  EnrollmentTrendPoint,
  SiteEnrollmentItem,
  StudyMetricsResponse,
} from '@/types/api'

export const portfolioApi = {
  getOverview: () => {
    return apiClient.get<PortfolioOverviewResponse>('/portfolio/overview')
  },

  getHealth: () => {
    return apiClient.get<PortfolioHealthResponse>('/portfolio/health')
  },

  getAlerts: () => {
    return apiClient.get<PortfolioAlertItem[]>('/portfolio/alerts')
  },

  getUpcomingMilestones: (limit = 10) => {
    return apiClient.get<UpcomingMilestoneItem[]>('/portfolio/milestones/upcoming', {
      params: { limit },
    })
  },

  getEnrollmentTrend: (studyId?: string) => {
    return apiClient.get<EnrollmentTrendPoint[]>('/portfolio/enrollment/trend', {
      params: studyId ? { study_id: studyId } : undefined,
    })
  },

  getStudyEnrollmentBySite: (studyId: string) => {
    return apiClient.get<SiteEnrollmentItem[]>(`/portfolio/studies/${studyId}/enrollment/by-site`)
  },

  getStudyMetrics: (studyId: string) => {
    return apiClient.get<StudyMetricsResponse>(`/portfolio/studies/${studyId}/metrics`)
  },
}
