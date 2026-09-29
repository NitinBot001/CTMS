import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { participantService } from '../../services/participantService';
import { visitService } from '../../services/visitService';
import { taskService } from '../../services/taskService';
import { documentService } from '../../services/documentService';
import { Participant, ParticipantVisit, Task, Document } from '../../types';
import {
  ClipboardList,
  Users,
  CalendarCheck,
  CheckSquare,
  FileText,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const CrcDashboardPage: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { activeStudyId, activeSiteId, activeStudy, activeSite } = useStudy();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [visits, setVisits] = useState<ParticipantVisit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) return;
    setIsLoading(true);
    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [fetchedParticipants, fetchedVisits, fetchedTasks, fetchedDocuments] =
        await Promise.all([
          participantService.getParticipants(context),
          visitService.getVisits(context),
          taskService.getTasks(context),
          documentService.getDocuments(context),
        ]);

      setParticipants(fetchedParticipants);
      setVisits(
        fetchedVisits.filter(
          (v) => v.status === 'DUE' || v.status === 'SCHEDULED' || v.status === 'OVERDUE'
        )
      );
      setTasks(fetchedTasks.filter((t) => t.status !== 'COMPLETED'));
      setDocuments(fetchedDocuments.filter((d) => d.status === 'EXPIRED' || d.isRequired));
    } catch (err) {
      console.error('Failed to load CRC dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeParticipants = participants.filter((p) => p.status === 'ACTIVE' || p.status === 'ENROLLED');
  const overdueVisits = visits.filter((v) => v.status === 'OVERDUE');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-stone-200 rounded-sm p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-sm bg-[#1F5C3F]/10 border border-[#1F5C3F]/20 flex items-center justify-center text-[#1F5C3F] shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1F5C3F]">
                Clinical Research Coordinator Desk
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-xs text-stone-500 font-medium">
                {activeStudy?.code || 'STUDY-001'}
              </span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Welcome, {currentUser?.displayName || currentUser?.name || 'Study Coordinator'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Assigned to {activeSite?.name || 'Site 001'} · Trial operations, subject schedules, and protocol checklists.
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
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Active Subjects</span>
            <Users className="w-4 h-4 text-[#1F5C3F]" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{activeParticipants.length}</p>
          <span className="text-[11px] text-stone-500">Total enrolled: {participants.length}</span>
        </div>

        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Visits Due / Overdue</span>
            <CalendarCheck className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{visits.length}</p>
          <span className="text-[11px] text-rose-600 font-medium">{overdueVisits.length} currently overdue</span>
        </div>

        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Open Site Tasks</span>
            <CheckSquare className="w-4 h-4 text-[#7A2A12]" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{tasks.length}</p>
          <span className="text-[11px] text-stone-500">Coordination & clinical</span>
        </div>

        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Expiring / Req Docs</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{documents.length}</p>
          <span className="text-[11px] text-stone-500">Within horizon or mandatory</span>
        </div>
      </div>

      {/* Main Grid: Coordinator Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Visits & Tasks */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Visit Schedule Card */}
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-base font-bold text-stone-900">
                  Scheduled & Due Participant Visits
                </h2>
                <p className="text-xs text-stone-500">Upcoming visit milestones and procedure windows</p>
              </div>
              <Link
                to="/pi/visits"
                className="text-xs text-[#1F5C3F] hover:underline font-medium inline-flex items-center"
              >
                Visit Schedule <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {isLoading ? (
              <p className="text-xs text-stone-500 py-4 text-center">Loading visits...</p>
            ) : visits.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 bg-stone-50 rounded-sm border border-stone-100">
                No visits pending action for this site.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {visits.slice(0, 5).map((v) => (
                  <div key={v.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-stone-900">
                          {v.participantId}
                        </span>
                        <span className="text-xs font-medium text-stone-800 truncate">
                          {v.visitName}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Target Date: <strong className="text-stone-700">{v.targetDate}</strong> · Window: {v.windowStart} to {v.windowEnd}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${
                        v.status === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coordination Tasks */}
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-base font-bold text-stone-900">
                  Open Action Items & Tasks
                </h2>
                <p className="text-xs text-stone-500">Delegated operational tasks and investigator requests</p>
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
            ) : tasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 bg-stone-50 rounded-sm border border-stone-100">
                All assigned tasks have been completed.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {tasks.slice(0, 4).map((t) => (
                  <div key={t.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-[#7A2A12]">{t.id}</span>
                        <span className="text-xs font-medium text-stone-800 truncate">{t.title}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Due: {t.dueDate} · Assignee: {t.assignee?.displayName || 'Unassigned'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200 shrink-0">
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Quick Operations & Regulatory Docs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <h2 className="font-serif text-sm font-bold text-stone-900 mb-3">
              Coordinator Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                to="/pi/patients"
                className="w-full flex items-center justify-between p-2.5 rounded-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-xs text-stone-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#1F5C3F]" />
                  <span>Subject Management</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>

              <Link
                to="/pi/visits"
                className="w-full flex items-center justify-between p-2.5 rounded-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-xs text-stone-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <CalendarCheck className="w-4 h-4 text-[#7A2A12]" />
                  <span>Execute Visit Checklist</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>

              <Link
                to="/pi/documents"
                className="w-full flex items-center justify-between p-2.5 rounded-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-xs text-stone-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>Upload Trial Document</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>
            </div>
          </div>

          {/* Document Vigilance Card */}
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-sm font-bold text-stone-900">
                Document Expiry Tracking
              </h2>
              <Link to="/pi/documents" className="text-xs text-[#7A2A12] hover:underline font-medium">
                Binder
              </Link>
            </div>

            {isLoading ? (
              <p className="text-xs text-stone-500 py-3 text-center">Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="text-xs text-stone-500 py-3 text-center">All site documents are active and valid.</p>
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="p-2.5 rounded-sm bg-stone-50 border border-stone-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-800 truncate pr-2">{doc.title}</span>
                      <span className="text-[10px] font-bold text-rose-700 uppercase shrink-0">
                        {doc.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">Expiry: {doc.expiryDate || 'N/A'}</div>
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

export default CrcDashboardPage;
