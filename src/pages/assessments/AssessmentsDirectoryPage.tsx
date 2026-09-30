import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudy } from '../../context/StudyContext';
import { assessmentService } from '../../services/assessmentService';
import { participantService } from '../../services/participantService';
import {
  AssessmentAssignment,
  AssessmentSession,
  AssessmentInstrument,
  Participant,
} from '../../types';
import { AssignAssessmentModal } from '../../components/assessments/AssignAssessmentModal';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileEdit,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AssessmentsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeStudy, activeSite } = useStudy();

  const [activeTab, setActiveTab] = useState<'ASSIGNMENTS' | 'CATALOG'>('ASSIGNMENTS');
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [instruments, setInstruments] = useState<AssessmentInstrument[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const studyId = activeStudy?.id || 'STUDY-001';
      const siteId = activeSite?.id || 'SITE-001';

      const [assignList, sessList, instList, ptList] = await Promise.all([
        assessmentService.getAssignments({ studyId, siteId }),
        assessmentService.getSessions({ studyId, siteId }),
        assessmentService.getInstruments(),
        participantService.getParticipants({ studyId, siteId }),
      ]);

      setAssignments(assignList);
      setSessions(sessList);
      setInstruments(instList);
      setParticipants(ptList);
    } catch (err: any) {
      console.error('Error loading assessments data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeStudy, activeSite]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Summary Metrics
  const totalAssigned = assignments.length;
  const inProgressCount = sessions.filter((s) => s.status === 'IN_PROGRESS').length;
  const submittedCount = sessions.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW').length;
  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length;
  const revisionCount = sessions.filter((s) => s.status === 'REVISION_REQUIRED').length;

  // Filtered Assignments
  const filteredAssignments = assignments.filter((a) => {
    const pt = participants.find((p) => p.id === a.participantId);
    const inst = instruments.find((i) => i.instrumentId === a.instrumentId);
    const session = sessions.find((s) => s.assignmentId === a.assignmentId);
    const currentStatus = session ? session.status : a.status;

    if (statusFilter !== 'ALL' && currentStatus !== statusFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPt = pt?.participantCode.toLowerCase().includes(q) || pt?.initials.toLowerCase().includes(q);
      const matchInst = inst?.name.toLowerCase().includes(q) || inst?.category.toLowerCase().includes(q);
      if (!matchPt && !matchInst) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-amber-950 to-emerald-950 text-white p-6 rounded-sm shadow-xs border border-amber-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <ClipboardList className="w-4 h-4" />
            Stage 3 · Clinical Assessment Framework
          </div>
          <h1 className="font-serif text-2xl font-bold mt-1">
            Ayurveda Participant & Clinical Assessments
          </h1>
          <p className="text-xs text-neutral-300 mt-1 max-w-2xl">
            Administer structured clinical instruments, capture typed participant responses, manage deterministic branching logic, and conduct verified Sub-I / PI response reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-sm shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Assessment</span>
          </button>
        </div>
      </div>

      {/* Operational Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-sm border border-neutral-200 shadow-xs">
          <div className="text-neutral-500 text-xs font-medium">Total Assigned</div>
          <div className="text-2xl font-bold font-serif text-neutral-900 mt-1">{totalAssigned}</div>
          <div className="text-[11px] text-neutral-500 mt-1">Active site participants</div>
        </div>
        <div className="bg-white p-4 rounded-sm border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="text-amber-800 text-xs font-medium">In Progress</div>
          <div className="text-2xl font-bold font-serif text-amber-900 mt-1">{inProgressCount}</div>
          <div className="text-[11px] text-amber-700 mt-1">Data collection open</div>
        </div>
        <div className="bg-white p-4 rounded-sm border border-blue-200 bg-blue-50/20 shadow-xs">
          <div className="text-blue-800 text-xs font-medium">Pending Review</div>
          <div className="text-2xl font-bold font-serif text-blue-900 mt-1">{submittedCount}</div>
          <div className="text-[11px] text-blue-700 mt-1">Submitted for verification</div>
        </div>
        <div className="bg-white p-4 rounded-sm border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="text-emerald-800 text-xs font-medium">Completed</div>
          <div className="text-2xl font-bold font-serif text-emerald-900 mt-1">{completedCount}</div>
          <div className="text-[11px] text-emerald-700 mt-1">Verified & approved</div>
        </div>
        <div className="bg-white p-4 rounded-sm border border-red-200 bg-red-50/20 shadow-xs">
          <div className="text-red-800 text-xs font-medium">Revision Required</div>
          <div className="text-2xl font-bold font-serif text-red-900 mt-1">{revisionCount}</div>
          <div className="text-[11px] text-red-700 mt-1">Returned for correction</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('ASSIGNMENTS')}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'ASSIGNMENTS'
                ? 'border-amber-800 text-amber-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Participant Assignments & Sessions ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab('CATALOG')}
            className={`pb-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'CATALOG'
                ? 'border-amber-800 text-amber-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Digital Instrument Catalog & Builder ({instruments.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Assignments Table */}
      {activeTab === 'ASSIGNMENTS' && (
        <div className="bg-white rounded-sm border border-neutral-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search participant code, instrument..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded-sm focus:ring-1 focus:ring-amber-700 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-neutral-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-neutral-300 rounded-sm px-3 py-1.5 focus:ring-1 focus:ring-amber-700 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending (Not Started)</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SUBMITTED">Submitted (Pending Review)</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="REVISION_REQUIRED">Revision Required</option>
                <option value="COMPLETED">Completed & Verified</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="py-16 text-center text-xs text-neutral-500">Loading assignments...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 text-xs">
              No assessment assignments found matching your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-700 uppercase tracking-wider font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3">Participant</th>
                    <th className="px-4 py-3">Assessment Instrument</th>
                    <th className="px-4 py-3">Content Provenance</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredAssignments.map((a) => {
                    const pt = participants.find((p) => p.id === a.participantId);
                    const inst = instruments.find((i) => i.instrumentId === a.instrumentId);
                    const session = sessions.find((s) => s.assignmentId === a.assignmentId);
                    const currentStatus = session ? session.status : a.status;
                    const progress = session ? session.completionPercentage : 0;

                    return (
                      <tr key={a.assignmentId} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-neutral-900">
                            {pt?.participantCode || a.participantId}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {pt ? `${pt.initials} · ${pt.status}` : 'Subject'}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-neutral-900">{inst?.name || a.instrumentId}</div>
                          <div className="text-[11px] text-neutral-500">
                            Category: <span className="font-semibold text-neutral-700">{inst?.category || 'PRAKRITI'}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {inst?.rightsStatus === 'VERIFIED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              Synthetic Demo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                              <ShieldAlert className="w-3 h-3 text-amber-600" />
                              Restricted Source
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-neutral-700">
                          {a.notes?.includes('Participant') ? 'Self-Report' : 'Clinician'}
                        </td>

                        <td className="px-4 py-3">
                          {currentStatus === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              COMPLETED
                            </span>
                          ) : currentStatus === 'SUBMITTED' || currentStatus === 'UNDER_REVIEW' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                              <Clock className="w-3 h-3" />
                              SUBMITTED
                            </span>
                          ) : currentStatus === 'REVISION_REQUIRED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-red-100 text-red-800 border border-red-300">
                              <AlertTriangle className="w-3 h-3" />
                              REVISION REQUIRED
                            </span>
                          ) : currentStatus === 'IN_PROGRESS' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3" />
                              IN PROGRESS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-300">
                              PENDING
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="w-24 bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                currentStatus === 'COMPLETED'
                                  ? 'bg-emerald-600'
                                  : currentStatus === 'REVISION_REQUIRED'
                                  ? 'bg-red-500'
                                  : 'bg-amber-600'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-neutral-500 mt-0.5 block">{progress}%</span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {currentStatus === 'SUBMITTED' || currentStatus === 'UNDER_REVIEW' ? (
                              <button
                                onClick={() => navigate(`/pi/assessments/${a.assignmentId}/review`)}
                                className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-sm transition-colors"
                              >
                                Review Responses
                              </button>
                            ) : currentStatus === 'REVISION_REQUIRED' ? (
                              <button
                                onClick={() => navigate(`/pi/assessments/${a.assignmentId}`)}
                                className="px-2.5 py-1 text-xs font-semibold text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-sm transition-colors"
                              >
                                Amend Responses
                              </button>
                            ) : currentStatus === 'COMPLETED' ? (
                              <button
                                onClick={() => navigate(`/pi/assessments/${a.assignmentId}`)}
                                className="px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-sm transition-colors"
                              >
                                View Record
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/pi/assessments/${a.assignmentId}`)}
                                className="px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-sm transition-colors"
                              >
                                {session ? 'Resume' : 'Start Assessment'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Instrument Catalog & Builder */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-sm text-xs text-amber-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm">Ayurveda Assessment Questionnaire Builder & Content Rights</div>
              <div className="mt-0.5 text-neutral-700">
                To respect CCRAS copyright and intellectual property restrictions on standardized scales (AYUR Prakriti and Swasthya Assessment Scales), complete questionnaire item banks and digital collection models are configured exclusively on verified synthetic demo instruments.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instruments.map((inst) => {
              const isRestricted = inst.rightsStatus === 'RESTRICTED' || inst.contentStatus === 'METADATA_ONLY';

              return (
                <div key={inst.instrumentId} className="bg-white rounded-sm border border-neutral-200 shadow-xs p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-300">
                          {inst.category}
                        </span>
                        <h3 className="font-serif font-bold text-base text-neutral-900 mt-1">
                          {inst.name}
                        </h3>
                      </div>
                      {isRestricted ? (
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          Restricted Metadata
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          Synthetic Demo Ready
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {inst.description}
                    </p>

                    <div className="pt-2 border-t border-neutral-100 grid grid-cols-2 gap-2 text-[11px] text-neutral-500">
                      <div>
                        <span className="block text-neutral-400">Source Authority:</span>
                        <span className="font-medium text-neutral-800">{inst.sourceAuthority}</span>
                      </div>
                      <div>
                        <span className="block text-neutral-400">Content Status:</span>
                        <span className="font-medium text-neutral-800">{inst.contentStatus}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-neutral-200 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500">
                      {isRestricted ? 'Authoring disabled for restricted scale' : 'Draft & Active Versions Available'}
                    </span>
                    <button
                      onClick={() => navigate(`/pi/protocol/assessments/${inst.instrumentId}/builder`)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
                        isRestricted
                          ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                          : 'bg-amber-800 hover:bg-amber-900 text-white shadow-xs'
                      }`}
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>{isRestricted ? 'View Metadata / Spec' : 'Open Digital Builder'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      <AssignAssessmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssigned={() => {
          loadData();
        }}
      />
    </div>
  );
};
