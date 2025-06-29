// src/lib/i18n/server.ts
import { cookies } from 'next/headers';
import { defaultLocale, Locale } from './config';
import { translations, TranslationNamespace } from './translations/index';

// Get the current locale from cookies on the server
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('preferred-locale')?.value as Locale | undefined;
  
  if (locale && locale in translations) {
    return locale;
  }
  
  return defaultLocale;
}

// Get translations for a specific namespace
export async function getTranslations(namespace: TranslationNamespace) {
  const locale = await getLocale();
  const namespaceTranslations = translations[locale][namespace] || {};
  
  return {
    locale,
    t: (key: string, params?: Record<string, string | number>) => {
      const keys = key.split('.');
      let value: any = namespaceTranslations;
      
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
          console.warn(`Translation missing: ${locale}.${namespace}.${key}`);
          return key;
        }
      }
      
      if (typeof value !== 'string') {
        console.warn(`Translation not a string: ${locale}.${namespace}.${key}`);
        return key;
      }
      
      // Replace parameters like {{param}}
      if (params) {
        return Object.entries(params).reduce(
          (str, [key, val]) => str.replace(new RegExp(`{{${key}}}`, 'g'), String(val)),
          value
        );
      }
      
      return value;
    }
  };
}

// Get all translations for the current locale
export async function getAllTranslations() {
  const locale = await getLocale();
  return {
    locale,
    translations: translations[locale],
  };
}