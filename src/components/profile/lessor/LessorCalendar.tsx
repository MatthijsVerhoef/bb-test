import React, { useState, useMemo, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  isToday,
  isSameDay,
  getDay,
} from "date-fns";
import { nl, de, enUS } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

// Types matching Prisma schema
interface WeeklyAvailability {
  id: string;
  day:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  available: boolean;
  trailerId: string;
  timeSlot1Start?: string | null;
  timeSlot1End?: string | null;
  timeSlot2Start?: string | null;
  timeSlot2End?: string | null;
  timeSlot3Start?: string | null;
  timeSlot3End?: string | null;
}

interface BlockedPeriod {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  reason?: string;
  trailerId?: string | null;
  userId: string;
}

interface Rental {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  trailer: {
    id: string;
    title: string;
  };
  renter: {
    firstName: string;
    lastName: string;
  };
}

interface Trailer {
  id: string;
  title: string;
  images?: { url: string }[];
}

interface LessorCalendarProps {
  userId: string;
  trailers: Trailer[];
  rentals: Rental[];
  blockedPeriods: BlockedPeriod[];
  weeklyAvailability: WeeklyAvailability[];
  onAddBlockedPeriod: (period: Omit<BlockedPeriod, "id">) => Promise<void>;
  onRemoveBlockedPeriod: (id: string) => Promise<void>;
}

// Map day numbers to DayOfWeek enum
const DAY_NUMBER_TO_ENUM: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export default function LessorCalendar({
  userId,
  trailers = [],
  rentals = [],
  blockedPeriods = [],
  weeklyAvailability = [],
  onAddBlockedPeriod,
  onRemoveBlockedPeriod,
}: LessorCalendarProps) {
  const { t } = useTranslation("profile");
  
  const DAY_NAMES = [
    t('lessorCalendar.availability.shortDays.MONDAY'),
    t('lessorCalendar.availability.shortDays.TUESDAY'),
    t('lessorCalendar.availability.shortDays.WEDNESDAY'),
    t('lessorCalendar.availability.shortDays.THURSDAY'),
    t('lessorCalendar.availability.shortDays.FRIDAY'),
    t('lessorCalendar.availability.shortDays.SATURDAY'),
    t('lessorCalendar.availability.shortDays.SUNDAY')
  ];
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTrailer, setSelectedTrailer] = useState<string | null>(
    trailers.length > 0 ? trailers[0].id : null
  );
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectionMode, setSelectionMode] = useState<
    "view" | "block" | "unblock"
  >("view");

  // Filter weekly availability for selected trailer
  const trailerWeeklyAvailability = useMemo(() => {
    if (!selectedTrailer) return {};

    // For specific trailer, create a map of day -> availability
    const availabilityMap: Record<string, boolean> = {};

    // Initialize all days as false
    Object.values(DAY_NUMBER_TO_ENUM).forEach((day) => {
      availabilityMap[day] = false;
    });

    // Set availability based on WeeklyAvailability records
    weeklyAvailability
      .filter((wa) => wa.trailerId === selectedTrailer)
      .forEach((wa) => {
        availabilityMap[wa.day] = wa.available;
      });

    return availabilityMap;
  }, [selectedTrailer, weeklyAvailability]);

  // Check if a date is available based on weekly schedule
  const isAvailableBySchedule = useCallback(
    (date: Date): boolean => {
      const dayOfWeek = getDay(date);
      const dayEnum = DAY_NUMBER_TO_ENUM[dayOfWeek];

      // If no weekly availability is set, assume all days are available
      if (Object.keys(trailerWeeklyAvailability).length === 0) {
        return true;
      }

      return trailerWeeklyAvailability[dayEnum] === true;
    },
    [trailerWeeklyAvailability]
  );

  // Check if date is in a blocked period
  const isInBlockedPeriod = useCallback(
    (date: Date): BlockedPeriod | null => {
      if (!selectedTrailer) return null;

      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      return (
        blockedPeriods.find((period) => {
          // Filter by trailer
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

  // Check if date has rentals
  const getDateRentals = useCallback(
    (date: Date): Rental[] => {
      if (!selectedTrailer) return [];

      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      return rentals.filter((rental) => {
        // Filter by trailer
        if (rental.trailer.id !== selectedTrailer) {
          return false;
        }

        // Only show confirmed/active rentals
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

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(currentMonth);
    const lastDay = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });

    // Add padding for the first week
    const firstDayOfWeek = getDay(firstDay);
    const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const emptyDays = Array(paddingDays).fill(null);

    return [...emptyDays, ...days];
  }, [currentMonth]);

  // Toggle date selection
  const toggleDateSelection = useCallback(
    (date: Date) => {
      if (selectionMode === "view") return;

      // Don't allow selection of dates with rentals when blocking
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

  // Handle blocking dates
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
        userId,
      });

      setSelectedDates([]);
      setSelectionMode("view");
    } catch (error) {
      console.error("Failed to block dates:", error);
    }
  };

  // Handle unblocking dates
  const handleUnblockDates = async () => {
    if (selectedDates.length === 0) return;

    // Find all blocked periods that overlap with selected dates
    const periodsToRemove = new Set<string>();

    selectedDates.forEach((date) => {
      const blockedPeriod = isInBlockedPeriod(date);
      if (blockedPeriod) {
        periodsToRemove.add(blockedPeriod.id);
      }
    });

    try {
      // Remove each unique blocked period
      for (const periodId of periodsToRemove) {
        await onRemoveBlockedPeriod(periodId);
      }

      setSelectedDates([]);
      setSelectionMode("view");
    } catch (error) {
      console.error("Failed to unblock dates:", error);
    }
  };

  const renderDay = (date: Date | null, index: number) => {
    if (!date) {
      return <div key={`empty-${index}`} className="aspect-square" />;
    }

    const isAvailableByDefault = isAvailableBySchedule(date);
    const blockedPeriod = isInBlockedPeriod(date);
    const dateRentals = getDateRentals(date);
    const hasRentals = dateRentals.length > 0;
    const isSelected = selectedDates.some((d) => isSameDay(d, date));
    const isPast = date < new Date() && !isToday(date);

    // Determine the overall status
    let status: "available" | "unavailable" | "blocked" | "rented" =
      "available";

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
          "aspect-square p-2 border rounded-lg cursor-pointer transition-all relative",
          "",
          // Base styles by status
          status === "available" &&
            "bg-white border-gray-200 hover:border-gray-300",
          status === "unavailable" &&
            "bg-gray-50 border-gray-200 cursor-default",
          status === "blocked" && "bg-red-50 border-red-200",
          status === "rented" && "bg-blue-50 border-blue-200",
          // Selection states
          isSelected &&
            selectionMode === "block" &&
            "ring-2 ring-red-500 bg-red-100",
          isSelected &&
            selectionMode === "unblock" &&
            "ring-2 ring-green-500 bg-green-100",
          // Other states
          isPast && "opacity-50",
          isToday(date) && "border-primary"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start">
            <span
              className={cn(
                "text-sm font-medium",
                isToday(date) && "text-primary"
              )}
            >
              {format(date, "d")}
            </span>

            {/* Status indicator */}
            {status !== "available" && (
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  status === "unavailable" && "bg-gray-400",
                  status === "blocked" && "bg-red-500",
                  status === "rented" && "bg-blue-500"
                )}
              />
            )}
          </div>

          {/* Show rental info */}
          {hasRentals && (
            <div className="mt-1">
              <div className="text-[10px] text-blue-700 font-medium truncate">
                {dateRentals[0].renter.firstName}
              </div>
              {dateRentals.length > 1 && (
                <div className="text-[10px] text-blue-600">
                  {t('lessorCalendar.calendar.rental.more', { count: dateRentals.length - 1 })}
                </div>
              )}
            </div>
          )}

          {/* Status text for blocked/unavailable */}
          {!hasRentals && status !== "available" && (
            <div className="mt-auto">
              <div className="text-[10px] text-gray-500 truncate">
                {status === "unavailable" && t('lessorCalendar.calendar.dayStatus.unavailable')}
                {status === "blocked" && t('lessorCalendar.calendar.dayStatus.blocked')}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const selectedTrailerData = trailers.find((t) => t.id === selectedTrailer);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Trailer Selection Section */}
      <Card className="p-6 bg-[#f7f7f7] border-0">
        <div className="mb-0">
          <h3 className="text-lg font-semibold mb-0">{t('lessorCalendar.trailerSelection.title')}</h3>
          <p className="text-sm text-gray-600">
            {t('lessorCalendar.trailerSelection.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {trailers.map((trailer) => (
            <button
              key={trailer.id}
              onClick={() => setSelectedTrailer(trailer.id)}
              className={cn(
                "p-4 rounded-lg border transition-all text-left",
                "",
                selectedTrailer === trailer.id
                  ? "border-primary bg-primary/50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                {trailer.images?.[0]?.url && (
                  <img
                    src={trailer.images[0].url}
                    alt={trailer.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{trailer.title}</h4>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Calendar Section - Only show if trailer is selected */}
      {selectedTrailer && (
        <Card className="p-0 border-0">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {t('lessorCalendar.calendar.title', { trailerName: selectedTrailerData?.title })}
                </h3>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {selectionMode === "view" ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectionMode("block")}
                      className="gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      {t('lessorCalendar.calendar.blockDates')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectionMode("unblock")}
                      className="gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      {t('lessorCalendar.calendar.unblockDates')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectionMode("view");
                        setSelectedDates([]);
                      }}
                    >
                      {t('lessorCalendar.calendar.cancel')}
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
                        "gap-2",
                        selectionMode === "block"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      )}
                    >
                      {selectionMode === "block" ? (
                        <>
                          <Lock className="w-4 h-4" />
                          {selectedDates.length === 1 
                            ? t('lessorCalendar.calendar.blockDay', { count: selectedDates.length })
                            : t('lessorCalendar.calendar.blockDays', { count: selectedDates.length })}
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4" />
                          {selectedDates.length === 1
                            ? t('lessorCalendar.calendar.unblockDay', { count: selectedDates.length })
                            : t('lessorCalendar.calendar.unblockDays', { count: selectedDates.length })}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="bg-[#F7F7F7] rounded-full"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {format(
                currentMonth, 
                "MMMM yyyy", 
                { 
                  locale: 
                    t('common:locale') === 'nl' ? nl : 
                    t('common:locale') === 'de' ? de : 
                    enUS 
                }
              )}
            </h2>

            <Button
              variant="ghost"
              size="icon"
              className="bg-[#F7F7F7] rounded-full"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAY_NAMES.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => renderDay(date, index))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs bg-gray-50 p-3 rounded-lg">
            <span className="font-medium text-gray-700">{t('lessorCalendar.calendar.legend.title')}</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-white border border-gray-200 rounded" />
              <span>{t('lessorCalendar.calendar.legend.available')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded" />
              <span>{t('lessorCalendar.calendar.legend.unavailable')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-50 border border-red-200 rounded" />
              <span>{t('lessorCalendar.calendar.legend.blocked')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded" />
              <span>{t('lessorCalendar.calendar.legend.booked')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border border-primary rounded" />
              <span>{t('lessorCalendar.calendar.legend.today')}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Show message if no trailer is selected */}
      {!selectedTrailer && trailers.length > 0 && (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {t('lessorCalendar.calendar.noTrailerSelected.title')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('lessorCalendar.calendar.noTrailerSelected.description')}
          </p>
        </Card>
      )}
    </div>
  );
}
