import { getPermissionsForRole, hasPermission, type AdminPermission } from '@/lib/rbac';
import { useAuthStore } from '@/stores/auth-store';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const permissions = user?.permissions?.length
    ? user.permissions
    : getPermissionsForRole(user?.adminRole);

  const can = (permission: AdminPermission) => hasPermission(permissions, user?.adminRole, permission);

  return { user, permissions, can };
}
