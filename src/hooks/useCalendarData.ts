// hooks/useCalendarData.ts

import { useMemo, useCallback } from "react";
import { format, startOfDay, getDay } from "date-fns";
import type {
  WeeklyAvailability,
  BlockedPeriod,
  Rental,
  DateStatus,
  DAY_NUMBER_TO_ENUM,
} from "@/types/calendar";

const DAY_NUMBER_TO_ENUM_MAP = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
} as const;

interface UseCalendarDataProps {
  selectedTrailer: string | null;
  weeklyAvailability: WeeklyAvailability[];
  blockedPeriods: BlockedPeriod[];
  rentals: Rental[];
}

export const useCalendarData = ({
  selectedTrailer,
  weeklyAvailability,
  blockedPeriods,
  rentals,
}: UseCalendarDataProps) => {
  // Filter weekly availability for selected trailer
  const trailerWeeklyAvailability = useMemo(() => {
    if (!selectedTrailer) return {};

    const availabilityMap: Record<string, boolean> = {};
    Object.values(DAY_NUMBER_TO_ENUM_MAP).forEach((day) => {
      availabilityMap[day] = false;
    });

    weeklyAvailability
      .filter((wa) => wa.trailerId === selectedTrailer)
      .forEach((wa) => {
        availabilityMap[wa.day] = wa.available;
      });

    return availabilityMap;
  }, [selectedTrailer, weeklyAvailability]);

  // Memoized rental lookups
  const rentalsByTrailerAndDate = useMemo(() => {
    if (!selectedTrailer) return new Map<string, Rental[]>();

    const rentalMap = new Map<string, Rental[]>();

    rentals
      .filter(
        (rental) =>
          rental.trailer.id === selectedTrailer &&
          ["CONFIRMED", "ACTIVE"].includes(rental.status)
      )
      .forEach((rental) => {
        const startDate = startOfDay(new Date(rental.startDate));
        const endDate = startOfDay(new Date(rental.endDate));

        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateKey = format(currentDate, "yyyy-MM-dd");
          if (!rentalMap.has(dateKey)) {
            rentalMap.set(dateKey, []);
          }
          rentalMap.get(dateKey)!.push(rental);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

    return rentalMap;
  }, [rentals, selectedTrailer]);

  // Memoized blocked periods lookup
  const blockedPeriodsByDate = useMemo(() => {
    if (!selectedTrailer) return new Map<string, BlockedPeriod>();

    const blockedMap = new Map<string, BlockedPeriod>();

    blockedPeriods
      .filter(
        (period) => !period.trailerId || period.trailerId === selectedTrailer
      )
      .forEach((period) => {
        const startDate = startOfDay(new Date(period.startDate));
        const endDate = startOfDay(new Date(period.endDate));

        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateKey = format(currentDate, "yyyy-MM-dd");
          blockedMap.set(dateKey, period);
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

    return blockedMap;
  }, [blockedPeriods, selectedTrailer]);

  // Helper functions
  const isAvailableBySchedule = useCallback(
    (date: Date) => {
      const dayOfWeek = getDay(date);
      const dayEnum = DAY_NUMBER_TO_ENUM_MAP[dayOfWeek as keyof typeof DAY_NUMBER_TO_ENUM_MAP];
      if (Object.keys(trailerWeeklyAvailability).length === 0) {
        return true;
      }
      return trailerWeeklyAvailability[dayEnum] === true;
    },
    [trailerWeeklyAvailability]
  );

  const isInBlockedPeriod = useCallback(
    (date: Date) => {
      const dateKey = format(startOfDay(date), "yyyy-MM-dd");
      return blockedPeriodsByDate.get(dateKey) || null;
    },
    [blockedPeriodsByDate]
  );

  const getDateRentals = useCallback(
    (date: Date) => {
      const dateKey = format(startOfDay(date), "yyyy-MM-dd");
      return rentalsByTrailerAndDate.get(dateKey) || [];
    },
    [rentalsByTrailerAndDate]
  );

  const getDateStatus = useCallback(
    (date: Date): DateStatus => {
      const isAvailableByDefault = isAvailableBySchedule(date);
      const blockedPeriod = isInBlockedPeriod(date);
      const dateRentals = getDateRentals(date);
      const hasRentals = dateRentals.length > 0;

      if (!isAvailableByDefault) return "unavailable";
      if (blockedPeriod) return "blocked";
      if (hasRentals) return "rented";
      return "available";
    },
    [isAvailableBySchedule, isInBlockedPeriod, getDateRentals]
  );

  return {
    isAvailableBySchedule,
    isInBlockedPeriod,
    getDateRentals,
    getDateStatus,
  };
};