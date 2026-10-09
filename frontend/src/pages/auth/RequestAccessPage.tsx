import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { platformApi } from '@/api/platform.api'
import type { AccessRequestType, OrganizationType } from '@/types/api'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Alert } from '@/components/feedback/Alert'
import { Icon } from '@/components/primitives/Icon'

export const RequestAccessPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AccessRequestType>('research_pi')

  // Common fields
  const [applicantName, setApplicantName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [designation, setDesignation] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [declarationAccepted, setDeclarationAccepted] = useState(true)
  const country = 'India'
  const [state, setState] = useState('')
  const [city, setCity] = useState('')

  // Research PI / CRO fields
  const [organizationName, setOrganizationName] = useState('')
  const [organizationType, setOrganizationType] = useState<OrganizationType>('sponsor')
  const [requestedRole, setRequestedRole] = useState('')

  // Site PI fields
  const [proposedSiteName, setProposedSiteName] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!applicantName.trim() || !email.trim()) {
      setError('Please provide your full legal name and email address.')
      return
    }

    if (!declarationAccepted) {
      setError('You must accept the declaration of accuracy and consent to government verification.')
      return
    }

    setIsSubmitting(true)
    try {
      if (activeTab === 'research_pi') {
        if (!organizationName.trim()) {
          setError('Please provide your research sponsor or institution name.')
          setIsSubmitting(false)
          return
        }
        await platformApi.submitResearchPIRequest({
          applicant_name: applicantName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          designation: designation.trim() || 'Principal Investigator',
          organization_name: organizationName.trim(),
          organization_type: organizationType,
          requested_role: requestedRole.trim() || 'Principal Investigator',
          qualifications: qualifications.trim() || null,
          declaration_accepted: true,
          country: country.trim() || null,
          state: state.trim() || null,
          city: city.trim() || null,
        })
      } else if (activeTab === 'cro_staff') {
        if (!organizationName.trim()) {
          setError('Please provide your CRO company name.')
          setIsSubmitting(false)
          return
        }
        await platformApi.submitCROStaffRequest({
          applicant_name: applicantName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          designation: designation.trim() || 'Clinical Research Associate',
          organization_name: organizationName.trim(),
          organization_type: 'cro',
          requested_role: requestedRole.trim() || 'Clinical Research Associate',
          qualifications: qualifications.trim() || null,
          declaration_accepted: true,
          country: country.trim() || null,
          state: state.trim() || null,
          city: city.trim() || null,
        })
      } else {
        // Site PI
        const siteInstName = organizationName.trim() || 'Clinical Site Institution'
        await platformApi.submitSitePIRequest({
          applicant_name: applicantName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          designation: designation.trim() || 'Site Principal Investigator',
          organization_name: siteInstName,
          organization_type: 'institution',
          requested_role: 'Site Principal Investigator',
          proposed_site_name: proposedSiteName.trim() || siteInstName,
          qualifications: qualifications.trim() || null,
          declaration_accepted: true,
          country: country.trim() || null,
          state: state.trim() || null,
          city: city.trim() || null,
        })
      }
      setIsSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to submit onboarding request. Please verify inputs and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#7A2A12] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xs bg-[#7A2A12] border border-[#B8862E]/40 shadow-sm mb-3">
          <span className="font-serif font-bold text-white text-2xl tracking-wider">A</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1C1A17]">
          AyuCTMS Access & Verification Request
        </h1>
        <p className="mt-1 text-sm text-[#726B5C]">
          All India Institute of Ayurveda — Government-Governed Clinical Trial Platform
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        {/* Entry Point Selector Tabs */}
        {!isSuccess && (
          <div className="flex border-b border-[#E4DED3] bg-white rounded-t-xs px-2 pt-2 gap-2 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('research_pi')
                setDesignation('Principal Investigator')
                setRequestedRole('Principal Investigator')
                setError(null)
              }}
              className={`flex-1 py-3 px-4 text-sm font-semibold border-b-2 text-center transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'research_pi'
                  ? 'border-[#7A2A12] text-[#7A2A12] bg-[#F8F6F2]/60'
                  : 'border-transparent text-[#726B5C] hover:text-[#1C1A17]'
              }`}
            >
              <Icon name="document" size="sm" />
              <span>Research PI (Sponsor)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('cro_staff')
                setDesignation('Clinical Research Associate')
                setRequestedRole('Clinical Research Associate')
                setError(null)
              }}
              className={`flex-1 py-3 px-4 text-sm font-semibold border-b-2 text-center transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'cro_staff'
                  ? 'border-[#7A2A12] text-[#7A2A12] bg-[#F8F6F2]/60'
                  : 'border-transparent text-[#726B5C] hover:text-[#1C1A17]'
              }`}
            >
              <Icon name="users" size="sm" />
              <span>CRO Staff</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('site_pi')
                setDesignation('Site Principal Investigator')
                setRequestedRole('Site Principal Investigator')
                setError(null)
              }}
              className={`flex-1 py-3 px-4 text-sm font-semibold border-b-2 text-center transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'site_pi'
                  ? 'border-[#7A2A12] text-[#7A2A12] bg-[#F8F6F2]/60'
                  : 'border-transparent text-[#726B5C] hover:text-[#1C1A17]'
              }`}
            >
              <Icon name="activity" size="sm" />
              <span>Site PI (Clinical Site)</span>
            </button>
          </div>
        )}

        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-[#E4DED3] rounded-b-xs">
          {isSuccess ? (
            <div className="text-center space-y-5 py-4">
              <div className="w-14 h-14 rounded-full bg-[#1F5C3F]/10 text-[#1F5C3F] flex items-center justify-center mx-auto">
                <Icon name="check" size="lg" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-bold text-[#1C1A17]">
                  Verification Request Submitted
                </h2>
                <p className="text-sm text-[#726B5C] max-w-lg mx-auto">
                  Thank you, <strong className="text-[#1C1A17]">{applicantName}</strong>. Your{' '}
                  <span className="font-semibold text-[#7A2A12]">
                    {activeTab === 'research_pi' ? 'Research PI' : activeTab === 'cro_staff' ? 'CRO Staff' : 'Site PI'}
                  </span>{' '}
                  application has entered the Government Verification Team review queue.
                </p>
              </div>

              <div className="bg-[#F8F6F2] border border-[#E4DED3] p-4 rounded-xs text-left text-xs text-[#726B5C] space-y-2">
                <p className="font-semibold text-[#1C1A17] flex items-center gap-1.5">
                  <Icon name="info" size="sm" className="text-[#B8862E]" />
                  What happens next?
                </p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Government Verification Team reviews your identity, credentials, and institutional affiliation.</li>
                  <li>Upon approval, a secure, single-use activation email will be dispatched to <strong className="text-[#1C1A17]">{email}</strong>.</li>
                  <li>You will follow the link to establish your account password and access your role-scoped dashboard.</li>
                </ol>
              </div>

              <div className="pt-4">
                <Link to="/login">
                  <Button variant="primary">Return to Sign In</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <Alert variant="danger" title="Submission Error" description={error} />}

              {/* Tab Header Banner */}
              <div className="bg-[#F8F6F2] border border-[#E4DED3] p-3 rounded-xs text-xs text-[#726B5C]">
                {activeTab === 'research_pi' && (
                  <p>
                    <strong>Research PI Entry Point:</strong> For clinical trial lead researchers and sponsor representatives managing investigational protocols.
                  </p>
                )}
                {activeTab === 'cro_staff' && (
                  <p>
                    <strong>CRO Staff Entry Point:</strong> For clinical operations associates, project managers, and monitoring personnel seeking scoped study access.
                  </p>
                )}
                {activeTab === 'site_pi' && (
                  <p>
                    <strong>Site PI Entry Point:</strong> For clinical trial site principal investigators and institutional trial units evaluating incoming study participation requests.
                  </p>
                )}
              </div>

              <div className="border-b border-[#E4DED3] pb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7A2A12] mb-3">
                  1. Applicant Identity & Contact
                </h3>
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                      Full Legal Name <span className="text-[#9B2C2C]">*</span>
                    </label>
                    <Input
                      name="applicantName"
                      required
                      placeholder="e.g. Dr. Vaidya Rajesh Varma"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                      Official Email Address <span className="text-[#9B2C2C]">*</span>
                    </label>
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="name@institution.gov.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                      Mobile Contact Number
                    </label>
                    <Input
                      name="phone"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                      Professional Designation
                    </label>
                    <Input
                      name="designation"
                      placeholder="e.g. Professor & Head of Clinical Research"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                      Qualifications & GCP Credentials
                    </label>
                    <Input
                      name="qualifications"
                      placeholder="e.g. MD (Ayu), GCP Certified 2026"
                      value={qualifications}
                      onChange={(e) => setQualifications(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="border-b border-[#E4DED3] pb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7A2A12] mb-3">
                  2. Institutional & Organizational Scope
                </h3>
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                  {activeTab !== 'site_pi' ? (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                          Organization / Company Name <span className="text-[#9B2C2C]">*</span>
                        </label>
                        <Input
                          name="organizationName"
                          required
                          placeholder="e.g. Central Council for Research in Ayurvedic Sciences"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                          Organization Type
                        </label>
                        <Select
                          name="organizationType"
                          value={organizationType}
                          onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}
                          options={[
                            { label: 'Sponsor (Biopharma / Research Institute)', value: 'sponsor' },
                            { label: 'Contract Research Organization (CRO)', value: 'cro' },
                            { label: 'Institutional Body', value: 'institution' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                          Requested Role / Job Function
                        </label>
                        <Input
                          name="requestedRole"
                          placeholder="e.g. Principal Investigator, Lead CRA"
                          value={requestedRole}
                          onChange={(e) => setRequestedRole(e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                          Clinical Site / Hospital Institution <span className="text-[#9B2C2C]">*</span>
                        </label>
                        <Input
                          name="organizationName"
                          required
                          placeholder="e.g. All India Institute of Ayurveda Hospital"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                          Clinical Trial Department / Unit
                        </label>
                        <Input
                          name="proposedSiteName"
                          placeholder="e.g. Kayachikitsa Clinical Research Unit 3"
                          value={proposedSiteName}
                          onChange={(e) => setProposedSiteName(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                      City
                    </label>
                    <Input
                      name="city"
                      placeholder="e.g. New Delhi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                      State / Province
                    </label>
                    <Input
                      name="state"
                      placeholder="e.g. Delhi"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7A2A12] mb-3">
                  3. Declarations & Verification Consent
                </h3>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#1C1A17]">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => setDeclarationAccepted(e.target.checked)}
                    className="mt-0.5 rounded-xs border-[#E4DED3] text-[#7A2A12] focus:ring-[#7A2A12]"
                  />
                  <span>
                    I hereby certify that all information submitted is accurate and verifiable. I consent to background review and credential verification by the AyuCTMS Government Verification Team.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link to="/login" className="text-xs text-[#726B5C] hover:text-[#7A2A12] flex items-center gap-1">
                  <Icon name="arrowRight" size="xs" className="rotate-180" />
                  Back to Sign In
                </Link>

                <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
                  Submit Application for Government Review
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
export default RequestAccessPage
