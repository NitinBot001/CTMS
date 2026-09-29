import { studyService } from '../services/studyService';
import { dashboardService } from '../services/dashboardService';
import { participantService } from '../services/participantService';
import { visitService } from '../services/visitService';
import { safetyService } from '../services/safetyService';
import { complianceService } from '../services/complianceService';
import {
  calculateVisitWindow,
  deriveVisitStatus,
  calculateActivityMetrics,
} from '../utils/visitCalculations';

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
  console.log('✓ Test 37 passed: Status filtering verified.');

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
  console.log('✓ Test 38 passed: CAPA status filtering verified.');

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
  console.log('✓ Test 39 passed: PI review filtering verified.');

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

  // Test 48: Lifecycle transition behavior
  console.log('Test 48: Lifecycle transition behavior');
  const closedResult = await complianceService.updateDeviationStatus(ctxSite1, 'DEV-003', 'CLOSED');
  assert(closedResult !== null, 'Closed result should not be null');
  assertStrictEqual(closedResult?.status, 'CLOSED');
  assert(Boolean(closedResult?.closedAt), 'closedAt timestamp must be recorded');
  console.log('✓ Test 48 passed: Lifecycle transition behavior verified.');

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

  // Test 50: Existing Segment A–D regression check
  console.log('Test 50: Existing Segments A-D regression check');
  const regStudies = await studyService.getStudies();
  assert(regStudies.length > 0, 'Studies must be present');
  const regParticipants = await participantService.getParticipants(ctxSite1);
  assertStrictEqual(regParticipants.length, 10, 'SITE-001 must still have 10 participants');
  const regVisits = await visitService.getVisits(ctxSite1);
  assert(regVisits.length > 0, 'Visits must still be present');
  const regSafety = await safetyService.getSafetyEvents(ctxSite1);
  assert(regSafety.length > 0, 'Safety events must still be present');
  const regOverview = await dashboardService.getOverview('STUDY-001', 'SITE-001');
  assert(regOverview !== null, 'Overview must still be present');
  console.log('✓ Test 50 passed: Segments A-D regression check verified.');

  console.log('\n--- ALL SERVICE & DATA TESTS PASSED SUCCESSFULLY (50/50) ---');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  throw err;
});
