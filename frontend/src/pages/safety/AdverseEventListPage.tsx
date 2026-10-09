import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { safetyApi } from '@/api/safety.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { Select } from '@/components/forms/Select'
import { AdverseEventModal } from '@/features/safety/AdverseEventModal'
import type { AdverseEventRead, Seriousness, Severity, AEStatus } from '@/types/api'

export const AdverseEventListPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [seriousnessFilter, setSeriousnessFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['adverse-events', seriousnessFilter, severityFilter, statusFilter],
    queryFn: () =>
      safetyApi.list({
        seriousness: (seriousnessFilter || undefined) as Seriousness | undefined,
        severity: (severityFilter || undefined) as Severity | undefined,
        status: (statusFilter || undefined) as AEStatus | undefined,
      }),
  })

  const columns: Column<AdverseEventRead>[] = [
    {
      key: 'description',
      header: 'Event Description',
      render: (ae) => (
        <div className="max-w-md">
          <Link
            to={`/safety/${ae.id}`}
            className="font-medium text-xs text-[#1C1A17] hover:text-[#7A2A12] hover:underline block"
          >
            {ae.description}
          </Link>
          <span className="text-[11px] text-[#726B5C] font-mono">
            Type: {ae.event_type.toUpperCase()}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'seriousness',
      header: 'Classification',
      render: (ae) => (
        <div className="flex items-center gap-1.5">
          {ae.seriousness === 'serious' ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-xs bg-[#FDF2F2] border border-[#F5C6C6] text-[#9B2C2C]">
              SAE
            </span>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded-xs bg-[#F8F6F2] border border-[#E4DED3] text-[#5A5347]">
              Non-Serious
            </span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'severity',
      header: 'CTCAE Severity',
      render: (ae) => (
        <span className="text-xs uppercase font-medium text-[#5A5347]">
          {ae.severity}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Review State',
      render: (ae) => <StatusBadge status={ae.status} size="sm" />,
      sortable: true,
    },
    {
      key: 'onset_date',
      header: 'Onset Date',
      render: (ae) => (
        <span className="text-xs text-[#5A5347] font-mono">
          {ae.onset_date}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: '',
      render: (ae) => (
        <div className="flex justify-end">
          <Link to={`/safety/${ae.id}`}>
            <Button variant="ghost" size="xs" rightIcon={<Icon name="arrowRight" size="xs" />}>
              Details
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Pharmacovigilance &amp; Safety"
        subtitle="Adverse events, serious adverse events (SAE), and expedited safety reporting tracking"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Icon name="shieldAlert" size="xs" />}
          >
            Report Adverse Event
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-3 border border-[#E4DED3] rounded-xs mb-4 flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select
            value={seriousnessFilter}
            onChange={(e) => setSeriousnessFilter(e.target.value)}
            options={[
              { value: '', label: 'All Seriousness' },
              { value: 'serious', label: 'Serious (SAE)' },
              { value: 'non_serious', label: 'Non-Serious' },
            ]}
          />
        </div>

        <div className="w-44">
          <Select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            options={[
              { value: '', label: 'All Severities' },
              { value: 'mild', label: 'Grade 1 - Mild' },
              { value: 'moderate', label: 'Grade 2 - Moderate' },
              { value: 'severe', label: 'Grade 3 - Severe' },
              { value: 'life_threatening', label: 'Grade 4 - Life-Threatening' },
              { value: 'fatal', label: 'Grade 5 - Fatal' },
            ]}
          />
        </div>

        <div className="w-40">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All States' },
              { value: 'open', label: 'Open' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
        </div>
      </div>

      {/* Adverse Events Table */}
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search event descriptions or IDs..."
        emptyMessage="No adverse events recorded matching criteria."
      />

      {/* Modal */}
      <AdverseEventModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </PageContainer>
  )
}
