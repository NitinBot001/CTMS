import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { studiesApi } from '@/api/studies.api'
import { sitesApi } from '@/api/sites.api'
import { adminApi } from '@/api/admin.api'
import { portfolioApi } from '@/api/portfolio.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/data-display/Card'
import { Tabs, type TabItem } from '@/components/navigation/Tabs'
import { StatusBadge } from '@/components/status/StatusBadge'
import { TransitionDialog } from '@/components/status/TransitionDialog'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/overlays/Dialog'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { LoadingState, ErrorState } from '@/components/feedback'
import { useToast } from '@/app/providers'
import { formatNumber, formatPercent } from '@/lib/format'

export const StudyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('overview')
  const [isStudyTransitionOpen, setIsStudyTransitionOpen] = useState(false)
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false)
  const [isAssignSiteOpen, setIsAssignSiteOpen] = useState(false)
  const [selectedSiteForTransition, setSelectedSiteForTransition] = useState<{ id: string; status: string } | null>(null)

  // Team form state
  const [teamUserId, setTeamUserId] = useState('')
  const [teamRoleId, setTeamRoleId] = useState('')
  const [submittingTeam, setSubmittingTeam] = useState(false)

  // Site assign form state
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [siteTarget, setSiteTarget] = useState<number>(25)
  const [submittingSite, setSubmittingSite] = useState(false)

  // Queries
  const studyQuery = useQuery({
    queryKey: ['study', id],
    queryFn: () => studiesApi.getById(id!),
    enabled: !!id,
  })

  const milestonesQuery = useQuery({
    queryKey: ['study', id, 'milestones'],
    queryFn: () => studiesApi.listMilestones(id!),
    enabled: !!id,
  })

  const teamQuery = useQuery({
    queryKey: ['study', id, 'team'],
    queryFn: () => studiesApi.listTeamMembers(id!),
    enabled: !!id,
  })

  const sitesQuery = useQuery({
    queryKey: ['study', id, 'sites'],
    queryFn: () => studiesApi.listSites(id!),
    enabled: !!id,
  })

  const metricsQuery = useQuery({
    queryKey: ['portfolio', 'study-metrics', id],
    queryFn: () => portfolioApi.getStudyMetrics(id!),
    enabled: !!id,
  })

  const siteEnrollmentQuery = useQuery({
    queryKey: ['portfolio', 'study-sites-enrollment', id],
    queryFn: () => portfolioApi.getStudyEnrollmentBySite(id!),
    enabled: !!id,
  })

  const globalSitesQuery = useQuery({
    queryKey: ['sites', 'all'],
    queryFn: () => sitesApi.list(),
  })

  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: adminApi.listRoles,
  })

  const study = studyQuery.data
  const milestones = milestonesQuery.data || []
  const team = teamQuery.data || []
  const studySites = sitesQuery.data || []
  const metrics = metricsQuery.data
  const siteEnrollment = siteEnrollmentQuery.data || []
  const globalSites = globalSitesQuery.data || []
  const roles = rolesQuery.data || []

  // Handlers
  const handleTransitionStudy = async (targetStatus: string, reason?: string) => {
    if (!id) return
    try {
      await studiesApi.transition(id, {
        new_status: targetStatus,
        reason: reason || null,
      })
      toast.success('Study Status Updated', `Transitioned to ${targetStatus}`)
      studyQuery.refetch()
    } catch (err: unknown) {
      toast.error('Transition Failed', err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  const handleTransitionSiteActivation = async (targetStatus: string, reason?: string) => {
    if (!id || !selectedSiteForTransition) return
    try {
      await studiesApi.transitionSite(id, selectedSiteForTransition.id, {
        new_status: targetStatus,
        reason: reason || null,
      })
      toast.success('Site Activation Updated', `Transitioned to ${targetStatus}`)
      setSelectedSiteForTransition(null)
      sitesQuery.refetch()
      if (metricsQuery) metricsQuery.refetch()
    } catch (err: unknown) {
      toast.error('Transition Failed', err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !teamUserId || !teamRoleId) return
    setSubmittingTeam(true)
    try {
      await studiesApi.addTeamMember(id, {
        user_id: teamUserId,
        role_id: teamRoleId,
      })
      toast.success('Team Member Assigned', 'Investigator assigned to study protocol.')
      setIsAddTeamOpen(false)
      setTeamUserId('')
      setTeamRoleId('')
      teamQuery.refetch()
    } catch (err: unknown) {
      toast.error('Assignment Failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmittingTeam(false)
    }
  }

  const handleAssignSite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !selectedSiteId) return
    setSubmittingSite(true)
    try {
      await studiesApi.assignSite(id, {
        site_id: selectedSiteId,
        recruitment_target: siteTarget || null,
      })
      toast.success('Site Assigned', 'Clinical site assigned to trial protocol.')
      setIsAssignSiteOpen(false)
      setSelectedSiteId('')
      sitesQuery.refetch()
      if (siteEnrollmentQuery) siteEnrollmentQuery.refetch()
    } catch (err: unknown) {
      toast.error('Site Assignment Failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmittingSite(false)
    }
  }

  if (studyQuery.isLoading) {
    return (
      <PageContainer maxWidth="2xl">
        <LoadingState message="Loading study protocol workspace..." />
      </PageContainer>
    )
  }

  if (studyQuery.isError || !study) {
    return (
      <PageContainer maxWidth="2xl">
        <ErrorState
          title="Study Protocol Not Found"
          message="Unable to locate the requested clinical study."
        />
      </PageContainer>
    )
  }

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Protocol Overview' },
    { id: 'milestones', label: `Milestones (${milestones.length})` },
    { id: 'team', label: `Study Team (${team.length})` },
    { id: 'sites', label: `Trial Sites (${studySites.length})` },
    { id: 'analytics', label: 'Recruitment & Oversight' },
  ]

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title={study.title}
        subtitle={`Protocol: ${study.protocol_number} &middot; Code: ${study.study_code} &middot; Phase: ${study.phase}`}
        breadcrumbs={[
          { label: 'Studies', href: '/studies' },
          { label: study.protocol_number },
        ]}
        badge={<StatusBadge status={study.status} />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStudyTransitionOpen(true)}
              leftIcon={<Icon name="activity" size="xs" />}
            >
              Transition Status
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 bg-white border border-[#E4DED3]">
              <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
                Protocol Scientific Parameters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#726B5C] block mb-0.5">Therapeutic Area</span>
                  <span className="font-medium text-[#1C1A17]">{study.therapeutic_area}</span>
                </div>
                <div>
                  <span className="text-[#726B5C] block mb-0.5">Study Type</span>
                  <span className="font-medium text-[#1C1A17]">{study.study_type}</span>
                </div>
                <div>
                  <span className="text-[#726B5C] block mb-0.5">Clinical Phase</span>
                  <span className="font-medium text-[#1C1A17]">{study.phase}</span>
                </div>
                <div>
                  <span className="text-[#726B5C] block mb-0.5">Blinding Scheme</span>
                  <span className="font-medium text-[#1C1A17]">{study.blinding || 'None'}</span>
                </div>
                <div>
                  <span className="text-[#726B5C] block mb-0.5">Target Planned Sample</span>
                  <span className="font-mono font-bold text-[#1C1A17]">
                    {study.planned_sample_size ? formatNumber(study.planned_sample_size) : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[#726B5C] block mb-0.5">Randomization</span>
                  <span className="font-medium text-[#1C1A17]">
                    {study.randomization ? 'Yes (Randomized)' : 'No (Non-randomized)'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[#726B5C] block mb-0.5">Study Design</span>
                  <span className="text-[#5A5347]">{study.study_design || '—'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[#726B5C] block mb-0.5">Scientific Description</span>
                  <p className="text-[#5A5347] leading-relaxed whitespace-pre-wrap">
                    {study.description || 'No detailed scientific narrative registered.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5 bg-white border border-[#E4DED3]">
              <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
                CTRI &amp; Regulatory Clearance
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#726B5C] block mb-0.5">CTRI Number</span>
                  {study.ctri_number ? (
                    <span className="font-mono font-bold text-[#1F5C3F] bg-[#EDF6F1] px-2 py-0.5 rounded-xs border border-[#BDDCCB] inline-block">
                      {study.ctri_number}
                    </span>
                  ) : (
                    <span className="text-[#726B5C] italic">Pending CTRI submission</span>
                  )}
                </div>
                <div>
                  <span className="text-[#726B5C] block mb-0.5">CTRI Status</span>
                  <span className="font-medium text-[#1C1A17]">{study.ctri_status || 'NOT_SUBMITTED'}</span>
                </div>
                <div className="pt-2 border-t border-[#E4DED3]">
                  <span className="text-[#726B5C] block mb-0.5">Sponsor Entity ID</span>
                  <span className="font-mono text-[11px] text-[#5A5347] block truncate">
                    {study.sponsor_org_id}
                  </span>
                </div>
                {study.cro_org_id && (
                  <div>
                    <span className="text-[#726B5C] block mb-0.5">Managing CRO ID</span>
                    <span className="font-mono text-[11px] text-[#5A5347] block truncate">
                      {study.cro_org_id}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: MILESTONES */}
      {activeTab === 'milestones' && (
        <Card className="p-5 bg-white border border-[#E4DED3]">
          <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
            Trial Progression Milestones
          </h3>
          {milestones.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#726B5C]">
              No progression milestones configured for this protocol.
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xs border border-[#E4DED3] bg-[#F8F6F2] flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-xs text-[#1C1A17] block">{m.title}</span>
                    <div className="flex items-center gap-3 text-[11px] text-[#726B5C] mt-1">
                      <span>Planned: {m.planned_date || 'TBD'}</span>
                      {m.actual_date && <span className="text-[#1F5C3F]">Actual: {m.actual_date}</span>}
                    </div>
                  </div>
                  <StatusBadge status={m.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: TEAM */}
      {activeTab === 'team' && (
        <Card className="p-5 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17]">
              Protocol Investigators &amp; Monitors
            </h3>
            <Button
              variant="primary"
              size="xs"
              onClick={() => setIsAddTeamOpen(true)}
              leftIcon={<Icon name="plus" size="xs" />}
            >
              Assign Team Member
            </Button>
          </div>

          {team.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#726B5C]">
              No investigators or study personnel assigned to this team yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E4DED3] text-[#726B5C] font-semibold">
                    <th className="py-2">User ID</th>
                    <th className="py-2">Study Role</th>
                    <th className="py-2">Assigned At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8F6F2]">
                  {team.map((t) => (
                    <tr key={t.id} className="hover:bg-[#F8F6F2]">
                      <td className="py-2 font-mono text-[11px] text-[#1C1A17]">{t.user_id}</td>
                      <td className="py-2 font-mono text-[11px] text-[#7A2A12]">{t.role_id}</td>
                      <td className="py-2 text-[#726B5C]">{t.created_at?.slice(0, 10) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: SITES */}
      {activeTab === 'sites' && (
        <Card className="p-5 bg-white border border-[#E4DED3]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17]">
              Assigned Trial Research Sites
            </h3>
            <Button
              variant="primary"
              size="xs"
              onClick={() => setIsAssignSiteOpen(true)}
              leftIcon={<Icon name="plus" size="xs" />}
            >
              Assign Trial Site
            </Button>
          </div>

          {studySites.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#726B5C]">
              No research sites currently assigned to this clinical trial.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E4DED3] text-[#726B5C] font-semibold">
                    <th className="py-2">Site ID</th>
                    <th className="py-2">Recruitment Target</th>
                    <th className="py-2">Activation Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8F6F2]">
                  {studySites.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F8F6F2]">
                      <td className="py-2 font-mono text-[11px] text-[#1C1A17]">{s.site_id}</td>
                      <td className="py-2 font-mono text-[#5A5347]">
                        {s.recruitment_target ? formatNumber(s.recruitment_target) : '—'}
                      </td>
                      <td className="py-2">
                        <StatusBadge status={s.activation_status} size="sm" />
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setSelectedSiteForTransition({ id: s.site_id, status: s.activation_status })}
                        >
                          Change Activation
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 5: ANALYTICS & OVERSIGHT */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-white border border-[#E4DED3]">
                <span className="text-[11px] text-[#726B5C] block mb-1">Recruitment Progression</span>
                <span className="font-serif text-2xl font-bold text-[#1C1A17]">
                  {formatPercent(metrics.recruitment.recruitment_percentage)}
                </span>
                <span className="text-xs text-[#726B5C] block mt-1">
                  {metrics.recruitment.actual_enrolled} of {metrics.recruitment.planned_sample_size} enrolled
                </span>
              </Card>

              <Card className="p-4 bg-white border border-[#E4DED3]">
                <span className="text-[11px] text-[#726B5C] block mb-1">Activated Sites</span>
                <span className="font-serif text-2xl font-bold text-[#1C1A17]">
                  {metrics.sites.activated} / {metrics.sites.total_assigned}
                </span>
                <span className="text-xs text-[#726B5C] block mt-1">
                  clinical sites operational
                </span>
              </Card>

              <Card className="p-4 bg-white border border-[#E4DED3]">
                <span className="text-[11px] text-[#726B5C] block mb-1">Reported Adverse Events</span>
                <span className="font-serif text-2xl font-bold text-[#1C1A17]">
                  {metrics.safety.total_adverse_events}
                </span>
                <span className={`text-xs block mt-1 font-semibold ${metrics.safety.serious_adverse_events > 0 ? 'text-[#9B2C2C]' : 'text-[#1F5C3F]'}`}>
                  {metrics.safety.serious_adverse_events} Serious (SAE)
                </span>
              </Card>

              <Card className="p-4 bg-white border border-[#E4DED3]">
                <span className="text-[11px] text-[#726B5C] block mb-1">Protocol Deviations</span>
                <span className="font-serif text-2xl font-bold text-[#1C1A17]">
                  {metrics.compliance.total_deviations}
                </span>
                <span className="text-xs text-[#726B5C] block mt-1">
                  compliance deviations logged
                </span>
              </Card>
            </div>
          )}

          {/* Site Recruitment Breakdown */}
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
              Recruitment Breakdown Across Centers
            </h3>
            {siteEnrollment.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#726B5C]">
                No site enrollment breakdown accumulated yet.
              </div>
            ) : (
              <div className="space-y-3">
                {siteEnrollment.map((se) => (
                  <div key={se.site_id} className="p-3 bg-[#F8F6F2] rounded-xs border border-[#E4DED3]">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <div>
                        <span className="font-semibold text-[#1C1A17]">{se.site_name || se.site_code || se.site_id}</span>
                        <span className="text-[10px] text-[#726B5C] block font-mono">
                          Target: {se.recruitment_target} &middot; Enrolled: {se.actual_enrolled}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#7A2A12]">
                        {formatPercent(se.recruitment_percentage)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-[#E4DED3] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#7A2A12] transition-all"
                        style={{ width: `${Math.min(se.recruitment_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Study Status Transition Dialog */}
      <TransitionDialog
        open={isStudyTransitionOpen}
        onClose={() => setIsStudyTransitionOpen(false)}
        entityName="Clinical Study Protocol"
        currentStatus={study.status}
        allowedTransitions={[
          'draft',
          'planned',
          'active',
          'suspended',
          'completed',
          'terminated',
          'withdrawn',
        ]}
        onTransition={handleTransitionStudy}
      />

      {/* Site Activation Transition Dialog */}
      {selectedSiteForTransition && (
        <TransitionDialog
          open={!!selectedSiteForTransition}
          onClose={() => setSelectedSiteForTransition(null)}
          entityName="Trial Site Activation"
          currentStatus={selectedSiteForTransition.status}
          allowedTransitions={['planned', 'initiated', 'activated', 'suspended', 'closed']}
          onTransition={handleTransitionSiteActivation}
        />
      )}

      {/* Add Team Member Modal */}
      <Dialog open={isAddTeamOpen} onClose={() => setIsAddTeamOpen(false)} size="md">
        <DialogHeader
          title="Assign Study Team Member"
          description="Grant an investigator or study coordinator role privileges for this trial protocol."
        />
        <form onSubmit={handleAddTeamMember}>
          <DialogContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">User ID *</label>
              <Input
                required
                placeholder="UUID of authorized investigator..."
                value={teamUserId}
                onChange={(e) => setTeamUserId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Study Role *</label>
              <Select
                required
                value={teamRoleId}
                onChange={(e) => setTeamRoleId(e.target.value)}
                options={[
                  { value: '', label: 'Select Clinical Role...' },
                  ...roles.map((r) => ({ value: r.id, label: r.name })),
                ]}
              />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsAddTeamOpen(false)}
              disabled={submittingTeam}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submittingTeam}>
              Assign Investigator
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Assign Site Modal */}
      <Dialog open={isAssignSiteOpen} onClose={() => setIsAssignSiteOpen(false)} size="md">
        <DialogHeader
          title="Assign Clinical Research Site"
          description="Designate an approved trial site facility to recruit subjects for this protocol."
        />
        <form onSubmit={handleAssignSite}>
          <DialogContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Research Site *</label>
              <Select
                required
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                options={[
                  { value: '', label: 'Select Trial Site...' },
                  ...globalSites.map((s) => ({ value: s.id, label: `${s.name} (${s.site_code})` })),
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Recruitment Target</label>
              <Input
                type="number"
                min={1}
                value={siteTarget}
                onChange={(e) => setSiteTarget(Number(e.target.value))}
              />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsAssignSiteOpen(false)}
              disabled={submittingSite}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submittingSite}>
              Assign Site
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </PageContainer>
  )
}
