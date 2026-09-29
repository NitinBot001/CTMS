import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { taskService } from '../../services/taskService';
import { visitService } from '../../services/visitService';
import { safetyService } from '../../services/safetyService';
import { complianceService } from '../../services/complianceService';
import { Task, ParticipantVisit, SafetyEvent, ProtocolDeviation } from '../../types';
import {
  Stethoscope,
  ShieldAlert,
  CalendarCheck,
  CheckSquare,
  FileCheck2,
  Users,
  Clock,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const SubInvestigatorDashboardPage: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { activeStudyId, activeSiteId, activeStudy, activeSite } = useStudy();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<ParticipantVisit[]>([]);
  const [safetyEvents, setSafetyEvents] = useState<SafetyEvent[]>([]);
  const [deviations, setDeviations] = useState<ProtocolDeviation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) return;
    setIsLoading(true);
    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [fetchedTasks, fetchedVisits, fetchedSafety, fetchedDeviations] = await Promise.all([
        taskService.getTasks(context),
        visitService.getVisits(context),
        safetyService.getSafetyEvents(context),
        complianceService.getDeviations(context),
      ]);

      setTasks(
        fetchedTasks.filter(
          (t) => t.assignee?.userId === currentUser?.id || t.status === 'UNDER_REVIEW'
        )
      );
      setUpcomingVisits(
        fetchedVisits
          .filter((v) => v.status === 'DUE' || v.status === 'SCHEDULED' || v.status === 'IN_PROGRESS')
          .slice(0, 5)
      );
      setSafetyEvents(
        fetchedSafety.filter(
          (s) =>
            s.piReviewStatus === 'NOT_REVIEWED' ||
            s.piReviewStatus === 'SIGN_OFF_REQUIRED' ||
            s.eventType === 'SAE'
        )
      );
      setDeviations(
        fetchedDeviations.filter((d) => d.status === 'REPORTED' || d.status === 'UNDER_REVIEW')
      );
    } catch (err) {
      console.error('Failed to load Sub-Investigator dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, currentUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Institutional Role Welcome Banner */}
      <div className="bg-white border border-stone-200 rounded-sm p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-sm bg-[#7A2A12]/10 border border-[#7A2A12]/20 flex items-center justify-center text-[#7A2A12] shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7A2A12]">
                Sub-Investigator Clinical Oversight
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-xs text-stone-500 font-medium">
                {activeStudy?.code || 'STUDY-001'}
              </span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Welcome, {currentUser?.displayName || currentUser?.name || 'Sub-Investigator'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Assigned to {activeSite?.name || 'Site 001'} · Clinical evaluations, safety assessments, and protocol reviews.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-stone-600 bg-stone-50 border border-stone-200 px-3 py-2 rounded-sm self-start md:self-center">
          <UserCheck className="w-4 h-4 text-[#1F5C3F]" />
          <span>Role: <strong className="text-stone-800">{currentRole?.name}</strong></span>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">My Delegated Tasks</span>
            <CheckSquare className="w-4 h-4 text-[#7A2A12]" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{tasks.length}</p>
          <span className="text-[11px] text-stone-500">Assigned or under review</span>
        </div>

        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Active Safety Events</span>
            <ShieldAlert className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{safetyEvents.length}</p>
          <span className="text-[11px] text-stone-500">Unreviewed or serious</span>
        </div>

        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Upcoming Protocol Visits</span>
            <CalendarCheck className="w-4 h-4 text-[#1F5C3F]" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{upcomingVisits.length}</p>
          <span className="text-[11px] text-stone-500">Scheduled / In-progress</span>
        </div>

        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Deviations Under Review</span>
            <FileCheck2 className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{deviations.length}</p>
          <span className="text-[11px] text-stone-500">Requiring evaluation</span>
        </div>
      </div>

      {/* Main Grid: Clinical Oversight Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Tasks & Safety Oversight */}
        <div className="lg:col-span-8 space-y-6">
          {/* Delegated Tasks Card */}
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-base font-bold text-stone-900">
                  Delegated Clinical Tasks & Approvals
                </h2>
                <p className="text-xs text-stone-500">Tasks requiring investigator evaluation or sign-off</p>
              </div>
              <Link
                to="/pi/tasks"
                className="text-xs text-[#7A2A12] hover:underline font-medium inline-flex items-center"
              >
                View All Tasks <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {isLoading ? (
              <p className="text-xs text-stone-500 py-4 text-center">Loading delegated tasks...</p>
            ) : tasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 bg-stone-50 rounded-sm border border-stone-100">
                No open tasks assigned to your queue.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-[#7A2A12]">
                          {task.id}
                        </span>
                        <span className="text-xs font-medium text-stone-800 truncate">
                          {task.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">{task.description}</p>
                      <div className="flex items-center space-x-3 mt-1 text-[11px] text-stone-400">
                        <span className="inline-flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Due: {task.dueDate}
                        </span>
                        <span>Priority: <strong className="text-stone-700">{task.priority}</strong></span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-stone-100 text-stone-700 border border-stone-200 shrink-0">
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety Vigilance Alert Feed */}
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-base font-bold text-stone-900">
                  Adverse Event & Safety Vigilance
                </h2>
                <p className="text-xs text-stone-500">Active clinical events requiring investigator causality review</p>
              </div>
              <Link
                to="/pi/safety"
                className="text-xs text-[#7A2A12] hover:underline font-medium inline-flex items-center"
              >
                Safety Directory <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {isLoading ? (
              <p className="text-xs text-stone-500 py-4 text-center">Loading safety events...</p>
            ) : safetyEvents.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 bg-stone-50 rounded-sm border border-stone-100">
                No unreviewed safety events logged at this site.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {safetyEvents.slice(0, 4).map((event) => (
                  <div key={event.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-stone-900">
                          {event.id}
                        </span>
                        <span className="text-xs font-medium text-stone-800 truncate">
                          {event.title}
                        </span>
                        {event.eventType === 'SAE' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            SERIOUS
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Participant: <strong className="text-stone-700">{event.participantId}</strong> · Severity: {event.severity} · Causality: {event.causality}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                      {event.piReviewStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Protocol Visits & Quick Links */}
        <div className="lg:col-span-4 space-y-6">
          {/* Scheduled Visits Queue */}
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-sm font-bold text-stone-900">
                Protocol Visit Schedule
              </h2>
              <Link to="/pi/visits" className="text-xs text-[#7A2A12] hover:underline font-medium">
                All Visits
              </Link>
            </div>

            {isLoading ? (
              <p className="text-xs text-stone-500 py-3 text-center">Loading visits...</p>
            ) : upcomingVisits.length === 0 ? (
              <p className="text-xs text-stone-500 py-3 text-center">No upcoming visits scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcomingVisits.map((v) => (
                  <div key={v.id} className="p-2.5 rounded-sm bg-stone-50 border border-stone-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-stone-800">{v.participantId}</span>
                      <span className="text-[10px] font-medium text-stone-500 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                        {v.status}
                      </span>
                    </div>
                    <div className="font-medium text-stone-700 mt-1">{v.visitName}</div>
                    <div className="text-[11px] text-stone-500 mt-0.5">Target: {v.targetDate}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Access Portals */}
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <h2 className="font-serif text-sm font-bold text-stone-900 mb-3">
              Investigator Actions
            </h2>
            <div className="space-y-2">
              <Link
                to="/pi/patients"
                className="w-full flex items-center justify-between p-2.5 rounded-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-xs text-stone-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#7A2A12]" />
                  <span>Participant Directory</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>

              <Link
                to="/pi/safety"
                className="w-full flex items-center justify-between p-2.5 rounded-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-xs text-stone-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Log Adverse Event</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>

              <Link
                to="/pi/compliance"
                className="w-full flex items-center justify-between p-2.5 rounded-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-xs text-stone-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <FileCheck2 className="w-4 h-4 text-blue-700" />
                  <span>Protocol Deviations</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubInvestigatorDashboardPage;
