import React from 'react'
import { Card } from '@/components/data-display/Card'
import { Icon } from '@/components/primitives/Icon'
import { Button } from '@/components/primitives/Button'

interface AccessPendingDashboardProps {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export const AccessPendingDashboard: React.FC<AccessPendingDashboardProps> = ({
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="p-8 bg-white border border-[#E4DED3] text-center space-y-6 shadow-xs">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#B8862E]/10 flex items-center justify-center text-[#B8862E]">
          <Icon name="clock" size="lg" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-serif font-bold text-[#1C1A17]">
            Platform Access Pending Verification
          </h2>
          <p className="text-sm text-[#726B5C] max-w-md mx-auto">
            Your AyuCTMS user account is active, but you are not currently associated with an active institutional role or research study team.
          </p>
        </div>

        <div className="bg-[#F8F6F2] border border-[#E4DED3] rounded p-4 text-left text-xs space-y-2">
          <h4 className="font-semibold text-[#1C1A17] flex items-center gap-1.5">
            <Icon name="alert-triangle" size="xs" className="text-[#B8862E]" />
            Why am I seeing this screen?
          </h4>
          <p className="text-[#726B5C]">
            AyuCTMS enforces strict institutional boundaries under national clinical governance (AIIA/SIH26046). Operational dashboards are role-scoped:
          </p>
          <ul className="list-disc list-inside text-[#726B5C] space-y-1 ml-1">
            <li><strong className="text-[#1C1A17]">Sponsors & Research PIs</strong> only see assigned research protocols.</li>
            <li><strong className="text-[#1C1A17]">CRO Monitors</strong> only see contracted trials and eligible recruitment sites.</li>
            <li><strong className="text-[#1C1A17]">Clinical Site Personnel</strong> only see their affiliated hospital workspace.</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onRefresh && (
            <Button
              variant="primary"
              size="sm"
              disabled={isRefreshing}
              onClick={onRefresh}
              className="text-xs px-4"
            >
              <Icon name="refresh" size="xs" className="mr-1.5" />
              {isRefreshing ? 'Checking Permissions...' : 'Refresh Access Status'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
