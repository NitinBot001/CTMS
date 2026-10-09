import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { organizationsApi } from '@/api/organizations.api'
import { adminApi } from '@/api/admin.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/data-display/Card'
import { StatusBadge } from '@/components/status/StatusBadge'
import { TransitionDialog } from '@/components/status/TransitionDialog'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/overlays/Dialog'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { LoadingState, ErrorState } from '@/components/feedback'
import { useToast } from '@/app/providers'
import type { StatusTransitionRequest, OnboardingApplicationRead } from '@/types/api'

export const OrganizationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()

  const [isTransitionOpen, setIsTransitionOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRoleId, setMemberRoleId] = useState('')
  const [submittingMember, setSubmittingMember] = useState(false)

  // Fetch Organization Details
  const orgQuery = useQuery({
    queryKey: ['organization', id],
    queryFn: () => organizationsApi.getById(id!),
    enabled: !!id,
  })

  // Onboarding state
  const [onboarding, setOnboarding] = useState<OnboardingApplicationRead | null>(null)
  const [submittingOnboarding, setSubmittingOnboarding] = useState(false)

  // Fetch Members
  const membersQuery = useQuery({
    queryKey: ['organization', id, 'members'],
    queryFn: () => organizationsApi.listMembers(id!),
    enabled: !!id,
  })

  // Fetch Roles for adding member
  const rolesQuery = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: adminApi.listRoles,
  })

  const org = orgQuery.data
  const members = membersQuery.data || []
  const roles = rolesQuery.data || []

  const handleInitiateOnboarding = async () => {
    if (!id) return
    setSubmittingOnboarding(true)
    try {
      const app = await organizationsApi.createOnboarding(id)
      setOnboarding(app)
      toast.success('Onboarding Initiated', 'New application draft created')
      orgQuery.refetch()
    } catch (err: unknown) {
      toast.error('Failed to Initiate', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmittingOnboarding(false)
    }
  }

  const handleTransitionOnboarding = async (req: StatusTransitionRequest) => {
    if (!onboarding?.id) return
    try {
      const updated = await organizationsApi.transitionOnboarding(onboarding.id, req)
      setOnboarding(updated)
      toast.success('Onboarding Status Updated', `Transitioned to ${req.new_status}`)
      orgQuery.refetch()
    } catch (err: unknown) {
      toast.error('Transition Failed', err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !memberUserId || !memberRoleId) return
    setSubmittingMember(true)
    try {
      await organizationsApi.addMember(id, {
        user_id: memberUserId,
        role_id: memberRoleId,
      })
      toast.success('Member Added', 'User has been assigned to organization')
      setIsAddMemberOpen(false)
      setMemberUserId('')
      setMemberRoleId('')
      membersQuery.refetch()
    } catch (err: unknown) {
      toast.error('Failed to Add Member', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmittingMember(false)
    }
  }

  if (orgQuery.isLoading) {
    return (
      <PageContainer maxWidth="2xl">
        <LoadingState message="Loading organization record..." />
      </PageContainer>
    )
  }

  if (orgQuery.isError || !org) {
    return (
      <PageContainer maxWidth="2xl">
        <ErrorState
          title="Organization Not Found"
          message="Unable to find the requested organization record."
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title={org.name}
        subtitle={`${org.organization_type.toUpperCase()} &middot; ID: ${org.id}`}
        breadcrumbs={[
          { label: 'Organizations', href: '/organizations' },
          { label: org.registration_number || org.name },
        ]}
        badge={<StatusBadge status={org.status} />}
        actions={
          <Link to="/organizations">
            <Button variant="outline" size="sm" leftIcon={<Icon name="arrowRight" size="xs" className="rotate-180" />}>
              Back to List
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Organization Metadata & Onboarding */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
              Institutional Entity Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#726B5C] block mb-0.5">Legal Name</span>
                <span className="font-medium text-[#1C1A17]">{org.name}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Registration Number / Code</span>
                <span className="font-mono font-bold text-[#7A2A12]">
                  {org.registration_number || '—'}
                </span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Entity Type</span>
                <span className="font-medium uppercase text-[#1C1A17] font-mono">
                  {org.organization_type}
                </span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Status</span>
                <StatusBadge status={org.status} size="sm" />
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Contact Email</span>
                <span className="font-mono text-[#5A5347]">{org.email || '—'}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Contact Phone</span>
                <span className="text-[#5A5347]">{org.phone || '—'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#726B5C] block mb-0.5">Address</span>
                <span className="text-[#5A5347]">
                  {[org.address_line1, org.address_line2, org.city, org.state, org.postal_code, org.country]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </span>
              </div>
            </div>
          </Card>

          {/* Members Table */}
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E4DED3]">
              <div>
                <h3 className="font-serif text-sm font-bold text-[#1C1A17]">
                  Assigned Personnel &amp; Roles
                </h3>
                <p className="text-[11px] text-[#726B5C]">
                  Authorized institutional staff members with delegated responsibilities
                </p>
              </div>
              <Button
                variant="primary"
                size="xs"
                onClick={() => setIsAddMemberOpen(true)}
                leftIcon={<Icon name="plus" size="xs" />}
              >
                Add Member
              </Button>
            </div>

            {members.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#726B5C]">
                No personnel currently assigned to this organization.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#E4DED3] text-[#726B5C] font-semibold">
                      <th className="py-2">User ID</th>
                      <th className="py-2">Role ID</th>
                      <th className="py-2">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F8F6F2]">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-[#F8F6F2]">
                        <td className="py-2 font-mono text-[11px] text-[#1C1A17]">{m.user_id}</td>
                        <td className="py-2 font-mono text-[11px] text-[#7A2A12]">{m.role_id}</td>
                        <td className="py-2 text-[#726B5C]">{m.created_at?.slice(0, 10) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Onboarding & Compliance Lifecycle */}
        <div className="space-y-6">
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-2">
              Onboarding Lifecycle
            </h3>
            <p className="text-xs text-[#5A5347] mb-4">
              Institutional verification, ethics clearance, and operational readiness state.
            </p>

            {onboarding ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xs bg-[#F8F6F2] border border-[#E4DED3] flex items-center justify-between">
                  <span className="text-xs text-[#726B5C]">Lifecycle State:</span>
                  <StatusBadge status={onboarding.status} />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => setIsTransitionOpen(true)}
                  leftIcon={<Icon name="activity" size="xs" />}
                >
                  Transition Onboarding State
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-[#726B5C] italic">
                  No active onboarding application on record for this session.
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center"
                  loading={submittingOnboarding}
                  onClick={handleInitiateOnboarding}
                  leftIcon={<Icon name="plus" size="xs" />}
                >
                  Initiate Onboarding Workflow
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Onboarding Transition Dialog */}
      {onboarding && (
        <TransitionDialog
          open={isTransitionOpen}
          onClose={() => setIsTransitionOpen(false)}
          entityName="Onboarding Application"
          currentStatus={onboarding.status}
          allowedTransitions={['draft', 'submitted', 'under_review', 'returned', 'rejected', 'approved']}
          onTransition={async (targetStatus, reason) => {
            await handleTransitionOnboarding({
              new_status: targetStatus,
              reason: reason || null,
            })
          }}
        />
      )}

      {/* Add Member Modal */}
      <Dialog open={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} size="md">
        <DialogHeader
          title="Assign Personnel to Organization"
          description="Grant an existing user account institutional membership and role privileges."
        />
        <form onSubmit={handleAddMember}>
          <DialogContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                User ID (UUID) *
              </label>
              <Input
                required
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                value={memberUserId}
                onChange={(e) => setMemberUserId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Institutional Role *
              </label>
              <Select
                required
                value={memberRoleId}
                onChange={(e) => setMemberRoleId(e.target.value)}
                options={[
                  { value: '', label: 'Select Role...' },
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
              onClick={() => setIsAddMemberOpen(false)}
              disabled={submittingMember}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submittingMember}>
              Assign Member
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </PageContainer>
  )
}
