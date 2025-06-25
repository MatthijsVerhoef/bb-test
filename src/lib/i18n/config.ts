export const defaultLocale = 'nl';
export const locales = ['nl', 'en', 'de'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  nl: 'Nederlands',
  en: 'English',
  de: 'Deutsch',
};

export const localeFlagPaths: Record<Locale, string> = {
  nl: '/assets/flags/nl.svg',
  en: '/assets/flags/gb.svg',
  de: '/assets/flags/de.svg',
};