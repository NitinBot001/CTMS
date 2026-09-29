import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useAuth } from '../context/AuthContext';
import { RequireAuth } from '../components/auth/RequireAuth';
import { RequirePermission } from '../components/auth/RequirePermission';

// Pages
import { LoginPage } from '../pages/LoginPage';
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
import { NotificationsActionCenterPage } from '../pages/NotificationsActionCenterPage';
import { ModulePlaceholderPage } from '../pages/ModulePlaceholderPage';

// Role Dashboards
import { SubInvestigatorDashboardPage } from '../pages/dashboards/SubInvestigatorDashboardPage';
import { CrcDashboardPage } from '../pages/dashboards/CrcDashboardPage';
import { StudyNurseDashboardPage } from '../pages/dashboards/StudyNurseDashboardPage';
import { StudyPharmacistDashboardPage } from '../pages/dashboards/StudyPharmacistDashboardPage';
import { DataEntryDashboardPage } from '../pages/dashboards/DataEntryDashboardPage';

/**
 * Root redirect handler:
 * Directs unauthenticated users to /login, and authenticated users to their
 * role-specific landing dashboard.
 */
const RootRedirect: React.FC = () => {
  const { isAuthenticated, roleLandingRoute, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={roleLandingRoute || '/pi/dashboard'} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root Navigation Resolution */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/pi" element={<RootRedirect />} />

      {/* Role-Specific Portal Dashboards */}
      <Route
        path="/sub-investigator"
        element={
          <RequireAuth>
            <AppShell pageTitle="Sub-Investigator Clinical Desk">
              <SubInvestigatorDashboardPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/crc"
        element={
          <RequireAuth>
            <AppShell pageTitle="Clinical Research Coordinator Desk">
              <CrcDashboardPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/study-nurse"
        element={
          <RequireAuth>
            <AppShell pageTitle="Study Nurse Clinical Station">
              <StudyNurseDashboardPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/pharmacist"
        element={
          <RequireAuth>
            <AppShell pageTitle="Investigational Product Dispensary">
              <StudyPharmacistDashboardPage />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/data-entry"
        element={
          <RequireAuth>
            <AppShell pageTitle="eCRF Data Entry Station">
              <DataEntryDashboardPage />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* PI Operations Overview (Segment A Core Target) */}
      <Route
        path="/pi/dashboard"
        element={
          <RequireAuth>
            <AppShell pageTitle="PI Operations Overview">
              <DashboardOverviewPage />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* Participant Management (Segment B Core Target) */}
      <Route
        path="/pi/patients"
        element={
          <RequireAuth>
            <RequirePermission permission="PARTICIPANTS_VIEW">
              <AppShell pageTitle="Participant Management">
                <ParticipantManagementPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Participant Detail View (Segment B) */}
      <Route
        path="/pi/patients/:participantId"
        element={
          <RequireAuth>
            <RequirePermission permission="PARTICIPANTS_VIEW">
              <AppShell pageTitle="Participant Detail">
                <ParticipantDetailPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Visits & Clinical Activities (Segment C Core Target) */}
      <Route
        path="/pi/visits"
        element={
          <RequireAuth>
            <RequirePermission permission="VISITS_VIEW">
              <AppShell pageTitle="Visits & Clinical Activities">
                <VisitsManagementPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Visit Detail & Procedure Checklist View (Segment C) */}
      <Route
        path="/pi/visits/:visitId"
        element={
          <RequireAuth>
            <RequirePermission permission="VISITS_VIEW">
              <AppShell pageTitle="Visit Detail & Procedures">
                <VisitDetailPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Safety & Pharmacovigilance (Segment D Core Target) */}
      <Route
        path="/pi/safety"
        element={
          <RequireAuth>
            <RequirePermission permission="SAFETY_VIEW">
              <AppShell pageTitle="Trial Safety Vigilance">
                <SafetyManagementPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Safety Event Detail & Review View (Segment D) */}
      <Route
        path="/pi/safety/:eventId"
        element={
          <RequireAuth>
            <RequirePermission permission="SAFETY_VIEW">
              <AppShell pageTitle="Safety Event Detail">
                <SafetyEventDetailPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Protocol Compliance & Deviations (Segment E Core Target) */}
      <Route
        path="/pi/compliance"
        element={
          <RequireAuth>
            <RequirePermission permission="COMPLIANCE_VIEW">
              <AppShell pageTitle="Protocol Compliance & Deviations">
                <ComplianceManagementPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Protocol Deviation Detail View (Segment E) */}
      <Route
        path="/pi/compliance/:deviationId"
        element={
          <RequireAuth>
            <RequirePermission permission="COMPLIANCE_VIEW">
              <AppShell pageTitle="Protocol Deviation Detail">
                <ComplianceDeviationDetailPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Site Team & Custom Roles (Segment F Core Target) */}
      <Route
        path="/pi/team"
        element={
          <RequireAuth>
            <RequirePermission permission="TEAM_VIEW">
              <AppShell pageTitle="Site Team Directory">
                <TeamManagementPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Role Management Directory (Segment F) */}
      <Route
        path="/pi/team/roles"
        element={
          <RequireAuth>
            <RequirePermission permission="TEAM_VIEW">
              <AppShell pageTitle="Roles & Permission Catalog">
                <RoleManagementPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Role Detail & Matrix Editor (Segment F) */}
      <Route
        path="/pi/team/roles/:roleId"
        element={
          <RequireAuth>
            <RequirePermission permission="TEAM_VIEW">
              <AppShell pageTitle="Role Detail & Permissions">
                <RoleDetailPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Team Member Detail View (Segment F) */}
      <Route
        path="/pi/team/:userId"
        element={
          <RequireAuth>
            <RequirePermission permission="TEAM_VIEW">
              <AppShell pageTitle="Team Member Profile & Scoped Delegations">
                <TeamMemberDetailPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Task Management & Approvals (Segment G Core Target) */}
      <Route
        path="/pi/tasks"
        element={
          <RequireAuth>
            <RequirePermission permission="TASKS_VIEW">
              <AppShell pageTitle="Task Management & Approvals">
                <TaskManagementPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Task Detail View (Segment G) */}
      <Route
        path="/pi/tasks/:taskId"
        element={
          <RequireAuth>
            <RequirePermission permission="TASKS_VIEW">
              <AppShell pageTitle="Task Detail & Approvals">
                <TaskDetailPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Document Management & Expiry Tracking (Segment H Core Target) */}
      <Route
        path="/pi/documents"
        element={
          <RequireAuth>
            <RequirePermission permission="DOCUMENTS_VIEW">
              <AppShell pageTitle="Study & Site Documents">
                <DocumentManagementPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Document Detail & Version History View (Segment H) */}
      <Route
        path="/pi/documents/:documentId"
        element={
          <RequireAuth>
            <RequirePermission permission="DOCUMENTS_VIEW">
              <AppShell pageTitle="Document Detail & Versions">
                <DocumentDetailPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Reports Directory (Segment I) */}
      <Route
        path="/pi/reports"
        element={
          <RequireAuth>
            <RequirePermission permission="REPORTS_VIEW">
              <AppShell pageTitle="Reports & Analytics">
                <ReportsDirectoryPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Report Detail & Local Export View (Segment I) */}
      <Route
        path="/pi/reports/:reportType"
        element={
          <RequireAuth>
            <RequirePermission permission="REPORTS_VIEW">
              <AppShell pageTitle="Operational Report View">
                <ReportDetailPage />
              </AppShell>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* Notifications & Action Center (Segment J Core Target) */}
      <Route
        path="/pi/notifications"
        element={
          <RequireAuth>
            <AppShell pageTitle="Action Center & Notifications">
              <NotificationsActionCenterPage />
            </AppShell>
          </RequireAuth>
        }
      />

      <Route
        path="/pi/settings"
        element={
          <RequireAuth>
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
          </RequireAuth>
        }
      />

      {/* Fallback to Root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
