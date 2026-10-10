import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/data-display/Card'
import { Icon } from '@/components/primitives/Icon'
import { Button } from '@/components/primitives/Button'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Dialog, DialogHeader, DialogContent } from '@/components/overlays/Dialog'
import { LoadingState } from '@/components/feedback/LoadingState'
import { platformApi } from '@/api/platform.api'
import type {
  SuperAdminOverviewResponse,
  SuperAdminStudyItem,
  ParticipantRead,
} from '@/types/api'

interface SuperAdminOverviewDashboardProps {
  data: SuperAdminOverviewResponse
}

export const SuperAdminOverviewDashboard: React.FC<SuperAdminOverviewDashboardProps> = ({ data }) => {
  const [selectedStudy, setSelectedStudy] = useState<SuperAdminStudyItem | null>(null)

  const participantsQuery = useQuery<ParticipantRead[]>({
    queryKey: ['super-admin', 'study-participants', selectedStudy?.id],
    queryFn: () => platformApi.inspectStudyParticipants(selectedStudy!.id),
    enabled: !!selectedStudy,
  })

  const totalSitesAcrossStudies = data.studies.reduce((acc, s) => acc + s.participating_sites_count, 0)
  const totalParticipantsAcrossStudies = data.studies.reduce((acc, s) => acc + s.participant_count, 0)

  return (
    <div className="space-y-6">
      {/* Oversight Banner */}
      <div className="bg-[#F8F6F2] border border-[#E4DED3] rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xs bg-[#7A2A12]/10 text-[#7A2A12]">
            <Icon name="shield" size="md" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1C1A17] flex items-center gap-2">
              Platform Super Admin Oversight
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[#1F5C3F]/10 text-[#1F5C3F] rounded-full border border-[#1F5C3F]/20">
                System-Wide Read-Only
              </span>
            </h2>
            <p className="text-xs text-[#726B5C]">
              Comprehensive cross-organizational telemetry across all registered Sponsors, CROs, and active research protocols.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Sponsors
            </span>
            <div className="p-1.5 rounded-xs bg-[#7A2A12]/10 text-[#7A2A12]">
              <Icon name="organization" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.total_sponsors}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Registered drug/ayush sponsors</div>
        </Card>

        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              CROs
            </span>
            <div className="p-1.5 rounded-xs bg-[#B8862E]/10 text-[#B8862E]">
              <Icon name="activity" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.total_cros}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Research trial organizations</div>
        </Card>

        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Total Studies
            </span>
            <div className="p-1.5 rounded-xs bg-[#1F5C3F]/10 text-[#1F5C3F]">
              <Icon name="study" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.total_studies}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Active research protocols</div>
        </Card>

        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Active Sites
            </span>
            <div className="p-1.5 rounded-xs bg-[#2B6CB0]/10 text-[#2B6CB0]">
              <Icon name="site" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {totalSitesAcrossStudies}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Participating clinical sites</div>
        </Card>

        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Participants
            </span>
            <div className="p-1.5 rounded-xs bg-[#6B46C1]/10 text-[#6B46C1]">
              <Icon name="participants" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {totalParticipantsAcrossStudies}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Across all clinical trials</div>
        </Card>
      </div>

      {/* Organizations Directory: Sponsors & CROs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sponsors Card */}
        <Card className="p-5 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-3 border-b border-[#E4DED3] pb-2">
            <div className="flex items-center gap-2">
              <Icon name="organization" size="sm" className="text-[#7A2A12]" />
              <h3 className="font-semibold text-sm text-[#1C1A17]">Registered Sponsors</h3>
            </div>
            <span className="text-xs text-[#726B5C] font-mono">{data.sponsors.length} orgs</span>
          </div>
          {data.sponsors.length === 0 ? (
            <p className="text-xs text-[#726B5C] py-4 text-center">No registered sponsors found</p>
          ) : (
            <div className="divide-y divide-[#F8F6F2]">
              {data.sponsors.map((sp) => (
                <div key={sp.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#1C1A17]">{sp.name}</span>
                    {sp.registration_number && (
                      <span className="text-xs text-[#726B5C] ml-2 font-mono">({sp.registration_number})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#726B5C]">
                      {sp.studies_count} {sp.studies_count === 1 ? 'study' : 'studies'}
                    </span>
                    <StatusBadge status={sp.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* CROs Card */}
        <Card className="p-5 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-3 border-b border-[#E4DED3] pb-2">
            <div className="flex items-center gap-2">
              <Icon name="activity" size="sm" className="text-[#B8862E]" />
              <h3 className="font-semibold text-sm text-[#1C1A17]">Registered Contract Research Organizations (CROs)</h3>
            </div>
            <span className="text-xs text-[#726B5C] font-mono">{data.cros.length} orgs</span>
          </div>
          {data.cros.length === 0 ? (
            <p className="text-xs text-[#726B5C] py-4 text-center">No registered CROs found</p>
          ) : (
            <div className="divide-y divide-[#F8F6F2]">
              {data.cros.map((cro) => (
                <div key={cro.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[#1C1A17]">{cro.name}</span>
                    {cro.registration_number && (
                      <span className="text-xs text-[#726B5C] ml-2 font-mono">({cro.registration_number})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#726B5C]">
                      {cro.studies_count} {cro.studies_count === 1 ? 'study' : 'studies'}
                    </span>
                    <StatusBadge status={cro.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Studies Operational Directory */}
      <Card className="p-5 bg-white border border-[#E4DED3]">
        <div className="flex items-center justify-between mb-4 border-b border-[#E4DED3] pb-3">
          <div>
            <h3 className="font-semibold text-sm text-[#1C1A17]">Platform Research Studies</h3>
            <p className="text-xs text-[#726B5C]">
              Operational state, participating site allocations, and subject enrollment progress
            </p>
          </div>
          <span className="text-xs font-mono text-[#726B5C]">{data.studies.length} total studies</span>
        </div>

        {data.studies.length === 0 ? (
          <p className="text-xs text-[#726B5C] py-8 text-center">No research studies currently registered</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F6F2] text-[#726B5C] border-b border-[#E4DED3] font-medium">
                <tr>
                  <th className="py-2.5 px-3">Study Protocol</th>
                  <th className="py-2.5 px-3">Sponsor / CRO</th>
                  <th className="py-2.5 px-3">Phase & Status</th>
                  <th className="py-2.5 px-3">Sites</th>
                  <th className="py-2.5 px-3">Participants</th>
                  <th className="py-2.5 px-3">Milestones</th>
                  <th className="py-2.5 px-3 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DED3]/60">
                {data.studies.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F8F6F2]/40">
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#1C1A17]">{s.title}</div>
                      <div className="font-mono text-[11px] text-[#726B5C]">
                        {s.study_code} • {s.protocol_number}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[#1C1A17]">{s.sponsor_name || 'N/A'}</div>
                      <div className="text-[#726B5C] text-[11px]">{s.cro_name ? `CRO: ${s.cro_name}` : 'No CRO assigned'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="capitalize font-medium text-[#1C1A17] mb-1">{s.phase.replace('_', ' ')}</div>
                      <StatusBadge status={s.status} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-[#1C1A17]">{s.participating_sites_count}</span>
                      <span className="text-[#726B5C] ml-1">sites</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 font-semibold text-[#1C1A17]">
                        <span>{s.participant_count}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(s.participant_status_distribution || {}).map(([st, cnt]) => (
                          <span key={st} className="px-1.5 py-0.5 bg-[#E4DED3]/40 text-[#5A5347] rounded text-[10px]">
                            {st}: {String(cnt)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[11px] text-[#1C1A17]">
                        <span className="text-[#1F5C3F] font-semibold">{s.completed_milestones_count}</span> done
                        <span className="mx-1">•</span>
                        <span className="text-[#B8862E] font-semibold">{s.pending_milestones_count}</span> pending
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStudy(s)}
                        className="text-xs h-7 px-2"
                      >
                        <Icon name="search" size="xs" className="mr-1" />
                        Inspect Subjects
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Read-Only Participant Inspector Dialog */}
      <Dialog
        open={!!selectedStudy}
        onClose={() => setSelectedStudy(null)}
        size="xl"
      >
        <DialogHeader
          title={`Participant Directory — ${selectedStudy?.study_code || ''}`}
          description="Authorized Super Admin oversight inspection. All data is strictly read-only."
          onClose={() => setSelectedStudy(null)}
        />
        <DialogContent className="space-y-4">
          <div className="p-3 bg-[#F8F6F2] border border-[#E4DED3] rounded text-xs flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#1C1A17]">{selectedStudy?.title}</span>
              <p className="text-[#726B5C] text-[11px] mt-0.5">
                Authorized Super Admin oversight inspection. All data is strictly read-only.
              </p>
            </div>
            <StatusBadge status={selectedStudy?.status || 'active'} size="sm" />
          </div>

          {participantsQuery.isLoading ? (
            <LoadingState message="Loading participant registry for study..." />
          ) : participantsQuery.data?.length === 0 ? (
            <p className="text-center py-8 text-xs text-[#726B5C]">
              No participants currently enrolled or screened under this protocol.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto border border-[#E4DED3] rounded">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F6F2] text-[#726B5C] border-b border-[#E4DED3] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Subject ID</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Screening Date</th>
                    <th className="py-2 px-3">Enrollment Date</th>
                    <th className="py-2 px-3">Site ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4DED3]">
                  {participantsQuery.data?.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F8F6F2]/30">
                      <td className="py-2 px-3 font-mono font-medium text-[#1C1A17]">
                        {p.participant_code || p.id.slice(0, 8)}
                      </td>
                      <td className="py-2 px-3">
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                      <td className="py-2 px-3 text-[#726B5C]">
                        {p.screening_date ? new Date(p.screening_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2 px-3 text-[#726B5C]">
                        {p.enrollment_date ? new Date(p.enrollment_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-[#726B5C]">
                        {p.site_id ? String(p.site_id).slice(0, 8) + '...' : 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedStudy(null)}>
              Close Inspector
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
