import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { platformApi } from '@/api/platform.api'
import type { OrganizationType } from '@/types/api'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Alert } from '@/components/feedback/Alert'
import { Icon } from '@/components/primitives/Icon'

const ORG_TYPES: { label: string; value: OrganizationType }[] = [
  { label: 'Clinical Research Sponsor (Biopharma / Industry)', value: 'sponsor' },
  { label: 'Contract Research Organization (CRO)', value: 'cro' },
  { label: 'Academic Medical Center / Institutional Entity', value: 'institution' },
  { label: 'Clinical Research Site / Hospital Affiliate', value: 'site_affiliate' },
]

export const RequestAccessPage: React.FC = () => {
  const [applicantName, setApplicantName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [organizationType, setOrganizationType] = useState<OrganizationType>('sponsor')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [country, setCountry] = useState('India')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!applicantName.trim() || !organizationName.trim() || !email.trim()) {
      setError('Please fill out all required fields.')
      return
    }

    setIsSubmitting(true)
    try {
      await platformApi.submitOnboardingRequest({
        applicant_name: applicantName.trim(),
        organization_name: organizationName.trim(),
        organization_type: organizationType,
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        website: website.trim() || null,
        country: country.trim() || null,
        state: state.trim() || null,
        city: city.trim() || null,
        description: description.trim() || null,
      })
      setIsSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to submit onboarding request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#7A2A12] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xs bg-[#7A2A12] border border-[#B8862E]/40 shadow-sm mb-3">
          <span className="font-serif font-bold text-white text-2xl tracking-wider">A</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1C1A17]">
          AyuCTMS Platform Access
        </h1>
        <p className="mt-1 text-sm text-[#726B5C]">
          All India Institute of Ayurveda — Clinical Trial Management System
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-[#E4DED3] rounded-xs">
          {isSuccess ? (
            <div className="text-center space-y-5 py-4">
              <div className="w-14 h-14 rounded-full bg-[#1F5C3F]/10 text-[#1F5C3F] flex items-center justify-center mx-auto">
                <Icon name="check" size="lg" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-bold text-[#1C1A17]">
                  Onboarding Request Submitted
                </h2>
                <p className="text-sm text-[#726B5C] max-w-lg mx-auto">
                  Thank you, <strong className="text-[#1C1A17]">{applicantName}</strong>. Your request on behalf of{' '}
                  <strong className="text-[#1C1A17]">{organizationName}</strong> has been received by AyuCTMS Platform Administration.
                </p>
              </div>

              <div className="bg-[#F8F6F2] border border-[#E4DED3] p-4 rounded-xs text-left text-xs text-[#726B5C] space-y-2">
                <p className="font-semibold text-[#1C1A17] flex items-center gap-1.5">
                  <Icon name="info" size="sm" className="text-[#B8862E]" />
                  What happens next?
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Platform Super Admins will review your organization details for clinical compliance.</li>
                  <li>Upon verification, an organization environment will be provisioned.</li>
                  <li>An invitation and activation link will be delivered to <strong className="text-[#1C1A17]">{email}</strong>.</li>
                </ol>
              </div>

              <div className="pt-3">
                <Link to="/login">
                  <Button variant="primary" size="md">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#1C1A17]">
                  Request Institutional Access
                </h2>
                <p className="text-xs text-[#726B5C]">
                  AyuCTMS operates under strict platform governance. New research sponsors, CROs, and clinical sites must be verified by Platform Super Administrators before accessing trial operations.
                </p>
              </div>

              {error && (
                <Alert type="danger" title="Submission Error">
                  {error}
                </Alert>
              )}

              <div className="border-t border-[#E4DED3] pt-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A2A12] font-mono">
                  1. Organization Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#1C1A17] mb-1">
                      Organization Name *
                    </label>
                    <Input
                      placeholder="e.g., Central Ayurveda Research Center"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1C1A17] mb-1">
                      Organization Classification *
                    </label>
                    <Select
                      value={organizationType}
                      onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}
                      options={ORG_TYPES}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#1C1A17] mb-1">
                      Official Website URL
                    </label>
                    <Input
                      placeholder="https://example.org"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1C1A17] mb-1">
                      Country / Region
                    </label>
                    <Input
                      placeholder="India"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#1C1A17] mb-1">
                      State / Province
                    </label>
                    <Input
                      placeholder="e.g., Delhi"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1C1A17] mb-1">
                      City
                    </label>
                    <Input
                      placeholder="e.g., New Delhi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E4DED3] pt-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A2A12] font-mono">
                  2. Authorized Representative
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#1C1A17] mb-1">
                      Applicant Full Name *
                    </label>
                    <Input
                      placeholder="e.g., Dr. Ananya Sharma"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#1C1A17] mb-1">
                      Official Institutional Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="ananya.sharma@institution.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                    <span className="text-[10px] text-[#726B5C] mt-0.5 block">
                      Activation credentials will be issued to this address.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1C1A17] mb-1">
                    Contact Telephone / Mobile
                  </label>
                  <Input
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#1C1A17]">
                    Clinical & Research Scope Overview
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly state intended trial programs, therapeutic areas, or regulatory sponsor scope..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-xs border border-[#C9C2B3] rounded-xs bg-white text-[#1C1A17] focus:outline-2 focus:outline-[#B8862E] focus:border-[#7A2A12] transition-colors resize-y"
                  />
                </div>
              </div>

              <div className="border-t border-[#E4DED3] pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link
                  to="/login"
                  className="text-xs text-[#726B5C] hover:text-[#7A2A12] font-medium transition-colors"
                >
                  Already have an account? Sign in
                </Link>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Submit Access Request
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
