import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/data-display/Card'
import { Icon } from '@/components/primitives/Icon'
import { Button } from '@/components/primitives/Button'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Dialog, DialogHeader, DialogContent } from '@/components/overlays/Dialog'
import { platformApi } from '@/api/platform.api'
import type {
  SitePIDashboardResponse,
  SiteIncomingRequestItem,
} from '@/types/api'

interface SitePIDashboardProps {
  data: SitePIDashboardResponse
}

export const SitePIDashboard: React.FC<SitePIDashboardProps> = ({ data }) => {
  const queryClient = useQueryClient()

  // Review modal state
  const [reviewRequest, setReviewRequest] = useState<SiteIncomingRequestItem | null>(null)
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved')
  const [notes, setNotes] = useState('')

  const respondMutation = useMutation({
    mutationFn: (variables: { requestId: string; decision: 'approved' | 'rejected'; notes?: string }) =>
      platformApi.respondSiteParticipationSite(variables.requestId, {
        decision: variables.decision,
        notes: variables.notes,
      }),
    onSuccess: () => {
      setReviewRequest(null)
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
    },
  })

  const handleConfirmDecision = () => {
    if (!reviewRequest) return
    respondMutation.mutate({
      requestId: reviewRequest.id,
      decision,
      notes,
    })
  }

  return (
    <div className="space-y-6">
      {/* Institutional Site Banner */}
      <div className="bg-[#F8F6F2] border border-[#E4DED3] rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xs bg-[#1F5C3F]/10 text-[#1F5C3F]">
            <Icon name="site" size="md" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#1C1A17] flex items-center gap-2">
              {data.site_name || 'Clinical Site Workspace'}
              <span className="font-mono text-xs text-[#726B5C]">({data.site_code || 'SITE-N/A'})</span>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-[#1F5C3F]/10 text-[#1F5C3F] rounded-full border border-[#1F5C3F]/20">
                Institutional Authority
              </span>
            </h2>
            <p className="text-xs text-[#726B5C]">
              {data.city ? `Location: ${data.city}` : 'Clinical research site operations, protocol confirmation, and patient tracking.'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Active Studies
            </span>
            <div className="p-1.5 rounded-xs bg-[#1F5C3F]/10 text-[#1F5C3F]">
              <Icon name="study" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.active_studies_count}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Protocols active at this site</div>
        </Card>

        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Pending Requests
            </span>
            <div className="p-1.5 rounded-xs bg-[#B8862E]/10 text-[#B8862E]">
              <Icon name="clock" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.pending_requests_count}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Study requests awaiting confirmation</div>
        </Card>

        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Site Participants
            </span>
            <div className="p-1.5 rounded-xs bg-[#2B6CB0]/10 text-[#2B6CB0]">
              <Icon name="participants" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.participants_count}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Patients tracked at your facility</div>
        </Card>

        <Card className="p-4 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#726B5C] uppercase tracking-wider">
              Open Safety Events
            </span>
            <div className="p-1.5 rounded-xs bg-[#9B2C2C]/10 text-[#9B2C2C]">
              <Icon name="adverseEvent" size="sm" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1A17]">
            {data.open_safety_events}
          </div>
          <div className="text-[11px] text-[#726B5C] mt-1">Adverse events under site review</div>
        </Card>
      </div>

      {/* Incoming Study Participation Queue */}
      <Card className="p-5 bg-white border border-[#E4DED3]">
        <div className="flex items-center justify-between mb-4 border-b border-[#E4DED3] pb-3">
          <div>
            <h3 className="font-semibold text-sm text-[#1C1A17]">Incoming Protocol Participation Requests</h3>
            <p className="text-xs text-[#726B5C]">
              Sponsor/CRO requests for your site to participate in clinical trials. Requires institutional confirmation.
            </p>
          </div>
          <span className="text-xs font-mono text-[#726B5C]">{data.incoming_requests.length} requests</span>
        </div>

        {data.incoming_requests.length === 0 ? (
          <p className="text-xs text-[#726B5C] py-8 text-center">
            No incoming protocol participation requests currently pending for your site.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F6F2] text-[#726B5C] border-b border-[#E4DED3]">
                <tr>
                  <th className="py-2.5 px-3">Study Title & Code</th>
                  <th className="py-2.5 px-3">Requested By</th>
                  <th className="py-2.5 px-3">Government Verification</th>
                  <th className="py-2.5 px-3">Site Status</th>
                  <th className="py-2.5 px-3">Requested On</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DED3]">
                {data.incoming_requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F8F6F2]/30">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#1C1A17]">{req.study_title}</div>
                      <span className="font-mono text-[11px] text-[#726B5C]">{req.study_code}</span>
                    </td>
                    <td className="py-3 px-3 text-[#1C1A17]">{req.requester_name}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={req.government_status} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={req.site_status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-[#726B5C]">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {req.site_status === 'pending' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setReviewRequest(req)
                            setDecision('approved')
                            setNotes('')
                          }}
                          className="text-xs h-7 px-2.5"
                        >
                          Review & Confirm
                        </Button>
                      ) : (
                        <span className="text-[11px] text-[#726B5C] capitalize">
                          Decision: {req.site_status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review & Respond Modal */}
      <Dialog
        open={!!reviewRequest}
        onClose={() => setReviewRequest(null)}
        size="md"
      >
        <DialogHeader
          title={`Institutional Confirmation — ${reviewRequest?.study_code || ''}`}
          description="Confirm or decline participation for your clinical site in this trial protocol."
          onClose={() => setReviewRequest(null)}
        />
        <DialogContent className="space-y-4">
          <div className="p-3 bg-[#F8F6F2] border border-[#E4DED3] rounded text-xs space-y-1">
            <div className="font-semibold text-[#1C1A17]">{reviewRequest?.study_title}</div>
            <div className="text-[#726B5C]">Requester: {reviewRequest?.requester_name}</div>
            <div className="text-[#726B5C]">
              Government Verification: <span className="font-semibold capitalize">{reviewRequest?.government_status}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Your Institutional Decision</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-xs text-[#1C1A17] cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value="approved"
                  checked={decision === 'approved'}
                  onChange={() => setDecision('approved')}
                  className="accent-[#1F5C3F]"
                />
                <span className="font-medium text-[#1F5C3F]">Confirm Participation</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[#1C1A17] cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value="rejected"
                  checked={decision === 'rejected'}
                  onChange={() => setDecision('rejected')}
                  className="accent-[#9B2C2C]"
                />
                <span className="font-medium text-[#9B2C2C]">Decline Participation</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Institutional Notes / Rationale</label>
            <textarea
              rows={3}
              placeholder="e.g. Approved by institutional ethics committee and site coordinator allocated."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 text-xs border border-[#E4DED3] rounded focus:outline-none focus:ring-1 focus:ring-[#1F5C3F]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setReviewRequest(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={respondMutation.isPending}
              onClick={handleConfirmDecision}
            >
              {respondMutation.isPending ? 'Submitting...' : 'Submit Decision'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
