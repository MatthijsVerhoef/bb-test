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

export function TranslationProvider({
  children,
  initialLocale = defaultLocale,
  initialTranslations = defaultTranslations,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialTranslations?: Record<string, any>;
}) {
  // IMPORTANT: Always use server-provided values to prevent flash
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [translations, setTranslations] = useState<Record<string, any>>(
    initialTranslations || {}
  );

  // Use refs to track component mount status
  const isMountedRef = useRef(true);
  const loadingNamespacesRef = useRef(new Set<string>());
  const hasInitializedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Sync with client preferences after hydration
  useEffect(() => {
    // Only run this once after hydration
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Check if client has a different preference than server
    const clientLocale = getClientLocale();
    if (clientLocale !== initialLocale) {
      // User has a different preference stored locally
      setLocale(clientLocale);
    }
  }, []); // Run only once on mount

  // Get locale from cookies on client side
  function getClientLocale(): Locale {
    if (typeof window === "undefined") {
      return initialLocale;
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

    return initialLocale;
  }

  const loadTranslations = async (newLocale: Locale) => {
    try {
      // Remove duplicate 'auth' from namespaces
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
  };

  const setLocale = async (newLocale: Locale) => {
    // Don't reload if it's the same locale
    if (newLocale === locale) return;

    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred-locale", newLocale);
      document.cookie = `preferred-locale=${newLocale};path=/;max-age=31536000`;
    }
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
        console.warn(
          `Failed to load namespace ${namespace}, status: ${response.status}`
        );
      }
    } catch (err) {
      console.warn(`Failed to load namespace ${namespace}`, err);
    } finally {
      loadingNamespacesRef.current.delete(namespace);
    }
  };

  const t = (
    key: string,
    namespace: string = "common",
    params?: Record<string, any>
  ): string => {
    // Handle the case where namespace isn't loaded yet
    if (!translations[namespace]) {
      // Return the key as fallback - DO NOT trigger any state updates here
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
    if (!context.translations[namespace] && typeof window !== "undefined") {
      // Load the namespace asynchronously without affecting render
      const loadNamespace = async () => {
        try {
          const response = await fetch(
            `/locales/${context.locale}/${namespace}.json`
          );
          if (response.ok) {
            const data = await response.json();
            // Update translations for this specific namespace
            context.translations[namespace] = data;
          }
        } catch (err) {
          console.warn(`Failed to load namespace ${namespace}`, err);
        }
      };

      loadNamespace();
    }
  }, [namespace, context.locale, context.translations]);

  return {
    ...context,
    t: (key: string, params?: Record<string, any>) =>
      context.t(key, namespace, params),
  };
}
