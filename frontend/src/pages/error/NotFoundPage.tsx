import React from 'react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/layout'
import { Button } from '@/components/primitives/Button'
import { Icon } from '@/components/primitives/Icon'

export const NotFoundPage: React.FC = () => {
  return (
    <PageContainer maxWidth="md" className="py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-[#F8F6F2] border border-[#E4DED3] flex items-center justify-center text-[#7A2A12] mx-auto mb-4 shadow-xs">
        <Icon name="help" size="lg" />
      </div>
      <h1 className="font-serif text-3xl font-bold text-[#1C1A17] mb-2">404 — Page Not Found</h1>
      <p className="text-xs text-[#5A5347] max-w-sm mx-auto mb-6 leading-relaxed">
        The requested clinical trial resource, protocol file, or view does not exist in the AyuCTMS registry.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" size="sm" leftIcon={<Icon name="dashboard" size="xs" />}>
          Return to Portfolio Dashboard
        </Button>
      </Link>
    </PageContainer>
  )
}
