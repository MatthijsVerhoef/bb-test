// lib/i18n/server.ts
import { cookies } from 'next/headers';
import { defaultLocale, Locale } from './config';
import fs from 'fs/promises';
import path from 'path';

// Cache translations in memory for better performance
const translationsCache = new Map<string, Record<string, any>>();

// Get locale from cookies (server-side)
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const preferredLocale = cookieStore.get('preferred-locale')?.value as Locale;
  
  if (preferredLocale && ['nl', 'en', 'de'].includes(preferredLocale)) {
    return preferredLocale;
  }
  
  return defaultLocale;
}

// Load translations for server-side rendering with caching
export async function getServerTranslations(
  locale: Locale
): Promise<Record<string, any>> {
  // Check cache first
  const cacheKey = `translations-${locale}`;
  if (translationsCache.has(cacheKey)) {
    return translationsCache.get(cacheKey)!;
  }

  try {
    const namespaces = [
      'common',
      'home',
      'trailer',
      'addTrailer',
      'auth',
      'profile',
      'reservation',
      'trailerTypes',
    ];
    
    const translations: Record<string, any> = {};
    
    // Load all namespaces in parallel for better performance
    const loadPromises = namespaces.map(async (namespace) => {
      try {
        const filePath = path.join(
          process.cwd(),
          'public',
          'locales',
          locale,
          `${namespace}.json`
        );
        
        // Check if file exists before trying to read
        try {
          await fs.access(filePath);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          return { namespace, data: JSON.parse(fileContent) };
        } catch (error) {
          // File doesn't exist or can't be read
          console.warn(
            `Translation file not found: ${namespace}.json for locale ${locale}`
          );
          return { namespace, data: {} };
        }
      } catch (err) {
        console.error(
          `Error loading namespace ${namespace} for locale ${locale}:`,
          err
        );
        return { namespace, data: {} };
      }
    });
    
    const results = await Promise.all(loadPromises);
    
    results.forEach(({ namespace, data }) => {
      translations[namespace] = data;
    });
    
    // Cache the translations
    translationsCache.set(cacheKey, translations);
    
    // Clear cache after 5 minutes to pick up any changes in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        translationsCache.delete(cacheKey);
      }, 5 * 60 * 1000);
    }
    
    return translations;
  } catch (error) {
    console.error('Failed to load server translations:', error);
    return {};
  }
}

export async function getTranslation(namespace: string = 'common') {
  const locale = await getServerLocale();
  const translations = await getServerTranslations(locale);
  
  return {
    t: (key: string, params?: Record<string, any>): string => {
      const namespaceData = translations[namespace];
      
      if (!namespaceData) {
        return key;
      }

      const keys = key.split('.');
      let value: any = namespaceData;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return key;
        }
      }

      if (typeof value !== 'string') {
        return key;
      }

      if (params) {
        return Object.entries(params).reduce(
          (result, [paramKey, paramValue]) =>
            result.replace(
              new RegExp(`{{${paramKey}}}`, 'g'),
              String(paramValue)
            ),
          value
        );
      }

      return value;
    },
    locale,
  };
}