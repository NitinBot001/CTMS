import React from 'react';
import { VerificationAction, VerificationActionType } from '../../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileCheck,
  Send,
  PlusCircle,
  FileUp,
  MessageSquare,
  Building,
} from 'lucide-react';

interface WorkflowHistoryTimelineProps {
  history: VerificationAction[];
}

export const WorkflowHistoryTimeline: React.FC<WorkflowHistoryTimelineProps> = ({ history }) => {
  const getActionConfig = (action: VerificationActionType) => {
    switch (action) {
      case 'CREATED':
        return {
          icon: <PlusCircle className="w-3.5 h-3.5" />,
          color: 'text-stone-700 bg-stone-100 border-stone-300',
          label: 'Record Draft Created',
        };
      case 'SUBMITTED_FOR_VERIFICATION':
        return {
          icon: <Send className="w-3.5 h-3.5" />,
          color: 'text-amber-800 bg-amber-100 border-amber-300',
          label: 'Submitted for Verification',
        };
      case 'RETURNED_FOR_CORRECTION':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          color: 'text-rose-800 bg-rose-100 border-rose-300',
          label: 'Returned for Correction',
        };
      case 'RESUBMITTED_FOR_VERIFICATION':
        return {
          icon: <RotateCcw className="w-3.5 h-3.5" />,
          color: 'text-cyan-800 bg-cyan-100 border-cyan-300',
          label: 'Resubmitted after Corrections',
        };
      case 'VERIFIED':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          color: 'text-emerald-800 bg-emerald-100 border-emerald-300',
          label: 'Verified by Sub-Investigator',
        };
      case 'PI_REVIEWED':
        return {
          icon: <FileCheck className="w-3.5 h-3.5" />,
          color: 'text-purple-800 bg-purple-100 border-purple-300',
          label: 'PI Clinical Oversight Review',
        };
      case 'SUBMITTED_TO_CRO':
        return {
          icon: <Building className="w-3.5 h-3.5" />,
          color: 'text-indigo-800 bg-indigo-100 border-indigo-300',
          label: 'Submitted to CRO / Data Management',
        };
      case 'ATTACHMENT_ADDED':
        return {
          icon: <FileUp className="w-3.5 h-3.5" />,
          color: 'text-stone-700 bg-stone-100 border-stone-300',
          label: 'Source Attachment Uploaded',
        };
      case 'REVIEW_NOTE_ADDED':
        return {
          icon: <MessageSquare className="w-3.5 h-3.5" />,
          color: 'text-blue-800 bg-blue-100 border-blue-300',
          label: 'Advisory Review Note',
        };
      case 'UPDATED':
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5" />,
          color: 'text-stone-600 bg-stone-100 border-stone-300',
          label: 'Data Record Updated',
        };
    }
  };

  // Display newest first
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="bg-white border border-stone-200 rounded-sm shadow-xs p-5">
      <div className="flex items-center space-x-2.5 pb-3 border-b border-stone-200">
        <div className="w-8 h-8 rounded-sm bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Workflow & Verification Audit Log</h3>
          <p className="text-xs text-stone-500">
            Immutable chronological timeline of transitions, clinical checks, and corrections.
          </p>
        </div>
      </div>

      <div className="mt-5 relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
        {sortedHistory.map((item) => {
          const config = getActionConfig(item.action);
          return (
            <div key={item.id} className="relative">
              {/* Timeline marker */}
              <div
                className={`absolute -left-[27px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${config.color}`}
              >
                {config.icon}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-stone-900">{config.label}</span>
                    <span className="text-stone-400">•</span>
                    <span className="text-stone-700 font-medium">{item.actorName}</span>
                    <span className="px-1.5 py-0.5 rounded-xs text-[10px] bg-stone-100 text-stone-600 border border-stone-200">
                      {item.actorRoleName}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-mono">
                    {new Date(item.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>

                {item.comment && (
                  <p className="text-xs text-stone-700 bg-stone-50 border border-stone-200/80 rounded-sm p-2.5 mt-1 leading-relaxed">
                    {item.comment}
                  </p>
                )}

                {item.affectedFields && item.affectedFields.length > 0 && (
                  <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-rose-700">
                    <span className="font-medium">Flagged fields for correction:</span>
                    <span className="font-mono bg-rose-50 px-1.5 py-0.5 rounded-xs border border-rose-200">
                      {item.affectedFields.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
