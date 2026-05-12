import { isAxiosError } from 'axios';
import type { ApiEnvelope } from '@/types/api';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

export function normalizeAxiosError(err: unknown): ApiRequestError {
  if (!isAxiosError(err)) {
    return new ApiRequestError('Network error', 0);
  }
  const status = err.response?.status ?? 0;
  const data = err.response?.data as ApiEnvelope | undefined;
  const message = typeof data?.message === 'string' ? data.message : err.message || 'Request failed';
  return new ApiRequestError(message, status, data);
}
