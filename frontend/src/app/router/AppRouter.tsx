import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'

// Pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { OrganizationListPage } from '@/pages/organizations/OrganizationListPage'
import { OrganizationDetailPage } from '@/pages/organizations/OrganizationDetailPage'
import { StudyListPage } from '@/pages/studies/StudyListPage'
import { StudyCreatePage } from '@/pages/studies/StudyCreatePage'
import { StudyDetailPage } from '@/pages/studies/StudyDetailPage'
import { SiteListPage } from '@/pages/sites/SiteListPage'
import { SiteDetailPage } from '@/pages/sites/SiteDetailPage'
import { ParticipantListPage } from '@/pages/participants/ParticipantListPage'
import { ParticipantDetailPage } from '@/pages/participants/ParticipantDetailPage'
import { AdverseEventListPage } from '@/pages/safety/AdverseEventListPage'
import { AdverseEventDetailPage } from '@/pages/safety/AdverseEventDetailPage'
import { CompliancePage } from '@/pages/compliance/CompliancePage'
import { DocumentListPage } from '@/pages/documents/DocumentListPage'
import { AuditLogPage } from '@/pages/audit/AuditLogPage'
import { AdminPage } from '@/pages/admin/AdminPage'
import { NotFoundPage } from '@/pages/error/NotFoundPage'

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Organizations */}
            <Route path="/organizations" element={<OrganizationListPage />} />
            <Route path="/organizations/:id" element={<OrganizationDetailPage />} />

            {/* Studies */}
            <Route path="/studies" element={<StudyListPage />} />
            <Route path="/studies/new" element={<StudyCreatePage />} />
            <Route path="/studies/:id" element={<StudyDetailPage />} />

            {/* Sites */}
            <Route path="/sites" element={<SiteListPage />} />
            <Route path="/sites/:id" element={<SiteDetailPage />} />

            {/* Participants */}
            <Route path="/participants" element={<ParticipantListPage />} />
            <Route path="/participants/:id" element={<ParticipantDetailPage />} />

            {/* Safety */}
            <Route path="/safety" element={<AdverseEventListPage />} />
            <Route path="/safety/:id" element={<AdverseEventDetailPage />} />

            {/* Compliance & TMF */}
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/documents" element={<DocumentListPage />} />

            {/* Audit & Administration */}
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/admin" element={<AdminPage />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
