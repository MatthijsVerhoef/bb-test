"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";
import {
  locales,
  localeNames,
  localeFlagPaths,
  Locale,
} from "@/lib/i18n/config";

export function LanguageDropdown() {
  const { locale, setLocale, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageSelect = async (newLocale: Locale) => {
    await setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label={t("language.select")}
      >
        <Image
          src={localeFlagPaths[locale]}
          alt={localeNames[locale]}
          width={20}
          height={20}
          className="object-cover min-h-5 rounded-full"
        />
        <span className="text-sm font-medium">{locale.toUpperCase()}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white border border-gray-200 py-1 z-50">
          {locales.map((lng) => (
            <button
              key={lng}
              onClick={() => handleLanguageSelect(lng)}
              className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                locale === lng ? "bg-gray-50" : ""
              }`}
            >
              <Image
                src={localeFlagPaths[lng]}
                alt={localeNames[lng]}
                width={20}
                height={20}
                className="object-cover min-h-5 rounded-full"
              />
              <span className="text-sm">{localeNames[lng]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
