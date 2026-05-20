import { api } from '@/lib/api/client';
import { unwrapEnvelope } from '@/lib/api/envelope';
import type { ApiEnvelope } from '@/types/api';
import type { AppLanguage } from '@/types/language';

export async function translateText(text: string, targetLanguage: AppLanguage) {
  const { data } = await api.post<
    ApiEnvelope<{
      originalText: string;
      translatedText: string;
      targetLanguage: AppLanguage;
      fromCache: boolean;
    }>
  >('/translate', { text, targetLanguage });
  return unwrapEnvelope(data, 'Translation failed');
}

export async function translateBatch(texts: string[], targetLanguage: AppLanguage) {
  const { data } = await api.post<
    ApiEnvelope<{
      items: Array<{ originalText: string; translatedText: string; fromCache: boolean }>;
      targetLanguage: AppLanguage;
    }>
  >('/translate/batch', { texts, targetLanguage });
  return unwrapEnvelope(data, 'Batch translation failed');
}
