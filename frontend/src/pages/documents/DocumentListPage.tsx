import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/api/documents.api'
import { studiesApi } from '@/api/studies.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { DataTable, type Column } from '@/components/data-display/DataTable'
import { StatusBadge } from '@/components/status/StatusBadge'
import { TransitionDialog } from '@/components/status/TransitionDialog'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/overlays/Dialog'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { useToast } from '@/app/providers'
import { formatBytes } from '@/lib/format'
import type { DocumentRead, DocumentType, DocumentStatus, DocumentCreate } from '@/types/api'

export const DocumentListPage: React.FC = () => {
  const toast = useToast()
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [transitionTarget, setTransitionTarget] = useState<DocumentRead | null>(null)

  const studiesQuery = useQuery({
    queryKey: ['studies', 'all'],
    queryFn: () => studiesApi.list(),
  })

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['documents', typeFilter, statusFilter],
    queryFn: () =>
      documentsApi.list({
        document_type: (typeFilter || undefined) as DocumentType | undefined,
        status: (statusFilter || undefined) as DocumentStatus | undefined,
      }),
  })

  const studies = studiesQuery.data || []

  const handleTransition = async (targetStatus: string, reason?: string) => {
    if (!transitionTarget) return
    try {
      await documentsApi.transition(transitionTarget.id, {
        new_status: targetStatus,
        reason: reason || null,
      })
      toast.success('Document Lifecycle Updated', `Status changed to ${targetStatus}`)
      setTransitionTarget(null)
      refetch()
    } catch (err: unknown) {
      toast.error('Transition Failed', err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  const columns: Column<DocumentRead>[] = [
    {
      key: 'title',
      header: 'Document Title & Version',
      render: (doc) => (
        <div>
          <span className="font-semibold text-xs text-[#1C1A17] block">{doc.title}</span>
          <span className="text-[11px] text-[#726B5C] font-mono">
            v{doc.version} &middot; {doc.file_name}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'document_type',
      header: 'TMF Category',
      render: (doc) => (
        <span className="text-xs px-2 py-0.5 rounded-xs bg-[#F8F6F2] border border-[#E4DED3] text-[#5A5347] font-medium uppercase text-[11px]">
          {doc.document_type.replace('_', ' ')}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Approval State',
      render: (doc) => <StatusBadge status={doc.status} size="sm" />,
      sortable: true,
    },
    {
      key: 'checksum',
      header: 'Cryptographic Checksum',
      render: (doc) => (
        <span
          title={doc.checksum || undefined}
          className="font-mono text-[10px] text-[#726B5C] bg-[#F8F6F2] px-1.5 py-0.5 rounded-xs border border-[#E4DED3]"
        >
          {doc.checksum ? `${doc.checksum.slice(0, 16)}...` : 'Unverified'}
        </span>
      ),
    },
    {
      key: 'file_size',
      header: 'Size',
      render: (doc) => (
        <span className="text-xs text-[#5A5347] font-mono">
          {doc.file_size ? formatBytes(doc.file_size) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (doc) => (
        <div className="flex justify-end">
          <Button variant="outline" size="xs" onClick={() => setTransitionTarget(doc)}>
            Transition
          </Button>
        </div>
      ),
    },
  ]

  return (
    <PageContainer maxWidth="2xl">
      <PageHeader
        title="Trial Master File (TMF) Registry"
        subtitle="Cryptographically verified clinical protocol documents, investigator brochures, and essential records"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Icon name="upload" size="xs" />}
          >
            Register Document
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
              { value: '', label: 'All Document Categories' },
              { value: 'protocol', label: 'Clinical Protocol' },
              { value: 'investigator_brochure', label: 'Investigator Brochure (IB)' },
              { value: 'icf', label: 'Informed Consent Form (ICF)' },
              { value: 'ec_document', label: 'Ethics Committee Dossier' },
              { value: 'regulatory', label: 'Regulatory Correspondence' },
              { value: 'contract', label: 'Clinical Trial Agreement' },
              { value: 'essential', label: 'Essential Document' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </div>

        <div className="w-44">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Document States' },
              { value: 'draft', label: 'Draft' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'superseded', label: 'Superseded' },
              { value: 'expired', label: 'Expired' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        </div>
      </div>

      {/* Documents Data Table */}
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search document titles, versions, or filenames..."
        emptyMessage="No trial master file records found matching query."
      />

      {/* Transition Dialog */}
      {transitionTarget && (
        <TransitionDialog
          open={!!transitionTarget}
          onClose={() => setTransitionTarget(null)}
          entityName="TMF Document"
          currentStatus={transitionTarget.status}
          allowedTransitions={['draft', 'under_review', 'approved', 'superseded', 'expired', 'archived']}
          onTransition={handleTransition}
        />
      )}

      {/* Modal: Register Document Metadata */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <DialogHeader
          title="Register TMF Essential Document"
          description="Register protocol document metadata and storage references into the electronic trial master file."
        />
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const payload: DocumentCreate = {
              title: fd.get('title') as string,
              document_type: fd.get('document_type') as DocumentType,
              version: (fd.get('version') as string) || '1.0',
              study_id: (fd.get('study_id') as string) || null,
              storage_key: `tmf/${Date.now()}_${(fd.get('file_name') as string).replace(/\s+/g, '_')}`,
              file_name: fd.get('file_name') as string,
              checksum: fd.get('checksum') as string || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            }

            try {
              await documentsApi.create(payload)
              toast.success('Document Registered', 'Metadata indexed into Trial Master File.')
              setIsModalOpen(false)
              refetch()
            } catch (err: unknown) {
              toast.error('Registration Failed', err instanceof Error ? err.message : 'Unknown error')
            }
          }}
        >
          <DialogContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Document Title *
              </label>
              <Input required name="title" placeholder="e.g. Master Clinical Protocol v2.1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                  TMF Category *
                </label>
                <Select
                  required
                  name="document_type"
                  options={[
                    { value: 'protocol', label: 'Clinical Protocol' },
                    { value: 'investigator_brochure', label: 'Investigator Brochure (IB)' },
                    { value: 'icf', label: 'Informed Consent Form (ICF)' },
                    { value: 'ec_document', label: 'Ethics Dossier' },
                    { value: 'regulatory', label: 'Regulatory Submission' },
                    { value: 'essential', label: 'Essential Document' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                  Document Version *
                </label>
                <Input required name="version" defaultValue="1.0" placeholder="1.0" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Associated Protocol (Optional)
              </label>
              <Select
                name="study_id"
                options={[
                  { value: '', label: 'Portfolio General' },
                  ...studies.map((s) => ({ value: s.id, label: s.protocol_number })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                File Name *
              </label>
              <Input required name="file_name" placeholder="e.g. AIIA_DIAB_Protocol_v2.1_Signed.pdf" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                SHA-256 Digest Checksum (Optional)
              </label>
              <Input name="checksum" placeholder="64-character SHA-256 hash string..." />
            </div>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Index Document
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </PageContainer>
  )
}
