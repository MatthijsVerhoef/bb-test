"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import FilterSidebar from "./trailer-filters";
import { mapTrailerTypeToEnum } from "@/lib/trailer-type-mapper";

interface FilterWrapperProps {
  currentFilters: {
    mainCategory?: string;
    category?: string;
    type?: string;
    minPrice?: string;
    maxPrice?: string;
    available?: string;
    // Dimension properties - simple string values
    length?: string;
    width?: string;
    height?: string;
    weight?: string;
    capacity?: string;
    driverLicense?: string;
    accessories?: string[];
    // Add date filters from QuickSearch
    startDate?: string;
    endDate?: string;
    // Extra trailer information filters
    licenseType?: string;
    homeDelivery?: string;
    includesInsurance?: string;
    minRentalDuration?: string;
    maxRentalDuration?: string;
  };
}

export default function FilterWrapper({ currentFilters }: FilterWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialRenderRef = useRef(true);

  // Initialize filter states from localStorage on component mount
  useEffect(() => {
    // Only initialize filter states on first mount
    if (initialRenderRef.current && typeof window !== "undefined") {
      initialRenderRef.current = false;

      // Don't run if we're navigating back - let the filters be handled by stored state
      if (
        window.performance &&
        window.performance.navigation.type ===
          window.performance.navigation.TYPE_BACK_FORWARD
      ) {
        return;
      }

      // Initialize filter section states if they don't exist yet
      try {
        const storedStates = localStorage.getItem("filterSectionStates");
        if (!storedStates) {
          // Set initial default states for filter sections - all open
          const defaultSections = {
            price: true,
            size: true,
            type: true,
            accessories: true,
            license: true,
            dimensions: true,
            // Add dates section to defaults (starts open)
            dates: true,
            // Add the delivery options section
            delivery: true,
          };
          localStorage.setItem(
            "filterSectionStates",
            JSON.stringify(defaultSections)
          );
        } else {
          // Make sure we add the dates section to existing stored states
          const existingStates = JSON.parse(storedStates);
          if (existingStates.dates === undefined) {
            existingStates.dates = true;
            localStorage.setItem(
              "filterSectionStates",
              JSON.stringify(existingStates)
            );
          }
        }
      } catch (e) {
        console.error("Error initializing filter states:", e);
      }
    }
  }, []);

  // Use the imported trailer type mapper for consistent mapping

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
      // If category is set but type isn't, look up the enum value using the mapper
      const mappedType = mapTrailerTypeToEnum(newFilters.category);
      if (mappedType) {
        newFilters.type = mappedType;
      }
    }

    // Prepare a where object for dimension filters
    const whereObj: Record<string, any> = {};
    let hasWhereConditions = false;

    // Handle dimension filters separately
    const dimensionKeys = ["length", "width", "height", "weight", "capacity"];

    // Update with new filter values
    Object.entries(newFilters).forEach(([key, value]) => {
      if (key === "accessories" && Array.isArray(value)) {
        // Handle arrays (accessories)
        if (!value.length) {
          currentParams.delete(key);
        } else {
          currentParams.set(key, value.join(","));
        }
      }
      // Handle dimension filters separately to add gte operator
      else if (dimensionKeys.includes(key)) {
        if (value === "" || value == null) {
          currentParams.delete(key);
        } else {
          // Add to where object with gte operator
          whereObj[key] = { gte: String(value) };
          hasWhereConditions = true;
          // Remove from regular params since we're handling in where
          currentParams.delete(key);
        }
      } else if (value === "" || value == null) {
        // Remove empty/null values
        currentParams.delete(key);
      } else {
        // Set the value as string
        currentParams.set(key, String(value));
      }
    });

    // If we have dimension filters, add them to where parameter
    if (hasWhereConditions) {
      currentParams.set("where", encodeURIComponent(JSON.stringify(whereObj)));
    } else {
      currentParams.delete("where");
    }

    currentParams.set("page", "1");

    const oldString = searchParams.toString();
    const newString = currentParams.toString();
    if (newString !== oldString) {
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
