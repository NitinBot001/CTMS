import {
  Study,
  Site,
  DashboardOverviewData,
  Participant,
  ParticipantFilters,
  ParticipantSummaryMetrics,
  ProtocolVisitDefinition,
  ParticipantVisit,
  VisitFilters,
  VisitSummaryMetrics,
  ClinicalActivityStatus,
  SafetyEvent,
  SafetyFilters,
  SafetySummaryMetrics,
  PIReviewStatus,
  FollowUpStatus,
  ProtocolDeviation,
  DeviationFilters,
  ComplianceSummaryMetrics,
  DeviationStatus,
  ComplianceReviewStatus,
  CapaStatus,
} from '../types';

export interface ParticipantQueryContext {
  studyId: string;
  siteId: string;
}

export interface IStudyRepository {
  getStudies(): Promise<Study[]>;
  getStudyById(studyId: string): Promise<Study | null>;
  getSitesByStudyId(studyId: string): Promise<Site[]>;
}

export interface IDashboardRepository {
  getOverview(studyId: string, siteId: string): Promise<DashboardOverviewData | null>;
}

export interface IParticipantRepository {
  getParticipants(context: ParticipantQueryContext, filters?: ParticipantFilters): Promise<Participant[]>;
  getParticipantById(context: ParticipantQueryContext, participantId: string): Promise<Participant | null>;
  getParticipantSummary(context: ParticipantQueryContext): Promise<ParticipantSummaryMetrics>;
}

export interface IVisitRepository {
  getProtocolVisits(studyId: string): Promise<ProtocolVisitDefinition[]>;
  getVisits(context: ParticipantQueryContext, filters?: VisitFilters): Promise<ParticipantVisit[]>;
  getParticipantVisits(context: ParticipantQueryContext, participantId: string): Promise<ParticipantVisit[]>;
  getVisitById(context: ParticipantQueryContext, visitId: string): Promise<ParticipantVisit | null>;
  getVisitSummary(context: ParticipantQueryContext): Promise<VisitSummaryMetrics>;
  updateVisitActivityStatus?(
    context: ParticipantQueryContext,
    visitId: string,
    activityId: string,
    status: ClinicalActivityStatus
  ): Promise<ParticipantVisit | null>;
}

export interface ISafetyRepository {
  getSafetyEvents(context: ParticipantQueryContext, filters?: SafetyFilters): Promise<SafetyEvent[]>;
  getSafetyEventById(context: ParticipantQueryContext, eventId: string): Promise<SafetyEvent | null>;
  getParticipantSafetyEvents(context: ParticipantQueryContext, participantId: string): Promise<SafetyEvent[]>;
  getSafetySummary(context: ParticipantQueryContext): Promise<SafetySummaryMetrics>;
  updatePIReviewStatus(
    context: ParticipantQueryContext,
    eventId: string,
    status: PIReviewStatus,
    reviewedBy?: string
  ): Promise<SafetyEvent | null>;
  updateFollowUpStatus?(
    context: ParticipantQueryContext,
    eventId: string,
    status: FollowUpStatus,
    notes?: string
  ): Promise<SafetyEvent | null>;
}

export interface IComplianceRepository {
  getDeviations(context: ParticipantQueryContext, filters?: DeviationFilters): Promise<ProtocolDeviation[]>;
  getDeviationById(context: ParticipantQueryContext, deviationId: string): Promise<ProtocolDeviation | null>;
  getParticipantDeviations(context: ParticipantQueryContext, participantId: string): Promise<ProtocolDeviation[]>;
  getVisitDeviations(context: ParticipantQueryContext, visitId: string): Promise<ProtocolDeviation[]>;
  getComplianceSummary(context: ParticipantQueryContext): Promise<ComplianceSummaryMetrics>;
  updateDeviationStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    status: DeviationStatus
  ): Promise<ProtocolDeviation | null>;
  updateReviewStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    reviewStatus: ComplianceReviewStatus,
    reviewedBy?: string
  ): Promise<ProtocolDeviation | null>;
  updateCapaStatus(
    context: ParticipantQueryContext,
    deviationId: string,
    capaStatus: CapaStatus,
    summary?: string
  ): Promise<ProtocolDeviation | null>;
}


