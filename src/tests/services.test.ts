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
import { authService } from '../services/authService';
import { browserStorage, SESSION_STORAGE_KEY } from '../storage/browserStorage';
import { getRoleLandingRoute, getRoleNavigationItems } from '../config/navigationConfig';

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
  assertStrictEqual(systemRoles.length, 6, 'Must have 6 system roles');
  const customRoles = await teamService.getRoles(ctxSite1, { roleType: 'CUSTOM' });
  assert(customRoles.length >= 2, 'Must have at least 2 custom roles');
  const searchRoles = await teamService.getRoles(ctxSite1, { search: 'Pharmacist' });
  assertStrictEqual(searchRoles.length, 1, 'Search for Pharmacist must return exactly 1 role');
  assertStrictEqual(searchRoles[0].id, 'ROLE_STUDY_PHARMACIST');
  console.log('✓ Test 54 passed: Role retrieval verified.');

  // Test 55: Permission catalog retrieval and grouping
  console.log('Test 55: Permission retrieval and grouping');
  const permissions = await teamService.getPermissions();
  assertStrictEqual(permissions.length, 24, 'Permission catalog must contain exactly 24 permissions');
  const groupedPerms = teamService.groupPermissionsByModule(permissions);
  const modules = Object.keys(groupedPerms);
  assertStrictEqual(modules.length, 9, 'Permissions must be grouped across 9 modules');
  assert(Boolean(groupedPerms['STUDY']), 'STUDY module must exist');
  assert(Boolean(groupedPerms['PARTICIPANTS']), 'PARTICIPANTS module must exist');
  assert(Boolean(groupedPerms['SAFETY']), 'SAFETY module must exist');
  assert(Boolean(groupedPerms['COMPLIANCE']), 'COMPLIANCE module must exist');
  console.log('✓ Test 55 passed: Permission retrieval verified.');

  // Test 56: Effective permission calculation
  console.log('Test 56: Effective permission calculation');
  const piPerms = await teamService.getEffectivePermissions(ctxSite1, 'USR-101');
  assertStrictEqual(piPerms.length, 24, 'PI must have all 24 effective permissions');
  const dePerms = await teamService.getEffectivePermissions(ctxSite1, 'USR-106');
  assertStrictEqual(dePerms.length, 5, 'Data Entry Operator must have 5 effective permissions');
  const permIdSet = new Set(piPerms.map((p) => p.id));
  assertStrictEqual(permIdSet.size, piPerms.length, 'Effective permissions must not contain duplicate IDs');
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
  assertStrictEqual(teamMetrics.systemRolesCount, 6, 'System roles should be 6');
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
  assert(dataPerms.includes('PARTICIPANTS_EDIT'), 'Data Entry must have PARTICIPANTS_EDIT');
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

  console.log('\n--- ALL SERVICE & DATA TESTS PASSED SUCCESSFULLY (161/161) ---');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  throw err;
});

