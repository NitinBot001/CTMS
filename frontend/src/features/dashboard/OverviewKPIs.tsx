import React from 'react'
import { Card } from '@/components/data-display/Card'
import { Icon } from '@/components/primitives/Icon'
import { formatNumber } from '@/lib/format'
import type { PortfolioOverviewResponse } from '@/types/api'

export interface OverviewKPIsProps {
  data: PortfolioOverviewResponse
}

export const OverviewKPIs: React.FC<OverviewKPIsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Studies */}
      <Card className="p-4 bg-white border border-[#E4DED3]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
            Clinical Studies
          </span>
          <div className="p-2 rounded-xs bg-[#7A2A12]/10 text-[#7A2A12]">
            <Icon name="study" size="sm" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl font-bold text-[#1C1A17]">
            {formatNumber(data.studies.active)}
          </span>
          <span className="text-xs text-[#726B5C]">
            active / {formatNumber(data.studies.total)} total
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-[#F8F6F2] flex items-center justify-between text-[11px] text-[#5A5347]">
          <span>{formatNumber(data.studies.planned)} planned</span>
          <span>{formatNumber(data.studies.completed)} completed</span>
          {data.studies.delayed > 0 && (
            <span className="text-[#9B2C2C] font-semibold">{data.studies.delayed} delayed</span>
          )}
        </div>
      </Card>

      {/* Trial Participants */}
      <Card className="p-4 bg-white border border-[#E4DED3]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
            Enrolled Participants
          </span>
          <div className="p-2 rounded-xs bg-[#1F5C3F]/10 text-[#1F5C3F]">
            <Icon name="participants" size="sm" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl font-bold text-[#1C1A17]">
            {formatNumber(data.participants.actual_enrolled)}
          </span>
          <span className="text-xs text-[#726B5C]">
            of {formatNumber(data.participants.total_screened)} screened
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-[#F8F6F2] flex items-center justify-between text-[11px] text-[#5A5347]">
          <span>{formatNumber(data.participants.active_in_treatment)} on therapy</span>
          <span className="text-[#726B5C]">{formatNumber(data.participants.screen_failures)} screen failures</span>
        </div>
      </Card>

      {/* Active Sites */}
      <Card className="p-4 bg-white border border-[#E4DED3]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
            Activated Sites
          </span>
          <div className="p-2 rounded-xs bg-[#315A78]/10 text-[#315A78]">
            <Icon name="site" size="sm" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl font-bold text-[#1C1A17]">
            {formatNumber(data.sites.currently_activated)}
          </span>
          <span className="text-xs text-[#726B5C]">
            / {formatNumber(data.sites.total_registered)} sites
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-[#F8F6F2] flex items-center justify-between text-[11px] text-[#5A5347]">
          <span>
            {data.sites.total_registered > 0
              ? `${Math.round((data.sites.currently_activated / data.sites.total_registered) * 100)}% site activation rate`
              : '0% activation'}
          </span>
        </div>
      </Card>

      {/* Safety Cases */}
      <Card className="p-4 bg-white border border-[#E4DED3]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
            Active Safety Cases
          </span>
          <div className="p-2 rounded-xs bg-[#B8862E]/10 text-[#B8862E]">
            <Icon name="adverseEvent" size="sm" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl font-bold text-[#1C1A17]">
            {formatNumber(data.safety.open_cases)}
          </span>
          <span className="text-xs text-[#726B5C]">
            open events
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-[#F8F6F2] flex items-center justify-between text-[11px]">
          <span className={data.safety.open_serious_cases > 0 ? 'text-[#9B2C2C] font-semibold' : 'text-[#1F5C3F]'}>
            {data.safety.open_serious_cases} Serious (SAE)
          </span>
          <span className="text-[#726B5C]">
            {data.safety.open_cases - data.safety.open_serious_cases} non-serious
          </span>
        </div>
      </Card>
    </div>
  )
}
