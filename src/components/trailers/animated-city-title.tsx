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
    "London",
    "Manchester",
    "Birmingham",
    "Leeds",
    "Glasgow",
    "Liverpool",
    "Bristol",
    "Edinburgh",
    "Cardiff",
    "Belfast",
  ],
  de: [
    "Berlin",
    "Hamburg",
    "München",
    "Köln",
    "Frankfurt",
    "Stuttgart",
    "Düsseldorf",
    "Dortmund",
    "Dresden",
    "Leipzig",
  ],
};

interface AnimatedCityTitleProps {
  selectedCity: string | null | undefined;
}

// Client-side only component to avoid hydration issues
function AnimatedCityTitleClient({ selectedCity }: AnimatedCityTitleProps) {
  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { t, locale } = useTranslation("home");

  // Get the appropriate city list based on locale
  const cities = CITY_LISTS[locale as keyof typeof CITY_LISTS] || CITY_LISTS.nl;

  // Use client-side detection to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Reset city index when locale changes
  useEffect(() => {
    setCurrentCityIndex(0);
  }, [locale]);

  // If a city is selected, show that instead of cycling
  const displayCity = selectedCity || cities[currentCityIndex];
  const isSelected = Boolean(selectedCity);

  // Change city every 3 seconds if no city is selected
  useEffect(() => {
    if (isSelected) return;

    const interval = setInterval(() => {
      setCurrentCityIndex((prevIndex) => (prevIndex + 1) % cities.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isSelected, cities.length]);

  // Only render the animation on the client to avoid hydration issues
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
