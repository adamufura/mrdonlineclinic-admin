import { create } from 'zustand';
import type { AdminUser } from '@/types/api';

const STORAGE_KEY = 'mrd_admin_auth_v1';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AdminUser | null;
  setSession: (user: AdminUser, accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
};

function readStoredSession(): Pick<AuthState, 'accessToken' | 'refreshToken' | 'user'> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      accessToken?: string;
      refreshToken?: string;
      user?: AdminUser;
    };
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.user) return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      user: parsed.user,
    };
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

const initial = readStoredSession();

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initial?.accessToken ?? null,
  refreshToken: initial?.refreshToken ?? null,
  user: initial?.user ?? null,
  setSession: (user, accessToken, refreshToken) => {
    set({ user, accessToken, refreshToken });
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken, refreshToken }));
    } catch {
      /* ignore quota / private mode */
    }
  },
  clearSession: () => {
    set({ accessToken: null, refreshToken: null, user: null });
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
}));

export function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}
