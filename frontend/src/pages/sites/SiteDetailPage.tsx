import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { sitesApi } from '@/api/sites.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/data-display/Card'
import { StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { LoadingState, ErrorState } from '@/components/feedback'

export const SiteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const { data: site, isLoading, isError } = useQuery({
    queryKey: ['site', id],
    queryFn: () => sitesApi.getById(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <PageContainer maxWidth="2xl">
        <LoadingState message="Loading research site details..." />
      </PageContainer>
    )
  }

  if (isError || !site) {
    return (
      <PageContainer maxWidth="2xl">
        <ErrorState
          title="Site Not Found"
          message="Unable to locate the requested research site facility."
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title={site.name}
        subtitle={`${site.site_type} &middot; Institutional Code: ${site.site_code}`}
        breadcrumbs={[
          { label: 'Sites', href: '/sites' },
          { label: site.site_code },
        ]}
        badge={<StatusBadge status={site.status} />}
        actions={
          <Link to="/sites">
            <Button variant="outline" size="sm" leftIcon={<Icon name="arrowRight" size="xs" className="rotate-180" />}>
              Back to Sites
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
              Clinical Facility Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#726B5C] block mb-0.5">Facility Name</span>
                <span className="font-medium text-[#1C1A17]">{site.name}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Site Code</span>
                <span className="font-mono font-bold text-[#7A2A12]">{site.site_code}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Facility Type</span>
                <span className="font-medium text-[#1C1A17]">{site.site_type}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Operational Status</span>
                <StatusBadge status={site.status} size="sm" />
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Contact Email</span>
                <span className="font-mono text-[#5A5347]">{site.email || '—'}</span>
              </div>
              <div>
                <span className="text-[#726B5C] block mb-0.5">Contact Phone</span>
                <span className="text-[#5A5347]">{site.phone || '—'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#726B5C] block mb-0.5">Facility Physical Address</span>
                <span className="text-[#5A5347]">
                  {[site.address_line1, site.address_line2, site.city, site.state, site.postal_code, site.country]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 bg-white border border-[#E4DED3]">
            <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
              GCP Accreditation &amp; Security
            </h3>
            <div className="space-y-2 text-xs text-[#5A5347]">
              <div className="flex items-center gap-2 text-[#1F5C3F]">
                <Icon name="shieldCheck" size="sm" />
                <span className="font-medium">IEC / Ethics Committee Associated</span>
              </div>
              <p className="text-[11px] text-[#726B5C] leading-relaxed pt-1">
                Facility validated for Good Clinical Practice (GCP) and Schedule Y guidelines under the Drugs and Cosmetics Act.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
