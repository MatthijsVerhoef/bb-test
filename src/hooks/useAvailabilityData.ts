import { useState, useEffect } from "react";
import { addDays } from "date-fns";
import {
  fetchAvailabilityData,
  type ExistingRental,
  type AvailabilityException,
  type WeeklyAvailability,
  type BlockedPeriod,
} from "@/lib/utils/date-availability";

interface UseAvailabilityDataProps {
  trailerId: string;
  initialWeeklyAvailability?: WeeklyAvailability[];
  availabilityData?: {
    rentals: ExistingRental[];
    availabilityExceptions: any[];
    weeklyAvailability: WeeklyAvailability[];
    blockedPeriods: BlockedPeriod[];
  };
}

export function useAvailabilityData({
  trailerId,
  initialWeeklyAvailability = [],
  availabilityData,
}: UseAvailabilityDataProps) {
  const [existingRentals, setExistingRentals] = useState<ExistingRental[]>([]);
  const [weeklyAvailabilityData, setWeeklyAvailabilityData] = useState<WeeklyAvailability[]>(
    initialWeeklyAvailability
  );
  const [availabilityExceptions, setAvailabilityExceptions] = useState<AvailabilityException[]>([]);
  const [blockedPeriodsData, setBlockedPeriodsData] = useState<BlockedPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);

  useEffect(() => {
    async function loadAvailabilityData() {
      if (!trailerId || dataFetched) return;

      setIsLoading(true);
      setLoadingError(null);

      try {
        if (availabilityData) {
          setExistingRentals(availabilityData.rentals);

          const parsedExceptions = availabilityData.availabilityExceptions.map((exception) => ({
            ...exception,
            date: new Date(exception.date),
          }));

          setAvailabilityExceptions(parsedExceptions);

          if (availabilityData.blockedPeriods) {
            const parsedBlockedPeriods = availabilityData.blockedPeriods.map((period) => ({
              ...period,
              startDate: new Date(period.startDate),
              endDate: new Date(period.endDate),
            }));

            setBlockedPeriodsData(parsedBlockedPeriods);
          }

          if (weeklyAvailabilityData.length === 0) {
            setWeeklyAvailabilityData(availabilityData.weeklyAvailability);
          }

          setDataFetched(true);
          setIsLoading(false);
          return;
        }

        const data = await fetchAvailabilityData(trailerId, "threeMonths");

        setExistingRentals(data.rentals);

        const parsedExceptions = data.availabilityExceptions.map((exception) => ({
          ...exception,
          date: new Date(exception.date),
        }));

        setAvailabilityExceptions(parsedExceptions);

        if (data.blockedPeriods) {
          const parsedBlockedPeriods = data.blockedPeriods.map((period) => ({
            ...period,
            startDate: new Date(period.startDate),
            endDate: new Date(period.endDate),
          }));

          setBlockedPeriodsData(parsedBlockedPeriods);
        }

        if (weeklyAvailabilityData.length === 0) {
          setWeeklyAvailabilityData(data.weeklyAvailability);
        }

        setDataFetched(true);
      } catch (error) {
        console.error("Error loading availability data:", error);
        setLoadingError("Could not load availability data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    if (trailerId && !dataFetched) {
      loadAvailabilityData();
    }
  }, [trailerId, dataFetched, availabilityData, weeklyAvailabilityData.length]);

  const fetchFullAvailability = async () => {
    if (dataFetched && existingRentals.length >= 0 && !availabilityData) {
      try {
        const fullData = await fetchAvailabilityData(trailerId, "all");

        if (fullData.rentals.length > existingRentals.length) {
          setExistingRentals(fullData.rentals);

          const parsedExceptions = fullData.availabilityExceptions.map((exception) => ({
            ...exception,
            date: new Date(exception.date),
          }));

          setAvailabilityExceptions(parsedExceptions);

          if (fullData.blockedPeriods) {
            const parsedBlockedPeriods = fullData.blockedPeriods.map((period) => ({
              ...period,
              startDate: new Date(period.startDate),
              endDate: new Date(period.endDate),
            }));

            setBlockedPeriodsData(parsedBlockedPeriods);
          }
        }
      } catch (error) {
        console.error("Error loading complete availability data:", error);
      }
    }
  };

  return {
    existingRentals,
    weeklyAvailabilityData,
    availabilityExceptions,
    blockedPeriodsData,
    isLoading,
    loadingError,
    dataFetched,
    fetchFullAvailability,
  };
}