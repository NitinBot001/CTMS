import React, { useState } from 'react'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/overlays/Dialog'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Button } from '@/components/primitives/Button'
import { sitesApi } from '@/api/sites.api'
import { useToast } from '@/app/providers'
import type { SiteType, SiteCreate } from '@/types/api'

export interface SiteModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const SiteModal: React.FC<SiteModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<SiteCreate>({
    site_code: '',
    name: '',
    site_type: 'HOSPITAL' as SiteType,
    address_line1: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    phone: '',
    email: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await sitesApi.create(formData)
      toast.success('Site Registered', `Successfully created ${formData.name}`)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error('Failed to Register Site', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader
        title="Register Clinical Research Site"
        description="Provision an accredited hospital or research clinic for clinical trial execution."
      />
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Site Code *
              </label>
              <Input
                required
                placeholder="e.g. SITE-DEL-01"
                value={formData.site_code}
                onChange={(e) => setFormData({ ...formData, site_code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Facility Type *
              </label>
              <Select
                required
                value={formData.site_type}
                onChange={(e) =>
                  setFormData({ ...formData, site_type: e.target.value as SiteType })
                }
                options={[
                  { value: 'HOSPITAL', label: 'Hospital Facility' },
                  { value: 'CLINIC', label: 'Specialized Research Clinic' },
                  { value: 'RESEARCH_INSTITUTE', label: 'Research Institute' },
                  { value: 'ACADEMIC', label: 'Academic Medical Center' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
              Facility / Hospital Name *
            </label>
            <Input
              required
              placeholder="e.g. All India Institute of Ayurveda Main Hospital"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Contact Email
              </label>
              <Input
                type="email"
                placeholder="trials@aiia.gov.in"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Contact Phone
              </label>
              <Input
                placeholder="+91 11 2695 0401"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
              Facility Address
            </label>
            <Input
              placeholder="Mathura Road, Sarita Vihar"
              value={formData.address_line1 || ''}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">City</label>
              <Input
                placeholder="New Delhi"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">State</label>
              <Input
                placeholder="Delhi"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">Postal Code</label>
              <Input
                placeholder="110076"
                value={formData.postal_code || ''}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={loading}>
            Register Site
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
