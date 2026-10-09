import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/data-display/Card'
import { Icon } from '@/components/primitives/Icon'
import { StatusBadge } from '@/components/status/StatusBadge'
import type { UpcomingMilestoneItem } from '@/types/api'

export interface UpcomingMilestonesProps {
  milestones: UpcomingMilestoneItem[]
}

export const UpcomingMilestones: React.FC<UpcomingMilestonesProps> = ({ milestones }) => {
  return (
    <Card className="p-4 bg-white border border-[#E4DED3] flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E4DED3]">
        <div className="flex items-center gap-2">
          <Icon name="calendar" size="sm" className="text-[#315A78]" />
          <h3 className="font-serif text-sm font-bold text-[#1C1A17]">Upcoming Milestones</h3>
        </div>
        <span className="text-xs text-[#726B5C] font-mono">
          {milestones.length} scheduled
        </span>
      </div>

      {milestones.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-[#726B5C] text-xs">
          <Icon name="calendar" size="md" className="text-[#726B5C]/50 mb-1.5" />
          <span>No upcoming milestones scheduled in this window</span>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="p-2.5 rounded-xs border border-[#E4DED3] bg-[#F8F6F2] hover:bg-white transition-colors text-xs"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <span className="font-semibold text-[#1C1A17] block">{m.title}</span>
                  {m.study_code && (
                    <Link
                      to={`/studies/${m.study_id}`}
                      className="text-[11px] font-mono text-[#7A2A12] hover:underline"
                    >
                      {m.study_code}
                    </Link>
                  )}
                </div>
                <StatusBadge status={m.status} size="sm" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#726B5C] mt-2 pt-1 border-t border-[#E4DED3]">
                <span>Planned: {m.planned_date || 'TBD'}</span>
                {m.actual_date && <span className="text-[#1F5C3F]">Completed: {m.actual_date}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
