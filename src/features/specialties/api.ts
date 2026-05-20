import { api } from '@/lib/api/client';
import { unwrapEnvelope } from '@/lib/api/envelope';
import type { ApiEnvelope } from '@/types/api';

export type SpecialtyOption = {
  _id: string;
  name: string;
  slug?: string;
};

export async function listSpecialties(): Promise<SpecialtyOption[]> {
  const { data } = await api.get<ApiEnvelope<SpecialtyOption[]>>('/specialties');
  return unwrapEnvelope(data, 'Unable to load specialties');
}
