import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { visitDataService } from '../../services/visitDataService';
import { participantService } from '../../services/participantService';
import { visitService } from '../../services/visitService';
import {
  VisitDataRecord,
  DataEntrySummaryMetrics,
  VisitDataStatus,
  Participant,
  ParticipantVisit,
} from '../../types';
import { getStatusLabel, getStatusBadgeClasses } from '../../utils/visitDataCalculations';
import {
  FileSpreadsheet,
  ArrowRight,
  UserCheck,
  FileEdit,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Plus,
  Search,
  Paperclip,
} from 'lucide-react';

export const DataEntryDashboardPage: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { activeStudyId, activeSiteId, activeStudy, activeSite } = useStudy();

  const [metrics, setMetrics] = useState<DataEntrySummaryMetrics>({
    pendingDataEntry: 0,
    enteredToday: 0,
    pendingVerification: 0,
    returnedForCorrection: 0,
    documentsPending: 0,
    verified: 0,
    totalRecords: 0,
  });

  const [records, setRecords] = useState<VisitDataRecord[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availableVisits, setAvailableVisits] = useState<ParticipantVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<VisitDataStatus | 'ALL'>('ALL');
  const [showAttachmentsOnly, setShowAttachmentsOnly] = useState(false);

  // New Draft Modal
  const [showNewDraftModal, setShowNewDraftModal] = useState(false);
  const [newDraftParticipantId, setNewDraftParticipantId] = useState('');
  const [newDraftVisitId, setNewDraftVisitId] = useState('');
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) return;
    setIsLoading(true);
    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [fetchedMetrics, fetchedRecords, fetchedParticipants, fetchedVisits] = await Promise.all([
        visitDataService.getSummaryMetrics(context),
        visitDataService.listRecords(context),
        participantService.getParticipants(context),
        visitService.getVisits(context),
      ]);

      setMetrics(fetchedMetrics);
      setRecords(fetchedRecords);
      setParticipants(fetchedParticipants);
      setAvailableVisits(fetchedVisits);
    } catch (err) {
      console.error('Failed to load Data Entry dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeStudyId, activeSiteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client filtered records
  const filteredRecords = records.filter((r) => {
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
    if (showAttachmentsOnly && r.attachments.length === 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.id.toLowerCase().includes(q) ||
        r.participantCode.toLowerCase().includes(q) ||
        r.participantInitials.toLowerCase().includes(q) ||
        r.visitCode.toLowerCase().includes(q) ||
        r.visitName.toLowerCase().includes(q) ||
        r.enteredByName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDraftParticipantId || !newDraftVisitId) {
      setDraftError('Please select both participant and clinical visit.');
      return;
    }

    try {
      setIsCreatingDraft(true);
      setDraftError(null);
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const participant = participants.find((p) => p.id === newDraftParticipantId);
      const visit = availableVisits.find((v) => v.id === newDraftVisitId);

      const actor = {
        userId: currentUser?.id || 'USR-CURRENT',
        name: currentUser?.displayName || currentUser?.name || 'Data Entry Specialist',
        roleId: currentRole?.id || 'ROLE_DATA_ENTRY',
        roleName: currentRole?.name || 'Data Entry Operator',
      };

      await visitDataService.createDraft(
        context,
        {
          participantId: participant?.id || newDraftParticipantId,
          participantCode: participant?.participantCode || newDraftParticipantId,
          participantInitials: participant?.initials || 'P.P.',
          visitId: visit?.id || newDraftVisitId,
          visitCode: visit?.visitCode || 'V-NEW',
          visitName: visit?.visitName || 'Clinical Evaluation',
          visitDate: new Date().toISOString().slice(0, 10),
        },
        actor
      );

      setShowNewDraftModal(false);
      setNewDraftParticipantId('');
      setNewDraftVisitId('');
      await loadData();
    } catch (err: any) {
      setDraftError(err.message || 'Failed to create draft record.');
    } finally {
      setIsCreatingDraft(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
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

        <div className="flex items-center space-x-3 self-start md:self-center">
          <div className="flex items-center space-x-2 text-xs text-stone-600 bg-stone-50 border border-stone-200 px-3 py-2 rounded-sm">
            <UserCheck className="w-4 h-4 text-[#1F5C3F]" />
            <span>Role: <strong className="text-stone-800">{currentRole?.name}</strong></span>
          </div>

          <button
            type="button"
            onClick={() => setShowNewDraftModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#7A2A12] hover:bg-[#5A1E0D] rounded-sm transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Visit Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Operational Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Pending Entry</span>
            <FileEdit className="w-3.5 h-3.5 text-stone-600" />
          </div>
          <p className="text-xl font-bold font-serif text-stone-900 mt-1">{metrics.pendingDataEntry}</p>
          <span className="text-[10px] text-stone-500">Drafts / In Progress</span>
        </div>

        <div className="bg-white p-3.5 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Entered Today</span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-xl font-bold font-serif text-stone-900 mt-1">{metrics.enteredToday}</p>
          <span className="text-[10px] text-stone-500">Created / Updated</span>
        </div>

        <div className="bg-white p-3.5 rounded-sm border border-amber-200 shadow-xs bg-amber-50/30">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Pending Sub-I</span>
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-xl font-bold font-serif text-amber-950 mt-1">{metrics.pendingVerification}</p>
          <span className="text-[10px] text-amber-700">Awaiting Verification</span>
        </div>

        <div className="bg-white p-3.5 rounded-sm border border-rose-200 shadow-xs bg-rose-50/30">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Returned</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <p className="text-xl font-bold font-serif text-rose-950 mt-1">{metrics.returnedForCorrection}</p>
          <span className="text-[10px] text-rose-700">Needs Amendment</span>
        </div>

        <div className="bg-white p-3.5 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Docs Missing</span>
            <Paperclip className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <p className="text-xl font-bold font-serif text-stone-900 mt-1">{metrics.documentsPending}</p>
          <span className="text-[10px] text-stone-500">No source attached</span>
        </div>

        <div className="bg-white p-3.5 rounded-sm border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Verified / CRO</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-serif text-emerald-950 mt-1">{metrics.verified}</p>
          <span className="text-[10px] text-emerald-700">Verified by Sub-I</span>
        </div>
      </div>

      {/* Main Operational Table: Visit Data Entry Queue */}
      <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div>
            <h2 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#7A2A12]" />
              Clinical Visit Data Entry & Verification Register
            </h2>
            <p className="text-xs text-stone-500">
              Field-level eCRF transcription, source attachment inspection, and Sub-I verification status.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, visit, id..."
                className="pl-8 pr-3 py-1.5 border border-stone-300 rounded-sm bg-white text-xs w-48 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#7A2A12]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="border border-stone-300 rounded-sm bg-white px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-[#7A2A12]"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED_FOR_VERIFICATION">Awaiting Verification</option>
              <option value="RETURNED_FOR_CORRECTION">Returned for Correction</option>
              <option value="RESUBMITTED_FOR_VERIFICATION">Resubmitted</option>
              <option value="VERIFIED">Verified by Sub-I</option>
              <option value="PI_REVIEW">Under PI Review</option>
              <option value="SUBMITTED_TO_CRO">Submitted to CRO</option>
            </select>

            {/* Has Attachments toggle */}
            <label className="flex items-center space-x-1.5 text-stone-700 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAttachmentsOnly}
                onChange={(e) => setShowAttachmentsOnly(e.target.checked)}
                className="rounded-xs text-[#7A2A12]"
              />
              <span>With Docs Only</span>
            </label>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-stone-500">Loading visit data records...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500 bg-stone-50/60 border border-dashed border-stone-200 rounded-sm">
            No clinical visit data records match the active criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold">
                  <th className="py-2.5 px-3">Record ID</th>
                  <th className="py-2.5 px-3">Participant</th>
                  <th className="py-2.5 px-3">Visit Event</th>
                  <th className="py-2.5 px-3">Visit Date</th>
                  <th className="py-2.5 px-3">Source Docs</th>
                  <th className="py-2.5 px-3">Workflow Status</th>
                  <th className="py-2.5 px-3">Operator / Verifier</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRecords.map((r) => {
                  const badge = getStatusBadgeClasses(r.status);
                  const isReturned = r.status === 'RETURNED_FOR_CORRECTION';
                  const isEditable = r.status === 'DRAFT' || isReturned;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isReturned ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-medium text-[#7A2A12]">
                        <Link
                          to={`/data-entry/records/${r.id}`}
                          className="hover:underline font-semibold"
                        >
                          {r.id}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-stone-900">{r.participantCode}</span>
                        <span className="text-stone-500 ml-1">({r.participantInitials})</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-stone-900 block truncate max-w-xs">
                          {r.visitName}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">{r.visitCode}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-700">{r.visitDate}</td>
                      <td className="py-2.5 px-3">
                        {r.attachments.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-stone-700 font-mono bg-stone-100 px-2 py-0.5 rounded-xs border border-stone-200">
                            <Paperclip className="w-3 h-3 text-stone-500" />
                            {r.attachments.length} doc{r.attachments.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-mono bg-amber-50 px-2 py-0.5 rounded-xs border border-amber-200">
                            Missing Doc
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {getStatusLabel(r.status)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-stone-600">
                        <div className="truncate max-w-[140px]">
                          <span>{r.enteredByName}</span>
                          {r.verifiedByName && (
                            <span className="block text-[10px] text-stone-400 truncate">
                              Ver: {r.verifiedByName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          to={`/data-entry/records/${r.id}`}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-sm transition-colors ${
                            isReturned
                              ? 'bg-rose-700 text-white hover:bg-rose-800'
                              : isEditable
                              ? 'bg-[#7A2A12] text-white hover:bg-[#5A1E0D]'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                          }`}
                        >
                          <span>{isReturned ? 'Fix Correction' : isEditable ? 'Edit Entry' : 'View Record'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Visit Entry Draft Modal */}
      {showNewDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-white border border-stone-300 rounded-sm shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#7A2A12]" />
                Initialize Visit Data Entry Draft
              </h3>
              <button
                type="button"
                onClick={() => setShowNewDraftModal(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDraft} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-800 font-semibold mb-1">Select Participant</label>
                <select
                  value={newDraftParticipantId}
                  onChange={(e) => setNewDraftParticipantId(e.target.value)}
                  className="w-full border border-stone-300 rounded-sm p-2 bg-white text-stone-800 focus:outline-none focus:border-[#7A2A12]"
                >
                  <option value="">-- Choose Study Subject --</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.participantCode} ({p.initials}) · Screening #{p.screeningCode}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-800 font-semibold mb-1">Select Clinical Visit Event</label>
                <select
                  value={newDraftVisitId}
                  onChange={(e) => setNewDraftVisitId(e.target.value)}
                  className="w-full border border-stone-300 rounded-sm p-2 bg-white text-stone-800 focus:outline-none focus:border-[#7A2A12]"
                >
                  <option value="">-- Choose Visit --</option>
                  {availableVisits.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.visitCode} - {v.visitName} ({v.participantId})
                    </option>
                  ))}
                </select>
              </div>

              {draftError && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-sm">
                  {draftError}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowNewDraftModal(false)}
                  disabled={isCreatingDraft}
                  className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-sm hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDraft}
                  className="px-3.5 py-1.5 bg-[#7A2A12] text-white font-semibold rounded-sm hover:bg-[#5A1E0D] disabled:opacity-50"
                >
                  {isCreatingDraft ? 'Initializing...' : 'Create Draft Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
