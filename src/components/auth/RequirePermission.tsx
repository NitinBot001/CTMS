import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AccessDeniedState } from './AccessDeniedState';

interface RequirePermissionProps {
  permission: string;
  children?: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  children,
}) => {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!hasPermission(permission)) {
    return <AccessDeniedState requiredPermission={permission} />;
  }

  return children ? <>{children}</> : <Outlet />;
};
