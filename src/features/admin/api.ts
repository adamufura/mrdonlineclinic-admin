import { api } from '@/lib/api/client';
import { unwrapEnvelope, unwrapList } from '@/lib/api/envelope';
import type { ApiEnvelope, ApiMeta } from '@/types/api';

export type PlatformStats = {
  patients: number;
  practitioners: number;
  admins: number;
  appointments: number;
};

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data } = await api.get<ApiEnvelope<PlatformStats>>('/admin/stats');
  return unwrapEnvelope(data, 'Unable to load stats');
}

export type PractitionerAdminRow = {
  _id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber: string;
  status: string;
  verificationStatus?: string;
  verificationNotes?: string;
  isAvailableForBooking?: boolean;
  isEmailVerified?: boolean;
  createdAt?: string;
};

export async function listPractitionersAdmin(params: {
  page: number;
  limit: number;
}): Promise<{ items: PractitionerAdminRow[]; meta: ApiMeta | undefined }> {
  const { data } = await api.get<ApiEnvelope<PractitionerAdminRow[]>>('/admin/practitioners', { params });
  return unwrapList(data, 'Unable to load practitioners');
}

export async function verifyPractitioner(id: string, verificationNotes?: string): Promise<unknown> {
  const { data } = await api.post<ApiEnvelope<unknown>>(`/admin/practitioners/${id}/verify`, {
    verificationNotes: verificationNotes?.trim() || undefined,
  });
  return unwrapEnvelope(data, 'Verification failed');
}

export async function rejectPractitioner(id: string, verificationNotes: string): Promise<unknown> {
  const { data } = await api.post<ApiEnvelope<unknown>>(`/admin/practitioners/${id}/reject`, {
    verificationNotes: verificationNotes.trim(),
  });
  return unwrapEnvelope(data, 'Reject failed');
}

export async function suspendPractitioner(id: string): Promise<unknown> {
  const { data } = await api.post<ApiEnvelope<unknown>>(`/admin/practitioners/${id}/suspend`, {});
  return unwrapEnvelope(data, 'Suspend failed');
}

export type PatientAdminRow = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: string;
  isEmailVerified?: boolean;
  createdAt?: string;
};

export async function listPatientsAdmin(params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<{ items: PatientAdminRow[]; meta: ApiMeta | undefined }> {
  const { data } = await api.get<ApiEnvelope<PatientAdminRow[]>>('/admin/patients', { params });
  return unwrapList(data, 'Unable to load patients');
}

export type AuditLogRow = {
  _id: string;
  action: string;
  actorRole: string;
  targetType: string;
  targetId: string;
  metadata?: unknown;
  ipAddress?: string;
  createdAt?: string;
  actor?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  } | null;
};

export async function listAuditLogsAdmin(params: {
  page: number;
  limit: number;
  action?: string;
}): Promise<{ items: AuditLogRow[]; meta: ApiMeta | undefined }> {
  const { data } = await api.get<ApiEnvelope<AuditLogRow[]>>('/admin/audit-logs', { params });
  return unwrapList(data, 'Unable to load audit logs');
}

export type AdminUserRow = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  adminRole: string;
  status: string;
  isEmailVerified?: boolean;
  createdAt?: string;
};

export async function listAdminUsers(params: {
  page: number;
  limit: number;
}): Promise<{ items: AdminUserRow[]; meta: ApiMeta | undefined }> {
  const { data } = await api.get<ApiEnvelope<AdminUserRow[]>>('/admin/users', { params });
  return unwrapList(data, 'Unable to load admins');
}

export async function inviteAdmin(email: string): Promise<{ message: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string }>>('/admin/invite', { email });
  return unwrapEnvelope(data, 'Invite failed');
}

export async function deactivateAdminUser(id: string): Promise<{ message: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string }>>(`/admin/users/${id}/deactivate`, {});
  return unwrapEnvelope(data, 'Deactivate failed');
}
