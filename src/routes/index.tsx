import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardOverviewPage } from '../pages/DashboardOverviewPage';
import { ParticipantManagementPage } from '../pages/ParticipantManagementPage';
import { ParticipantDetailPage } from '../pages/ParticipantDetailPage';
import { VisitsManagementPage } from '../pages/VisitsManagementPage';
import { VisitDetailPage } from '../pages/VisitDetailPage';
import { SafetyManagementPage } from '../pages/SafetyManagementPage';
import { SafetyEventDetailPage } from '../pages/SafetyEventDetailPage';
import { ComplianceManagementPage } from '../pages/ComplianceManagementPage';
import { ComplianceDeviationDetailPage } from '../pages/ComplianceDeviationDetailPage';
import { ModulePlaceholderPage } from '../pages/ModulePlaceholderPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/pi/dashboard" replace />} />
      <Route path="/pi" element={<Navigate to="/pi/dashboard" replace />} />

      {/* PI Operations Overview (Segment A Core Target) */}
      <Route
        path="/pi/dashboard"
        element={
          <AppShell pageTitle="PI Operations Overview">
            <DashboardOverviewPage />
          </AppShell>
        }
      />

      {/* Participant Management (Segment B Core Target) */}
      <Route
        path="/pi/patients"
        element={
          <AppShell pageTitle="Participant Management">
            <ParticipantManagementPage />
          </AppShell>
        }
      />

      {/* Participant Detail View (Segment B) */}
      <Route
        path="/pi/patients/:participantId"
        element={
          <AppShell pageTitle="Participant Detail">
            <ParticipantDetailPage />
          </AppShell>
        }
      />

      {/* Visits & Clinical Activities (Segment C Core Target) */}
      <Route
        path="/pi/visits"
        element={
          <AppShell pageTitle="Visits & Clinical Activities">
            <VisitsManagementPage />
          </AppShell>
        }
      />

      {/* Visit Detail & Procedure Checklist View (Segment C) */}
      <Route
        path="/pi/visits/:visitId"
        element={
          <AppShell pageTitle="Visit Detail & Procedures">
            <VisitDetailPage />
          </AppShell>
        }
      />

      {/* Safety & Pharmacovigilance (Segment D Core Target) */}
      <Route
        path="/pi/safety"
        element={
          <AppShell pageTitle="Trial Safety Vigilance">
            <SafetyManagementPage />
          </AppShell>
        }
      />

      {/* Safety Event Detail & Review View (Segment D) */}
      <Route
        path="/pi/safety/:eventId"
        element={
          <AppShell pageTitle="Safety Event Detail">
            <SafetyEventDetailPage />
          </AppShell>
        }
      />

      {/* Protocol Compliance & Deviations (Segment E Core Target) */}
      <Route
        path="/pi/compliance"
        element={
          <AppShell pageTitle="Protocol Compliance & Deviations">
            <ComplianceManagementPage />
          </AppShell>
        }
      />

      {/* Protocol Deviation Detail View (Segment E) */}
      <Route
        path="/pi/compliance/:deviationId"
        element={
          <AppShell pageTitle="Protocol Deviation Detail">
            <ComplianceDeviationDetailPage />
          </AppShell>
        }
      />

      <Route
        path="/pi/team"
        element={
          <AppShell pageTitle="Site Team & Custom Roles">
            <ModulePlaceholderPage
              moduleName="Site Team & Role Architecture"
              plannedSegment="Segment F"
              description="Delegation of authority log, role assignments, custom role builder with granular permissions, and access scoping."
              capabilities={[
                'Pre-defined clinical role templates (PI, Sub-I, CRC, Nurse, Pharmacist, Lab)',
                'Custom Role Builder with granular permission toggles',
                'Permission Scope separation (Assigned Site vs Assigned Participants)',
                'Delegation of Authority (DoA) log with digital sign-off',
              ]}
            />
          </AppShell>
        }
      />

      <Route
        path="/pi/tasks"
        element={
          <AppShell pageTitle="Task Management">
            <ModulePlaceholderPage
              moduleName="Task Management & Approvals"
              plannedSegment="Segment G"
              description="Structured task lifecycle management across site staff with full multi-step review and approval workflows."
              capabilities={[
                'Task lifecycle: Draft → Assigned → In Progress → Submitted → Under Review → Approved → Completed',
                'Rejection / Revision required loop',
                'Multi-user task assignment',
                'Dynamic approver assignment (role-based, not hardcoded)',
              ]}
            />
          </AppShell>
        }
      />

      <Route
        path="/pi/documents"
        element={
          <AppShell pageTitle="Study & Site Documents">
            <ModulePlaceholderPage
              moduleName="Document Management"
              plannedSegment="Segment H"
              description="Regulatory binder documents, investigator brochures, protocol versions, site certifications, and expiry monitoring."
              capabilities={[
                'Document versioning and change tracking',
                'Review and sign-off workflows',
                'Expiry alerts (e.g. CVs, GCP certificates, lab certifications)',
                'Structured metadata and audit trail',
              ]}
            />
          </AppShell>
        }
      />

      <Route
        path="/pi/reports"
        element={
          <AppShell pageTitle="Reports & Analytics">
            <ModulePlaceholderPage
              moduleName="Reports & Regulatory Exports"
              plannedSegment="Segment I"
              description="Operational reporting for recruitment velocity, safety summaries, protocol deviations, and monitor review packages."
              capabilities={[
                'Recruitment velocity and screen failure analysis',
                'Site performance metrics',
                'Safety DSMB / IRB summary exports',
                'Data export (CSV / PDF structured summaries)',
              ]}
            />
          </AppShell>
        }
      />

      <Route
        path="/pi/settings"
        element={
          <AppShell pageTitle="Site Settings">
            <ModulePlaceholderPage
              moduleName="Site & Preferences Settings"
              plannedSegment="Settings"
              description="Site facility details, notification preferences, and investigator defaults."
              capabilities={[
                'Contact information and facility details',
                'Notification threshold configuration',
                'Timezone and regional formats',
              ]}
            />
          </AppShell>
        }
      />

      {/* Fallback to Overview */}
      <Route path="*" element={<Navigate to="/pi/dashboard" replace />} />
    </Routes>
  );
};
