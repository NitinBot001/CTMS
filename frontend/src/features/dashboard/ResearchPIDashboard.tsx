import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/data-display/Card'
import { Icon } from '@/components/primitives/Icon'
import { Button } from '@/components/primitives/Button'
import { StatusBadge } from '@/components/status/StatusBadge'
import type { ResearchPIDashboardResponse } from '@/types/api'

interface ResearchPIDashboardProps {
  data: ResearchPIDashboardResponse
}

export const ResearchPIDashboard: React.FC<ResearchPIDashboardProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="bg-[#F8F6F2] border border-[#E4DED3] rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xs bg-[#7A2A12]/10 text-[#7A2A12]">
            <Icon name="study" size="md" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1C1A17] flex items-center gap-2">
              Principal Investigator & Sponsor Research Hub
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[#7A2A12]/10 text-[#7A2A12] rounded-full border border-[#7A2A12]/20">
                Protocol-Scoped
              </span>
            </h2>
            <p className="text-xs text-[#726B5C]">
              Real-time progression of your sponsored Ayurveda trials, affiliated site activations, and research milestones.
            </p>
          </div>
        </div>
        <Link to="/studies">
          <Button variant="primary" size="sm" className="text-xs">
            <Icon name="plus" size="xs" className="mr-1.5" />
            View All Studies
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Assigned Studies
            </span>
            <div className="p-1.5 rounded-xs bg-[#7A2A12]/10 text-[#7A2A12]">
              <Icon name="study" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.studies.length}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Research protocols in your purview</div>
        </Card>

        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Active Sites
            </span>
            <div className="p-1.5 rounded-xs bg-[#1F5C3F]/10 text-[#1F5C3F]">
              <Icon name="site" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.active_sites_count}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Authorized participating sites</div>
        </Card>

        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Team Verifications
            </span>
            <div className="p-1.5 rounded-xs bg-[#B8862E]/10 text-[#B8862E]">
              <Icon name="users" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.pending_team_invitations}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Invitations pending verification</div>
        </Card>

        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Upcoming Milestones
            </span>
            <div className="p-1.5 rounded-xs bg-[#2B6CB0]/10 text-[#2B6CB0]">
              <Icon name="calendar" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.upcoming_milestones.length}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Scheduled protocol targets</div>
        </Card>
      </div>

      {/* Assigned Research Studies */}
      <Card className="p-5 bg-white border border-[#E4DED3]">
        <div className="flex items-center justify-between mb-4 border-b border-[#E4DED3] pb-3">
          <div>
            <h3 className="font-semibold text-sm text-[#1C1A17]">Your Research Studies</h3>
            <p className="text-xs text-[#726B5C]">
              Operational tracking of enrollment vs. planned sample sizes across active protocol sites
            </p>
          </div>
        </div>

        {data.studies.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#726B5C]">
            <p>You have not been assigned as Principal Investigator to any studies yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.studies.map((s) => {
              const target = s.planned_sample_size || 0
              const progressPct = target > 0 ? Math.min(100, Math.round((s.enrolled_participants / target) * 100)) : 0

              return (
                <div
                  key={s.id}
                  className="p-4 rounded border border-[#E4DED3] bg-[#F8F6F2]/30 hover:bg-[#F8F6F2] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#7A2A12] bg-[#7A2A12]/10 px-1.5 py-0.5 rounded">
                          {s.study_code}
                        </span>
                        <h4 className="font-semibold text-sm text-[#1C1A17]">{s.title}</h4>
                      </div>
                      <span className="text-xs text-[#726B5C] mt-0.5 block">
                        Protocol #{s.protocol_number} • Phase: <span className="capitalize">{s.phase.replace('_', ' ')}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s.status} size="sm" />
                      <Link to={`/studies/${s.id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
                          Study Console
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Enrollment Progress Bar */}
                  <div className="mt-3 pt-3 border-t border-[#E4DED3]/60 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <span className="text-[11px] text-[#726B5C] block">Participating Sites</span>
                      <span className="text-sm font-semibold text-[#1C1A17]">
                        {s.active_sites_count} {s.active_sites_count === 1 ? 'active site' : 'active sites'}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#726B5C]">Enrollment</span>
                        <span className="font-medium text-[#1C1A17]">
                          {s.enrolled_participants} / {s.planned_sample_size || '—'} ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#E4DED3] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#1F5C3F] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-[#726B5C] block">Pending Milestones</span>
                      <span className="text-sm font-semibold text-[#B8862E]">{s.pending_milestones}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Upcoming Milestones Feed */}
      <Card className="p-5 bg-white border border-[#E4DED3]">
        <div className="flex items-center justify-between mb-3 border-b border-[#E4DED3] pb-2">
          <div className="flex items-center gap-2">
            <Icon name="calendar" size="sm" className="text-[#2B6CB0]" />
            <h3 className="font-semibold text-sm text-[#1C1A17]">Protocol Delivery Milestones</h3>
          </div>
          <span className="text-xs text-[#726B5C] font-mono">{data.upcoming_milestones.length} items</span>
        </div>

        {data.upcoming_milestones.length === 0 ? (
          <p className="text-xs text-[#726B5C] py-4 text-center">No upcoming protocol milestones logged.</p>
        ) : (
          <div className="divide-y divide-[#E4DED3]/60">
            {data.upcoming_milestones.map((rawM, idx) => {
              const m = rawM as { id?: string; study_code?: string; title?: string; target_date?: string; status?: string }
              const itemKey = m.id || `milestone-${idx}`
              return (
                <div key={itemKey} className="py-2.5 flex items-center justify-between">
                  <div>
                    {m.study_code && (
                      <span className="font-mono text-xs font-semibold text-[#7A2A12] mr-2">
                        {String(m.study_code)}
                      </span>
                    )}
                    <span className="text-xs font-medium text-[#1C1A17]">{m.title ? String(m.title) : 'Operational Target'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#726B5C]">
                      {m.target_date ? `Due ${new Date(String(m.target_date)).toLocaleDateString()}` : 'Date unassigned'}
                    </span>
                    <StatusBadge status={m.status ? String(m.status) : 'pending'} size="sm" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
