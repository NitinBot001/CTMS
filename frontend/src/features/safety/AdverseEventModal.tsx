import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/overlays/Dialog'
import { Input, TextArea } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Button } from '@/components/primitives/Button'
import { safetyApi } from '@/api/safety.api'
import { studiesApi } from '@/api/studies.api'
import { participantsApi } from '@/api/participants.api'
import { useToast } from '@/app/providers'
import type { AdverseEventCreate, AdverseEventType, Seriousness, Severity } from '@/types/api'

export interface AdverseEventModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const AdverseEventModal: React.FC<AdverseEventModalProps> = ({
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

  const [formData, setFormData] = useState<AdverseEventCreate>(() => ({
    study_id: '',
    participant_id: '',
    event_type: 'ae' as AdverseEventType,
    description: '',
    onset_date: new Date().toISOString().slice(0, 10),
    seriousness: 'non_serious' as Seriousness,
    severity: 'mild' as Severity,
    action_taken: 'None',
  }))

  // Fetch participants for selected study
  const participantsQuery = useQuery({
    queryKey: ['participants', formData.study_id],
    queryFn: () => participantsApi.list({ study_id: formData.study_id }),
    enabled: !!formData.study_id,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.study_id || !formData.participant_id) {
      toast.error('Validation Error', 'Please select both study protocol and participant.')
      return
    }

    setLoading(true)
    try {
      await safetyApi.create(formData)
      toast.success('Adverse Event Logged', 'Event recorded and added to pharmacovigilance oversight.')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error('Failed to Log Event', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const studies = studiesQuery.data || []
  const participants = participantsQuery.data || []

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader
        title="Report Clinical Adverse Event"
        description="Log an adverse event (AE), serious adverse event (SAE), or SUSAR under GCP safety rules."
      />
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Clinical Protocol *
              </label>
              <Select
                required
                value={formData.study_id}
                onChange={(e) =>
                  setFormData({ ...formData, study_id: e.target.value, participant_id: '' })
                }
                options={[
                  { value: '', label: 'Select Trial Protocol...' },
                  ...studies.map((s) => ({ value: s.id, label: `${s.protocol_number} - ${s.title}` })),
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Subject Code *
              </label>
              <Select
                required
                disabled={!formData.study_id}
                value={formData.participant_id}
                onChange={(e) => setFormData({ ...formData, participant_id: e.target.value })}
                options={[
                  { value: '', label: formData.study_id ? 'Select Subject...' : 'Select Protocol First' },
                  ...participants.map((p) => ({ value: p.id, label: p.participant_code })),
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Event Classification *
              </label>
              <Select
                required
                value={formData.event_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    event_type: e.target.value as AdverseEventType,
                    seriousness: e.target.value === 'sae' || e.target.value === 'susar' ? 'serious' : 'non_serious',
                  })
                }
                options={[
                  { value: 'ae', label: 'Adverse Event (AE)' },
                  { value: 'sae', label: 'Serious Adverse Event (SAE)' },
                  { value: 'susar', label: 'Suspected Unexpected SAE (SUSAR)' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Seriousness *
              </label>
              <Select
                required
                value={formData.seriousness}
                onChange={(e) =>
                  setFormData({ ...formData, seriousness: e.target.value as Seriousness })
                }
                options={[
                  { value: 'non_serious', label: 'Non-Serious' },
                  { value: 'serious', label: 'Serious (SAE)' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                CTCAE Severity *
              </label>
              <Select
                required
                value={formData.severity}
                onChange={(e) =>
                  setFormData({ ...formData, severity: e.target.value as Severity })
                }
                options={[
                  { value: 'mild', label: 'Grade 1 - Mild' },
                  { value: 'moderate', label: 'Grade 2 - Moderate' },
                  { value: 'severe', label: 'Grade 3 - Severe' },
                  { value: 'life_threatening', label: 'Grade 4 - Life-Threatening' },
                  { value: 'fatal', label: 'Grade 5 - Fatal' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Onset Date *
              </label>
              <Input
                type="date"
                required
                value={formData.onset_date}
                onChange={(e) => setFormData({ ...formData, onset_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Action Taken
              </label>
              <Input
                placeholder="e.g. Dose interrupted, hospitalization, symptom treatment..."
                value={formData.action_taken || ''}
                onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
              Event Medical Description &amp; Symptoms *
            </label>
            <TextArea
              required
              rows={3}
              placeholder="Clinical narrative describing sign, symptom, or laboratory finding..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            Record Adverse Event
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
