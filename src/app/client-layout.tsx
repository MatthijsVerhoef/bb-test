"use client";
import { SessionProvider } from "next-auth/react";
import Header from "@/components/constants/header";
import Footer from "@/components/constants/footer";
import MobileBottomNav from "@/components/constants/mobile-bottom-nav";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";
import AppProvider from "@/providers/AppProvider";
import { TranslationProvider } from "@/lib/i18n/client";
import { Locale } from "@/lib/i18n/config";
import { useEffect } from "react";

interface ClientLayoutProps {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialTranslations?: Record<string, any>;
}

export default function ClientLayout({
  children,
  initialLocale,
  initialTranslations,
}: ClientLayoutProps) {
  const pathname = usePathname();

  // Debug to see what's being passed
  useEffect(() => {
    console.log("[CLIENT] ClientLayout received:", {
      initialLocale,
      hasTranslations: !!initialTranslations,
      translationKeys: initialTranslations
        ? Object.keys(initialTranslations)
        : [],
    });
  }, []);

  return (
    <SessionProvider>
      <TranslationProvider
        initialLocale={initialLocale}
        initialTranslations={initialTranslations}
      >
        <AppProvider>
          {pathname !== "/plaatsen" && !pathname.startsWith("/admin") && (
            <Header />
          )}
          {children}
          {pathname !== "/plaatsen" && !pathname.startsWith("/admin") && (
            <Footer />
          )}
          {!pathname.startsWith("/admin") && <MobileBottomNav />}
          <Toaster position="top-right" />
        </AppProvider>
      </TranslationProvider>
    </SessionProvider>
  );
}
