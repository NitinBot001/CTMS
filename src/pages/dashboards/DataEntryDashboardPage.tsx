import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { visitService } from '../../services/visitService';
import { taskService } from '../../services/taskService';
import { participantService } from '../../services/participantService';
import { ParticipantVisit, Task, Participant } from '../../types';
import {
  FileSpreadsheet,
  CalendarCheck,
  CheckSquare,
  Users,
  ArrowRight,
  UserCheck,
  FileEdit,
} from 'lucide-react';

export const DataEntryDashboardPage: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { activeStudyId, activeSiteId, activeStudy, activeSite } = useStudy();

  const [visits, setVisits] = useState<ParticipantVisit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) return;
    setIsLoading(true);
    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [fetchedVisits, fetchedTasks, fetchedParticipants] = await Promise.all([
        visitService.getVisits(context),
        taskService.getTasks(context),
        participantService.getParticipants(context),
      ]);

      setVisits(
        fetchedVisits.filter(
          (v) => v.status === 'COMPLETED' || v.status === 'IN_PROGRESS' || v.status === 'DUE'
        )
      );
      setTasks(
        fetchedTasks.filter(
          (t) =>
            t.assignee?.userId === currentUser?.id ||
            t.category === 'OTHER' ||
            t.category === 'VISIT'
        )
      );
      setParticipants(fetchedParticipants);
    } catch (err) {
      console.error('Failed to load Data Entry dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId, currentUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingTranscription = visits.filter((v) => v.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-stone-200 rounded-sm p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-sm bg-[#7A2A12]/10 border border-[#7A2A12]/20 flex items-center justify-center text-[#7A2A12] shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7A2A12]">
                Electronic Case Report Form (eCRF) Transcription
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-xs text-stone-500 font-medium">
                {activeStudy?.code || 'STUDY-001'}
              </span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Welcome, {currentUser?.displayName || currentUser?.name || 'Data Entry Specialist'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Assigned to {activeSite?.name || 'Site 001'} · Clinical data transcription, source document verification, and query entry.
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
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Completed Visits for Entry</span>
            <FileEdit className="w-4 h-4 text-[#7A2A12]" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{pendingTranscription.length}</p>
          <span className="text-[11px] text-stone-500">Ready for eCRF transcription</span>
        </div>

        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Assigned Data Tasks</span>
            <CheckSquare className="w-4 h-4 text-[#1F5C3F]" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{tasks.length}</p>
          <span className="text-[11px] text-stone-500">Pending data tasks</span>
        </div>

        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Total Enrolled Subjects</span>
            <Users className="w-4 h-4 text-stone-600" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{participants.length}</p>
          <span className="text-[11px] text-stone-500">Active site participants</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Visits to Transcribe */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-base font-bold text-stone-900">
                  Visit Data Entry & Source Document Queue
                </h2>
                <p className="text-xs text-stone-500">Completed visits pending electronic transcription</p>
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
            ) : visits.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 bg-stone-50 rounded-sm border border-stone-100">
                No visits pending data entry for this site.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {visits.slice(0, 5).map((v) => (
                  <div key={v.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-stone-900">{v.participantId}</span>
                        <span className="text-xs font-medium text-stone-800 truncate">{v.visitName}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Target Date: {v.targetDate} · Procedures: {v.totalActivities} logged
                      </p>
                    </div>
                    <Link
                      to={`/pi/visits/${v.id}`}
                      className="px-2.5 py-1 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-sm transition-colors shrink-0"
                    >
                      Transcribe eCRF
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks */}
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-base font-bold text-stone-900">
                  Data Verification Tasks
                </h2>
                <p className="text-xs text-stone-500">Query clarifications and coordinator data requests</p>
              </div>
              <Link
                to="/pi/tasks"
                className="text-xs text-[#7A2A12] hover:underline font-medium inline-flex items-center"
              >
                All Tasks <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 bg-stone-50 rounded-sm border border-stone-100">
                No active data entry tasks in queue.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {tasks.slice(0, 4).map((task) => (
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

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <h2 className="font-serif text-sm font-bold text-stone-900 mb-3">
              Operator Actions
            </h2>
            <div className="space-y-2">
              <Link
                to="/pi/visits"
                className="w-full flex items-center justify-between p-2.5 rounded-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-xs text-stone-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <CalendarCheck className="w-4 h-4 text-[#7A2A12]" />
                  <span>Visit Schedules & Checklists</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>

              <Link
                to="/pi/patients"
                className="w-full flex items-center justify-between p-2.5 rounded-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-xs text-stone-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#1F5C3F]" />
                  <span>Subject Master Index</span>
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

export default DataEntryDashboardPage;
