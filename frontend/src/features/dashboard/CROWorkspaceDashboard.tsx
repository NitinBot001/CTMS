import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/data-display/Card'
import { Icon } from '@/components/primitives/Icon'
import { Button } from '@/components/primitives/Button'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Dialog, DialogHeader, DialogContent } from '@/components/overlays/Dialog'
import { LoadingState } from '@/components/feedback/LoadingState'
import { studiesApi } from '@/api/studies.api'
import { participantsApi } from '@/api/participants.api'
import { platformApi } from '@/api/platform.api'
import type {
  CRODashboardResponse,
  CROStudyItem,
  EligibleSiteItem,
  ParticipantBulkImportResponse,
  ParticipantBulkImportRequest,
  ParticipantImportItem,
} from '@/types/api'

interface CROWorkspaceDashboardProps {
  data: CRODashboardResponse
}

export const CROWorkspaceDashboard: React.FC<CROWorkspaceDashboardProps> = ({ data }) => {
  const queryClient = useQueryClient()

  // Site Discovery State
  const [discoveryStudy, setDiscoveryStudy] = useState<CROStudyItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Bulk Import State
  const [importStudy, setImportStudy] = useState<CROStudyItem | null>(null)
  const [importSiteId, setImportSiteId] = useState('')
  const [csvText, setCsvText] = useState('')
  const [importResult, setImportResult] = useState<ParticipantBulkImportResponse | null>(null)

  // Query: Eligible Sites for Discovery
  const eligibleSitesQuery = useQuery<EligibleSiteItem[]>({
    queryKey: ['studies', discoveryStudy?.id, 'eligible-sites', searchQuery],
    queryFn: () => studiesApi.listEligibleSites(discoveryStudy!.id, searchQuery),
    enabled: !!discoveryStudy,
  })

  // Mutation: Request Site Participation
  const requestParticipationMutation = useMutation({
    mutationFn: (siteId: string) =>
      platformApi.requestSiteParticipation({
        study_id: discoveryStudy!.id,
        site_id: siteId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studies', discoveryStudy?.id, 'eligible-sites'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    },
  })

  // Query: Study Sites for Bulk Import
  const studySitesQuery = useQuery({
    queryKey: ['studies', importStudy?.id, 'sites'],
    queryFn: () => studiesApi.listSites(importStudy!.id),
    enabled: !!importStudy,
  })

  // Mutation: Bulk Import Participants
  const bulkImportMutation = useMutation({
    mutationFn: (payload: ParticipantBulkImportRequest) => participantsApi.bulkImport(payload),
    onSuccess: (res) => {
      setImportResult(res)
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
      queryClient.invalidateQueries({ queryKey: ['participants'] })
    },
  })

  const handleExecuteImport = () => {
    if (!importStudy || !importSiteId || !csvText.trim()) return

    // Parse simple CSV / TSV format
    // Format: code,screening_date,enrollment_date,status
    const lines = csvText.trim().split('\n')
    const parsedRows: ParticipantImportItem[] = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim())
      const parsedStatus = (parts[3] as any) || 'screened'
      return {
        participant_code: parts[0] || '',
        site_id: importSiteId,
        screening_date: parts[1] || undefined,
        enrollment_date: parts[2] || undefined,
        status: parsedStatus,
      }
    })

    bulkImportMutation.mutate({
      study_id: importStudy.id,
      participants: parsedRows,
    })
  }

  return (
    <div className="space-y-6">
      {/* CRO Banner */}
      <div className="bg-[#F8F6F2] border border-[#E4DED3] rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xs bg-[#B8862E]/10 text-[#B8862E]">
            <Icon name="activity" size="md" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1C1A17] flex items-center gap-2">
              CRO Trial Operations Workspace
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[#B8862E]/10 text-[#B8862E] rounded-full border border-[#B8862E]/20">
                Operational Delivery
              </span>
            </h2>
            <p className="text-xs text-[#726B5C]">
              Multi-center protocol orchestration, site recruitment discovery, and participant monitoring.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Managed Studies
            </span>
            <div className="p-1.5 rounded-xs bg-[#B8862E]/10 text-[#B8862E]">
              <Icon name="study" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.studies.length}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Protocols under CRO management</div>
        </Card>

        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Discovered Sites
            </span>
            <div className="p-1.5 rounded-xs bg-[#2B6CB0]/10 text-[#2B6CB0]">
              <Icon name="site" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.eligible_sites_count}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Available for protocol assignment</div>
        </Card>

        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Pending Site Requests
            </span>
            <div className="p-1.5 rounded-xs bg-[#7A2A12]/10 text-[#7A2A12]">
              <Icon name="clock" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.pending_site_requests_count}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Awaiting dual verification</div>
        </Card>

        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Participants Monitored
            </span>
            <div className="p-1.5 rounded-xs bg-[#1F5C3F]/10 text-[#1F5C3F]">
              <Icon name="participants" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.total_participants_in_scope}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Enrolled across managed trials</div>
        </Card>
      </div>

      {/* Managed Studies Operational List */}
      <Card className="p-5 bg-white border border-[#E4DED3]">
        <div className="flex items-center justify-between mb-4 border-b border-[#E4DED3] pb-3">
          <div>
            <h3 className="font-semibold text-sm text-[#1C1A17]">Managed Clinical Protocols</h3>
            <p className="text-xs text-[#726B5C]">
              Discover eligible clinical sites or batch-import screened subjects into activated study sites
            </p>
          </div>
        </div>

        {data.studies.length === 0 ? (
          <p className="text-xs text-[#726B5C] py-8 text-center">No studies currently assigned to your CRO.</p>
        ) : (
          <div className="space-y-4">
            {data.studies.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded border border-[#E4DED3] bg-[#F8F6F2]/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#B8862E] bg-[#B8862E]/10 px-1.5 py-0.5 rounded">
                      {s.study_code}
                    </span>
                    <h4 className="font-semibold text-sm text-[#1C1A17]">{s.title}</h4>
                  </div>
                  <div className="text-xs text-[#726B5C] mt-1">
                    Sponsor: <span className="font-medium text-[#1C1A17]">{s.sponsor_name || 'N/A'}</span> • Phase: <span className="capitalize">{s.phase.replace('_', ' ')}</span> • Active Sites: <span className="font-medium text-[#1C1A17]">{s.active_sites_count}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDiscoveryStudy(s)
                      setSearchQuery('')
                    }}
                    className="text-xs h-7 px-2.5"
                  >
                    <Icon name="search" size="xs" className="mr-1" />
                    Discover Sites
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImportStudy(s)
                      setImportSiteId('')
                      setCsvText('')
                      setImportResult(null)
                    }}
                    className="text-xs h-7 px-2.5"
                  >
                    <Icon name="upload" size="xs" className="mr-1" />
                    Bulk Import
                  </Button>
                  <Link to={`/studies/${s.id}`}>
                    <Button variant="primary" size="sm" className="text-xs h-7 px-2.5">
                      Console
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Site Participation Requests */}
      <Card className="p-5 bg-white border border-[#E4DED3]">
        <div className="flex items-center justify-between mb-3 border-b border-[#E4DED3] pb-2">
          <div className="flex items-center gap-2">
            <Icon name="site" size="sm" className="text-[#2B6CB0]" />
            <h3 className="font-semibold text-sm text-[#1C1A17]">Clinical Site Participation Requests</h3>
          </div>
          <span className="text-xs text-[#726B5C] font-mono">{data.recent_site_requests.length} requests</span>
        </div>

        {data.recent_site_requests.length === 0 ? (
          <p className="text-xs text-[#726B5C] py-4 text-center">No active site participation requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F6F2] text-[#726B5C] border-b border-[#E4DED3]">
                <tr>
                  <th className="py-2 px-3">Study Protocol</th>
                  <th className="py-2 px-3">Clinical Site</th>
                  <th className="py-2 px-3">Government Review</th>
                  <th className="py-2 px-3">Site PI Confirmation</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DED3]">
                {data.recent_site_requests.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-3 font-medium text-[#1C1A17]">{r.study_title}</td>
                    <td className="py-2.5 px-3">
                      <div>{r.site_name}</div>
                      <span className="text-[11px] font-mono text-[#726B5C]">{r.site_code}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={r.government_status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={r.site_status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#726B5C]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Eligible Site Discovery Modal */}
      <Dialog
        open={!!discoveryStudy}
        onClose={() => setDiscoveryStudy(null)}
        size="lg"
      >
        <DialogHeader
          title={`Site Discovery & Participation Request — ${discoveryStudy?.study_code || ''}`}
          description="Search the platform registry for verified clinical research sites. Requesting participation triggers an independent dual-approval verification workflow."
          onClose={() => setDiscoveryStudy(null)}
        />
        <DialogContent className="space-y-4">

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search site name, code, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-[#E4DED3] rounded focus:outline-none focus:ring-1 focus:ring-[#B8862E]"
            />
          </div>

          {eligibleSitesQuery.isLoading ? (
            <LoadingState message="Searching verified clinical sites..." />
          ) : eligibleSitesQuery.data?.length === 0 ? (
            <p className="text-xs text-[#726B5C] py-6 text-center">No matching eligible sites found.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto border border-[#E4DED3] rounded divide-y divide-[#E4DED3]">
              {eligibleSitesQuery.data?.map((site) => (
                <div key={site.id} className="p-3 flex items-center justify-between text-xs hover:bg-[#F8F6F2]/40">
                  <div>
                    <div className="font-semibold text-[#1C1A17]">{site.name}</div>
                    <div className="text-[#726B5C] text-[11px]">
                      {site.site_code} • {site.city}, {site.state}
                    </div>
                  </div>
                  <div>
                    {site.is_assigned ? (
                      <span className="px-2 py-0.5 bg-[#1F5C3F]/10 text-[#1F5C3F] rounded text-[11px] font-medium border border-[#1F5C3F]/20">
                        Assigned ({site.activation_status})
                      </span>
                    ) : site.participation_status ? (
                      <span className="px-2 py-0.5 bg-[#B8862E]/10 text-[#B8862E] rounded text-[11px] font-medium border border-[#B8862E]/20">
                        Request {site.participation_status}
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={requestParticipationMutation.isPending}
                        onClick={() => requestParticipationMutation.mutate(site.id)}
                        className="text-xs h-7 px-2"
                      >
                        Request Participation
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setDiscoveryStudy(null)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Participant Bulk Import Modal */}
      <Dialog
        open={!!importStudy}
        onClose={() => setImportStudy(null)}
        size="lg"
      >
        <DialogHeader
          title={`Participant Bulk Import — ${importStudy?.study_code || ''}`}
          description="Import participant records into an active, authorized site for this protocol. Site association is verified on the backend."
          onClose={() => setImportStudy(null)}
        />
        <DialogContent className="space-y-4">

          <div>
            <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Select Activated Protocol Site</label>
            <select
              value={importSiteId}
              onChange={(e) => setImportSiteId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-[#E4DED3] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#B8862E]"
            >
              <option value="">— Select Authorized Site —</option>
              {studySitesQuery.data
                ?.filter((ss) => ss.activation_status === 'activated')
                .map((ss) => (
                  <option key={ss.site_id} value={ss.site_id}>
                    Site ID: {ss.site_id.slice(0, 8)}... (Activated)
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
              Participant CSV Data (one record per line)
            </label>
            <p className="text-[11px] text-[#726B5C] mb-1">
              Format: <span className="font-mono">participant_code, screening_date (YYYY-MM-DD), enrollment_date, status</span>
            </p>
            <textarea
              rows={5}
              placeholder="SUB-001, 2026-03-01, 2026-03-05, enrolled"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-2 text-xs font-mono border border-[#E4DED3] rounded focus:outline-none focus:ring-1 focus:ring-[#B8862E]"
            />
          </div>

          {importResult && (
            <div className="p-3 bg-[#F8F6F2] border border-[#E4DED3] rounded text-xs space-y-2">
              <div className="font-semibold text-[#1C1A17]">
                Import Result: {importResult.imported_count} succeeded, {importResult.failed_count} failed
              </div>
              {importResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto text-[11px] text-[#9B2C2C] space-y-1">
                  {importResult.errors.map((err, i) => (
                    <div key={i}>
                      Row {err.row} ({err.participant_code}): {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setImportStudy(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!importSiteId || !csvText.trim() || bulkImportMutation.isPending}
              onClick={handleExecuteImport}
            >
              {bulkImportMutation.isPending ? 'Validating & Importing...' : 'Import Participants'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
