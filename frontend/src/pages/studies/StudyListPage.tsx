import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { studiesApi } from '@/api/studies.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { Select } from '@/components/forms/Select'
import { formatNumber } from '@/lib/format'
import type { StudyRead, StudyPhase, StudyStatus } from '@/types/api'

export const StudyListPage: React.FC = () => {
  const [phaseFilter, setPhaseFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data = [], isLoading } = useQuery({
    queryKey: ['studies', phaseFilter, statusFilter],
    queryFn: () =>
      studiesApi.list({
        phase: (phaseFilter || undefined) as StudyPhase | undefined,
        status: (statusFilter || undefined) as StudyStatus | undefined,
      }),
  })

  const columns: Column<StudyRead>[] = [
    {
      key: 'protocol_number',
      header: 'Protocol & Code',
      render: (study) => (
        <div>
          <span className="font-mono text-xs font-bold text-[#7A2A12] block">
            {study.protocol_number}
          </span>
          <span className="text-[10px] font-mono text-[#726B5C]">
            {study.study_code}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'title',
      header: 'Study Title',
      render: (study) => (
        <div className="max-w-md">
          <Link
            to={`/studies/${study.id}`}
            className="font-medium text-xs text-[#1C1A17] hover:text-[#7A2A12] hover:underline line-clamp-2"
          >
            {study.title}
          </Link>
          <span className="text-[11px] text-[#726B5C] block mt-0.5">
            {study.therapeutic_area} &middot; {study.study_type}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'phase',
      header: 'Phase',
      render: (study) => (
        <span className="text-xs px-2 py-0.5 rounded-xs bg-[#F8F6F2] border border-[#E4DED3] text-[#5A5347] font-medium whitespace-nowrap">
          {study.phase}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Lifecycle Status',
      render: (study) => <StatusBadge status={study.status} size="sm" />,
      sortable: true,
    },
    {
      key: 'ctri_number',
      header: 'CTRI Registration',
      render: (study) =>
        study.ctri_number ? (
          <span className="font-mono text-[11px] text-[#1F5C3F] font-semibold bg-[#EDF6F1] px-1.5 py-0.5 rounded-xs border border-[#BDDCCB]">
            {study.ctri_number}
          </span>
        ) : (
          <span className="text-[11px] text-[#726B5C] italic">Unregistered</span>
        ),
    },
    {
      key: 'planned_sample_size',
      header: 'Target Cohort',
      render: (study) => (
        <span className="font-mono text-xs text-[#1C1A17]">
          {study.planned_sample_size ? formatNumber(study.planned_sample_size) : '—'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'actions',
      header: '',
      render: (study) => (
        <div className="flex justify-end">
          <Link to={`/studies/${study.id}`}>
            <Button variant="ghost" size="xs" rightIcon={<Icon name="arrowRight" size="xs" />}>
              Workspace
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Clinical Studies Portfolio"
        subtitle="Operational oversight of protocols, clinical phases, milestone schedules, and regulatory clearance"
        actions={
          <Link to="/studies/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Icon name="plus" size="xs" />}
            >
              Initiate New Study
            </Button>
          </Link>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-3 border border-[#E4DED3] rounded-xs mb-4 flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            options={[
              { value: '', label: 'All Clinical Phases' },
              { value: 'phase_1', label: 'Phase I' },
              { value: 'phase_1_2', label: 'Phase I/II' },
              { value: 'phase_2', label: 'Phase II' },
              { value: 'phase_2_3', label: 'Phase II/III' },
              { value: 'phase_3', label: 'Phase III' },
              { value: 'phase_3_4', label: 'Phase III/IV' },
              { value: 'phase_4', label: 'Phase IV' },
              { value: 'na', label: 'Not Applicable' },
            ]}
          />
        </div>

        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Lifecycle Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'planned', label: 'Planned' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'completed', label: 'Completed' },
              { value: 'terminated', label: 'Terminated' },
              { value: 'withdrawn', label: 'Withdrawn' },
            ]}
          />
        </div>
      </div>

      {/* Studies Data Table */}
      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Search by protocol number, study code, or title..."
        emptyTitle="No clinical studies found matching the selected criteria."
      />
    </PageContainer>
  )
}
