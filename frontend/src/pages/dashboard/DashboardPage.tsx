import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { portfolioApi } from '@/api/portfolio.api'
import { PageContainer, PageHeader } from '@/components/layout'
import {
  OverviewKPIs,
  HealthSummaryCard,
  AlertsPanel,
  UpcomingMilestones,
  EnrollmentTrendChart,
} from '@/features/dashboard'
import { LoadingState, ErrorState } from '@/components/feedback'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'

export const DashboardPage: React.FC = () => {
  const overviewQuery = useQuery({
    queryKey: ['portfolio', 'overview'],
    queryFn: portfolioApi.getOverview,
  })

  const healthQuery = useQuery({
    queryKey: ['portfolio', 'health'],
    queryFn: portfolioApi.getHealth,
  })

  const alertsQuery = useQuery({
    queryKey: ['portfolio', 'alerts'],
    queryFn: portfolioApi.getAlerts,
  })

  const milestonesQuery = useQuery({
    queryKey: ['portfolio', 'milestones'],
    queryFn: () => portfolioApi.getUpcomingMilestones(10),
  })

  const trendQuery = useQuery({
    queryKey: ['portfolio', 'trend'],
    queryFn: () => portfolioApi.getEnrollmentTrend(),
  })

  const isLoading = overviewQuery.isLoading || healthQuery.isLoading
  const isError = overviewQuery.isError || healthQuery.isError

  const handleRefetchAll = () => {
    overviewQuery.refetch()
    healthQuery.refetch()
    alertsQuery.refetch()
    milestonesQuery.refetch()
    trendQuery.refetch()
  }

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Portfolio Operations Dashboard"
        subtitle="Institutional governance, multi-center trial progression, and GCP oversight"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefetchAll}
            leftIcon={<Icon name="refresh" size="xs" />}
          >
            Refresh Telemetry
          </Button>
        }
      />

      {isLoading && <LoadingState message="Loading portfolio analytics and telemetry..." />}

      {isError && (
        <ErrorState
          title="Telemetry Load Error"
          message="Unable to retrieve real-time portfolio metrics from the backend. Please check your network and authorization."
          onRetry={handleRefetchAll}
        />
      )}

      {!isLoading && !isError && overviewQuery.data && healthQuery.data && (
        <div className="space-y-6">
          {/* Composite Health Risk Summary */}
          <HealthSummaryCard health={healthQuery.data} />

          {/* High-level Operational KPIs */}
          <OverviewKPIs data={overviewQuery.data} />

          {/* Charts & Split Operations View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <EnrollmentTrendChart trend={trendQuery.data || []} />
            </div>
            <div>
              <AlertsPanel alerts={alertsQuery.data || []} />
            </div>
          </div>

          {/* Milestones Schedule */}
          <div>
            <UpcomingMilestones milestones={milestonesQuery.data || []} />
          </div>
        </div>
      )}
    </PageContainer>
  )
}
