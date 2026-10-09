import React, { useState } from 'react'
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/overlays/Dialog'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Button } from '@/components/primitives/Button'
import { organizationsApi } from '@/api/organizations.api'
import { useToast } from '@/app/providers'
import type { OrganizationType, OrganizationCreate } from '@/types/api'

export interface OrganizationModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export const OrganizationModal: React.FC<OrganizationModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<OrganizationCreate>({
    registration_number: '',
    name: '',
    organization_type: 'sponsor' as OrganizationType,
    email: '',
    phone: '',
    address_line1: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await organizationsApi.create(formData)
      toast.success('Organization Registered', `Successfully created ${formData.name}`)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error('Failed to Register', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader
        title="Register Clinical Organization"
        description="Provision a new institutional Sponsor, CRO, Research Site, or Regulatory entity."
      />
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Registration / Org Code
              </label>
              <Input
                placeholder="e.g. SPON-AIIA-01"
                value={formData.registration_number || ''}
                onChange={(e) =>
                  setFormData({ ...formData, registration_number: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
                Organization Type *
              </label>
              <Select
                required
                value={formData.organization_type}
                onChange={(e) =>
                  setFormData({ ...formData, organization_type: e.target.value as OrganizationType })
                }
                options={[
                  { value: 'sponsor', label: 'Clinical Sponsor' },
                  { value: 'cro', label: 'Contract Research Org (CRO)' },
                  { value: 'institution', label: 'Research Institution / Ethics' },
                  { value: 'site_affiliate', label: 'Trial Site Affiliate' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1A17] mb-1">
              Legal Registered Name *
            </label>
            <Input
              required
              placeholder="e.g. All India Institute of Ayurveda Clinical Research Division"
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
                placeholder="regulatory@org.in"
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
              Registered Address
            </label>
            <Input
              placeholder="Mathura Road, Gautam Puri, Sarita Vihar"
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
              <label className="block text-xs font-semibold text-[#1C1A17] mb-1">PIN / Postal</label>
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
            Create Organization
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
