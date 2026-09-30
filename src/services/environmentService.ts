/**
 * Environment Manager & Repository Factory
 * 
 * Central controller for application data environment:
 * - 'MOCK': Canonical pre-populated synthetic demo fixtures
 * - 'EMPTY_TEST': Clean, browser-persistent test workspace under `aiia_ctms_empty_test_*`
 * 
 * Enforces strict isolation between environments.
 */
import { AppEnvironmentMode } from '../types';
import { browserStorage } from '../storage/browserStorage';
import { emptyTestStore, MODE_STORAGE_KEY } from '../storage/emptyTestStore';

// Mock Repositories
import { mockAuthRepository } from '../repositories/mockAuthRepository';
import { mockStudyRepository } from '../repositories/mockStudyRepository';
import { mockParticipantRepository } from '../repositories/mockParticipantRepository';
import { mockVisitRepository } from '../repositories/mockVisitRepository';
import { mockTaskRepository } from '../repositories/mockTaskRepository';
import { mockTeamRepository } from '../repositories/mockTeamRepository';
import { mockVisitDataRepository } from '../repositories/mockVisitDataRepository';
import { mockSafetyRepository } from '../repositories/mockSafetyRepository';
import { mockComplianceRepository } from '../repositories/mockComplianceRepository';
import { mockDocumentRepository } from '../repositories/mockDocumentRepository';
import { mockNotificationRepository } from '../repositories/mockNotificationRepository';
import { mockDashboardRepository } from '../repositories/mockDashboardRepository';
import { mockReportRepository } from '../repositories/mockReportRepository';
import { mockProtocolRepository } from '../repositories/mockProtocolRepository';
import { mockAyurvedaRepository } from '../repositories/mockAyurvedaRepository';

// Empty Test Repositories
import {
  EmptyAuthRepository,
  EmptyStudyRepository,
  EmptyParticipantRepository,
  EmptyVisitRepository,
  EmptyTaskRepository,
  EmptyTeamRepository,
  EmptyVisitDataRepository,
  EmptySafetyRepository,
  EmptyComplianceRepository,
  EmptyDocumentRepository,
  EmptyNotificationRepository,
  EmptyDashboardRepository,
  EmptyReportRepository,
  EmptyAuditRepository,
  EmptyProtocolRepository,
  EmptyAyurvedaRepository,
} from '../repositories/emptyTestRepositories';
import { mockAuditRepository } from '../repositories/mockAuditRepository';

import {
  IAuthRepository,
  IStudyRepository,
  IParticipantRepository,
  IVisitRepository,
  ITaskRepository,
  ITeamRepository,
  IVisitDataRepository,
  ISafetyRepository,
  IComplianceRepository,
  IDocumentRepository,
  INotificationRepository,
  IDashboardRepository,
  IReportRepository,
  IAuditRepository,
  IProtocolRepository,
  IAyurvedaConfigurationRepository,
} from '../repositories/interfaces';

export interface DataEnvironment {
  mode: AppEnvironmentMode;
  authRepository: IAuthRepository;
  studyRepository: IStudyRepository;
  participantRepository: IParticipantRepository;
  visitRepository: IVisitRepository;
  taskRepository: ITaskRepository;
  teamRepository: ITeamRepository;
  visitDataRepository: IVisitDataRepository;
  safetyRepository: ISafetyRepository;
  complianceRepository: IComplianceRepository;
  documentRepository: IDocumentRepository;
  notificationRepository: INotificationRepository;
  dashboardRepository: IDashboardRepository;
  reportRepository: IReportRepository;
  protocolRepository: IProtocolRepository;
  ayurvedaRepository: IAyurvedaConfigurationRepository;
  auditRepository?: IAuditRepository;
}

export class EnvironmentService {
  private mode: AppEnvironmentMode;
  private listeners: Set<(mode: AppEnvironmentMode) => void> = new Set();

  private mockEnv: DataEnvironment;
  private emptyEnv: DataEnvironment;

  constructor() {
    const savedMode = browserStorage.get<AppEnvironmentMode>(MODE_STORAGE_KEY);
    this.mode = savedMode === 'EMPTY_TEST' ? 'EMPTY_TEST' : 'MOCK';

    if (this.mode === 'EMPTY_TEST') {
      emptyTestStore.initWorkspace();
    }

    this.mockEnv = {
      mode: 'MOCK',
      authRepository: mockAuthRepository,
      studyRepository: mockStudyRepository,
      participantRepository: mockParticipantRepository,
      visitRepository: mockVisitRepository,
      taskRepository: mockTaskRepository,
      teamRepository: mockTeamRepository,
      visitDataRepository: mockVisitDataRepository,
      safetyRepository: mockSafetyRepository,
      complianceRepository: mockComplianceRepository,
      documentRepository: mockDocumentRepository,
      notificationRepository: mockNotificationRepository,
      dashboardRepository: mockDashboardRepository,
      reportRepository: mockReportRepository,
      protocolRepository: mockProtocolRepository,
      ayurvedaRepository: mockAyurvedaRepository,
      auditRepository: mockAuditRepository,
    };

    this.emptyEnv = {
      mode: 'EMPTY_TEST',
      authRepository: new EmptyAuthRepository(),
      studyRepository: new EmptyStudyRepository(),
      participantRepository: new EmptyParticipantRepository(),
      visitRepository: new EmptyVisitRepository(),
      taskRepository: new EmptyTaskRepository(),
      teamRepository: new EmptyTeamRepository(),
      visitDataRepository: new EmptyVisitDataRepository(),
      safetyRepository: new EmptySafetyRepository(),
      complianceRepository: new EmptyComplianceRepository(),
      documentRepository: new EmptyDocumentRepository(),
      notificationRepository: new EmptyNotificationRepository(),
      dashboardRepository: new EmptyDashboardRepository(),
      reportRepository: new EmptyReportRepository(),
      protocolRepository: new EmptyProtocolRepository(),
      ayurvedaRepository: new EmptyAyurvedaRepository(),
      auditRepository: new EmptyAuditRepository(),
    };
  }

  getMode(): AppEnvironmentMode {
    return this.mode;
  }

  setMode(mode: AppEnvironmentMode): void {
    if (this.mode === mode) return;

    this.mode = mode;
    browserStorage.set(MODE_STORAGE_KEY, mode);

    if (mode === 'EMPTY_TEST') {
      emptyTestStore.initWorkspace();
    }

    this.notifyListeners();
  }

  setEnvironment(mode: AppEnvironmentMode): void {
    this.setMode(mode);
  }

  resetEmptyTestWorkspace(): void {
    emptyTestStore.resetWorkspace();
    this.notifyListeners();
  }

  getActiveEnvironment(): DataEnvironment {
    return this.mode === 'EMPTY_TEST' ? this.emptyEnv : this.mockEnv;
  }

  getEnvironment(mode?: AppEnvironmentMode): DataEnvironment {
    const target = mode || this.mode;
    return target === 'EMPTY_TEST' ? this.emptyEnv : this.mockEnv;
  }

  // Repository Getters (auto-resolve according to active environment)
  getAuthRepository(): IAuthRepository {
    return this.getActiveEnvironment().authRepository;
  }

  getStudyRepository(): IStudyRepository {
    return this.getActiveEnvironment().studyRepository;
  }

  getParticipantRepository(): IParticipantRepository {
    return this.getActiveEnvironment().participantRepository;
  }

  getVisitRepository(): IVisitRepository {
    return this.getActiveEnvironment().visitRepository;
  }

  getTaskRepository(): ITaskRepository {
    return this.getActiveEnvironment().taskRepository;
  }

  getTeamRepository(): ITeamRepository {
    return this.getActiveEnvironment().teamRepository;
  }

  getVisitDataRepository(): IVisitDataRepository {
    return this.getActiveEnvironment().visitDataRepository;
  }

  getSafetyRepository(): ISafetyRepository {
    return this.getActiveEnvironment().safetyRepository;
  }

  getComplianceRepository(): IComplianceRepository {
    return this.getActiveEnvironment().complianceRepository;
  }

  getDocumentRepository(): IDocumentRepository {
    return this.getActiveEnvironment().documentRepository;
  }

  getNotificationRepository(): INotificationRepository {
    return this.getActiveEnvironment().notificationRepository;
  }

  getDashboardRepository(): IDashboardRepository {
    return this.getActiveEnvironment().dashboardRepository;
  }

  getReportRepository(): IReportRepository {
    return this.getActiveEnvironment().reportRepository;
  }

  getProtocolRepository(): IProtocolRepository {
    return this.getActiveEnvironment().protocolRepository;
  }

  getAyurvedaConfigurationRepository(): IAyurvedaConfigurationRepository {
    return this.getActiveEnvironment().ayurvedaRepository;
  }

  getAuditRepository(): IAuditRepository | undefined {
    return this.getActiveEnvironment().auditRepository;
  }

  subscribe(listener: (mode: AppEnvironmentMode) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.mode);
      } catch (err) {
        console.error('[EnvironmentService] Listener error:', err);
      }
    });
  }
}

export const environmentService = new EnvironmentService();
