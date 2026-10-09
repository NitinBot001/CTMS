import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/overlays/Dialog'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Button } from '@/components/primitives/Button'
import { participantsApi } from '@/api/participants.api'
import { studiesApi } from '@/api/studies.api'
import { sitesApi } from '@/api/sites.api'
import { useToast } from '@/app/providers'
import type { ParticipantCreate } from '@/types/api'

export interface ParticipantModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const ParticipantModal: React.FC<ParticipantModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const studiesQuery = useQuery({
    queryKey: ['studies', 'all'],
    queryFn: () => studiesApi.list(),
  })

  const sitesQuery = useQuery({
    queryKey: ['sites', 'all'],
    queryFn: () => sitesApi.list(),
  })

  const [formData, setFormData] = useState<ParticipantCreate>(() => ({
    participant_code: '',
    study_id: '',
    site_id: null,
    screening_date: new Date().toISOString().slice(0, 10),
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.study_id) {
      toast.error('Missing Protocol', 'Please select a clinical study protocol.')
      return
    }

    setLoading(true)
    try {
      await participantsApi.create(formData)
      toast.success('Subject Registered', `Enrolled ${formData.participant_code} into screening`)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error('Registration Failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const studies = studiesQuery.data || []
  const sites = sitesQuery.data || []

  return (
    <Dialog open={open} onClose={onClose} size="md">
      <DialogHeader
        title="Register Trial Participant"
        description="Screen a new patient cohort subject under GCP and ethical consent guidelines."
      />
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
              De-identified Subject Code *
            </label>
            <Input
              required
              placeholder="e.g. SUBJ-001-DEL"
              value={formData.participant_code}
              onChange={(e) =>
                setFormData({ ...formData, participant_code: e.target.value.toUpperCase() })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
              Clinical Protocol *
            </label>
            <Select
              required
              value={formData.study_id}
              onChange={(e) => setFormData({ ...formData, study_id: e.target.value })}
              options={[
                { value: '', label: 'Select Trial Protocol...' },
                ...studies.map((s) => ({ value: s.id, label: `${s.protocol_number} - ${s.title}` })),
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
              Recruiting Research Site
            </label>
            <Select
              value={formData.site_id || ''}
              onChange={(e) => setFormData({ ...formData, site_id: e.target.value || null })}
              options={[
                { value: '', label: 'Select Hospital / Site...' },
                ...sites.map((s) => ({ value: s.id, label: `${s.name} (${s.site_code})` })),
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
              Screening Date
            </label>
            <Input
              type="date"
              value={formData.screening_date || ''}
              onChange={(e) => setFormData({ ...formData, screening_date: e.target.value || null })}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            Register Subject
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
