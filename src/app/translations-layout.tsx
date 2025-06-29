// app/translations-layout.tsx
import { cookies } from "next/headers";
import { defaultLocale, Locale } from "@/lib/i18n/config";
import { bundledTranslations } from "@/lib/i18n/translations/index";
import ClientLayout from "./client-layout";

// Get locale from cookies (server-side)
async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const preferredLocale = cookieStore.get("preferred-locale")?.value as Locale;

  if (preferredLocale && ["nl", "en", "de"].includes(preferredLocale)) {
    return preferredLocale;
  }

  return defaultLocale;
}

export default async function TranslationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getServerLocale();
  // Use bundled translations instead of file system reads
  const translations = bundledTranslations[locale];

  return (
    <ClientLayout initialLocale={locale} initialTranslations={translations}>
      {children}
    </ClientLayout>
  );
}
