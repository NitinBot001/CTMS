import React from 'react'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from './Dialog'
import { Button } from '@/components/primitives/Button'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary' | 'warning'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={open} onClose={onCancel} size="sm">
      <DialogHeader title={title} onClose={onCancel} />
      <DialogContent>
        <p className="text-xs text-[#5A5347] leading-relaxed">{message}</p>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
