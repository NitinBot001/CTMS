import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { safetyApi } from '@/api/safety.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/data-display/Card'
import { StatusBadge } from '@/components/status/StatusBadge'
import { TransitionDialog } from '@/components/status/TransitionDialog'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { LoadingState, ErrorState } from '@/components/feedback'
import { useToast } from '@/app/providers'

export const AdverseEventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const [isTransitionOpen, setIsTransitionOpen] = useState(false)

  const { data: ae, isLoading, isError, refetch } = useQuery({
    queryKey: ['adverse-event', id],
    queryFn: () => safetyApi.getById(id!),
    enabled: !!id,
  })

  const handleTransition = async (targetStatus: string, reason?: string) => {
    if (!id) return
    try {
      await safetyApi.transition(id, {
        new_status: targetStatus,
        reason: reason || null,
      })
      toast.success('Safety State Updated', `Transitioned event to ${targetStatus}`)
      refetch()
    } catch (err: unknown) {
      toast.error('Transition Failed', err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  if (isLoading) {
    return (
      <PageContainer maxWidth="2xl">
        <LoadingState message="Loading adverse event clinical record..." />
      </PageContainer>
    )
  }

  if (isError || !ae) {
    return (
      <PageContainer maxWidth="2xl">
        <ErrorState
          title="Adverse Event Record Not Found"
          message="Unable to locate the requested pharmacovigilance safety event."
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title={ae.description}
        subtitle={`Classification: ${ae.event_type.toUpperCase()} &middot; ID: ${ae.id}`}
        breadcrumbs={[
          { label: 'Safety', href: '/safety' },
          { label: ae.event_type.toUpperCase() },
        ]}
        badge={<StatusBadge status={ae.status} />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTransitionOpen(true)}
              leftIcon={<Icon name="activity" size="xs" />}
            >
              Transition Event State
            </Button>
            <Link to="/safety">
              <Button variant="outline" size="sm" leftIcon={<Icon name="arrowRight" size="xs" className="rotate-180" />}>
                Back to Safety
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
              Clinical Event Narrative &amp; Findings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#726B5C] block mb-0.5">Event Term / Narrative</span>
                <span className="font-medium text-[#1C1A17]">{ae.description}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Event Classification</span>
                <span className="font-mono uppercase font-bold text-[#7A2A12]">{ae.event_type}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Seriousness</span>
                {ae.seriousness === 'serious' ? (
                  <span className="font-bold text-[#9B2C2C] bg-[#FDF2F2] px-2 py-0.5 rounded-xs border border-[#F5C6C6] inline-block">
                    SERIOUS (SAE)
                  </span>
                ) : (
                  <span className="text-[#5A5347] bg-[#F8F6F2] px-2 py-0.5 rounded-xs border border-[#E4DED3] inline-block">
                    Non-Serious
                  </span>
                )}
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">CTCAE Severity</span>
                <span className="font-semibold uppercase text-[#1C1A17]">{ae.severity}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Onset Date</span>
                <span className="font-mono text-[#1C1A17]">{ae.onset_date}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Resolution Date</span>
                <span className="font-mono text-[#1C1A17]">{ae.resolution_date || 'Ongoing'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#726B5C] block mb-0.5">Action Taken with Trial Intervention</span>
                <span className="text-[#5A5347]">{ae.action_taken || 'No dose modification'}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
              Protocol &amp; Subject Binding
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#726B5C] block mb-0.5">Clinical Protocol ID</span>
                <Link to={`/studies/${ae.study_id}`} className="font-mono text-[#7A2A12] hover:underline block truncate">
                  {ae.study_id}
                </Link>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Participant Subject ID</span>
                <Link to={`/participants/${ae.participant_id}`} className="font-mono text-[#7A2A12] hover:underline block truncate">
                  {ae.participant_id}
                </Link>
              </div>
              <div className="pt-2 border-t border-[#E4DED3]">
                <span className="text-[#726B5C] block mb-0.5">Reporting Status</span>
                <StatusBadge status={ae.status} />
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-white border border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-2">
              Regulatory Reporting Clock
            </h3>
            <p className="text-xs text-[#5A5347] leading-relaxed">
              Under CDSCO and DCGI requirements, fatal or life-threatening unexpected SAEs must be expedited to the licensing authority within 24 hours of site notification.
            </p>
          </Card>
        </div>
      </div>

      <TransitionDialog
        open={isTransitionOpen}
        onClose={() => setIsTransitionOpen(false)}
        entityName="Adverse Event"
        currentStatus={ae.status}
        allowedTransitions={['open', 'under_review', 'closed']}
        onTransition={handleTransition}
      />
    </PageContainer>
  )
}
