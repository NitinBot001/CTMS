import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { taskService } from '../../services/taskService';
import { documentService } from '../../services/documentService';
import { complianceService } from '../../services/complianceService';
import { Task, Document, ProtocolDeviation } from '../../types';
import {
  Pill,
  CheckSquare,
  FileText,
  AlertTriangle,
  Clock,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  Thermometer,
} from 'lucide-react';

export const StudyPharmacistDashboardPage: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { activeStudyId, activeSiteId, activeStudy, activeSite } = useStudy();

  const [pharmacyTasks, setPharmacyTasks] = useState<Task[]>([]);
  const [pharmacyDocs, setPharmacyDocs] = useState<Document[]>([]);
  const [temperatureDeviations, setTemperatureDeviations] = useState<ProtocolDeviation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!activeStudyId || !activeSiteId) return;
    setIsLoading(true);
    try {
      const context = { studyId: activeStudyId, siteId: activeSiteId };
      const [fetchedTasks, fetchedDocs, fetchedDeviations] = await Promise.all([
        taskService.getTasks(context),
        documentService.getDocuments(context),
        complianceService.getDeviations(context),
      ]);

      setPharmacyTasks(
        fetchedTasks.filter(
          (t) =>
            t.assignee?.userId === currentUser?.id ||
            t.category === 'PHARMACY' ||
            t.category === 'OTHER'
        )
      );
      setPharmacyDocs(
        fetchedDocs.filter(
          (d) =>
            d.category === 'PHARMACY' ||
            d.category === 'PROTOCOL' ||
            d.category === 'SAFETY'
        )
      );
      setTemperatureDeviations(
        fetchedDeviations.filter(
          (d) =>
            d.category === 'INVESTIGATIONAL_PRODUCT' ||
            d.scope === 'SITE'
        )
      );
    } catch (err) {
      console.error('Failed to load Pharmacist dashboard data', err);
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
          <div className="w-12 h-12 rounded-sm bg-[#1F5C3F]/10 border border-[#1F5C3F]/20 flex items-center justify-center text-[#1F5C3F] shrink-0">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1F5C3F]">
                Investigational Product & Pharmacy Dispensary
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-xs text-stone-500 font-medium">
                {activeStudy?.code || 'STUDY-001'}
              </span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Welcome, {currentUser?.displayName || currentUser?.name || 'Study Pharmacist'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Assigned to {activeSite?.name || 'Site 001'} · IP accountability, cold chain vigilance, and dispensing compliance.
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
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Dispensary Tasks</span>
            <CheckSquare className="w-4 h-4 text-[#7A2A12]" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{pharmacyTasks.length}</p>
          <span className="text-[11px] text-stone-500">Accountability & verification</span>
        </div>

        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">IP Deviations / Excursions</span>
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{temperatureDeviations.length}</p>
          <span className="text-[11px] text-stone-500">Storage / cold-chain logs</span>
        </div>

        <div className="bg-white p-4 rounded-sm border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Regulatory & IP Docs</span>
            <FileText className="w-4 h-4 text-[#1F5C3F]" />
          </div>
          <p className="text-2xl font-bold font-serif text-stone-900 mt-2">{pharmacyDocs.length}</p>
          <span className="text-[11px] text-stone-500">Brochures, SOPs, Certificates</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Pharmacy Tasks & Storage Vigilance */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-base font-bold text-stone-900">
                  Pharmacy & IP Accountability Tasks
                </h2>
                <p className="text-xs text-stone-500">Dose preparation, batch logging, and inventory reconciliation</p>
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
            ) : pharmacyTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 bg-stone-50 rounded-sm border border-stone-100">
                No open pharmacy or IP tasks at this time.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {pharmacyTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-semibold text-[#7A2A12]">{task.id}</span>
                        <span className="text-xs font-medium text-stone-800 truncate">{task.title}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">{task.description}</p>
                      <div className="flex items-center space-x-3 mt-1 text-[11px] text-stone-400">
                        <span className="inline-flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> Due: {task.dueDate}
                        </span>
                        <span>Priority: <strong className="text-stone-700">{task.priority}</strong></span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200 shrink-0">
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Storage & Cold Chain Deviations */}
          <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-base font-bold text-stone-900">
                  IP Storage & Temperature Deviations
                </h2>
                <p className="text-xs text-stone-500">Environmental logs, temperature excursions, and quarantine records</p>
              </div>
              <Link
                to="/pi/compliance"
                className="text-xs text-[#7A2A12] hover:underline font-medium inline-flex items-center"
              >
                Compliance Log <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {temperatureDeviations.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500 bg-stone-50 rounded-sm border border-stone-100">
                No storage or IP deviations recorded for this site.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {temperatureDeviations.map((dev) => (
                  <div key={dev.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-mono text-xs font-semibold text-stone-900">{dev.id}</span>
                        <span className="text-xs font-medium text-stone-800 truncate">{dev.title}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">{dev.description}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                      {dev.classification}
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
              Pharmacist Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                to="/pi/documents"
                className="w-full flex items-center justify-between p-2.5 rounded-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-xs text-stone-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#1F5C3F]" />
                  <span>IP Brochures & Certificates</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>

              <Link
                to="/pi/compliance"
                className="w-full flex items-center justify-between p-2.5 rounded-sm border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-xs text-stone-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Report Storage Excursion</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </Link>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-sm p-4 text-xs text-stone-600">
            <div className="flex items-center space-x-1.5 font-semibold text-stone-800 mb-1">
              <ShieldCheck className="w-4 h-4 text-[#1F5C3F]" />
              <span>GCP Accountability Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              All investigational drug dispenses and returns must align strictly with active randomization codes and protocol dosage schedules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPharmacistDashboardPage;
