import React, { useState } from 'react'
import { platformApi } from '@/api/platform.api'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/app/providers/toastContext'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/forms/Input'
import { Alert } from '@/components/feedback/Alert'
import { Icon } from '@/components/primitives/Icon'

export const ForcePasswordChangeModal: React.FC = () => {
  const auth = useAuth()
  const { addToast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!currentPassword) {
      setError('Please provide your current temporary password.')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from your temporary password.')
      return
    }

    setIsSubmitting(true)
    try {
      await platformApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      addToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your permanent password has been set successfully.',
      })
      await auth.refreshProfile()
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141210]/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border border-[#E4DED3] rounded-xs shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#7A2A12] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Icon name="lock" size="sm" className="text-white" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base leading-tight">Password Change Required</h2>
              <p className="text-[11px] text-white/80 font-sans">First-time access credential update</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Alert type="warning" title="Security Protocol">
            Your account was initialized with a temporary or bootstrap credential. Platform security requires you to establish a secure permanent password before continuing.
          </Alert>

          {error && (
            <Alert type="danger" title="Update Failed">
              {error}
            </Alert>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Current Temporary Password
              </label>
              <Input
                type="password"
                placeholder="Enter temporary password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                New Permanent Password
              </label>
              <Input
                type="password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <span className="text-[11px] text-[#726B5C] mt-0.5 block">
                Must be at least 8 characters long.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Confirm New Password
              </label>
              <Input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={auth.logout}
              disabled={isSubmitting}
            >
              Sign Out
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Set Permanent Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
