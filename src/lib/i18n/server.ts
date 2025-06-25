import { cookies } from 'next/headers';
import { defaultLocale, Locale } from './config';
import fs from 'fs/promises';
import path from 'path';

// Get locale from cookies (server-side)
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = cookies();
  const preferredLocale = cookieStore.get('preferred-locale')?.value as Locale;
  
  if (preferredLocale && ['nl', 'en', 'de'].includes(preferredLocale)) {
    return preferredLocale;
  }
  
  return defaultLocale;
}

// Load translations for server-side rendering
export async function getServerTranslations(locale: Locale): Promise<Record<string, any>> {
  try {
    // Include all common namespaces, especially 'trailer' for the trailer detail page
    const namespaces = ['common', 'home', 'trailer', 'addTrailer', 'auth', 'profile'];
    const translations: Record<string, any> = {};
    
    for (const namespace of namespaces) {
      try {
        const filePath = path.join(process.cwd(), 'public', 'locales', locale, `${namespace}.json`);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        translations[namespace] = JSON.parse(fileContent);
      } catch (err) {
        console.warn(`Could not load namespace ${namespace} for locale ${locale}`);
        // Continue with other namespaces even if one fails
      }
    }
    
    return translations;
  } catch (error) {
    console.error('Failed to load server translations:', error);
    return {};
  }
}