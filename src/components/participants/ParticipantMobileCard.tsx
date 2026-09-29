import React from 'react';
import { Participant } from '../../types';
import { ParticipantStatusBadge } from './ParticipantStatusBadge';
import { AlertTriangle, ArrowRight, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ParticipantMobileCardProps {
  participant: Participant;
}

export const ParticipantMobileCard: React.FC<ParticipantMobileCardProps> = ({ participant: p }) => {
  return (
    <div className="bg-surface border border-border rounded-sm p-4 shadow-subtle space-y-3">
      {/* Top row: ID, Initials, Status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-ink bg-surface-soft border border-border px-2 py-0.5 rounded-sm">
              {p.participantCode}
            </span>
            <span className="font-semibold text-ink-secondary text-xs">
              {p.initials} &bull; {p.age}y / {p.sex === 'M' ? 'Male' : p.sex === 'F' ? 'Female' : p.sex}
            </span>
          </div>
          <span className="text-[11px] text-ink-muted block mt-1">
            Scr: {p.screeningCode} &bull; Date: {p.screeningDate}
          </span>
        </div>

        <ParticipantStatusBadge status={p.status} size="sm" />
      </div>

      {/* Attention Banner if flagged */}
      {p.attentionRequired && p.attentionReason && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-sm text-xs text-semantic-danger flex items-start gap-1.5 leading-snug">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{p.attentionReason}</span>
        </div>
      )}

      {/* Middle row: Phase & Next Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-border">
        <div>
          <span className="text-[10px] text-ink-muted uppercase font-semibold block">Protocol Phase</span>
          <span className="text-ink font-medium">{p.phase}</span>
        </div>

        <div>
          <span className="text-[10px] text-ink-muted uppercase font-semibold block">Next Scheduled</span>
          {p.nextActivityName ? (
            <div className="text-ink flex items-center gap-1 mt-0.5 truncate">
              <Calendar className="w-3 h-3 text-accent shrink-0" />
              <span className="font-medium truncate">{p.nextActivityName}</span>
              {p.nextActivityDate && (
                <span className="text-ink-muted shrink-0 text-[11px]">({p.nextActivityDate})</span>
              )}
            </div>
          ) : (
            <span className="text-ink-muted italic">None pending</span>
          )}
        </div>
      </div>

      {/* Bottom row: Coordinator & Action CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
        <div className="flex items-center gap-1.5 text-ink-secondary text-[11px]">
          <User className="w-3.5 h-3.5 text-ink-muted" />
          <span>Coord: {p.assignedCoordinatorName}</span>
        </div>

        <Link
          to={`/pi/patients/${p.id}`}
          className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-dark group"
        >
          <span>View Participant</span>
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};
