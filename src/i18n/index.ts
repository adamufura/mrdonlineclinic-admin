import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { AppLanguage } from '@/types/language';
import enCommon from './locales/en/common.json';
import haCommon from './locales/ha/common.json';

const LOCALE_STORAGE_KEY = 'mrd_admin_locale_v1';

export function readStoredLocale(): AppLanguage | null {
  try {
    const v = sessionStorage.getItem(LOCALE_STORAGE_KEY);
    if (v === 'en' || v === 'ha') return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredLocale(lang: AppLanguage): void {
  try {
    sessionStorage.setItem(LOCALE_STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

void i18n.use(initReactI18next).init({
  resources: { en: { common: enCommon }, ha: { common: haCommon } },
  lng: readStoredLocale() ?? 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export async function setAppLanguage(lang: AppLanguage): Promise<void> {
  writeStoredLocale(lang);
  await i18n.changeLanguage(lang);
}

export default i18n;
