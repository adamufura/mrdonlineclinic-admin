import axios, { type AxiosError } from 'axios';
import '@/lib/api/axios-extensions';
import { getApiBaseUrl } from '@/config/env';
import { getRefreshToken, useAuthStore } from '@/stores/auth-store';
import type { ApiEnvelope } from '@/types/api';

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }
      const bare = axios.create({
        baseURL: getApiBaseUrl(),
        headers: { 'Content-Type': 'application/json' },
      });
      const { data } = await bare.post<ApiEnvelope<{ tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>>(
        '/auth/refresh',
        { refreshToken },
        { _skipAuthRefresh: true },
      );
      if (!data.success || !data.data?.tokens?.accessToken || !data.data.tokens.refreshToken) {
        throw new Error(data.message || 'Refresh failed');
      }
      const user = useAuthStore.getState().user;
      if (!user) {
        useAuthStore.getState().clearSession();
        throw new Error('Session expired');
      }
      useAuthStore.getState().setSession(user, data.data.tokens.accessToken, data.data.tokens.refreshToken);
      return data.data.tokens.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && !config._skipAuthRefresh) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const orig = error.config;
    if (!orig || orig._retry || orig._skipAuthRefresh) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }
    if (typeof orig.url === 'string' && orig.url.includes('/auth/refresh')) {
      useAuthStore.getState().clearSession();
      return Promise.reject(error);
    }
    orig._retry = true;
    try {
      const access = await refreshAccessToken();
      orig.headers.Authorization = `Bearer ${access}`;
      return api.request(orig);
    } catch {
      useAuthStore.getState().clearSession();
      return Promise.reject(error);
    }
  },
);
