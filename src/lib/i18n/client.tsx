"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { defaultLocale, Locale } from "./config";
import { defaultTranslations } from "./default-translations";

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

  // Try to get from cookie first (server-side compatible)
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
  initialLocale = defaultLocale,
  initialTranslations = defaultTranslations,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialTranslations?: Record<string, any>;
}) {
  // Initialize with cookie value if available
  const [locale, setLocaleState] = useState<Locale>(() => getClientLocale());
  const [translations, setTranslations] =
    useState<Record<string, any>>(initialTranslations);

  // Use refs to track component mount status and pending namespace loads
  const isMountedRef = useRef(true);
  const loadingNamespacesRef = useRef(new Set<string>());

  // Track missing namespaces
  const [missingNamespaces, setMissingNamespaces] = useState<Set<string>>(
    new Set()
  );

  // Use a ref to track namespaces that need to be loaded to avoid render-time state updates
  const pendingNamespacesRef = useRef(new Set<string>());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // On component initialization, check if we need to load missing translations
  useEffect(() => {
    // If we're already initialized with all needed translations, skip loading
    if (initialTranslations && Object.keys(initialTranslations).length >= 3) {
      return;
    }

    // Otherwise, load translations
    loadTranslations(locale);
  }, []);

  useEffect(() => {
    // Load translations when locale changes from the initial locale
    if (locale !== initialLocale) {
      loadTranslations(locale);
    }
  }, [locale, initialLocale]);

  // Check if we're on the trailer detail page and ensure the trailer namespace is loaded
  useEffect(() => {
    // Use a more robust way to detect the current path
    const detectTrailerPage = () => {
      if (typeof window === "undefined") return false;
      return window.location.pathname.includes("/aanbod/");
    };

    const isTrailerPage = detectTrailerPage();
    if (
      isTrailerPage &&
      (!translations.trailer ||
        Object.keys(translations.trailer || {}).length === 0)
    ) {
      const loadTrailerNamespace = async () => {
        try {
          const response = await fetch(`/locales/${locale}/trailer.json`);
          if (!response.ok) {
            throw new Error(
              `Failed to load trailer namespace, status: ${response.status}`
            );
          }
          const data = await response.json();
          if (isMountedRef.current) {
            setTranslations((prev) => ({ ...prev, trailer: data }));
          }
        } catch (err) {
          console.warn(`Failed to load trailer namespace for ${locale}`, err);
        }
      };
      loadTrailerNamespace();
    }
  }, [locale, translations.trailer]);

  const loadTranslations = async (newLocale: Locale) => {
    try {
      // Load multiple namespaces
      const namespaces = [
        "common",
        "home",
        "trailer",
        "addTrailer",
        "profile",
        "reservation",
      ];

      // Only fetch namespaces that aren't already loaded
      const namespacesToFetch = namespaces.filter(
        (namespace) => !translations[namespace] || locale !== newLocale
      );

      if (namespacesToFetch.length === 0) {
        return; // All translations already loaded
      }

      const translationPromises = namespacesToFetch.map(async (namespace) => {
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
      const combinedTranslations: Record<string, any> = { ...translations };

      results.forEach(({ namespace, data }) => {
        combinedTranslations[namespace] = data;
      });

      if (isMountedRef.current) {
        setTranslations(combinedTranslations);
      }
    } catch (error) {
      console.error("Failed to load translations:", error);
    }
  };

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("preferred-locale", newLocale);
    // Also set cookie for server-side rendering
    document.cookie = `preferred-locale=${newLocale};path=/;max-age=31536000`;
    await loadTranslations(newLocale);
  };

  // Load missing namespace - this function is called from useEffect
  const loadMissingNamespace = async (namespace: string) => {
    if (loadingNamespacesRef.current.has(namespace)) {
      return; // Already loading this namespace
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
        console.error(
          `Failed to load namespace ${namespace}, status: ${response.status}`
        );
      }
    } catch (err) {
      console.error(`Failed to load namespace ${namespace}`, err);
    } finally {
      loadingNamespacesRef.current.delete(namespace);
    }
  };

  // Process pending namespaces after render
  useEffect(() => {
    if (pendingNamespacesRef.current.size > 0) {
      const namespacesToLoad = new Set(pendingNamespacesRef.current);
      pendingNamespacesRef.current.clear();

      namespacesToLoad.forEach((namespace) => {
        setMissingNamespaces((prev) => {
          const newSet = new Set(prev);
          newSet.add(namespace);
          return newSet;
        });
      });
    }
  });

  // Load missing namespaces in useEffect
  useEffect(() => {
    missingNamespaces.forEach((namespace) => {
      loadMissingNamespace(namespace);
    });
  }, [missingNamespaces]);

  const t = (
    key: string,
    namespace: string = "common",
    params?: Record<string, any>
  ): string => {
    // Handle the case where namespace isn't loaded yet
    if (!translations[namespace]) {
      // Only log in development to avoid console spam
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Translation namespace not loaded: ${namespace}, key: ${key}`
        );
      }

      // Instead of updating state directly, add to pending namespaces
      pendingNamespacesRef.current.add(namespace);

      return key;
    }

    const keys = key.split(".");
    let value: any = translations[namespace];

    if (!value) {
      return key;
    }

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
  };

  return (
    <TranslationContext.Provider value={{ locale, translations, t, setLocale }}>
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
    if (!context.translations[namespace]) {
      // This will trigger the pending namespace processing in the next render
      context.t("dummy", namespace);
    }
  }, [namespace, context]);

  return {
    ...context,
    t: (key: string, params?: Record<string, any>) =>
      context.t(key, namespace, params),
  };
}
