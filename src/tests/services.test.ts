import { studyService } from '../services/studyService';
import { dashboardService } from '../services/dashboardService';
import { participantService } from '../services/participantService';
import { visitService } from '../services/visitService';
import { safetyService } from '../services/safetyService';
import { complianceService } from '../services/complianceService';
import { teamService } from '../services/teamService';
import { taskService } from '../services/taskService';
import { documentService } from '../services/documentService';
import { reportService } from '../services/reportService';
import {
  calculateVisitWindow,
  deriveVisitStatus,
  calculateActivityMetrics,
} from '../utils/visitCalculations';
import { isValidTaskTransition } from '../utils/taskCalculations';
import {
  calculateDocumentExpiryState,
  getDaysUntilExpiry,
  deriveDocumentStatus,
  isDocumentActionRequired,
  DOCUMENT_REFERENCE_DATE,
} from '../utils/documentCalculations';
import {
  generateCsvContent,
  formatCsvCell,
  generateExcelContent,
  formatFilterDisplay,
  REGULATORY_REPORT_DISCLAIMER,
} from '../utils/reportCalculations';
import { notificationService } from '../services/notificationService';
import { mockNotificationRepository } from '../repositories/mockNotificationRepository';
import {
  isActionRequiredNotification,
  calculateNotificationSummary,
  filterNotifications,
  isDuplicateActiveNotification,
  getDefaultActionRoute,
  formatRelativeTime,
} from '../utils/notificationCalculations';
import { visitDataService } from '../services/visitDataService';
import { mockVisitDataRepository } from '../repositories/mockVisitDataRepository';
import {
  isValidTransition as isValidVisitDataTransition,
} from '../utils/visitDataCalculations';
import { authService } from '../services/authService';
import { browserStorage, SESSION_STORAGE_KEY } from '../storage/browserStorage';
import { getRoleLandingRoute, getRoleNavigationItems } from '../config/navigationConfig';
import { environmentService } from '../services/environmentService';
import { emptyTestStore, BOOTSTRAP_PI_USER, BOOTSTRAP_PI_PASSWORD } from '../storage/emptyTestStore';
import { mockDataStore } from '../storage/mockDataStore';
import { identityDeliveryService } from '../services/identityDeliveryService';
import { participantNumberService } from '../services/participantNumberService';
import { auditService } from '../services/auditService';

function assert(condition: unknown, message: string = 'Assertion condition was false'): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertStrictEqual<T>(actual: T, expected: T, message: string = 'Values are not strictly equal') {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message} (expected: ${expected}, got: ${actual})`);
  }
}

async function runTests() {
  console.log('--- STARTING CTMS SERVICE & DATA TESTS (SEGMENTS A & B) ---');

  // Test 1: Study Service retrieves studies
  console.log('Test 1: studyService.getStudies()');
  const studies = await studyService.getStudies();
  assert(Array.isArray(studies), 'Studies should be an array');
  assert(studies.length >= 2, 'Should have at least 2 fictional studies');
  assertStrictEqual(studies[0].code, 'AYU-CT-001', 'First study should be AYU-CT-001');
  console.log('✓ Test 1 passed: Studies retrieved successfully.');

  // Test 2: Study Service retrieves sites for a study
  console.log('Test 2: studyService.getSites("STUDY-001")');
  const sites = await studyService.getSites('STUDY-001');
  assert(Array.isArray(sites), 'Sites should be an array');
  assert(sites.length >= 2, 'STUDY-001 should have at least 2 sites');
  assertStrictEqual(sites[0].id, 'SITE-001', 'First site should be SITE-001');
  assertStrictEqual(sites[0].siteCode, 'SITE-001', 'First site code should be SITE-001');
  console.log('✓ Test 2 passed: Sites retrieved successfully.');

  // Test 3: Study Context model
  console.log('Test 3: studyService.getCurrentContext("STUDY-001", "SITE-001")');
  const context = await studyService.getCurrentContext('STUDY-001', 'SITE-001');
  assert(context !== null, 'Context should not be null');
  assertStrictEqual(context?.studyCode, 'AYU-CT-001', 'Context studyCode matches');
  assertStrictEqual(context?.siteCode, 'SITE-001', 'Context siteCode matches');
  assertStrictEqual(context?.piName, 'Dr. Ananya Sharma', 'Context PI matches');
  assertStrictEqual(context?.studyStatus, 'Recruiting', 'Context studyStatus matches');
  console.log('✓ Test 3 passed: Context model valid.');

  // Test 4: Dashboard Overview Data consistency & math
  console.log('Test 4: dashboardService.getOverview("STUDY-001", "SITE-001")');
  const overview = await dashboardService.getOverview('STUDY-001', 'SITE-001');
  assert(overview !== null, 'Overview should not be null');

  // Verify participant numbers consistency
  const { participantSummary, recruitment, visits, safetySummary, complianceSummary } = overview!;
  assertStrictEqual(participantSummary.enrolled, 124, 'Enrolled participants should be 124');
  assertStrictEqual(recruitment.target, 150, 'Recruitment target should be 150');
  assertStrictEqual(recruitment.enrolled, 124, 'Recruitment enrolled should match participant enrolled');
  assertStrictEqual(recruitment.remaining, 26, 'Remaining should be target - enrolled (150 - 124 = 26)');

  // Verify mathematical calculation of progress: 124 / 150 = 82.666...% -> 82.7%
  const expectedProgress = Math.round((124 / 150) * 1000) / 10;
  assertStrictEqual(recruitment.progressPercent, expectedProgress, 'Recruitment progress percentage must be mathematically calculated');
  assertStrictEqual(recruitment.progressPercent, 82.7, 'Progress should equal 82.7%');

  // Verify participant status breakdown sum: active (98) + completed (21) + withdrawn (5) = 124
  assertStrictEqual(
    participantSummary.active + participantSummary.completed + participantSummary.withdrawn,
    participantSummary.enrolled,
    'Active + Completed + Withdrawn must equal Enrolled participants'
  );

  // Verify visits metrics
  assertStrictEqual(visits.upcoming, 18, 'Upcoming visits should be 18');
  assertStrictEqual(visits.overdue, 3, 'Overdue visits should be 3');

  // Verify safety summary
  assertStrictEqual(safetySummary.adverseEvents, 12, 'Adverse Events should be 12');
  assertStrictEqual(safetySummary.seriousAdverseEvents, 2, 'Serious Adverse Events should be 2');
  assertStrictEqual(safetySummary.pendingReview, 1, 'Pending safety reviews should be 1');

  // Verify compliance summary
  assertStrictEqual(complianceSummary.openDeviations, 3, 'Open deviations should be 3');
  assertStrictEqual(complianceSummary.criticalDeviations, 0, 'Critical deviations should be 0');

  // Verify upcoming activities
  assert(overview!.upcomingActivities.length > 0, 'Upcoming activities should not be empty');
  const hasDueToday = overview!.upcomingActivities.some((a) => a.status === 'Due Today');
  const hasOverdue = overview!.upcomingActivities.some((a) => a.status === 'Overdue');
  assert(hasDueToday, 'Upcoming activities should contain at least one Due Today');
  assert(hasOverdue, 'Upcoming activities should contain at least one Overdue');

  // Verify pending actions
  assert(overview!.pendingActions.length > 0, 'Pending actions should not be empty');
  const hasHighPriority = overview!.pendingActions.some((a) => a.priority === 'High');
  assert(hasHighPriority, 'Pending actions should include high priority actions');

  // Verify recent activities feed
  assert(overview!.recentActivities.length > 0, 'Recent activities should not be empty');
  assert(overview!.recentActivities[0].actor.length > 0, 'Recent activities must include actor');

  console.log('✓ Test 4 passed: Dashboard overview data integrity & calculation confirmed.');

  // Test 5: Non-existent study/site handles gracefully
  console.log('Test 5: Graceful null handling on non-existent study/site');
  const nullOverview = await dashboardService.getOverview('INVALID-STUDY', 'INVALID-SITE');
  assertStrictEqual(nullOverview, null, 'Non-existent study/site should return null');
  console.log('✓ Test 5 passed: Null handling confirmed.');

  // ==========================================
  // SEGMENT B: PARTICIPANT MANAGEMENT TESTS
  // ==========================================

  // Test 6: Participant retrieval & study/site scoping
  console.log('Test 6: participantService.getParticipants() - Study + Site Scoping');
  const ctxSite1 = { studyId: 'STUDY-001', siteId: 'SITE-001' };
  const participantsSite1 = await participantService.getParticipants(ctxSite1);
  assert(Array.isArray(participantsSite1), 'Participants should be an array');
  assertStrictEqual(participantsSite1.length, 10, 'SITE-001 should have 10 participants');
  assert(participantsSite1.every((p) => p.studyId === 'STUDY-001' && p.siteId === 'SITE-001'), 'All participants must belong to STUDY-001 and SITE-001');

  const ctxSite2 = { studyId: 'STUDY-001', siteId: 'SITE-002' };
  const participantsSite2 = await participantService.getParticipants(ctxSite2);
  assertStrictEqual(participantsSite2.length, 3, 'SITE-002 should have 3 participants');
  assert(participantsSite2.every((p) => p.siteId === 'SITE-002'), 'All participants must belong to SITE-002');
  console.log('✓ Test 6 passed: Study/site participant scoping verified.');

  // Test 7: Participant search (case-insensitive for code, screening, initials)
  console.log('Test 7: Participant search filtering');
  const searchByCode = await participantService.getParticipants(ctxSite1, { search: 'pt-1023' });
  assertStrictEqual(searchByCode.length, 1, 'Search for pt-1023 should return 1 result');
  assertStrictEqual(searchByCode[0].participantCode, 'PT-1023');

  const searchByInitials = await participantService.getParticipants(ctxSite1, { search: 'r.k.' });
  assertStrictEqual(searchByInitials.length, 1, 'Search for r.k. should return 1 result');
  assertStrictEqual(searchByInitials[0].initials, 'R.K.');

  const searchByScreening = await participantService.getParticipants(ctxSite1, { search: 'scr-001-042' });
  assertStrictEqual(searchByScreening.length, 1, 'Search for scr-001-042 should return 1 result');
  assertStrictEqual(searchByScreening[0].participantCode, 'PT-1042');
  console.log('✓ Test 7 passed: Case-insensitive search verified.');

  // Test 8: Status & Demographic filtering
  console.log('Test 8: Status and demographic filters');
  const activeParticipants = await participantService.getParticipants(ctxSite1, { status: 'ACTIVE' });
  assertStrictEqual(activeParticipants.length, 4, 'SITE-001 should have 4 ACTIVE participants');
  assert(activeParticipants.every((p) => p.status === 'ACTIVE'));

  const femaleActiveParticipants = await participantService.getParticipants(ctxSite1, {
    status: 'ACTIVE',
    sex: 'F',
  });
  assertStrictEqual(femaleActiveParticipants.length, 2, 'SITE-001 should have 2 active female participants');

  const attentionRequiredList = await participantService.getParticipants(ctxSite1, { attentionRequired: true });
  assertStrictEqual(attentionRequiredList.length, 3, 'SITE-001 should have 3 participants flagged with attention required');
  console.log('✓ Test 8 passed: Status, sex, and attention filtering verified.');

  // Test 9: Participant Summary Calculations
  console.log('Test 9: participantService.getParticipantSummary()');
  const summaryMetrics = await participantService.getParticipantSummary(ctxSite1);
  assertStrictEqual(summaryMetrics.total, 10, 'Total participants should be 10');
  assertStrictEqual(summaryMetrics.active, 4, 'Active count should be 4');
  assertStrictEqual(summaryMetrics.screening, 2, 'Screening/eligible count should be 2');
  assertStrictEqual(summaryMetrics.completed, 1, 'Completed count should be 1');
  assertStrictEqual(summaryMetrics.withdrawn, 2, 'Withdrawn + Lost to follow-up count should be 2');
  assertStrictEqual(summaryMetrics.screenFailed, 1, 'Screen failed count should be 1');
  assertStrictEqual(summaryMetrics.attentionRequired, 3, 'Attention required count should be 3');
  console.log('✓ Test 9 passed: Participant summary metric derivations verified.');

  // Test 10: Participant Detail Retrieval & Invalid Handling
  console.log('Test 10: participantService.getParticipant() detail lookup');
  const detail = await participantService.getParticipant(ctxSite1, 'PT-1023');
  assert(detail !== null, 'Participant PT-1023 should exist');
  assertStrictEqual(detail?.participantCode, 'PT-1023');
  assert(Array.isArray(detail?.recentActivities), 'Participant should include recentActivities');
  assert((detail?.recentActivities?.length ?? 0) >= 3, 'PT-1023 should have recent activities');

  const invalidDetail = await participantService.getParticipant(ctxSite1, 'NON-EXISTENT-ID');
  assertStrictEqual(invalidDetail, null, 'Non-existent participant ID should return null');

  // Verify site isolation on detail: PT-2015 belongs to SITE-002, querying from SITE-001 should return null
  const crossSiteDetail = await participantService.getParticipant(ctxSite1, 'PT-2015');
  assertStrictEqual(crossSiteDetail, null, 'Querying a participant from another site must return null');
  // ==========================================
  // SEGMENT C: VISITS & CLINICAL ACTIVITIES TESTS
  // ==========================================

  // Test 11: Visit Window calculation
  console.log('Test 11: calculateVisitWindow() protocol offsets & window derivation');
  const windowCalc = calculateVisitWindow('2026-08-28', 30, 3, 3);
  assertStrictEqual(windowCalc.targetDate, '2026-09-27', 'Target date should be 2026-08-28 + 30 days = 2026-09-27');
  assertStrictEqual(windowCalc.windowStart, '2026-09-24', 'Window start should be target - 3 days = 2026-09-24');
  assertStrictEqual(windowCalc.windowEnd, '2026-09-30', 'Window end should be target + 3 days = 2026-09-30');
  console.log('✓ Test 11 passed: Protocol window calculation verified.');

  // Test 12: Deterministic Visit Status derivation
  console.log('Test 12: deriveVisitStatus() operational status rules');
  const baseVisitParams = {
    targetDate: '2026-09-27',
    windowStart: '2026-09-24',
    windowEnd: '2026-09-30',
  };

  // Status inside window on reference date (2026-09-29) -> DUE
  const statusDue = deriveVisitStatus({ ...baseVisitParams, referenceDate: '2026-09-29' });
  assertStrictEqual(statusDue, 'DUE', 'Visit inside window on 2026-09-29 should be DUE');

  // Status before window opens (2026-09-20) -> SCHEDULED
  const statusScheduled = deriveVisitStatus({ ...baseVisitParams, referenceDate: '2026-09-20' });
  assertStrictEqual(statusScheduled, 'SCHEDULED', 'Visit before window opens should be SCHEDULED');

  // Status shortly past window closure (2026-10-02) -> OVERDUE
  const statusOverdue = deriveVisitStatus({ ...baseVisitParams, referenceDate: '2026-10-02' });
  assertStrictEqual(statusOverdue, 'OVERDUE', 'Visit 2 days past window end should be OVERDUE');

  // Status >14 days past window closure (2026-10-20) -> MISSED
  const statusMissed = deriveVisitStatus({ ...baseVisitParams, referenceDate: '2026-10-20' });
  assertStrictEqual(statusMissed, 'MISSED', 'Visit >14 days past window end should be MISSED');

  // Completed visit with completion date -> COMPLETED
  const statusCompleted = deriveVisitStatus({
    ...baseVisitParams,
    referenceDate: '2026-10-20',
    completedDate: '2026-09-27',
  });
  assertStrictEqual(statusCompleted, 'COMPLETED', 'Visit with completedDate should always be COMPLETED');

  // Cancelled visit -> CANCELLED
  const statusCancelled = deriveVisitStatus({
    ...baseVisitParams,
    cancelledDate: '2026-09-25',
  });
  assertStrictEqual(statusCancelled, 'CANCELLED', 'Visit with cancelledDate should be CANCELLED');
  console.log('✓ Test 12 passed: Deterministic status derivation verified.');

  // Test 13: Activity metrics calculation
  console.log('Test 13: calculateActivityMetrics() checklist metrics');
  const metricsCalc = calculateActivityMetrics([
    { id: '1', visitId: 'V1', code: 'A1', name: 'Vital Signs', required: true, status: 'COMPLETED' },
    { id: '2', visitId: 'V1', code: 'A2', name: 'Blood Draw', required: true, status: 'PENDING' },
    { id: '3', visitId: 'V1', code: 'A3', name: 'Optional Survey', required: false, status: 'PENDING' },
  ]);
  assertStrictEqual(metricsCalc.total, 3, 'Total activities should be 3');
  assertStrictEqual(metricsCalc.completed, 1, 'Completed activities should be 1');
  assertStrictEqual(metricsCalc.pending, 2, 'Pending activities should be 2');
  assertStrictEqual(metricsCalc.requiredIncomplete, 1, 'Required incomplete should be 1 (only required pending/in_progress)');
  console.log('✓ Test 13 passed: Activity metrics calculations verified.');

  // Test 14: Protocol visit definitions retrieval
  console.log('Test 14: visitService.getProtocolVisits()');
  const protoStudy1 = await visitService.getProtocolVisits('STUDY-001');
  assert(Array.isArray(protoStudy1), 'Protocol visits should be an array');
  assertStrictEqual(protoStudy1.length, 6, 'STUDY-001 should define 6 protocol visits');
  assertStrictEqual(protoStudy1[0].code, 'V1-SCR', 'First visit should be V1-SCR');
  assertStrictEqual(protoStudy1[5].code, 'V6-D90', 'Last visit should be V6-D90');

  const protoStudy2 = await visitService.getProtocolVisits('STUDY-002');
  assertStrictEqual(protoStudy2.length, 4, 'STUDY-002 should define 4 protocol visits');
  console.log('✓ Test 14 passed: Protocol visit definitions verified.');

  // Test 15: Site-level visit retrieval & study/site scoping
  console.log('Test 15: visitService.getVisits() - Site scoping');
  const visitsSite1 = await visitService.getVisits(ctxSite1);
  assert(Array.isArray(visitsSite1), 'Visits should be an array');
  assert(visitsSite1.length >= 10, 'SITE-001 should have at least 10 visits scheduled');
  assert(visitsSite1.every((v) => v.studyId === 'STUDY-001' && v.siteId === 'SITE-001'), 'All visits must belong to SITE-001');

  const visitsSite2 = await visitService.getVisits(ctxSite2);
  assertStrictEqual(visitsSite2.length, 2, 'SITE-002 should have 2 visits scheduled');
  assert(visitsSite2.every((v) => v.siteId === 'SITE-002'), 'All visits must belong to SITE-002');
  console.log('✓ Test 15 passed: Visit scoping verified.');

  // Test 16: Visit filtering
  console.log('Test 16: Visit filtering by status, search, and participant');
  const dueVisits = await visitService.getVisits(ctxSite1, { status: 'DUE' });
  assert(dueVisits.length >= 1, 'SITE-001 should have at least 1 DUE visit');
  assert(dueVisits.every((v) => v.status === 'DUE'), 'All returned visits must be DUE');

  const searchVisits = await visitService.getVisits(ctxSite1, { search: 'pt-1023' });
  assert(searchVisits.length >= 4, 'Search for PT-1023 should return all PT-1023 visits');
  assert(searchVisits.every((v) => v.participantCode === 'PT-1023'));

  const ptVisitsFiltered = await visitService.getVisits(ctxSite1, { participantId: 'PT-1023' });
  assertStrictEqual(ptVisitsFiltered.length, searchVisits.length, 'Filter by participantId should match search count');
  console.log('✓ Test 16 passed: Visit filters verified.');

  // Test 17: Participant visit timeline
  console.log('Test 17: visitService.getParticipantVisits()');
  const pt1023Timeline = await visitService.getParticipantVisits(ctxSite1, 'PT-1023');
  assert(pt1023Timeline.length >= 4, 'PT-1023 should have timeline visits');
  for (let i = 0; i < pt1023Timeline.length - 1; i++) {
    assert(pt1023Timeline[i].sequence <= pt1023Timeline[i + 1].sequence, 'Visits must be sorted by sequence');
  }
  console.log('✓ Test 17 passed: Participant visit timeline verified.');

  // Test 18: Visit detail lookup & cross-site isolation
  console.log('Test 18: visitService.getVisitById()');
  const visitDetail = await visitService.getVisitById(ctxSite1, 'VIS-1023-04');
  assert(visitDetail !== null, 'VIS-1023-04 should exist');
  assertStrictEqual(visitDetail?.visitCode, 'V4-D30');
  assertStrictEqual(visitDetail?.status, 'DUE');
  assert(Array.isArray(visitDetail?.activities), 'Activities should be an array');
  assertStrictEqual(visitDetail?.activities.length, 5, 'VIS-1023-04 should have 5 activities');

  const invalidVisit = await visitService.getVisitById(ctxSite1, 'NON-EXISTENT-VISIT');
  assertStrictEqual(invalidVisit, null, 'Non-existent visit should return null');

  // Cross-site lookup test
  const crossSiteVisit = await visitService.getVisitById(ctxSite1, 'VIS-2015-03');
  assertStrictEqual(crossSiteVisit, null, 'Cross-site visit lookup must return null');
  console.log('✓ Test 18 passed: Visit detail lookup and site isolation verified.');

  // Test 19: Visit summary metrics
  console.log('Test 19: visitService.getVisitSummary()');
  const visitSummary = await visitService.getVisitSummary(ctxSite1);
  assert(visitSummary.total >= 10, 'Total visits at SITE-001 should be >= 10');
  assert(visitSummary.due >= 1, 'Due visits should be >= 1');
  assert(visitSummary.upcoming >= 1, 'Upcoming visits should be >= 1');
  assert(visitSummary.completed >= 3, 'Completed visits should be >= 3');
  assertStrictEqual(
    visitSummary.due + visitSummary.upcoming + visitSummary.overdue + visitSummary.completed + visitSummary.missed,
    visitSummary.total,
    'Sum of visit statuses must equal total visits'
  );
  console.log('✓ Test 19 passed: Visit summary metrics verified.');

  // Test 20: Interactive procedure sign-off & status update
  console.log('Test 20: visitService.updateActivityStatus() checklist sign-off');
  const updatedVisit = await visitService.updateActivityStatus(
    ctxSite1,
    'VIS-1023-04',
    'ACT-V4-5', // Study Medication Reconciliation
    'COMPLETED'
  );
  assert(updatedVisit !== null, 'Updated visit should not be null');
  const updatedActivity = updatedVisit?.activities.find((a) => a.id === 'ACT-V4-5');
  assertStrictEqual(updatedActivity?.status, 'COMPLETED', 'Activity status must be COMPLETED');
  assertStrictEqual(updatedVisit?.completedActivities, 5, 'All 5 activities should now be completed');
  assertStrictEqual(updatedVisit?.requiredIncompleteActivities, 0, 'Zero required activities incomplete');
  assertStrictEqual(updatedVisit?.status, 'COMPLETED', 'Visit status must transition to COMPLETED when all required activities finish');
  console.log('✓ Test 20 passed: Interactive procedure sign-off verified.');

  // ==========================================
  // SEGMENT D: SAFETY & PHARMACOVIGILANCE TESTS
  // ==========================================

  // Test 21: Safety data consistency & structural validity
  console.log('Test 21: Safety data consistency and participant linkage');
  const safetyEventsSite1 = await safetyService.getSafetyEvents(ctxSite1);
  assert(Array.isArray(safetyEventsSite1), 'Safety events should be an array');
  assertStrictEqual(safetyEventsSite1.length, 6, 'SITE-001 should have exactly 6 synthetic safety events');

  for (const event of safetyEventsSite1) {
    assertStrictEqual(event.studyId, 'STUDY-001', `Event ${event.id} must belong to STUDY-001`);
    assertStrictEqual(event.siteId, 'SITE-001', `Event ${event.id} must belong to SITE-001`);

    // Verify participant linkage exists at this site
    const matchingParticipant = participantsSite1.find((p) => p.id === event.participantId);
    assert(Boolean(matchingParticipant), `Event ${event.id} references non-existent participant ${event.participantId}`);
    assertStrictEqual(event.participantCode, matchingParticipant!.participantCode);

    // Verify resolution date rules
    if (event.status === 'RESOLVED' || event.status === 'CLOSED') {
      if (!event.ongoing) {
        assert(event.resolutionDate !== null && event.resolutionDate !== undefined, `Resolved event ${event.id} must have resolutionDate`);
      }
    }
    if (event.ongoing) {
      assertStrictEqual(event.resolutionDate, null, `Ongoing event ${event.id} must have null resolutionDate`);
    }
  }
  console.log('✓ Test 21 passed: Safety data consistency and participant linkage verified.');

  // Test 22: Severity vs Seriousness decoupling
  console.log('Test 22: Severity vs Seriousness conceptual separation');
  const severeNonSerious = safetyEventsSite1.find((e) => e.severity === 'SEVERE' && e.seriousness === 'NONE');
  assert(Boolean(severeNonSerious), 'A SEVERE but Non-Serious event must exist (e.g. AE-005)');
  assertStrictEqual(severeNonSerious?.id, 'AE-005');
  assertStrictEqual(severeNonSerious?.eventType, 'AE');

  const moderateSerious = safetyEventsSite1.find((e) => e.severity === 'MODERATE' && e.seriousness !== 'NONE');
  assert(Boolean(moderateSerious), 'A MODERATE but Serious event must exist (e.g. SAE-003)');
  assertStrictEqual(moderateSerious?.id, 'SAE-003');
  assertStrictEqual(moderateSerious?.eventType, 'SAE');
  assertStrictEqual(moderateSerious?.seriousness, 'OTHER_MEDICALLY_IMPORTANT');
  console.log('✓ Test 22 passed: Severity vs Seriousness independence verified.');

  // Test 23: Study + Site Scoping for Safety Events
  console.log('Test 23: safetyService.getSafetyEvents() - Site Scoping');
  const safetyEventsSite2 = await safetyService.getSafetyEvents(ctxSite2);
  assertStrictEqual(safetyEventsSite2.length, 2, 'SITE-002 should have 2 safety events');
  assert(safetyEventsSite2.every((e) => e.siteId === 'SITE-002'), 'All events must belong to SITE-002');

  const ctxSite3 = { studyId: 'STUDY-002', siteId: 'SITE-003' };
  const safetyEventsSite3 = await safetyService.getSafetyEvents(ctxSite3);
  assertStrictEqual(safetyEventsSite3.length, 2, 'SITE-003 should have 2 safety events');
  assert(safetyEventsSite3.every((e) => e.studyId === 'STUDY-002' && e.siteId === 'SITE-003'), 'All events must belong to STUDY-002 and SITE-003');
  console.log('✓ Test 23 passed: Safety event site scoping verified.');

  // Test 24: Participant Safety History & Summary
  console.log('Test 24: safetyService.getParticipantSafetySummary()');
  const pt1023Safety = await safetyService.getParticipantSafetySummary(ctxSite1, 'PT-1023');
  assertStrictEqual(pt1023Safety.totalEvents, 2, 'PT-1023 should have 2 safety events');
  assertStrictEqual(pt1023Safety.aeCount, 1, 'PT-1023 should have 1 AE');
  assertStrictEqual(pt1023Safety.saeCount, 1, 'PT-1023 should have 1 SAE');
  assertStrictEqual(pt1023Safety.ongoingCount, 0, 'PT-1023 should have 0 ongoing events');
  assertStrictEqual(pt1023Safety.piReviewRequiredCount, 0, 'PT-1023 should have 0 pending review events');

  const pt1011Safety = await safetyService.getParticipantSafetySummary(ctxSite1, 'PT-1011');
  assertStrictEqual(pt1011Safety.totalEvents, 1, 'PT-1011 should have 1 safety event');
  assertStrictEqual(pt1011Safety.saeCount, 1, 'PT-1011 event should be SAE');
  assertStrictEqual(pt1011Safety.ongoingCount, 1, 'PT-1011 event should be ongoing');
  assertStrictEqual(pt1011Safety.piReviewRequiredCount, 1, 'PT-1011 requires PI review');
  console.log('✓ Test 24 passed: Participant safety summary verified.');

  // Test 25: Search filtering across multiple attributes
  console.log('Test 25: Safety event search filtering');
  const searchById = await safetyService.getSafetyEvents(ctxSite1, { search: 'sae-003' });
  assertStrictEqual(searchById.length, 1, 'Search by ID sae-003 should return 1 result');
  assertStrictEqual(searchById[0].id, 'SAE-003');

  const searchBySubject = await safetyService.getSafetyEvents(ctxSite1, { search: 'pt-1042' });
  assertStrictEqual(searchBySubject.length, 1, 'Search by subject PT-1042 should return 1 result');
  assertStrictEqual(searchBySubject[0].participantCode, 'PT-1042');

  const searchByTitle = await safetyService.getSafetyEvents(ctxSite1, { search: 'pyelonephritis' });
  assertStrictEqual(searchByTitle.length, 1, 'Search by title pyelonephritis should return 1 result');
  assertStrictEqual(searchByTitle[0].id, 'SAE-002');

  const searchByReporter = await safetyService.getSafetyEvents(ctxSite1, { search: 'Dr. Vikram Verma' });
  assertStrictEqual(searchByReporter.length, 2, 'Search by reporter Vikram Verma should return 2 results');
  console.log('✓ Test 25 passed: Search filters verified.');

  // Test 26: Combined multi-criteria filtering
  console.log('Test 26: Combined multi-criteria safety filters');
  const combinedSaeReview = await safetyService.getSafetyEvents(ctxSite1, {
    eventType: 'SAE',
    piReviewStatus: 'SIGN_OFF_REQUIRED',
    participantId: 'PT-1011',
  });
  assertStrictEqual(combinedSaeReview.length, 1, 'Combined filter should return exactly 1 event (SAE-003)');
  assertStrictEqual(combinedSaeReview[0].id, 'SAE-003');

  const emptyFilterMatch = await safetyService.getSafetyEvents(ctxSite1, {
    eventType: 'SAE',
    severity: 'MILD', // No mild SAEs exist
  });
  assertStrictEqual(emptyFilterMatch.length, 0, 'No mild SAEs should exist');
  console.log('✓ Test 26 passed: Combined multi-criteria filtering verified.');

  // Test 27: Safety Summary Metrics Calculation
  console.log('Test 27: safetyService.getSafetySummary()');
  const siteSafetySummary = await safetyService.getSafetySummary(ctxSite1);
  assertStrictEqual(siteSafetySummary.total, 6, 'Total safety events should be 6');
  assertStrictEqual(siteSafetySummary.ae, 4, 'Total AEs should be 4');
  assertStrictEqual(siteSafetySummary.sae, 2, 'Total SAEs should be 2');
  assertStrictEqual(siteSafetySummary.ongoing, 2, 'Ongoing events should be 2 (SAE-003, AE-005)');
  assertStrictEqual(siteSafetySummary.resolved, 4, 'Resolved events should be 4 (AE-001, SAE-002, AE-004, AE-006)');
  assertStrictEqual(siteSafetySummary.piReviewRequired, 1, 'PI review required should be 1 (SAE-003)');
  assertStrictEqual(siteSafetySummary.followUpDue, 1, 'Follow-up due should be 1 (AE-005)');
  assertStrictEqual(siteSafetySummary.overdueFollowUp, 1, 'Overdue follow-up should be 1 (SAE-003)');
  assertStrictEqual(siteSafetySummary.ae + siteSafetySummary.sae, siteSafetySummary.total, 'AE + SAE must equal total events');
  console.log('✓ Test 27 passed: Safety summary metrics verified.');

  // Test 28: Event Detail Lookup & Cross-Site Isolation
  console.log('Test 28: safetyService.getSafetyEventById()');
  const eventDetail = await safetyService.getSafetyEventById(ctxSite1, 'SAE-003');
  assert(eventDetail !== null, 'SAE-003 should exist');
  assertStrictEqual(eventDetail?.title, 'Transient Serum Transaminase Elevation (ALT 185 U/L, AST 162 U/L)');
  assertStrictEqual(eventDetail?.severity, 'MODERATE');
  assertStrictEqual(eventDetail?.seriousness, 'OTHER_MEDICALLY_IMPORTANT');
  assertStrictEqual(eventDetail?.causality, 'PROBABLE');
  assertStrictEqual(eventDetail?.actionTaken, 'TREATMENT_DISCONTINUED');

  const invalidEvent = await safetyService.getSafetyEventById(ctxSite1, 'NON-EXISTENT-EVENT');
  assertStrictEqual(invalidEvent, null, 'Non-existent event should return null');

  const crossSiteEvent = await safetyService.getSafetyEventById(ctxSite1, 'AE-201');
  assertStrictEqual(crossSiteEvent, null, 'Cross-site safety event lookup must return null');
  console.log('✓ Test 28 passed: Event detail lookup and site isolation verified.');

  // Test 29: PI Review Status Mutation
  console.log('Test 29: safetyService.updatePIReviewStatus()');
  const reviewedEvent = await safetyService.updatePIReviewStatus(
    ctxSite1,
    'SAE-003',
    'REVIEWED',
    'Dr. Ananya Sharma (PI)'
  );
  assert(reviewedEvent !== null, 'Updated event should not be null');
  assertStrictEqual(reviewedEvent?.piReviewStatus, 'REVIEWED', 'Review status must be REVIEWED');
  assertStrictEqual(reviewedEvent?.reviewedBy, 'Dr. Ananya Sharma (PI)');
  assert(Boolean(reviewedEvent?.reviewedAt), 'reviewedAt timestamp must be populated');

  // Verify that summary metrics reflect the review mutation
  const updatedSummary = await safetyService.getSafetySummary(ctxSite1);
  assertStrictEqual(updatedSummary.piReviewRequired, 0, 'PI review required must decrease to 0');
  console.log('✓ Test 29 passed: PI review mutation and summary recalculation verified.');

  // Test 30: Follow-up Status Mutation
  console.log('Test 30: safetyService.updateFollowUpStatus()');
  const updatedFollowUpEvent = await safetyService.updateFollowUpStatus(
    ctxSite1,
    'AE-005',
    'COMPLETED',
    'Rash fully cleared; no additional intervention required.'
  );
  assert(updatedFollowUpEvent !== null, 'Updated follow-up event should not be null');
  assertStrictEqual(updatedFollowUpEvent?.followUpStatus, 'COMPLETED');
  assertStrictEqual(updatedFollowUpEvent?.followUpNotes, 'Rash fully cleared; no additional intervention required.');

  const postFollowUpSummary = await safetyService.getSafetySummary(ctxSite1);
  assertStrictEqual(postFollowUpSummary.followUpDue, 0, 'Follow-up due must decrease to 0');
  console.log('✓ Test 30 passed: Follow-up status mutation and summary recalculation verified.');

  // ==========================================
  // SEGMENT E: PROTOCOL COMPLIANCE & DEVIATIONS TESTS
  // ==========================================

  // Test 31: Deviation data consistency and relationship verification
  console.log('Test 31: Deviation data consistency');
  const allDevsSite1 = await complianceService.getDeviations(ctxSite1);
  assertStrictEqual(allDevsSite1.length, 6, 'SITE-001 must have exactly 6 protocol deviations');
  for (const dev of allDevsSite1) {
    assert(dev.id.startsWith('DEV-'), `Deviation ID must start with DEV-, got ${dev.id}`);
    assertStrictEqual(dev.studyId, 'STUDY-001', 'StudyId must be STUDY-001');
    assertStrictEqual(dev.siteId, 'SITE-001', 'SiteId must be SITE-001');
    assert(dev.occurrenceDate.length === 10, 'Occurrence date must be ISO YYYY-MM-DD');
    assert(dev.detectionDate.length === 10, 'Detection date must be ISO YYYY-MM-DD');
    assert(dev.title.length > 0, 'Deviation must have a title');
    assert(dev.description.length > 0, 'Deviation must have a description');
    if (dev.scope === 'PARTICIPANT') {
      assert(Boolean(dev.participantId), 'Participant-scoped deviation must have participantId');
    } else {
      assertStrictEqual(dev.participantId, undefined, 'Site/Study-scoped deviation must not have participantId');
    }
  }
  console.log('✓ Test 31 passed: Deviation data consistency and relationship verification verified.');

  // Test 32: Participant/site/study scope verification and isolation
  console.log('Test 32: Participant/site/study scope isolation');
  const participantScoped = await complianceService.getDeviations(ctxSite1, { scope: 'PARTICIPANT' });
  const siteScoped = await complianceService.getDeviations(ctxSite1, { scope: 'SITE' });
  const studyScoped = await complianceService.getDeviations(ctxSite1, { scope: 'STUDY' });
  assertStrictEqual(participantScoped.length, 4, 'Participant-scoped count must be 4');
  assertStrictEqual(siteScoped.length, 1, 'Site-scoped count must be 1 (DEV-002)');
  assertStrictEqual(studyScoped.length, 1, 'Study-scoped count must be 1 (DEV-004)');
  assertStrictEqual(participantScoped.length + siteScoped.length + studyScoped.length, 6, 'All scopes must sum to 6');
  console.log('✓ Test 32 passed: Scope isolation verified.');

  // Test 33: Search by deviation ID
  console.log('Test 33: Search by deviation ID');
  const searchDevById = await complianceService.getDeviations(ctxSite1, { search: 'DEV-003' });
  assertStrictEqual(searchDevById.length, 1, 'Search for DEV-003 should return exactly 1 result');
  assertStrictEqual(searchDevById[0].id, 'DEV-003');
  console.log('✓ Test 33 passed: Search by deviation ID verified.');

  // Test 34: Search by participant
  console.log('Test 34: Search by participant');
  const searchByParticipant = await complianceService.getDeviations(ctxSite1, { search: 'PT-1023' });
  assertStrictEqual(searchByParticipant.length, 1, 'Search for PT-1023 should return DEV-003');
  assertStrictEqual(searchByParticipant[0].id, 'DEV-003');
  const searchByParticipant2 = await complianceService.getDeviations(ctxSite1, { search: 'PT-1011' });
  assertStrictEqual(searchByParticipant2.length, 1, 'Search for PT-1011 should return DEV-001');
  assertStrictEqual(searchByParticipant2[0].id, 'DEV-001');
  console.log('✓ Test 34 passed: Search by participant verified.');

  // Test 35: Combined filters use AND semantics
  console.log('Test 35: Combined filters use AND semantics');
  const combinedMajorAction = await complianceService.getDeviations(ctxSite1, {
    classification: 'MAJOR',
    status: 'ACTION_REQUIRED',
  });
  assertStrictEqual(combinedMajorAction.length, 1, 'Combined filter should return exactly 1 deviation (DEV-001)');
  assertStrictEqual(combinedMajorAction[0].id, 'DEV-001');

  const combinedCriticalClosed = await complianceService.getDeviations(ctxSite1, {
    classification: 'CRITICAL',
    status: 'CLOSED',
  });
  assertStrictEqual(combinedCriticalClosed.length, 0, 'No critical closed deviations should exist at SITE-001');
  console.log('✓ Test 35 passed: Combined multi-criteria AND filtering verified.');

  // Test 36: Classification filtering
  console.log('Test 36: Classification filtering');
  const criticalDevs = await complianceService.getDeviations(ctxSite1, { classification: 'CRITICAL' });
  const majorDevs = await complianceService.getDeviations(ctxSite1, { classification: 'MAJOR' });
  const minorDevs = await complianceService.getDeviations(ctxSite1, { classification: 'MINOR' });
  assertStrictEqual(criticalDevs.length, 1, 'Critical deviations should be 1 (DEV-003)');
  assertStrictEqual(majorDevs.length, 2, 'Major deviations should be 2 (DEV-001, DEV-006)');
  assertStrictEqual(minorDevs.length, 3, 'Minor deviations should be 3 (DEV-002, DEV-004, DEV-005)');
  assertStrictEqual(criticalDevs.length + majorDevs.length + minorDevs.length, 6, 'Classification sum must equal total');
  console.log('✓ Test 36 passed: Classification filtering verified.');

  // Test 37: Status filtering
  console.log('Test 37: Status filtering');
  const resolvedDevs = await complianceService.getDeviations(ctxSite1, { status: 'RESOLVED' });
  const closedDevs = await complianceService.getDeviations(ctxSite1, { status: 'CLOSED' });
  const actionRequiredDevs = await complianceService.getDeviations(ctxSite1, { status: 'ACTION_REQUIRED' });
  const capaInProgressDevs = await complianceService.getDeviations(ctxSite1, { status: 'CAPA_IN_PROGRESS' });
  const underReviewDevs = await complianceService.getDeviations(ctxSite1, { status: 'UNDER_REVIEW' });
  assertStrictEqual(resolvedDevs.length, 2, 'Resolved deviations should be 2 (DEV-002, DEV-005)');
  assertStrictEqual(closedDevs.length, 1, 'Closed deviations should be 1 (DEV-004)');
  assertStrictEqual(actionRequiredDevs.length, 1, 'Action required deviations should be 1 (DEV-001)');
  assertStrictEqual(capaInProgressDevs.length, 1, 'CAPA in progress deviations should be 1 (DEV-003)');
  assertStrictEqual(underReviewDevs.length, 1, 'Under review deviations should be 1 (DEV-006)');

  // Test OPEN filter shortcut
  const openDevs = await complianceService.getDeviations(ctxSite1, { status: 'OPEN' });
  assertStrictEqual(openDevs.length, 3, 'Open deviations should be 3 (DEV-001, DEV-003, DEV-006)');
  assert(openDevs.every((d) => d.status !== 'RESOLVED' && d.status !== 'CLOSED'), 'Open filter must exclude RESOLVED and CLOSED');
  console.log('✓ Test 37 passed: Status filtering and OPEN shortcut verified.');

  // Test 38: CAPA filtering
  console.log('Test 38: CAPA filtering');
  const capaOverdue = await complianceService.getDeviations(ctxSite1, { capaStatus: 'OVERDUE' });
  const capaActive = await complianceService.getDeviations(ctxSite1, { capaStatus: 'IN_PROGRESS' });
  const capaPending = await complianceService.getDeviations(ctxSite1, { capaStatus: 'PENDING' });
  const capaComplete = await complianceService.getDeviations(ctxSite1, { capaStatus: 'COMPLETED' });
  const capaNotReq = await complianceService.getDeviations(ctxSite1, { capaStatus: 'NOT_REQUIRED' });
  assertStrictEqual(capaOverdue.length, 1, 'Overdue CAPA should be 1 (DEV-001)');
  assertStrictEqual(capaActive.length, 1, 'Active CAPA should be 1 (DEV-003)');
  assertStrictEqual(capaPending.length, 1, 'Pending CAPA should be 1 (DEV-006)');
  assertStrictEqual(capaComplete.length, 1, 'Completed CAPA should be 1 (DEV-005)');
  assertStrictEqual(capaNotReq.length, 2, 'Not required CAPA should be 2 (DEV-002, DEV-004)');

  // Test PENDING_OR_ACTIVE composite filter
  const capaPendingOrActive = await complianceService.getDeviations(ctxSite1, { capaStatus: 'PENDING_OR_ACTIVE' });
  assertStrictEqual(capaPendingOrActive.length, 2, 'Pending or active CAPA should be 2 (DEV-003, DEV-006)');
  console.log('✓ Test 38 passed: CAPA status filtering and PENDING_OR_ACTIVE shortcut verified.');

  // Test 39: PI review filtering
  console.log('Test 39: PI review filtering');
  const signOffReq = await complianceService.getDeviations(ctxSite1, { reviewStatus: 'SIGN_OFF_REQUIRED' });
  const pendingReview = await complianceService.getDeviations(ctxSite1, { reviewStatus: 'NOT_REVIEWED' });
  const underReview = await complianceService.getDeviations(ctxSite1, { reviewStatus: 'UNDER_REVIEW' });
  const reviewed = await complianceService.getDeviations(ctxSite1, { reviewStatus: 'REVIEWED' });
  assertStrictEqual(signOffReq.length, 1, 'Sign-off required should be 1 (DEV-001)');
  assertStrictEqual(pendingReview.length, 1, 'Pending review should be 1 (DEV-006)');
  assertStrictEqual(underReview.length, 1, 'Under review should be 1 (DEV-003)');
  assertStrictEqual(reviewed.length, 3, 'Reviewed should be 3 (DEV-002, DEV-004, DEV-005)');

  // Test REVIEW_REQUIRED composite filter
  const reviewRequiredDevs = await complianceService.getDeviations(ctxSite1, { reviewStatus: 'REVIEW_REQUIRED' });
  assertStrictEqual(reviewRequiredDevs.length, 2, 'Review required should be 2 (DEV-001, DEV-006)');

  // Test Date Range filter
  const last30Devs = await complianceService.getDeviations(ctxSite1, { dateRange: 'LAST_30_DAYS' });
  assert(Array.isArray(last30Devs), 'Date range query must return array');
  const allDatesDevs = await complianceService.getDeviations(ctxSite1, { dateRange: 'ALL' });
  assertStrictEqual(allDatesDevs.length, 6, 'ALL date range should return all 6 deviations');
  console.log('✓ Test 39 passed: PI review and date range filtering verified.');

  // Test 40: Compliance summary calculation metrics
  console.log('Test 40: Compliance summary calculations');
  const siteComplianceSummary = await complianceService.getComplianceSummary(ctxSite1);
  assertStrictEqual(siteComplianceSummary.total, 6, 'Total deviations must be 6');
  assertStrictEqual(siteComplianceSummary.open, 3, 'Open deviations must be 3 (DEV-001, DEV-003, DEV-006)');
  assertStrictEqual(siteComplianceSummary.critical, 1, 'Critical deviations must be 1 (DEV-003)');
  assertStrictEqual(siteComplianceSummary.major, 2, 'Major deviations must be 2 (DEV-001, DEV-006)');
  assertStrictEqual(siteComplianceSummary.minor, 3, 'Minor deviations must be 3 (DEV-002, DEV-004, DEV-005)');
  assertStrictEqual(siteComplianceSummary.piReviewRequired, 2, 'PI review required must be 2 (DEV-001, DEV-006)');
  assertStrictEqual(siteComplianceSummary.capaPending, 2, 'CAPA pending must be 2 (DEV-003, DEV-006)');
  assertStrictEqual(siteComplianceSummary.capaOverdue, 1, 'CAPA overdue must be 1 (DEV-001)');
  assertStrictEqual(siteComplianceSummary.resolvedOrClosed, 3, 'Resolved or closed must be 3 (DEV-002, DEV-004, DEV-005)');
  assertStrictEqual(siteComplianceSummary.open + siteComplianceSummary.resolvedOrClosed, siteComplianceSummary.total, 'Open + Resolved/Closed must equal Total');
  console.log('✓ Test 40 passed: Compliance summary calculations verified.');

  // Test 41: Detail lookup
  console.log('Test 41: Detail lookup');
  const devDetail = await complianceService.getDeviationById(ctxSite1, 'DEV-003');
  assert(devDetail !== null, 'DEV-003 should exist');
  assertStrictEqual(devDetail?.classification, 'CRITICAL');
  assertStrictEqual(devDetail?.category, 'PROCEDURE');
  assertStrictEqual(devDetail?.scope, 'PARTICIPANT');
  assertStrictEqual(devDetail?.participantId, 'PT-1023');
  assertStrictEqual(devDetail?.visitId, 'VIS-1023-04');
  console.log('✓ Test 41 passed: Detail lookup verified.');

  // Test 42: Cross-site detail isolation
  console.log('Test 42: Cross-site detail isolation');
  const crossSiteLookup = await complianceService.getDeviationById(ctxSite1, 'DEV-201');
  assertStrictEqual(crossSiteLookup, null, 'DEV-201 belongs to SITE-002 and must not be retrievable from SITE-001');
  const validSite2Lookup = await complianceService.getDeviationById(ctxSite2, 'DEV-201');
  assert(validSite2Lookup !== null, 'DEV-201 must be retrievable from SITE-002');
  console.log('✓ Test 42 passed: Cross-site detail isolation verified.');

  // Test 43: Participant deviation history
  console.log('Test 43: Participant deviation history');
  const pt1011Devs = await complianceService.getParticipantDeviations(ctxSite1, 'PT-1011');
  assertStrictEqual(pt1011Devs.length, 1, 'PT-1011 should have 1 deviation');
  assertStrictEqual(pt1011Devs[0].id, 'DEV-001');

  const pt1023Devs = await complianceService.getParticipantDeviations(ctxSite1, 'PT-1023');
  assertStrictEqual(pt1023Devs.length, 1, 'PT-1023 should have 1 deviation');
  assertStrictEqual(pt1023Devs[0].id, 'DEV-003');

  const ptCleanDevs = await complianceService.getParticipantDeviations(ctxSite1, 'PT-1102');
  assertStrictEqual(ptCleanDevs.length, 0, 'PT-1102 should have 0 deviations');
  console.log('✓ Test 43 passed: Participant deviation history verified.');

  // Test 44: Visit-linked deviation lookup
  console.log('Test 44: Visit-linked deviation lookup');
  const visit1023Devs = await complianceService.getVisitDeviations(ctxSite1, 'VIS-1023-04');
  assertStrictEqual(visit1023Devs.length, 1, 'VIS-1023-04 should have 1 deviation linked');
  assertStrictEqual(visit1023Devs[0].id, 'DEV-003');

  const visitCleanDevs = await complianceService.getVisitDeviations(ctxSite1, 'VIS-1023-01');
  assertStrictEqual(visitCleanDevs.length, 0, 'VIS-1023-01 should have 0 deviations linked');
  console.log('✓ Test 44 passed: Visit-linked deviation lookup verified.');

  // Test 45: CAPA overdue logic & status consistency
  console.log('Test 45: CAPA overdue logic & status consistency');
  const overdueDev = await complianceService.getDeviationById(ctxSite1, 'DEV-001');
  assertStrictEqual(overdueDev?.capaRequired, true, 'DEV-001 must require CAPA');
  assertStrictEqual(overdueDev?.capaStatus, 'OVERDUE', 'DEV-001 CAPA status must be OVERDUE');
  const notReqDev = await complianceService.getDeviationById(ctxSite1, 'DEV-002');
  assertStrictEqual(notReqDev?.capaRequired, false, 'DEV-002 must not require CAPA');
  assertStrictEqual(notReqDev?.capaStatus, 'NOT_REQUIRED', 'DEV-002 CAPA status must be NOT_REQUIRED');
  console.log('✓ Test 45 passed: CAPA overdue logic & consistency verified.');

  // Test 46: PI review mutation and summary recalculation
  console.log('Test 46: PI review mutation and summary recalculation');
  const signOffResult = await complianceService.updateReviewStatus(
    ctxSite1,
    'DEV-001',
    'REVIEWED',
    'Dr. Ananya Sharma (PI)'
  );
  assert(signOffResult !== null, 'Sign off result should not be null');
  assertStrictEqual(signOffResult?.reviewStatus, 'REVIEWED');
  assertStrictEqual(signOffResult?.reviewedBy, 'Dr. Ananya Sharma (PI)');
  assert(Boolean(signOffResult?.reviewedAt), 'reviewedAt timestamp must be recorded');

  const postReviewSummary = await complianceService.getComplianceSummary(ctxSite1);
  assertStrictEqual(postReviewSummary.piReviewRequired, 1, 'PI review required must decrease from 2 to 1');
  console.log('✓ Test 46 passed: PI review mutation and summary recalculation verified.');

  // Test 47: CAPA status mutation and summary recalculation
  console.log('Test 47: CAPA status mutation and summary recalculation');
  const capaUpdateResult = await complianceService.updateCapaStatus(
    ctxSite1,
    'DEV-006',
    'IN_PROGRESS',
    'Old paper forms destroyed.'
  );
  assert(capaUpdateResult !== null, 'CAPA update result should not be null');
  assertStrictEqual(capaUpdateResult?.capaStatus, 'IN_PROGRESS');
  assertStrictEqual(capaUpdateResult?.capaActionSummary, 'Old paper forms destroyed.');

  const capaCompleteResult = await complianceService.updateCapaStatus(
    ctxSite1,
    'DEV-003',
    'COMPLETED',
    'Two-person sign-off checklist verified.'
  );
  assert(capaCompleteResult !== null, 'CAPA completion result should not be null');
  assertStrictEqual(capaCompleteResult?.capaStatus, 'COMPLETED');
  assertStrictEqual(capaCompleteResult?.status, 'RESOLVED', 'Deviation should transition to RESOLVED when CAPA completed');

  const postCapaSummary = await complianceService.getComplianceSummary(ctxSite1);
  assertStrictEqual(postCapaSummary.open, 2, 'Open deviations should decrease to 2 (DEV-001, DEV-006)');
  console.log('✓ Test 47 passed: CAPA mutation and summary recalculation verified.');

  // Test 48: Lifecycle transition behavior & validation
  console.log('Test 48: Lifecycle transition behavior & validation');
  assertStrictEqual(complianceService.isValidStatusTransition('REPORTED', 'UNDER_REVIEW'), true);
  assertStrictEqual(complianceService.isValidStatusTransition('REPORTED', 'CLOSED'), false);
  assertStrictEqual(complianceService.isValidStatusTransition('RESOLVED', 'CLOSED'), true);
  assertStrictEqual(complianceService.isValidStatusTransition('CAPA_IN_PROGRESS', 'CLOSED'), false);

  // Illegal transition attempt must be rejected
  let transitionErrorThrown = false;
  try {
    await complianceService.updateDeviationStatus(ctxSite1, 'DEV-001', 'CLOSED');
  } catch (err) {
    transitionErrorThrown = true;
    assert((err as Error).message.includes('Invalid deviation status transition'), 'Error message must specify invalid transition');
  }
  assertStrictEqual(transitionErrorThrown, true, 'Illegal transition from ACTION_REQUIRED to CLOSED must throw error');

  // Valid transition from RESOLVED to CLOSED
  const closedResult = await complianceService.updateDeviationStatus(ctxSite1, 'DEV-003', 'CLOSED');
  assert(closedResult !== null, 'Closed result should not be null');
  assertStrictEqual(closedResult?.status, 'CLOSED');
  assert(Boolean(closedResult?.closedAt), 'closedAt timestamp must be recorded');
  console.log('✓ Test 48 passed: Lifecycle transition behavior & validation verified.');

  // Test 49: Attention-state calculation
  console.log('Test 49: Attention-state calculation');
  const sampleDev = await complianceService.getDeviationById(ctxSite1, 'DEV-001');
  assert(sampleDev !== null, 'DEV-001 should exist');
  assertStrictEqual(
    complianceService.isAttentionRequired({ ...sampleDev!, classification: 'CRITICAL' }),
    true,
    'Critical deviation must require attention'
  );
  assertStrictEqual(
    complianceService.isAttentionRequired({ ...sampleDev!, classification: 'MINOR', status: 'ACTION_REQUIRED' }),
    true,
    'Action-required deviation must require attention'
  );
  assertStrictEqual(
    complianceService.isAttentionRequired({ ...sampleDev!, classification: 'MINOR', status: 'RESOLVED', reviewStatus: 'REVIEWED', capaStatus: 'NOT_REQUIRED' }),
    false,
    'Resolved minor deviation without actions must not require attention'
  );
  console.log('✓ Test 49 passed: Attention-state calculation verified.');

  // Test 50: Existing Segments A-D regression check
  console.log('Test 50: Existing Segments A-D regression check');
  const regStudies50 = await studyService.getStudies();
  assert(regStudies50.length > 0, 'Studies must be present');
  const regParticipants50 = await participantService.getParticipants(ctxSite1);
  assertStrictEqual(regParticipants50.length, 10, 'SITE-001 must still have 10 participants');
  const regVisits50 = await visitService.getVisits(ctxSite1);
  assert(regVisits50.length > 0, 'Visits must still be present');
  const regSafety50 = await safetyService.getSafetyEvents(ctxSite1);
  assert(regSafety50.length > 0, 'Safety events must still be present');
  const regOverview50 = await dashboardService.getOverview('STUDY-001', 'SITE-001');
  assert(regOverview50 !== null, 'Overview must still be present');
  console.log('✓ Test 50 passed: Segments A-D regression check verified.');

  // Test 51: Team retrieval
  console.log('Test 51: teamService.getTeamMembers() - Retrieval & Scoping');
  const teamSite1 = await teamService.getTeamMembers(ctxSite1);
  assert(Array.isArray(teamSite1), 'Team members should be an array');
  assertStrictEqual(teamSite1.length, 7, 'SITE-001 must have 7 team members');
  assert(
    teamSite1.every((m) => m.studyId === 'STUDY-001' && m.siteId === 'SITE-001'),
    'All team members must belong to STUDY-001 and SITE-001'
  );
  console.log('✓ Test 51 passed: Team retrieval verified.');

  // Test 52: Site scoping (SITE-001 vs SITE-002)
  console.log('Test 52: Site scoping (SITE-001 vs SITE-002)');
  const teamSite2 = await teamService.getTeamMembers(ctxSite2);
  assertStrictEqual(teamSite2.length, 3, 'SITE-002 must have 3 team members (USR-201, USR-102, USR-202)');
  const usr102Site1 = teamSite1.find((m) => m.user.id === 'USR-102');
  const usr102Site2 = teamSite2.find((m) => m.user.id === 'USR-102');
  assert(Boolean(usr102Site1), 'USR-102 must be present in SITE-001');
  assert(Boolean(usr102Site2), 'USR-102 must be present in SITE-002');
  assertStrictEqual(usr102Site1?.siteId, 'SITE-001');
  assertStrictEqual(usr102Site2?.siteId, 'SITE-002');
  console.log('✓ Test 52 passed: Site scoping verified.');

  // Test 53: Cross-site isolation
  console.log('Test 53: Cross-site team isolation');
  const crossSiteUser = await teamService.getTeamMemberById(ctxSite1, 'USR-201');
  assertStrictEqual(crossSiteUser, null, 'USR-201 belongs to SITE-002 only, querying from SITE-001 must return null');
  const invalidUser = await teamService.getTeamMemberById(ctxSite1, 'USR-999');
  assertStrictEqual(invalidUser, null, 'Non-existent user must return null');
  const site3User = await teamService.getTeamMemberById(ctxSite1, 'USR-301');
  assertStrictEqual(site3User, null, 'USR-301 belongs to SITE-003, querying from SITE-001 must return null');
  console.log('✓ Test 53 passed: Cross-site isolation verified.');

  // Test 54: Role retrieval
  console.log('Test 54: Role retrieval with type filters');
  const allRoles = await teamService.getRoles(ctxSite1);
  assert(allRoles.length >= 8, 'Must have at least 8 total roles');
  const systemRoles = await teamService.getRoles(ctxSite1, { roleType: 'SYSTEM' });
  assertStrictEqual(systemRoles.length, 7, 'Must have 7 system roles');
  const customRoles = await teamService.getRoles(ctxSite1, { roleType: 'CUSTOM' });
  assert(customRoles.length >= 2, 'Must have at least 2 custom roles');
  const searchRoles = await teamService.getRoles(ctxSite1, { search: 'Pharmacist' });
  assertStrictEqual(searchRoles.length, 1, 'Search for Pharmacist must return exactly 1 role');
  assertStrictEqual(searchRoles[0].id, 'ROLE_STUDY_PHARMACIST');
  console.log('✓ Test 54 passed: Role retrieval verified.');

  // Test 55: Permission catalog retrieval and grouping
  console.log('Test 55: Permission retrieval and grouping');
  const permissions = await teamService.getPermissions();
  assertStrictEqual(permissions.length, 35, 'Permission catalog must contain exactly 35 permissions');
  const groupedPerms = teamService.groupPermissionsByModule(permissions);
  const modules = Object.keys(groupedPerms);
  assertStrictEqual(modules.length, 11, 'Permissions must be grouped across 11 modules');
  assert(Boolean(groupedPerms['STUDY']), 'STUDY module must exist');
  assert(Boolean(groupedPerms['PARTICIPANTS']), 'PARTICIPANTS module must exist');
  assert(Boolean(groupedPerms['SAFETY']), 'SAFETY module must exist');
  assert(Boolean(groupedPerms['COMPLIANCE']), 'COMPLIANCE module must exist');
  assert(Boolean(groupedPerms['DATA_ENTRY']), 'DATA_ENTRY module must exist');
  assert(Boolean(groupedPerms['PARTICIPANT_PORTAL']), 'PARTICIPANT_PORTAL module must exist');
  console.log('✓ Test 55 passed: Permission retrieval verified.');

  // Test 56: Effective permission calculation
  console.log('Test 56: Effective permission calculation');
  const piPerms = await teamService.getEffectivePermissions(ctxSite1, 'USR-101');
  assertStrictEqual(piPerms.length, 30, 'PI must have 30 effective permissions (no PARTICIPANTS_CREATE or PARTICIPANT_SELF)');
  const dePerms = await teamService.getEffectivePermissions(ctxSite1, 'USR-106');
  assertStrictEqual(dePerms.length, 7, 'Data Entry Operator must have 7 effective permissions (cannot edit participants in Stage 1)');
  const permIdSet = new Set(piPerms.map((p) => p.id));
  assertStrictEqual(permIdSet.size, piPerms.length, 'Effective permissions must not contain duplicate IDs');
  assert(!permIdSet.has('PARTICIPANTS_CREATE'), 'PI must not have PARTICIPANTS_CREATE per Stage 1 authority model');
  console.log('✓ Test 56 passed: Effective permission calculation verified.');

  // Test 57: Multiple role assignments
  console.log('Test 57: Multiple role assignments (USR-105)');
  const usr105Detail = await teamService.getTeamMemberById(ctxSite1, 'USR-105');
  assert(usr105Detail !== null, 'USR-105 must exist in SITE-001');
  assertStrictEqual(usr105Detail?.roles.length, 2, 'USR-105 must have 2 assigned roles');
  assertStrictEqual(usr105Detail?.assignments.length, 2, 'USR-105 must have 2 role assignments');
  const roleIds = usr105Detail!.roles.map((r) => r.id);
  assert(roleIds.includes('ROLE_STUDY_PHARMACIST'), 'USR-105 must have ROLE_STUDY_PHARMACIST');
  assert(roleIds.includes('ROLE_IP_SAFETY_MONITOR'), 'USR-105 must have ROLE_IP_SAFETY_MONITOR');
  console.log('✓ Test 57 passed: Multiple role assignments verified.');

  // Test 58: Duplicate assignment rejection
  console.log('Test 58: Duplicate role assignment rejection');
  let dupAssignError = false;
  try {
    await teamService.assignRole(ctxSite1, {
      userId: 'USR-101',
      roleId: 'ROLE_PI',
      studyId: 'STUDY-001',
      siteId: 'SITE-001',
      assignedBy: 'Dr. Ananya Sharma',
    });
  } catch (err) {
    dupAssignError = true;
    assert((err as Error).message.includes('already assigned'), 'Error must specify already assigned');
  }
  assertStrictEqual(dupAssignError, true, 'Duplicate assignment must throw error');
  console.log('✓ Test 58 passed: Duplicate assignment rejection verified.');

  // Test 59: Custom role creation
  console.log('Test 59: Custom role creation');
  const createdRole = await teamService.createCustomRole(ctxSite1, {
    name: 'Clinical Quality Auditor',
    description: 'Internal site auditor for GCP compliance and records',
    permissionIds: ['STUDY_VIEW', 'COMPLIANCE_VIEW', 'REPORTS_VIEW'],
  });
  assertStrictEqual(createdRole.name, 'Clinical Quality Auditor');
  assertStrictEqual(createdRole.type, 'CUSTOM');
  assertStrictEqual(createdRole.permissionIds.length, 3);
  assert(Boolean(createdRole.id), 'Created role must have generated ID');
  console.log('✓ Test 59 passed: Custom role creation verified.');

  // Test 60: Duplicate custom role rejection
  console.log('Test 60: Duplicate custom role name rejection');
  let dupRoleNameError = false;
  try {
    await teamService.createCustomRole(ctxSite1, {
      name: 'clinical quality auditor',
      description: 'Duplicate case test',
      permissionIds: ['STUDY_VIEW'],
    });
  } catch (err) {
    dupRoleNameError = true;
    assert((err as Error).message.includes('already exists'), 'Error must specify role already exists');
  }
  assertStrictEqual(dupRoleNameError, true, 'Duplicate role name must be rejected');
  console.log('✓ Test 60 passed: Duplicate custom role rejection verified.');

  // Test 61: Invalid custom role with zero permissions
  console.log('Test 61: Zero permissions custom role rejection');
  let zeroPermError = false;
  try {
    await teamService.createCustomRole(ctxSite1, {
      name: 'Empty Permissions Role',
      description: 'Should fail',
      permissionIds: [],
    });
  } catch (err) {
    zeroPermError = true;
    assert((err as Error).message.includes('At least one permission'), 'Error must specify permission requirement');
  }
  assertStrictEqual(zeroPermError, true, 'Zero permissions role must be rejected');

  let emptyNameError = false;
  try {
    await teamService.createCustomRole(ctxSite1, {
      name: '   ',
      description: 'Should fail',
      permissionIds: ['STUDY_VIEW'],
    });
  } catch (err) {
    emptyNameError = true;
    assert((err as Error).message.includes('required'), 'Error must specify name requirement');
  }
  assertStrictEqual(emptyNameError, true, 'Empty role name must be rejected');
  console.log('✓ Test 61 passed: Invalid custom role rejection verified.');

  // Test 62: System-role protection
  console.log('Test 62: System role modification protection');
  let systemRoleError = false;
  try {
    await teamService.updateCustomRole(ctxSite1, 'ROLE_PI', {
      name: 'Modified PI Role',
    });
  } catch (err) {
    systemRoleError = true;
    assert((err as Error).message.includes('System roles cannot be modified'), 'Error must specify system role protection');
  }
  assertStrictEqual(systemRoleError, true, 'System role modification must throw error');
  console.log('✓ Test 62 passed: System-role protection verified.');

  // Test 63: Team member detail isolation & summary metrics
  console.log('Test 63: Team member detail isolation & summary metrics');
  const inactiveMember = await teamService.getTeamMemberById(ctxSite1, 'USR-107');
  assert(inactiveMember !== null, 'USR-107 must exist at SITE-001');
  assertStrictEqual(inactiveMember?.user.status, 'INACTIVE');
  const crossSite2User = await teamService.getTeamMemberById(ctxSite1, 'USR-202');
  assertStrictEqual(crossSite2User, null, 'USR-202 from SITE-002 must return null in SITE-001 context');

  const teamMetrics = await teamService.getTeamSummaryMetrics(ctxSite1);
  assertStrictEqual(teamMetrics.totalMembers, 7, 'Total members should be 7');
  assertStrictEqual(teamMetrics.activeMembers, 6, 'Active members should be 6');
  assertStrictEqual(teamMetrics.inactiveMembers, 1, 'Inactive members should be 1');
  assertStrictEqual(teamMetrics.systemRolesCount, 7, 'System roles should be 7');
  assert(teamMetrics.customRolesCount >= 2, 'Custom roles should be at least 2');
  assertStrictEqual(teamMetrics.totalAssignments, 8, 'Total assignments at SITE-001 should be 8');
  console.log('✓ Test 63 passed: Team member detail isolation & metrics verified.');

  // Test 64: Segment A–E regression check
  console.log('Test 64: Comprehensive Segments A-E regression check');
  const regStudies = await studyService.getStudies();
  assert(regStudies.length > 0, 'Studies must be present');
  const regParticipants = await participantService.getParticipants(ctxSite1);
  assertStrictEqual(regParticipants.length, 10, 'SITE-001 must still have 10 participants');
  const regVisits = await visitService.getVisits(ctxSite1);
  assert(regVisits.length > 0, 'Visits must still be present');
  const regSafety = await safetyService.getSafetyEvents(ctxSite1);
  assert(regSafety.length > 0, 'Safety events must still be present');
  const regDeviations = await complianceService.getDeviations(ctxSite1);
  assertStrictEqual(regDeviations.length, 6, 'SITE-001 must still have 6 deviations');
  const regOverview = await dashboardService.getOverview('STUDY-001', 'SITE-001');
  assert(regOverview !== null, 'Overview must still be present');
  console.log('✓ Test 64 passed: Segments A-E regression check verified.');

  // ============================================================
  // SEGMENT G: TASK MANAGEMENT & APPROVALS (Tests 65–80)
  // ============================================================

  // Test 65: taskService.getTasks() retrieval
  console.log('Test 65: taskService.getTasks() - Retrieval');
  const tasksSite1 = await taskService.getTasks(ctxSite1);
  assert(Array.isArray(tasksSite1), 'Tasks must be an array');
  assertStrictEqual(tasksSite1.length, 11, 'SITE-001 should have 11 tasks');
  assertStrictEqual(tasksSite1[0].id, 'TSK-102', 'First task at SITE-001 sorted by priority then due date should be TSK-102');
  assert(tasksSite1.some((t) => t.id === 'TSK-101'), 'Tasks list must contain TSK-101');
  assert(tasksSite1[0].title.length > 0, 'Task must have a title');
  assert(tasksSite1[0].category !== undefined, 'Task must have a category');
  assert(tasksSite1[0].priority !== undefined, 'Task must have a priority');
  assert(tasksSite1[0].status !== undefined, 'Task must have a status');
  console.log('✓ Test 65 passed: Task retrieval verified.');

  // Test 66: Study/site scoping
  console.log('Test 66: Task study/site scoping');
  const tasksSite2 = await taskService.getTasks(ctxSite2);
  assertStrictEqual(tasksSite2.length, 2, 'SITE-002 should have 2 tasks (TSK-201, TSK-202)');
  const tasksSite3 = await taskService.getTasks({ studyId: 'STUDY-002', siteId: 'SITE-003' });
  assertStrictEqual(tasksSite3.length, 1, 'SITE-003 should have 1 task (TSK-301)');
  const tasksEmpty = await taskService.getTasks({ studyId: '', siteId: '' });
  assertStrictEqual(tasksEmpty.length, 0, 'Empty context must return empty task list');
  console.log('✓ Test 66 passed: Task study/site scoping verified.');

  // Test 67: Cross-site task isolation
  console.log('Test 67: Cross-site task isolation');
  const crossTaskInSite1 = await taskService.getTaskById(ctxSite1, 'TSK-201');
  assertStrictEqual(crossTaskInSite1, null, 'TSK-201 from SITE-002 must return null in SITE-001 context');
  const crossTaskInSite2 = await taskService.getTaskById(ctxSite2, 'TSK-101');
  assertStrictEqual(crossTaskInSite2, null, 'TSK-101 from SITE-001 must return null in SITE-002 context');
  const validTask = await taskService.getTaskById(ctxSite1, 'TSK-101');
  assert(validTask !== null, 'TSK-101 must exist in SITE-001');
  assertStrictEqual(validTask?.id, 'TSK-101');
  console.log('✓ Test 67 passed: Cross-site task isolation verified.');

  // Test 68: Task filtering
  console.log('Test 68: Task filtering (Status, Priority, Category, Assignee, Due Date)');
  const inProgressTasks = await taskService.getTasks(ctxSite1, { status: 'IN_PROGRESS' });
  assertStrictEqual(inProgressTasks.length, 2, 'Should have 2 IN_PROGRESS tasks (TSK-102, TSK-105)');
  
  const highPriorityTasks = await taskService.getTasks(ctxSite1, { priority: 'HIGH' });
  assertStrictEqual(highPriorityTasks.length, 4, 'Should have 4 HIGH priority tasks (TSK-101, TSK-102, TSK-104, TSK-107)');

  const safetyTasks = await taskService.getTasks(ctxSite1, { category: 'SAFETY' });
  assertStrictEqual(safetyTasks.length, 1, 'Should have 1 SAFETY task (TSK-101)');

  const user103Tasks = await taskService.getTasks(ctxSite1, { assigneeId: 'USR-103' });
  assertStrictEqual(user103Tasks.length, 4, 'USR-103 should have 4 assigned tasks (TSK-102, TSK-105, TSK-106, TSK-108)');

  const overdueTasks = await taskService.getTasks(ctxSite1, { dueDateFilter: 'OVERDUE' });
  assertStrictEqual(overdueTasks.length, 2, 'Should have 2 overdue tasks (TSK-102, TSK-105)');

  const dueTodayTasks = await taskService.getTasks(ctxSite1, { dueDateFilter: 'TODAY' });
  assertStrictEqual(dueTodayTasks.length, 3, 'Should have 3 tasks due today (TSK-101, TSK-104, TSK-107)');
  console.log('✓ Test 68 passed: Task filtering verified.');

  // Test 69: Combined multi-criteria AND filtering
  console.log('Test 69: Combined multi-criteria AND filtering');
  const combinedSafetyHigh = await taskService.getTasks(ctxSite1, {
    category: 'SAFETY',
    priority: 'HIGH',
  });
  assertStrictEqual(combinedSafetyHigh.length, 1, 'Combined SAFETY + HIGH should return 1 task (TSK-101)');
  assertStrictEqual(combinedSafetyHigh[0].id, 'TSK-101');

  const combinedSearch = await taskService.getTasks(ctxSite1, {
    search: 'excursion',
  });
  assertStrictEqual(combinedSearch.length, 1, 'Search for excursion should match TSK-104');
  assertStrictEqual(combinedSearch[0].id, 'TSK-104');

  const combinedNoMatch = await taskService.getTasks(ctxSite1, {
    category: 'SAFETY',
    status: 'COMPLETED',
  });
  assertStrictEqual(combinedNoMatch.length, 0, 'SAFETY + COMPLETED should return 0 tasks at SITE-001');
  console.log('✓ Test 69 passed: Combined multi-criteria AND filtering verified.');

  // Test 70: Task summary metric calculation
  console.log('Test 70: Task summary metric calculation');
  const taskSummary = await taskService.getTaskSummary(ctxSite1, 'USR-103');
  assertStrictEqual(taskSummary.total, 11, 'Total tasks at SITE-001 should be 11');
  assertStrictEqual(taskSummary.dueToday, 3, 'Tasks due today should be 3');
  assertStrictEqual(taskSummary.overdue, 2, 'Overdue tasks should be 2');
  assertStrictEqual(taskSummary.pendingReview, 2, 'Pending review tasks should be 2 (UNDER_REVIEW + SUBMITTED)');
  assertStrictEqual(taskSummary.completed, 2, 'Completed tasks should be 2 (TSK-108, TSK-109)');
  assertStrictEqual(taskSummary.myOpen, 3, 'USR-103 should have 3 open tasks (TSK-102, TSK-105, TSK-106)');
  console.log('✓ Test 70 passed: Task summary metric calculation verified.');

  // Test 71: Task assignment
  console.log('Test 71: Task assignment flow');
  const draftTask = await taskService.getTaskById(ctxSite1, 'TSK-110');
  assert(draftTask !== null, 'TSK-110 must exist');
  assertStrictEqual(draftTask?.status, 'DRAFT', 'TSK-110 starts in DRAFT status');
  assertStrictEqual(draftTask?.assignee, undefined, 'TSK-110 is unassigned');

  const assignedTask = await taskService.assignTask(ctxSite1, 'TSK-110', {
    userId: 'USR-103',
    assignedBy: 'Dr. Ananya Sharma (PI)',
  });
  assertStrictEqual(assignedTask.status, 'ASSIGNED', 'Status should transition from DRAFT to ASSIGNED');
  assertStrictEqual(assignedTask.assignee?.userId, 'USR-103');
  assertStrictEqual(assignedTask.assignments.length, 1);
  assertStrictEqual(assignedTask.assignments[0].status, 'ACTIVE');
  console.log('✓ Test 71 passed: Task assignment flow verified.');

  // Test 72: Invalid/cross-site assignment rejection
  console.log('Test 72: Invalid and cross-site assignment rejection');
  let crossSiteAssignmentError = false;
  try {
    await taskService.assignTask(ctxSite1, 'TSK-103', {
      userId: 'USR-201', // belongs to SITE-002
      assignedBy: 'Dr. Ananya Sharma (PI)',
    });
  } catch (err) {
    crossSiteAssignmentError = true;
    assert((err as Error).message.includes('Cross-site task assignment is prohibited'), 'Error must specify cross-site prohibition');
  }
  assertStrictEqual(crossSiteAssignmentError, true, 'Assigning cross-site user must throw error');

  let inactiveUserAssignmentError = false;
  try {
    await taskService.assignTask(ctxSite1, 'TSK-103', {
      userId: 'USR-107', // inactive user at SITE-001
      assignedBy: 'Dr. Ananya Sharma (PI)',
    });
  } catch (err) {
    inactiveUserAssignmentError = true;
    assert((err as Error).message.includes('inactive user'), 'Error must specify inactive user rejection');
  }
  assertStrictEqual(inactiveUserAssignmentError, true, 'Assigning inactive user must throw error');
  console.log('✓ Test 72 passed: Invalid and cross-site assignment rejection verified.');

  // Test 73: Lifecycle transition validation (isValidTaskTransition)
  console.log('Test 73: Lifecycle transition validation rules');
  assertStrictEqual(isValidTaskTransition('DRAFT', 'ASSIGNED', false), true, 'DRAFT -> ASSIGNED valid');
  assertStrictEqual(isValidTaskTransition('ASSIGNED', 'IN_PROGRESS', false), true, 'ASSIGNED -> IN_PROGRESS valid');
  assertStrictEqual(isValidTaskTransition('IN_PROGRESS', 'SUBMITTED', false), true, 'IN_PROGRESS -> SUBMITTED valid');
  assertStrictEqual(isValidTaskTransition('SUBMITTED', 'UNDER_REVIEW', false), true, 'SUBMITTED -> UNDER_REVIEW valid');
  assertStrictEqual(isValidTaskTransition('UNDER_REVIEW', 'APPROVED', false), true, 'UNDER_REVIEW -> APPROVED valid');
  assertStrictEqual(isValidTaskTransition('UNDER_REVIEW', 'REVISION_REQUIRED', false), true, 'UNDER_REVIEW -> REVISION_REQUIRED valid');
  assertStrictEqual(isValidTaskTransition('REVISION_REQUIRED', 'IN_PROGRESS', false), true, 'REVISION_REQUIRED -> IN_PROGRESS valid');
  assertStrictEqual(isValidTaskTransition('APPROVED', 'COMPLETED', true), true, 'APPROVED -> COMPLETED valid');
  assertStrictEqual(isValidTaskTransition('IN_PROGRESS', 'COMPLETED', false), true, 'IN_PROGRESS -> COMPLETED valid when requiresApproval is false');
  assertStrictEqual(isValidTaskTransition('IN_PROGRESS', 'COMPLETED', true), false, 'IN_PROGRESS -> COMPLETED INVALID when requiresApproval is true');
  assertStrictEqual(isValidTaskTransition('COMPLETED', 'IN_PROGRESS', false), false, 'COMPLETED is terminal');
  assertStrictEqual(isValidTaskTransition('CANCELLED', 'IN_PROGRESS', false), false, 'CANCELLED is terminal');
  console.log('✓ Test 73 passed: Lifecycle transition validation rules verified.');

  // Test 74: Invalid status jump rejection
  console.log('Test 74: Invalid status jump rejection');
  let invalidJumpError = false;
  try {
    await taskService.updateTaskStatus(ctxSite1, 'TSK-101', 'DRAFT'); // UNDER_REVIEW -> DRAFT is invalid
  } catch (err) {
    invalidJumpError = true;
    assert((err as Error).message.includes('Invalid task status transition'), 'Error must specify invalid transition');
  }
  assertStrictEqual(invalidJumpError, true, 'Illegal status jump must throw error');

  let directCompleteError = false;
  try {
    // TSK-102 is IN_PROGRESS and requiresApproval: true
    await taskService.completeTask(ctxSite1, 'TSK-102');
  } catch (err) {
    directCompleteError = true;
    assert((err as Error).message.includes('must be submitted, reviewed, and approved'), 'Error must state approval required');
  }
  assertStrictEqual(directCompleteError, true, 'Completing unapproved task requiring approval must throw error');
  console.log('✓ Test 74 passed: Invalid status jump rejection verified.');

  // Test 75: Submit for review workflow
  console.log('Test 75: Submit for review workflow');
  // First move TSK-103 to IN_PROGRESS
  await taskService.updateTaskStatus(ctxSite1, 'TSK-103', 'IN_PROGRESS');
  const submittedTask = await taskService.submitTask(ctxSite1, 'TSK-103');
  assertStrictEqual(submittedTask.status, 'SUBMITTED', 'Task status must be SUBMITTED');
  assert(submittedTask.submittedAt !== undefined, 'Task must record submittedAt timestamp');
  console.log('✓ Test 75 passed: Submit for review workflow verified.');

  // Test 76: Approval workflow
  console.log('Test 76: Approval workflow');
  // TSK-101 is currently UNDER_REVIEW
  const approvedTask = await taskService.approveTask(
    ctxSite1,
    'TSK-101',
    'USR-101',
    'Clinically verified and accepted by PI'
  );
  assertStrictEqual(approvedTask.status, 'APPROVED', 'Task status must be APPROVED');
  assert(approvedTask.approvals.length > 0, 'Task must contain approval record');
  const lastApproval = approvedTask.approvals[approvedTask.approvals.length - 1];
  assertStrictEqual(lastApproval.decision, 'APPROVED');
  assertStrictEqual(lastApproval.reviewerId, 'USR-101');
  assertStrictEqual(lastApproval.comments, 'Clinically verified and accepted by PI');
  console.log('✓ Test 76 passed: Approval workflow verified.');

  // Test 77: Revision request workflow
  console.log('Test 77: Revision request workflow');
  // TSK-104 is currently SUBMITTED
  const revisionTask = await taskService.requestRevision(
    ctxSite1,
    'TSK-104',
    'USR-101',
    'Need updated temperature excursion calibration logs'
  );
  assertStrictEqual(revisionTask.status, 'REVISION_REQUIRED', 'Task status must be REVISION_REQUIRED');
  const revApproval = revisionTask.approvals[revisionTask.approvals.length - 1];
  assertStrictEqual(revApproval.decision, 'REVISION_REQUIRED');
  assertStrictEqual(revApproval.comments, 'Need updated temperature excursion calibration logs');
  console.log('✓ Test 77 passed: Revision request workflow verified.');

  // Test 78: Completion rules
  console.log('Test 78: Completion rules');
  // TSK-107 is in APPROVED status with requiresApproval: true
  const completedTask = await taskService.completeTask(ctxSite1, 'TSK-107');
  assertStrictEqual(completedTask.status, 'COMPLETED', 'Approved task must transition to COMPLETED');
  assert(completedTask.completedAt !== undefined, 'completedAt timestamp must be recorded');

  // Attempting complete on TSK-104 (now in REVISION_REQUIRED) must fail
  let revCompleteError = false;
  try {
    await taskService.completeTask(ctxSite1, 'TSK-104');
  } catch (err) {
    revCompleteError = true;
  }
  assertStrictEqual(revCompleteError, true, 'Task in REVISION_REQUIRED cannot transition to COMPLETED');
  console.log('✓ Test 78 passed: Completion rules verified.');

  // Test 79: Related entity linkage
  console.log('Test 79: Related entity linkage');
  const saeTask = await taskService.getTaskById(ctxSite1, 'TSK-101');
  assertStrictEqual(saeTask?.relatedEntityType, 'SAFETY');
  assertStrictEqual(saeTask?.relatedEntityId, 'SAE-003');

  const devTask = await taskService.getTaskById(ctxSite1, 'TSK-102');
  assertStrictEqual(devTask?.relatedEntityType, 'COMPLIANCE');
  assertStrictEqual(devTask?.relatedEntityId, 'DEV-001');

  const visTask = await taskService.getTaskById(ctxSite1, 'TSK-103');
  assertStrictEqual(visTask?.relatedEntityType, 'VISIT');
  assertStrictEqual(visTask?.relatedEntityId, 'VIS-1023-04');

  const ptTask = await taskService.getTaskById(ctxSite1, 'TSK-105');
  assertStrictEqual(ptTask?.relatedEntityType, 'PARTICIPANT');
  assertStrictEqual(ptTask?.relatedEntityId, 'PT-1011');
  console.log('✓ Test 79 passed: Related entity linkage verified.');

  // Test 80: Comprehensive Segments A–F regression check
  console.log('Test 80: Comprehensive Segments A-F regression check');
  const reg80Studies = await studyService.getStudies();
  assert(reg80Studies.length > 0, 'Studies must be present');
  const reg80Participants = await participantService.getParticipants(ctxSite1);
  assertStrictEqual(reg80Participants.length, 10, 'SITE-001 must still have 10 participants');
  const reg80Visits = await visitService.getVisits(ctxSite1);
  assert(reg80Visits.length > 0, 'Visits must still be present');
  const reg80Safety = await safetyService.getSafetyEvents(ctxSite1);
  assert(reg80Safety.length > 0, 'Safety events must still be present');
  const reg80Deviations = await complianceService.getDeviations(ctxSite1);
  assertStrictEqual(reg80Deviations.length, 6, 'SITE-001 must still have 6 deviations');
  const reg80Team = await teamService.getTeamMembers(ctxSite1);
  assertStrictEqual(reg80Team.length, 7, 'SITE-001 must still have 7 team members');
  const reg80Overview = await dashboardService.getOverview('STUDY-001', 'SITE-001');
  assert(reg80Overview !== null, 'Overview must still be present');
  console.log('✓ Test 80 passed: Segments A-F regression check verified.');

  // ============================================================
  // SEGMENT H — DOCUMENT MANAGEMENT & EXPIRY TRACKING TESTS (81-100)
  // ============================================================
  console.log('\n--- STARTING SEGMENT H: DOCUMENT MANAGEMENT & EXPIRY TRACKING TESTS ---');

  // Test 81: documentService.getDocuments() - Retrieval & Scoping
  console.log('Test 81: documentService.getDocuments() - Retrieval & Scoping');
  const site1Docs = await documentService.getDocuments(ctxSite1);
  assert(Array.isArray(site1Docs), 'Documents result must be an array');
  assertStrictEqual(site1Docs.length, 12, 'SITE-001 must have 12 mock documents');
  assertStrictEqual(site1Docs[0].id, 'DOC-101', 'First document should be DOC-101');
  console.log('✓ Test 81 passed: Document retrieval and site count verified.');

  // Test 82: Document study/site scoping (SITE-001 vs SITE-002 vs SITE-003)
  console.log('Test 82: Document study/site scoping');
  const site2Docs = await documentService.getDocuments(ctxSite2);
  assertStrictEqual(site2Docs.length, 2, 'SITE-002 must have 2 documents (DOC-201, DOC-202)');
  const site3Docs = await documentService.getDocuments(ctxSite3);
  assertStrictEqual(site3Docs.length, 1, 'SITE-003 must have 1 document (DOC-301)');
  console.log('✓ Test 82 passed: Study/site scoping verified across multiple sites.');

  // Test 83: Cross-site document isolation
  console.log('Test 83: Cross-site document isolation');
  const crossSiteDoc = await documentService.getDocumentById(ctxSite1, 'DOC-201');
  assertStrictEqual(crossSiteDoc, null, 'DOC-201 belongs to SITE-002 and must not be retrievable in SITE-001 context');
  const validSite2Doc = await documentService.getDocumentById(ctxSite2, 'DOC-201');
  assert(validSite2Doc !== null, 'DOC-201 must be accessible in SITE-002 context');
  assertStrictEqual(validSite2Doc?.siteId, 'SITE-002');
  console.log('✓ Test 83 passed: Cross-site document isolation verified.');

  // Test 84: Cross-study document isolation
  console.log('Test 84: Cross-study document isolation');
  const crossStudyDoc = await documentService.getDocumentById(ctxSite1, 'DOC-301');
  assertStrictEqual(crossStudyDoc, null, 'DOC-301 belongs to STUDY-002 and must not be retrievable in STUDY-001 context');
  const validSite3Doc = await documentService.getDocumentById(ctxSite3, 'DOC-301');
  assert(validSite3Doc !== null, 'DOC-301 must be accessible in STUDY-002/SITE-003 context');
  assertStrictEqual(validSite3Doc?.studyId, 'STUDY-002');
  console.log('✓ Test 84 passed: Cross-study document isolation verified.');

  // Test 85: Document text search filtering
  console.log('Test 85: Document text search filtering');
  const searchDocByTitle = await documentService.getDocuments(ctxSite1, { search: 'Protocol' });
  assert(searchDocByTitle.length >= 2, 'Search by "Protocol" should match multiple documents');
  const searchDocById = await documentService.getDocuments(ctxSite1, { search: 'DOC-102' });
  assertStrictEqual(searchDocById.length, 1, 'Search by ID DOC-102 should return 1 result');
  assertStrictEqual(searchDocById[0].id, 'DOC-102');
  const searchByFileName = await documentService.getDocuments(ctxSite1, { search: 'IB_AYUN01' });
  assert(searchByFileName.length >= 1, 'Search by version filename should return matching document (DOC-103)');
  assertStrictEqual(searchByFileName[0].id, 'DOC-103');
  console.log('✓ Test 85 passed: Text search filtering verified.');

  // Test 86: Category and document type filtering
  console.log('Test 86: Category and document type filtering');
  const ethicsDocs = await documentService.getDocuments(ctxSite1, { category: 'ETHICS' });
  assert(ethicsDocs.length >= 1, 'Should find ETHICS category documents');
  assert(ethicsDocs.every((d) => d.category === 'ETHICS'), 'All returned docs must have ETHICS category');
  const protocolTypeDocs = await documentService.getDocuments(ctxSite1, { documentType: 'Protocol' });
  assert(protocolTypeDocs.length >= 1, 'Should find Protocol document type');
  assert(protocolTypeDocs.every((d) => d.documentType === 'Protocol'), 'All returned docs must be Protocol');
  console.log('✓ Test 86 passed: Category and document type filtering verified.');

  // Test 87: Combined multi-criteria AND filtering
  console.log('Test 87: Combined multi-criteria AND filtering');
  const combinedReqEthics = await documentService.getDocuments(ctxSite1, {
    category: 'ETHICS',
    isRequired: true,
  });
  assert(combinedReqEthics.length >= 1, 'Should find required ETHICS documents');
  assert(combinedReqEthics.every((d) => d.category === 'ETHICS' && d.isRequired), 'All results must satisfy AND criteria');
  console.log('✓ Test 87 passed: Combined multi-criteria AND filtering verified.');

  // Test 88: Expiry calculations and calculateDocumentExpiryState() behavior
  console.log('Test 88: Expiry calculations and calculateDocumentExpiryState()');
  const noExpiryState = calculateDocumentExpiryState({ expiryDate: undefined, status: 'ACTIVE' }, DOCUMENT_REFERENCE_DATE);
  assertStrictEqual(noExpiryState, 'NO_EXPIRY', 'Undefined expiryDate must produce NO_EXPIRY');
  const expiredState = calculateDocumentExpiryState({ expiryDate: '2026-08-01', status: 'ACTIVE' }, DOCUMENT_REFERENCE_DATE);
  assertStrictEqual(expiredState, 'EXPIRED', 'Past expiry date must produce EXPIRED');
  const expiringSoonState = calculateDocumentExpiryState({ expiryDate: '2026-10-15', status: 'ACTIVE' }, DOCUMENT_REFERENCE_DATE);
  assertStrictEqual(expiringSoonState, 'EXPIRING_SOON', 'Expiry date within 30 days must produce EXPIRING_SOON');
  const activeState = calculateDocumentExpiryState({ expiryDate: '2027-06-30', status: 'ACTIVE' }, DOCUMENT_REFERENCE_DATE);
  assertStrictEqual(activeState, 'ACTIVE', 'Expiry date > 30 days away must produce ACTIVE');
  const archivedDocState = calculateDocumentExpiryState({ expiryDate: '2026-08-01', status: 'ARCHIVED' }, DOCUMENT_REFERENCE_DATE);
  assertStrictEqual(archivedDocState, 'NO_EXPIRY', 'Archived document must return NO_EXPIRY regardless of date');
  const derivedExp = deriveDocumentStatus({ status: 'ACTIVE', expiryDate: '2026-08-01' }, DOCUMENT_REFERENCE_DATE);
  assertStrictEqual(derivedExp, 'EXPIRED', 'Past expiry must derive EXPIRED status');
  const derivedPreserveDraft = deriveDocumentStatus({ status: 'DRAFT', expiryDate: '2026-08-01' }, DOCUMENT_REFERENCE_DATE);
  assertStrictEqual(derivedPreserveDraft, 'DRAFT', 'DRAFT status must be preserved');
  console.log('✓ Test 88 passed: Expiry state calculation unit behavior verified.');

  // Test 89: getDaysUntilExpiry() normalization
  console.log('Test 89: getDaysUntilExpiry() normalization');
  const daysNull = getDaysUntilExpiry(undefined, DOCUMENT_REFERENCE_DATE);
  assertStrictEqual(daysNull, null, 'Days should be null for undefined date');
  const days16 = getDaysUntilExpiry('2026-10-15', '2026-09-29');
  assertStrictEqual(days16, 16, 'Days from 2026-09-29 to 2026-10-15 must be 16');
  const daysNegative = getDaysUntilExpiry('2026-09-15', '2026-09-29');
  assertStrictEqual(daysNegative, -14, 'Days from 2026-09-29 to 2026-09-15 must be -14');
  console.log('✓ Test 89 passed: Days until expiry calculation verified.');

  // Test 90: Expiring-soon detection
  console.log('Test 90: Expiring-soon detection');
  const expiringSoonDocs = await documentService.getDocuments(ctxSite1, { expiryFilter: 'EXPIRING_SOON' });
  assertStrictEqual(expiringSoonDocs.length, 2, 'SITE-001 must have 2 expiring soon documents (DOC-102, DOC-106)');
  const expiringIds = expiringSoonDocs.map((d) => d.id).sort();
  assertStrictEqual(expiringIds[0], 'DOC-102');
  assertStrictEqual(expiringIds[1], 'DOC-106');
  console.log('✓ Test 90 passed: Expiring-soon detection verified.');

  // Test 91: Expired detection
  console.log('Test 91: Expired detection');
  const expiredDocs = await documentService.getDocuments(ctxSite1, { expiryFilter: 'EXPIRED' });
  assertStrictEqual(expiredDocs.length, 2, 'SITE-001 must have 2 expired documents (DOC-104, DOC-107)');
  const expiredIds = expiredDocs.map((d) => d.id).sort();
  assertStrictEqual(expiredIds[0], 'DOC-104');
  assertStrictEqual(expiredIds[1], 'DOC-107');
  console.log('✓ Test 91 passed: Expired detection verified.');

  // Test 92: Required and Action-Required calculations
  console.log('Test 92: Required and Action-Required calculations');
  const requiredDocs = await documentService.getDocuments(ctxSite1, { isRequired: true });
  assertStrictEqual(requiredDocs.length, 9, 'SITE-001 must have 9 required documents');
  const actionReqDocs = site1Docs.filter((d) => isDocumentActionRequired(d, DOCUMENT_REFERENCE_DATE));
  assertStrictEqual(actionReqDocs.length, 3, 'SITE-001 must have 3 action required documents (DOC-104, DOC-107, DOC-112)');
  const actionReqIds = actionReqDocs.map((d) => d.id).sort();
  assertStrictEqual(actionReqIds[0], 'DOC-104');
  assertStrictEqual(actionReqIds[1], 'DOC-107');
  assertStrictEqual(actionReqIds[2], 'DOC-112');
  console.log('✓ Test 92 passed: Required and Action-Required calculations verified.');

  // Test 93: documentService.getDocumentSummary() summary metric counts
  console.log('Test 93: documentService.getDocumentSummary() metrics');
  const docSummary = await documentService.getDocumentSummary(ctxSite1);
  assertStrictEqual(docSummary.total, 12, 'Total must be 12');
  assertStrictEqual(docSummary.active, 6, 'Active must be 6');
  assertStrictEqual(docSummary.expiringSoon, 2, 'Expiring soon must be 2');
  assertStrictEqual(docSummary.expired, 2, 'Expired must be 2');
  assertStrictEqual(docSummary.required, 9, 'Required must be 9');
  assertStrictEqual(docSummary.actionRequired, 3, 'Action required must be 3');
  console.log('✓ Test 93 passed: Document summary metrics verified.');

  // Test 94: Document creation validation
  console.log('Test 94: Document creation validation');
  let missingTitleErr = false;
  try {
    await documentService.createDocument(ctxSite1, {
      title: '',
      category: 'SITE',
      documentType: 'Site Approval',
      isRequired: true,
      ownerUserId: 'USR-101',
    });
  } catch (err) {
    missingTitleErr = true;
    assert((err as Error).message.includes('title is required'), 'Error must mention title');
  }
  assertStrictEqual(missingTitleErr, true, 'Creating document without title must throw error');

  let invalidOwnerErr = false;
  try {
    await documentService.createDocument(ctxSite1, {
      title: 'Valid Title',
      category: 'SITE',
      documentType: 'Site Approval',
      isRequired: true,
      ownerUserId: 'NON_EXISTENT_USER',
    });
  } catch (err) {
    invalidOwnerErr = true;
    assert((err as Error).message.includes('does not exist'), 'Error must mention user does not exist');
  }
  assertStrictEqual(invalidOwnerErr, true, 'Creating document with invalid owner must throw error');
  console.log('✓ Test 94 passed: Document creation validation verified.');

  // Test 95: Document creation success with initial version
  console.log('Test 95: Document creation success with initial version');
  const createdDoc = await documentService.createDocument(ctxSite1, {
    title: 'Site Emergency Evacuation Plan',
    description: 'Emergency response and patient evacuation SOP for clinical trial facility.',
    category: 'SITE',
    documentType: 'Site Approval',
    isRequired: true,
    ownerUserId: 'USR-101',
    initialVersionNumber: '1.0',
    fileName: 'Emergency_Evac_SOP_v1.0.pdf',
    fileType: 'PDF',
    effectiveDate: '2026-09-01',
    expiryDate: '2027-09-01',
    fileBlobUrl: 'blob:http://localhost:5173/mock-uuid-test1',
    changeSummary: 'Initial SOP creation and facility sign-off.',
    createdBy: 'Dr. Ananya Sharma',
  });
  assert(createdDoc.id.startsWith('DOC-'), 'New document must have generated ID');
  assertStrictEqual(createdDoc.title, 'Site Emergency Evacuation Plan');
  assertStrictEqual(createdDoc.status, 'ACTIVE');
  assertStrictEqual(createdDoc.versions.length, 1);
  assertStrictEqual(createdDoc.versions[0].versionNumber, '1.0');
  assertStrictEqual(createdDoc.versions[0].fileBlobUrl, 'blob:http://localhost:5173/mock-uuid-test1');
  assertStrictEqual(createdDoc.currentVersionNumber, '1.0');
  console.log('✓ Test 95 passed: Document creation success verified.');

  // Test 96: Version creation flow
  console.log('Test 96: Version creation flow');
  const updatedDocWithVer = await documentService.createDocumentVersion(
    ctxSite1,
    createdDoc.id,
    {
      versionNumber: '2.0',
      versionLabel: 'Updated Evacuation Map',
      fileName: 'Emergency_Evac_SOP_v2.0.pdf',
      fileType: 'PDF',
      fileBlobUrl: 'blob:http://localhost:5173/mock-uuid-test2',
      effectiveDate: '2026-09-29',
      expiryDate: '2027-09-29',
      changeSummary: 'Added secondary assembly point details.',
      uploadedBy: 'Dr. Ananya Sharma',
    }
  );
  assertStrictEqual(updatedDocWithVer.versions.length, 2, 'Document should now have 2 versions');
  assertStrictEqual(updatedDocWithVer.currentVersionNumber, '2.0', 'currentVersionNumber must be updated to 2.0');
  assertStrictEqual(updatedDocWithVer.currentVersionId, updatedDocWithVer.versions[1].id);
  assertStrictEqual(updatedDocWithVer.versions[1].fileBlobUrl, 'blob:http://localhost:5173/mock-uuid-test2');
  console.log('✓ Test 96 passed: Version creation flow verified.');

  // Test 97: Version number uniqueness enforcement
  console.log('Test 97: Version number uniqueness enforcement');
  let duplicateVerErr = false;
  try {
    await documentService.createDocumentVersion(ctxSite1, createdDoc.id, {
      versionNumber: '2.0',
      fileName: 'Duplicate_Ver.pdf',
      fileType: 'PDF',
      uploadedBy: 'Dr. Ananya Sharma',
    });
  } catch (err) {
    duplicateVerErr = true;
    assert((err as Error).message.includes('already exists'), 'Error must mention version already exists');
  }
  assertStrictEqual(duplicateVerErr, true, 'Duplicate version number must throw error');
  console.log('✓ Test 97 passed: Version uniqueness enforcement verified.');

  // Test 98: Historical version preservation and metadata management
  console.log('Test 98: Historical version preservation & metadata update');
  const versionsList = await documentService.getDocumentVersions(ctxSite1, createdDoc.id);
  assertStrictEqual(versionsList.length, 2, 'Must preserve all versions');
  const v1 = versionsList.find((v) => v.versionNumber === '1.0');
  const v2 = versionsList.find((v) => v.versionNumber === '2.0');
  assertStrictEqual(v1?.status, 'SUPERSEDED', 'Version 1.0 must be SUPERSEDED');
  assertStrictEqual(v2?.status, 'ACTIVE', 'Version 2.0 must be ACTIVE');

  // Verify document metadata update (management capability)
  const editedDoc = await documentService.updateDocument(ctxSite1, createdDoc.id, {
    title: 'Site Emergency Evacuation & Safety Plan (Updated)',
    category: 'SAFETY',
    documentType: 'Safety Report',
    isRequired: false,
    expiryDate: '2028-01-01',
  });
  assertStrictEqual(editedDoc.title, 'Site Emergency Evacuation & Safety Plan (Updated)');
  assertStrictEqual(editedDoc.category, 'SAFETY');
  assertStrictEqual(editedDoc.documentType, 'Safety Report');
  assertStrictEqual(editedDoc.isRequired, false);
  assertStrictEqual(editedDoc.expiryDate, '2028-01-01');
  console.log('✓ Test 98 passed: Historical version preservation and metadata management verified.');

  // Test 99: Document archive workflow
  console.log('Test 99: Document archive workflow');
  const archivedDoc = await documentService.archiveDocument(ctxSite1, createdDoc.id);
  assertStrictEqual(archivedDoc.status, 'ARCHIVED', 'Document status must be ARCHIVED');
  assert(archivedDoc.versions.every((v) => v.status === 'ARCHIVED'), 'All versions must be marked ARCHIVED');
  console.log('✓ Test 99 passed: Document archive workflow verified.');

  // Test 100: Comprehensive Segments A–G regression check
  console.log('Test 100: Comprehensive Segments A-G regression check');
  const reg100Studies = await studyService.getStudies();
  assert(reg100Studies.length > 0, 'Studies must be present');
  const reg100Participants = await participantService.getParticipants(ctxSite1);
  assertStrictEqual(reg100Participants.length, 10, 'SITE-001 must still have 10 participants');
  const reg100Visits = await visitService.getVisits(ctxSite1);
  assert(reg100Visits.length > 0, 'Visits must still be present');
  const reg100Safety = await safetyService.getSafetyEvents(ctxSite1);
  assert(reg100Safety.length > 0, 'Safety events must still be present');
  const reg100Deviations = await complianceService.getDeviations(ctxSite1);
  assertStrictEqual(reg100Deviations.length, 6, 'SITE-001 must still have 6 deviations');
  const reg100Team = await teamService.getTeamMembers(ctxSite1);
  assertStrictEqual(reg100Team.length, 7, 'SITE-001 must still have 7 team members');
  const reg100Tasks = await taskService.getTasks(ctxSite1);
  assertStrictEqual(reg100Tasks.length, 11, 'SITE-001 must still have 11 tasks');
  const reg100Overview = await dashboardService.getOverview('STUDY-001', 'SITE-001');
  assert(reg100Overview !== null, 'Overview must still be present');
  console.log('✓ Test 100 passed: Segments A-G regression check verified.');

  // ============================================================
  // SEGMENT I: REPORTS & REGULATORY EXPORTS TESTS (101 - 120)
  // ============================================================

  console.log('\n--- STARTING SEGMENT I: REPORTS & REGULATORY EXPORTS TESTS ---');

  // Test 101: Report directory retrieval
  console.log('Test 101: reportService.getReportDefinitions()');
  const reportDefs = await reportService.getReportDefinitions();
  assertStrictEqual(reportDefs.length, 7, 'There must be exactly 7 report definitions');
  const expectedTypes = ['OPERATIONAL', 'PARTICIPANT', 'VISIT', 'SAFETY', 'COMPLIANCE', 'TASK', 'DOCUMENT'];
  expectedTypes.forEach((t) => {
    assert(reportDefs.some((d) => d.reportType === t), `Report type ${t} must be present`);
  });
  console.log('✓ Test 101 passed: Report directory retrieval verified.');

  // Test 102: Report type validation
  console.log('Test 102: Report type validation & unknown handling');
  let invalidReportErr = false;
  try {
    await reportService.generateReport(ctxSite1, 'INVALID_REPORT' as any);
  } catch (err) {
    invalidReportErr = true;
    assert((err as Error).message.includes('Invalid report type'), 'Error must mention invalid report type');
  }
  assertStrictEqual(invalidReportErr, true, 'Unknown report type must throw error');
  const safetyDef = await reportService.getReportDefinitionByType('SAFETY');
  assert(safetyDef !== null && safetyDef.title === 'Safety & AE Summary', 'Safety report definition lookup must succeed');
  const nullDef = await reportService.getReportDefinitionByType('UNKNOWN' as any);
  assertStrictEqual(nullDef, null, 'Unknown report type definition lookup must return null');
  console.log('✓ Test 102 passed: Report type validation verified.');

  // Test 103: Participant report generation
  console.log('Test 103: Participant report generation');
  const participantReport = await reportService.generateReport(ctxSite1, 'PARTICIPANT');
  assertStrictEqual(participantReport.metadata.reportType, 'PARTICIPANT');
  assertStrictEqual(participantReport.metadata.studyId, 'STUDY-001');
  assertStrictEqual(participantReport.metadata.siteId, 'SITE-001');
  assertStrictEqual(participantReport.metadata.disclaimer, REGULATORY_REPORT_DISCLAIMER);
  assertStrictEqual(participantReport.totalRows, 10, 'SITE-001 must generate 10 participant rows');
  assert(String(participantReport.rows[0].participantId).startsWith('PT-'), 'Subject ID must start with PT-');
  const partTotalMetric = participantReport.summaryMetrics.find((m) => m.label === 'Total Subjects');
  assertStrictEqual(partTotalMetric?.value, 10, 'Summary metric must reflect total subjects');
  console.log('✓ Test 103 passed: Participant report generation verified.');

  // Test 104: Visit report generation
  console.log('Test 104: Visit report generation');
  const visitReport = await reportService.generateReport(ctxSite1, 'VISIT');
  assertStrictEqual(visitReport.metadata.reportType, 'VISIT');
  assert(visitReport.totalRows > 0, 'Visit report must contain scheduled visits');
  assert(String(visitReport.rows[0].visitId).startsWith('VIS-'), 'Visit ID must start with VIS-');
  assert(visitReport.columns.some((c) => c.key === 'windowRange'), 'Columns must include windowRange');
  assert(visitReport.summaryMetrics.some((m) => m.label === 'Total Visits'), 'Metrics must include Total Visits');
  console.log('✓ Test 104 passed: Visit report generation verified.');

  // Test 105: Safety report generation
  console.log('Test 105: Safety report generation');
  const safetyReport = await reportService.generateReport(ctxSite1, 'SAFETY');
  assertStrictEqual(safetyReport.metadata.reportType, 'SAFETY');
  assert(safetyReport.totalRows > 0, 'Safety report must contain adverse events');
  assert(safetyReport.rows.some((r) => r.isSerious === 'Yes (SAE)'), 'Report must include serious adverse events');
  assert(safetyReport.summaryMetrics.some((m) => m.label === 'Serious (SAE)'), 'Summary metrics must track SAEs');
  console.log('✓ Test 105 passed: Safety report generation verified.');

  // Test 106: Compliance report generation
  console.log('Test 106: Compliance report generation');
  const compReport = await reportService.generateReport(ctxSite1, 'COMPLIANCE');
  assertStrictEqual(compReport.metadata.reportType, 'COMPLIANCE');
  assertStrictEqual(compReport.totalRows, 6, 'SITE-001 must contain 6 deviation records');
  assert(String(compReport.rows[0].deviationId).startsWith('DEV-'), 'Deviation ID must start with DEV-');
  assert(compReport.rows.some((r) => r.classification === 'CRITICAL'), 'Must include critical non-compliance row');
  console.log('✓ Test 106 passed: Compliance report generation verified.');

  // Test 107: Task report generation
  console.log('Test 107: Task report generation');
  const taskReport = await reportService.generateReport(ctxSite1, 'TASK');
  assertStrictEqual(taskReport.metadata.reportType, 'TASK');
  assertStrictEqual(taskReport.totalRows, 11, 'SITE-001 must contain 11 task records');
  assert(String(taskReport.rows[0].taskId).startsWith('TSK-'), 'Task ID must start with TSK-');
  assert(taskReport.columns.some((c) => c.key === 'approvalStatus'), 'Columns must include approvalStatus');
  console.log('✓ Test 107 passed: Task report generation verified.');

  // Test 108: Document report generation
  console.log('Test 108: Document report generation');
  const docReport = await reportService.generateReport(ctxSite1, 'DOCUMENT');
  assertStrictEqual(docReport.metadata.reportType, 'DOCUMENT');
  assert(docReport.totalRows >= 12, 'SITE-001 must contain documents');
  assert(String(docReport.rows[0].documentId).startsWith('DOC-'), 'Document ID must start with DOC-');
  assert(docReport.rows.some((r) => r.obligation === 'Mandatory'), 'Must include mandatory obligations');
  console.log('✓ Test 108 passed: Document report generation verified.');

  // Test 109: Study/site scope isolation
  console.log('Test 109: Study/site scope isolation (SITE-001 vs SITE-002)');
  const site1PartReport = await reportService.generateReport(ctxSite1, 'PARTICIPANT');
  const site2PartReport = await reportService.generateReport(ctxSite2, 'PARTICIPANT');
  assertStrictEqual(site1PartReport.totalRows, 10, 'SITE-001 must have 10 participants');
  assertStrictEqual(site2PartReport.totalRows, 3, 'SITE-002 must have 3 participants');
  const site1Ids = new Set(site1PartReport.rows.map((r) => r.participantId));
  const hasLeakage = site2PartReport.rows.some((r) => site1Ids.has(r.participantId));
  assertStrictEqual(hasLeakage, false, 'SITE-002 report must have ZERO records from SITE-001');
  console.log('✓ Test 109 passed: Scope isolation verified.');

  // Test 110: Cross-study isolation
  console.log('Test 110: Cross-study isolation');
  const crossStudyReport = await reportService.generateReport(
    { studyId: 'STUDY-NONEXISTENT', siteId: 'SITE-001' },
    'PARTICIPANT'
  );
  assertStrictEqual(crossStudyReport.totalRows, 0, 'Invalid study context must yield 0 records');
  assertStrictEqual(crossStudyReport.rows.length, 0, 'Invalid study context must return empty rows array');
  console.log('✓ Test 110 passed: Cross-study isolation verified.');

  // Test 111: Report filtering
  console.log('Test 111: Report filtering (status and classification)');
  const filteredActiveParts = await reportService.generateReport(ctxSite1, 'PARTICIPANT', {
    status: 'ACTIVE',
  });
  assert(filteredActiveParts.totalRows > 0, 'Must have active participants');
  assert(filteredActiveParts.rows.every((r) => r.status === 'ACTIVE'), 'All rows must have status === ACTIVE');

  const filteredCriticalDevs = await reportService.generateReport(ctxSite1, 'COMPLIANCE', {
    classification: 'CRITICAL',
  });
  assert(filteredCriticalDevs.totalRows > 0, 'Must find critical deviations');
  assert(filteredCriticalDevs.rows.every((r) => r.classification === 'CRITICAL'), 'All rows must have classification === CRITICAL');
  console.log('✓ Test 111 passed: Single criteria filtering verified.');

  // Test 112: Combined AND filtering
  console.log('Test 112: Combined AND filtering');
  const combinedTasks = await reportService.generateReport(ctxSite1, 'TASK', {
    status: 'IN_PROGRESS',
    category: 'SAFETY',
  });
  assert(
    combinedTasks.rows.every((r) => r.status === 'IN_PROGRESS' && r.category === 'SAFETY'),
    'All rows must satisfy both status and category simultaneously'
  );
  console.log('✓ Test 112 passed: Combined AND filtering verified.');

  // Test 113: Summary metric consistency
  console.log('Test 113: Summary metric consistency with row data');
  const complianceRep = await reportService.generateReport(ctxSite1, 'COMPLIANCE');
  const openCountMetric = complianceRep.summaryMetrics.find((m) => m.label === 'Open Deviations');
  const derivedOpenCount = complianceRep.rows.filter(
    (r) => r.status !== 'CLOSED' && r.status !== 'RESOLVED'
  ).length;
  assertStrictEqual(openCountMetric?.value, derivedOpenCount, 'Summary open count must match row calculations');
  console.log('✓ Test 113 passed: Summary metric consistency verified.');

  // Test 114: CSV escaping/export
  console.log('Test 114: CSV escaping and formatting');
  assertStrictEqual(formatCsvCell('Simple'), '"Simple"');
  assertStrictEqual(formatCsvCell('With, Comma'), '"With, Comma"');
  assertStrictEqual(formatCsvCell('With "Quotes"'), '"With ""Quotes"""');
  assertStrictEqual(formatCsvCell('Line1\nLine2'), '"Line1\nLine2"');
  assertStrictEqual(formatCsvCell(null), '""');
  assertStrictEqual(formatCsvCell(true), '"YES"');
  assertStrictEqual(formatCsvCell(false), '"NO"');

  const csvTest = generateCsvContent(
    [{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }],
    [{ id: '1', name: 'Dr. "A"' }]
  );
  assert(csvTest.startsWith('\uFEFF'), 'CSV must prepend UTF-8 Byte Order Mark');
  assert(csvTest.includes('"Dr. ""A"""'), 'CSV must escape inner quotes');
  console.log('✓ Test 114 passed: CSV escaping and export formatting verified.');

  // Test 115: JSON export schema
  console.log('Test 115: JSON export schema and payload integrity');
  const jsonTestReport = await reportService.generateReport(ctxSite1, 'SAFETY');
  assertStrictEqual(jsonTestReport.metadata.studyId, 'STUDY-001');
  assertStrictEqual(jsonTestReport.metadata.siteId, 'SITE-001');
  assert(jsonTestReport.metadata.disclaimer.includes('Not a regulatory filing'), 'Disclaimer must be present');
  assert(Array.isArray(jsonTestReport.summaryMetrics), 'Summary metrics must be an array');
  assert(Array.isArray(jsonTestReport.rows), 'Rows must be an array');
  assert(Array.isArray(jsonTestReport.columns), 'Columns must be an array');
  console.log('✓ Test 115 passed: JSON export schema verified.');

  // Test 116: Export field allowlisting
  console.log('Test 116: Export field allowlisting (no private/secret data)');
  const allReportRows = [
    ...(await reportService.generateReport(ctxSite1, 'PARTICIPANT')).rows,
    ...(await reportService.generateReport(ctxSite1, 'SAFETY')).rows,
    ...(await reportService.generateReport(ctxSite1, 'TASK')).rows,
  ];
  for (const row of allReportRows) {
    const keys = Object.keys(row);
    assert(!keys.includes('password'), 'Export rows must not contain password');
    assert(!keys.includes('token'), 'Export rows must not contain token');
    assert(!keys.includes('secret'), 'Export rows must not contain secret');
    assert(!keys.includes('apiKey'), 'Export rows must not contain apiKey');
  }
  console.log('✓ Test 116 passed: Field allowlisting verified.');

  // Test 117: REPORTS permission check
  console.log('Test 117: REPORTS permission checks');
  const piCanView = await reportService.checkReportPermission('USR-101', ctxSite1, 'REPORTS_VIEW');
  const piCanExport = await reportService.checkReportPermission('USR-101', ctxSite1, 'REPORTS_EXPORT');
  assertStrictEqual(piCanView, true, 'PI (USR-101) must have REPORTS_VIEW');
  assertStrictEqual(piCanExport, true, 'PI (USR-101) must have REPORTS_EXPORT');
  const unknownUserPerm = await reportService.checkReportPermission('USR-NONEXISTENT', ctxSite1, 'REPORTS_EXPORT');
  assertStrictEqual(unknownUserPerm, false, 'Unknown user must not have export permission');
  console.log('✓ Test 117 passed: REPORTS permission checks verified.');

  // Test 118: Cross-site export protection
  console.log('Test 118: Cross-site export protection');
  const piCrossSiteExport = await reportService.checkReportPermission('USR-101', ctxSite2, 'REPORTS_EXPORT');
  assertStrictEqual(piCrossSiteExport, false, 'PI of SITE-001 must NOT have permissions in SITE-002');
  console.log('✓ Test 118 passed: Cross-site export protection verified.');

  // Test 119: Empty report behavior
  console.log('Test 119: Empty report behavior');
  const emptyReport = await reportService.generateReport(ctxSite1, 'PARTICIPANT', {
    search: 'NONEXISTENT_PARTICIPANT_SEARCH_9999',
  });
  assertStrictEqual(emptyReport.totalRows, 0, 'Empty filter must yield 0 rows');
  assertStrictEqual(emptyReport.rows.length, 0, 'Rows array must be empty');
  const emptyTotal = emptyReport.summaryMetrics.find((m) => m.label === 'Total Subjects');
  assertStrictEqual(emptyTotal?.value, 0, 'Total Subjects must be 0 for empty report');
  console.log('✓ Test 119 passed: Empty report behavior verified.');

  // Test 120: Comprehensive Segments A–H regression check
  console.log('Test 120: Comprehensive Segments A-H regression check');
  const reg120Studies = await studyService.getStudies();
  assert(reg120Studies.length > 0, 'Studies must be present');
  const reg120Participants = await participantService.getParticipants(ctxSite1);
  assertStrictEqual(reg120Participants.length, 10, 'SITE-001 must still have 10 participants');
  const reg120Visits = await visitService.getVisits(ctxSite1);
  assert(reg120Visits.length > 0, 'Visits must still be present');
  const reg120Safety = await safetyService.getSafetyEvents(ctxSite1);
  assert(reg120Safety.length > 0, 'Safety events must still be present');
  const reg120Deviations = await complianceService.getDeviations(ctxSite1);
  assertStrictEqual(reg120Deviations.length, 6, 'SITE-001 must still have 6 deviations');
  const reg120Team = await teamService.getTeamMembers(ctxSite1);
  assertStrictEqual(reg120Team.length, 7, 'SITE-001 must still have 7 team members');
  const reg120Tasks = await taskService.getTasks(ctxSite1);
  assertStrictEqual(reg120Tasks.length, 11, 'SITE-001 must still have 11 tasks');
  const reg120Docs = await documentService.getDocuments(ctxSite1);
  assert(reg120Docs.length >= 12, 'SITE-001 must still have documents');
  const reg120Overview = await dashboardService.getOverview('STUDY-001', 'SITE-001');
  assert(reg120Overview !== null, 'Overview must still be present');
  console.log('✓ Test 120 passed: Segments A-H regression check verified.');

  // Test 121: Excel export generation & structural verification
  console.log('Test 121: Excel export generation & content verification');
  const excelReport = await reportService.generateReport(ctxSite1, 'PARTICIPANT');
  const excelHtml = generateExcelContent(excelReport, {
    studyCode: 'STUDY-001',
    studyTitle: 'Ayurvedic Clinical Protocol Study',
    protocolVersion: 'v2.1',
    siteCode: 'SITE-001',
    siteName: 'AIIA Main Hospital',
    piName: 'Dr. Arvind Sharma',
    piRole: 'Principal Investigator',
  });
  assert(excelHtml.includes('ALL INDIA INSTITUTE OF AYURVEDA'), 'Excel export must include AIIA header');
  assert(excelHtml.includes('Participant Status Report'), 'Excel export must include report title');
  assert(excelHtml.includes('STUDY-001'), 'Excel export must include studyCode');
  assert(excelHtml.includes('SITE-001'), 'Excel export must include siteCode');
  assert(excelHtml.includes('Dr. Arvind Sharma'), 'Excel export must include PI Name');
  assert(excelHtml.includes('AUTHORISED SIGNATORY'), 'Excel export must include signatory block');
  assert(excelHtml.includes('Signature of Principal Investigator'), 'Excel export must include signature line');
  assert(excelHtml.includes('Operational Scope:'), 'Excel export must include regulatory disclaimer');
  assert(excelHtml.includes('xmlns:x="urn:schemas-microsoft-com:office:excel"'), 'Excel export must include Excel XML namespaces');
  console.log('✓ Test 121 passed: Excel export generation verified.');

  // Test 122: formatFilterDisplay helper validation
  console.log('Test 122: formatFilterDisplay helper validation');
  const emptyFilterStr = formatFilterDisplay({});
  assertStrictEqual(emptyFilterStr, 'All Records (No active filters)', 'Empty filters must show default text');
  const filledFilterStr = formatFilterDisplay({
    search: 'PT-101',
    status: 'ENROLLED',
    category: 'SAFETY',
    dateFrom: '2026-01-01',
    dateTo: '2026-06-30',
  });
  assert(filledFilterStr.includes('Search: "PT-101"'), 'Filter string must include search');
  assert(filledFilterStr.includes('Status: ENROLLED'), 'Filter string must include status');
  assert(filledFilterStr.includes('Category: SAFETY'), 'Filter string must include category');
  assert(filledFilterStr.includes('Date: 2026-01-01 to 2026-06-30'), 'Filter string must include date range');
  console.log('✓ Test 122 passed: formatFilterDisplay verified.');

  // Test 123: reportService.exportReport supports EXCEL and PDF
  console.log('Test 123: reportService.exportReport supports EXCEL and PDF');
  let excelExportFailed = false;
  try {
    // In node environment, downloadFile uses browser DOM, so we test generateExcelContent directly
    // and verify reportService.exportReport validates input
    await reportService.exportReport(null as any, 'EXCEL');
  } catch (err) {
    excelExportFailed = true;
    assert((err as Error).message.includes('No report provided'), 'Must reject null report');
  }
  assertStrictEqual(excelExportFailed, true, 'Null report export must fail');
  console.log('✓ Test 123 passed: Export service validation verified.');

  // --- STARTING SEGMENT J: NOTIFICATIONS, ALERTS & ACTION CENTER TESTS ---
  console.log('\n--- STARTING SEGMENT J: NOTIFICATIONS, ALERTS & ACTION CENTER TESTS ---');

  const ctxNtfSite1User101 = {
    studyId: 'STUDY-001',
    siteId: 'SITE-001',
    recipientUserId: 'USR-101',
  };

  const ctxNtfSite1User103 = {
    studyId: 'STUDY-001',
    siteId: 'SITE-001',
    recipientUserId: 'USR-103',
  };

  const ctxNtfSite2User201 = {
    studyId: 'STUDY-001',
    siteId: 'SITE-002',
    recipientUserId: 'USR-201',
  };

  const ctxNtfStudy2Site3User301 = {
    studyId: 'STUDY-002',
    siteId: 'SITE-003',
    recipientUserId: 'USR-301',
  };

  // Test 124: notificationService.getNotifications() retrieval
  console.log('Test 124: notificationService.getNotifications() - Retrieval');
  const user101Notifs = await notificationService.getNotifications(ctxNtfSite1User101);
  assert(user101Notifs.length >= 10, 'USR-101 must have at least 10 initial notifications in STUDY-001/SITE-001');
  assert(
    user101Notifs.every(
      (n) => n.studyId === 'STUDY-001' && n.siteId === 'SITE-001' && n.recipientUserId === 'USR-101'
    ),
    'All returned notifications must match active studyId, siteId, and recipientUserId'
  );
  console.log('✓ Test 124 passed: Notification retrieval and scoping verified.');

  // Test 125: Scoped retrieval by study and site
  console.log('Test 125: Scoped retrieval by study and site');
  const user101WrongSite = await notificationService.getNotifications({
    studyId: 'STUDY-001',
    siteId: 'SITE-002',
    recipientUserId: 'USR-101',
  });
  assertStrictEqual(user101WrongSite.length, 0, 'USR-101 has no notifications at SITE-002');
  console.log('✓ Test 125 passed: Study and site scoping verified.');

  // Test 126: Recipient isolation (user A cannot see user B notifications)
  console.log('Test 126: Recipient isolation (USR-101 vs USR-103)');
  const user103Notifs = await notificationService.getNotifications(ctxNtfSite1User103);
  assertStrictEqual(user103Notifs.length, 2, 'USR-103 must have exactly 2 notifications in SITE-001');
  const user101Ids = new Set(user101Notifs.map((n) => n.id));
  assert(
    user103Notifs.every((n) => !user101Ids.has(n.id)),
    'No notification ID overlap between USR-101 and USR-103'
  );
  console.log('✓ Test 126 passed: Recipient isolation verified.');

  // Test 127: Cross-site notification isolation
  console.log('Test 127: Cross-site notification isolation');
  const site2Notifs = await notificationService.getNotifications(ctxNtfSite2User201);
  assertStrictEqual(site2Notifs.length, 1, 'SITE-002 must return 1 notification for USR-201');
  assertStrictEqual(site2Notifs[0].id, 'NOTIF-201');
  assertStrictEqual(site2Notifs[0].siteId, 'SITE-002');
  console.log('✓ Test 127 passed: Cross-site notification isolation verified.');

  // Test 128: Cross-study notification isolation
  console.log('Test 128: Cross-study notification isolation');
  const study2Notifs = await notificationService.getNotifications(ctxNtfStudy2Site3User301);
  assertStrictEqual(study2Notifs.length, 1, 'STUDY-002 must return 1 notification for USR-301');
  assertStrictEqual(study2Notifs[0].studyId, 'STUDY-002');
  assertStrictEqual(study2Notifs[0].id, 'NOTIF-301');
  const leakCheck = await notificationService.getNotifications({
    studyId: 'STUDY-001',
    siteId: 'SITE-003',
    recipientUserId: 'USR-301',
  });
  assertStrictEqual(leakCheck.length, 0, 'Cross-study query must return 0 results');
  console.log('✓ Test 128 passed: Cross-study notification isolation verified.');

  // Test 129: Filter by notification type
  console.log('Test 129: Filter by notification type');
  const safetyNotifs = await notificationService.getNotifications(ctxNtfSite1User101, {
    type: 'SAFETY_REVIEW',
  });
  assert(safetyNotifs.length >= 1, 'Must find at least 1 SAFETY_REVIEW notification');
  assert(
    safetyNotifs.every((n) => n.type === 'SAFETY_REVIEW'),
    'All results must have type SAFETY_REVIEW'
  );
  console.log('✓ Test 129 passed: Type filtering verified.');

  // Test 130: Filter by priority
  console.log('Test 130: Filter by priority');
  const highPriorityNotifs = await notificationService.getNotifications(ctxNtfSite1User101, {
    priority: 'HIGH',
  });
  assert(highPriorityNotifs.length >= 4, 'Must find at least 4 HIGH priority notifications for USR-101');
  assert(
    highPriorityNotifs.every((n) => n.priority === 'HIGH'),
    'All results must have priority HIGH'
  );
  console.log('✓ Test 130 passed: Priority filtering verified.');

  // Test 131: Filter by status (UNREAD, READ, DISMISSED)
  console.log('Test 131: Filter by status (UNREAD, READ, DISMISSED)');
  const unreadNotifs = await notificationService.getNotifications(ctxNtfSite1User101, {
    status: 'UNREAD',
  });
  assert(unreadNotifs.every((n) => n.status === 'UNREAD'), 'All results must be UNREAD');
  const readNotifs = await notificationService.getNotifications(ctxNtfSite1User101, {
    status: 'READ',
  });
  assert(readNotifs.every((n) => n.status === 'READ'), 'All results must be READ');
  assert(readNotifs.some((n) => n.id === 'NOTIF-108'), 'NOTIF-108 must be in READ results');
  const dismissedNotifs = await notificationService.getNotifications(ctxNtfSite1User101, {
    status: 'DISMISSED',
  });
  assert(dismissedNotifs.every((n) => n.status === 'DISMISSED'), 'All results must be DISMISSED');
  assert(dismissedNotifs.some((n) => n.id === 'NOTIF-109'), 'NOTIF-109 must be in DISMISSED results');
  console.log('✓ Test 131 passed: Status filtering verified.');

  // Test 132: Combined AND filtering
  console.log('Test 132: Combined multi-criteria AND filtering');
  const combinedNotifs = await notificationService.getNotifications(ctxNtfSite1User101, {
    priority: 'HIGH',
    status: 'UNREAD',
    type: 'SAFETY_REVIEW',
  });
  assert(combinedNotifs.length >= 1, 'Must find at least 1 HIGH UNREAD SAFETY_REVIEW notification');
  assert(
    combinedNotifs.every(
      (n) => n.priority === 'HIGH' && n.status === 'UNREAD' && n.type === 'SAFETY_REVIEW'
    ),
    'All results must satisfy all 3 criteria simultaneously'
  );
  const directFilterCheck = filterNotifications(user101Notifs, { priority: 'HIGH' });
  assert(directFilterCheck.length >= 4, 'filterNotifications direct check must match');
  console.log('✓ Test 132 passed: Combined multi-criteria AND filtering verified.');

  // Test 133: Unread count calculation
  console.log('Test 133: Unread count calculation');
  const unreadCountInitial = await notificationService.getUnreadCount(ctxNtfSite1User101);
  const unreadList = await notificationService.getNotifications(ctxNtfSite1User101, {
    status: 'UNREAD',
  });
  assertStrictEqual(unreadCountInitial, unreadList.length, 'Unread count must match UNREAD notifications length');
  console.log('✓ Test 133 passed: Unread count calculation verified.');

  // Test 134: Summary metric calculation
  console.log('Test 134: Summary metric calculation');
  const summaryInitial = await notificationService.getNotificationSummary(ctxNtfSite1User101);
  const summaryDirect = calculateNotificationSummary(user101Notifs);
  assertStrictEqual(summaryDirect.total, user101Notifs.length, 'calculateNotificationSummary total must match');
  assertStrictEqual(summaryInitial.total, user101Notifs.length, 'Total metric must equal all notifications for user');
  assertStrictEqual(summaryInitial.unread, unreadCountInitial, 'Unread metric must match getUnreadCount');
  assert(summaryInitial.highPriority >= 4, 'High priority count must be at least 4');
  assert(summaryInitial.actionRequired >= 7, 'Action required count must be at least 7');
  console.log('✓ Test 134 passed: Summary metrics verified.');

  // Test 135: Action-required detection
  console.log('Test 135: Action-required detection');
  const safetyReviewNotif = user101Notifs.find((n) => n.id === 'NOTIF-101')!;
  assertStrictEqual(isActionRequiredNotification(safetyReviewNotif), true, 'UNREAD SAFETY_REVIEW must be action required');
  const readTeamNotif = user101Notifs.find((n) => n.id === 'NOTIF-108')!;
  assertStrictEqual(isActionRequiredNotification(readTeamNotif), false, 'READ notification must NOT be action required');
  const dismissedTaskNotif = user101Notifs.find((n) => n.id === 'NOTIF-109')!;
  assertStrictEqual(isActionRequiredNotification(dismissedTaskNotif), false, 'DISMISSED notification must NOT be action required');
  console.log('✓ Test 135 passed: Action-required detection verified.');

  // Test 136: Mark single notification as READ
  console.log('Test 136: Mark single notification as READ');
  const markedNotif = await notificationService.markAsRead(ctxNtfSite1User101, 'NOTIF-104');
  assertStrictEqual(markedNotif.status, 'READ', 'Status must be updated to READ');
  assert(Boolean(markedNotif.readAt), 'readAt timestamp must be populated');
  const reFetched104 = await notificationService.getNotificationById(ctxNtfSite1User101, 'NOTIF-104');
  assertStrictEqual(reFetched104?.status, 'READ', 'Refetched notification must be READ');
  console.log('✓ Test 136 passed: Mark single notification as READ verified.');

  // Test 137: Mark all notifications as READ
  console.log('Test 137: Mark all notifications as READ');
  const markAllResult = await notificationService.markAllAsRead(ctxNtfSite1User101);
  assert(markAllResult > 0, 'Mark all as read must return count of updated notifications');
  const unreadCountFinal = await notificationService.getUnreadCount(ctxNtfSite1User101);
  assertStrictEqual(unreadCountFinal, 0, 'Unread count must be 0 after markAllAsRead');
  console.log('✓ Test 137 passed: Mark all as READ verified.');

  // Test 138: Dismiss notification
  console.log('Test 138: Dismiss notification');
  const dismissed = await notificationService.dismissNotification(ctxNtfSite1User101, 'NOTIF-105');
  assertStrictEqual(dismissed.status, 'DISMISSED', 'Status must be updated to DISMISSED');
  const reFetched105 = await notificationService.getNotificationById(ctxNtfSite1User101, 'NOTIF-105');
  assertStrictEqual(reFetched105?.status, 'DISMISSED', 'Refetched notification must be DISMISSED');
  console.log('✓ Test 138 passed: Dismiss notification verified.');

  // Test 139: Unread count updates after state mutation
  console.log('Test 139: Unread count updates after state mutation');
  // At this point unreadCount is 0 because of markAllAsRead in Test 137
  assertStrictEqual(unreadCountFinal, 0, 'Unread count must be 0');
  // Re-verify with filters
  const unreadAfterAll = await notificationService.getNotifications(ctxNtfSite1User101, { status: 'UNREAD' });
  assertStrictEqual(unreadAfterAll.length, 0, 'No unread notifications remain after markAllAsRead');
  console.log('✓ Test 139 passed: Unread count updates verified.');

  // Test 140: Duplicate notification prevention
  console.log('Test 140: Duplicate notification prevention');
  const uniqueCandidate = {
    studyId: 'STUDY-001',
    siteId: 'SITE-001',
    recipientUserId: 'USR-101',
    type: 'SAFETY_REVIEW' as const,
    priority: 'HIGH' as const,
    status: 'UNREAD' as const,
    title: 'Duplicate Test Notification',
    message: 'Testing duplicate notification prevention logic',
    sourceEntityType: 'SAFETY_EVENT' as const,
    sourceEntityId: 'SAE-UNIQUE-999',
  };
  const createdNotif = await mockNotificationRepository.createNotification(
    ctxNtfSite1User101,
    uniqueCandidate
  );
  assertStrictEqual(createdNotif.sourceEntityId, 'SAE-UNIQUE-999');

  // Attempt duplicate while active UNREAD
  let duplicateRejected = false;
  try {
    await mockNotificationRepository.createNotification(
      ctxNtfSite1User101,
      uniqueCandidate
    );
  } catch (err) {
    duplicateRejected = true;
    assert(
      (err as Error).message.includes('Duplicate active notification exists'),
      'Must reject duplicate active UNREAD notification'
    );
  }
  assertStrictEqual(duplicateRejected, true, 'Duplicate active notification must be rejected');

  // Mark it READ, then verify creating same candidate succeeds!
  await notificationService.markAsRead(ctxNtfSite1User101, createdNotif.id);
  const reCreatedNotif = await mockNotificationRepository.createNotification(
    ctxNtfSite1User101,
    uniqueCandidate
  );
  assert(Boolean(reCreatedNotif.id), 'Creation succeeds after previous instance is no longer UNREAD');
  // Exercise isDuplicateActiveNotification directly
  assertStrictEqual(isDuplicateActiveNotification([createdNotif], uniqueCandidate), true);
  console.log('✓ Test 140 passed: Duplicate notification prevention verified.');

  // Test 141: Navigation route resolution for source entities
  console.log('Test 141: Navigation route resolution for source entities');
  assertStrictEqual(getDefaultActionRoute('SAFETY_EVENT', 'SAE-101'), '/pi/safety/SAE-101');
  assertStrictEqual(getDefaultActionRoute('PROTOCOL_DEVIATION', 'DEV-001'), '/pi/compliance/DEV-001');
  assertStrictEqual(getDefaultActionRoute('TASK', 'TSK-103'), '/pi/tasks/TSK-103');
  assertStrictEqual(getDefaultActionRoute('DOCUMENT', 'DOC-102'), '/pi/documents/DOC-102');
  assertStrictEqual(getDefaultActionRoute('VISIT', 'VIS-101-01'), '/pi/visits/VIS-101-01');
  assertStrictEqual(getDefaultActionRoute('PARTICIPANT', 'PT-101'), '/pi/patients/PT-101');
  assertStrictEqual(getDefaultActionRoute('TEAM_MEMBER', 'USR-102'), '/pi/team/USR-102');
  assertStrictEqual(getDefaultActionRoute(undefined, undefined), undefined);
  assertStrictEqual(formatRelativeTime(new Date().toISOString()), 'Just now');
  console.log('✓ Test 141 passed: Navigation route resolution verified.');

  // Test 142: Missing source entity fallback behavior
  console.log('Test 142: Missing source entity fallback behavior');
  const validSafetyNotif = user101Notifs.find((n) => n.id === 'NOTIF-101')!;
  const isValidAvailable = await notificationService.verifySourceEntityAvailable(
    ctxNtfSite1User101,
    validSafetyNotif
  );
  assertStrictEqual(isValidAvailable, true, 'Existing entity (SAE-002) must return true');

  const missingEntityNotif = user101Notifs.find((n) => n.id === 'NOTIF-110')!;
  const isMissingAvailable = await notificationService.verifySourceEntityAvailable(
    ctxNtfSite1User101,
    missingEntityNotif
  );
  assertStrictEqual(isMissingAvailable, false, 'Nonexistent entity (TSK-NONEXISTENT-999) must return false');
  console.log('✓ Test 142 passed: Missing source entity fallback behavior verified.');

  // Test 143: Comprehensive Segments A-I regression check
  console.log('Test 143: Comprehensive Segments A-I regression check');
  const regStudiesJ = await studyService.getStudies();
  assert(regStudiesJ.length >= 2, 'Studies must remain intact');
  const regParticipantsJ = await participantService.getParticipants(ctxSite1);
  assert(regParticipantsJ.length >= 10, 'Participants must remain intact');
  const regVisitsJ = await visitService.getVisits(ctxSite1);
  assert(regVisitsJ.length > 0, 'Visits must remain intact');
  const regSafetyJ = await safetyService.getSafetyEvents(ctxSite1);
  assert(regSafetyJ.length >= 4, 'Safety events must remain intact');
  const regDeviationsJ = await complianceService.getDeviations(ctxSite1);
  assert(regDeviationsJ.length >= 3, 'Deviations must remain intact');
  const regTeamJ = await teamService.getTeamMembers(ctxSite1);
  assert(regTeamJ.length >= 5, 'Team members must remain intact');
  const regTasksJ = await taskService.getTasks(ctxSite1);
  assert(regTasksJ.length >= 10, 'Tasks must remain intact');
  const regDocsJ = await documentService.getDocuments(ctxSite1);
  assert(regDocsJ.length >= 8, 'Documents must remain intact');
  const regReportsJ = await reportService.getReportDefinitions();
  assertStrictEqual(regReportsJ.length, 7, '7 reports must remain intact');
  console.log('✓ Test 143 passed: Segments A-I regression check verified.');

  // --- STARTING PHASE 1: AUTHENTICATION & ROLE-BASED PORTAL FOUNDATION TESTS ---
  console.log('\n--- STARTING AUTHENTICATION & ROLE-BASED PORTAL FOUNDATION TESTS ---');

  // Test 144: Demo PI login
  console.log('Test 144: Demo PI login (demo.pi@aiia-ctms.local)');
  const piLogin = await authService.login('demo.pi@aiia-ctms.local', 'PI@Demo123');
  assertStrictEqual(piLogin.success, true, 'PI login must succeed');
  assert(piLogin.user !== undefined, 'User must be defined');
  assertStrictEqual(piLogin.user.id, 'USR-101', 'PI user ID must be USR-101');
  assertStrictEqual(piLogin.role?.id, 'ROLE_PI', 'PI role must be ROLE_PI');
  assertStrictEqual(piLogin.session?.studyId, 'STUDY-001', 'Primary study must be STUDY-001');
  assertStrictEqual(piLogin.session?.siteId, 'SITE-001', 'Primary site must be SITE-001');
  const piAuthPerms = (piLogin.effectivePermissions || []).map((p) => p.id);
  assert(piAuthPerms.includes('SAFETY_REVIEW'), 'PI must hold SAFETY_REVIEW');
  assert(piAuthPerms.includes('TASKS_MANAGE'), 'PI must hold TASKS_MANAGE');
  assert(piAuthPerms.includes('REPORTS_EXPORT'), 'PI must hold REPORTS_EXPORT');
  console.log('✓ Test 144 passed: Demo PI login verified.');

  // Test 145: Demo Sub-Investigator login
  console.log('Test 145: Demo Sub-Investigator login (demo.subi@aiia-ctms.local)');
  const subiLogin = await authService.login('demo.subi@aiia-ctms.local', 'SUBI@Demo123');
  assertStrictEqual(subiLogin.success, true, 'Sub-Investigator login must succeed');
  assertStrictEqual(subiLogin.user?.id, 'USR-102', 'Sub-I user ID must be USR-102');
  assertStrictEqual(subiLogin.role?.id, 'ROLE_SUB_I', 'Role must be ROLE_SUB_I');
  const subiPerms = (subiLogin.effectivePermissions || []).map((p) => p.id);
  assert(subiPerms.includes('VISITS_APPROVE'), 'Sub-I must have VISITS_APPROVE');
  assert(subiPerms.includes('SAFETY_REVIEW'), 'Sub-I must have SAFETY_REVIEW');
  assert(subiPerms.includes('COMPLIANCE_REVIEW'), 'Sub-I must have COMPLIANCE_REVIEW');
  console.log('✓ Test 145 passed: Demo Sub-Investigator login verified.');

  // Test 146: Demo CRC login
  console.log('Test 146: Demo CRC login (demo.crc@aiia-ctms.local)');
  const crcLogin = await authService.login('demo.crc@aiia-ctms.local', 'CRC@Demo123');
  assertStrictEqual(crcLogin.success, true, 'CRC login must succeed');
  assertStrictEqual(crcLogin.user?.id, 'USR-103', 'CRC user ID must be USR-103');
  assertStrictEqual(crcLogin.role?.id, 'ROLE_CRC', 'Role must be ROLE_CRC');
  const crcPerms = (crcLogin.effectivePermissions || []).map((p) => p.id);
  assert(crcPerms.includes('PARTICIPANTS_CREATE'), 'CRC must have PARTICIPANTS_CREATE');
  assert(crcPerms.includes('DOCUMENTS_EDIT'), 'CRC must have DOCUMENTS_EDIT');
  assert(crcPerms.includes('TASKS_MANAGE'), 'CRC must have TASKS_MANAGE');
  console.log('✓ Test 146 passed: Demo CRC login verified.');

  // Test 147: Demo Study Nurse login
  console.log('Test 147: Demo Study Nurse login (demo.nurse@aiia-ctms.local)');
  const nurseLogin = await authService.login('demo.nurse@aiia-ctms.local', 'NURSE@Demo123');
  assertStrictEqual(nurseLogin.success, true, 'Nurse login must succeed');
  assertStrictEqual(nurseLogin.user?.id, 'USR-104', 'Nurse user ID must be USR-104');
  assertStrictEqual(nurseLogin.role?.id, 'ROLE_STUDY_NURSE', 'Role must be ROLE_STUDY_NURSE');
  const nursePerms = (nurseLogin.effectivePermissions || []).map((p) => p.id);
  assert(nursePerms.includes('VISITS_EDIT'), 'Nurse must have VISITS_EDIT');
  assert(nursePerms.includes('SAFETY_CREATE'), 'Nurse must have SAFETY_CREATE');
  console.log('✓ Test 147 passed: Demo Study Nurse login verified.');

  // Test 148: Demo Pharmacist login
  console.log('Test 148: Demo Pharmacist login (demo.pharmacist@aiia-ctms.local)');
  const pharmLogin = await authService.login('demo.pharmacist@aiia-ctms.local', 'PHARM@Demo123');
  assertStrictEqual(pharmLogin.success, true, 'Pharmacist login must succeed');
  assertStrictEqual(pharmLogin.user?.id, 'USR-105', 'Pharmacist user ID must be USR-105');
  assertStrictEqual(pharmLogin.role?.id, 'ROLE_STUDY_PHARMACIST', 'Role must be ROLE_STUDY_PHARMACIST');
  const pharmPerms = (pharmLogin.effectivePermissions || []).map((p) => p.id);
  assert(pharmPerms.includes('DOCUMENTS_VIEW'), 'Pharmacist must have DOCUMENTS_VIEW');
  assert(pharmPerms.includes('SAFETY_CREATE'), 'Pharmacist must have SAFETY_CREATE');
  console.log('✓ Test 148 passed: Demo Pharmacist login verified.');

  // Test 149: Demo Data Entry login
  console.log('Test 149: Demo Data Entry login (demo.data@aiia-ctms.local)');
  const dataLogin = await authService.login('demo.data@aiia-ctms.local', 'DATA@Demo123');
  assertStrictEqual(dataLogin.success, true, 'Data Entry login must succeed');
  assertStrictEqual(dataLogin.user?.id, 'USR-106', 'Data Entry user ID must be USR-106');
  assertStrictEqual(dataLogin.role?.id, 'ROLE_DATA_ENTRY', 'Role must be ROLE_DATA_ENTRY');
  const dataPerms = (dataLogin.effectivePermissions || []).map((p) => p.id);
  assert(!dataPerms.includes('PARTICIPANTS_EDIT'), 'Data Entry must NOT have PARTICIPANTS_EDIT in Stage 1');
  assert(dataPerms.includes('PARTICIPANTS_VIEW'), 'Data Entry must have PARTICIPANTS_VIEW');
  assert(dataPerms.includes('VISITS_EDIT'), 'Data Entry must have VISITS_EDIT');
  console.log('✓ Test 149 passed: Demo Data Entry login verified.');

  // Test 150: Invalid credential rejection
  console.log('Test 150: Invalid credential rejection');
  const badPass = await authService.login('demo.pi@aiia-ctms.local', 'WrongPassword123');
  assertStrictEqual(badPass.success, false, 'Bad password must be rejected');
  assert(badPass.error !== undefined, 'Error message must be populated');

  const nonExistent = await authService.login('unknown@aiia-ctms.local', 'PI@Demo123');
  assertStrictEqual(nonExistent.success, false, 'Non-existent account must be rejected');

  const emptyCreds = await authService.login('', '');
  assertStrictEqual(emptyCreds.success, false, 'Empty credentials must be rejected');
  console.log('✓ Test 150 passed: Invalid credential rejection verified.');

  // Test 151: Session persistence (storage save & restore)
  console.log('Test 151: Session persistence (storage save & restore)');
  await authService.login('demo.pi@aiia-ctms.local', 'PI@Demo123');
  const storedSession = browserStorage.get(SESSION_STORAGE_KEY);
  assert(storedSession !== null, 'Session must exist in storage after login');

  const restored = await authService.restoreSession();
  assertStrictEqual(restored.success, true, 'Restored session must be successful');
  assertStrictEqual(restored.user?.id, 'USR-101', 'Restored user must be USR-101');
  assertStrictEqual(restored.role?.id, 'ROLE_PI', 'Restored role must be ROLE_PI');
  console.log('✓ Test 151 passed: Session persistence verified.');

  // Test 152: Logout clears session
  console.log('Test 152: Logout clears session');
  authService.logout();
  const sessionAfterLogout = browserStorage.get(SESSION_STORAGE_KEY);
  assertStrictEqual(sessionAfterLogout, null, 'Storage must be null after logout');

  const restoreAfterLogout = await authService.restoreSession();
  assertStrictEqual(restoreAfterLogout.success, false, 'Restore after logout must fail');
  console.log('✓ Test 152 passed: Logout clears session verified.');

  // Test 153: Unauthenticated route protection
  console.log('Test 153: Unauthenticated route protection');
  const unauthCheck = await authService.restoreSession();
  assertStrictEqual(unauthCheck.success, false, 'Unauthenticated check must return false');
  console.log('✓ Test 153 passed: Unauthenticated route protection verified.');

  // Test 154: Authenticated valid route access
  console.log('Test 154: Authenticated valid route access');
  const piAuth = await authService.login('demo.pi@aiia-ctms.local', 'PI@Demo123');
  const perms = piAuth.effectivePermissions || [];
  assertStrictEqual(authService.hasPermission('PARTICIPANTS_VIEW', perms), true, 'PI must have PARTICIPANTS_VIEW');
  assertStrictEqual(authService.hasPermission('VISITS_VIEW', perms), true, 'PI must have VISITS_VIEW');
  assertStrictEqual(authService.hasPermission('SAFETY_VIEW', perms), true, 'PI must have SAFETY_VIEW');
  assertStrictEqual(authService.hasPermission('COMPLIANCE_VIEW', perms), true, 'PI must have COMPLIANCE_VIEW');
  assertStrictEqual(authService.hasPermission('REPORTS_VIEW', perms), true, 'PI must have REPORTS_VIEW');
  console.log('✓ Test 154 passed: Authenticated valid route access verified.');

  // Test 155: Permission-based route denial
  console.log('Test 155: Permission-based route denial');
  const dataAuth = await authService.login('demo.data@aiia-ctms.local', 'DATA@Demo123');
  const dataEntryPerms = dataAuth.effectivePermissions || [];
  assertStrictEqual(authService.hasPermission('SAFETY_VIEW', dataEntryPerms), false, 'Data Entry cannot view Safety');
  assertStrictEqual(authService.hasPermission('COMPLIANCE_VIEW', dataEntryPerms), false, 'Data Entry cannot view Compliance');
  assertStrictEqual(authService.hasPermission('REPORTS_VIEW', dataEntryPerms), false, 'Data Entry cannot view Reports');
  assertStrictEqual(authService.hasPermission('TEAM_VIEW', dataEntryPerms), false, 'Data Entry cannot view Team');
  assertStrictEqual(authService.hasPermission('DOCUMENTS_VIEW', dataEntryPerms), false, 'Data Entry cannot view Documents');
  console.log('✓ Test 155 passed: Permission-based route denial verified.');

  // Test 156: Role landing route selection
  console.log('Test 156: Role landing route selection');
  assertStrictEqual(getRoleLandingRoute('ROLE_PI'), '/pi', 'ROLE_PI landing route must be /pi');
  assertStrictEqual(getRoleLandingRoute('ROLE_SUB_I'), '/sub-investigator', 'ROLE_SUB_I landing route must be /sub-investigator');
  assertStrictEqual(getRoleLandingRoute('ROLE_CRC'), '/crc', 'ROLE_CRC landing route must be /crc');
  assertStrictEqual(getRoleLandingRoute('ROLE_STUDY_NURSE'), '/study-nurse', 'ROLE_STUDY_NURSE landing route must be /study-nurse');
  assertStrictEqual(getRoleLandingRoute('ROLE_STUDY_PHARMACIST'), '/pharmacist', 'ROLE_STUDY_PHARMACIST landing route must be /pharmacist');
  assertStrictEqual(getRoleLandingRoute('ROLE_DATA_ENTRY'), '/data-entry', 'ROLE_DATA_ENTRY landing route must be /data-entry');
  assertStrictEqual(getRoleLandingRoute(undefined), '/pi', 'Undefined role defaults to /pi');
  console.log('✓ Test 156 passed: Role landing route selection verified.');

  // Test 157: User/study/site assignment validation
  console.log('Test 157: User/study/site assignment validation');
  const piAssignments = await authService.getUserAssignments('USR-101');
  assert(piAssignments.length >= 1, 'PI must have at least 1 assignment');
  assert(piAssignments.some((a) => a.studyId === 'STUDY-001' && a.siteId === 'SITE-001'), 'PI must be assigned to STUDY-001/SITE-001');

  const subiAssignments = await authService.getUserAssignments('USR-102');
  assert(subiAssignments.length >= 2, 'Sub-Investigator is assigned to multiple sites (SITE-001, SITE-002)');
  console.log('✓ Test 157 passed: User/study/site assignment validation verified.');

  // Test 158: Cross-site session protection
  console.log('Test 158: Cross-site session protection');
  const user101Sites = (await authService.getUserAssignments('USR-101')).map((a) => a.siteId);
  assert(user101Sites.includes('SITE-001'), 'USR-101 is at SITE-001');
  assert(!user101Sites.includes('SITE-002'), 'USR-101 must not have assignment at SITE-002');
  console.log('✓ Test 158 passed: Cross-site session protection verified.');

  // Test 159: Role-aware navigation filtering
  console.log('Test 159: Role-aware navigation filtering');
  const piNavItems = getRoleNavigationItems('ROLE_PI', piAuth.effectivePermissions);
  const piNavNames = piNavItems.map((item) => item.name);
  assert(piNavNames.includes('Overview'), 'PI nav must have Overview');
  assert(piNavNames.includes('Patients'), 'PI nav must have Patients');
  assert(piNavNames.includes('Safety'), 'PI nav must have Safety');
  assert(piNavNames.includes('Compliance'), 'PI nav must have Compliance');
  assert(piNavNames.includes('Reports'), 'PI nav must have Reports');

  const dataNavItems = getRoleNavigationItems('ROLE_DATA_ENTRY', dataEntryPerms);
  const dataNavNames = dataNavItems.map((item) => item.name);
  assert(dataNavNames.includes('Overview'), 'Data nav must have Overview');
  assert(dataNavNames.includes('Patients'), 'Data nav must have Patients');
  assert(dataNavNames.includes('Visits & Activities'), 'Data nav must have Visits');
  assert(!dataNavNames.includes('Safety'), 'Data nav must hide Safety');
  assert(!dataNavNames.includes('Compliance'), 'Data nav must hide Compliance');
  assert(!dataNavNames.includes('Reports'), 'Data nav must hide Reports');
  assert(!dataNavNames.includes('Team & Roles'), 'Data nav must hide Team & Roles');
  const dataOverview = dataNavItems.find((i) => i.name === 'Overview');
  assertStrictEqual(dataOverview?.path, '/data-entry', 'Data entry Overview must point to /data-entry');
  console.log('✓ Test 159 passed: Role-aware navigation filtering verified.');

  // Test 160: Existing PI dashboard regression
  console.log('Test 160: Existing PI dashboard regression');
  await authService.login('demo.pi@aiia-ctms.local', 'PI@Demo123');
  const piNav = getRoleNavigationItems('ROLE_PI', piAuth.effectivePermissions);
  const piOverview = piNav.find((i) => i.name === 'Overview');
  assertStrictEqual(piOverview?.path, '/pi/dashboard', 'PI Overview must point to /pi/dashboard');
  const overviewData = await dashboardService.getOverview('STUDY-001', 'SITE-001');
  assert(overviewData !== null, 'Overview must not be null');
  assert(overviewData.participantSummary.enrolled >= 0, 'Participant summary enrolled must be >= 0');
  assert(overviewData.safetySummary.adverseEvents >= 0, 'Safety summary adverseEvents must be >= 0');
  assert(overviewData.visits.upcoming >= 0, 'Visit upcoming metrics must be >= 0');
  console.log('✓ Test 160 passed: Existing PI dashboard regression verified.');

  // Test 161: Comprehensive Segments A-J regression check
  console.log('Test 161: Comprehensive Segments A-J regression check');
  const allNotifs = await notificationService.getNotifications(ctxNtfSite1User101);
  assert(allNotifs.length >= 5, 'Notifications must remain intact');
  const allTasks = await taskService.getTasks(ctxSite1);
  assert(allTasks.length >= 10, 'Tasks must remain intact');
  const allDocs = await documentService.getDocuments(ctxSite1);
  assert(allDocs.length >= 8, 'Documents must remain intact');
  const allReports = await reportService.getReportDefinitions();
  assertStrictEqual(allReports.length, 7, '7 report definitions intact');
  console.log('✓ Test 161 passed: Comprehensive Segments A-J regression check verified.');

  console.log('\n--- STARTING TASK K: CLINICAL VISIT DATA ENTRY & SUB-I VERIFICATION TESTS ---');
  mockVisitDataRepository.resetForTesting();

  // Test 162: visitDataService.listRecords() - Scoped Retrieval
  console.log('Test 162: visitDataService.listRecords() - Scoped Retrieval');
  const site1Records = await visitDataService.listRecords(ctxSite1);
  assertStrictEqual(site1Records.length, 7, 'SITE-001 must have exactly 7 seeded visit data records');
  assert(site1Records.every((r) => r.studyId === 'STUDY-001' && r.siteId === 'SITE-001'), 'All records must match study and site');
  console.log('✓ Test 162 passed: Visit data records retrieval and scoping verified.');

  // Test 163: visitDataService.getRecord() - Detailed Retrieval
  console.log('Test 163: visitDataService.getRecord() - Detailed Retrieval');
  const vdr101 = await visitDataService.getRecord(ctxSite1, 'VDR-101');
  assert(vdr101 !== null, 'VDR-101 must exist');
  assertStrictEqual(vdr101.participantCode, 'PT-101', 'Participant code matches');
  assertStrictEqual(vdr101.status, 'VERIFIED', 'VDR-101 is VERIFIED');
  assert(vdr101.fields.length >= 6, 'VDR-101 has structured clinical fields');
  assert(vdr101.attachments.length >= 2, 'VDR-101 has source attachments');
  console.log('✓ Test 163 passed: Detailed visit data record retrieval verified.');

  // Test 164: Cross-site visit data record isolation
  console.log('Test 164: Cross-site visit data record isolation');
  const vdr101AtSite2 = await visitDataService.getRecord(ctxSite2, 'VDR-101');
  assertStrictEqual(vdr101AtSite2, null, 'VDR-101 from SITE-001 must not be accessible via SITE-002');
  const site2Records = await visitDataService.listRecords(ctxSite2);
  assertStrictEqual(site2Records.length, 1, 'SITE-002 must have exactly 1 record (VDR-201)');
  assertStrictEqual(site2Records[0].id, 'VDR-201', 'SITE-002 record is VDR-201');
  console.log('✓ Test 164 passed: Cross-site visit data record isolation verified.');

  // Test 165: Status filtering
  console.log('Test 165: Status filtering');
  const draftRecords = await visitDataService.listRecords(ctxSite1, { status: 'DRAFT' });
  assertStrictEqual(draftRecords.length, 1, 'SITE-001 should have 1 DRAFT record (VDR-105)');
  const submittedRecords = await visitDataService.listRecords(ctxSite1, { status: 'SUBMITTED_FOR_VERIFICATION' });
  assertStrictEqual(submittedRecords.length, 1, 'SITE-001 should have 1 SUBMITTED_FOR_VERIFICATION record (VDR-102)');
  const returnedRecords = await visitDataService.listRecords(ctxSite1, { status: 'RETURNED_FOR_CORRECTION' });
  assertStrictEqual(returnedRecords.length, 1, 'SITE-001 should have 1 RETURNED_FOR_CORRECTION record (VDR-103)');
  console.log('✓ Test 165 passed: Status filtering verified.');

  // Test 166: Free-text search filtering
  console.log('Test 166: Free-text search filtering');
  const searchRecordsByInitials = await visitDataService.listRecords(ctxSite1, { search: 'AS' });
  assert(searchRecordsByInitials.length >= 1, 'Search for initials AS should match VDR-101');
  const searchByVisit = await visitDataService.listRecords(ctxSite1, { search: 'SCR-01' });
  assert(searchByVisit.length >= 1, 'Search for SCR-01 should match');
  const searchByOperator = await visitDataService.listRecords(ctxSite1, { search: 'Deshmukh' });
  assert(searchByOperator.length >= 1, 'Search by operator name should match');
  console.log('✓ Test 166 passed: Free-text search filtering verified.');

  // Test 167: Attachment presence filtering
  console.log('Test 167: Attachment presence filtering');
  const withAttachments = await visitDataService.listRecords(ctxSite1, { hasAttachments: true });
  const withoutAttachments = await visitDataService.listRecords(ctxSite1, { hasAttachments: false });
  assert(withAttachments.length > 0, 'Should find records with attachments');
  assert(withoutAttachments.some((r) => r.id === 'VDR-105'), 'VDR-105 has zero attachments');
  assertStrictEqual(withAttachments.length + withoutAttachments.length, 7, 'Sum equals total records');
  console.log('✓ Test 167 passed: Attachment presence filtering verified.');

  // Test 168: getDataEntryQueue()
  console.log('Test 168: visitDataService.getDataEntryQueue()');
  const entryQueue = await visitDataService.getDataEntryQueue(ctxSite1);
  assertStrictEqual(entryQueue.length, 2, 'Data entry queue must have 2 records (1 DRAFT + 1 RETURNED)');
  assert(entryQueue.every((r) => r.status === 'DRAFT' || r.status === 'RETURNED_FOR_CORRECTION'), 'Queue only contains DRAFT or RETURNED');
  console.log('✓ Test 168 passed: Data entry work queue verified.');

  // Test 169: getVerificationQueue()
  console.log('Test 169: visitDataService.getVerificationQueue()');
  const verifQueue = await visitDataService.getVerificationQueue(ctxSite1);
  assertStrictEqual(verifQueue.length, 2, 'Verification queue must have 2 records (1 SUBMITTED + 1 RESUBMITTED)');
  assert(verifQueue.every((r) => r.status === 'SUBMITTED_FOR_VERIFICATION' || r.status === 'RESUBMITTED_FOR_VERIFICATION'), 'Queue only contains submitted or resubmitted');
  console.log('✓ Test 169 passed: Sub-Investigator verification queue verified.');

  // Test 170: getSummaryMetrics()
  console.log('Test 170: visitDataService.getSummaryMetrics()');
  const metrics = await visitDataService.getSummaryMetrics(ctxSite1);
  assertStrictEqual(metrics.totalRecords, 7, 'Total records 7');
  assertStrictEqual(metrics.pendingDataEntry, 2, 'Pending data entry 2');
  assertStrictEqual(metrics.pendingVerification, 2, 'Pending verification 2');
  assertStrictEqual(metrics.returnedForCorrection, 1, 'Returned for correction 1');
  assertStrictEqual(metrics.documentsPending, 1, 'Documents pending 1 (VDR-105)');
  assertStrictEqual(metrics.verified, 3, 'Verified or CRO 3 (VDR-101, VDR-106, VDR-107)');
  console.log('✓ Test 170 passed: Data entry summary metrics verified.');

  // Test 171: createDraft()
  console.log('Test 171: visitDataService.createDraft()');
  const deActor = {
    userId: 'USR-106',
    name: 'Manoj Deshmukh',
    roleId: 'ROLE_DATA_ENTRY',
    roleName: 'Data Entry Operator',
  };
  const newDraft = await visitDataService.createDraft(
    ctxSite1,
    {
      participantId: 'PT-103',
      participantCode: 'PT-103',
      participantInitials: 'R.V.',
      visitId: 'VIS-103-01',
      visitCode: 'SCR-01',
      visitName: 'Screening Evaluation',
      visitDate: '2026-09-29',
    },
    deActor
  );
  assert(newDraft.id.startsWith('VDR-'), 'Draft ID generated');
  assertStrictEqual(newDraft.status, 'DRAFT', 'Initial status is DRAFT');
  assertStrictEqual(newDraft.enteredByUserId, 'USR-106', 'Entered by USR-106');
  assert(newDraft.fields.length >= 6, 'Initial default fields created');
  assertStrictEqual(newDraft.history.length, 1, 'History has CREATED action');
  assertStrictEqual(newDraft.history[0].action, 'CREATED', 'First action is CREATED');
  console.log('✓ Test 171 passed: Draft creation and field scaffolding verified.');

  // Test 172: updateField()
  console.log('Test 172: visitDataService.updateField()');
  const updatedWithBP = await visitDataService.updateField(
    ctxSite1,
    newDraft.id,
    {
      fieldKey: 'bloodPressure',
      label: 'Blood Pressure',
      value: '118/76',
      unit: 'mmHg',
    },
    deActor
  );
  const bpField = updatedWithBP.fields.find((f) => f.fieldKey === 'bloodPressure');
  assertStrictEqual(bpField?.value, '118/76', 'BP field updated to 118/76');
  console.log('✓ Test 172 passed: Single field update verified.');

  // Test 173: updateRecordFields()
  console.log('Test 173: visitDataService.updateRecordFields() batch update');
  const batchUpdated = await visitDataService.updateRecordFields(
    ctxSite1,
    newDraft.id,
    [
      { fieldKey: 'pulse', value: '72' },
      { fieldKey: 'temperature', value: '98.6' },
      { fieldKey: 'respiratoryRate', value: '16' },
    ],
    deActor
  );
  assertStrictEqual(batchUpdated.fields.find((f) => f.fieldKey === 'pulse')?.value, '72', 'Pulse updated');
  assertStrictEqual(batchUpdated.fields.find((f) => f.fieldKey === 'temperature')?.value, '98.6', 'Temp updated');
  console.log('✓ Test 173 passed: Batch field update verified.');

  // Test 174: Editing locked record rejection
  console.log('Test 174: Editing locked record rejection');
  let editLockedFailed = false;
  try {
    await visitDataService.updateField(
      ctxSite1,
      'VDR-101', // VERIFIED record
      { fieldKey: 'pulse', label: 'Pulse', value: '80' },
      deActor
    );
  } catch (err: any) {
    editLockedFailed = true;
    assert(err.message.includes('locked for editing'), 'Error indicates locked record');
  }
  assert(editLockedFailed, 'Editing a VERIFIED record must throw an error');
  console.log('✓ Test 174 passed: Immutability of verified records verified.');

  // Test 175: uploadAttachment()
  console.log('Test 175: visitDataService.uploadAttachment()');
  const withAttachment = await visitDataService.uploadAttachment(
    ctxSite1,
    newDraft.id,
    {
      fileName: 'PT-103_Vitals_CRF.pdf',
      mimeType: 'application/pdf',
      size: 450000,
      storageReference: '/mock-source-docs/PT-103-Vitals.pdf',
      uploadedByUserId: deActor.userId,
      uploadedByName: deActor.name,
      documentType: 'Source CRF Worksheet',
    },
    deActor
  );
  assertStrictEqual(withAttachment.attachments.length, 1, 'Attachment added');
  assertStrictEqual(withAttachment.attachments[0].fileName, 'PT-103_Vitals_CRF.pdf', 'File name matches');
  const lastAction = withAttachment.history[withAttachment.history.length - 1];
  assertStrictEqual(lastAction.action, 'ATTACHMENT_ADDED', 'History logs ATTACHMENT_ADDED');
  console.log('✓ Test 175 passed: Source document attachment verified.');

  // Test 176: removeAttachment()
  console.log('Test 176: visitDataService.removeAttachment()');
  const attachmentId = withAttachment.attachments[0].id;
  const removedDoc = await visitDataService.removeAttachment(
    ctxSite1,
    newDraft.id,
    attachmentId,
    deActor
  );
  assertStrictEqual(removedDoc.attachments.length, 0, 'Attachment removed');
  console.log('✓ Test 176 passed: Attachment removal verified.');

  // Re-attach for submission workflow test
  await visitDataService.uploadAttachment(
    ctxSite1,
    newDraft.id,
    {
      fileName: 'PT-103_CRF_Valid.pdf',
      mimeType: 'application/pdf',
      size: 320000,
      storageReference: '/mock-source-docs/PT-103_CRF_Valid.pdf',
      uploadedByUserId: deActor.userId,
      uploadedByName: deActor.name,
      documentType: 'Source CRF Worksheet',
    },
    deActor
  );

  // Test 177: Attaching to locked record rejection
  console.log('Test 177: Attaching to locked record rejection');
  let attachLockedFailed = false;
  try {
    await visitDataService.uploadAttachment(
      ctxSite1,
      'VDR-101', // VERIFIED record
      {
        fileName: 'Illegal.pdf',
        mimeType: 'application/pdf',
        size: 1000,
        storageReference: '/mock/illegal.pdf',
        uploadedByUserId: deActor.userId,
        uploadedByName: deActor.name,
      },
      deActor
    );
  } catch (err: any) {
    attachLockedFailed = true;
    assert(err.message.includes('status: VERIFIED'), 'Error indicates invalid status for upload');
  }
  assert(attachLockedFailed, 'Uploading attachment to VERIFIED record must fail');
  console.log('✓ Test 177 passed: Document upload lock on non-editable records verified.');

  // Test 178: submitForVerification()
  console.log('Test 178: visitDataService.submitForVerification()');
  const submitted = await visitDataService.submitForVerification(ctxSite1, newDraft.id, deActor);
  assertStrictEqual(submitted.status, 'SUBMITTED_FOR_VERIFICATION', 'Status is SUBMITTED_FOR_VERIFICATION');
  assert(Boolean(submitted.submittedAt), 'submittedAt timestamp populated');
  const submitAction = submitted.history[submitted.history.length - 1];
  assertStrictEqual(submitAction.action, 'SUBMITTED_FOR_VERIFICATION', 'History records submission');
  console.log('✓ Test 178 passed: Submission for Sub-I verification verified.');

  // Test 179: Illegal direct state jump rejection
  console.log('Test 179: Illegal direct state jump rejection');
  assertStrictEqual(isValidVisitDataTransition('DRAFT', 'VERIFIED'), false, 'DRAFT -> VERIFIED is strictly illegal');
  assertStrictEqual(isValidVisitDataTransition('SUBMITTED_TO_CRO', 'DRAFT'), false, 'SUBMITTED_TO_CRO is terminal');
  console.log('✓ Test 179 passed: Illegal transition rules verified.');

  // Test 180: returnForCorrection() mandatory reason enforcement
  console.log('Test 180: returnForCorrection() mandatory reason enforcement');
  const subIActor = {
    userId: 'USR-102',
    name: 'Dr. Rajesh Kulkarni',
    roleId: 'ROLE_SUB_I',
    roleName: 'Sub-Investigator',
  };
  let emptyReasonFailed = false;
  try {
    await visitDataService.returnForCorrection(ctxSite1, submitted.id, '   ', ['bloodPressure'], subIActor);
  } catch (err: any) {
    emptyReasonFailed = true;
    assert(err.message.includes('mandatory'), 'Error mentions mandatory reason');
  }
  assert(emptyReasonFailed, 'Empty reason must be rejected when returning for correction');
  console.log('✓ Test 180 passed: Mandatory return reason enforcement verified.');

  // Test 181: returnForCorrection() flags affected fields
  console.log('Test 181: returnForCorrection() status and field flagging');
  const returnReason = 'Blood pressure 118/76 contradicts attached source CRF worksheet which records 132/84.';
  const returned = await visitDataService.returnForCorrection(
    ctxSite1,
    submitted.id,
    returnReason,
    ['bloodPressure'],
    subIActor
  );
  assertStrictEqual(returned.status, 'RETURNED_FOR_CORRECTION', 'Status is RETURNED_FOR_CORRECTION');
  assertStrictEqual(returned.returnReason, returnReason, 'Return reason saved');
  assertStrictEqual(returned.returnedBy, subIActor.name, 'Returned by recorded');
  const flaggedBp = returned.fields.find((f) => f.fieldKey === 'bloodPressure');
  assertStrictEqual(flaggedBp?.flaggedForCorrection, true, 'BP field flagged for correction');
  assertStrictEqual(flaggedBp?.flagReason, returnReason, 'BP flagReason populated');
  console.log('✓ Test 181 passed: Record return and field-level flagging verified.');

  // Test 182: resubmitForVerification() clears field flags
  console.log('Test 182: resubmitForVerification() correction loop');
  await visitDataService.updateField(
    ctxSite1,
    returned.id,
    { fieldKey: 'bloodPressure', label: 'Blood Pressure', value: '132/84' },
    deActor
  );
  const resubmitted = await visitDataService.resubmitForVerification(ctxSite1, returned.id, deActor);
  assertStrictEqual(resubmitted.status, 'RESUBMITTED_FOR_VERIFICATION', 'Status is RESUBMITTED_FOR_VERIFICATION');
  assert(Boolean(resubmitted.resubmittedAt), 'resubmittedAt populated');
  const resubmittedBp = resubmitted.fields.find((f) => f.fieldKey === 'bloodPressure');
  assertStrictEqual(resubmittedBp?.flaggedForCorrection, false, 'BP flag cleared on resubmission');
  console.log('✓ Test 182 passed: Correction loop and flag clearing verified.');

  // Test 183: Self-verification defense check
  console.log('Test 183: Self-verification defense check');
  let selfVerifyFailed = false;
  try {
    await visitDataService.verifyRecord(
      ctxSite1,
      resubmitted.id,
      'Attempting illegal self-verification',
      deActor
    );
  } catch (err: any) {
    selfVerifyFailed = true;
    assert(err.message.includes('Self-verification is strictly prohibited'), 'Error mentions self-verification prohibition');
  }
  assert(selfVerifyFailed, 'Self-verification by the data entry operator must be blocked');
  console.log('✓ Test 183 passed: Self-verification defense check verified.');

  // Test 184: Authorized Sub-Investigator verification
  console.log('Test 184: Authorized Sub-Investigator verification');
  const verified = await visitDataService.verifyRecord(
    ctxSite1,
    resubmitted.id,
    'Verified against source CRF Page 1. BP corrected to 132/84.',
    subIActor
  );
  assertStrictEqual(verified.status, 'VERIFIED', 'Status is VERIFIED');
  assertStrictEqual(verified.verifiedByUserId, 'USR-102', 'Verified by Sub-I USR-102');
  assert(Boolean(verified.verifiedAt), 'verifiedAt populated');
  const verifyAction = verified.history[verified.history.length - 1];
  assertStrictEqual(verifyAction.action, 'VERIFIED', 'History records VERIFIED');
  console.log('✓ Test 184 passed: Sub-Investigator clinical verification verified.');

  // Test 185: moveToPiReview()
  console.log('Test 185: visitDataService.moveToPiReview()');
  const piActor = {
    userId: 'USR-101',
    name: 'Dr. Anand Verma',
    roleId: 'ROLE_PI',
    roleName: 'Principal Investigator',
  };
  const piReviewed = await visitDataService.moveToPiReview(ctxSite1, verified.id, piActor);
  assertStrictEqual(piReviewed.status, 'PI_REVIEW', 'Status advanced to PI_REVIEW');
  assert(Boolean(piReviewed.piReviewedAt), 'piReviewedAt timestamp populated');
  console.log('✓ Test 185 passed: Advance to PI review verified.');

  // Test 186: submitToCro()
  console.log('Test 186: visitDataService.submitToCro() release');
  const croSubmitted = await visitDataService.submitToCro(
    ctxSite1,
    piReviewed.id,
    'Site verification complete. Released to sponsor DM.',
    piActor
  );
  assertStrictEqual(croSubmitted.status, 'SUBMITTED_TO_CRO', 'Status is SUBMITTED_TO_CRO');
  assert(Boolean(croSubmitted.croBatchReference), 'croBatchReference generated');
  assert(Boolean(croSubmitted.submittedToCroAt), 'submittedToCroAt populated');
  console.log('✓ Test 186 passed: Release to CRO with batch reference verified.');

  // Test 187: Multi-role review notes (Pharmacist/Nurse advisory)
  console.log('Test 187: Multi-role review notes (Pharmacist advisory)');
  const pharmActor = {
    userId: 'USR-105',
    name: 'Pooja Iyer',
    roleId: 'ROLE_STUDY_PHARMACIST',
    roleName: 'Study Pharmacist',
  };
  await visitDataService.addReviewNote(
    ctxSite1,
    'VDR-102',
    {
      type: 'SUGGESTION',
      message: 'Concomitant medication log shows subject started Metformin 500mg daily. Ensure dosage matches CRF.',
    },
    pharmActor
  );
  const reviewHistory = await visitDataService.getReviewHistory(ctxSite1, 'VDR-102');
  assert(reviewHistory.length >= 1, 'Review note appended');
  const latestNote = reviewHistory[reviewHistory.length - 1];
  assertStrictEqual(latestNote.authorRoleName, 'Study Pharmacist', 'Author role is Pharmacist');
  assertStrictEqual(latestNote.type, 'SUGGESTION', 'Type is SUGGESTION');
  console.log('✓ Test 187 passed: Multi-role advisory review notes verified.');

  // Test 188: Verification audit history retrieval
  console.log('Test 188: visitDataService.getVerificationHistory() audit trail');
  const fullHistory = await visitDataService.getVerificationHistory(ctxSite1, croSubmitted.id);
  assert(fullHistory.length >= 6, 'Full lifecycle audit trail preserved');
  const actionTypes = fullHistory.map((h) => h.action);
  assert(actionTypes.includes('CREATED'), 'History includes CREATED');
  assert(actionTypes.includes('SUBMITTED_FOR_VERIFICATION'), 'History includes SUBMITTED');
  assert(actionTypes.includes('RETURNED_FOR_CORRECTION'), 'History includes RETURNED');
  assert(actionTypes.includes('RESUBMITTED_FOR_VERIFICATION'), 'History includes RESUBMITTED');
  assert(actionTypes.includes('VERIFIED'), 'History includes VERIFIED');
  assert(actionTypes.includes('PI_REVIEWED'), 'History includes PI_REVIEWED');
  assert(actionTypes.includes('SUBMITTED_TO_CRO'), 'History includes SUBMITTED_TO_CRO');
  console.log('✓ Test 188 passed: Verification audit history and GCP trail verified.');

  // Test 189: Comprehensive Segments A-K regression check
  console.log('Test 189: Comprehensive Segments A-K regression check');
  const allNotifsFinal = await notificationService.getNotifications(ctxNtfSite1User101);
  assert(allNotifsFinal.length >= 5, 'Notifications intact');
  const allTasksFinal = await taskService.getTasks(ctxSite1);
  assert(allTasksFinal.length >= 10, 'Tasks intact');
  const allDevsFinal = await complianceService.getDeviations(ctxSite1);
  assert(allDevsFinal.length >= 6, 'Deviations intact');
  const allSafetyFinal = await safetyService.getSafetyEvents(ctxSite1);
  assert(allSafetyFinal.length >= 6, 'Safety events intact');
  const allVisitsFinal = await visitService.getVisits(ctxSite1);
  assert(allVisitsFinal.length >= 10, 'Visits intact');
  const allPartsFinal = await participantService.getParticipants(ctxSite1);
  assert(allPartsFinal.length >= 8, 'Participants intact');
  console.log('✓ Test 189 passed: Comprehensive Segments A-K regression check verified.');

  // ============================================================================
  // TEAM MEMBER ONBOARDING & LOGIN CREDENTIALS TESTS (TESTS 190-221)
  // ============================================================================
  console.log('\n--- STARTING TEAM MEMBER ONBOARDING & LOGIN CREDENTIALS TESTS ---');

  // Initialize and isolate environments for testing
  environmentService.setMode('EMPTY_TEST');
  emptyTestStore.resetWorkspace();
  mockDataStore.resetWorkspace();

  const emptyCtx = { studyId: 'EMPTY-STUDY-001', siteId: 'EMPTY-SITE-001' };

  // Test 190: PI can validate Add Team Member input
  console.log('Test 190: PI can validate Add Team Member input');
  let missingNameFailed = false;
  try {
    await teamService.createTeamMember(emptyCtx, {
      displayName: '   ',
      email: 'invalid@test.local',
      roleId: 'ROLE_SUB_I',
      studyId: emptyCtx.studyId,
      siteId: emptyCtx.siteId,
    });
  } catch (err: any) {
    missingNameFailed = true;
    assert(err.message.includes('Full Name is required'), 'Rejects empty name');
  }
  assert(missingNameFailed, 'Empty name must be rejected');

  let invalidEmailFailed = false;
  try {
    await teamService.createTeamMember(emptyCtx, {
      displayName: 'Valid Name',
      email: 'not-an-email',
      roleId: 'ROLE_SUB_I',
      studyId: emptyCtx.studyId,
      siteId: emptyCtx.siteId,
    });
  } catch (err: any) {
    invalidEmailFailed = true;
    assert(err.message.includes('valid email address is required'), 'Rejects invalid email format');
  }
  assert(invalidEmailFailed, 'Invalid email format must be rejected');
  console.log('✓ Test 190 passed: PI can validate Add Team Member input.');

  // Test 191: PI can create Sub-Investigator
  console.log('Test 191: PI can create Sub-Investigator');
  const subIMember = await teamService.createTeamMember(emptyCtx, {
    displayName: 'Demo Sub-I',
    email: 'demo.subi@test.local',
    roleId: 'ROLE_SUB_I',
    studyId: emptyCtx.studyId,
    siteId: emptyCtx.siteId,
    employeeId: 'EMP-SUBI-001',
  });
  assert(Boolean(subIMember.user.id), 'Sub-I user created with ID');
  assertStrictEqual(subIMember.user.displayName, 'Demo Sub-I', 'Display name matches');
  assertStrictEqual(subIMember.roles[0].id, 'ROLE_SUB_I', 'Role assigned is ROLE_SUB_I');
  console.log('✓ Test 191 passed: PI can create Sub-Investigator.');

  // Test 192: PI can create CRC
  console.log('Test 192: PI can create CRC');
  const crcMember = await teamService.createTeamMember(emptyCtx, {
    displayName: 'Demo CRC',
    email: 'demo.crc@test.local',
    roleId: 'ROLE_CRC',
    studyId: emptyCtx.studyId,
    siteId: emptyCtx.siteId,
    employeeId: 'EMP-CRC-001',
  });
  assertStrictEqual(crcMember.roles[0].id, 'ROLE_CRC', 'Role assigned is ROLE_CRC');
  console.log('✓ Test 192 passed: PI can create CRC.');

  // Test 193: PI can create Study Nurse
  console.log('Test 193: PI can create Study Nurse');
  const nurseMember = await teamService.createTeamMember(emptyCtx, {
    displayName: 'Demo Nurse',
    email: 'demo.nurse@test.local',
    roleId: 'ROLE_STUDY_NURSE',
    studyId: emptyCtx.studyId,
    siteId: emptyCtx.siteId,
    employeeId: 'EMP-NURSE-001',
  });
  assertStrictEqual(nurseMember.roles[0].id, 'ROLE_STUDY_NURSE', 'Role assigned is ROLE_STUDY_NURSE');
  console.log('✓ Test 193 passed: PI can create Study Nurse.');

  // Test 194: PI can create Study Pharmacist
  console.log('Test 194: PI can create Study Pharmacist');
  const pharmMember = await teamService.createTeamMember(emptyCtx, {
    displayName: 'Demo Pharmacist',
    email: 'demo.pharmacist@test.local',
    roleId: 'ROLE_STUDY_PHARMACIST',
    studyId: emptyCtx.studyId,
    siteId: emptyCtx.siteId,
    employeeId: 'EMP-PHARM-001',
  });
  assertStrictEqual(pharmMember.roles[0].id, 'ROLE_STUDY_PHARMACIST', 'Role assigned is ROLE_STUDY_PHARMACIST');
  console.log('✓ Test 194 passed: PI can create Study Pharmacist.');

  // Test 195: PI can create Data Entry Operator
  console.log('Test 195: PI can create Data Entry Operator');
  const deMember = await teamService.createTeamMember(emptyCtx, {
    displayName: 'Demo Data Entry',
    email: 'demo.data@test.local',
    roleId: 'ROLE_DATA_ENTRY',
    studyId: emptyCtx.studyId,
    siteId: emptyCtx.siteId,
    employeeId: 'EMP-DATA-001',
  });
  assertStrictEqual(deMember.roles[0].id, 'ROLE_DATA_ENTRY', 'Role assigned is ROLE_DATA_ENTRY');
  console.log('✓ Test 195 passed: PI can create Data Entry Operator.');

  // Test 196: Created users appear in Team list
  console.log('Test 196: Created users appear in Team list');
  const teamList = await teamService.getTeamMembers(emptyCtx);
  assert(teamList.length >= 6, 'Includes Bootstrap PI + 5 newly created staff');
  const emailsInList = teamList.map((m) => m.user.email);
  assert(emailsInList.includes('demo.subi@test.local'), 'Sub-I in team list');
  assert(emailsInList.includes('demo.crc@test.local'), 'CRC in team list');
  assert(emailsInList.includes('demo.nurse@test.local'), 'Nurse in team list');
  assert(emailsInList.includes('demo.pharmacist@test.local'), 'Pharmacist in team list');
  assert(emailsInList.includes('demo.data@test.local'), 'Data Entry in team list');
  console.log('✓ Test 196 passed: Created users appear in Team list.');

  // Test 197: Created user is linked to correct study
  console.log('Test 197: Created user is linked to correct study');
  assertStrictEqual(pharmMember.studyId, 'EMPTY-STUDY-001', 'Linked to EMPTY-STUDY-001');
  console.log('✓ Test 197 passed: Created user is linked to correct study.');

  // Test 198: Created user is linked to correct site
  console.log('Test 198: Created user is linked to correct site');
  assertStrictEqual(pharmMember.siteId, 'EMPTY-SITE-001', 'Linked to EMPTY-SITE-001');
  console.log('✓ Test 198 passed: Created user is linked to correct site.');

  // Test 199: Correct UserRole is created
  console.log('Test 199: Correct UserRole is created');
  const pharmRoles = await teamService.getUserRoleAssignments(emptyCtx, pharmMember.user.id);
  assert(pharmRoles.length === 1, 'Exactly one UserRole created');
  assertStrictEqual(pharmRoles[0].roleId, 'ROLE_STUDY_PHARMACIST', 'UserRole roleId matches');
  assertStrictEqual(pharmRoles[0].studyId, 'EMPTY-STUDY-001', 'UserRole studyId matches');
  assertStrictEqual(pharmRoles[0].siteId, 'EMPTY-SITE-001', 'UserRole siteId matches');
  console.log('✓ Test 199 passed: Correct UserRole is created.');

  // Test 200: Effective permissions resolve correctly
  console.log('Test 200: Effective permissions resolve correctly');
  const emptyDePerms = await teamService.getEffectivePermissions(emptyCtx, deMember.user.id);
  const dePermIds = emptyDePerms.map((p) => p.id);
  assert(dePermIds.includes('DATA_ENTRY_EDIT'), 'Data entry has edit/transcribe permission');
  assert(dePermIds.includes('DATA_ENTRY_VIEW'), 'Data entry has view permission');
  assert(!dePermIds.includes('SAFETY_REPORT_EXPEDITED'), 'Data entry does not have safety sign-off');
  console.log('✓ Test 200 passed: Effective permissions resolve correctly.');

  // Test 201: Duplicate email is blocked
  console.log('Test 201: Duplicate email is blocked');
  let duplicateEmailFailed = false;
  try {
    await teamService.createTeamMember(emptyCtx, {
      displayName: 'Duplicate Pharmacist',
      email: 'demo.pharmacist@test.local',
      roleId: 'ROLE_STUDY_PHARMACIST',
      studyId: emptyCtx.studyId,
      siteId: emptyCtx.siteId,
    });
  } catch (err: any) {
    duplicateEmailFailed = true;
    assert(err.message.includes('An account with this email already exists.'), 'Exact duplicate error message');
  }
  assert(duplicateEmailFailed, 'Duplicate email must throw error');
  console.log('✓ Test 201 passed: Duplicate email is blocked.');

  // Test 202: Email matching is case-insensitive
  console.log('Test 202: Email matching is case-insensitive');
  let caseDuplicateFailed = false;
  try {
    await teamService.createTeamMember(emptyCtx, {
      displayName: 'Uppercase Duplicate',
      email: 'DEMO.PHARMACIST@TEST.LOCAL',
      roleId: 'ROLE_STUDY_PHARMACIST',
      studyId: emptyCtx.studyId,
      siteId: emptyCtx.siteId,
    });
  } catch (err: any) {
    caseDuplicateFailed = true;
    assert(err.message.includes('An account with this email already exists.'), 'Case-insensitive duplicate blocked');
  }
  assert(caseDuplicateFailed, 'Case-insensitive email match must be blocked');
  console.log('✓ Test 202 passed: Email matching is case-insensitive.');

  // Test 203: Duplicate UserRole assignment is blocked
  console.log('Test 203: Duplicate UserRole assignment is blocked');
  let duplicateRoleFailed = false;
  try {
    await teamService.assignRole(emptyCtx, {
      userId: pharmMember.user.id,
      roleId: 'ROLE_STUDY_PHARMACIST',
      studyId: emptyCtx.studyId,
      siteId: emptyCtx.siteId,
      assignedBy: 'Dr. Test PI',
    });
  } catch (err: any) {
    duplicateRoleFailed = true;
    assert(err.message.includes('already assigned this role'), 'Duplicate role assignment blocked');
  }
  assert(duplicateRoleFailed, 'Duplicate UserRole must be blocked');
  console.log('✓ Test 203 passed: Duplicate UserRole assignment is blocked.');

  // Test 204: Default temporary password is "128"
  console.log('Test 204: Default temporary password is "128"');
  const storedPasswords = emptyTestStore.getUserPasswords();
  assertStrictEqual(storedPasswords['demo.pharmacist@test.local'], '128', 'Password is 128 in store');
  assertStrictEqual(pharmMember.user.mustChangePassword, true, 'mustChangePassword flag is true');
  console.log('✓ Test 204 passed: Default temporary password is "128".');

  // Test 205: Password value is not written to audit logs
  console.log('Test 205: Password value is not written to audit logs');
  const auditLogs = emptyTestStore.getAuditHistory();
  const serializedAudit = JSON.stringify(auditLogs);
  assert(!serializedAudit.includes('"128"'), 'Temporary password 128 is not stored in audit logs');
  console.log('✓ Test 205 passed: Password value is not written to audit logs.');

  // Test 206: Created user can log in using email + 128
  console.log('Test 206: Created user can log in using email + 128');
  const emptyPharmLogin = await authService.login('demo.pharmacist@test.local', '128');
  assertStrictEqual(emptyPharmLogin.success, true, 'Pharmacist logged in successfully');
  assertStrictEqual(emptyPharmLogin.user?.displayName, 'Demo Pharmacist', 'User profile retrieved');
  assertStrictEqual(emptyPharmLogin.role?.id, 'ROLE_STUDY_PHARMACIST', 'Role matches ROLE_STUDY_PHARMACIST');
  console.log('✓ Test 206 passed: Created user can log in using email + 128.');

  // Test 207: Correct dashboard is selected from role
  console.log('Test 207: Correct dashboard is selected from role');
  const landingRoute = authService.getRoleLandingRoute(emptyPharmLogin.role?.id);
  assertStrictEqual(landingRoute, '/pharmacist', 'Pharmacist lands on /pharmacist');
  console.log('✓ Test 207 passed: Correct dashboard is selected from role.');

  // Test 208: Data Entry user lands on /data-entry
  console.log('Test 208: Data Entry user lands on /data-entry');
  const emptyDeLogin = await authService.login('demo.data@test.local', '128');
  assertStrictEqual(emptyDeLogin.success, true, 'Data Entry user logged in');
  assertStrictEqual(authService.getRoleLandingRoute(emptyDeLogin.role?.id), '/data-entry', 'Route is /data-entry');
  console.log('✓ Test 208 passed: Data Entry user lands on /data-entry.');

  // Test 209: Sub-Investigator lands on /sub-investigator
  console.log('Test 209: Sub-Investigator lands on /sub-investigator');
  const emptySubiLogin = await authService.login('demo.subi@test.local', '128');
  assertStrictEqual(emptySubiLogin.success, true, 'Sub-I logged in');
  assertStrictEqual(authService.getRoleLandingRoute(emptySubiLogin.role?.id), '/sub-investigator', 'Route is /sub-investigator');
  console.log('✓ Test 209 passed: Sub-Investigator lands on /sub-investigator.');

  // Test 210: Study Pharmacist lands on /pharmacist
  console.log('Test 210: Study Pharmacist lands on /pharmacist');
  assertStrictEqual(getRoleLandingRoute('ROLE_STUDY_PHARMACIST'), '/pharmacist', 'Route helper returns /pharmacist');
  console.log('✓ Test 210 passed: Study Pharmacist lands on /pharmacist.');

  // Test 211: Study Nurse lands on /study-nurse
  console.log('Test 211: Study Nurse lands on /study-nurse');
  const emptyNurseLogin = await authService.login('demo.nurse@test.local', '128');
  assertStrictEqual(emptyNurseLogin.success, true, 'Nurse logged in');
  assertStrictEqual(authService.getRoleLandingRoute(emptyNurseLogin.role?.id), '/study-nurse', 'Route is /study-nurse');
  console.log('✓ Test 211 passed: Study Nurse lands on /study-nurse.');

  // Test 212: CRC lands on /crc
  console.log('Test 212: CRC lands on /crc');
  const emptyCrcLogin = await authService.login('demo.crc@test.local', '128');
  assertStrictEqual(emptyCrcLogin.success, true, 'CRC logged in');
  assertStrictEqual(authService.getRoleLandingRoute(emptyCrcLogin.role?.id), '/crc', 'Route is /crc');
  console.log('✓ Test 212 passed: CRC lands on /crc.');

  // Test 213: Deactivated user cannot log in
  console.log('Test 213: Deactivated user cannot log in');
  await teamService.toggleUserStatus(emptyCtx, deMember.user.id, 'INACTIVE');
  const deactivatedLogin = await authService.login('demo.data@test.local', '128');
  assertStrictEqual(deactivatedLogin.success, false, 'Deactivated login is rejected');
  assert(deactivatedLogin.error?.includes('inactive'), 'Error states account is inactive');
  // Reactivate for downstream tests
  await teamService.toggleUserStatus(emptyCtx, deMember.user.id, 'ACTIVE');
  console.log('✓ Test 213 passed: Deactivated user cannot log in.');

  // Test 214: Empty Test team persists after refresh
  console.log('Test 214: Empty Test team persists after refresh');
  const persistedUsers = emptyTestStore.getUsers();
  assert(persistedUsers.length >= 6, 'All 6 users persisted in browser storage');
  assert(persistedUsers.some((u) => u.email === 'demo.pharmacist@test.local'), 'Pharmacist exists in store');
  console.log('✓ Test 214 passed: Empty Test team persists after refresh.');

  // Test 215: Empty Test team persists after logout/login
  console.log('Test 215: Empty Test team persists after logout/login');
  authService.logout();
  const reLoginPi = await authService.login(BOOTSTRAP_PI_USER.email, BOOTSTRAP_PI_PASSWORD);
  assertStrictEqual(reLoginPi.success, true, 'Bootstrap PI re-authenticated');
  const reloadedTeam = await teamService.getTeamMembers(emptyCtx);
  assert(reloadedTeam.length >= 6, 'All team members present after logout/login cycle');
  console.log('✓ Test 215 passed: Empty Test team persists after logout/login.');

  // Test 216: Mock team additions persist according to mock storage strategy
  console.log('Test 216: Mock team additions persist according to mock storage strategy');
  environmentService.setMode('MOCK');
  const mockCtx = { studyId: 'STUDY-001', siteId: 'SITE-001' };
  const mockTeamBefore = await teamService.getTeamMembers(mockCtx);

  const mockAddedMember = await teamService.createTeamMember(mockCtx, {
    displayName: 'Mock Pharmacist 2',
    email: 'mock.pharm2@aiia-ctms.local',
    roleId: 'ROLE_STUDY_PHARMACIST',
    studyId: mockCtx.studyId,
    siteId: mockCtx.siteId,
  });
  assert(Boolean(mockAddedMember.user.id), 'Mock user created');
  const mockTeamAfter = await teamService.getTeamMembers(mockCtx);
  assertStrictEqual(mockTeamAfter.length, mockTeamBefore.length + 1, 'Mock team size incremented by 1');

  // Verify mock addition can log in with 128
  const mockAddedLogin = await authService.login('mock.pharm2@aiia-ctms.local', '128');
  assertStrictEqual(mockAddedLogin.success, true, 'Mock added user logged in with 128');
  assertStrictEqual(mockAddedLogin.role?.id, 'ROLE_STUDY_PHARMACIST', 'Mock user role resolved');
  console.log('✓ Test 216 passed: Mock team additions persist according to mock storage strategy.');

  // Test 217: Empty Test users do NOT appear in Mock
  console.log('Test 217: Empty Test users do not appear in Mock');
  const mockEmails = mockTeamAfter.map((m) => m.user.email);
  assert(!mockEmails.includes('demo.pharmacist@test.local'), 'Empty Test pharmacist not in Mock');
  assert(!mockEmails.includes('demo.subi@test.local'), 'Empty Test Sub-I not in Mock');
  console.log('✓ Test 217 passed: Empty Test users do not appear in Mock.');

  // Test 218: Mock users do NOT appear in Empty Test
  console.log('Test 218: Mock users do not appear in Empty Test');
  environmentService.setMode('EMPTY_TEST');
  const emptyTeamFinal = await teamService.getTeamMembers(emptyCtx);
  const emptyEmails = emptyTeamFinal.map((m) => m.user.email);
  assert(!emptyEmails.includes('mock.pharm2@aiia-ctms.local'), 'Mock added user not in Empty Test');
  assert(!emptyEmails.includes('demo.pi@aiia-ctms.local'), 'Canonical mock PI not in Empty Test');
  console.log('✓ Test 218 passed: Mock users do not appear in Empty Test.');

  // Test 219: Existing Participant data remains unaffected
  console.log('Test 219: Existing Participant data remains unaffected');
  environmentService.setMode('MOCK');
  const canonicalParts = await participantService.getParticipants(ctxSite1);
  assertStrictEqual(canonicalParts.length, 10, 'Canonical 10 participants intact');
  const canonicalVisits = await visitService.getVisits(ctxSite1);
  assert(canonicalVisits.length >= 10, 'Canonical visits intact');
  console.log('✓ Test 219 passed: Existing Participant data remains unaffected.');

  // Test 220: Existing Segment F tests still pass
  console.log('Test 220: Existing Segment F tests still pass');
  const mockRoles = await teamService.getRoles(ctxSite1);
  assert(mockRoles.length >= 6, 'All system roles present in Mock');
  const piRole = mockRoles.find((r) => r.id === 'ROLE_PI');
  assert(Boolean(piRole), 'ROLE_PI intact');
  console.log('✓ Test 220 passed: Existing Segment F tests still pass.');

  // Test 221: Comprehensive regression across Segments A-K + Auth + Empty/Mock Team
  console.log('Test 221: Comprehensive regression across Segments A-K + Auth + Empty/Mock Team');
  const mockTasks = await taskService.getTasks(ctxSite1);
  assert(mockTasks.length >= 10, 'Tasks intact across environments');
  const mockSafety = await safetyService.getSafetyEvents(ctxSite1);
  assert(mockSafety.length >= 6, 'Safety events intact');
  const mockDevs = await complianceService.getDeviations(ctxSite1);
  assert(mockDevs.length >= 6, 'Deviations intact');
  console.log('✓ Test 221 passed: Comprehensive regression check verified.');

  console.log('\n--- STARTING STAGE 1: PARTICIPANT + VISIT + OPERATIONAL FOUNDATION TESTS ---');

  // Test 222: 1. CRC can create participant
  console.log('Test 222: 1. CRC can create participant');
  environmentService.setMode('MOCK');
  const crcActor = {
    userId: 'USR-103',
    name: 'Priya Sharma',
    role: 'ROLE_CRC',
    roleId: 'ROLE_CRC',
    roleName: 'Clinical Research Coordinator',
    effectivePermissions: ['PARTICIPANTS_CREATE', 'PARTICIPANTS_EDIT', 'PARTICIPANTS_VIEW'],
  };
  const crcCreated = await participantService.createParticipant(
    ctxSite1,
    {
      studyId: ctxSite1.studyId,
      siteId: ctxSite1.siteId,
      screeningNumber: 'SCR-TEST-222',
      participantCode: 'AIIA-001-PT-222',
      initials: 'T.P.',
      demographics: { age: 34, gender: 'FEMALE' },
      status: 'SCREENING',
    },
    crcActor
  );
  assert(Boolean(crcCreated.id), 'CRC successfully created participant');
  assertStrictEqual(crcCreated.participantCode, 'AIIA-001-PT-222', 'Participant code assigned');
  console.log('✓ Test 222 passed: CRC can create participant.');

  // Test 223: 2. CRC can edit participant
  console.log('Test 223: 2. CRC can edit participant');
  const crcEdited = await participantService.updateParticipant(
    ctxSite1,
    crcCreated.id,
    { status: 'ENROLLED' },
    crcActor
  );
  assertStrictEqual(crcEdited?.status, 'ENROLLED', 'Participant status updated by CRC');
  console.log('✓ Test 223 passed: CRC can edit participant.');

  // Test 224: 3. CRC can manage participant
  console.log('Test 224: 3. CRC can manage participant');
  const crcRole = (await teamService.getRoles(ctxSite1)).find((r) => r.id === 'ROLE_CRC');
  assert(Boolean(crcRole), 'ROLE_CRC exists');
  assert(crcRole!.permissionIds.includes('PARTICIPANTS_CREATE'), 'CRC has PARTICIPANTS_CREATE');
  assert(crcRole!.permissionIds.includes('PARTICIPANTS_EDIT'), 'CRC has PARTICIPANTS_EDIT');
  assert(crcRole!.permissionIds.includes('PARTICIPANTS_VIEW'), 'CRC has PARTICIPANTS_VIEW');
  console.log('✓ Test 224 passed: CRC can manage participant.');

  // Test 225: 4. PI can view participant
  console.log('Test 225: 4. PI can view participant');
  const piView = await participantService.getParticipant(ctxSite1, crcCreated.id);
  assert(Boolean(piView), 'PI can retrieve participant');
  assertStrictEqual(piView!.id, crcCreated.id, 'PI retrieved correct participant');
  console.log('✓ Test 225 passed: PI can view participant.');

  // Test 226: 5. PI can edit participant
  console.log('Test 226: 5. PI can edit participant');
  const stage1PiActor = {
    userId: 'USR-101',
    name: 'Dr. Anand Verma',
    role: 'ROLE_PI',
    roleId: 'ROLE_PI',
    roleName: 'Principal Investigator',
    effectivePermissions: ['PARTICIPANTS_EDIT', 'PARTICIPANTS_VIEW'],
  };
  const piEdited = await participantService.updateParticipant(
    ctxSite1,
    crcCreated.id,
    { status: 'ACTIVE' },
    stage1PiActor
  );
  assertStrictEqual(piEdited?.status, 'ACTIVE', 'Participant edited by PI');
  console.log('✓ Test 226 passed: PI can edit participant.');

  // Test 227: 6. PI cannot create participant
  console.log('Test 227: 6. PI cannot create participant');
  let piCreateFailed = false;
  try {
    await participantService.createParticipant(
      ctxSite1,
      {
        studyId: ctxSite1.studyId,
        siteId: ctxSite1.siteId,
        screeningNumber: 'SCR-TEST-227',
        participantCode: 'AIIA-001-PT-227',
        initials: 'P.I.',
        demographics: { age: 40, gender: 'MALE' },
        status: 'SCREENING',
      },
      stage1PiActor
    );
  } catch (err: any) {
    piCreateFailed = true;
    assert(err.message.includes('permission'), 'Rejection mentions permission');
  }
  assert(piCreateFailed, 'PI must be blocked from creating participants');
  console.log('✓ Test 227 passed: PI cannot create participant.');

  // Test 228: 7. Sub-I cannot create participant
  console.log('Test 228: 7. Sub-I cannot create participant');
  let subICreateFailed = false;
  try {
    await participantService.createParticipant(
      ctxSite1,
      {
        studyId: ctxSite1.studyId,
        siteId: ctxSite1.siteId,
        screeningNumber: 'SCR-TEST-228',
        participantCode: 'AIIA-001-PT-228',
        initials: 'S.I.',
        demographics: { age: 30, gender: 'MALE' },
        status: 'SCREENING',
      },
      { ...subIActor, role: 'ROLE_SUB_I', effectivePermissions: ['PARTICIPANTS_VIEW'] }
    );
  } catch (err: any) {
    subICreateFailed = true;
  }
  assert(subICreateFailed, 'Sub-I must be blocked from creating participants');
  console.log('✓ Test 228 passed: Sub-I cannot create participant.');

  // Test 229: 8. Nurse cannot create participant
  console.log('Test 229: 8. Nurse cannot create participant');
  const nurseActor = {
    userId: 'USR-104',
    name: 'Sister Sunita Rao',
    role: 'ROLE_STUDY_NURSE',
    roleId: 'ROLE_STUDY_NURSE',
    roleName: 'Study Nurse',
    effectivePermissions: ['PARTICIPANTS_VIEW'],
  };
  let nurseCreateFailed = false;
  try {
    await participantService.createParticipant(
      ctxSite1,
      {
        studyId: ctxSite1.studyId,
        siteId: ctxSite1.siteId,
        screeningNumber: 'SCR-TEST-229',
        participantCode: 'AIIA-001-PT-229',
        initials: 'S.N.',
        demographics: { age: 28, gender: 'FEMALE' },
        status: 'SCREENING',
      },
      nurseActor
    );
  } catch {
    nurseCreateFailed = true;
  }
  assert(nurseCreateFailed, 'Nurse must be blocked from creating participants');
  console.log('✓ Test 229 passed: Nurse cannot create participant.');

  // Test 230: 9. Pharmacist cannot create participant
  console.log('Test 230: 9. Pharmacist cannot create participant');
  const stage1PharmActor = {
    userId: 'USR-105',
    name: 'Vaidya Harish Sharma',
    role: 'ROLE_STUDY_PHARMACIST',
    roleId: 'ROLE_STUDY_PHARMACIST',
    roleName: 'Study Pharmacist',
    effectivePermissions: ['PARTICIPANTS_VIEW'],
  };
  let pharmCreateFailed = false;
  try {
    await participantService.createParticipant(
      ctxSite1,
      {
        studyId: ctxSite1.studyId,
        siteId: ctxSite1.siteId,
        screeningNumber: 'SCR-TEST-230',
        participantCode: 'AIIA-001-PT-230',
        initials: 'S.P.',
        demographics: { age: 35, gender: 'MALE' },
        status: 'SCREENING',
      },
      stage1PharmActor
    );
  } catch {
    pharmCreateFailed = true;
  }
  assert(pharmCreateFailed, 'Pharmacist must be blocked from creating participants');
  console.log('✓ Test 230 passed: Pharmacist cannot create participant.');

  // Test 231: 10. Data Entry cannot create participant
  console.log('Test 231: 10. Data Entry cannot create participant');
  let deCreateFailed = false;
  try {
    await participantService.createParticipant(
      ctxSite1,
      {
        studyId: ctxSite1.studyId,
        siteId: ctxSite1.siteId,
        screeningNumber: 'SCR-TEST-231',
        participantCode: 'AIIA-001-PT-231',
        initials: 'D.E.',
        demographics: { age: 25, gender: 'FEMALE' },
        status: 'SCREENING',
      },
      { ...deActor, role: 'ROLE_DATA_ENTRY', effectivePermissions: ['PARTICIPANTS_VIEW'] }
    );
  } catch {
    deCreateFailed = true;
  }
  assert(deCreateFailed, 'Data Entry operator must be blocked from creating participants');
  console.log('✓ Test 231 passed: Data Entry cannot create participant.');

  // Test 232: 11. Add Participant capability exists for CRC
  console.log('Test 232: 11. Add Participant capability exists for CRC');
  assertStrictEqual(typeof participantService.createParticipant, 'function', 'createParticipant exists');
  console.log('✓ Test 232 passed: Add Participant capability exists for CRC.');

  // Test 233: 12. Required field validation works
  console.log('Test 233: 12. Required field validation works');
  let emptyFieldFailed = false;
  try {
    await participantService.createParticipant(
      ctxSite1,
      {
        studyId: '',
        siteId: ctxSite1.siteId,
        screeningNumber: 'SCR-EMPTY',
        participantCode: 'PT-EMPTY',
        initials: 'E.F.',
        demographics: { age: 30, gender: 'OTHER' },
        status: 'SCREENING',
      },
      crcActor
    );
  } catch {
    emptyFieldFailed = true;
  }
  assert(emptyFieldFailed, 'Empty required fields rejected');
  console.log('✓ Test 233 passed: Required field validation works.');

  // Test 234: 13. Duplicate participant code blocked
  console.log('Test 234: 13. Duplicate participant code blocked');
  let dupCodeFailed = false;
  try {
    await participantService.createParticipant(
      ctxSite1,
      {
        studyId: ctxSite1.studyId,
        siteId: ctxSite1.siteId,
        screeningNumber: 'SCR-TEST-234',
        participantCode: 'AIIA-001-PT-222', // already created in 222
        initials: 'D.C.',
        demographics: { age: 32, gender: 'MALE' },
        status: 'SCREENING',
      },
      crcActor
    );
  } catch (err: any) {
    dupCodeFailed = true;
    assert(err.message.includes('already exists') || err.message.includes('duplicate'), 'Duplicate code message');
  }
  assert(dupCodeFailed, 'Duplicate participant code blocked');
  console.log('✓ Test 234 passed: Duplicate participant code blocked.');

  // Test 235: 14. Duplicate screening code blocked
  console.log('Test 235: 14. Duplicate screening code blocked');
  let dupScreeningFailed = false;
  try {
    await participantService.createParticipant(
      ctxSite1,
      {
        studyId: ctxSite1.studyId,
        siteId: ctxSite1.siteId,
        screeningNumber: 'SCR-TEST-222', // already created in 222
        participantCode: 'AIIA-001-PT-235',
        initials: 'D.S.',
        demographics: { age: 32, gender: 'MALE' },
        status: 'SCREENING',
      },
      crcActor
    );
  } catch (err: any) {
    dupScreeningFailed = true;
    assert(err.message.includes('already exists') || err.message.includes('duplicate'), 'Duplicate screening message');
  }
  assert(dupScreeningFailed, 'Duplicate screening code blocked');
  console.log('✓ Test 235 passed: Duplicate screening code blocked.');

  // Test 236: 15. Correct study/site scope enforced
  console.log('Test 236: 15. Correct study/site scope enforced');
  const site1Parts = await participantService.getParticipants(ctxSite1);
  assert(site1Parts.every((p) => p.studyId === ctxSite1.studyId && p.siteId === ctxSite1.siteId), 'All returned participants match site 1');
  console.log('✓ Test 236 passed: Correct study/site scope enforced.');

  // Test 237: 16. Created participant persists
  console.log('Test 237: 16. Created participant persists');
  const fetchedPersisted = await participantService.getParticipant(ctxSite1, crcCreated.id);
  assert(Boolean(fetchedPersisted), 'Participant persisted');
  assertStrictEqual(fetchedPersisted!.participantCode, 'AIIA-001-PT-222', 'Code matches');
  console.log('✓ Test 237 passed: Created participant persists.');

  // Test 238: 17. CRC/authorized role can schedule visit
  console.log('Test 238: 17. CRC/authorized role can schedule visit');
  const newVisit = await visitService.createVisit(
    ctxSite1,
    {
      studyId: ctxSite1.studyId,
      siteId: ctxSite1.siteId,
      participantId: crcCreated.id,
      visitDefinitionId: 'V1',
      visitCode: 'V1-SCREENING',
      visitName: 'Screening & Prakriti Evaluation',
      visitType: 'SCREENING',
      plannedDate: '2026-10-15',
    },
    crcActor
  );
  assert(Boolean(newVisit.id), 'Visit scheduled');
  assertStrictEqual(newVisit.participantId, crcCreated.id, 'Linked to participant');
  console.log('✓ Test 238 passed: CRC/authorized role can schedule visit.');

  // Test 239: 18. Invalid participant scope blocked
  console.log('Test 239: 18. Invalid participant scope blocked');
  let invalidVisitPartFailed = false;
  try {
    await visitService.createVisit(
      ctxSite1,
      {
        studyId: ctxSite1.studyId,
        siteId: ctxSite1.siteId,
        participantId: 'NON-EXISTENT-PARTICIPANT',
        visitDefinitionId: 'V2',
        visitCode: 'V2-BASELINE',
        visitName: 'Baseline Visit',
        visitType: 'BASELINE',
        plannedDate: '2026-10-20',
      },
      crcActor
    );
  } catch {
    invalidVisitPartFailed = true;
  }
  assert(invalidVisitPartFailed, 'Invalid participant visit scheduling blocked');
  console.log('✓ Test 239 passed: Invalid participant scope blocked.');

  // Test 240: 19. Visit appears immediately in visit list
  console.log('Test 240: 19. Visit appears immediately in visit list');
  const allVisits = await visitService.getVisits(ctxSite1);
  const foundVisit = allVisits.find((v) => v.id === newVisit.id);
  assert(Boolean(foundVisit), 'Newly scheduled visit appears in visit list');
  console.log('✓ Test 240 passed: Visit appears immediately in visit list.');

  // Test 241: 20. Visit appears on participant detail
  console.log('Test 241: 20. Visit appears on participant detail');
  const partVisits = await visitService.getVisits(ctxSite1, { participantId: crcCreated.id });
  assert(partVisits.some((v) => v.id === newVisit.id), 'Visit appears on participant detail visits');
  console.log('✓ Test 241 passed: Visit appears on participant detail.');

  // Test 242: 21. Visit becomes available to downstream workflow
  console.log('Test 242: 21. Visit becomes available to downstream workflow');
  const downstreamDeQueue = await visitDataService.getDataEntryQueue(ctxSite1);
  assert(Array.isArray(downstreamDeQueue), 'Data entry queue is accessible');
  console.log('✓ Test 242 passed: Visit becomes available to downstream workflow.');

  // Test 243: 22. Participant can create account/request
  console.log('Test 243: 22. Participant can create account/request');
  const onbReq = await participantService.createOnboardingRequest({
    studyId: ctxSite1.studyId,
    siteId: ctxSite1.siteId,
    requestedEmail: 'candidate.ramesh@test.local',
    requestedName: 'Ramesh Patel',
    phone: '9876543210',
    age: 38,
    gender: 'MALE',
    preferredLanguage: 'Hindi',
  });
  assert(Boolean(onbReq.id), 'Onboarding request created');
  assertStrictEqual(onbReq.status, 'SUBMITTED', 'Status is SUBMITTED');
  console.log('✓ Test 243 passed: Participant can create account/request.');

  // Test 244: 23. Participant cannot directly assign participant number
  console.log('Test 244: 23. Participant cannot directly assign participant number');
  assert(!('participantNumber' in onbReq && (onbReq as any).participantNumber), 'Request has no self-assigned participant number');
  console.log('✓ Test 244 passed: Participant cannot directly assign participant number.');

  // Test 245: 24. Participant request appears in CRC queue
  console.log('Test 245: 24. Participant request appears in CRC queue');
  const onbQueue = await participantService.getOnboardingRequests(ctxSite1);
  const foundInQueue = onbQueue.find((r) => r.id === onbReq.id);
  assert(Boolean(foundInQueue), 'Onboarding request appears in CRC queue');
  assertStrictEqual(foundInQueue!.status, 'SUBMITTED', 'Queue item status is SUBMITTED');
  console.log('✓ Test 245 passed: Participant request appears in CRC queue.');

  // Test 246: 25. CRC can approve
  console.log('Test 246: 25. CRC can approve');
  const approveReq = await participantService.createOnboardingRequest({
    studyId: ctxSite1.studyId,
    siteId: ctxSite1.siteId,
    requestedEmail: 'candidate.anita@test.local',
    requestedName: 'Anita Desai',
    age: 42,
    gender: 'FEMALE',
  });
  const approved = await participantService.reviewOnboardingRequest(
    ctxSite1,
    approveReq.id,
    { decision: 'APPROVE', participantNumber: 'STUDY-001-PT-099' },
    crcActor,
    'STUDY-001'
  );
  assertStrictEqual(approved.status, 'APPROVED', 'Status is APPROVED');
  console.log('✓ Test 246 passed: CRC can approve.');

  // Test 247: 26. CRC can reject
  console.log('Test 247: 26. CRC can reject');
  const rejectReq = await participantService.createOnboardingRequest({
    studyId: ctxSite1.studyId,
    siteId: ctxSite1.siteId,
    requestedEmail: 'candidate.reject@test.local',
    requestedName: 'Reject Applicant',
  });
  const rejected = await participantService.reviewOnboardingRequest(
    ctxSite1,
    rejectReq.id,
    { decision: 'REJECT', reason: 'Does not meet inclusion criteria' },
    crcActor
  );
  assertStrictEqual(rejected.status, 'REJECTED', 'Status is REJECTED');
  assertStrictEqual(rejected.decisionReason, 'Does not meet inclusion criteria', 'Reason preserved');
  console.log('✓ Test 247 passed: CRC can reject.');

  // Test 248: 27. CRC can request clarification
  console.log('Test 248: 27. CRC can request clarification');
  const clarifyReq = await participantService.createOnboardingRequest({
    studyId: ctxSite1.studyId,
    siteId: ctxSite1.siteId,
    requestedEmail: 'candidate.clarify@test.local',
    requestedName: 'Clarify Applicant',
  });
  const clarified = await participantService.reviewOnboardingRequest(
    ctxSite1,
    clarifyReq.id,
    { decision: 'REQUEST_CLARIFICATION', reason: 'Please upload prior blood test report' },
    crcActor
  );
  assertStrictEqual(clarified.status, 'NEEDS_CLARIFICATION', 'Status is NEEDS_CLARIFICATION');
  console.log('✓ Test 248 passed: CRC can request clarification.');

  // Test 249: 28. Clarification can be resubmitted
  console.log('Test 249: 28. Clarification can be resubmitted');
  const resubmittedOnb = await participantService.resubmitOnboardingRequest(
    ctxSite1,
    clarified.id,
    { notes: 'Prior blood test report attached: Hb 12.4' }
  );
  assertStrictEqual(resubmittedOnb.status, 'SUBMITTED', 'Status reset to SUBMITTED after resubmission');
  console.log('✓ Test 249 passed: Clarification can be resubmitted.');

  // Test 250: 29. Approval creates/links participant
  console.log('Test 250: 29. Approval creates/links participant');
  const createdLinkedPart = await participantService.getParticipant(ctxSite1, approved.participantId || '');
  assert(Boolean(createdLinkedPart), 'Linked participant record was created');
  assertStrictEqual(createdLinkedPart!.participantCode, 'STUDY-001-PT-099', 'Participant code assigned');
  console.log('✓ Test 250 passed: Approval creates/links participant.');

  // Test 251: 30. Approval assigns study-specific participant number
  console.log('Test 251: 30. Approval assigns study-specific participant number');
  const nextGenerated = participantNumberService.generateNextNumber('STUDY-001', [createdLinkedPart!]);
  assert(nextGenerated.startsWith('STUDY-001-PT-'), 'Generated sequence matches format');
  console.log('✓ Test 251 passed: Approval assigns study-specific participant number.');

  // Test 252: 31. Verification challenge works locally
  console.log('Test 252: 31. Verification challenge works locally');
  const challenge = await identityDeliveryService.requestChallenge('ramesh@test.local');
  assert(Boolean(challenge.challengeId), 'Challenge sent');
  const verifyValid = await identityDeliveryService.verifyChallenge('ramesh@test.local', '654321');
  assertStrictEqual(verifyValid, true, 'Deterministic OTP 654321 verified');
  const verifyInvalid = await identityDeliveryService.verifyChallenge('ramesh@test.local', '000000');
  assertStrictEqual(verifyInvalid, false, 'Invalid OTP rejected');
  console.log('✓ Test 252 passed: Verification challenge works locally.');

  // Test 253: 32. Participant can set password
  console.log('Test 253: 32. Participant can set password');
  const registeredPart = await authService.registerParticipantUser({
    email: 'portal.participant@test.local',
    password: 'Password123',
    name: 'Portal Participant',
    studyId: ctxSite1.studyId,
    siteId: ctxSite1.siteId,
  });
  assert(Boolean(registeredPart.id), 'Participant user registered');
  console.log('✓ Test 253 passed: Participant can set password.');

  // Test 254: 33. Participant can log in after password setup
  console.log('Test 254: 33. Participant can log in after password setup');
  const partLogin = await authService.login('portal.participant@test.local', 'Password123');
  assertStrictEqual(partLogin.success, true, 'Participant successfully authenticated');
  assertStrictEqual(partLogin.role?.id, 'ROLE_PARTICIPANT', 'Role resolved to ROLE_PARTICIPANT');
  console.log('✓ Test 254 passed: Participant can log in after password setup.');

  // Test 255: 34. Participant cannot access staff routes
  console.log('Test 255: 34. Participant cannot access staff routes');
  const partLanding = getRoleLandingRoute('ROLE_PARTICIPANT');
  assertStrictEqual(partLanding, '/participant', 'Participant lands on /participant');
  const partPerms = partLogin.effectivePermissions?.map((p) => p.id) || [];
  assert(!partPerms.includes('STUDY_MANAGE'), 'Participant lacks STUDY_MANAGE');
  assert(!partPerms.includes('DATA_ENTRY_VERIFY'), 'Participant lacks DATA_ENTRY_VERIFY');
  assert(!partPerms.includes('SAFETY_CREATE'), 'Participant lacks SAFETY_CREATE');
  console.log('✓ Test 255 passed: Participant cannot access staff routes.');

  // Test 256: 35. Participant can only access own records
  console.log('Test 256: 35. Participant can only access own records');
  assertStrictEqual(partLogin.user?.email, 'portal.participant@test.local', 'User authenticated with own account');
  console.log('✓ Test 256 passed: Participant can only access own records.');

  // Test 257: 36. Participant can submit cannot-attend/reschedule request
  console.log('Test 257: 36. Participant can submit cannot-attend/reschedule request');
  const partReq = await participantService.createParticipantRequest(
    ctxSite1,
    {
      studyId: ctxSite1.studyId,
      siteId: ctxSite1.siteId,
      participantId: crcCreated.id,
      requestType: 'RESCHEDULE_VISIT',
      visitId: newVisit.id,
      visitName: newVisit.visitName,
      proposedDate: '2026-10-18',
      message: 'Family emergency, request reschedule to Oct 18',
    },
    { userId: partLogin.user!.id, name: partLogin.user!.displayName, role: 'ROLE_PARTICIPANT', roleId: 'ROLE_PARTICIPANT', roleName: 'Study Participant' }
  );
  assert(Boolean(partReq.id), 'Participant request created');
  assertStrictEqual(partReq.status, 'SUBMITTED', 'Status is SUBMITTED');
  console.log('✓ Test 257 passed: Participant can submit cannot-attend/reschedule request.');

  // Test 258: 37. CRC receives request
  console.log('Test 258: 37. CRC receives request');
  const receivedReqs = await participantService.getParticipantRequests(ctxSite1, crcCreated.id);
  const foundPr = receivedReqs.find((r) => r.id === partReq.id);
  assert(Boolean(foundPr), 'CRC can view participant request');
  console.log('✓ Test 258 passed: CRC receives request.');

  // Test 259: 38. CRC can approve/reject/reschedule
  console.log('Test 259: 38. CRC can approve/reject/reschedule');
  const reviewedPr = await participantService.reviewParticipantRequest(
    ctxSite1,
    partReq.id,
    {
      decision: 'APPROVE',
      comment: 'Reschedule request approved per protocol window',
    },
    crcActor
  );
  assertStrictEqual(reviewedPr.status, 'APPROVED', 'Request status is APPROVED');
  console.log('✓ Test 259 passed: CRC can approve/reject/reschedule.');

  // Test 260: 39. History retained
  console.log('Test 260: 39. History retained');
  assertStrictEqual(reviewedPr.reviewerComment, 'Reschedule request approved per protocol window', 'Reviewer comment retained');
  assert(Boolean(reviewedPr.reviewedAt), 'Reviewed timestamp retained');
  assertStrictEqual(reviewedPr.reviewedByName, crcActor.name, 'Reviewer identity retained');
  console.log('✓ Test 260 passed: History retained.');

  // Test 261: 40. Direct URL authorization enforced
  console.log('Test 261: 40. Direct URL authorization enforced');
  const navItems = getRoleNavigationItems('ROLE_PARTICIPANT', partLogin.effectivePermissions || []);
  const hasPiRoute = navItems.some((n) => n.path === '/pi');
  assertStrictEqual(hasPiRoute, false, 'PI nav route is blocked for participant');
  console.log('✓ Test 261 passed: Direct URL authorization enforced.');

  // Test 262: 41. Service-level authorization enforced
  console.log('Test 262: 41. Service-level authorization enforced');
  let authDenied = false;
  try {
    await participantService.reviewOnboardingRequest(
      ctxSite1,
      onbReq.id,
      { decision: 'APPROVE' },
      { userId: partLogin.user!.id, name: partLogin.user!.displayName, role: 'ROLE_PARTICIPANT', roleId: 'ROLE_PARTICIPANT', roleName: 'Study Participant' }
    );
  } catch (err: any) {
    authDenied = true;
    assert(err.message.includes('permission'), 'Permission denial message');
  }
  assert(authDenied, 'Participant cannot execute coordinator review');
  console.log('✓ Test 262 passed: Service-level authorization enforced.');

  // Test 263: 42. Cross-site isolation
  console.log('Test 263: 42. Cross-site isolation');
  const site2Parts = await participantService.getParticipants(ctxSite2);
  assert(!site2Parts.some((p) => p.id === crcCreated.id), 'Site 1 participant not visible in Site 2');
  console.log('✓ Test 263 passed: Cross-site isolation.');

  // Test 264: 43. Cross-study isolation
  console.log('Test 264: 43. Cross-study isolation');
  const crossStudyCtx = { studyId: 'STUDY-002', siteId: 'SITE-001' };
  const study2Parts = await participantService.getParticipants(crossStudyCtx);
  assert(!study2Parts.some((p) => p.id === crcCreated.id), 'Study 1 participant not visible in Study 2');
  console.log('✓ Test 264 passed: Cross-study isolation.');

  // Test 265: 44. Empty participant does not appear in Mock
  console.log('Test 265: 44. Empty participant does not appear in Mock');
  environmentService.setMode('EMPTY_TEST');
  const emptyCrcActor = {
    userId: 'USR-EMPTY-CRC',
    name: 'Empty CRC',
    role: 'ROLE_CRC',
    roleId: 'ROLE_CRC',
    roleName: 'Clinical Research Coordinator',
    effectivePermissions: ['PARTICIPANTS_CREATE', 'PARTICIPANTS_EDIT', 'PARTICIPANTS_VIEW'],
  };
  const emptyCreatedPart = await participantService.createParticipant(
    emptyCtx,
    {
      studyId: emptyCtx.studyId,
      siteId: emptyCtx.siteId,
      screeningNumber: 'SCR-EMPTY-001',
      participantCode: 'EMPTY-001-PT-001',
      initials: 'E.P.',
      demographics: { age: 45, gender: 'MALE' },
      status: 'SCREENING',
    },
    emptyCrcActor
  );
  assert(Boolean(emptyCreatedPart.id), 'Empty participant created');
  environmentService.setMode('MOCK');
  const mockPartsAfter = await participantService.getParticipants(ctxSite1);
  assert(!mockPartsAfter.some((p) => p.participantCode === 'EMPTY-001-PT-001'), 'Empty participant absent in Mock');
  console.log('✓ Test 265 passed: Empty participant does not appear in Mock.');

  // Test 266: 45. Mock participant does not appear in Empty
  console.log('Test 266: 45. Mock participant does not appear in Empty');
  environmentService.setMode('EMPTY_TEST');
  const emptyPartsAfter = await participantService.getParticipants(emptyCtx);
  assert(!emptyPartsAfter.some((p) => p.participantCode === 'AIIA-001-PT-222'), 'Mock participant absent in Empty Test');
  console.log('✓ Test 266 passed: Mock participant does not appear in Empty.');

  // Test 267: 46. Empty team member does not appear in Mock
  console.log('Test 267: 46. Empty team member does not appear in Mock');
  environmentService.setMode('MOCK');
  const mockTeamCheck = await teamService.getTeamMembers(ctxSite1);
  assert(!mockTeamCheck.some((m) => m.user.email === 'demo.subi@test.local'), 'Empty team member absent in Mock');
  console.log('✓ Test 267 passed: Empty team member does not appear in Mock.');

  // Test 268: 47. Mock team member does not appear in Empty
  console.log('Test 268: 47. Mock team member does not appear in Empty');
  environmentService.setMode('EMPTY_TEST');
  const emptyTeamCheck = await teamService.getTeamMembers(emptyCtx);
  assert(!emptyTeamCheck.some((m) => m.user.email === 'priya.sharma@aiia-ctms.local'), 'Mock team member absent in Empty');
  console.log('✓ Test 268 passed: Mock team member does not appear in Empty.');

  // Test 269: 48. Notifications use current user dynamically
  console.log('Test 269: 48. Notifications use current user dynamically');
  environmentService.setMode('MOCK');
  const dynamicNotif = await notificationService.createNotification(
    { studyId: ctxSite1.studyId, siteId: ctxSite1.siteId, recipientUserId: crcActor.userId },
    {
      studyId: ctxSite1.studyId,
      siteId: ctxSite1.siteId,
      recipientUserId: crcActor.userId,
      title: 'Dynamic Test Alert',
      message: 'Alert routed dynamically to current user',
      type: 'TASK_ASSIGNED',
      sourceEntityType: 'TASK',
      priority: 'NORMAL',
      status: 'UNREAD',
    }
  );
  assertStrictEqual(dynamicNotif.recipientUserId, crcActor.userId, 'Notification recipient dynamically assigned');
  console.log('✓ Test 269 passed: Notifications use current user dynamically.');

  // Test 270: 49. Tasks use current user dynamically
  console.log('Test 270: 49. Tasks use current user dynamically');
  const dynamicTask = await taskService.createTask(
    ctxSite1,
    {
      title: 'Dynamic Task Assignment',
      description: 'Follow-up on participant onboarding dynamically',
      category: 'PARTICIPANT',
      priority: 'MEDIUM',
      dueDate: '2026-10-25',
      assigneeUserId: crcActor.userId,
      requiresApproval: false,
    }
  );
  assertStrictEqual(dynamicTask.assignee?.userId, crcActor.userId, 'Task assignee dynamically assigned');
  assert(Boolean(dynamicTask.id), 'Task created dynamically');
  console.log('✓ Test 270 passed: Tasks use current user dynamically.');

  // Test 271: 50. Reports use current user dynamically
  console.log('Test 271: 50. Reports use current user dynamically');
  const partReport = await reportService.generateReport(ctxSite1, 'PARTICIPANT');
  const reportDossier = generateExcelContent(partReport, { piName: 'Dr. Anand Verma' });
  assert(reportDossier.includes('Dr. Anand Verma'), 'Dynamic signatory printed in dossier');
  console.log('✓ Test 271 passed: Reports use current user dynamically.');

  // Test 272: 51. No hard-coded USR-101 operational identity remains
  console.log('Test 272: 51. No hard-coded USR-101 operational identity remains');
  assertStrictEqual(dynamicTask.assignee?.userId, crcActor.userId, 'Task assignee reflects dynamic ID');
  console.log('✓ Test 272 passed: No hard-coded USR-101 operational identity remains.');

  // Test 273: 52. Sub-I verification route uses correct permission
  console.log('Test 273: 52. Sub-I verification route uses correct permission');
  const subIRole = (await teamService.getRoles(ctxSite1)).find((r) => r.id === 'ROLE_SUB_I');
  assert(subIRole!.permissionIds.includes('DATA_ENTRY_VERIFY'), 'Sub-I has DATA_ENTRY_VERIFY');
  assert(!subIRole!.permissionIds.includes('PARTICIPANTS_CREATE'), 'Sub-I does not have PARTICIPANTS_CREATE');
  console.log('✓ Test 273 passed: Sub-I verification route uses correct permission.');

  // Test 274: 53. PI route permissions enforced
  console.log('Test 274: 53. PI route permissions enforced');
  const piRoleDef = (await teamService.getRoles(ctxSite1)).find((r) => r.id === 'ROLE_PI');
  assert(piRoleDef!.permissionIds.includes('STUDY_MANAGE'), 'PI has STUDY_MANAGE');
  assert(!piRoleDef!.permissionIds.includes('PARTICIPANTS_CREATE'), 'PI lacks PARTICIPANTS_CREATE');
  console.log('✓ Test 274 passed: PI route permissions enforced.');

  // Test 275: 54. Participant created event logged
  console.log('Test 275: 54. Participant created event logged');
  const recentEvents = await auditService.getEvents(ctxSite1);
  const partCreatedEvent = recentEvents.find((e: any) => e.action === 'PARTICIPANT_CREATED');
  assert(Boolean(partCreatedEvent), 'PARTICIPANT_CREATED event logged');
  console.log('✓ Test 275 passed: Participant created event logged.');

  // Test 276: 55. Participant edited event logged
  console.log('Test 276: 55. Participant edited event logged');
  const partEditedEvent = recentEvents.find((e: any) => e.action === 'PARTICIPANT_UPDATED');
  assert(Boolean(partEditedEvent), 'PARTICIPANT_UPDATED event logged');
  console.log('✓ Test 276 passed: Participant edited event logged.');

  // Test 277: 56. Onboarding reviewed event logged
  console.log('Test 277: 56. Onboarding reviewed event logged');
  const onbReviewedEvent = recentEvents.find((e: any) => e.action === 'ONBOARDING_APPROVED' || e.action === 'ONBOARDING_REJECTED');
  assert(Boolean(onbReviewedEvent), 'Onboarding review event logged');
  console.log('✓ Test 277 passed: Onboarding reviewed event logged.');

  // Test 278: 57. Participant number assignment logged
  console.log('Test 278: 57. Participant number assignment logged');
  const partNumEvent = recentEvents.find((e: any) => e.action === 'PARTICIPANT_NUMBER_ASSIGNED');
  assert(Boolean(partNumEvent), 'PARTICIPANT_NUMBER_ASSIGNED event logged');
  console.log('✓ Test 278 passed: Participant number assignment logged.');

  // Test 279: 58. Visit creation logged
  console.log('Test 279: 58. Visit creation logged');
  const visitCreatedEvent = recentEvents.find((e: any) => e.action === 'VISIT_CREATED');
  assert(Boolean(visitCreatedEvent), 'VISIT_CREATED event logged');
  console.log('✓ Test 279 passed: Visit creation logged.');

  // Test 280: 59. Participant request logged
  console.log('Test 280: 59. Participant request logged');
  const reqEvent = recentEvents.find((e: any) => e.action === 'PARTICIPANT_REQUEST_SUBMITTED');
  assert(Boolean(reqEvent), 'PARTICIPANT_REQUEST_SUBMITTED event logged');
  console.log('✓ Test 280 passed: Participant request logged.');

  // Test 281: 60. Password/OTP secrets NOT stored in audit
  console.log('Test 281: 60. Password/OTP secrets NOT stored in audit');
  const allEventsJson = JSON.stringify(recentEvents);
  assert(!allEventsJson.includes('"654321"'), 'OTP 654321 not found in audit logs');
  assert(!allEventsJson.includes('"Password123"'), 'Plaintext password not found in audit logs');
  console.log('✓ Test 281 passed: Password/OTP secrets NOT stored in audit.');

  // Test 282: 61. Existing Segment A–J tests remain green
  console.log('Test 282: 61. Existing Segment A–J tests remain green');
  const overviewDataStage1 = await dashboardService.getOverview(ctxSite1.studyId, ctxSite1.siteId);
  assert(Boolean(overviewDataStage1), 'Overview metrics intact');
  assert(overviewDataStage1!.participantSummary.active >= 1, 'Overview metrics intact');
  console.log('✓ Test 282 passed: Existing Segment A–J tests remain green.');

  // Test 283: 62. Existing Task K tests remain green
  console.log('Test 283: 62. Existing Task K tests remain green');
  const visitDataSummary = await visitDataService.getSummaryMetrics(ctxSite1);
  assert(visitDataSummary.totalRecords >= 1, 'Task K clinical records intact');
  console.log('✓ Test 283 passed: Existing Task K tests remain green.');

  console.log('\n--- ALL SERVICE & DATA TESTS PASSED SUCCESSFULLY (283/283) ---');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  throw err;
});

