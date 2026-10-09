import React from 'react'
import { Card } from '@/components/data-display/Card'
import { StatusBadge } from '@/components/status/StatusBadge'
import type { PortfolioHealthResponse } from '@/types/api'

export interface HealthSummaryCardProps {
  health: PortfolioHealthResponse
}

export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({ health }) => {
  const riskColor = {
    green: {
      border: 'border-[#BDDCCB]',
      bg: 'bg-[#EDF6F1]',
      text: 'text-[#1F5C3F]',
      badge: 'success' as const,
      label: 'Optimal Portfolio Health',
    },
    amber: {
      border: 'border-[#E9D6A9]',
      bg: 'bg-[#FBF7EE]',
      text: 'text-[#B8862E]',
      badge: 'warning' as const,
      label: 'Moderate Operational Risk',
    },
    red: {
      border: 'border-[#F5C6C6]',
      bg: 'bg-[#FDF2F2]',
      text: 'text-[#9B2C2C]',
      badge: 'danger' as const,
      label: 'High Operational Risk',
    },
  }[health.risk_level.toLowerCase()] || {
    border: 'border-[#E4DED3]',
    bg: 'bg-white',
    text: 'text-[#1C1A17]',
    badge: 'neutral' as const,
    label: health.status,
  }

  return (
    <Card className={`p-5 border-l-4 ${riskColor.border} bg-white shadow-xs`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#726B5C]">
              Operational Risk Assessment
            </span>
            <StatusBadge status={riskColor.badge} label={riskColor.label} size="sm" />
          </div>
          <p className="text-xs text-[#5A5347]">{health.summary}</p>
        </div>
        <div className="text-[11px] font-mono text-[#726B5C] self-start sm:self-auto shrink-0">
          As of: {health.as_of_date}
        </div>
      </div>

      {/* Grid of indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E4DED3]">
        <div className="p-2.5 rounded-xs bg-[#F8F6F2] border border-[#E4DED3]">
          <span className="text-[11px] text-[#726B5C] block">Delayed Studies</span>
          <span className={`text-base font-bold font-mono ${health.indicators.delayed_studies > 0 ? 'text-[#9B2C2C]' : 'text-[#1F5C3F]'}`}>
            {health.indicators.delayed_studies}
          </span>
        </div>

        <div className="p-2.5 rounded-xs bg-[#F8F6F2] border border-[#E4DED3]">
          <span className="text-[11px] text-[#726B5C] block">Open SAE Cases</span>
          <span className={`text-base font-bold font-mono ${health.indicators.open_serious_adverse_events > 0 ? 'text-[#9B2C2C]' : 'text-[#1F5C3F]'}`}>
            {health.indicators.open_serious_adverse_events}
          </span>
        </div>

        <div className="p-2.5 rounded-xs bg-[#F8F6F2] border border-[#E4DED3]">
          <span className="text-[11px] text-[#726B5C] block">Critical Deviations</span>
          <span className={`text-base font-bold font-mono ${health.indicators.critical_unresolved_deviations > 0 ? 'text-[#B8862E]' : 'text-[#1F5C3F]'}`}>
            {health.indicators.critical_unresolved_deviations}
          </span>
        </div>

        <div className="p-2.5 rounded-xs bg-[#F8F6F2] border border-[#E4DED3]">
          <span className="text-[11px] text-[#726B5C] block">Expired Ethics</span>
          <span className={`text-base font-bold font-mono ${health.indicators.expired_ethics_approvals > 0 ? 'text-[#9B2C2C]' : 'text-[#1F5C3F]'}`}>
            {health.indicators.expired_ethics_approvals}
          </span>
        </div>
      </div>
    </Card>
  )
}
