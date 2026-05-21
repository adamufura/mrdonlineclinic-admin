import { api } from '@/lib/api/client';
import { unwrapEnvelope } from '@/lib/api/envelope';
import type { ApiEnvelope } from '@/types/api';

/** Matches GET /api/v1/specialties public payload (`id`, not `_id`). */
export type SpecialtyOption = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
};

export async function listSpecialties(): Promise<SpecialtyOption[]> {
  const { data } = await api.get<ApiEnvelope<SpecialtyOption[]>>('/specialties');
  return unwrapEnvelope(data, 'Unable to load specialties');
}
