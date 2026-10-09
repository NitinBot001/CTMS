import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditApi, type AuditVerificationResult } from '@/api/audit.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/data-display/Card'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { Select } from '@/components/forms/Select'
import { useToast } from '@/app/providers'
import { formatNumber } from '@/lib/format'
import type { AuditLogRead } from '@/types/api'

export const AuditLogPage: React.FC = () => {
  const toast = useToast()
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [verifying, setVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<AuditVerificationResult | null>(null)

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', resourceTypeFilter, actionFilter],
    queryFn: () =>
      auditApi.list({
        resource_type: resourceTypeFilter || undefined,
        action: actionFilter || undefined,
      }),
  })

  const handleVerifyChain = async () => {
    setVerifying(true)
    try {
      const res = await auditApi.verifyChain()
      setVerificationResult(res)
      if (res.valid) {
        toast.success(
          'Cryptographic Verification Succeeded',
          res.message || `All ${res.verified_records} records verified intact.`
        )
      } else {
        toast.error(
          'Audit Chain Tamper Detected',
          res.error || 'A cryptographic discrepancy was found in the audit trail!'
        )
      }
    } catch (err: unknown) {
      toast.error('Verification Error', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setVerifying(false)
    }
  }

  const columns: Column<AuditLogRead>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp (UTC)',
      render: (log) => (
        <span className="font-mono text-[11px] text-[#5A5347] whitespace-nowrap">
          {String(log.timestamp).replace('T', ' ').slice(0, 19)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => {
        const actionColors: Record<string, string> = {
          CREATE: 'bg-[#EDF6F1] text-[#1F5C3F] border-[#BDDCCB]',
          UPDATE: 'bg-[#EFF5F9] text-[#315A78] border-[#BFD7E7]',
          TRANSITION: 'bg-[#FBF7EE] text-[#B8862E] border-[#E9D6A9]',
          DELETE: 'bg-[#FDF2F2] text-[#9B2C2C] border-[#F5C6C6]',
        }
        const cls = actionColors[log.action.toUpperCase()] || 'bg-[#F8F6F2] text-[#5A5347] border-[#E4DED3]'
        return (
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-xs border ${cls}`}>
            {log.action}
          </span>
        )
      },
      sortable: true,
    },
    {
      key: 'resource_type',
      header: 'Resource & ID',
      render: (log) => (
        <div>
          <span className="font-semibold text-xs text-[#1C1A17] block">
            {log.resource_type}
          </span>
          <span className="text-[10px] font-mono text-[#726B5C]">
            {log.resource_id}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'user_id',
      header: 'Actor User ID',
      render: (log) => (
        <span className="font-mono text-[11px] text-[#5A5347]">
          {log.user_id ? log.user_id.slice(0, 8) + '...' : 'System'}
        </span>
      ),
    },
    {
      key: 'entry_hash',
      header: 'SHA-256 Entry Hash',
      render: (log) => (
        <span
          title={`Entry Hash: ${log.entry_hash}\nPrevious: ${log.previous_hash || 'GENESIS'}`}
          className="font-mono text-[10px] text-[#7A2A12] bg-[#F8F6F2] px-1.5 py-0.5 rounded-xs border border-[#E4DED3] block truncate max-w-xs"
        >
          {log.entry_hash.slice(0, 16)}...
        </span>
      ),
    },
  ]

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Immutable Cryptographic Audit Trail"
        subtitle="21 CFR Part 11 and CDSCO Schedule Y compliant append-only ledger with SHA-256 hash-chain verification"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<Icon name="refresh" size="xs" />}
          >
            Refresh Log
          </Button>
        }
      />

      {/* Cryptographic Verification Card */}
      <Card className="p-5 bg-white border border-[#E4DED3] mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xs bg-[#7A2A12]/10 text-[#7A2A12] shrink-0">
              <Icon name="database" size="md" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-[#1C1A17]">
                Dual-Phase Cryptographic Integrity Engine
              </h3>
              <p className="text-xs text-[#5A5347] max-w-xl mt-0.5 leading-relaxed">
                Verifies chain link continuity (each record's <code className="font-mono text-[#7A2A12]">previous_hash</code> matches the preceding record) and canonical payload digests (verifying that no record payload has been altered since creation).
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleVerifyChain}
            loading={verifying}
            leftIcon={<Icon name="shieldCheck" size="xs" />}
          >
            Verify Hash-Chain
          </Button>
        </div>

        {/* Verification Verdict Display */}
        {verificationResult && (
          <div
            className={`mt-4 p-3 rounded-xs border text-xs flex items-start gap-2.5 ${
              verificationResult.valid
                ? 'bg-[#EDF6F1] border-[#BDDCCB] text-[#1F5C3F]'
                : 'bg-[#FDF2F2] border-[#F5C6C6] text-[#9B2C2C]'
            }`}
          >
            <Icon
              name={verificationResult.valid ? 'check' : 'error'}
              size="sm"
              className="shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <span className="font-bold block">
                {verificationResult.valid
                  ? 'Cryptographic Ledger Verified: Intact'
                  : 'Tamper Alert: Ledger Discrepancy Detected'}
              </span>
              <span className="text-[11px] block mt-0.5">
                {verificationResult.message || verificationResult.error}
              </span>
              <span className="text-[10px] font-mono opacity-80 block mt-1">
                Verified Records: {formatNumber(verificationResult.verified_records)} &middot; Status: 100% Deterministic
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Filters */}
      <div className="bg-white p-3 border border-[#E4DED3] rounded-xs mb-4 flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            options={[
              { value: '', label: 'All Operations' },
              { value: 'CREATE', label: 'CREATE' },
              { value: 'UPDATE', label: 'UPDATE' },
              { value: 'TRANSITION', label: 'TRANSITION' },
              { value: 'DELETE', label: 'DELETE' },
            ]}
          />
        </div>

        <div className="w-52">
          <Select
            value={resourceTypeFilter}
            onChange={(e) => setResourceTypeFilter(e.target.value)}
            options={[
              { value: '', label: 'All Resource Types' },
              { value: 'study', label: 'Studies' },
              { value: 'organization', label: 'Organizations' },
              { value: 'site', label: 'Sites' },
              { value: 'participant', label: 'Participants' },
              { value: 'adverse_event', label: 'Adverse Events' },
              { value: 'document', label: 'Documents' },
              { value: 'compliance', label: 'Compliance' },
              { value: 'user', label: 'Users' },
            ]}
          />
        </div>
      </div>

      {/* Audit DataTable */}
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search by resource type, action, or user ID..."
        emptyMessage="No audit log events recorded matching criteria."
      />
    </PageContainer>
  )
}
