"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { defaultLocale, Locale } from "./config";

interface TranslationContextType {
  locale: Locale;
  translations: Record<string, any>;
  t: (key: string, namespace?: string, params?: Record<string, any>) => string;
  setLocale: (locale: Locale) => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

// Get locale from cookies on client side
function getClientLocale(): Locale {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  // Try to get from cookie first
  const cookieMatch = document.cookie.match(/preferred-locale=([^;]+)/);
  if (cookieMatch && ["nl", "en", "de"].includes(cookieMatch[1])) {
    return cookieMatch[1] as Locale;
  }

  // Fallback to localStorage
  const storedLocale = localStorage.getItem("preferred-locale") as Locale;
  if (storedLocale && ["nl", "en", "de"].includes(storedLocale)) {
    return storedLocale;
  }

  return defaultLocale;
}

export function TranslationProvider({
  children,
  initialLocale,
  initialTranslations,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialTranslations?: Record<string, any>;
}) {
  // Use server-provided values or defaults
  const [locale, setLocaleState] = useState<Locale>(() => {
    return initialLocale || defaultLocale;
  });

  const [translations, setTranslations] = useState<Record<string, any>>(() => {
    return initialTranslations || {};
  });

  // Track mounted state
  const isMountedRef = useRef(true);
  const loadingNamespacesRef = useRef(new Set<string>());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check client locale preference after mount (hydration)
  useEffect(() => {
    // Only check client preference if we have initial translations
    if (initialTranslations && Object.keys(initialTranslations).length > 0) {
      const clientLocale = getClientLocale();
      // Only update if different from server locale
      if (clientLocale !== locale) {
        setLocale(clientLocale);
      }
    }
  }, []); // Run once on mount

  const loadTranslations = useCallback(async (newLocale: Locale) => {
    try {
      const namespaces = [
        "common",
        "home",
        "trailer",
        "addTrailer",
        "auth",
        "profile",
        "reservation",
        "trailerTypes",
      ];

      const translationPromises = namespaces.map(async (namespace) => {
        try {
          const response = await fetch(
            `/locales/${newLocale}/${namespace}.json`
          );
          if (!response.ok) {
            console.warn(
              `Failed to load ${namespace} translations for ${newLocale}`
            );
            return { namespace, data: {} };
          }
          const data = await response.json();
          return { namespace, data };
        } catch (err) {
          console.warn(`Error fetching ${namespace} for ${newLocale}`, err);
          return { namespace, data: {} };
        }
      });

      const results = await Promise.all(translationPromises);
      const combinedTranslations: Record<string, any> = {};

      results.forEach(({ namespace, data }) => {
        combinedTranslations[namespace] = data;
      });

      if (isMountedRef.current) {
        setTranslations(combinedTranslations);
      }
    } catch (error) {
      console.error("Failed to load translations:", error);
    }
  }, []);

  const setLocale = useCallback(
    async (newLocale: Locale) => {
      if (newLocale === locale) return;

      setLocaleState(newLocale);

      if (typeof window !== "undefined") {
        localStorage.setItem("preferred-locale", newLocale);
        document.cookie = `preferred-locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
      }

      await loadTranslations(newLocale);
    },
    [locale, loadTranslations]
  );

  // Load missing namespace dynamically
  const loadMissingNamespace = useCallback(
    async (namespace: string) => {
      if (
        loadingNamespacesRef.current.has(namespace) ||
        translations[namespace]
      ) {
        return;
      }

      loadingNamespacesRef.current.add(namespace);

      try {
        const response = await fetch(`/locales/${locale}/${namespace}.json`);
        if (response.ok) {
          const data = await response.json();
          if (isMountedRef.current) {
            setTranslations((prev) => ({
              ...prev,
              [namespace]: data,
            }));
          }
        } else {
          console.warn(
            `Failed to load namespace ${namespace}, status: ${response.status}`
          );
        }
      } catch (err) {
        console.warn(`Failed to load namespace ${namespace}`, err);
      } finally {
        loadingNamespacesRef.current.delete(namespace);
      }
    },
    [locale, translations]
  );

  const t = useCallback(
    (
      key: string,
      namespace: string = "common",
      params?: Record<string, any>
    ): string => {
      const namespaceData = translations[namespace];

      if (!namespaceData) {
        // Schedule loading for next tick to avoid render-time side effects
        if (typeof window !== "undefined") {
          Promise.resolve().then(() => loadMissingNamespace(namespace));
        }
        return key;
      }

      const keys = key.split(".");
      let value: any = namespaceData;

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          return key;
        }
      }

      if (typeof value !== "string") {
        return key;
      }

      if (params) {
        let result = value;
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          result = result.replace(
            new RegExp(`{{${paramKey}}}`, "g"),
            String(paramValue)
          );
        });
        return result;
      }

      return value;
    },
    [translations, loadMissingNamespace]
  );

  const contextValue = React.useMemo(
    () => ({ locale, translations, t, setLocale }),
    [locale, translations, t, setLocale]
  );

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation(namespace: string = "common") {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }

  // Load namespace on mount if it's missing
  useEffect(() => {
    if (!context.translations[namespace] && typeof window !== "undefined") {
      // Use the loadMissingNamespace function through the t function
      // This will trigger loading on next tick
      context.t("_load_", namespace);
    }
  }, [namespace, context]);

  return {
    locale: context.locale,
    setLocale: context.setLocale,
    t: useCallback(
      (key: string, params?: Record<string, any>) =>
        context.t(key, namespace, params),
      [context, namespace]
    ),
  };
}
