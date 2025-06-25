import { useState, useEffect } from "react";
import { CalendarIcon, Calendar as CalendarIc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
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
} from "date-fns";
import { nl, enUS, de } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n/client";
import {
  formatDateRange as formatDateRangeUtil,
  getAvailableTimeOptions,
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
      return formatDateRangeUtil(startDate, endDate, locale, {
        selectDates: t("booking.dates.select"),
      });
    } else if (startDate && !endDate) {
      return (
        <>
          {format(startDate, "d MMM yyyy", {
            locale: locale === "nl" ? nl : locale === "de" ? de : enUS,
          })}
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

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      onDateChange(undefined, undefined);
      return;
    }

    if (range.from && !range.to) {
      onDateChange(range.from, undefined);
      return;
    }

    if (range.from && range.to) {
      // Check for blocked dates in range
      let currentDate = new Date(range.from);
      currentDate.setHours(0, 0, 0, 0);

      const endDate = new Date(range.to);
      endDate.setHours(0, 0, 0, 0);

      currentDate = addDays(currentDate, 1);

      let hasBlockedDate = false;

      while (isBefore(currentDate, endDate)) {
        if (isDateDisabled(currentDate)) {
          hasBlockedDate = true;
          break;
        }
        currentDate = addDays(currentDate, 1);
      }

      if (hasBlockedDate) {
        onDateChange(range.to, undefined);
        return;
      }

      onDateChange(range.from, range.to);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="date-range" className="flex items-center gap-2 mb-3">
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
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant="outline"
            className={`w-full h-10 rounded-lg shadow-none justify-start text-left font-normal ${
              validationError ? "border-red-500" : ""
            }`}
            disabled={!available || isLoading}
          >
            {isLoading ? t("booking.dates.loading") : formatDateRange()}
            <CalendarIc strokeWidth={1.5} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 shadow-none" align="start">
          <Calendar
            mode="range"
            selected={{
              from: startDate,
              to: endDate,
            }}
            onSelect={handleDateSelect}
            disabled={isDateDisabled}
            initialFocus
            footer={
              <div className="p-3 border-t">
                <div className="mb-2 text-sm text-center">
                  {startDate && endDate ? (
                    <span className="font-medium">
                      {format(startDate, "d MMM", {
                        locale:
                          locale === "nl" ? nl : locale === "de" ? de : enUS,
                      })}
                      {" — "}
                      {format(endDate, "d MMM yyyy", {
                        locale:
                          locale === "nl" ? nl : locale === "de" ? de : enUS,
                      })}
                    </span>
                  ) : startDate ? (
                    <span>
                      {format(startDate, "d MMM", {
                        locale:
                          locale === "nl" ? nl : locale === "de" ? de : enUS,
                      })}
                      <span className="text-primary font-medium">
                        {" "}
                        {t("Select end date")}
                      </span>
                    </span>
                  ) : (
                    <span>{t("Select start date")}</span>
                  )}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsDatePickerOpen(false)}
                >
                  {t("booking.dates.apply")}
                </Button>
              </div>
            }
          />
        </PopoverContent>
      </Popover>
      {validationError && (
        <p className="text-xs text-red-500 mt-1">{validationError}</p>
      )}
      <div className="flex text-xs text-gray-500 gap-2">
        {minRentalDuration && minRentalDuration >= 1 && (
          <span>{t("booking.dates.minDays", { days: minRentalDuration })}</span>
        )}
        {minRentalDuration && maxRentalDuration && <span>-</span>}
        {maxRentalDuration && (
          <span>{t("booking.dates.maxDays", { days: maxRentalDuration })}</span>
        )}
      </div>
    </div>
  );
}
