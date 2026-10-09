import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { platformApi } from '@/api/platform.api'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/app/providers/toastContext'
import type { OnboardingRequestRead, OnboardingRequestStatus, ProvisionResult } from '@/types/api'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/data-display/Card'
import { MetricCard } from '@/components/data-display/Stat'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/forms/Input'
import { Dialog, DialogHeader, DialogContent } from '@/components/overlays/Dialog'
import { Alert } from '@/components/feedback/Alert'
import { Icon } from '@/components/primitives/Icon'
import { formatDate } from '@/lib/date'

type FilterStatus = 'all' | OnboardingRequestStatus

export const SuperAdminPage: React.FC = () => {
  const { isSuperAdmin } = useAuth()
  const { addToast } = useToast()

  const [requests, setRequests] = useState<OnboardingRequestRead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Selected request for review
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequestRead | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  // Provisioning result modal
  const [provisionResult, setProvisionResult] = useState<ProvisionResult | null>(null)

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await platformApi.listOnboardingRequests()
      setRequests(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch platform onboarding requests.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isSuperAdmin) {
      void fetchRequests()
    }
  }, [isSuperAdmin, fetchRequests])

  // Counts
  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      under_review: requests.filter((r) => r.status === 'under_review').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
      changes_requested: requests.filter((r) => r.status === 'changes_requested').length,
    }
  }, [requests])

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (activeFilter !== 'all' && r.status !== activeFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const orgMatch = r.organization_name?.toLowerCase().includes(q)
        const nameMatch = r.applicant_name?.toLowerCase().includes(q)
        const emailMatch = r.email?.toLowerCase().includes(q)
        return orgMatch || nameMatch || emailMatch
      }
      return true
    })
  }, [requests, activeFilter, searchQuery])

  const handleOpenReview = (request: OnboardingRequestRead) => {
    setSelectedRequest(request)
    setReviewNotes(request.review_notes || '')
    setReviewError(null)
  }

  const handleTransitionStatus = async (newStatus: OnboardingRequestStatus) => {
    if (!selectedRequest) return
    setIsProcessing(true)
    setReviewError(null)
    try {
      const updated = await platformApi.reviewOnboardingRequest(selectedRequest.id, {
        status: newStatus,
        review_notes: reviewNotes.trim() || null,
      })
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Request moved to ${newStatus.replace('_', ' ')}.`,
      })
      setSelectedRequest(updated)
      await fetchRequests()
    } catch (err: any) {
      setReviewError(err?.message || 'Failed to update review status.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApproveProvision = async () => {
    if (!selectedRequest) return
    setIsProcessing(true)
    setReviewError(null)
    try {
      const result = await platformApi.approveOnboardingRequest(selectedRequest.id)
      setProvisionResult(result)
      setSelectedRequest(null)
      addToast({
        type: 'success',
        title: 'Organization Provisioned',
        message: `Successfully provisioned ${selectedRequest.organization_name}.`,
      })
      await fetchRequests()
    } catch (err: any) {
      setReviewError(err?.message || 'Failed to provision organization.')
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text)
    addToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: 'Activation link copied to clipboard.',
    })
  }

  if (!isSuperAdmin) {
    return (
      <PageContainer>
        <Alert type="danger" title="Access Prohibited">
          This section is strictly reserved for Platform Super Administrators.
        </Alert>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Platform Super Admin"
        subtitle="Controlled organization onboarding and institutional access approval"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Administration', href: '/admin' },
          { label: 'Super Admin' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            loading={isLoading}
            leftIcon={<Icon name="refresh" size="xs" />}
          >
            Refresh Requests
          </Button>
        }
      />

      {error && (
        <Alert type="danger" title="Failed to Load" className="mb-6">
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Inbound Requests"
          value={counts.all}
          icon="organization"
          subtext="Cumulative applications"
        />
        <MetricCard
          label="Pending Initial Review"
          value={counts.pending}
          icon="clock"
          accentColor="accent"
          subtext="Require screening"
        />
        <MetricCard
          label="Under Verification"
          value={counts.under_review}
          icon="eye"
          accentColor="primary"
          subtext="In review pipeline"
        />
        <MetricCard
          label="Approved Organizations"
          value={counts.approved}
          icon="badgeCheck"
          accentColor="secondary"
          subtext="Live platform tenants"
        />
      </div>

      {/* Requests Explorer Card */}
      <Card className="p-0 overflow-hidden">
        {/* Status Filter Tabs & Search */}
        <div className="p-4 border-b border-[#E4DED3] bg-[#FAF8F5] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {(
              [
                { id: 'all', label: 'All', count: counts.all },
                { id: 'pending', label: 'Pending', count: counts.pending },
                { id: 'under_review', label: 'Under Review', count: counts.under_review },
                { id: 'approved', label: 'Approved', count: counts.approved },
                { id: 'changes_requested', label: 'Changes Req.', count: counts.changes_requested },
                { id: 'rejected', label: 'Rejected', count: counts.rejected },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as FilterStatus)}
                className={`px-3 py-1.5 rounded-xs text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-[#7A2A12] text-white shadow-xs'
                    : 'bg-white border border-[#E4DED3] text-[#726B5C] hover:bg-[#F8F6F2] hover:text-[#1C1A17]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1 rounded-full text-[10px] ${
                    activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-[#E4DED3] text-[#1C1A17]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="w-full md:w-72">
            <Input
              placeholder="Search by org, name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E4DED3] bg-[#F8F6F2] text-[#726B5C] uppercase text-[10px] tracking-wider font-mono">
                <th className="py-3 px-4 font-semibold">Organization</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Authorized Representative</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Submitted</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DED3]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#726B5C]">
                    <div className="flex flex-col items-center gap-2">
                      <Icon name="refresh" className="animate-spin text-[#7A2A12]" size="md" />
                      <span>Loading onboarding requests...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#726B5C]">
                    <p className="font-serif text-sm">No onboarding requests found.</p>
                    <p className="text-[11px] mt-1 text-[#A09888]">
                      {searchQuery ? 'Try clearing your search query.' : 'New applications will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#1C1A17]">{req.organization_name}</div>
                      {req.website && (
                        <a
                          href={req.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#B8862E] hover:underline truncate max-w-xs block"
                        >
                          {req.website}
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono uppercase text-[10px] bg-[#E4DED3]/60 px-1.5 py-0.5 rounded-xs text-[#1C1A17]">
                        {req.organization_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#1C1A17]">{req.applicant_name}</div>
                      <div className="text-[11px] text-[#726B5C]">{req.email}</div>
                    </td>
                    <td className="py-3 px-4 text-[#726B5C]">
                      {[req.city, req.state, req.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="py-3 px-4 text-[#726B5C] font-mono text-[11px]">
                      {formatDate(req.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenReview(req)}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Dialog */}
      {selectedRequest && (
        <Dialog
          open={true}
          onClose={() => !isProcessing && setSelectedRequest(null)}
          size="lg"
        >
          <DialogHeader
            title={`Review Request — ${selectedRequest.organization_name}`}
            onClose={() => !isProcessing && setSelectedRequest(null)}
          />
          <DialogContent className="space-y-4 text-xs">
            {reviewError && (
              <Alert type="danger" title="Review Action Failed">
                {reviewError}
              </Alert>
            )}

            {/* Profile Overview */}
            <div className="bg-[#FAF8F5] border border-[#E4DED3] p-4 rounded-xs grid grid-cols-2 gap-3">
              <div>
                <span className="text-[#726B5C] block text-[10px] uppercase font-mono">Organization</span>
                <span className="font-semibold text-sm text-[#1C1A17]">{selectedRequest.organization_name}</span>
                <span className="text-[11px] text-[#B8862E] block capitalize">
                  {selectedRequest.organization_type} Organization
                </span>
              </div>
              <div>
                <span className="text-[#726B5C] block text-[10px] uppercase font-mono">Current Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>
              <div>
                <span className="text-[#726B5C] block text-[10px] uppercase font-mono">Applicant Contact</span>
                <span className="text-[#1C1A17] block font-medium">{selectedRequest.applicant_name}</span>
                <span className="text-[11px] text-[#726B5C] block">{selectedRequest.email}</span>
                {selectedRequest.phone && (
                  <span className="text-[11px] text-[#726B5C] block">{selectedRequest.phone}</span>
                )}
              </div>
              <div>
                <span className="text-[#726B5C] block text-[10px] uppercase font-mono">Location & Web</span>
                <span className="text-[#1C1A17] block">
                  {[selectedRequest.city, selectedRequest.state, selectedRequest.country].filter(Boolean).join(', ') || 'Not specified'}
                </span>
                {selectedRequest.website && (
                  <a
                    href={selectedRequest.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#B8862E] hover:underline"
                  >
                    {selectedRequest.website}
                  </a>
                )}
              </div>
            </div>

            {/* Research Scope */}
            {selectedRequest.description && (
              <div className="border border-[#E4DED3] p-3 rounded-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#726B5C] block mb-1">
                  Scope &amp; Protocol Description
                </span>
                <p className="text-[#1C1A17] whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>
            )}

            {/* Review Notes Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#1C1A17]">
                Super Admin Review Notes / Audit Log
              </label>
              <textarea
                rows={3}
                placeholder="Enter internal verification findings, regulatory checks, or feedback notes..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                disabled={isProcessing}
                className="w-full px-3 py-2 text-xs border border-[#C9C2B3] rounded-xs bg-white text-[#1C1A17] focus:outline-2 focus:outline-[#B8862E] focus:border-[#7A2A12] transition-colors resize-y"
              />
            </div>

            {/* Action Bar based on state machine */}
            <div className="border-t border-[#E4DED3] pt-4 flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
                disabled={isProcessing}
              >
                Close
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                {selectedRequest.status === 'pending' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleTransitionStatus('under_review')}
                    loading={isProcessing}
                    disabled={isProcessing}
                  >
                    Start Verification (Under Review)
                  </Button>
                )}

                {selectedRequest.status === 'under_review' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTransitionStatus('changes_requested')}
                      disabled={isProcessing}
                    >
                      Request Changes
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleTransitionStatus('rejected')}
                      disabled={isProcessing}
                    >
                      Reject Request
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApproveProvision}
                      loading={isProcessing}
                      disabled={isProcessing}
                      className="bg-[#1F5C3F] hover:bg-[#184832] border-[#1F5C3F]"
                    >
                      Approve &amp; Provision Organization
                    </Button>
                  </>
                )}

                {selectedRequest.status === 'changes_requested' && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleTransitionStatus('rejected')}
                      disabled={isProcessing}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleTransitionStatus('under_review')}
                      loading={isProcessing}
                      disabled={isProcessing}
                    >
                      Return to Under Review
                    </Button>
                  </>
                )}

                {selectedRequest.status === 'approved' && (
                  <span className="text-xs text-[#1F5C3F] font-medium flex items-center gap-1">
                    <Icon name="check" size="sm" />
                    Organization Provisioned &amp; Active
                  </span>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Provisioning Success Modal */}
      {provisionResult && (
        <Dialog
          open={true}
          onClose={() => setProvisionResult(null)}
          size="md"
        >
          <DialogHeader
            title="Organization Provisioning Complete"
            onClose={() => setProvisionResult(null)}
          />
          <DialogContent className="space-y-4 text-xs">
            <div className="text-center py-2 space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#1F5C3F]/10 text-[#1F5C3F] flex items-center justify-center mx-auto">
                <Icon name="badgeCheck" size="lg" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#1C1A17]">
                Tenant Environment Successfully Created
              </h3>
              <p className="text-[#726B5C]">
                Organization records, administrator membership, and security tokens have been generated atomically.
              </p>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E4DED3] p-3 rounded-xs space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-[#726B5C] block text-[10px]">Organization ID:</span>
                <span className="text-[#1C1A17]">{provisionResult.organization_id}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block text-[10px]">Administrator Identity:</span>
                <span className="text-[#1C1A17]">{provisionResult.user_email}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block text-[10px]">Email Dispatch:</span>
                <span className={provisionResult.invitation_sent ? 'text-[#1F5C3F]' : 'text-[#B8862E]'}>
                  {provisionResult.invitation_sent ? 'Sent via SMTP' : 'Email disabled (Dev Mode)'}
                </span>
              </div>
            </div>

            {provisionResult.raw_token && (
              <div className="border border-[#B8862E]/40 bg-[#FBF7ED] p-3 rounded-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#7A2A12] flex items-center gap-1 text-[11px]">
                    <Icon name="lock" size="xs" />
                    Invitation Activation Link (Development Mode)
                  </span>
                </div>
                <p className="text-[11px] text-[#5A5347]">
                  The raw activation token is displayed because email dispatch is inactive:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/activate?token=${provisionResult.raw_token}`}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-[#E4DED3] rounded-xs font-mono text-[11px] select-all"
                  />
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/activate?token=${provisionResult.raw_token}`
                      )
                    }
                  >
                    Copy Link
                  </Button>
                </div>
              </div>
            )}

            <div className="border-t border-[#E4DED3] pt-3 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setProvisionResult(null)}
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  )
}
