import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  isToday,
  isSameDay,
  getDay,
  isSameMonth,
  subMonths,
} from "date-fns";
import { nl, de, enUS } from "date-fns/locale";
import { ChevronLeft, Lock, Unlock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock translation function for demo
const t = (key, params = {}) => {
  const translations = {
    "lessorCalendar.trailerSelection.title": "Select a Trailer",
    "lessorCalendar.trailerSelection.description":
      "Choose which trailer you want to manage",
    "lessorCalendar.calendar.title": "Calendar for {{trailerName}}",
    "lessorCalendar.calendar.blockDates": "Block",
    "lessorCalendar.calendar.unblockDates": "Unblock",
    "lessorCalendar.calendar.cancel": "Cancel",
    "lessorCalendar.calendar.blockDay": "Block {{count}} day",
    "lessorCalendar.calendar.blockDays": "Block {{count}} days",
    "lessorCalendar.calendar.unblockDay": "Unblock {{count}} day",
    "lessorCalendar.calendar.unblockDays": "Unblock {{count}} days",
    "lessorCalendar.calendar.dayStatus.unavailable": "Unavailable",
    "lessorCalendar.calendar.dayStatus.blocked": "Blocked",
    "lessorCalendar.calendar.rental.more": "+{{count}} more",
    "lessorCalendar.availability.shortDays.MONDAY": "Mon",
    "lessorCalendar.availability.shortDays.TUESDAY": "Tue",
    "lessorCalendar.availability.shortDays.WEDNESDAY": "Wed",
    "lessorCalendar.availability.shortDays.THURSDAY": "Thu",
    "lessorCalendar.availability.shortDays.FRIDAY": "Fri",
    "lessorCalendar.availability.shortDays.SATURDAY": "Sat",
    "lessorCalendar.availability.shortDays.SUNDAY": "Sun",
    "common:locale": "en",
  };

  let text = translations[key] || key;
  Object.entries(params).forEach(([paramKey, value]) => {
    text = text.replace(`{{${paramKey}}}`, value);
  });
  return text;
};

// Sample data types (matching your Prisma schema)
const DAY_NUMBER_TO_ENUM = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

// Mobile Trailer Selection Component
function MobileTrailerSelection({ trailers, onSelectTrailer }) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("lessorCalendar.trailerSelection.title")}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {t("lessorCalendar.trailerSelection.description")}
        </p>
      </div>

      <div className="space-y-3">
        {trailers.map((trailer) => (
          <Card
            key={trailer.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectTrailer(trailer.id)}
          >
            <div className="flex items-center gap-4">
              {trailer.images?.[0]?.url && (
                <img
                  src={trailer.images[0].url}
                  alt={trailer.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{trailer.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">
                    ID: {trailer.id.slice(0, 8)}
                  </span>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Mobile Calendar Component with Infinite Scroll
function MobileCalendarView({
  selectedTrailer,
  trailers,
  rentals,
  blockedPeriods,
  weeklyAvailability,
  onBack,
  onAddBlockedPeriod,
  onRemoveBlockedPeriod,
}) {
  const [visibleMonths, setVisibleMonths] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectionMode, setSelectionMode] = useState("view");
  const scrollContainerRef = useRef(null);
  const monthRefs = useRef({});
  const loadingRef = useRef(false);

  // Get the current trailer data
  const currentTrailer = trailers.find((t) => t.id === selectedTrailer);

  // Initialize with current month and adjacent months
  useEffect(() => {
    const today = new Date();
    const currentMonth = startOfMonth(today);
    setVisibleMonths([
      subMonths(currentMonth, 1),
      currentMonth,
      addMonths(currentMonth, 1),
    ]);
  }, []);

  // Scroll to current month on mount
  useEffect(() => {
    if (visibleMonths.length > 0 && scrollContainerRef.current) {
      const currentMonth = startOfMonth(new Date());
      const currentMonthKey = format(currentMonth, "yyyy-MM");

      setTimeout(() => {
        if (monthRefs.current[currentMonthKey]) {
          monthRefs.current[currentMonthKey].scrollIntoView({
            behavior: "auto",
            block: "start",
          });
        }
      }, 100);
    }
  }, [visibleMonths]);

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (loadingRef.current || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Load more months when near the bottom
    if (scrollHeight - scrollTop - clientHeight < 500) {
      loadingRef.current = true;
      setVisibleMonths((prev) => {
        const lastMonth = prev[prev.length - 1];
        const newMonths = [];
        for (let i = 1; i <= 3; i++) {
          newMonths.push(addMonths(lastMonth, i));
        }
        loadingRef.current = false;
        return [...prev, ...newMonths];
      });
    }

    // Load previous months when near the top
    if (scrollTop < 500) {
      loadingRef.current = true;
      const currentScrollHeight = scrollHeight;

      setVisibleMonths((prev) => {
        const firstMonth = prev[0];
        const newMonths = [];
        for (let i = 3; i >= 1; i--) {
          newMonths.push(subMonths(firstMonth, i));
        }
        loadingRef.current = false;

        // Maintain scroll position after prepending
        setTimeout(() => {
          if (scrollContainerRef.current) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            const heightDiff = newScrollHeight - currentScrollHeight;
            scrollContainerRef.current.scrollTop = scrollTop + heightDiff;
          }
        }, 0);

        return [...newMonths, ...prev];
      });
    }
  }, []);

  // Filter weekly availability for selected trailer
  const trailerWeeklyAvailability = React.useMemo(() => {
    if (!selectedTrailer) return {};

    const availabilityMap = {};
    Object.values(DAY_NUMBER_TO_ENUM).forEach((day) => {
      availabilityMap[day] = false;
    });

    weeklyAvailability
      .filter((wa) => wa.trailerId === selectedTrailer)
      .forEach((wa) => {
        availabilityMap[wa.day] = wa.available;
      });

    return availabilityMap;
  }, [selectedTrailer, weeklyAvailability]);

  // Helper functions (same as desktop version)
  const isAvailableBySchedule = useCallback(
    (date) => {
      const dayOfWeek = getDay(date);
      const dayEnum = DAY_NUMBER_TO_ENUM[dayOfWeek];
      if (Object.keys(trailerWeeklyAvailability).length === 0) {
        return true;
      }
      return trailerWeeklyAvailability[dayEnum] === true;
    },
    [trailerWeeklyAvailability]
  );

  const isInBlockedPeriod = useCallback(
    (date) => {
      if (!selectedTrailer) return null;

      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      return (
        blockedPeriods.find((period) => {
          if (period.trailerId && period.trailerId !== selectedTrailer) {
            return false;
          }

          const startDate = new Date(period.startDate);
          const endDate = new Date(period.endDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);

          return normalizedDate >= startDate && normalizedDate <= endDate;
        }) || null
      );
    },
    [blockedPeriods, selectedTrailer]
  );

  const getDateRentals = useCallback(
    (date) => {
      if (!selectedTrailer) return [];

      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      return rentals.filter((rental) => {
        if (rental.trailer.id !== selectedTrailer) {
          return false;
        }

        if (!["CONFIRMED", "ACTIVE"].includes(rental.status)) {
          return false;
        }

        const startDate = new Date(rental.startDate);
        const endDate = new Date(rental.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        return normalizedDate >= startDate && normalizedDate <= endDate;
      });
    },
    [rentals, selectedTrailer]
  );

  const toggleDateSelection = useCallback(
    (date) => {
      if (selectionMode === "view") return;

      if (selectionMode === "block" && getDateRentals(date).length > 0) {
        return;
      }

      setSelectedDates((prev) => {
        const isSelected = prev.some((d) => isSameDay(d, date));
        if (isSelected) {
          return prev.filter((d) => !isSameDay(d, date));
        } else {
          return [...prev, date];
        }
      });
    },
    [selectionMode, getDateRentals]
  );

  const handleBlockDates = async () => {
    if (selectedDates.length === 0 || !selectedTrailer) return;

    const sortedDates = [...selectedDates].sort(
      (a, b) => a.getTime() - b.getTime()
    );

    try {
      await onAddBlockedPeriod({
        startDate: sortedDates[0],
        endDate: sortedDates[sortedDates.length - 1],
        trailerId: selectedTrailer,
        userId: "mock-user-id",
      });

      setSelectedDates([]);
      setSelectionMode("view");
    } catch (error) {
      console.error("Failed to block dates:", error);
    }
  };

  const handleUnblockDates = async () => {
    if (selectedDates.length === 0) return;

    const periodsToRemove = new Set();

    selectedDates.forEach((date) => {
      const blockedPeriod = isInBlockedPeriod(date);
      if (blockedPeriod) {
        periodsToRemove.add(blockedPeriod.id);
      }
    });

    try {
      for (const periodId of periodsToRemove) {
        await onRemoveBlockedPeriod(periodId);
      }

      setSelectedDates([]);
      setSelectionMode("view");
    } catch (error) {
      console.error("Failed to unblock dates:", error);
    }
  };

  const renderDay = (date, monthDate) => {
    const isAvailableByDefault = isAvailableBySchedule(date);
    const blockedPeriod = isInBlockedPeriod(date);
    const dateRentals = getDateRentals(date);
    const hasRentals = dateRentals.length > 0;
    const isSelected = selectedDates.some((d) => isSameDay(d, date));
    const isPast = date < new Date() && !isToday(date);
    const isCurrentMonth = isSameMonth(date, monthDate);

    let status = "available";
    if (!isAvailableByDefault) {
      status = "unavailable";
    } else if (blockedPeriod) {
      status = "blocked";
    } else if (hasRentals) {
      status = "rented";
    }

    return (
      <div
        key={date.toISOString()}
        onClick={() => toggleDateSelection(date)}
        className={cn(
          "aspect-square p-1 border rounded-md text-xs relative",
          !isCurrentMonth && "opacity-40",
          status === "available" && "bg-white border-gray-200",
          status === "unavailable" && "bg-gray-50 border-gray-200",
          status === "blocked" && "bg-red-50 border-red-200",
          status === "rented" && "bg-blue-50 border-blue-200",
          isSelected &&
            selectionMode === "block" &&
            "ring-2 ring-red-500 bg-red-100",
          isSelected &&
            selectionMode === "unblock" &&
            "ring-2 ring-green-500 bg-green-100",
          isPast && "opacity-50",
          isToday(date) && "border-blue-500 border-2",
          selectionMode !== "view" && "cursor-pointer"
        )}
      >
        <div className="flex flex-col h-full">
          <span className={cn("font-medium", isToday(date) && "text-blue-600")}>
            {format(date, "d")}
          </span>

          {hasRentals && (
            <div className="text-[9px] text-blue-700 truncate mt-auto">
              {dateRentals[0].renter.firstName}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMonth = (monthDate) => {
    const monthKey = format(monthDate, "yyyy-MM");
    const firstDay = startOfMonth(monthDate);
    const lastDay = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });

    // Add padding for the first week
    const firstDayOfWeek = getDay(firstDay);
    const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const emptyDays = Array(paddingDays).fill(null);

    // Add days from previous month
    const prevMonthDays = [];
    for (let i = paddingDays - 1; i >= 0; i--) {
      prevMonthDays.push(
        new Date(firstDay.getFullYear(), firstDay.getMonth(), -i)
      );
    }

    const DAY_NAMES = ["M", "T", "W", "T", "F", "S", "S"];

    return (
      <div
        key={monthKey}
        ref={(el) => (monthRefs.current[monthKey] = el)}
        className="mb-6"
      >
        <div className="sticky top-0 bg-white z-10 pb-2 mb-2 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(monthDate, "MMMM yyyy", {
              locale:
                t("common:locale") === "nl"
                  ? nl
                  : t("common:locale") === "de"
                  ? de
                  : enUS,
            })}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_NAMES.map((day, index) => (
            <div
              key={index}
              className="text-center text-xs font-medium text-gray-500 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {prevMonthDays.map((date) => renderDay(date, monthDate))}
          {days.map((date) => renderDay(date, monthDate))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col">
      {/* Fixed Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="w-8 h-8"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{currentTrailer?.title}</h1>
            <p className="text-xs text-gray-500">Manage availability</p>
          </div>
        </div>

        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Action Bar */}
      <div className="bg-white border-b px-4 py-2">
        {selectionMode === "view" ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectionMode("block")}
              className="flex-1 text-xs gap-1"
            >
              <Lock className="w-3 h-3" />
              Block Dates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectionMode("unblock")}
              className="flex-1 text-xs gap-1"
            >
              <Unlock className="w-3 h-3" />
              Unblock Dates
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectionMode("view");
                setSelectedDates([]);
              }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={
                selectionMode === "block"
                  ? handleBlockDates
                  : handleUnblockDates
              }
              disabled={selectedDates.length === 0}
              className={cn(
                "flex-1 text-xs gap-1",
                selectionMode === "block"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              )}
            >
              {selectionMode === "block" ? (
                <>
                  <Lock className="w-3 h-3" />
                  {selectedDates.length > 0 &&
                    `Block ${selectedDates.length} day${
                      selectedDates.length > 1 ? "s" : ""
                    }`}
                  {selectedDates.length === 0 && "Select dates"}
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" />
                  {selectedDates.length > 0 &&
                    `Unblock ${selectedDates.length} day${
                      selectedDates.length > 1 ? "s" : ""
                    }`}
                  {selectedDates.length === 0 && "Select dates"}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable Calendar */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {visibleMonths.map((monthDate) => renderMonth(monthDate))}

        {/* Loading indicator */}
        <div className="h-20 flex items-center justify-center">
          <div className="animate-pulse text-gray-400 text-sm">
            Loading more months...
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-t px-4 py-2">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-white border border-gray-200 rounded" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-50 border border-red-200 rounded" />
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-blue-500 rounded" />
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function MobileLessorCalendar() {
  const [selectedTrailer, setSelectedTrailer] = useState(null);

  // Mock data for demo
  const mockData = {
    userId: "user-123",
    trailers: [
      {
        id: "trailer-1",
        title: "Open Cargo Trailer XL",
        images: [
          {
            url: "https://via.placeholder.com/100x100/4F46E5/ffffff?text=Trailer+1",
          },
        ],
      },
      {
        id: "trailer-2",
        title: "Enclosed Box Trailer",
        images: [
          {
            url: "https://via.placeholder.com/100x100/10B981/ffffff?text=Trailer+2",
          },
        ],
      },
      {
        id: "trailer-3",
        title: "Car Transport Trailer",
        images: [
          {
            url: "https://via.placeholder.com/100x100/F59E0B/ffffff?text=Trailer+3",
          },
        ],
      },
    ],
    rentals: [
      {
        id: "rental-1",
        startDate: new Date(2025, 6, 10),
        endDate: new Date(2025, 6, 15),
        status: "CONFIRMED",
        trailer: { id: "trailer-1", title: "Open Cargo Trailer XL" },
        renter: { firstName: "John", lastName: "Doe" },
      },
    ],
    blockedPeriods: [
      {
        id: "blocked-1",
        startDate: new Date(2025, 6, 20),
        endDate: new Date(2025, 6, 22),
        trailerId: "trailer-1",
        userId: "user-123",
      },
    ],
    weeklyAvailability: [
      { id: "wa-1", day: "MONDAY", available: true, trailerId: "trailer-1" },
      { id: "wa-2", day: "TUESDAY", available: true, trailerId: "trailer-1" },
      { id: "wa-3", day: "WEDNESDAY", available: true, trailerId: "trailer-1" },
      { id: "wa-4", day: "THURSDAY", available: true, trailerId: "trailer-1" },
      { id: "wa-5", day: "FRIDAY", available: true, trailerId: "trailer-1" },
      { id: "wa-6", day: "SATURDAY", available: false, trailerId: "trailer-1" },
      { id: "wa-7", day: "SUNDAY", available: false, trailerId: "trailer-1" },
    ],
  };

  const handleAddBlockedPeriod = async (period) => {
    console.log("Adding blocked period:", period);
    // Implement your API call here
  };

  const handleRemoveBlockedPeriod = async (id) => {
    console.log("Removing blocked period:", id);
    // Implement your API call here
  };

  if (!selectedTrailer) {
    return (
      <MobileTrailerSelection
        trailers={mockData.trailers}
        onSelectTrailer={setSelectedTrailer}
      />
    );
  }

  return (
    <MobileCalendarView
      selectedTrailer={selectedTrailer}
      trailers={mockData.trailers}
      rentals={mockData.rentals}
      blockedPeriods={mockData.blockedPeriods}
      weeklyAvailability={mockData.weeklyAvailability}
      onBack={() => setSelectedTrailer(null)}
      onAddBlockedPeriod={handleAddBlockedPeriod}
      onRemoveBlockedPeriod={handleRemoveBlockedPeriod}
    />
  );
}
