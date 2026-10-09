import React from 'react'
import { Card } from '@/components/data-display/Card'
import { Icon } from '@/components/primitives/Icon'
import { formatNumber } from '@/lib/format'
import type { EnrollmentTrendPoint } from '@/types/api'

export interface EnrollmentTrendChartProps {
  trend: EnrollmentTrendPoint[]
}

export const EnrollmentTrendChart: React.FC<EnrollmentTrendChartProps> = ({ trend }) => {
  const maxCumulative = Math.max(...trend.map((p) => p.cumulative_count), 1)

  return (
    <Card className="p-4 bg-white border border-[#E4DED3]">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E4DED3]">
        <div className="flex items-center gap-2">
          <Icon name="trendingUp" size="sm" className="text-[#1F5C3F]" />
          <div>
            <h3 className="font-serif text-sm font-bold text-[#1C1A17]">
              Cumulative Enrollment Velocity
            </h3>
            <p className="text-[11px] text-[#726B5C]">
              Subject recruitment progression across active studies
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold text-[#1F5C3F]">
            {trend.length > 0
              ? `${formatNumber(trend[trend.length - 1].cumulative_count)} Enrolled`
              : '0 Enrolled'}
          </span>
        </div>
      </div>

      {trend.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#726B5C]">
          No enrollment velocity records accumulated yet
        </div>
      ) : (
        <div className="space-y-4">
          {/* Trend Bar Visualization */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 items-end h-36 pt-4 pb-2 px-2 bg-[#F8F6F2] rounded-xs border border-[#E4DED3]">
            {trend.slice(-12).map((point, i) => {
              const heightPct = Math.max(Math.round((point.cumulative_count / maxCumulative) * 100), 8)
              return (
                <div key={i} className="flex flex-col items-center gap-1 h-full justify-end group">
                  <div
                    title={`${point.date || 'Period'}: +${point.enrolled_count} (Total: ${point.cumulative_count})`}
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-[#7A2A12] hover:bg-[#B8862E] transition-all rounded-t-xs relative flex items-center justify-center cursor-pointer"
                  >
                    <span className="text-[9px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 bg-[#1C1A17] px-1 rounded-xs">
                      {point.cumulative_count}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-[#726B5C] truncate max-w-full">
                    {point.date ? point.date.split('-').slice(1).join('/') : `#${i + 1}`}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#726B5C] px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#7A2A12] rounded-xs" />
              Cumulative Patient Cohort
            </span>
            <span>Monthly recruitment reporting window</span>
          </div>
        </div>
      )}
    </Card>
  )
}
