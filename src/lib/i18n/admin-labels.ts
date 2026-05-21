import i18n from '@/i18n';
export function labelAccountStatus(status?: string): string {
  if (!status) return '—';
  const key = `admin.enums.accountStatus.${status}`;
  return i18n.exists(key) ? i18n.t(key) : status;
}

export function labelVerificationStatus(status?: string): string {
  if (!status) return '—';
  const key = `admin.enums.verificationStatus.${status}`;
  return i18n.exists(key) ? i18n.t(key) : status;
}

export function labelAdminRole(role?: string): string {
  if (!role) return '—';
  const key = `admin.enums.adminRole.${role}`;
  return i18n.exists(key) ? i18n.t(key) : role;
}

export function labelAppointmentStatus(status?: string): string {
  if (!status) return status ?? '—';
  const key = `admin.enums.appointmentStatus.${status}`;
  return i18n.exists(key) ? i18n.t(key) : status.replace(/_/g, ' ').toLowerCase();
}

export function labelAuditAction(action?: string): string {
  if (!action) return '—';
  const key = `admin.enums.auditAction.${action}`;
  if (i18n.exists(key)) return i18n.t(key);
  return action.replace(/_/g, ' ').toLowerCase();
}

export function greetingKey(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export function phoneMeta(phone?: string): string | undefined {
  if (!phone) return undefined;
  return i18n.t('admin.enums.phonePrefix', { phone });
}
