import React from 'react';
import { ProtocolDeviation } from '../../types';
import { DeviationClassificationBadge } from './DeviationClassificationBadge';
import { DeviationStatusBadge } from './DeviationStatusBadge';
import { DeviationCapaBadge } from './DeviationCapaBadge';
import { DeviationReviewBadge } from './DeviationReviewBadge';
import { DeviationScopeBadge } from './DeviationScopeBadge';
import { Card } from '../ui/Card';
import { ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComplianceDeviationMobileCardProps {
  deviation: ProtocolDeviation;
}

export const ComplianceDeviationMobileCard: React.FC<ComplianceDeviationMobileCardProps> = ({
  deviation,
}) => {
  const isCritical = deviation.classification === 'CRITICAL';

  return (
    <Card
      className={`p-4 border transition-all ${
        isCritical ? 'bg-red-50/20 border-red-200' : 'bg-surface border-border'
      }`}
    >
      <div className="space-y-3">
        {/* Top Header: ID, Scope, Classification */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
              {deviation.id}
            </span>
            <DeviationScopeBadge scope={deviation.scope} size="xs" />
          </div>
          <DeviationClassificationBadge classification={deviation.classification} size="sm" />
        </div>

        {/* Title */}
        <div>
          <h4 className="text-sm font-semibold font-heading text-ink leading-snug">
            {deviation.title}
          </h4>
          <p className="text-xs text-ink-muted line-clamp-2 mt-1">{deviation.description}</p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60 text-ink-secondary">
          {deviation.participantId && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-ink-muted block">
                Subject
              </span>
              <Link
                to={`/pi/patients/${deviation.participantId}`}
                className="font-mono font-bold text-primary hover:underline"
              >
                {deviation.participantId}
              </Link>
            </div>
          )}

          <div>
            <span className="text-[10px] uppercase font-semibold text-ink-muted block">
              Occurred
            </span>
            <span className="font-mono flex items-center gap-1 mt-0.5 text-xs">
              <Calendar className="w-3 h-3 text-ink-muted" />
              {deviation.occurrenceDate}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-ink-muted block">
              Status
            </span>
            <div className="mt-0.5">
              <DeviationStatusBadge status={deviation.status} size="xs" />
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-ink-muted block">
              CAPA
            </span>
            <div className="mt-0.5">
              <DeviationCapaBadge
                status={deviation.capaStatus}
                targetDate={deviation.capaTargetDate}
                size="xs"
              />
            </div>
          </div>
        </div>

        {/* Bottom Review & Action Link */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
          <DeviationReviewBadge status={deviation.reviewStatus} size="sm" />

          <Link
            to={`/pi/compliance/${deviation.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark"
          >
            <span>Review Deviation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
};
