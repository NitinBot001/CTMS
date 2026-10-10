import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard.api'
import { PageContainer, PageHeader } from '@/components/layout'
import {
  SuperAdminOverviewDashboard,
  ResearchPIDashboard,
  CROWorkspaceDashboard,
  SitePIDashboard,
  AccessPendingDashboard,
} from '@/features/dashboard'
import { LoadingState, ErrorState } from '@/components/feedback'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'

export const DashboardPage: React.FC = () => {
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.getSummary,
  })

  // Dynamic header titles based on resolved role
  const getHeaderMeta = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return {
          title: 'Platform Operations Oversight',
          subtitle: 'Read-only cross-organizational telemetry across all registered Sponsors, CROs, and active protocols',
        }
      case 'research_pi':
        return {
          title: 'Research Principal Investigator Hub',
          subtitle: 'Protocol delivery oversight, affiliated site activations, and research milestones',
        }
      case 'cro':
        return {
          title: 'CRO Trial Operations Workspace',
          subtitle: 'Multi-center protocol orchestration, site recruitment discovery, and participant monitoring',
        }
      case 'site_pi':
        return {
          title: 'Clinical Research Site Console',
          subtitle: 'Institutional study participation, protocol confirmation, and patient tracking',
        }
      default:
        return {
          title: 'AyuCTMS Operations Dashboard',
          subtitle: 'Institutional governance, multi-center trial progression, and GCP oversight',
        }
    }
  }

  const meta = getHeaderMeta(data?.role)

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs"
          >
            <Icon name="refresh" size="xs" className="mr-1.5" />
            {isFetching ? 'Refreshing...' : 'Refresh Telemetry'}
          </Button>
        }
      />

      {isLoading && (
        <LoadingState message="Resolving role authorization and operational dashboard..." />
      )}

      {isError && (
        <ErrorState
          title="Dashboard Telemetry Error"
          message="Unable to retrieve role-scoped dashboard metrics from the backend. Please check your network and authorization."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && data && (
        <div className="space-y-6">
          {data.role === 'super_admin' && data.super_admin && (
            <SuperAdminOverviewDashboard data={data.super_admin} />
          )}

          {data.role === 'research_pi' && data.research_pi && (
            <ResearchPIDashboard data={data.research_pi} />
          )}

          {data.role === 'cro' && data.cro && (
            <CROWorkspaceDashboard data={data.cro} />
          )}

          {data.role === 'site_pi' && data.site_pi && (
            <SitePIDashboard data={data.site_pi} />
          )}

          {data.role === 'unassigned' && (
            <AccessPendingDashboard onRefresh={() => refetch()} isRefreshing={isFetching} />
          )}
        </div>
      )}
    </PageContainer>
  )
}
