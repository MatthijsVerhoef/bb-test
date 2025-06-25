"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import FilterSidebar from "./trailer-filters";

interface FilterWrapperProps {
  currentFilters: {
    mainCategory?: string;
    category?: string;
    type?: string;
    minPrice?: string;
    maxPrice?: string;
    available?: string;
    horizontalWidth?: string;
    verticalWidth?: string;
    height?: string;
    driverLicense?: string;
    accessories?: string[];
    startDate?: string;
    endDate?: string;
  };
}

export default function FilterWrapper({ currentFilters }: FilterWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Force open all filter sections on the home page
  React.useEffect(() => {
    // Wait for hydration to complete
    const timer = setTimeout(() => {
      // Set all filter sections to be open by default
      try {
        const defaultSections = {
          price: true,
          size: true,
          type: true,
          accessories: true,
          license: true,
          dimensions: true,
          dates: true,
        };
        
        // Set this after a brief delay to ensure it doesn't conflict with hydration
        localStorage.setItem(
          "filterSectionStates",
          JSON.stringify(defaultSections)
        );
      } catch (e) {
        console.error("Error setting filter states:", e);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Map between display names and enum values
  const trailerTypeMapping: { [key: string]: string } = {
    "Open aanhanger": "OPEN_AANHANGER",
    "Gesloten aanhanger": "GESLOTEN_AANHANGER",
    Autotransporter: "AUTOTRANSPORTER",
    Boottrailer: "BOOTTRAILER",
    Motortrailers: "MOTORFIETS_AANHANGER",
    "Motorfiets aanhanger": "MOTORFIETS_AANHANGER",
    Paardentrailer: "PAARDENTRAILER",
    Kipper: "KIPPER",
    "Flatbed aanhanger": "FLATBED_AANHANGER",
    "Bagage aanhanger": "BAGAGE_AANHANGER",
    Verkoopwagen: "VERKOOPWAGEN",
    "Fietsen aanhanger": "FIETSEN_AANHANGER",
    "Schamel aanhangers": "SCHAMEL_AANHANGERS",
    Plateauwagens: "PLATEAUWAGENS",
    Overig: "OVERIG",
  };

  const handleFilterChange = (newFilters: any) => {
    // Create a new URLSearchParams object from the current params
    const currentParams = new URLSearchParams(searchParams.toString());

    // First, identify which filters are being removed
    Object.keys(currentFilters).forEach((key) => {
      // If a filter exists in currentFilters but not in newFilters, it was removed
      if (currentFilters[key] && (!newFilters[key] || newFilters[key] === "")) {
        currentParams.delete(key);
      }
    });

    // Handle category/type mapping
    if (newFilters.category && !newFilters.type) {
      // If category is set but type isn't, look up the enum value
      const mappedType = trailerTypeMapping[newFilters.category];
      if (mappedType) {
        newFilters.type = mappedType;
      }
    }

    // Update with new filter values
    Object.entries(newFilters).forEach(([key, value]) => {
      if (key === "accessories" && Array.isArray(value)) {
        // Handle arrays (accessories)
        if (!value.length) {
          currentParams.delete(key);
        } else {
          currentParams.set(key, value.join(","));
        }
      } else if (value === "" || value == null) {
        // Remove empty/null values
        currentParams.delete(key);
      } else {
        // Set the value as string
        currentParams.set(key, String(value));
      }
    });

    // Reset to page 1 when filters change to prevent "page not found" errors
    currentParams.set("page", "1");

    // Only update if params actually changed
    const oldString = searchParams.toString();
    const newString = currentParams.toString();
    if (newString !== oldString) {
      // Use router.push with pathname to maintain the current route
      router.push(`${pathname}?${newString}`, { scroll: false });
    }
  };

  return (
    <FilterSidebar
      currentFilters={currentFilters}
      onFilterChange={handleFilterChange}
    />
  );
}