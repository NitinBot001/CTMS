import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { participantsApi } from '@/api/participants.api'
import { safetyApi } from '@/api/safety.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/data-display/Card'
import { StatusBadge } from '@/components/status/StatusBadge'
import { TransitionDialog } from '@/components/status/TransitionDialog'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { LoadingState, ErrorState } from '@/components/feedback'
import { useToast } from '@/app/providers'

export const ParticipantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const [isTransitionOpen, setIsTransitionOpen] = useState(false)

  const participantQuery = useQuery({
    queryKey: ['participant', id],
    queryFn: () => participantsApi.getById(id!),
    enabled: !!id,
  })

  const safetyQuery = useQuery({
    queryKey: ['participant', id, 'safety'],
    queryFn: () => safetyApi.list({ participant_id: id }),
    enabled: !!id,
  })

  const participant = participantQuery.data
  const adverseEvents = safetyQuery.data || []

  const handleTransition = async (targetStatus: string, reason?: string) => {
    if (!id) return
    try {
      await participantsApi.transition(id, {
        new_status: targetStatus,
        reason: reason || null,
      })
      toast.success('Subject Status Updated', `Transitioned to ${targetStatus}`)
      participantQuery.refetch()
    } catch (err: unknown) {
      toast.error('Transition Failed', err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  if (participantQuery.isLoading) {
    return (
      <PageContainer maxWidth="2xl">
        <LoadingState message="Loading participant clinical record..." />
      </PageContainer>
    )
  }

  if (participantQuery.isError || !participant) {
    return (
      <PageContainer maxWidth="2xl">
        <ErrorState
          title="Subject Record Not Found"
          message="Unable to find the requested trial participant record."
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title={`Subject: ${participant.participant_code}`}
        subtitle={`Trial Participant &middot; ID: ${participant.id}`}
        breadcrumbs={[
          { label: 'Participants', href: '/participants' },
          { label: participant.participant_code },
        ]}
        badge={<StatusBadge status={participant.status} />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTransitionOpen(true)}
              leftIcon={<Icon name="activity" size="xs" />}
            >
              Transition Status
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
              Subject Clinical File
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#726B5C] block mb-0.5">Subject Code</span>
                <span className="font-mono font-bold text-[#7A2A12]">
                  {participant.participant_code}
                </span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Current Lifecycle State</span>
                <StatusBadge status={participant.status} size="sm" />
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Assigned Protocol ID</span>
                <Link
                  to={`/studies/${participant.study_id}`}
                  className="font-mono text-[#7A2A12] hover:underline"
                >
                  {participant.study_id}
                </Link>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Trial Site ID</span>
                <span className="font-mono text-[#5A5347]">
                  {participant.site_id || 'Not assigned'}
                </span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Screening Date</span>
                <span className="font-mono text-[#1C1A17]">
                  {participant.screening_date || '—'}
                </span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Enrollment Date</span>
                <span className="font-mono text-[#1C1A17]">
                  {participant.enrollment_date || '—'}
                </span>
              </div>
            </div>
          </Card>

          {/* Associated Safety Events */}
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E4DED3]">
              <h3 className="font-serif text-sm font-bold text-[#1C1A17]">
                Adverse Events History ({adverseEvents.length})
              </h3>
              <Link to="/safety">
                <Button variant="ghost" size="xs">
                  Safety Portal
                </Button>
              </Link>
            </div>

            {adverseEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#726B5C]">
                No adverse events recorded for this participant.
              </div>
            ) : (
              <div className="space-y-2">
                {adverseEvents.map((ae) => (
                  <div
                    key={ae.id}
                    className="p-3 rounded-xs border border-[#E4DED3] bg-[#F8F6F2] text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-[#1C1A17] block">{ae.description}</span>
                      <span className="text-[11px] text-[#726B5C]">
                        Onset: {ae.onset_date} &middot; Severity: {ae.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ae.seriousness === 'serious' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-[#FDF2F2] border border-[#F5C6C6] text-[#9B2C2C]">
                          SAE
                        </span>
                      )}
                      <StatusBadge status={ae.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Regulatory & Consent Notice */}
        <div className="space-y-6">
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-2">
              Privacy &amp; De-identification
            </h3>
            <p className="text-xs text-[#5A5347] leading-relaxed mb-3">
              This participant file complies with GCP anonymization standards. No Personally Identifiable Information (PII) is stored or transmitted.
            </p>
            <div className="p-2.5 rounded-xs bg-[#EDF6F1] border border-[#BDDCCB] text-[#1F5C3F] text-[11px]">
              <span className="font-semibold block mb-0.5">IEC Informed Consent</span>
              Subject signed protocol-specific informed consent prior to initiating study procedures.
            </div>
          </Card>
        </div>
      </div>

      {/* Subject Status Transition Dialog */}
      <TransitionDialog
        open={isTransitionOpen}
        onClose={() => setIsTransitionOpen(false)}
        entityName="Trial Participant"
        currentStatus={participant.status}
        allowedTransitions={[
          'SCREENED',
          'ELIGIBLE',
          'SCREEN_FAILED',
          'ENROLLED',
          'ACTIVE',
          'COMPLETED',
          'DISCONTINUED',
          'WITHDRAWN',
        ]}
        onTransition={handleTransition}
      />
    </PageContainer>
  )
}
