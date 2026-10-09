import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { sitesApi } from '@/api/sites.api'
import { studiesApi } from '@/api/studies.api'
import { platformApi } from '@/api/platform.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/data-display/Card'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/overlays/Dialog'
import { LoadingState, ErrorState } from '@/components/feedback'
import { useToast } from '@/app/providers'
import type { SiteParticipationRequestRead } from '@/types/api'

export const SiteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()

  const [selectedRequestForResponse, setSelectedRequestForResponse] = useState<SiteParticipationRequestRead | null>(null)
  const [responseDecision, setResponseDecision] = useState<'approved' | 'rejected'>('approved')
  const [responseNotes, setResponseNotes] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)

  const { data: site, isLoading, isError } = useQuery({
    queryKey: ['site', id],
    queryFn: () => sitesApi.getById(id!),
    enabled: !!id,
  })

  const incomingParticipationsQuery = useQuery({
    queryKey: ['site', id, 'incoming-participations'],
    queryFn: () => platformApi.listSiteIncomingParticipations(id!),
    enabled: !!id,
  })

  const studiesQuery = useQuery({
    queryKey: ['studies', 'all'],
    queryFn: () => studiesApi.list(),
  })

  const incomingParticipations = incomingParticipationsQuery.data || []
  const studies = studiesQuery.data || []

  const handleRespondParticipation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequestForResponse) return
    setSubmittingResponse(true)
    try {
      await platformApi.respondSiteParticipationSite(selectedRequestForResponse.id, {
        decision: responseDecision,
        notes: responseNotes.trim() || null,
      })
      toast.success(
        responseDecision === 'approved' ? 'Participation Confirmed' : 'Participation Declined',
        'Institutional site response recorded successfully.'
      )
      setSelectedRequestForResponse(null)
      setResponseNotes('')
      incomingParticipationsQuery.refetch()
    } catch (err: unknown) {
      toast.error('Response Failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmittingResponse(false)
    }
  }

  if (isLoading) {
    return (
      <PageContainer maxWidth="2xl">
        <LoadingState message="Loading research site details..." />
      </PageContainer>
    )
  }

  if (isError || !site) {
    return (
      <PageContainer maxWidth="2xl">
        <ErrorState
          title="Site Not Found"
          message="Unable to locate the requested research site facility."
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title={site.name}
        subtitle={`${site.site_type} · Institutional Code: ${site.site_code}`}
        breadcrumbs={[
          { label: 'Sites', href: '/sites' },
          { label: site.site_code },
        ]}
        badge={<StatusBadge status={site.status} />}
        actions={
          <Link to="/sites">
            <Button variant="outline" size="sm" leftIcon={<Icon name="arrowRight" size="xs" className="rotate-180" />}>
              Back to Sites
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
              Clinical Facility Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#726B5C] block mb-0.5">Facility Name</span>
                <span className="font-medium text-[#1C1A17]">{site.name}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Site Code</span>
                <span className="font-mono font-bold text-[#7A2A12]">{site.site_code}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Facility Type</span>
                <span className="font-medium text-[#1C1A17]">{site.site_type}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Operational Status</span>
                <StatusBadge status={site.status} size="sm" />
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Contact Email</span>
                <span className="font-mono text-[#5A5347]">{site.email || '—'}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Contact Phone</span>
                <span className="text-[#5A5347]">{site.phone || '—'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#726B5C] block mb-0.5">Facility Physical Address</span>
                <span className="text-[#5A5347]">
                  {[site.address_line1, site.address_line2, site.city, site.state, site.postal_code, site.country]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </span>
              </div>
            </div>
          </Card>

          {/* Incoming Clinical Study Participation Requests */}
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4DED3]">
              <div>
                <h3 className="font-serif text-sm font-bold text-[#1C1A17] flex items-center gap-2">
                  <span>Incoming Study Participation Requests</span>
                  <span className="text-xs font-normal text-[#726B5C]">({incomingParticipations.length})</span>
                </h3>
                <p className="text-[11px] text-[#726B5C] mt-0.5">
                  Clinical trial protocols requesting this facility&apos;s participation. Institutional Site PI review &amp; confirmation required.
                </p>
              </div>
            </div>

            {incomingParticipations.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#726B5C]">
                No incoming trial participation requests pending for this research site.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#E4DED3] text-[#726B5C] font-semibold">
                      <th className="py-2">Trial Protocol</th>
                      <th className="py-2">Government Review</th>
                      <th className="py-2">Site PI Status</th>
                      <th className="py-2">Overall Status</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F8F6F2]">
                    {incomingParticipations.map((p) => {
                      const matchedStudy = studies.find((s) => s.id === p.study_id)
                      const canRespond = p.site_status === 'pending' && p.status !== 'rejected' && p.status !== 'withdrawn'
                      return (
                        <tr key={p.id} className="hover:bg-[#F8F6F2]">
                          <td className="py-2.5">
                            <span className="font-semibold text-[#1C1A17] block">
                              {matchedStudy?.title || 'Clinical Protocol'}
                            </span>
                            <span className="font-mono text-[11px] text-[#726B5C] block">
                              {matchedStudy?.protocol_number || matchedStudy?.study_code || p.study_id}
                              {matchedStudy?.phase ? ` · Phase ${matchedStudy.phase}` : ''}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <div className="flex flex-col gap-0.5">
                              <StatusBadge status={p.government_status} size="sm" />
                              {p.government_notes && (
                                <span className="text-[10px] text-[#726B5C] italic truncate max-w-[140px]" title={p.government_notes}>
                                  {p.government_notes}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5">
                            <div className="flex flex-col gap-0.5">
                              <StatusBadge status={p.site_status} size="sm" />
                              {p.site_notes && (
                                <span className="text-[10px] text-[#726B5C] italic truncate max-w-[140px]" title={p.site_notes}>
                                  {p.site_notes}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5">
                            <StatusBadge status={p.status} size="sm" />
                          </td>
                          <td className="py-2.5 text-right">
                            {canRespond ? (
                              <Button
                                variant="primary"
                                size="xs"
                                onClick={() => {
                                  setSelectedRequestForResponse(p)
                                  setResponseDecision('approved')
                                  setResponseNotes('')
                                }}
                              >
                                Review &amp; Respond
                              </Button>
                            ) : (
                              <span className="font-mono text-[11px] text-[#726B5C]">
                                {p.site_status === 'approved' ? 'Confirmed' : p.site_status === 'rejected' ? 'Declined' : 'Closed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
              GCP Accreditation &amp; Security
            </h3>
            <div className="space-y-2 text-xs text-[#5A5347]">
              <div className="flex items-center gap-2 text-[#1F5C3F]">
                <Icon name="shieldCheck" size="sm" />
                <span className="font-medium">IEC / Ethics Committee Associated</span>
              </div>
              <p className="text-[11px] text-[#726B5C] leading-relaxed pt-1">
                Facility validated for Good Clinical Practice (GCP) and Schedule Y guidelines under the Drugs and Cosmetics Act.
              </p>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
              Site Dual-Approval Protocol
            </h3>
            <p className="text-xs text-[#5A5347] leading-relaxed">
              Under AyuCTMS governance, research sites participate in trials through independent dual verification. A study request becomes active strictly when affirmed by both Government Verifiers and the institutional Site PI.
            </p>
          </Card>
        </div>
      </div>

      {/* Site PI Response Dialog */}
      <Dialog
        open={!!selectedRequestForResponse}
        onClose={() => setSelectedRequestForResponse(null)}
        size="md"
      >
        <DialogHeader
          title="Respond to Clinical Trial Participation Request"
          description="Institutional Site PI review and formal confirmation/decline for protocol participation."
        />
        {selectedRequestForResponse && (
          <form onSubmit={handleRespondParticipation}>
            <DialogContent className="space-y-4">
              <div className="p-3 bg-[#F8F6F2] border border-[#E4DED3] rounded-xs text-xs space-y-1">
                <div>
                  <span className="text-[#726B5C]">Requested Protocol: </span>
                  <span className="font-semibold text-[#1C1A17]">
                    {studies.find((s) => s.id === selectedRequestForResponse.study_id)?.title || selectedRequestForResponse.study_id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#726B5C]">Government Review Status: </span>
                  <StatusBadge status={selectedRequestForResponse.government_status} size="sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1A17] mb-2">
                  Institutional Decision *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-[#1C1A17] cursor-pointer">
                    <input
                      type="radio"
                      name="siteDecision"
                      value="approved"
                      checked={responseDecision === 'approved'}
                      onChange={() => setResponseDecision('approved')}
                      className="text-[#7A2A12] focus:ring-[#7A2A12]"
                    />
                    <span>Confirm / Accept Participation</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-[#1C1A17] cursor-pointer">
                    <input
                      type="radio"
                      name="siteDecision"
                      value="rejected"
                      checked={responseDecision === 'rejected'}
                      onChange={() => setResponseDecision('rejected')}
                      className="text-[#9B2C2C] focus:ring-[#9B2C2C]"
                    />
                    <span>Decline Participation</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                  Decision Notes &amp; Institutional Rationale
                </label>
                <textarea
                  className="w-full border border-[#E4DED3] rounded-xs p-2.5 text-xs focus:ring-[#7A2A12] focus:border-[#7A2A12] bg-white text-[#1C1A17]"
                  rows={3}
                  placeholder="Record facility readiness, IEC submission date, or justification for declining..."
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                />
              </div>
            </DialogContent>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setSelectedRequestForResponse(null)}
                disabled={submittingResponse}
              >
                Cancel
              </Button>
              <Button
                variant={responseDecision === 'approved' ? 'primary' : 'danger'}
                size="sm"
                type="submit"
                loading={submittingResponse}
              >
                {responseDecision === 'approved' ? 'Submit Confirmation' : 'Decline Request'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>
    </PageContainer>
  )
}
