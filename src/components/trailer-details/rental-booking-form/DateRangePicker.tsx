import { useState, useEffect } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  format,
  isBefore,
  isAfter,
  isSameDay,
  getDay,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  isWithinInterval,
} from "date-fns";
import { nl, enUS, de } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import {
  formatDateRange as formatDateRangeUtil,
  DAY_MAP,
  isDateDisabled as isDateDisabledUtil,
} from "@/lib/utils/date-availability";
import type {
  ExistingRental,
  AvailabilityException,
  WeeklyAvailability,
  BlockedPeriod,
} from "@/lib/utils/date-availability";

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (startDate?: Date, endDate?: Date) => void;
  existingRentals: ExistingRental[];
  weeklyAvailabilityData: WeeklyAvailability[];
  availabilityExceptions: AvailabilityException[];
  blockedPeriodsData: BlockedPeriod[];
  minRentalDuration?: number | null;
  maxRentalDuration?: number | null;
  validationError?: string;
  available: boolean;
  isLoading: boolean;
  onOpenDatePicker: () => void;
  trailerId: string;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  existingRentals,
  weeklyAvailabilityData,
  availabilityExceptions,
  blockedPeriodsData,
  minRentalDuration,
  maxRentalDuration,
  validationError,
  available,
  isLoading,
  onOpenDatePicker,
  trailerId,
}: DateRangePickerProps) {
  const { t, locale } = useTranslation("trailer");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const dateLocale = locale === "nl" ? nl : locale === "de" ? de : enUS;

  useEffect(() => {
    if (
      !hasInitialized &&
      !startDate &&
      !endDate &&
      available &&
      weeklyAvailabilityData.length > 0 &&
      !isLoading
    ) {
      // Start searching from tomorrow
      let searchDate = addDays(new Date(), 1);
      searchDate.setHours(0, 0, 0, 0);

      // Look ahead 90 days maximum
      const maxSearchDate = addDays(searchDate, 90);
      let firstAvailableDate: Date | null = null;

      // Find the first date that's available
      while (searchDate <= maxSearchDate && !firstAvailableDate) {
        const isBlocked = isDateDisabledUtil(searchDate, {
          weeklyAvailability: weeklyAvailabilityData,
          availabilityExceptions,
          existingRentals,
          blockedPeriods: blockedPeriodsData,
          minRentalDuration,
          maxRentalDuration,
        });

        if (!isBlocked) {
          firstAvailableDate = new Date(searchDate);
          break;
        }

        searchDate = addDays(searchDate, 1);
      }

      // If we found an available date, set it
      if (firstAvailableDate) {
        let calculatedEndDate = firstAvailableDate;

        // Calculate end date based on minimum rental duration
        if (minRentalDuration && minRentalDuration > 1) {
          let potentialEndDate = addDays(
            firstAvailableDate,
            minRentalDuration - 1
          );
          let allDaysAvailable = true;
          let currentDate = addDays(firstAvailableDate, 1);

          while (currentDate <= potentialEndDate) {
            const isBlocked = isDateDisabledUtil(currentDate, {
              weeklyAvailability: weeklyAvailabilityData,
              availabilityExceptions,
              existingRentals,
              blockedPeriods: blockedPeriodsData,
              minRentalDuration,
              maxRentalDuration,
              currentlySelectedStartDate: firstAvailableDate,
            });

            if (isBlocked) {
              allDaysAvailable = false;
              break;
            }

            currentDate = addDays(currentDate, 1);
          }

          if (allDaysAvailable) {
            calculatedEndDate = potentialEndDate;
          }
        }

        // Update the dates through the parent component
        onDateChange(firstAvailableDate, calculatedEndDate);
        setCurrentMonth(firstAvailableDate);
        setHasInitialized(true);
      } else {
        setHasInitialized(true);
      }
    }
  }, [
    hasInitialized,
    startDate,
    endDate,
    available,
    weeklyAvailabilityData,
    availabilityExceptions,
    existingRentals,
    blockedPeriodsData,
    minRentalDuration,
    maxRentalDuration,
    isLoading,
    onDateChange,
  ]);

  const formatDateRange = () => {
    if (startDate && endDate) {
      const startFormatted = format(startDate, "d MMM", { locale: dateLocale });
      const endFormatted = format(endDate, "d MMM yyyy", {
        locale: dateLocale,
      });
      return `${startFormatted} — ${endFormatted}`;
    } else if (startDate && !endDate) {
      return (
        <>
          {format(startDate, "d MMM yyyy", { locale: dateLocale })}
          {" — "}
          <span className="text-gray-400">
            {t("booking.dates.selectEndDate") || "Select end date"}
          </span>
        </>
      );
    }
    return t("booking.dates.select") || "Select dates";
  };

  const handleOpenDatePicker = () => {
    setIsDatePickerOpen(true);
    onOpenDatePicker();
  };

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isBefore(date, today)) {
      return true;
    }

    // Check existing rentals
    for (const rental of existingRentals) {
      if (!["CONFIRMED", "ACTIVE"].includes(rental.status)) continue;

      const rentalStart = new Date(rental.startDate);
      const rentalEnd = new Date(rental.endDate);

      rentalStart.setHours(0, 0, 0, 0);
      rentalEnd.setHours(0, 0, 0, 0);

      if (
        (isSameDay(date, rentalStart) || isAfter(date, rentalStart)) &&
        (isSameDay(date, rentalEnd) || isBefore(date, rentalEnd))
      ) {
        return true;
      }
    }

    // Check blocked periods
    for (const period of blockedPeriodsData) {
      if (period.trailerId !== null && period.trailerId !== trailerId) {
        continue;
      }

      if (period.trailerId === null && !period.belongsToThisTrailersOwner) {
        continue;
      }

      const blockStart = new Date(period.startDate);
      const blockEnd = new Date(period.endDate);

      blockStart.setHours(0, 0, 0, 0);
      blockEnd.setHours(0, 0, 0, 0);

      if (
        (isSameDay(date, blockStart) || isAfter(date, blockStart)) &&
        (isSameDay(date, blockEnd) || isBefore(date, blockEnd))
      ) {
        return true;
      }
    }

    // Check weekly availability
    const dayOfWeek = getDay(date);
    const day = DAY_MAP[dayOfWeek as keyof typeof DAY_MAP];
    const dayAvailability = weeklyAvailabilityData.find((a) => a.day === day);

    if (dayAvailability && !dayAvailability.available) {
      return true;
    }

    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (!startDate || (startDate && endDate)) {
      // Starting a new selection
      onDateChange(date, undefined);
    } else {
      // Completing the range
      if (isBefore(date, startDate)) {
        // If clicked date is before start, reset to new start
        onDateChange(date, undefined);
      } else {
        // Check for blocked dates in range
        let currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);

        const endDateCheck = new Date(date);
        endDateCheck.setHours(0, 0, 0, 0);

        currentDate = addDays(currentDate, 1);

        let hasBlockedDate = false;

        while (isBefore(currentDate, endDateCheck)) {
          if (isDateDisabled(currentDate)) {
            hasBlockedDate = true;
            break;
          }
          currentDate = addDays(currentDate, 1);
        }

        if (hasBlockedDate) {
          // Start new selection from clicked date
          onDateChange(date, undefined);
        } else {
          // Complete the range
          onDateChange(startDate, date);
        }
      }
    }
  };

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return isWithinInterval(date, { start: startDate, end: endDate });
  };

  const isDateRangeStart = (date: Date) => {
    return startDate && isSameDay(date, startDate);
  };

  const isDateRangeEnd = (date: Date) => {
    return endDate && isSameDay(date, endDate);
  };

  const isDateHovered = (date: Date) => {
    if (!startDate || endDate || !hoveredDate) return false;
    if (isBefore(hoveredDate, startDate)) return false;
    return isWithinInterval(date, { start: startDate, end: hoveredDate });
  };

  const getDayClass = (date: Date) => {
    const isDisabled = isDateDisabled(date);
    const isToday = isSameDay(date, new Date());
    const isRangeStart = isDateRangeStart(date);
    const isRangeEnd = isDateRangeEnd(date);
    const isInRange = isDateInRange(date);
    const isHovered = isDateHovered(date);
    const isSelected = isRangeStart || isRangeEnd;

    return cn(
      "relative h-11 w-11 p-0 font-normal text-sm rounded-md transition-all touch-manipulation",
      "hover:bg-gray-100 focus:z-10 focus:outline-none focus:ring-2 focus:ring-primary/20",
      "active:bg-gray-200 active:scale-95",
      {
        // Base states
        "text-gray-900": !isDisabled && !isSelected,
        "text-gray-300 cursor-not-allowed hover:bg-transparent": isDisabled,

        // Today
        "font-semibold": isToday,

        // Selected dates
        "bg-primary text-white hover:bg-primary/90": isSelected,

        // Range states
        "bg-primary/10 hover:bg-primary/20 rounded-none":
          isInRange && !isSelected,
        "rounded-l-md": isRangeStart && endDate,
        "rounded-r-md": isRangeEnd && startDate,

        // Hover range preview
        "bg-gray-100": isHovered && !isInRange,

        // Outside current month
        "text-gray-300": !isSameMonth(date, currentMonth),
      }
    );
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate_ = startOfMonth(monthStart);
  const endDate_ = endOfMonth(monthEnd);

  // Adjust to start on Sunday
  startDate_.setDate(startDate_.getDate() - startDate_.getDay());
  // Adjust to end on Saturday
  endDate_.setDate(endDate_.getDate() + (6 - endDate_.getDay()));

  const days = eachDayOfInterval({ start: startDate_, end: endDate_ });

  const weekDays =
    locale === "nl"
      ? ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"]
      : locale === "de"
      ? ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="space-y-2">
      <Label
        htmlFor="date-range"
        className="flex items-center gap-2 text-sm font-medium"
      >
        <CalendarIcon className="h-4 w-4" strokeWidth={1.5} />
        {t("booking.rentalDates")}
      </Label>

      <Popover
        open={isDatePickerOpen}
        onOpenChange={(open) => {
          if (open) {
            handleOpenDatePicker();
          } else {
            setIsDatePickerOpen(false);
            setHoveredDate(null);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant="outline"
            className={cn(
              "w-full h-12 px-4 rounded-lg border-gray-200 justify-between text-left font-normal",
              "hover:border-gray-300 transition-colors",
              validationError && "border-red-500",
              !startDate && "text-gray-500"
            )}
            disabled={!available || isLoading}
          >
            <span className="truncate">
              {isLoading ? t("booking.dates.loading") : formatDateRange()}
            </span>
            <CalendarIcon
              className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2"
              strokeWidth={1.5}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-0 bg-white shadow-lg rounded-lg border"
          align="start"
        >
          <div className="p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <h2 className="text-sm font-semibold text-gray-900">
                {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
              </h2>

              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="h-11 w-11 flex items-center justify-center text-xs font-medium text-gray-500"
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
                  onTouchStart={() => setHoveredDate(day)}
                  onTouchEnd={() => setHoveredDate(null)}
                  disabled={isDateDisabled(day)}
                  className={getDayClass(day)}
                  aria-label={format(day, "EEEE, MMMM d, yyyy", { locale: dateLocale })}
                >
                  <time dateTime={format(day, "yyyy-MM-dd")}>
                    {format(day, "d")}
                  </time>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-600">
                  {startDate && endDate ? (
                    <span>
                      {format(startDate, "d MMM", { locale: dateLocale })}
                      {" — "}
                      {format(endDate, "d MMM yyyy", { locale: dateLocale })}
                    </span>
                  ) : startDate ? (
                    <span className="text-primary">
                      {t("booking.dates.selectEndDate")}
                    </span>
                  ) : (
                    <span>{t("booking.dates.selectStartDate")}</span>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={() => setIsDatePickerOpen(false)}
                  disabled={!startDate}
                  className="h-8 px-3"
                >
                  {t("booking.dates.apply")}
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {validationError && (
        <p className="text-xs text-red-500 mt-1">{validationError}</p>
      )}

      {(minRentalDuration || maxRentalDuration) && (
        <div className="flex text-xs text-gray-500 gap-2">
          {minRentalDuration && minRentalDuration >= 1 && (
            <span>
              {t("booking.dates.minDays", { days: minRentalDuration })}
            </span>
          )}
          {minRentalDuration && maxRentalDuration && <span>•</span>}
          {maxRentalDuration && (
            <span>
              {t("booking.dates.maxDays", { days: maxRentalDuration })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
