import type { AdminPermission, AdminRole } from '@/lib/rbac';
import type { AppLanguage } from '@/types/language';

export type { AdminPermission, AdminRole };

export type ApiMeta = {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  meta?: ApiMeta;
};

export type AdminUser = {
  id: string;
  role: 'ADMIN';
  adminRole?: AdminRole | string;
  permissions?: AdminPermission[];
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: string;
  isEmailVerified: boolean;
  preferredLanguage?: AppLanguage;
  lastLoginAt?: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
