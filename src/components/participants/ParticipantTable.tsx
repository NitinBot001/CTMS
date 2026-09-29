import React from 'react';
import { Participant } from '../../types';
import { ParticipantStatusBadge } from './ParticipantStatusBadge';
import { AlertTriangle, ArrowRight, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ParticipantTableProps {
  participants: Participant[];
}

export const ParticipantTable: React.FC<ParticipantTableProps> = ({ participants }) => {
  return (
    <div className="bg-surface border border-border rounded-sm shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs" aria-label="Clinical Trial Participants Directory">
          <thead>
            <tr className="bg-surface-soft border-b border-border text-ink-muted uppercase font-semibold text-[11px] tracking-wider">
              <th scope="col" className="py-3 px-4">Participant</th>
              <th scope="col" className="py-3 px-3">Status</th>
              <th scope="col" className="py-3 px-3">Demographics</th>
              <th scope="col" className="py-3 px-3">Screening / Enrolled</th>
              <th scope="col" className="py-3 px-4">Next Operational Activity</th>
              <th scope="col" className="py-3 px-3">Coordinator</th>
              <th scope="col" className="py-3 px-3 text-center">Attention</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {participants.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-surface-soft/80 transition-colors group cursor-pointer"
              >
                {/* Participant ID & Initials */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
                      {p.participantCode}
                    </span>
                    <span className="font-semibold text-ink-secondary">({p.initials})</span>
                  </div>
                  <span className="text-[11px] text-ink-muted block mt-0.5">
                    Scr: {p.screeningCode}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-3">
                  <ParticipantStatusBadge status={p.status} size="sm" />
                  <span className="text-[10px] text-ink-muted block mt-1 truncate max-w-[130px]">
                    {p.phase}
                  </span>
                </td>

                {/* Demographics */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span className="font-medium text-ink">
                    {p.age} yrs / {p.sex === 'M' ? 'Male' : p.sex === 'F' ? 'Female' : p.sex}
                  </span>
                </td>

                {/* Dates */}
                <td className="py-3.5 px-3 whitespace-nowrap text-ink-secondary text-[11px]">
                  <div>Scr: {p.screeningDate}</div>
                  <div className="text-ink-muted">
                    Enr: {p.enrollmentDate ? p.enrollmentDate : '—'}
                  </div>
                </td>

                {/* Next Activity */}
                <td className="py-3.5 px-4 max-w-[220px]">
                  {p.nextActivityName ? (
                    <div>
                      <span className="font-medium text-ink block truncate leading-tight">
                        {p.nextActivityName}
                      </span>
                      <span className="text-[11px] text-accent-dark flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {p.nextActivityDate || 'Scheduled'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-ink-muted italic">No pending visit</span>
                  )}
                </td>

                {/* Coordinator */}
                <td className="py-3.5 px-3 whitespace-nowrap text-ink-secondary">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-ink-muted" />
                    <span>{p.assignedCoordinatorName}</span>
                  </div>
                </td>

                {/* Attention Flag */}
                <td className="py-3.5 px-3 text-center">
                  {p.attentionRequired ? (
                    <span
                      title={p.attentionReason || 'Attention required'}
                      className="inline-flex p-1 bg-red-50 text-semantic-danger rounded-sm border border-red-200"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-ink-muted text-xs">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <Link
                    to={`/pi/patients/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark group-hover:underline"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
