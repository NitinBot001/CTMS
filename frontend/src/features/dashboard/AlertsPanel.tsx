import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/data-display/Card'
import { Icon } from '@/components/primitives/Icon'
import { StatusBadge } from '@/components/status/StatusBadge'
import type { PortfolioAlertItem } from '@/types/api'

export interface AlertsPanelProps {
  alerts: PortfolioAlertItem[]
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  return (
    <Card className="p-4 bg-white border border-[#E4DED3] flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E4DED3]">
        <div className="flex items-center gap-2">
          <Icon name="alert" size="sm" className="text-[#9B2C2C]" />
          <h3 className="font-serif text-sm font-bold text-[#1C1A17]">Actionable Alerts</h3>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#FDF2F2] text-[#9B2C2C] font-semibold">
          {alerts.length}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-[#726B5C] text-xs">
          <Icon name="check" size="md" className="text-[#1F5C3F] mb-1.5" />
          <span>No critical portfolio alerts currently pending</span>
        </div>
      ) : (
        <div className="space-y-2.5 overflow-y-auto max-h-72 pr-1">
          {alerts.map((alert, index) => {
            const isDanger = alert.severity === 'critical' || alert.severity === 'high'
            return (
              <div
                key={`${alert.study_id}-${index}`}
                className={`p-2.5 rounded-xs border text-xs ${
                  isDanger
                    ? 'border-[#F5C6C6] bg-[#FDF2F2]'
                    : 'border-[#E9D6A9] bg-[#FBF7EE]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-[#1C1A17]">{alert.title}</span>
                  <StatusBadge
                    status={isDanger ? 'danger' : 'warning'}
                    label={alert.severity}
                    size="sm"
                  />
                </div>
                <p className="text-[#5A5347] text-[11px] leading-relaxed mb-2">
                  {alert.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#726B5C] pt-1 border-t border-black/5">
                  <Link
                    to={`/studies/${alert.study_id}`}
                    className="text-[#7A2A12] font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    View Study <Icon name="arrowRight" size="xs" />
                  </Link>
                  {alert.due_date && <span>Due: {alert.due_date}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
