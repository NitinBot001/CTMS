import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { visitService } from '../../services/visitService';
import { taskService } from '../../services/taskService';
import { safetyService } from '../../services/safetyService';
import { ParticipantVisit, Task, SafetyEvent } from '../../types';
import {
  HeartPulse,
  CalendarCheck,
  CheckSquare,
  ShieldAlert,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const StudyNurseDashboardPage: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { activeStudyId, activeSiteId, activeStudy, activeSite } = useStudy();

  const [todayVisits, setTodayVisits] = useState<ParticipantVisit[]>([]);
  const [nurseTasks, setNurseTasks] = useState<Task[]>([]);
  const [recentAEReports, setRecentAEReports] = useState<SafetyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) return;
    setIsLoading(true);
    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [fetchedVisits, fetchedTasks, fetchedSafety] = await Promise.all([
        visitService.getVisits(context),
        taskService.getTasks(context),
        safetyService.getSafetyEvents(context),
      ]);

      setTodayVisits(
        fetchedVisits.filter(
          (v) => v.status === 'DUE' || v.status === 'IN_PROGRESS' || v.status === 'SCHEDULED'
        )
      );
      setNurseTasks(
        fetchedTasks.filter(
          (t) =>
            t.assignee?.userId === currentUser?.id ||
            t.category === 'VISIT' ||
            t.category === 'PARTICIPANT'
        )
      );
      setRecentAEReports(fetchedSafety.slice(0, 4));
    } catch (err) {
      console.error('Failed to load Study Nurse dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, currentUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-stone-200 rounded-sm p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-sm bg-[#B8862E]/10 border border-[#B8862E]/20 flex items-center justify-center text-[#B8862E] shrink-0">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B8862E]">
                Study Nurse Clinical Station
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-xs text-stone-500 font-medium">
                {activeStudy?.code || 'STUDY-001'}
              </span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Welcome, {currentUser?.displayName || currentUser?.name || 'Study Nurse'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Assigned to {activeSite?.name || 'Site 001'} · Vital signs, sample collection, and participant procedure checklists.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-stone-600 bg-stone-50 border border-stone-200 px-3 py-2 rounded-sm self-start md:self-center">
          <UserCheck className="w-4 h-4 text-[#1F5C3F]" />
          <span>Role: <strong className="text-stone-800">{currentRole?.name}</strong></span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Scheduled Visits</span>
            <CalendarCheck className="w-4 h-4 text-[#7A2A12]" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{todayVisits.length}</p>
          <span className="text-[11px] text-stone-500">Pending procedural execution</span>
        </div>

        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Clinical Tasks</span>
            <CheckSquare className="w-4 h-4 text-[#1F5C3F]" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{nurseTasks.length}</p>
          <span className="text-[11px] text-stone-500">Assigned procedural tasks</span>
        </div>

        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Safety Events Logged</span>
            <ShieldAlert className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{recentAEReports.length}</p>
          <span className="text-[11px] text-stone-500">Recent adverse reports</span>
        </div>
      </div>

      {/* Main Grid: Nursing Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Visits Checklist Queue */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-base font-bold text-stone-900">
                  Active Patient Visits & Procedures
                </h2>
                <p className="text-xs text-stone-500">Patient check-in, vital collection, and protocol activities</p>
              </div>
              <Link
                to="/pi/visits"
                className="text-xs text-[#7A2A12] hover:underline font-medium inline-flex items-center"
              >
                All Visits <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {isLoading ? (
              <p className="text-xs text-stone-500 py-4 text-center">Loading visits...</p>
            ) : todayVisits.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 bg-stone-50 rounded-sm border border-stone-100">
                No active visits requiring procedural completion at this time.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {todayVisits.slice(0, 5).map((visit) => (
                  <div key={visit.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-stone-900">
                          {visit.participantId}
                        </span>
                        <span className="text-xs font-medium text-stone-800 truncate">
                          {visit.visitName}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Target: {visit.targetDate} · Checklists: {visit.completedActivities} / {visit.totalActivities} completed
                      </p>
                    </div>
                    <Link
                      to={`/pi/visits/${visit.id}`}
                      className="px-2.5 py-1 text-xs font-medium bg-[#1F5C3F] text-white hover:bg-[#184831] rounded-sm transition-colors shrink-0"
                    >
                      Complete Checklist
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nursing Tasks */}
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-base font-bold text-stone-900">
                  Assigned Procedural Tasks
                </h2>
                <p className="text-xs text-stone-500">Sample collection, vitals recording, and coordinator handoffs</p>
              </div>
              <Link
                to="/pi/tasks"
                className="text-xs text-[#7A2A12] hover:underline font-medium inline-flex items-center"
              >
                All Tasks <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {isLoading ? (
              <p className="text-xs text-stone-500 py-4 text-center">Loading tasks...</p>
            ) : nurseTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 bg-stone-50 rounded-sm border border-stone-100">
                No active procedural tasks assigned.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {nurseTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-[#7A2A12]">{task.id}</span>
                        <span className="text-xs font-medium text-stone-800 truncate">{task.title}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">Due: {task.dueDate}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200 shrink-0">
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Quick Reporting */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <h2 className="font-serif text-sm font-bold text-stone-900 mb-3">
              Nurse Clinical Actions
            </h2>
            <div className="space-y-2">
              <Link
                to="/pi/visits"
                className="w-full flex items-center justify-between p-2.5 rounded-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-xs text-stone-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <CalendarCheck className="w-4 h-4 text-[#1F5C3F]" />
                  <span>Execute Visit Procedures</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>

              <Link
                to="/pi/safety"
                className="w-full flex items-center justify-between p-2.5 rounded-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-xs text-stone-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Report Adverse Event</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-sm font-bold text-stone-900">
                Safety Vigilance
              </h2>
              <Link to="/pi/safety" className="text-xs text-[#7A2A12] hover:underline font-medium">
                Log
              </Link>
            </div>
            {recentAEReports.length === 0 ? (
              <p className="text-xs text-stone-500 py-3 text-center">No recent adverse events recorded.</p>
            ) : (
              <div className="space-y-2">
                {recentAEReports.map((ae) => (
                  <div key={ae.id} className="p-2.5 rounded-sm bg-stone-50 border border-stone-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-800">{ae.participantId}</span>
                      <span className="text-[10px] text-amber-800 font-bold">{ae.severity}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-1">{ae.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyNurseDashboardPage;
