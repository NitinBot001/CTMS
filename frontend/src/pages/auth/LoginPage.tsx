import React from 'react'
import { LoginForm } from '@/features/auth/LoginForm'
import { Heading } from '@/components/primitives/Typography'
import { Icon } from '@/components/primitives/Icon'

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col justify-center items-center p-4 selection:bg-[#B8862E]/30">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xs bg-[#7A2A12] border-2 border-[#B8862E] shadow-md mb-3">
            <span className="font-serif font-bold text-white text-2xl tracking-wider">A</span>
          </div>
          <Heading level={1} className="font-serif text-2xl font-bold text-[#1C1A17] tracking-tight">
            AyuCTMS
          </Heading>
          <p className="text-xs font-mono uppercase tracking-widest text-[#B8862E] mt-0.5">
            Clinical Trial Management System
          </p>
          <p className="text-xs text-[#5A5347] mt-2">
            All India Institute of Ayurveda &middot; CRO / Sponsor Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#E4DED3] rounded-xs shadow-sm p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-[#E4DED3]">
            <h2 className="font-serif text-base font-bold text-[#1C1A17]">Authorized Sign In</h2>
            <p className="text-xs text-[#726B5C] mt-0.5">
              Enter your verified institutional credentials to continue
            </p>
          </div>

          <LoginForm />

          <div className="mt-5 pt-4 border-t border-[#E4DED3] space-y-2 text-center text-xs">
            <p className="text-[#726B5C]">
              New clinical organization or sponsor?{' '}
              <a href="/request-access" className="font-semibold text-[#7A2A12] hover:underline">
                Request Platform Access
              </a>
            </p>
            <p className="text-[11px] text-[#726B5C]">
              Received an invitation?{' '}
              <a href="/activate" className="font-medium text-[#B8862E] hover:underline">
                Activate Account
              </a>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E4DED3] text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#726B5C]">
              <Icon name="shield" size="xs" className="text-[#1F5C3F]" />
              <span>21 CFR Part 11 &amp; CDSCO Schedule Y Compliant Audit</span>
            </div>
          </div>
        </div>

        {/* Regulatory Footer */}
        <div className="mt-8 text-center text-[11px] text-[#726B5C] space-y-1">
          <p>Restricted access for certified investigators, monitors, and sponsors.</p>
          <p className="font-mono text-[10px]">All access attempts are cryptographically hashed and logged.</p>
        </div>
      </div>
    </div>
  )
}
