import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { complianceApi } from '@/api/compliance.api'
import { studiesApi } from '@/api/studies.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { Tabs, type TabItem } from '@/components/navigation/Tabs'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { StatusBadge } from '@/components/status/StatusBadge'
import { TransitionDialog } from '@/components/status/TransitionDialog'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/overlays/Dialog'
import { Input, TextArea } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { useToast } from '@/app/providers'
import type {
  EthicsApprovalRead,
  RegulatorySubmissionRead,
  ProtocolDeviationRead,
  CAPARecordRead,
} from '@/types/api'

const TODAY_ISO = new Date().toISOString().slice(0, 10)

export const CompliancePage: React.FC = () => {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('ethics')

  // Modals state
  const [isEthicsModalOpen, setIsEthicsModalOpen] = useState(false)
  const [isRegModalOpen, setIsRegModalOpen] = useState(false)
  const [isDevModalOpen, setIsDevModalOpen] = useState(false)
  const [isCapaModalOpen, setIsCapaModalOpen] = useState(false)

  // Transitions state
  const [transitionTarget, setTransitionTarget] = useState<{
    type: 'ethics' | 'regulatory' | 'deviation' | 'capa'
    id: string
    currentStatus: string
    name: string
    allowed: string[]
  } | null>(null)

  // Studies query for selection in modals
  const studiesQuery = useQuery({
    queryKey: ['studies', 'all'],
    queryFn: () => studiesApi.list(),
  })
  const studies = studiesQuery.data || []

  // Queries for the 4 compliance areas
  const ethicsQuery = useQuery({
    queryKey: ['compliance', 'ethics'],
    queryFn: () => complianceApi.listEthicsApprovals(),
  })

  const regQuery = useQuery({
    queryKey: ['compliance', 'regulatory'],
    queryFn: () => complianceApi.listRegulatorySubmissions(),
  })

  const devQuery = useQuery({
    queryKey: ['compliance', 'deviations'],
    queryFn: () => complianceApi.listProtocolDeviations(),
  })

  const capaQuery = useQuery({
    queryKey: ['compliance', 'capa'],
    queryFn: () => complianceApi.listCAPARecords(),
  })

  // Handle generic transition
  const handleTransition = async (targetStatus: string, reason?: string) => {
    if (!transitionTarget) return
    try {
      if (transitionTarget.type === 'ethics') {
        await complianceApi.transitionEthicsApproval(transitionTarget.id, {
          new_status: targetStatus,
          reason: reason || null,
        })
        ethicsQuery.refetch()
      } else if (transitionTarget.type === 'regulatory') {
        await complianceApi.transitionRegulatorySubmission(transitionTarget.id, {
          new_status: targetStatus,
          reason: reason || null,
        })
        regQuery.refetch()
      } else if (transitionTarget.type === 'deviation') {
        await complianceApi.transitionProtocolDeviation(transitionTarget.id, {
          new_status: targetStatus,
          reason: reason || null,
        })
        devQuery.refetch()
      } else if (transitionTarget.type === 'capa') {
        await complianceApi.transitionCAPARecord(transitionTarget.id, {
          new_status: targetStatus,
          reason: reason || null,
        })
        capaQuery.refetch()
      }
      toast.success('Status Updated', `Transitioned to ${targetStatus}`)
      setTransitionTarget(null)
    } catch (err: unknown) {
      toast.error('Transition Failed', err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  // --- Ethics Columns ---
  const ethicsColumns: Column<EthicsApprovalRead>[] = [
    {
      key: 'committee_name',
      header: 'Ethics Committee (IEC/IRB)',
      render: (e) => (
        <div>
          <span className="font-semibold text-xs text-[#1C1A17] block">{e.committee_name}</span>
          <span className="text-[11px] text-[#726B5C] font-mono">
            Protocol: {e.study_id.slice(0, 8)}...
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'approval_number',
      header: 'Approval Number',
      render: (e) => (
        <span className="font-mono text-xs text-[#7A2A12]">
          {e.approval_number || 'Pending'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => <StatusBadge status={e.status} size="sm" />,
      sortable: true,
    },
    {
      key: 'approval_date',
      header: 'Approval Date',
      render: (e) => (
        <span className="text-xs text-[#5A5347] font-mono">{e.approval_date || '—'}</span>
      ),
    },
    {
      key: 'expiry_date',
      header: 'Expiry Date',
      render: (e) => (
        <span className="text-xs text-[#5A5347] font-mono">{e.expiry_date || '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (e) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="xs"
            onClick={() =>
              setTransitionTarget({
                type: 'ethics',
                id: e.id,
                currentStatus: e.status,
                name: e.committee_name,
                allowed: ['not_submitted', 'pending', 'approved', 'conditional', 'rejected', 'expired'],
              })
            }
          >
            Transition
          </Button>
        </div>
      ),
    },
  ]

  // --- Regulatory Columns ---
  const regColumns: Column<RegulatorySubmissionRead>[] = [
    {
      key: 'authority',
      header: 'Authority & Type',
      render: (r) => (
        <div>
          <span className="font-semibold text-xs text-[#1C1A17] block">{r.authority}</span>
          <span className="text-[11px] text-[#726B5C]">{r.submission_type}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'reference_number',
      header: 'Reference Number',
      render: (r) => (
        <span className="font-mono text-xs text-[#7A2A12]">
          {r.reference_number || 'Pending'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
      sortable: true,
    },
    {
      key: 'submission_date',
      header: 'Submitted',
      render: (r) => (
        <span className="text-xs text-[#5A5347] font-mono">{r.submission_date || '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="xs"
            onClick={() =>
              setTransitionTarget({
                type: 'regulatory',
                id: r.id,
                currentStatus: r.status,
                name: `${r.authority} (${r.submission_type})`,
                allowed: ['not_submitted', 'pending', 'approved', 'conditional', 'rejected'],
              })
            }
          >
            Transition
          </Button>
        </div>
      ),
    },
  ]

  // --- Deviation Columns ---
  const devColumns: Column<ProtocolDeviationRead>[] = [
    {
      key: 'description',
      header: 'Deviation Description',
      render: (d) => (
        <div className="max-w-md">
          <span className="font-medium text-xs text-[#1C1A17] block">{d.description}</span>
          <span className="text-[11px] text-[#726B5C]">Category: {d.category}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (d) => (
        <span className="text-xs uppercase font-medium text-[#7A2A12]">
          {d.severity}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Resolution State',
      render: (d) => <StatusBadge status={d.status} size="sm" />,
      sortable: true,
    },
    {
      key: 'actions',
      header: '',
      render: (d) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="xs"
            onClick={() =>
              setTransitionTarget({
                type: 'deviation',
                id: d.id,
                currentStatus: d.status,
                name: 'Protocol Deviation',
                allowed: ['identified', 'reported', 'resolved'],
              })
            }
          >
            Transition
          </Button>
        </div>
      ),
    },
  ]

  // --- CAPA Columns ---
  const capaColumns: Column<CAPARecordRead>[] = [
    {
      key: 'description',
      header: 'CAPA Action & Type',
      render: (c) => (
        <div className="max-w-md">
          <span className="font-medium text-xs text-[#1C1A17] block">{c.description}</span>
          <span className="text-[11px] text-[#726B5C] uppercase font-mono">{c.capa_type}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'CAPA State',
      render: (c) => <StatusBadge status={c.status} size="sm" />,
      sortable: true,
    },
    {
      key: 'due_date',
      header: 'Target Due Date',
      render: (c) => (
        <span className="text-xs text-[#5A5347] font-mono">{c.due_date || '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="xs"
            onClick={() =>
              setTransitionTarget({
                type: 'capa',
                id: c.id,
                currentStatus: c.status,
                name: 'CAPA Action Plan',
                allowed: ['open', 'in_progress', 'completed', 'verified'],
              })
            }
          >
            Transition
          </Button>
        </div>
      ),
    },
  ]

  const tabs: TabItem[] = [
    { id: 'ethics', label: `Ethics Approvals (${ethicsQuery.data?.length ?? 0})` },
    { id: 'regulatory', label: `Regulatory Submissions (${regQuery.data?.length ?? 0})` },
    { id: 'deviations', label: `Protocol Deviations (${devQuery.data?.length ?? 0})` },
    { id: 'capa', label: `CAPA Action Plans (${capaQuery.data?.length ?? 0})` },
  ]

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Regulatory Compliance &amp; Quality Oversight"
        subtitle="Institutional ethics clearances, CDSCO submissions, protocol deviations, and CAPA governance"
        actions={
          <div className="flex items-center gap-2">
            {activeTab === 'ethics' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEthicsModalOpen(true)}
                leftIcon={<Icon name="plus" size="xs" />}
              >
                Submit Ethics Clearance
              </Button>
            )}
            {activeTab === 'regulatory' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsRegModalOpen(true)}
                leftIcon={<Icon name="plus" size="xs" />}
              >
                Log Regulatory Dossier
              </Button>
            )}
            {activeTab === 'deviations' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDevModalOpen(true)}
                leftIcon={<Icon name="plus" size="xs" />}
              >
                Log Protocol Deviation
              </Button>
            )}
            {activeTab === 'capa' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCapaModalOpen(true)}
                leftIcon={<Icon name="plus" size="xs" />}
              >
                Create CAPA Record
              </Button>
            )}
          </div>
        }
      />

      <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'ethics' && (
        <DataTable
          data={ethicsQuery.data || []}
          columns={ethicsColumns}
          isLoading={ethicsQuery.isLoading}
          searchPlaceholder="Search ethics committees or approvals..."
          emptyMessage="No institutional ethics clearances recorded."
        />
      )}

      {activeTab === 'regulatory' && (
        <DataTable
          data={regQuery.data || []}
          columns={regColumns}
          isLoading={regQuery.isLoading}
          searchPlaceholder="Search regulatory submissions or reference numbers..."
          emptyMessage="No regulatory submissions recorded."
        />
      )}

      {activeTab === 'deviations' && (
        <DataTable
          data={devQuery.data || []}
          columns={devColumns}
          isLoading={devQuery.isLoading}
          searchPlaceholder="Search protocol deviations..."
          emptyMessage="No protocol deviations recorded."
        />
      )}

      {activeTab === 'capa' && (
        <DataTable
          data={capaQuery.data || []}
          columns={capaColumns}
          isLoading={capaQuery.isLoading}
          searchPlaceholder="Search CAPA records or action plans..."
          emptyMessage="No CAPA records recorded."
        />
      )}

      {/* Unified Transition Dialog */}
      {transitionTarget && (
        <TransitionDialog
          open={!!transitionTarget}
          onClose={() => setTransitionTarget(null)}
          entityName={transitionTarget.name}
          currentStatus={transitionTarget.currentStatus}
          allowedTransitions={transitionTarget.allowed}
          onTransition={handleTransition}
        />
      )}

      {/* Modal 1: Ethics Approval */}
      <Dialog open={isEthicsModalOpen} onClose={() => setIsEthicsModalOpen(false)} size="md">
        <DialogHeader
          title="Submit Institutional Ethics Clearance"
          description="Register IEC / IRB protocol review submission and clearance numbers."
        />
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            try {
              await complianceApi.createEthicsApproval({
                study_id: fd.get('study_id') as string,
                committee_name: fd.get('committee_name') as string,
                approval_number: (fd.get('approval_number') as string) || null,
                status: 'pending',
                submission_date: (fd.get('submission_date') as string) || null,
              })
              toast.success('Ethics Clearance Logged')
              setIsEthicsModalOpen(false)
              ethicsQuery.refetch()
            } catch (err: unknown) {
              toast.error('Failed to Log', err instanceof Error ? err.message : 'Unknown error')
            }
          }}
        >
          <DialogContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Study Protocol *</label>
              <Select
                required
                name="study_id"
                options={[
                  { value: '', label: 'Select Protocol...' },
                  ...studies.map((s) => ({ value: s.id, label: s.protocol_number })),
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Ethics Committee Name *
              </label>
              <Input required name="committee_name" placeholder="e.g. AIIA Institutional Ethics Committee" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Approval Number</label>
              <Input name="approval_number" placeholder="e.g. IEC/AIIA/2026/04" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Submission Date</label>
              <Input type="date" name="submission_date" />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEthicsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Record
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Modal 2: Regulatory Submission */}
      <Dialog open={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} size="md">
        <DialogHeader
          title="Log Regulatory Submission"
          description="Register CDSCO / DCGI regulatory licensing applications."
        />
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            try {
              await complianceApi.createRegulatorySubmission({
                study_id: fd.get('study_id') as string,
                authority: fd.get('authority') as string,
                submission_type: fd.get('submission_type') as string,
                reference_number: (fd.get('reference_number') as string) || null,
                status: 'pending',
                submission_date: (fd.get('submission_date') as string) || null,
              })
              toast.success('Regulatory Record Logged')
              setIsRegModalOpen(false)
              regQuery.refetch()
            } catch (err: unknown) {
              toast.error('Failed to Log', err instanceof Error ? err.message : 'Unknown error')
            }
          }}
        >
          <DialogContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Study Protocol *</label>
              <Select
                required
                name="study_id"
                options={[
                  { value: '', label: 'Select Protocol...' },
                  ...studies.map((s) => ({ value: s.id, label: s.protocol_number })),
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Regulatory Authority *</label>
              <Input required name="authority" defaultValue="CDSCO / DCGI" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Submission Type *</label>
              <Input required name="submission_type" placeholder="e.g. Form CT-04 (Clinical Trial Permission)" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Reference Number</label>
              <Input name="reference_number" placeholder="e.g. CT/ND/2026/0124" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Submission Date</label>
              <Input type="date" name="submission_date" />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => setIsRegModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Log Submission
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Modal 3: Protocol Deviation */}
      <Dialog open={isDevModalOpen} onClose={() => setIsDevModalOpen(false)} size="md">
        <DialogHeader
          title="Log Protocol Deviation"
          description="Record a clinical trial non-compliance or procedural deviation."
        />
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            try {
              await complianceApi.createProtocolDeviation({
                study_id: fd.get('study_id') as string,
                category: fd.get('category') as string,
                description: fd.get('description') as string,
                severity: fd.get('severity') as any,
                status: 'identified',
                identified_date: (fd.get('identified_date') as string) || new Date().toISOString().slice(0, 10),
              })
              toast.success('Deviation Logged')
              setIsDevModalOpen(false)
              devQuery.refetch()
            } catch (err: unknown) {
              toast.error('Failed to Log', err instanceof Error ? err.message : 'Unknown error')
            }
          }}
        >
          <DialogContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Study Protocol *</label>
              <Select
                required
                name="study_id"
                options={[
                  { value: '', label: 'Select Protocol...' },
                  ...studies.map((s) => ({ value: s.id, label: s.protocol_number })),
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Category *</label>
              <Input required name="category" placeholder="e.g. Informed Consent, Visit Window, Dosing" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Identified Date *</label>
              <Input
                type="date"
                required
                name="identified_date"
                defaultValue={TODAY_ISO}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Severity *</label>
              <Select
                required
                name="severity"
                options={[
                  { value: 'minor', label: 'Minor Deviation' },
                  { value: 'major', label: 'Major Non-Compliance' },
                  { value: 'critical', label: 'Critical Violation' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Description *</label>
              <TextArea required name="description" rows={3} placeholder="Circumstances and clinical impact..." />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => setIsDevModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Log Deviation
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Modal 4: CAPA Record */}
      <Dialog open={isCapaModalOpen} onClose={() => setIsCapaModalOpen(false)} size="md">
        <DialogHeader
          title="Create Corrective &amp; Preventive Action (CAPA)"
          description="Formulate an action plan to prevent recurrence of protocol deviations."
        />
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            try {
              await complianceApi.createCAPARecord({
                study_id: (fd.get('study_id') as string) || null,
                capa_type: fd.get('capa_type') as any,
                description: fd.get('description') as string,
                due_date: (fd.get('due_date') as string) || null,
                status: 'open',
              })
              toast.success('CAPA Record Created')
              setIsCapaModalOpen(false)
              capaQuery.refetch()
            } catch (err: unknown) {
              toast.error('Failed to Create CAPA', err instanceof Error ? err.message : 'Unknown error')
            }
          }}
        >
          <DialogContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Associated Study (Optional)</label>
              <Select
                name="study_id"
                options={[
                  { value: '', label: 'Portfolio-wide CAPA' },
                  ...studies.map((s) => ({ value: s.id, label: s.protocol_number })),
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">CAPA Type *</label>
              <Select
                required
                name="capa_type"
                options={[
                  { value: 'corrective', label: 'Corrective Action' },
                  { value: 'preventive', label: 'Preventive Action' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Target Due Date</label>
              <Input type="date" name="due_date" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Action Plan &amp; Root Cause *</label>
              <TextArea required name="description" rows={3} placeholder="Investigative findings and remediations..." />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCapaModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Create CAPA Record
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </PageContainer>
  )
}
