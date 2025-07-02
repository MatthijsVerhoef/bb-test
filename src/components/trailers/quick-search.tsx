"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPinIcon,
  Search,
  X,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  isBefore,
} from "date-fns";
import { nl, enUS, de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "@/lib/i18n/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuickSearchProps {
  location: string;
  setLocation: (value: string) => void;
  dateRange: any;
  setDateRange: (value: any) => void;
  showMobileHeader: boolean;
}

// Custom Calendar component with proper styling
const CustomCalendar = ({
  mode,
  selected,
  onSelect,
  disabled,
  numberOfMonths = 1,
  locale: dateLocale,
}: any) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const weekDays =
    dateLocale === nl
      ? ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"]
      : dateLocale === de
      ? ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const isDateDisabled = (date: Date) => {
    if (disabled && typeof disabled === "function") {
      return disabled(date);
    }
    return false;
  };

  const isDateInRange = (date: Date) => {
    if (!selected?.from || !selected?.to) return false;
    return isWithinInterval(date, { start: selected.from, end: selected.to });
  };

  const isDateRangeStart = (date: Date) => {
    return selected?.from && isSameDay(date, selected.from);
  };

  const isDateRangeEnd = (date: Date) => {
    return selected?.to && isSameDay(date, selected.to);
  };

  const isDateHovered = (date: Date) => {
    if (!selected?.from || selected?.to || !hoveredDate) return false;
    if (isBefore(hoveredDate, selected.from)) return false;
    return isWithinInterval(date, { start: selected.from, end: hoveredDate });
  };

  const getDayClass = (date: Date, displayMonth: Date) => {
    const isDisabled = isDateDisabled(date);
    const isToday = isSameDay(date, new Date());
    const isRangeStart = isDateRangeStart(date);
    const isRangeEnd = isDateRangeEnd(date);
    const isInRange = isDateInRange(date);
    const isHovered = isDateHovered(date);
    const isSelected = isRangeStart || isRangeEnd;
    const isCurrentMonth = isSameMonth(date, displayMonth);

    return cn(
      "relative h-9 w-9 p-0 font-normal text-sm rounded-md transition-all",
      "hover:bg-gray-100 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary/20",
      {
        // Base states
        "text-gray-900": !isDisabled && !isSelected && isCurrentMonth,
        "text-gray-300 cursor-not-allowed hover:bg-transparent": isDisabled,

        // Today
        "font-semibold": isToday,

        // Selected dates
        "bg-primary text-white hover:bg-primary/90": isSelected,

        // Range states
        "bg-primary/10 hover:bg-primary/20 rounded-none":
          isInRange && !isSelected,
        "rounded-l-md": isRangeStart && selected?.to,
        "rounded-r-md": isRangeEnd && selected?.from,

        // Hover range preview
        "bg-gray-100": isHovered && !isInRange,

        // Outside current month - only gray out if not selected and in a different month than the one being displayed
        "text-gray-400":
          !isCurrentMonth && !isSelected && !isInRange && !isHovered,
      }
    );
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (!selected?.from || (selected?.from && selected?.to)) {
      // Starting a new selection
      onSelect({ from: date, to: undefined });
    } else {
      // Completing the range
      if (isBefore(date, selected.from)) {
        // If clicked date is before start, reset to new start
        onSelect({ from: date, to: undefined });
      } else {
        // Complete the range
        onSelect({ from: selected.from, to: date });
      }
    }
  };

  const renderMonth = (monthOffset: number) => {
    const displayMonth = addMonths(currentMonth, monthOffset);
    const monthStart = startOfMonth(displayMonth);
    const monthEnd = endOfMonth(displayMonth);
    const startDate = new Date(monthStart);
    const endDate = new Date(monthEnd);

    // Adjust to start on Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());
    // Adjust to end on Saturday
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          {monthOffset === 0 && (
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          <h2
            className={cn(
              "text-sm font-semibold mx-auto text-gray-900",
              monthOffset === 0 && numberOfMonths === 1 ? "" : "text-center",
              monthOffset === 0 && numberOfMonths > 1 ? "" : "",
              monthOffset > 0 ? "" : ""
            )}
          >
            {format(displayMonth, "MMMM yyyy", { locale: dateLocale })}
          </h2>

          {monthOffset === numberOfMonths - 1 && (
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="h-9 w-9 flex items-center justify-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, dayIdx) => (
            <button
              key={dayIdx}
              onClick={() => handleDateClick(day)}
              onMouseEnter={() => setHoveredDate(day)}
              onMouseLeave={() => setHoveredDate(null)}
              disabled={isDateDisabled(day)}
              className={getDayClass(day, displayMonth)}
            >
              <time dateTime={format(day, "yyyy-MM-dd")}>
                {format(day, "d")}
              </time>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("bg-white rounded-xl", numberOfMonths > 1 && "flex")}>
      {Array.from({ length: numberOfMonths }).map((_, i) => (
        <div key={i} className={cn(i > 0 && "")}>
          {renderMonth(i)}
        </div>
      ))}
    </div>
  );
};

const QuickSearch = ({
  location,
  setLocation,
  dateRange,
  setDateRange,
  showMobileHeader,
}: QuickSearchProps) => {
  const router = useRouter();
  const { t, locale } = useTranslation("home");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const locationDebounceTimer = useRef<NodeJS.Timeout>();
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const [mobileActiveSection, setMobileActiveSection] = useState<
    "location" | "dates" | null
  >(null);

  // Load popular cities on component mount
  useEffect(() => {
    const loadPopularCities = async () => {
      try {
        const response = await fetch("/api/locations");
        if (response.ok) {
          const cities = await response.json();
          setLocationSuggestions(cities);
        }
      } catch (error) {
        console.error("Failed to load popular cities:", error);
        // Fallback to hardcoded cities if API fails
        const fallbackCities = [
          "Amsterdam",
          "Rotterdam",
          "Den Haag",
          "Utrecht",
          "Eindhoven",
          "Tilburg",
          "Groningen",
          "Almere",
          "Breda",
          "Nijmegen",
        ];
        setLocationSuggestions(fallbackCities);
      }
    };

    loadPopularCities();
  }, []);

  const dateLocale = locale === "nl" ? nl : locale === "de" ? de : enUS;

  useEffect(() => {
    const fetchLocations = async () => {
      if (location.trim() === "") {
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/locations?query=${encodeURIComponent(location)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch locations");
        }

        const data = await response.json();
        setLocationSuggestions(data);
      } catch (error) {
        console.error("Error fetching locations:", error);
        // Keep existing suggestions on error
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if user is typing
    if (location.trim() !== "") {
      // Debounce API calls
      clearTimeout(locationDebounceTimer.current);
      locationDebounceTimer.current = setTimeout(() => {
        fetchLocations();
      }, 300);
    }

    return () => clearTimeout(locationDebounceTimer.current);
  }, [location]);

  // Handle click outside suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle location selection
  const handleLocationSelect = (selected: string) => {
    setLocation(selected);
    setShowSuggestions(false);
  };

  // Format arrival date display
  const formatArrivalDate = () => {
    if (!dateRange?.from) return t("quickSearch.addDates");
    return format(dateRange.from, "d MMM", { locale: dateLocale });
  };

  // Format departure date display
  const formatDepartureDate = () => {
    if (!dateRange?.to) return t("quickSearch.addDates");
    return format(dateRange.to, "d MMM", { locale: dateLocale });
  };

  // Handle search button click
  const handleSearch = () => {
    // Build query parameters
    const params = new URLSearchParams();

    if (location) {
      params.set("city", location);
    }

    if (dateRange?.from) {
      params.set("startDate", format(dateRange.from, "yyyy-MM-dd"));

      if (dateRange.to) {
        params.set("endDate", format(dateRange.to, "yyyy-MM-dd"));
      } else {
        params.set("endDate", format(dateRange.from, "yyyy-MM-dd"));
      }
    }

    // Navigate to trailers page with filters
    router.push(`/?${params.toString()}`);
  };

  // Handle popover changes
  const togglePopover = (popover: string) => {
    if (activePopover === popover) {
      setActivePopover(null);
    } else {
      setActivePopover(popover);
    }
  };

  // Handle mobile overlay
  const openMobileOverlay = (section: "location" | "dates") => {
    setShowMobileOverlay(true);
    setMobileActiveSection(section);
  };

  const closeMobileOverlay = () => {
    setShowMobileOverlay(false);
    setMobileActiveSection(null);
  };

  const openMobileSection = (section: "location" | "dates") => {
    setMobileActiveSection(section);
  };

  // Handle Enter key in location input
  const handleLocationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (locationSuggestions.length > 0) {
        handleLocationSelect(locationSuggestions[0]);
      }
      handleSearch();
    }
  };

  // Preload trailers data for quick response after search
  const preloadTrailers = () => {
    const queryParams = new URLSearchParams();
    if (location) queryParams.set("city", location);
    if (dateRange?.from)
      queryParams.set("startDate", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to)
      queryParams.set("endDate", format(dateRange.to, "yyyy-MM-dd"));

    // Preload first page of results
    fetch(`/api/trailers/quick-search?${queryParams.toString()}`);
  };

  // Preload data when search parameters change
  useEffect(() => {
    if (location || (dateRange?.from && dateRange?.to)) {
      const debouncePreload = setTimeout(() => {
        preloadTrailers();
      }, 500);

      return () => clearTimeout(debouncePreload);
    }
  }, [location, dateRange]);

  // Prevent body scroll when mobile overlay is open
  useEffect(() => {
    if (showMobileOverlay) {
      // Store original overflow style
      const originalStyle = document.body.style.overflow;

      // Prevent scrolling
      document.body.style.overflow = "hidden";

      // Cleanup function to restore scroll
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showMobileOverlay]);

  return (
    <>
      {/* Desktop Quick Search */}
      <div className="hidden lg:flex justify-center items-center px-4 sm:px-0">
        <div className="relative bg-white rounded-full shadow-md border border-gray-200 flex items-center h-16 px-2 w-auto max-w-4xl">
          {/* Location */}
          <div className="relative">
            <div className="h-full min-w-[250px] flex flex-col px-6 py-2">
              <span className="text-xs font-semibold mb-1">
                {t("quickSearch.rentTrailerIn")}
              </span>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  setShowSuggestions(true);
                }}
                onKeyDown={handleLocationKeyDown}
                placeholder={t("quickSearch.wherePlaceholder")}
                className="border-0 ring-0  border-none shadow-none focus:ring-0 focus:outline-none p-0 h-auto text-sm bg-transparent placeholder:text-gray-500"
                style={{ boxShadow: "none" }}
              />
            </div>

            {/* Location suggestions dropdown */}
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-2 max-h-60 overflow-y-auto"
              >
                {isLoading ? (
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    {t("quickSearch.searching")}
                  </div>
                ) : locationSuggestions.length > 0 ? (
                  <>
                    {location.trim() === "" && (
                      <div className="px-4 py-2 text-xs font-semibold text-gray-600">
                        Populaire steden
                      </div>
                    )}
                    {locationSuggestions.map((suggestion) => (
                      <div
                        key={suggestion}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center outline-0 last:border-b-0"
                        onClick={() => handleLocationSelect(suggestion)}
                      >
                        <MapPinIcon className="mr-3 h-4 w-4 text-gray-400" />
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    ))}
                  </>
                ) : location.trim() !== "" ? (
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    {t("quickSearch.noLocationsFound")}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-300 my-auto"></div>

          {/* Desktop Dates */}
          <div className="flex">
            {/* Arrival date */}
            <div className="relative">
              <Popover
                open={activePopover === "arrival"}
                onOpenChange={() => togglePopover("arrival")}
              >
                <PopoverTrigger asChild>
                  <button
                    className="h-full flex flex-col min-w-[230px] px-6 py-2 rounded-full hover:bg-gray-100 transition-colors text-left"
                    onClick={() => togglePopover("arrival")}
                  >
                    <span className="text-xs font-semibold">
                      {t("quickSearch.pickup")}
                    </span>
                    <span className="text-gray-500 text-sm mt-0.5">
                      {formatArrivalDate()}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 mt-1.5 rounded-2xl border shadow-xl"
                  align="start"
                >
                  <CustomCalendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range: any) => {
                      setDateRange(range);
                      if (range?.from && range?.to) {
                        setActivePopover(null);
                      }
                    }}
                    disabled={(date: Date) => date < new Date()}
                    numberOfMonths={
                      typeof window !== "undefined" && window.innerWidth >= 768
                        ? 2
                        : 1
                    }
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-300 my-auto"></div>

            {/* Departure date */}
            <div className="relative">
              <Popover
                open={activePopover === "departure"}
                onOpenChange={() => togglePopover("departure")}
              >
                <PopoverTrigger asChild>
                  <button
                    className="h-full flex flex-col min-w-[230px] px-6 py-2 rounded-full hover:bg-gray-100 transition-colors text-left"
                    onClick={() => togglePopover("departure")}
                  >
                    <span className="text-xs font-semibold">
                      {t("quickSearch.return")}
                    </span>
                    <span className="text-gray-500 text-sm mt-0.5">
                      {formatDepartureDate()}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 mt-1.5 rounded-2xl border shadow-xl"
                  align="start"
                >
                  <CustomCalendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range: any) => {
                      setDateRange(range);
                      if (range?.from && range?.to) {
                        setActivePopover(null);
                      }
                    }}
                    disabled={(date: Date) => date < new Date()}
                    numberOfMonths={
                      typeof window !== "undefined" && window.innerWidth >= 768
                        ? 2
                        : 1
                    }
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Search button */}
          <Button
            onClick={handleSearch}
            className="w-12 ml-4 rounded-full bg-primary hover:bg-primary/90 text-white h-12 p-0 flex items-center justify-center"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Quick Search - Compact Button */}
      <div className="lg:hidden px-0 my-0">
        <button
          onClick={() => setShowMobileOverlay(true)}
          className="w-full bg-white rounded-full shadow-sm border border-gray-200 p-2 ps-4 text-left flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-center w-full justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 text-gray-600">
                {/* <Search className="h-4 w-4" /> */}
                {location || (dateRange?.from && dateRange?.to) ? (
                  <div className="text-sm text-gray-500">
                    {location && <span>{location}</span>}
                    {location && dateRange?.from && dateRange?.to && (
                      <span> • </span>
                    )}
                    {dateRange?.from && dateRange?.to && (
                      <span>
                        {formatArrivalDate()} - {formatDepartureDate()}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm font-medium">
                    {t("quickSearch.search") || "Zoek een aanhanger"}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-primary text-white rounded-full p-2">
              <Search className="h-4 w-4" />
            </div>
          </div>
        </button>
      </div>

      {/* Mobile Overlay - Under Header */}
      <AnimatePresence>
        {showMobileOverlay && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 bg-black/30 z-30 lg:hidden"
              style={{ top: showMobileHeader ? "110px" : "110px" }}
              onClick={closeMobileOverlay}
            />

            {/* Search Panel */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{
                duration: 0.25,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="fixed left-0 right-0 z-40 lg:hidden bg-transparent"
              style={{
                top: showMobileHeader ? "110px" : "110px",
                transition: "top 0.3s ease-in-out",
              }}
            >
              <div
                className="flex flex-col"
                style={{
                  maxHeight: `calc(100vh - ${
                    showMobileHeader ? "110px" : "110px"
                  })`,
                  transition: "max-height 0.3s ease-in-out",
                }}
              >
                {/* Content */}
                <div className="flex-1 overflow-y-auto pt-2 pb-4 px-4 flex flex-col">
                  <button
                    onClick={closeMobileOverlay}
                    className="p-2 hover:bg-gray-100 bg-white ms-auto relative mb-4 right-0 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-black" />
                  </button>
                  <div className="space-y-4 mx-auto w-full ">
                    {/* Location Section */}
                    <motion.div
                      initial={{ y: 15, opacity: 0, scale: 0.98 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.05,
                        duration: 0.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      className="bg-white relative rounded-2xl p-6 shadow-sm"
                    >
                      <label className="text-sm font-semibold text-gray-900 mb-3 block">
                        {t("quickSearch.rentTrailerIn") || "Locatie"}
                      </label>
                      <div className="relative">
                        <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="text"
                          value={location}
                          onChange={(e) => {
                            setLocation(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => {
                            setShowSuggestions(true);
                          }}
                          onKeyDown={handleLocationKeyDown}
                          placeholder={
                            t("quickSearch.wherePlaceholder") ||
                            "Stad of postcode"
                          }
                          className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl shadow-none"
                          autoFocus
                        />
                      </div>

                      {/* Location suggestions */}
                      <AnimatePresence>
                        {showSuggestions && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, y: -5 }}
                            animate={{ height: "auto", opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -5 }}
                            transition={{
                              duration: 0.15,
                              ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            className="mt-3 space-y-1 max-h-48 overflow-y-auto pt-3"
                          >
                            {location.trim() === "" && (
                              <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 rounded-lg mb-2">
                                Populaire steden
                              </div>
                            )}
                            {isLoading ? (
                              <div className="px-3 py-3 text-gray-500 text-sm text-center">
                                {t("quickSearch.searching") || "Zoeken..."}
                              </div>
                            ) : locationSuggestions.length > 0 ? (
                              locationSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  className="w-full px-3 py-3 hover:bg-gray-50 text-left rounded-lg flex items-center space-x-3 transition-colors border border-transparent hover:border-gray-200"
                                  onClick={() => {
                                    handleLocationSelect(suggestion);
                                    setShowSuggestions(false);
                                  }}
                                >
                                  <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm font-medium">
                                    {suggestion}
                                  </span>
                                </button>
                              ))
                            ) : location.trim() !== "" ? (
                              <div className="px-3 py-3 text-gray-500 text-sm text-center">
                                {t("quickSearch.noLocationsFound") ||
                                  "Geen locaties gevonden"}
                              </div>
                            ) : null}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Dates Section - Expandable */}
                    <motion.div
                      initial={{ y: 15, opacity: 0, scale: 0.98 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.1,
                        duration: 0.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setShowSuggestions(false);
                          setMobileActiveSection(
                            mobileActiveSection === "dates" ? null : "dates"
                          );
                        }}
                        className="w-full p-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            Ophalen / Terugbrengen
                          </h3>
                          <p className="text-sm text-gray-500">
                            {dateRange?.from && dateRange?.to
                              ? `${formatArrivalDate()} - ${formatDepartureDate()}`
                              : t("quickSearch.addDates") || "Selecteer datums"}
                          </p>
                        </div>
                        <motion.div
                          animate={{
                            rotate: mobileActiveSection === "dates" ? 180 : 0,
                          }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </motion.div>
                      </button>

                      {/* Expandable Calendar Section */}
                      <AnimatePresence>
                        {mobileActiveSection === "dates" && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              duration: 0.2,
                              ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-gray-100 p-4 bg-gray-50">
                              <CustomCalendar
                                mode="range"
                                selected={dateRange}
                                onSelect={(range: any) => {
                                  setDateRange(range);
                                  if (range?.from && range?.to) {
                                    setTimeout(() => {
                                      setMobileActiveSection(null);
                                    }, 500);
                                  }
                                }}
                                disabled={(date: Date) => date < new Date()}
                                numberOfMonths={1}
                                locale={dateLocale}
                              />
                              {dateRange?.from && dateRange?.to && (
                                <div className="mt-4 text-center">
                                  <Button
                                    onClick={() => setMobileActiveSection(null)}
                                    variant="outline"
                                    size="sm"
                                    className="text-sm bg-white"
                                  >
                                    {t("common.done") || "Klaar"}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </div>

                {/* Fixed Bottom Search Button */}
                <motion.div
                  initial={{ y: 20, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{
                    delay: 0.15,
                    duration: 0.2,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="sticky bottom-0 px-4"
                >
                  <Button
                    onClick={() => {
                      closeMobileOverlay();
                      handleSearch();
                    }}
                    className="w-full bg-primary disabled:opacity-90 hover:bg-primary/90 text-white h-12 rounded-xl text-base font-medium"
                    disabled={!location && (!dateRange?.from || !dateRange?.to)}
                  >
                    <Search className="h-5 w-5 mr-2" />
                    {t("quickSearch.search") || "Zoeken"}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickSearch;
