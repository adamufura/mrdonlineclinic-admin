export const ADMIN_PERMISSIONS = [
  'stats:read',
  'audit:read',
  'patients:read',
  'patients:write',
  'practitioners:read',
  'practitioners:write',
  'practitioners:verify',
  'practitioners:onboard',
  'admins:read',
  'admins:write',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'DEPUTY_DIRECTOR',
  'OPERATIONS',
  'MINISTRY_OFFICE',
  'ONBOARDING',
  'AUDITOR',
  'ADMIN',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ASSIGNABLE_ADMIN_ROLES = [
  'DEPUTY_DIRECTOR',
  'OPERATIONS',
  'MINISTRY_OFFICE',
  'ONBOARDING',
  'AUDITOR',
] as const;

export type AssignableAdminRole = (typeof ASSIGNABLE_ADMIN_ROLES)[number];

const ALL: AdminPermission[] = [...ADMIN_PERMISSIONS];

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: ALL,
  DEPUTY_DIRECTOR: [
    'stats:read',
    'audit:read',
    'patients:read',
    'patients:write',
    'practitioners:read',
    'practitioners:write',
    'practitioners:verify',
    'practitioners:onboard',
    'admins:read',
  ],
  OPERATIONS: [
    'stats:read',
    'audit:read',
    'patients:read',
    'patients:write',
    'practitioners:read',
    'practitioners:write',
    'practitioners:verify',
    'practitioners:onboard',
  ],
  MINISTRY_OFFICE: ['stats:read', 'audit:read', 'patients:read', 'practitioners:read'],
  ONBOARDING: [
    'stats:read',
    'patients:read',
    'patients:write',
    'practitioners:read',
    'practitioners:onboard',
    'practitioners:verify',
  ],
  AUDITOR: ['stats:read', 'audit:read', 'patients:read', 'practitioners:read'],
  ADMIN: [
    'stats:read',
    'audit:read',
    'patients:read',
    'patients:write',
    'practitioners:read',
    'practitioners:write',
    'practitioners:verify',
    'practitioners:onboard',
  ],
};

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Administrator',
  DEPUTY_DIRECTOR: 'Deputy Director',
  OPERATIONS: 'Operations Office',
  MINISTRY_OFFICE: 'Ministry Office',
  ONBOARDING: 'Onboarding Officer',
  AUDITOR: 'Auditor',
  ADMIN: 'Administrator',
};

export function normalizeAdminRole(role: string | undefined): AdminRole | undefined {
  if (!role) return undefined;
  if (role === 'ADMIN') return 'OPERATIONS';
  if ((ADMIN_ROLES as readonly string[]).includes(role)) return role as AdminRole;
  return undefined;
}

export function getPermissionsForRole(role: string | undefined): AdminPermission[] {
  const normalized = normalizeAdminRole(role);
  if (!normalized) return [];
  return ROLE_PERMISSIONS[normalized] ?? [];
}

export function hasPermission(
  permissions: AdminPermission[] | undefined,
  role: string | undefined,
  permission: AdminPermission,
): boolean {
  const effective = permissions?.length ? permissions : getPermissionsForRole(role);
  return effective.includes(permission);
}

export function canManageStaff(role: string | undefined): boolean {
  const r = normalizeAdminRole(role);
  return r === 'SUPER_ADMIN' || r === 'DEPUTY_DIRECTOR';
}

export function canAssignRole(actorRole: string | undefined, targetRole: AssignableAdminRole | 'SUPER_ADMIN'): boolean {
  const actor = normalizeAdminRole(actorRole);
  if (actor === 'SUPER_ADMIN') return true;
  if (actor === 'DEPUTY_DIRECTOR') return targetRole !== 'SUPER_ADMIN';
  return false;
}
