"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n/client";
import { useRouter, useSearchParams } from "next/navigation";
import TrailerMap from "@/components/trailers/trailer-map";
import LoadingSpinner from "@/components/trailers/loading-spinnter";
import { TrailersPaginationList } from "@/components/trailers/infinite-list";
import FilterSidebar from "@/components/trailers/trailer-filters";
import AnimatedCityTitle from "@/components/trailers/animated-city-title";
import TrailerSeoContent from "@/components/seo/trailer-seo-content";
import FAQSection from "@/components/seo/home-faq";
import ResetPasswordDialog from "@/components/constants/auth/reset-password-dialog";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { List, Map, Filter, X } from "lucide-react";

interface HomePageClientProps {
  currentFilters: any;
  activeFilterCount: number;
  selectedCity?: string;
  mapMarkers: any[];
  processedTrailers: any[];
  page: number;
  limit: number;
  totalPages: number;
  startDate?: string;
  onViewChange?: (view: string) => void;
}

export default function HomePageClient({
  currentFilters,
  activeFilterCount,
  selectedCity,
  mapMarkers,
  processedTrailers,
  page,
  limit,
  totalPages,
  startDate,
  onViewChange,
}: HomePageClientProps) {
  const { t } = useTranslation("home");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState("list");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;
  
  // Reset password dialog state
  const resetToken = searchParams.get("resetToken");
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(!!resetToken);

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

    if (oldString !== newString) {
      // Navigate to the new URL with updated filters - use refresh to trigger server re-render
      const newUrl = `${window.location.pathname}?${newString}`;
      router.push(newUrl);
      // Force refresh to ensure server component re-renders with new search params
      router.refresh();
    }
  };

  // Initialize view from URL parameter
  useEffect(() => {
    const urlView = searchParams.get("view");
    if (urlView === "map") {
      setView("map");
      onViewChange?.("map");
    } else {
      setView("list");
      onViewChange?.("list");
    }
  }, [searchParams, onViewChange]);
  
  // Update reset password dialog state when the resetToken query parameter changes
  useEffect(() => {
    setShowResetPasswordDialog(!!resetToken);
  }, [resetToken]);

  // Mobile header and navigation sync
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileHeader, setShowMobileHeader] = useState(true);

  // Check for mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // Sync with header and mobile bottom nav scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);

      // Only trigger if scroll distance is above threshold
      if (scrollDifference < scrollThreshold) return;

      if (isMobile) {
        // Mobile: sync with header behavior
        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          // Scrolling down - hide mobile header and nav
          setShowMobileHeader(false);
          setIsNavVisible(false);
        } else if (currentScrollY < lastScrollY.current) {
          // Scrolling up - show mobile header and nav
          setShowMobileHeader(true);
          setIsNavVisible(true);
        }
      } else {
        // Desktop: use mobile bottom nav logic (same as mobile bottom nav component)
        // Show when scrolling up or at top of page
        if (currentScrollY < lastScrollY.current || currentScrollY < 100) {
          setIsNavVisible(true);
        }
        // Hide when scrolling down
        else if (currentScrollY > lastScrollY.current) {
          setIsNavVisible(false);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMobile]);

  // Handle view change with URL parameter update
  const handleViewChange = (newView: string) => {
    setView(newView);
    onViewChange?.(newView);

    const params = new URLSearchParams(searchParams.toString());
    if (newView === "map") {
      params.set("view", "map");
    } else {
      params.delete("view");
    }

    // Update URL without page reload
    const newUrl = params.toString() ? `/?${params.toString()}` : "/";
    router.replace(newUrl, { scroll: false });
  };
  
  // Handle closing the reset password dialog
  const handleResetPasswordDialogClose = () => {
    setShowResetPasswordDialog(false);
    
    // Remove the resetToken from the URL without page reload
    const params = new URLSearchParams(searchParams.toString());
    params.delete("resetToken");
    
    // Update URL without page reload, preserving other parameters
    const newUrl = params.toString() ? `/?${params.toString()}` : "/";
    router.replace(newUrl, { scroll: false });
  };

  return (
    <>
      {/* Reset Password Dialog */}
      {resetToken && (
        <ResetPasswordDialog 
          isOpen={showResetPasswordDialog} 
          onClose={handleResetPasswordDialogClose} 
          resetToken={resetToken}
        />
      )}
      
      {/* Desktop Layout - Exactly as original, hidden on mobile */}
      <div className="hidden lg:block">
        <div className="flex items-start container mx-auto relative w-[1200px] mt-16">
          <div className="w-[320px] me-10 flex flex-col">
            <span className="text-sm text-[#6B798B]">{t("sortBy.label")}</span>
            <div className="flex items-center mt-2 bg-[#F6F8F9] pr-2 rounded-md">
              <select
                className="bg-[#F6F8F9] flex-1 text-sm rounded-md py-3 px-3"
                defaultValue="default"
              >
                <option value="default">{t("sortBy.options.default")}</option>
                <option value="priceLowToHigh">
                  {t("sortBy.options.priceLowToHigh")}
                </option>
                <option value="priceHighToLow">
                  {t("sortBy.options.priceHighToLow")}
                </option>
                <option value="rating">{t("sortBy.options.rating")}</option>
                <option value="distance">{t("sortBy.options.distance")}</option>
              </select>
            </div>

            {/* Client-side Filter */}
            <FilterSidebar
              currentFilters={currentFilters}
              onFilterChange={handleFilterChange}
            />
          </div>
          <div className="flex flex-col flex-1">
            <AnimatedCityTitle selectedCity={selectedCity} />

            <div className="mt-5 mb-7 flex items-center justify-between">
              <span className="text-[#8997AA] text-sm">
                {activeFilterCount === 0
                  ? t("activeFilters.none")
                  : activeFilterCount === 1
                  ? t("activeFilters.single")
                  : `${activeFilterCount} ${t("activeFilters.multiple")}`}
              </span>
              <div className="flex items-center ms-auto">
                <Button
                  variant={"ghost"}
                  className="me-1"
                  onClick={() => handleViewChange("list")}
                >
                  <List className={view === "list" ? "text-primary" : ""} />
                </Button>
                <div className="w-[1px] h-[20px] bg-[#dddddd]" />
                <Button
                  variant={"ghost"}
                  className="ms-1"
                  onClick={() => handleViewChange("map")}
                >
                  <Map className={view === "map" ? "text-primary" : ""} />
                </Button>
              </div>
            </div>

            <Suspense
              key={`map-${selectedCity || "all"}-${startDate || ""}`}
              fallback={<LoadingSpinner />}
            >
              <div
                className={
                  view === "map"
                    ? "fixed top-0 z-[9] left-0 h-screen min-h-screen w-screen"
                    : ""
                }
              >
                {view === "map" && (
                  <div className="flex h-11 px-1 items-center rounded-full bg-white absolute top-[80px] z-[10] right-4">
                    <Button
                      variant={"ghost"}
                      className="me-1 rounded-full size-9"
                      onClick={() => handleViewChange("list")}
                    >
                      <List className={view === "list" ? "text-primary" : ""} />
                    </Button>
                    <div className="w-[1px] h-[20px] bg-[#dddddd]" />
                    <Button
                      variant={"ghost"}
                      className="ms-1 rounded-full size-9"
                      onClick={() => handleViewChange("map")}
                    >
                      <Map className={view === "map" ? "text-primary" : ""} />
                    </Button>
                  </div>
                )}
                <TrailerMap markers={mapMarkers} zoom={16} view={view} />
              </div>
            </Suspense>

            <div className="mt-10">
              <TrailersPaginationList
                initialTrailers={processedTrailers}
                initialPage={page}
                limit={limit}
                totalPages={totalPages}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - New responsive version */}
      <div className="lg:hidden container mx-auto relative px-4 sm:px-6 mt-0 md:mt-16 md:pb-24">
        <div className="flex flex-col w-full">
          <AnimatedCityTitle selectedCity={selectedCity} />

          <div className="mt-5 mb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span className="text-[#8997AA] text-sm">
              {activeFilterCount === 0
                ? t("activeFilters.none")
                : activeFilterCount === 1
                ? t("activeFilters.single")
                : `${activeFilterCount} ${t("activeFilters.multiple")}`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant={"ghost"}
                className={`flex-1 sm:flex-none ${
                  view === "list" ? "bg-gray-100" : ""
                }`}
                onClick={() => handleViewChange("list")}
              >
                <List
                  className={`h-4 w-4 ${view === "list" ? "text-primary" : ""}`}
                />
                <span className="sm:hidden ml-2">List</span>
              </Button>
              <div className="hidden sm:block w-[1px] h-[20px] bg-[#dddddd]" />
              <Button
                variant={"ghost"}
                className="flex-1 sm:flex-none"
                onClick={() => handleViewChange("map")}
              >
                <Map
                  className={`h-4 w-4 ${view === "map" ? "text-primary" : ""}`}
                />
                <span className="sm:hidden ml-2">Map</span>
              </Button>
            </div>
          </div>

          <Suspense
            key={`map-${selectedCity || "all"}-${startDate || ""}`}
            fallback={<LoadingSpinner />}
          >
            <div
              className={
                view === "map"
                  ? "fixed top-0 z-[9] left-0 h-screen min-h-screen w-screen"
                  : "w-full"
              }
            >
              {view === "map" && (
                <div className="flex h-11 px-1 items-center rounded-full bg-white absolute top-[80px] z-[10] right-4">
                  <Button
                    variant={"ghost"}
                    className="me-1 rounded-full size-9"
                    onClick={() => handleViewChange("list")}
                  >
                    <List className={view === "list" ? "text-primary" : ""} />
                  </Button>
                  <div className="w-[1px] h-[20px] bg-[#dddddd]" />
                  <Button
                    variant={"ghost"}
                    className="ms-1 rounded-full size-9"
                    onClick={() => handleViewChange("map")}
                  >
                    <Map className={view === "map" ? "text-primary" : ""} />
                  </Button>
                </div>
              )}
              <TrailerMap markers={mapMarkers} zoom={16} view={view} />
            </div>
          </Suspense>

          <div className="mt-4 md:mt-10 w-full">
            <TrailersPaginationList
              initialTrailers={processedTrailers}
              initialPage={page}
              limit={limit}
              totalPages={totalPages}
            />
          </div>
        </div>
      </div>

      {/* Sticky Filter Button - Mobile Only */}
      <div
        className={`
          lg:hidden fixed left-0 right-0 z-80
          transform transition-all duration-300 ease-in-out
        `}
        style={{
          bottom: isMobile
            ? isNavVisible
              ? "64px"
              : "16px" // 64px = 4rem (bottom-16), 16px = 1rem (bottom-4)
            : isNavVisible
            ? "64px"
            : "16px",
          transform:
            isMobile && !showMobileHeader
              ? "translateY(-44px)"
              : "translateY(0)",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
            <SheetTrigger asChild>
              <Button className="w-full max-w-xs mx-auto bg-primary rounded-full shadow-lg text-white flex items-center justify-center gap-2 h-12">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-primary text-white text-xs rounded-full px-2 py-1 ml-1">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-[400px] p-0">
              <SheetHeader className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <SheetTitle>Filters</SheetTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilterSheet(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </SheetHeader>
              <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
                {/* Mobile Sort */}
                <div className="mb-6">
                  <span className="text-sm text-[#6B798B] mb-2 block">
                    {t("sortBy.label")}
                  </span>
                  <select
                    className="w-full bg-[#F6F8F9] text-sm rounded-md py-3 px-3"
                    defaultValue="default"
                  >
                    <option value="default">
                      {t("sortBy.options.default")}
                    </option>
                    <option value="priceLowToHigh">
                      {t("sortBy.options.priceLowToHigh")}
                    </option>
                    <option value="priceHighToLow">
                      {t("sortBy.options.priceHighToLow")}
                    </option>
                    <option value="rating">{t("sortBy.options.rating")}</option>
                    <option value="distance">
                      {t("sortBy.options.distance")}
                    </option>
                  </select>
                </div>

                {/* Mobile Filter */}
                <FilterSidebar
                  currentFilters={currentFilters}
                  onFilterChange={handleFilterChange}
                  isMobileSheet={true}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
