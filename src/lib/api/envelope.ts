import type { ApiEnvelope, ApiMeta } from '@/types/api';

export function unwrapEnvelope<T>(data: ApiEnvelope<T>, fallbackMsg: string): T {
  if (!data.success) {
    throw new Error(data.message || fallbackMsg);
  }
  if (data.data === undefined) {
    throw new Error(fallbackMsg);
  }
  return data.data;
}

export function unwrapList<T>(
  data: ApiEnvelope<T[]>,
  fallbackMsg: string,
): { items: T[]; meta: ApiMeta | undefined } {
  if (!data.success) {
    throw new Error(data.message || fallbackMsg);
  }
  const items = Array.isArray(data.data) ? data.data : [];
  return { items, meta: data.meta };
}
