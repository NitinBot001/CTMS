import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { platformApi } from '@/api/platform.api'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/forms/Input'
import { Alert } from '@/components/feedback/Alert'
import { Icon } from '@/components/primitives/Icon'

export const AccountActivationPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(() => searchParams.get('token') || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activatedEmail, setActivatedEmail] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token.trim()) {
      setError('Activation invitation token is required.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await platformApi.activateAccount({
        token: token.trim(),
        new_password: newPassword,
      })
      setActivatedEmail(res.email)
    } catch (err: any) {
      setError(err?.message || 'Activation failed. The token may be expired or already consumed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#7A2A12] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xs bg-[#7A2A12] border border-[#B8862E]/40 shadow-sm mb-3">
          <span className="font-serif font-bold text-white text-2xl tracking-wider">A</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1C1A17]">
          Activate Account
        </h1>
        <p className="mt-1 text-sm text-[#726B5C]">
          AyuCTMS Clinical Trial Management System
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-[#E4DED3] rounded-xs">
          {activatedEmail ? (
            <div className="text-center space-y-5 py-4">
              <div className="w-14 h-14 rounded-full bg-[#1F5C3F]/10 text-[#1F5C3F] flex items-center justify-center mx-auto">
                <Icon name="check" size="lg" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-bold text-[#1C1A17]">
                  Account Activated!
                </h2>
                <p className="text-sm text-[#726B5C]">
                  Your credentials have been established for{' '}
                  <strong className="text-[#1C1A17]">{activatedEmail}</strong>. You may now sign in to your organization workspace.
                </p>
              </div>

              <div className="pt-3">
                <Link to="/login">
                  <Button variant="primary" size="md" className="w-full">
                    Proceed to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-2">
                <h2 className="font-serif text-base font-bold text-[#1C1A17]">
                  Initial Administrator Activation
                </h2>
                <p className="text-xs text-[#726B5C]">
                  Your organization onboarding request has been approved. Establish your permanent administrative password below.
                </p>
              </div>

              {error && (
                <Alert type="danger" title="Activation Error">
                  {error}
                </Alert>
              )}

              <div>
                <label className="block text-xs font-medium text-[#1C1A17] mb-1">
                  Invitation / Activation Token *
                </label>
                <Input
                  placeholder="Paste token or link query"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <span className="text-[10px] text-[#726B5C] mt-0.5 block">
                  Provided in your approval notification email.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C1A17] mb-1">
                  New Permanent Password *
                </label>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1C1A17] mb-1">
                  Confirm Password *
                </label>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  Activate &amp; Create Credentials
                </Button>
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs text-[#726B5C] hover:text-[#7A2A12] transition-colors"
                >
                  Already activated? Return to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
