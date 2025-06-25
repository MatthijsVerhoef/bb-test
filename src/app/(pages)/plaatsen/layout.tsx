// app/(trailer-listing)/layout.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { LanguageDropdown } from "@/components/ui/language-dropdown";
import { useTranslation } from "@/lib/i18n/client";

export default function TrailerListingLayout({ children }) {
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation("addTrailer");

  const saveAsConcept = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error saving concept:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Custom header for trailer listing flow */}
      <header className="bg-white border-b border-gray-200 py-2.5 px-0 fixed top-0 left-0 right-0 z-10">
        <div className="flex justify-between items-center max-w-[1200px] mx-auto px-3 xl:px-0">
          {/* Logo and back button */}
          <div className="flex items-center">
            <Link href="/" className="z-20 relative">
              <p className="font-bold text-lg">
                <span className="text-primary">Buur</span>
                <span className="text-green-700">Bak</span>
              </p>
            </Link>
          </div>

          {/* Language selector and save button */}
          <div className="flex items-center gap-3">
            <LanguageDropdown />
          </div>
        </div>
      </header>

      {/* Main content with padding to account for fixed header */}
      <main className="flex-grow pt-16 pb-0">{children}</main>
    </div>
  );
}
