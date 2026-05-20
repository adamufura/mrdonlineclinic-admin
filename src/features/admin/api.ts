import { api } from '@/lib/api/client';
import { unwrapEnvelope, unwrapList } from '@/lib/api/envelope';
import type { AssignableAdminRole } from '@/lib/rbac';
import type { ApiEnvelope, ApiMeta } from '@/types/api';

export type PlatformStats = {
  patients: number;
  practitioners: number;
  admins: number;
  appointments: number;
  pendingVerification?: number;
  pendingAppointments?: number;
  completedAppointments?: number;
  activePatients?: number;
  activePractitioners?: number;
  appointmentsByStatus?: Record<string, number>;
  recentAudit?: AuditLogRow[];
};

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data } = await api.get<ApiEnvelope<PlatformStats>>('/admin/stats');
  return unwrapEnvelope(data, 'Unable to load stats');
}

export type SearchHit = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status?: string;
  verificationStatus?: string;
  adminRole?: string;
};

export async function globalSearchAdmin(q: string): Promise<{
  practitioners: SearchHit[];
  patients: SearchHit[];
  staff: SearchHit[];
}> {
  const { data } = await api.get<ApiEnvelope<{ practitioners: SearchHit[]; patients: SearchHit[]; staff: SearchHit[] }>>(
    '/admin/search',
    { params: { q, limit: 12 } },
  );
  return unwrapEnvelope(data, 'Search failed');
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
  licenseNumber?: string;
  licenseDocumentUrl?: string;
  isAvailableForBooking?: boolean;
  isEmailVerified?: boolean;
  onboardedAt?: string;
  createdAt?: string;
  specialties?: { _id: string; name: string }[];
};

export type PractitionerDetail = {
  practitioner: PractitionerAdminRow & Record<string, unknown>;
  appointments: Array<Record<string, unknown>>;
  appointmentStats: Record<string, number>;
  reviewsCount: number;
};

export async function listPractitionersAdmin(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  verificationStatus?: string;
}): Promise<{ items: PractitionerAdminRow[]; meta: ApiMeta | undefined }> {
  const { data } = await api.get<ApiEnvelope<PractitionerAdminRow[]>>('/admin/practitioners', { params });
  return unwrapList(data, 'Unable to load practitioners');
}

export async function getPractitionerAdmin(id: string): Promise<PractitionerDetail> {
  const { data } = await api.get<ApiEnvelope<PractitionerDetail>>(`/admin/practitioners/${id}`);
  return unwrapEnvelope(data, 'Unable to load practitioner');
}

export async function updatePractitionerAdmin(id: string, body: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.patch<ApiEnvelope<unknown>>(`/admin/practitioners/${id}`, body);
  return unwrapEnvelope(data, 'Update failed');
}

export async function deletePractitionerAdmin(id: string): Promise<{ message: string }> {
  const { data } = await api.delete<ApiEnvelope<{ message: string }>>(`/admin/practitioners/${id}`);
  return unwrapEnvelope(data, 'Delete failed');
}

export type CreatePractitionerBody = {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber: string;
  specialties: string[];
  licenseNumber?: string;
  bio?: string;
  yearsOfExperience?: number;
  autoVerify?: boolean;
};

export async function createPractitionerAdmin(
  body: CreatePractitionerBody,
): Promise<{ message: string; defaultPassword: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string; defaultPassword: string }>>('/admin/practitioners', body);
  return unwrapEnvelope(data, 'Unable to onboard practitioner');
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

export async function resetPractitionerPassword(id: string): Promise<{ message: string; defaultPassword: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string; defaultPassword: string }>>(
    `/admin/practitioners/${id}/reset-password`,
    {},
  );
  return unwrapEnvelope(data, 'Password reset failed');
}

export type PatientAdminRow = {
  _id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber: string;
  status: string;
  gender?: string;
  dateOfBirth?: string;
  isEmailVerified?: boolean;
  createdAt?: string;
};

export type PatientDetail = {
  patient: PatientAdminRow & Record<string, unknown>;
  appointments: Array<Record<string, unknown>>;
  prescriptions: Array<Record<string, unknown>>;
  appointmentStats: Record<string, number>;
};

export async function listPatientsAdmin(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}): Promise<{ items: PatientAdminRow[]; meta: ApiMeta | undefined }> {
  const { data } = await api.get<ApiEnvelope<PatientAdminRow[]>>('/admin/patients', { params });
  return unwrapList(data, 'Unable to load patients');
}

export async function getPatientAdmin(id: string): Promise<PatientDetail> {
  const { data } = await api.get<ApiEnvelope<PatientDetail>>(`/admin/patients/${id}`);
  return unwrapEnvelope(data, 'Unable to load patient');
}

export async function updatePatientAdmin(id: string, body: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.patch<ApiEnvelope<unknown>>(`/admin/patients/${id}`, body);
  return unwrapEnvelope(data, 'Update failed');
}

export async function deletePatientAdmin(id: string): Promise<{ message: string }> {
  const { data } = await api.delete<ApiEnvelope<{ message: string }>>(`/admin/patients/${id}`);
  return unwrapEnvelope(data, 'Delete failed');
}

export type CreatePatientBody = {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_SAY';
};

export async function createPatientAdmin(body: CreatePatientBody): Promise<{ message: string; defaultPassword: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string; defaultPassword: string }>>('/admin/patients', body);
  return unwrapEnvelope(data, 'Unable to onboard patient');
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
    adminRole?: string;
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
  middleName?: string;
  email: string;
  phoneNumber?: string;
  adminRole: string;
  status: string;
  isEmailVerified?: boolean;
  createdAt?: string;
};

export async function listAdminUsers(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  adminRole?: string;
}): Promise<{ items: AdminUserRow[]; meta: ApiMeta | undefined }> {
  const { data } = await api.get<ApiEnvelope<AdminUserRow[]>>('/admin/users', { params });
  return unwrapList(data, 'Unable to load admins');
}

export type CreateAdminBody = {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber: string;
  adminRole: AssignableAdminRole;
};

export async function createAdminStaff(body: CreateAdminBody): Promise<{ message: string; defaultPassword: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string; defaultPassword: string }>>('/admin/users', body);
  return unwrapEnvelope(data, 'Unable to create staff account');
}

export async function deactivateAdminUser(id: string): Promise<{ message: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string }>>(`/admin/users/${id}/deactivate`, {});
  return unwrapEnvelope(data, 'Deactivate failed');
}

export async function resetAdminPassword(id: string): Promise<{ message: string; defaultPassword: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string; defaultPassword: string }>>(
    `/admin/users/${id}/reset-password`,
    {},
  );
  return unwrapEnvelope(data, 'Password reset failed');
}

export async function getAdminUser(id: string): Promise<AdminUserRow> {
  const { data } = await api.get<ApiEnvelope<AdminUserRow>>(`/admin/users/${id}`);
  return unwrapEnvelope(data, 'Unable to load staff');
}

export async function updateAdminUser(id: string, body: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.patch<ApiEnvelope<unknown>>(`/admin/users/${id}`, body);
  return unwrapEnvelope(data, 'Update failed');
}

export async function deleteAdminUser(id: string): Promise<{ message: string }> {
  const { data } = await api.delete<ApiEnvelope<{ message: string }>>(`/admin/users/${id}`);
  return unwrapEnvelope(data, 'Delete failed');
}

export async function changeAdminRole(id: string, adminRole: string): Promise<unknown> {
  const { data } = await api.patch<ApiEnvelope<unknown>>(`/admin/users/${id}/role`, { adminRole });
  return unwrapEnvelope(data, 'Role change failed');
}
