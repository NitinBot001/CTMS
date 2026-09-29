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
import { TeamManagementPage } from '../pages/TeamManagementPage';
import { TeamMemberDetailPage } from '../pages/TeamMemberDetailPage';
import { RoleManagementPage } from '../pages/RoleManagementPage';
import { RoleDetailPage } from '../pages/RoleDetailPage';
import { TaskManagementPage } from '../pages/TaskManagementPage';
import { TaskDetailPage } from '../pages/TaskDetailPage';
import { DocumentManagementPage } from '../pages/DocumentManagementPage';
import { DocumentDetailPage } from '../pages/DocumentDetailPage';
import { ReportsDirectoryPage } from '../pages/ReportsDirectoryPage';
import { ReportDetailPage } from '../pages/ReportDetailPage';
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

      {/* Site Team & Custom Roles (Segment F Core Target) */}
      <Route
        path="/pi/team"
        element={
          <AppShell pageTitle="Site Team Directory">
            <TeamManagementPage />
          </AppShell>
        }
      />

      {/* Role Management Directory (Segment F) */}
      <Route
        path="/pi/team/roles"
        element={
          <AppShell pageTitle="Roles & Permission Catalog">
            <RoleManagementPage />
          </AppShell>
        }
      />

      {/* Role Detail & Matrix Editor (Segment F) */}
      <Route
        path="/pi/team/roles/:roleId"
        element={
          <AppShell pageTitle="Role Detail & Permissions">
            <RoleDetailPage />
          </AppShell>
        }
      />

      {/* Team Member Detail View (Segment F) */}
      <Route
        path="/pi/team/:userId"
        element={
          <AppShell pageTitle="Team Member Profile & Scoped Delegations">
            <TeamMemberDetailPage />
          </AppShell>
        }
      />

      {/* Task Management & Approvals (Segment G Core Target) */}
      <Route
        path="/pi/tasks"
        element={
          <AppShell pageTitle="Task Management & Approvals">
            <TaskManagementPage />
          </AppShell>
        }
      />

      {/* Task Detail View (Segment G) */}
      <Route
        path="/pi/tasks/:taskId"
        element={
          <AppShell pageTitle="Task Detail & Approvals">
            <TaskDetailPage />
          </AppShell>
        }
      />

      {/* Document Management & Expiry Tracking (Segment H Core Target) */}
      <Route
        path="/pi/documents"
        element={
          <AppShell pageTitle="Study & Site Documents">
            <DocumentManagementPage />
          </AppShell>
        }
      />

      {/* Document Detail & Version History View (Segment H) */}
      <Route
        path="/pi/documents/:documentId"
        element={
          <AppShell pageTitle="Document Detail & Versions">
            <DocumentDetailPage />
          </AppShell>
        }
      />

      {/* Reports Directory (Segment I) */}
      <Route
        path="/pi/reports"
        element={
          <AppShell pageTitle="Reports & Analytics">
            <ReportsDirectoryPage />
          </AppShell>
        }
      />

      {/* Report Detail & Local Export View (Segment I) */}
      <Route
        path="/pi/reports/:reportType"
        element={
          <AppShell pageTitle="Operational Report View">
            <ReportDetailPage />
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
