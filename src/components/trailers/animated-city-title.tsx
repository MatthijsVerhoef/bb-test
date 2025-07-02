"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useTranslation } from "@/lib/i18n/client";

// City lists for different locales
const CITY_LISTS = {
  nl: [
    "Amsterdam",
    "Rotterdam",
    "Utrecht",
    "Den Haag",
    "Eindhoven",
    "Groningen",
    "Amersfoort",
    "Nijmegen",
    "Tilburg",
    "Breda",
  ],
  en: [
    "Amsterdam",
    "Rotterdam",
    "Utrecht",
    "Den Haag",
    "Eindhoven",
    "Groningen",
    "Amersfoort",
    "Nijmegen",
    "Tilburg",
    "Breda",
  ],
  de: [
    "Amsterdam",
    "Rotterdam",
    "Utrecht",
    "Den Haag",
    "Eindhoven",
    "Groningen",
    "Amersfoort",
    "Nijmegen",
    "Tilburg",
    "Breda",
  ],
};

interface AnimatedCityTitleProps {
  selectedCity: string | null | undefined;
}

function AnimatedCityTitleClient({ selectedCity }: AnimatedCityTitleProps) {
  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { t, locale } = useTranslation("home");

  const cities = CITY_LISTS[locale as keyof typeof CITY_LISTS] || CITY_LISTS.nl;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setCurrentCityIndex(0);
  }, [locale]);

  const displayCity = selectedCity || cities[currentCityIndex];
  const isSelected = Boolean(selectedCity);

  useEffect(() => {
    if (isSelected) return;

    const interval = setInterval(() => {
      setCurrentCityIndex((prevIndex) => (prevIndex + 1) % cities.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isSelected, cities.length]);

  if (!isClient) {
    return (
      <h1 className="text-[#8997AA] font-semibold text-[32px] flex flex-wrap">
        {t("cityTitle.rentTrailerIn")}
        <span className="text-primary ml-0 md:ml-2 inline-block">
          {selectedCity || cities[0]}
        </span>
      </h1>
    );
  }

  return (
    <h1 className="text-[#8997AA] font-semibold text-[32px] flex flex-wrap">
      {t("cityTitle.rentTrailerIn")}
      <AnimatePresence mode="wait">
        <motion.span
          key={displayCity}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
          className="text-primary ml-0 md:ml-2 inline-block"
        >
          {displayCity}
        </motion.span>
      </AnimatePresence>
    </h1>
  );
}

// Loading component that also uses translations
const LoadingComponent = () => {
  const { t, locale } = useTranslation("home");
  const cities = CITY_LISTS[locale as keyof typeof CITY_LISTS] || CITY_LISTS.nl;
  return (
    <h1 className="text-[#8997AA] font-semibold text-[32px] flex flex-wrap">
      {t("cityTitle.rentTrailerIn")}
      <span className="text-primary ml-0 md:ml-2 inline-block">
        {cities[0]}
      </span>
    </h1>
  );
};

// Use dynamic import to disable SSR for this component
const AnimatedCityTitle = dynamic(
  () => Promise.resolve(AnimatedCityTitleClient),
  {
    ssr: false,
    loading: () => <LoadingComponent />,
  }
);

export default AnimatedCityTitle;
