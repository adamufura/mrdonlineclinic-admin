import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import type { AdminPermission } from '@/lib/rbac';
import { ROUTES } from '@/router/routes';

export function RequirePermission({
  permission,
  children,
}: {
  permission: AdminPermission;
  children: ReactNode;
}) {
  const { can } = usePermissions();
  if (!can(permission)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }
  return <>{children}</>;
}
