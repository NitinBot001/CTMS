import React, { useState } from 'react'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/overlays/Dialog'
import { Button } from '@/components/primitives/Button'
import { StatusBadge } from './StatusBadge'
import { formatEnumLabel } from '@/lib/format'

export interface TransitionDialogProps {
  open: boolean
  title?: string
  entityName: string
  currentStatus: string
  allowedTransitions: string[]
  loading?: boolean
  onClose: () => void
  onTransition: (newStatus: string, reason?: string) => Promise<void>
}

export const TransitionDialog: React.FC<TransitionDialogProps> = ({
  open,
  title,
  entityName,
  currentStatus,
  allowedTransitions,
  loading = false,
  onClose,
  onTransition,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>(allowedTransitions[0] || '')
  const [reason, setReason] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!selectedStatus) {
      setError('Please select a target status.')
      return
    }
    setError(null)
    try {
      await onTransition(selectedStatus, reason.trim() || undefined)
      setReason('')
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to update status.')
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} size="sm">
      <DialogHeader
        title={title || `Change ${entityName} Status`}
        description={`Execute GCP-compliant lifecycle transition for this ${entityName.toLowerCase()}.`}
        onClose={onClose}
      />
      <DialogContent className="space-y-4">
        {error && (
          <div className="p-2.5 bg-[#FDF2F2] border border-[#F5C6C6] text-[#9B2C2C] rounded-xs text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#5A5347] mb-1">Current Status</label>
          <StatusBadge status={currentStatus} showDot />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#5A5347] mb-1">
            New Status <span className="text-[#9B2C2C]">*</span>
          </label>
          {allowedTransitions.length === 0 ? (
            <p className="text-xs text-[#726B5C] italic">No further transitions are allowed from this state.</p>
          ) : (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs border border-[#C9C2B3] bg-white rounded-xs px-3 py-2 text-[#1C1A17] focus:outline-2 focus:outline-[#B8862E]"
            >
              {allowedTransitions.map((status) => (
                <option key={status} value={status}>
                  {formatEnumLabel(status)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#5A5347] mb-1">
            Reason / Regulatory Justification
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Document reason for audit trail (e.g. Protocol amendment, EC approval received)..."
            className="w-full text-xs border border-[#C9C2B3] bg-white rounded-xs p-2.5 text-[#1C1A17] focus:outline-2 focus:outline-[#B8862E]"
          />
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirm}
          loading={loading}
          disabled={allowedTransitions.length === 0}
        >
          Confirm Transition
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
