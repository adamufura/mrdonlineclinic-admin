import { isAxiosError } from 'axios';
import type { ApiEnvelope } from '@/types/api';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string, status: number, body?: unknown, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
    this.fieldErrors = fieldErrors;
  }
}

type ZodFlatten = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[]>;
};

const FIELD_LABELS: Record<string, string> = {
  specialties: 'Specialty',
  specialtyId: 'Specialty',
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  phoneNumber: 'Phone',
  licenseNumber: 'License number',
};

export function humanizeFieldMessage(field: string, message: string): string {
  if (field === 'specialties' || field === 'specialtyId') {
    if (message === 'Invalid id' || message.includes('Invalid')) {
      return 'Please select a valid specialty from the list.';
    }
    if (message.includes('Select')) return message;
  }
  return message;
}

function parseZodFlatten(data: unknown): { message: string | null; fieldErrors?: Record<string, string[]> } {
  if (!data || typeof data !== 'object') return { message: null };
  const flat = data as ZodFlatten;
  const fieldErrors = flat.fieldErrors;
  const formErrors = flat.formErrors ?? [];
  const parts: string[] = [...formErrors];

  if (fieldErrors) {
    for (const [field, msgs] of Object.entries(fieldErrors)) {
      const label = FIELD_LABELS[field] ?? field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
      for (const raw of msgs) {
        parts.push(`${label}: ${humanizeFieldMessage(field, raw)}`);
      }
    }
  }

  if (parts.length === 0) return { message: null, fieldErrors };
  return { message: parts.join(' '), fieldErrors };
}

export function normalizeAxiosError(err: unknown): ApiRequestError {
  if (!isAxiosError(err)) {
    return new ApiRequestError('Network error', 0);
  }
  const status = err.response?.status ?? 0;
  const data = err.response?.data as ApiEnvelope<unknown> | undefined;
  const parsed = parseZodFlatten(data?.data);
  const fallback = typeof data?.message === 'string' ? data.message : err.message || 'Request failed';
  const message = parsed.message ?? fallback;
  return new ApiRequestError(message, status, data, parsed.fieldErrors);
}
