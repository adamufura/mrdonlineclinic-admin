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

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN';

export type AdminUser = {
  id: string;
  role: 'ADMIN';
  adminRole?: AdminRole | string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: string;
  isEmailVerified: boolean;
  lastLoginAt?: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
