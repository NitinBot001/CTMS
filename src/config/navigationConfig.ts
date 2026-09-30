import {
  LayoutDashboard,
  BookOpen,
  Users,
  CalendarCheck,
  ClipboardList,
  ShieldAlert,
  FileCheck2,
  UserCheck,
  CheckSquare,
  FileText,
  BarChart3,
  Bell,
  Settings,
} from 'lucide-react';
import { NavigationItem, Permission } from '../types';

/**
 * Base clinical trial management navigation catalog.
 * Visibility of each item is dynamically evaluated against the authenticated user's
 * effective permissions in the active study and site scope.
 */
export const BASE_NAV_ITEMS: NavigationItem[] = [
  {
    name: 'Overview',
    path: '/pi/dashboard',
    icon: LayoutDashboard,
    // Overview path is dynamically updated per role by getRoleNavigationItems()
  },
  {
    name: 'Protocol',
    path: '/pi/protocol',
    icon: BookOpen,
    permission: 'STUDY_VIEW',
  },
  {
    name: 'Patients',
    path: '/pi/patients',
    icon: Users,
    permission: 'PARTICIPANTS_VIEW',
  },
  {
    name: 'Visits & Activities',
    path: '/pi/visits',
    icon: CalendarCheck,
    permission: 'VISITS_VIEW',
  },
  {
    name: 'Assessments',
    path: '/pi/assessments',
    icon: ClipboardList,
    permission: 'VISITS_VIEW',
  },
  {
    name: 'Safety',
    path: '/pi/safety',
    icon: ShieldAlert,
    permission: 'SAFETY_VIEW',
    badge: '1 SAE',
    badgeVariant: 'danger',
  },
  {
    name: 'Compliance',
    path: '/pi/compliance',
    icon: FileCheck2,
    permission: 'COMPLIANCE_VIEW',
  },
  {
    name: 'Team & Roles',
    path: '/pi/team',
    icon: UserCheck,
    permission: 'TEAM_VIEW',
  },
  {
    name: 'Tasks',
    path: '/pi/tasks',
    icon: CheckSquare,
    permission: 'TASKS_VIEW',
    badge: '4',
    badgeVariant: 'warning',
  },
  {
    name: 'Documents',
    path: '/pi/documents',
    icon: FileText,
    permission: 'DOCUMENTS_VIEW',
  },
  {
    name: 'Reports',
    path: '/pi/reports',
    icon: BarChart3,
    permission: 'REPORTS_VIEW',
  },
  {
    name: 'Notifications',
    path: '/pi/notifications',
    icon: Bell,
  },
  {
    name: 'Settings',
    path: '/pi/settings',
    icon: Settings,
  },
];

/**
 * Returns role-specific landing route based on role ID
 */
export function getRoleLandingRoute(roleId?: string): string {
  switch (roleId) {
    case 'ROLE_SUB_I':
      return '/sub-investigator';
    case 'ROLE_CRC':
      return '/crc';
    case 'ROLE_STUDY_NURSE':
      return '/study-nurse';
    case 'ROLE_STUDY_PHARMACIST':
      return '/pharmacist';
    case 'ROLE_DATA_ENTRY':
      return '/data-entry';
    case 'ROLE_PARTICIPANT':
      return '/participant';
    case 'ROLE_PI':
    default:
      return '/pi';
  }
}

/**
 * Filters and configures navigation items based on role landing route and effective permissions
 */
export function getRoleNavigationItems(
  roleId?: string,
  effectivePermissions: Permission[] = []
): NavigationItem[] {
  const landingRoute = getRoleLandingRoute(roleId);
  const permissionIds = new Set(effectivePermissions.map((p) => p.id));

  return BASE_NAV_ITEMS.map((item) => {
    // If it's the top Overview item, adjust route to role landing route
    if (item.name === 'Overview') {
      return {
        ...item,
        path: landingRoute === '/pi' ? '/pi/dashboard' : landingRoute,
      };
    }
    return item;
  }).filter((item) => {
    // If no permission specified, item is generally accessible
    if (!item.permission) {
      return true;
    }
    // Check if user holds required permission
    return permissionIds.has(item.permission);
  });
}
