import React from 'react';
import { ProtocolDeviation } from '../../types';
import { DeviationClassificationBadge } from './DeviationClassificationBadge';
import { DeviationStatusBadge } from './DeviationStatusBadge';
import { DeviationCapaBadge } from './DeviationCapaBadge';
import { DeviationReviewBadge } from './DeviationReviewBadge';
import { DeviationScopeBadge } from './DeviationScopeBadge';
import { ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComplianceDeviationTableProps {
  deviations: ProtocolDeviation[];
}

export const ComplianceDeviationTable: React.FC<ComplianceDeviationTableProps> = ({
  deviations,
}) => {
  return (
    <div className="bg-surface border border-border rounded-sm shadow-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className="w-full text-left border-collapse text-xs"
          aria-label="Protocol Compliance and Deviations Log"
        >
          <thead>
            <tr className="bg-surface-soft border-b border-border text-ink-muted uppercase font-semibold text-[11px] tracking-wider">
              <th scope="col" className="py-3 px-4">Deviation ID & Title</th>
              <th scope="col" className="py-3 px-3">Scope</th>
              <th scope="col" className="py-3 px-3">Subject</th>
              <th scope="col" className="py-3 px-3">Category</th>
              <th scope="col" className="py-3 px-3">Classification</th>
              <th scope="col" className="py-3 px-3">Occurred</th>
              <th scope="col" className="py-3 px-3">Status</th>
              <th scope="col" className="py-3 px-3">CAPA</th>
              <th scope="col" className="py-3 px-3">PI Review</th>
              <th scope="col" className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {deviations.map((d) => {
              const isCritical = d.classification === 'CRITICAL';

              return (
                <tr
                  key={d.id}
                  className={`hover:bg-surface-soft/80 transition-colors group cursor-pointer ${
                    isCritical ? 'bg-red-50/20' : ''
                  }`}
                >
                  {/* Deviation ID & Title */}
                  <td className="py-3.5 px-4 max-w-[240px]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-ink bg-surface-soft border border-border px-1.5 py-0.5 rounded-sm">
                        {d.id}
                      </span>
                      {d.visitId && (
                        <span className="text-[10px] font-mono text-ink-muted bg-stone-100 px-1 py-0.2 rounded-sm border border-border">
                          {d.visitId}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-ink block truncate leading-tight mt-1">
                      {d.title}
                    </span>
                  </td>

                  {/* Scope */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <DeviationScopeBadge scope={d.scope} size="xs" />
                  </td>

                  {/* Participant */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {d.participantId ? (
                      <Link
                        to={`/pi/patients/${d.participantId}`}
                        className="inline-flex items-center gap-1 font-mono font-bold text-ink hover:text-primary hover:underline"
                        title="View Participant Profile"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {d.participantId}
                      </Link>
                    ) : (
                      <span className="text-ink-muted italic font-mono">—</span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-ink-secondary text-[11px]">
                    {d.category.replace(/_/g, ' ')}
                  </td>

                  {/* Classification */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <DeviationClassificationBadge classification={d.classification} size="sm" />
                  </td>

                  {/* Occurrence Date */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-ink-secondary">
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="w-3 h-3 text-ink-muted" />
                      <span>{d.occurrenceDate}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <DeviationStatusBadge status={d.status} size="sm" />
                  </td>

                  {/* CAPA Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <DeviationCapaBadge
                      status={d.capaStatus}
                      targetDate={d.capaTargetDate}
                      size="sm"
                    />
                  </td>

                  {/* PI Review */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <DeviationReviewBadge status={d.reviewStatus} size="sm" />
                  </td>

                  {/* Action Link */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      to={`/pi/compliance/${d.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark group-hover:underline"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
