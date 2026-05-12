import axios from 'axios';
import { getApiBaseUrl } from '@/config/env';
import { api } from '@/lib/api/client';
import { getRefreshToken, useAuthStore } from '@/stores/auth-store';
import type { AdminUser, ApiEnvelope, TokenPair } from '@/types/api';

function unwrap<T>(data: ApiEnvelope<T>, fallbackMsg: string): T {
  if (!data.success) {
    throw new Error(data.message || fallbackMsg);
  }
  if (data.data === undefined) {
    throw new Error(fallbackMsg);
  }
  return data.data;
}

export type AdminLoginBody = { email: string; password: string };

/** Admin login does not set httpOnly cookies — tokens are returned in JSON only. */
export async function adminLogin(body: AdminLoginBody): Promise<{ user: AdminUser; tokens: TokenPair }> {
  const bare = axios.create({
    baseURL: getApiBaseUrl(),
    headers: { 'Content-Type': 'application/json' },
  });
  const { data } = await bare.post<ApiEnvelope<{ user: AdminUser; tokens: TokenPair }>>('/admin/auth/login', body);
  return unwrap(data, 'Login failed');
}

export async function fetchMe(): Promise<AdminUser> {
  const { data } = await api.get<ApiEnvelope<AdminUser>>('/auth/me');
  return unwrap(data, 'Unable to load profile');
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await api.post<ApiEnvelope>('/auth/logout', { refreshToken }, { _skipAuthRefresh: true });
    }
  } catch {
    /* still clear client session */
  }
  useAuthStore.getState().clearSession();
}
