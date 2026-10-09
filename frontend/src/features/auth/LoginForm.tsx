import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/forms/Input'
import { Button } from '@/components/primitives/Button'
import { Alert } from '@/components/feedback/Alert'
import { Icon } from '@/components/primitives/Icon'
import { ApiError } from '@/api/errors'

export const LoginForm: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your institutional email and password.')
      return
    }

    setLoading(true)
    try {
      await login({ email: email.trim(), password })
      navigate(from, { replace: true })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || 'Invalid institutional credentials.')
      } else {
        setErrorMsg('Authentication service unavailable. Please check backend connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <Alert
          variant="danger"
          title="Authentication Failed"
          description={errorMsg}
          onClose={() => setErrorMsg(null)}
        />
      )}

      <div>
        <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
          Institutional Email
        </label>
        <Input
          type="email"
          autoComplete="username"
          required
          placeholder="officer@sponsor.ctms.aiia.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
          Password
        </label>
        <Input
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          className="w-full justify-center"
          rightIcon={<Icon name="arrowRight" size="xs" />}
        >
          Sign In to CTMS
        </Button>
      </div>
    </form>
  )
}
