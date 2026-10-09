import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { platformApi } from '@/api/platform.api'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/app/providers/toastContext'
import type {
  OnboardingRequestRead,
  OnboardingRequestStatus,
  ProvisionResult,
  TeamMemberVerificationRequestRead,
  SiteParticipationRequestRead,
  SuperAdminProfileRead,
  ParticipationDecisionStatus,
} from '@/types/api'
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

type PrimaryTab = 'access_requests' | 'team_verifications' | 'site_participation' | 'verifiers'
type FilterStatus = 'all' | OnboardingRequestStatus

export const SuperAdminPage: React.FC = () => {
  const { isSuperAdmin } = useAuth()
  const { addToast } = useToast()

  const [activePrimaryTab, setActivePrimaryTab] = useState<PrimaryTab>('access_requests')

  // Data states
  const [requests, setRequests] = useState<OnboardingRequestRead[]>([])
  const [teamVerifications, setTeamVerifications] = useState<TeamMemberVerificationRequestRead[]>([])
  const [siteParticipations, setSiteParticipations] = useState<SiteParticipationRequestRead[]>([])
  const [verifiers, setVerifiers] = useState<SuperAdminProfileRead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters for Access Requests
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Access Request Review Drawer
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequestRead | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [provisionResult, setProvisionResult] = useState<ProvisionResult | null>(null)

  // Team Verification Modal
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMemberVerificationRequestRead | null>(null)
  const [teamReviewNotes, setTeamReviewNotes] = useState('')

  // Site Participation Government Review Modal
  const [selectedSitePart, setSelectedSitePart] = useState<SiteParticipationRequestRead | null>(null)
  const [siteGovDecision, setSiteGovDecision] = useState<ParticipationDecisionStatus>('approved')
  const [siteGovNotes, setSiteGovNotes] = useState('')

  // Provision New Verifier Modal
  const [showVerifierModal, setShowVerifierModal] = useState(false)
  const [newVerifierEmail, setNewVerifierEmail] = useState('')
  const [newVerifierName, setNewVerifierName] = useState('')
  const [newVerifierResult, setNewVerifierResult] = useState<{ email: string; raw_token: string | null } | null>(null)

  const fetchAllData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [reqs, teamReqs, siteReqs, verifList] = await Promise.all([
        platformApi.listOnboardingRequests(),
        platformApi.listTeamVerifications().catch(() => []),
        platformApi.listSiteParticipations().catch(() => []),
        platformApi.listVerifiers().catch(() => []),
      ])
      setRequests(reqs)
      setTeamVerifications(teamReqs)
      setSiteParticipations(siteReqs)
      setVerifiers(verifList)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch government verification data.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isSuperAdmin) {
      void fetchAllData()
    }
  }, [isSuperAdmin, fetchAllData])

  // Counts for Access Requests
  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      under_review: requests.filter((r) => r.status === 'under_review').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
      changes_requested: requests.filter((r) => r.status === 'changes_requested').length,
      pending_team: teamVerifications.filter((t) => t.status === 'pending').length,
      pending_site_gov: siteParticipations.filter((s) => s.government_status === 'pending').length,
    }
  }, [requests, teamVerifications, siteParticipations])

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (activeFilter !== 'all' && r.status !== activeFilter) return false
      if (typeFilter !== 'all' && r.request_type !== typeFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const orgMatch = r.organization_name?.toLowerCase().includes(q)
        const nameMatch = r.applicant_name?.toLowerCase().includes(q)
        const emailMatch = r.email?.toLowerCase().includes(q)
        return orgMatch || nameMatch || emailMatch
      }
      return true
    })
  }, [requests, activeFilter, typeFilter, searchQuery])

  // Handlers for Access Request
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
        message: `Request transitioned to ${newStatus.replace('_', ' ')}.`,
      })
      setSelectedRequest(updated)
      await fetchAllData()
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
        title: 'Approved & Provisioned',
        message: `Successfully provisioned ${selectedRequest.organization_name}.`,
      })
      await fetchAllData()
    } catch (err: any) {
      setReviewError(err?.message || 'Failed to provision applicant.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handlers for Team Verification
  const handleReviewTeamMember = async (decisionStatus: OnboardingRequestStatus) => {
    if (!selectedTeamMember) return
    setIsProcessing(true)
    try {
      await platformApi.reviewTeamVerification(selectedTeamMember.id, {
        status: decisionStatus,
        review_notes: teamReviewNotes.trim() || null,
      })
      addToast({
        type: 'success',
        title: 'Team Member Reviewed',
        message: `Team member ${decisionStatus === 'approved' ? 'approved' : 'rejected'}.`,
      })
      setSelectedTeamMember(null)
      await fetchAllData()
    } catch (err: unknown) {
      addToast({ type: 'danger', title: 'Review Failed', message: err instanceof Error ? err.message : 'Failed to review team member.' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handlers for Site Participation Government Review
  const handleReviewSiteGov = async () => {
    if (!selectedSitePart) return
    setIsProcessing(true)
    try {
      await platformApi.reviewSiteParticipationGovernment(selectedSitePart.id, {
        decision: siteGovDecision,
        notes: siteGovNotes.trim() || null,
      })
      addToast({
        type: 'success',
        title: 'Government Decision Recorded',
        message: `Site participation marked ${siteGovDecision}.`,
      })
      setSelectedSitePart(null)
      await fetchAllData()
    } catch (err: unknown) {
      addToast({ type: 'danger', title: 'Failed to Record Decision', message: err instanceof Error ? err.message : 'Error occurred.' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handlers for Provisioning Verifiers
  const handleProvisionVerifier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newVerifierEmail.trim() || !newVerifierName.trim()) return
    setIsProcessing(true)
    try {
      const res = await platformApi.provisionVerifier({
        email: newVerifierEmail.trim().toLowerCase(),
        full_name: newVerifierName.trim(),
      })
      setNewVerifierResult(res)
      addToast({ type: 'success', title: 'Verifier Provisioned', message: `Added ${newVerifierName} as Platform Verifier.` })
      await fetchAllData()
    } catch (err: unknown) {
      addToast({ type: 'danger', title: 'Provisioning Failed', message: err instanceof Error ? err.message : 'Error occurred.' })
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
          This section is strictly reserved for the Government Verification Team & Platform Super Administrators.
        </Alert>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Government Verification & Platform Control"
        subtitle="Platform-level verification for Research PIs, CRO Staff, Site PIs, Research Teams, and Clinical Site Participation"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Administration', href: '/admin' },
          { label: 'Government Verification' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            loading={isLoading}
            leftIcon={<Icon name="refresh" size="xs" />}
          >
            Refresh Queue
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
          label="Total Access Requests"
          value={counts.all}
          icon="organization"
          subtext="Cumulative applicants"
        />
        <MetricCard
          label="Pending Access Screening"
          value={counts.pending + counts.under_review}
          icon="clock"
          accentColor="accent"
          subtext="Awaiting verification"
        />
        <MetricCard
          label="Pending Team Verifications"
          value={counts.pending_team}
          icon="users"
          accentColor="primary"
          subtext="Invited team members"
        />
        <MetricCard
          label="Pending Site Decisions"
          value={counts.pending_site_gov}
          icon="activity"
          accentColor="secondary"
          subtext="Study-site requests"
        />
      </div>

      {/* Primary Operational Tabs */}
      <div className="flex border-b border-[#E4DED3] bg-white rounded-t-xs px-4 pt-3 gap-4 shadow-xs mb-0">
        <button
          type="button"
          onClick={() => setActivePrimaryTab('access_requests')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 text-center transition-colors flex items-center gap-2 cursor-pointer ${
            activePrimaryTab === 'access_requests'
              ? 'border-[#7A2A12] text-[#7A2A12] bg-[#F8F6F2]/60'
              : 'border-transparent text-[#726B5C] hover:text-[#1C1A17]'
          }`}
        >
          <Icon name="document" size="sm" />
          <span>Access Requests</span>
          <span className="bg-[#E4DED3] text-[#1C1A17] text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActivePrimaryTab('team_verifications')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 text-center transition-colors flex items-center gap-2 cursor-pointer ${
            activePrimaryTab === 'team_verifications'
              ? 'border-[#7A2A12] text-[#7A2A12] bg-[#F8F6F2]/60'
              : 'border-transparent text-[#726B5C] hover:text-[#1C1A17]'
          }`}
        >
          <Icon name="users" size="sm" />
          <span>Research Team Verifications</span>
          <span className="bg-[#E4DED3] text-[#1C1A17] text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {teamVerifications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActivePrimaryTab('site_participation')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 text-center transition-colors flex items-center gap-2 cursor-pointer ${
            activePrimaryTab === 'site_participation'
              ? 'border-[#7A2A12] text-[#7A2A12] bg-[#F8F6F2]/60'
              : 'border-transparent text-[#726B5C] hover:text-[#1C1A17]'
          }`}
        >
          <Icon name="activity" size="sm" />
          <span>Site Study Participation (Dual-Approval)</span>
          <span className="bg-[#E4DED3] text-[#1C1A17] text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {siteParticipations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActivePrimaryTab('verifiers')}
          className={`py-3 px-4 text-sm font-semibold border-b-2 text-center transition-colors flex items-center gap-2 cursor-pointer ${
            activePrimaryTab === 'verifiers'
              ? 'border-[#7A2A12] text-[#7A2A12] bg-[#F8F6F2]/60'
              : 'border-transparent text-[#726B5C] hover:text-[#1C1A17]'
          }`}
        >
          <Icon name="shieldCheck" size="sm" />
          <span>Government Verifiers</span>
          <span className="bg-[#E4DED3] text-[#1C1A17] text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {verifiers.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ACCESS REQUESTS */}
      {activePrimaryTab === 'access_requests' && (
        <Card className="p-0 overflow-hidden rounded-t-none">
          {/* Sub Filters */}
          <div className="p-4 border-b border-[#E4DED3] bg-[#FAF8F5] flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-[#726B5C]">Status:</span>
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'under_review', label: 'Under Review' },
                    { id: 'approved', label: 'Approved' },
                    { id: 'rejected', label: 'Rejected' },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveFilter(s.id)}
                    className={`px-2.5 py-1 rounded-xs text-xs font-medium cursor-pointer ${
                      activeFilter === s.id
                        ? 'bg-[#7A2A12] text-white'
                        : 'bg-white border border-[#E4DED3] text-[#726B5C] hover:text-[#1C1A17]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-[#726B5C]">Type:</span>
                {(
                  [
                    { id: 'all', label: 'All Entry Points' },
                    { id: 'research_pi', label: 'Research PI' },
                    { id: 'cro_staff', label: 'CRO Staff' },
                    { id: 'site_pi', label: 'Site PI' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTypeFilter(t.id)}
                    className={`px-2.5 py-1 rounded-xs text-xs font-medium cursor-pointer ${
                      typeFilter === t.id
                        ? 'bg-[#7A2A12] text-white'
                        : 'bg-white border border-[#E4DED3] text-[#726B5C] hover:text-[#1C1A17]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full lg:w-64">
              <Input
                name="search"
                placeholder="Search applicant or organization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftAddon={<Icon name="search" size="xs" />}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F6F2] border-b border-[#E4DED3] text-[#726B5C] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Applicant & Role</th>
                  <th className="py-3 px-4">Organization / Site</th>
                  <th className="py-3 px-4">Entry Point</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DED3]">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[#726B5C]">
                      No access requests found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1C1A17]">{req.applicant_name}</div>
                        <div className="text-[11px] text-[#726B5C]">{req.email}</div>
                        {req.designation && <div className="text-[10px] text-[#B8862E]">{req.designation}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#1C1A17]">{req.organization_name}</div>
                        {req.proposed_site_name && (
                          <div className="text-[10px] text-[#726B5C]">Unit: {req.proposed_site_name}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E4DED3]/60 text-[#1C1A17]">
                          {req.request_type?.replace('_', ' ') || 'Research PI'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#726B5C]">{formatDate(req.created_at)}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="outline" size="xs" onClick={() => handleOpenReview(req)}>
                          Review & Verify
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: TEAM MEMBER VERIFICATIONS */}
      {activePrimaryTab === 'team_verifications' && (
        <Card className="p-0 overflow-hidden rounded-t-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F6F2] border-b border-[#E4DED3] text-[#726B5C] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Proposed Member</th>
                  <th className="py-3 px-4">Requested Role</th>
                  <th className="py-3 px-4">Scope (Study / Org)</th>
                  <th className="py-3 px-4">Invited On</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Government Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DED3]">
                {teamVerifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[#726B5C]">
                      No team member verification requests in queue.
                    </td>
                  </tr>
                ) : (
                  teamVerifications.map((tm) => (
                    <tr key={tm.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1C1A17]">{tm.full_name}</div>
                        <div className="text-[11px] text-[#726B5C]">{tm.email}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#7A2A12]">{tm.requested_role}</td>
                      <td className="py-3 px-4 text-[#726B5C]">
                        {tm.study_id ? `Study: ${tm.study_id.slice(0, 8)}...` : 'Organization Scope'}
                      </td>
                      <td className="py-3 px-4 text-[#726B5C]">{formatDate(tm.created_at)}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={tm.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {tm.status === 'pending' ? (
                          <Button variant="outline" size="xs" onClick={() => setSelectedTeamMember(tm)}>
                            Verify Member
                          </Button>
                        ) : (
                          <span className="text-[11px] text-[#726B5C]">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: SITE STUDY PARTICIPATION (DUAL-APPROVAL) */}
      {activePrimaryTab === 'site_participation' && (
        <Card className="p-0 overflow-hidden rounded-t-none">
          <div className="p-4 bg-[#F8F6F2] border-b border-[#E4DED3] text-xs text-[#726B5C] flex items-center gap-2">
            <Icon name="info" size="sm" className="text-[#B8862E]" />
            <span>
              <strong>Dual-Approval Rule:</strong> Clinical sites require both Government Verification Team approval
              AND Site PI institutional confirmation before study-site association becomes active.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E4DED3] text-[#726B5C] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Study ID</th>
                  <th className="py-3 px-4">Clinical Site ID</th>
                  <th className="py-3 px-4">Government Decision</th>
                  <th className="py-3 px-4">Site PI Decision</th>
                  <th className="py-3 px-4">Overall Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DED3]">
                {siteParticipations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[#726B5C]">
                      No study site participation requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  siteParticipations.map((sp) => (
                    <tr key={sp.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#1C1A17]">{sp.study_id.slice(0, 8)}...</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#1C1A17]">{sp.site_id.slice(0, 8)}...</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            sp.government_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sp.government_status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Gov: {sp.government_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            sp.site_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sp.site_status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Site: {sp.site_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sp.status === 'approved'
                              ? 'bg-emerald-600 text-white'
                              : sp.status === 'rejected'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {sp.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {sp.government_status === 'pending' ? (
                          <Button variant="outline" size="xs" onClick={() => setSelectedSitePart(sp)}>
                            Record Gov Decision
                          </Button>
                        ) : (
                          <span className="text-[11px] text-[#726B5C]">Gov Decision Recorded</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: PLATFORM VERIFIERS */}
      {activePrimaryTab === 'verifiers' && (
        <Card className="p-0 overflow-hidden rounded-t-none">
          <div className="p-4 border-b border-[#E4DED3] bg-[#FAF8F5] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1C1A17]">Authorized Government Verification Personnel</span>
            <Button variant="primary" size="xs" onClick={() => setShowVerifierModal(true)} leftIcon={<Icon name="plus" size="xs" />}>
              Provision New Verifier
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8F6F2] border-b border-[#E4DED3] text-[#726B5C] font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Verifier Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Bootstrapped / Added On</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4DED3]">
                {verifiers.map((v) => (
                  <tr key={v.user_id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#1C1A17]">{v.user?.full_name || 'Government Verifier'}</td>
                    <td className="py-3 px-4 text-[#726B5C]">{v.user?.email}</td>
                    <td className="py-3 px-4 text-[#726B5C]">{formatDate(v.bootstrapped_at)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {v.is_active ? 'Active Verifier' : 'Suspended'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ACCESS REQUEST REVIEW DRAWER/DIALOG */}
      <Dialog open={!!selectedRequest} onClose={() => setSelectedRequest(null)} size="lg">
        <DialogHeader
          title="Applicant Identity & Credential Review"
          description={`Evaluating ${selectedRequest?.applicant_name} (${selectedRequest?.organization_name})`}
          onClose={() => setSelectedRequest(null)}
        />
        <DialogContent>
          {selectedRequest && (
            <div className="space-y-4 text-xs">
              {reviewError && <Alert variant="danger">{reviewError}</Alert>}
              <div className="grid grid-cols-2 gap-3 bg-[#F8F6F2] p-3 rounded-xs border border-[#E4DED3]">
                <div>
                  <span className="text-[#726B5C] block">Applicant Email:</span>
                  <span className="font-medium text-[#1C1A17]">{selectedRequest.email}</span>
                </div>
                <div>
                  <span className="text-[#726B5C] block">Designation:</span>
                  <span className="font-medium text-[#1C1A17]">{selectedRequest.designation || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-[#726B5C] block">Entry Point Type:</span>
                  <span className="font-semibold text-[#7A2A12] capitalize">
                    {selectedRequest.request_type?.replace('_', ' ') || 'Research PI'}
                  </span>
                </div>
                <div>
                  <span className="text-[#726B5C] block">Qualifications:</span>
                  <span className="font-medium text-[#1C1A17]">{selectedRequest.qualifications || 'Standard'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Government Verification Notes</label>
                <textarea
                  className="w-full border border-[#E4DED3] rounded-xs p-2 text-xs focus:ring-[#7A2A12]"
                  rows={3}
                  placeholder="Record verification rationale or document review notes..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#E4DED3]">
                {selectedRequest.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={isProcessing}
                    onClick={() => handleTransitionStatus('under_review')}
                  >
                    Move to Under Review
                  </Button>
                )}
                {selectedRequest.status === 'under_review' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={isProcessing}
                      onClick={() => handleTransitionStatus('rejected')}
                    >
                      Reject Application
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={isProcessing}
                      onClick={handleApproveProvision}
                    >
                      Approve & Provision Account
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* TEAM MEMBER REVIEW DIALOG */}
      <Dialog open={!!selectedTeamMember} onClose={() => setSelectedTeamMember(null)} size="md">
        <DialogHeader
          title="Review Research Team Member"
          description={`Evaluating ${selectedTeamMember?.full_name} (${selectedTeamMember?.requested_role})`}
          onClose={() => setSelectedTeamMember(null)}
        />
        <DialogContent>
          {selectedTeamMember && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#F8F6F2] p-3 rounded-xs border border-[#E4DED3] space-y-1">
                <p><strong>Email:</strong> {selectedTeamMember.email}</p>
                <p><strong>Role Requested:</strong> {selectedTeamMember.requested_role}</p>
                <p><strong>Designation:</strong> {selectedTeamMember.designation || 'Not specified'}</p>
              </div>
              <textarea
                className="w-full border border-[#E4DED3] rounded-xs p-2 text-xs"
                rows={2}
                placeholder="Reviewer rationale..."
                value={teamReviewNotes}
                onChange={(e) => setTeamReviewNotes(e.target.value)}
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleReviewTeamMember('rejected')}>
                  Reject Member
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleReviewTeamMember('approved')}>
                  Approve & Issue Activation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SITE PARTICIPATION GOVERNMENT REVIEW DIALOG */}
      <Dialog open={!!selectedSitePart} onClose={() => setSelectedSitePart(null)} size="md">
        <DialogHeader
          title="Government Site Review"
          description="Record ministry verification decision for clinical site study participation"
          onClose={() => setSelectedSitePart(null)}
        />
        <DialogContent>
          {selectedSitePart && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#F8F6F2] p-3 rounded-xs border border-[#E4DED3] space-y-1">
                <p><strong>Study ID:</strong> {selectedSitePart.study_id}</p>
                <p><strong>Site ID:</strong> {selectedSitePart.site_id}</p>
              </div>
              <div>
                <label className="block font-semibold mb-1">Decision</label>
                <select
                  value={siteGovDecision}
                  onChange={(e) => setSiteGovDecision(e.target.value as ParticipationDecisionStatus)}
                  className="w-full border border-[#E4DED3] rounded-xs p-2 text-xs"
                >
                  <option value="approved">Approve Participation</option>
                  <option value="rejected">Reject Participation</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Verification Rationale / Notes</label>
                <textarea
                  className="w-full border border-[#E4DED3] rounded-xs p-2 text-xs"
                  rows={2}
                  placeholder="Notes on regulatory/ethics clearance..."
                  value={siteGovNotes}
                  onChange={(e) => setSiteGovNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="primary" size="sm" loading={isProcessing} onClick={handleReviewSiteGov}>
                  Submit Government Decision
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PROVISION VERIFIER MODAL */}
      <Dialog open={showVerifierModal} onClose={() => setShowVerifierModal(false)} size="md">
        <DialogHeader
          title="Provision Government Verifier"
          description="Grant platform-level government verification authority to an official"
          onClose={() => setShowVerifierModal(false)}
        />
        <DialogContent>
          <form onSubmit={handleProvisionVerifier} className="space-y-4 text-xs">
            {newVerifierResult ? (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xs text-emerald-800 space-y-2">
                <p className="font-semibold">Verifier Provisioned!</p>
                <p>Account created for {newVerifierResult.email}.</p>
                {newVerifierResult.raw_token && (
                  <div>
                    <span className="block text-[11px] text-emerald-700">Dev Activation Token:</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        readOnly
                        value={newVerifierResult.raw_token}
                        className="bg-white border p-1 rounded-xs flex-1 text-xs font-mono"
                      />
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => copyToClipboard(newVerifierResult.raw_token!)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
                <div className="pt-2">
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setShowVerifierModal(false)
                      setNewVerifierResult(null)
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                    Official Email <span className="text-[#9B2C2C]">*</span>
                  </label>
                  <Input
                    name="email"
                    type="email"
                    required
                    placeholder="verifier@ayuctms.gov.in"
                    value={newVerifierEmail}
                    onChange={(e) => setNewVerifierEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                    Full Name <span className="text-[#9B2C2C]">*</span>
                  </label>
                  <Input
                    name="fullName"
                    required
                    placeholder="e.g. Dr. K. Radhakrishnan"
                    value={newVerifierName}
                    onChange={(e) => setNewVerifierName(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowVerifierModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={isProcessing}>
                    Provision Verifier
                  </Button>
                </div>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* PROVISION RESULT MODAL */}
      <Dialog open={!!provisionResult} onClose={() => setProvisionResult(null)} size="md">
        <DialogHeader
          title="Applicant Provisioned Successfully"
          description="Account created and single-use activation issued"
          onClose={() => setProvisionResult(null)}
        />
        <DialogContent>
          {provisionResult && (
            <div className="space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xs text-emerald-800 space-y-1">
                <p><strong>Applicant Email:</strong> {provisionResult.user_email}</p>
                <p><strong>Organization ID:</strong> {provisionResult.organization_id}</p>
                <p>
                  <strong>Activation Email Dispatched:</strong>{' '}
                  {provisionResult.invitation_sent ? 'Yes (via Resend)' : 'Simulated (Dev Mode)'}
                </p>
              </div>
              {provisionResult.raw_token && (
                <div>
                  <span className="block text-[#726B5C] mb-1 font-semibold">Dev Activation Link:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      readOnly
                      value={`${window.location.origin}/activate?token=${provisionResult.raw_token}`}
                      className="bg-[#F8F6F2] border border-[#E4DED3] p-1.5 rounded-xs flex-1 text-[11px] font-mono"
                    />
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() =>
                        copyToClipboard(`${window.location.origin}/activate?token=${provisionResult.raw_token}`)
                      }
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button variant="primary" size="sm" onClick={() => setProvisionResult(null)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
export default SuperAdminPage
