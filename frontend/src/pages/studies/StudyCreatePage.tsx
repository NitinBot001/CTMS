import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { studiesApi } from '@/api/studies.api'
import { organizationsApi } from '@/api/organizations.api'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/data-display/Card'
import { Input, TextArea } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Button } from '@/components/primitives/Button'
import { useToast } from '@/app/providers'
import type { StudyCreate, StudyType, StudyPhase, BlindingType } from '@/types/api'

export const StudyCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  // Fetch Sponsors & CROs for assignment
  const sponsorsQuery = useQuery({
    queryKey: ['organizations', 'sponsors'],
    queryFn: () => organizationsApi.list({ org_type: 'sponsor' }),
  })

  const crosQuery = useQuery({
    queryKey: ['organizations', 'cros'],
    queryFn: () => organizationsApi.list({ org_type: 'cro' }),
  })

  const [formData, setFormData] = useState<StudyCreate>({
    study_code: '',
    protocol_number: '',
    title: '',
    short_title: '',
    study_type: 'interventional' as StudyType,
    phase: 'phase_2' as StudyPhase,
    sponsor_org_id: '',
    cro_org_id: null,
    therapeutic_area: '',
    study_design: 'Randomized, Double-Blind, Parallel-Group, Placebo-Controlled',
    blinding: 'double_blind' as BlindingType,
    randomization: true,
    planned_sample_size: 100,
    start_date: null,
    end_date: null,
    recruitment_start_date: null,
    recruitment_end_date: null,
    ctri_number: null,
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.sponsor_org_id) {
      toast.error('Missing Sponsor', 'Please select an authorized clinical sponsor organization.')
      return
    }

    setLoading(true)
    try {
      const created = await studiesApi.create({
        ...formData,
        planned_sample_size: formData.planned_sample_size ? Number(formData.planned_sample_size) : null,
      })
      toast.success('Study Initiated', `Protocol ${created.protocol_number} registered successfully.`)
      navigate(`/studies/${created.id}`)
    } catch (err: unknown) {
      toast.error('Failed to Create Study', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const sponsors = sponsorsQuery.data || []
  const cros = crosQuery.data || []

  return (
    <PageContainer maxWidth="xl">
      <PageHeader
        title="Initiate Clinical Study"
        subtitle="Register a new clinical trial protocol under institutional and regulatory governance"
        breadcrumbs={[
          { label: 'Studies', href: '/studies' },
          { label: 'New Protocol' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Protocol Identifiers */}
        <Card className="p-5 bg-white border border-[#E4DED3]">
          <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
            1. Protocol Identification &amp; Design
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Protocol Number *
              </label>
              <Input
                required
                placeholder="e.g. AIIA-CT-2026-004"
                value={formData.protocol_number}
                onChange={(e) => setFormData({ ...formData, protocol_number: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Study Code *
              </label>
              <Input
                required
                placeholder="e.g. AYU-DIAB-02"
                value={formData.study_code}
                onChange={(e) => setFormData({ ...formData, study_code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Official Clinical Trial Title *
              </label>
              <Input
                required
                placeholder="Full scientific protocol title..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Short / Public Title
              </label>
              <Input
                placeholder="Brief recognizable title..."
                value={formData.short_title || ''}
                onChange={(e) => setFormData({ ...formData, short_title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Therapeutic Area *
              </label>
              <Input
                required
                placeholder="e.g. Ayurveda / Metabolic Disorders / Type 2 Diabetes"
                value={formData.therapeutic_area}
                onChange={(e) => setFormData({ ...formData, therapeutic_area: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Clinical Classification */}
        <Card className="p-5 bg-white border border-[#E4DED3]">
          <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
            2. Phase &amp; Governance Structure
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Study Type *
              </label>
              <Select
                required
                value={formData.study_type}
                onChange={(e) => setFormData({ ...formData, study_type: e.target.value as StudyType })}
                options={[
                  { value: 'interventional', label: 'Interventional Trial' },
                  { value: 'observational', label: 'Observational Study' },
                  { value: 'expanded_access', label: 'Expanded Access' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Clinical Phase *
              </label>
              <Select
                required
                value={formData.phase}
                onChange={(e) => setFormData({ ...formData, phase: e.target.value as StudyPhase })}
                options={[
                  { value: 'phase_1', label: 'Phase I' },
                  { value: 'phase_1_2', label: 'Phase I/II' },
                  { value: 'phase_2', label: 'Phase II' },
                  { value: 'phase_2_3', label: 'Phase II/III' },
                  { value: 'phase_3', label: 'Phase III' },
                  { value: 'phase_3_4', label: 'Phase III/IV' },
                  { value: 'phase_4', label: 'Phase IV (Post-Marketing)' },
                  { value: 'na', label: 'Not Applicable' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Blinding Scheme
              </label>
              <Select
                value={formData.blinding || ''}
                onChange={(e) => setFormData({ ...formData, blinding: (e.target.value || null) as BlindingType | null })}
                options={[
                  { value: 'double_blind', label: 'Double Blind' },
                  { value: 'single_blind', label: 'Single Blind' },
                  { value: 'open_label', label: 'Open Label' },
                  { value: 'triple_blind', label: 'Triple Blind' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Clinical Sponsor Organization *
              </label>
              <Select
                required
                value={formData.sponsor_org_id}
                onChange={(e) => setFormData({ ...formData, sponsor_org_id: e.target.value })}
                options={[
                  { value: '', label: 'Select Clinical Sponsor...' },
                  ...sponsors.map((s) => ({ value: s.id, label: `${s.name} (${s.registration_number || s.id.slice(0, 6)})` })),
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Managing CRO (Optional)
              </label>
              <Select
                value={formData.cro_org_id || ''}
                onChange={(e) => setFormData({ ...formData, cro_org_id: e.target.value || null })}
                options={[
                  { value: '', label: 'None (Direct Sponsor Managed)' },
                  ...cros.map((c) => ({ value: c.id, label: `${c.name} (${c.registration_number || c.id.slice(0, 6)})` })),
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Target Planned Cohort Size
              </label>
              <Input
                type="number"
                min={1}
                placeholder="100"
                value={formData.planned_sample_size || ''}
                onChange={(e) => setFormData({ ...formData, planned_sample_size: Number(e.target.value) })}
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Regulatory & Schedule */}
        <Card className="p-5 bg-white border border-[#E4DED3]">
          <h3 className="font-serif text-sm font-bold text-[#1C1A17] mb-3 pb-2 border-b border-[#E4DED3]">
            3. Regulatory Registration &amp; Timelines
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                CTRI Registration Number
              </label>
              <Input
                placeholder="e.g. CTRI/2026/04/005123"
                value={formData.ctri_number || ''}
                onChange={(e) => setFormData({ ...formData, ctri_number: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Study Design Details
              </label>
              <Input
                placeholder="Parallel design, 1:1 allocation..."
                value={formData.study_design || ''}
                onChange={(e) => setFormData({ ...formData, study_design: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Planned Start Date
              </label>
              <Input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value || null })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Target Completion Date
              </label>
              <Input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Protocol Scientific Description / Endpoints
              </label>
              <TextArea
                rows={3}
                placeholder="Brief summary of primary and secondary clinical endpoints..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/studies">
            <Button variant="outline" size="sm" type="button" disabled={loading}>
              Cancel
            </Button>
          </Link>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            Register Clinical Protocol
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
