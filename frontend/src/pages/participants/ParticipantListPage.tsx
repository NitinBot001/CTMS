import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { participantsApi } from '@/api/participants.api'
import { studiesApi } from '@/api/studies.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { Select } from '@/components/forms/Select'
import { ParticipantModal } from '@/features/participants/ParticipantModal'
import type { ParticipantRead, ParticipantStatus } from '@/types/api'

export const ParticipantListPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [studyFilter, setStudyFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const studiesQuery = useQuery({
    queryKey: ['studies', 'all'],
    queryFn: () => studiesApi.list(),
  })

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['participants', studyFilter, statusFilter],
    queryFn: () =>
      participantsApi.list({
        study_id: studyFilter || undefined,
        status: (statusFilter || undefined) as ParticipantStatus | undefined,
      }),
  })

  const studies = studiesQuery.data || []
  const studyMap = new Map(studies.map((s) => [s.id, s.protocol_number]))

  const columns: Column<ParticipantRead>[] = [
    {
      key: 'participant_code',
      header: 'Subject Code',
      render: (p) => (
        <span className="font-mono text-xs font-bold text-[#7A2A12]">
          {p.participant_code}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'study_id',
      header: 'Clinical Protocol',
      render: (p) => (
        <Link
          to={`/studies/${p.study_id}`}
          className="font-mono text-xs text-[#1C1A17] hover:text-[#7A2A12] hover:underline"
        >
          {studyMap.get(p.study_id) || p.study_id.slice(0, 8)}
        </Link>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Cohort Status',
      render: (p) => <StatusBadge status={p.status} size="sm" />,
      sortable: true,
    },
    {
      key: 'screening_date',
      header: 'Screening Date',
      render: (p) => (
        <span className="text-xs text-[#5A5347] font-mono">
          {p.screening_date || '—'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'enrollment_date',
      header: 'Enrolled Date',
      render: (p) => (
        <span className="text-xs text-[#5A5347] font-mono">
          {p.enrollment_date || '—'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex justify-end">
          <Link to={`/participants/${p.id}`}>
            <Button variant="ghost" size="xs" rightIcon={<Icon name="arrowRight" size="xs" />}>
              Record
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Trial Participants Cohort"
        subtitle="De-identified subject registry, screening status, and informed consent tracking"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Icon name="userPlus" size="xs" />}
          >
            Register Subject
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-3 border border-[#E4DED3] rounded-xs mb-4 flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Select
            value={studyFilter}
            onChange={(e) => setStudyFilter(e.target.value)}
            options={[
              { value: '', label: 'All Clinical Protocols' },
              ...studies.map((s) => ({ value: s.id, label: s.protocol_number })),
            ]}
          />
        </div>

        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Participant Statuses' },
              { value: 'SCREENED', label: 'Screened' },
              { value: 'ELIGIBLE', label: 'Eligible' },
              { value: 'SCREEN_FAILED', label: 'Screen Failed' },
              { value: 'ENROLLED', label: 'Enrolled' },
              { value: 'ACTIVE', label: 'Active on Therapy' },
              { value: 'COMPLETED', label: 'Completed Protocol' },
              { value: 'DISCONTINUED', label: 'Discontinued' },
              { value: 'WITHDRAWN', label: 'Withdrawn' },
            ]}
          />
        </div>
      </div>

      {/* Participants Data Table */}
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search by de-identified subject code..."
        emptyMessage="No clinical trial participants found matching query."
      />

      {/* Modal */}
      <ParticipantModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </PageContainer>
  )
}
