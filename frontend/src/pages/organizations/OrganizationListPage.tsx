import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { organizationsApi } from '@/api/organizations.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { OrganizationModal } from '@/features/organizations/OrganizationModal'
import { Select } from '@/components/forms/Select'
import type { OrganizationRead, OrganizationType, OrganizationStatus } from '@/types/api'

export const OrganizationListPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['organizations', typeFilter, statusFilter],
    queryFn: () =>
      organizationsApi.list({
        org_type: (typeFilter || undefined) as OrganizationType | undefined,
        org_status: (statusFilter || undefined) as OrganizationStatus | undefined,
      }),
  })

  const columns: Column<OrganizationRead>[] = [
    {
      key: 'registration_number',
      header: 'Code / Reg No',
      render: (org) => (
        <span className="font-mono text-xs font-bold text-[#7A2A12]">
          {org.registration_number || org.id.slice(0, 8)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'name',
      header: 'Legal Entity Name',
      render: (org) => (
        <div>
          <Link
            to={`/organizations/${org.id}`}
            className="font-medium text-[#1C1A17] hover:text-[#7A2A12] hover:underline text-xs"
          >
            {org.name}
          </Link>
          {org.city && (
            <span className="text-[11px] text-[#726B5C] block">
              {org.city}, {org.state || org.country}
            </span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'organization_type',
      header: 'Entity Type',
      render: (org) => (
        <span className="text-[11px] uppercase px-2 py-0.5 rounded-xs bg-[#F8F6F2] border border-[#E4DED3] text-[#5A5347] font-medium font-mono">
          {org.organization_type}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (org) => <StatusBadge status={org.status} size="sm" />,
      sortable: true,
    },
    {
      key: 'email',
      header: 'Contact Email',
      render: (org) => (
        <span className="text-xs text-[#5A5347] font-mono">
          {org.email || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (org) => (
        <div className="flex justify-end">
          <Link to={`/organizations/${org.id}`}>
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
        title="Organizations Directory"
        subtitle="Manage participating clinical trial sponsors, contract research organizations, and institutional ethics bodies"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Icon name="plus" size="xs" />}
          >
            Register Organization
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-3 border border-[#E4DED3] rounded-xs mb-4 flex flex-wrap items-center gap-3">
        <div className="w-52">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: '', label: 'All Organization Types' },
              { value: 'sponsor', label: 'Clinical Sponsors' },
              { value: 'cro', label: 'Contract Research Orgs (CRO)' },
              { value: 'institution', label: 'Research Institutions' },
              { value: 'site_affiliate', label: 'Trial Site Affiliates' },
            ]}
          />
        </div>

        <div className="w-44">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'deactivated', label: 'Deactivated' },
            ]}
          />
        </div>
      </div>

      {/* Organizations Table */}
      <DataTable
        data={data}
        columns={columns}
        loading={isLoading}
        searchPlaceholder="Search by legal name or registration code..."
        emptyTitle="No organizations registered matching criteria."
      />

      {/* Modal */}
      <OrganizationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </PageContainer>
  )
}
