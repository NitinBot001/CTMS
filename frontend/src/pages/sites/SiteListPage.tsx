import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { sitesApi } from '@/api/sites.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { Select } from '@/components/forms/Select'
import { SiteModal } from '@/features/sites/SiteModal'
import type { SiteRead, SiteType, SiteStatus } from '@/types/api'

export const SiteListPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['sites', typeFilter, statusFilter],
    queryFn: () =>
      sitesApi.list({
        site_type: (typeFilter || undefined) as SiteType | undefined,
        status: (statusFilter || undefined) as SiteStatus | undefined,
      }),
  })

  const columns: Column<SiteRead>[] = [
    {
      key: 'site_code',
      header: 'Site Code',
      render: (site) => (
        <span className="font-mono text-xs font-bold text-[#7A2A12]">
          {site.site_code}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'name',
      header: 'Facility Name',
      render: (site) => (
        <div>
          <Link
            to={`/sites/${site.id}`}
            className="font-medium text-xs text-[#1C1A17] hover:text-[#7A2A12] hover:underline"
          >
            {site.name}
          </Link>
          {site.city && (
            <span className="text-[11px] text-[#726B5C] block">
              {site.city}, {site.state || site.country}
            </span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'site_type',
      header: 'Facility Type',
      render: (site) => (
        <span className="text-xs px-2 py-0.5 rounded-xs bg-[#F8F6F2] border border-[#E4DED3] text-[#5A5347] font-medium">
          {site.site_type}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Operational Status',
      render: (site) => <StatusBadge status={site.status} size="sm" />,
      sortable: true,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (site) => (
        <span className="text-xs text-[#5A5347] font-mono">
          {site.email || site.phone || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (site) => (
        <div className="flex justify-end">
          <Link to={`/sites/${site.id}`}>
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
        title="Research Sites Network"
        subtitle="Manage participating institutional hospitals, academic clinical centers, and GCP audit readiness"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Icon name="plus" size="xs" />}
          >
            Register Site
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white p-3 border border-[#E4DED3] rounded-xs mb-4 flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: '', label: 'All Facility Types' },
              { value: 'HOSPITAL', label: 'Hospital' },
              { value: 'CLINIC', label: 'Clinic' },
              { value: 'RESEARCH_INSTITUTE', label: 'Research Institute' },
              { value: 'ACADEMIC', label: 'Academic Center' },
            ]}
          />
        </div>

        <div className="w-44">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
        </div>
      </div>

      {/* Sites Data Table */}
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search by facility name, site code, or city..."
        emptyMessage="No clinical research sites registered matching criteria."
      />

      {/* Modal */}
      <SiteModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </PageContainer>
  )
}
