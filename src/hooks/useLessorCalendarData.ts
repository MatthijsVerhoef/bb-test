"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';

export type Trailer = {
  id: string;
  title: string;
  pricePerDay?: number;
  images?: { url: string }[];
  available: boolean;
};

export type Rental = {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  status: string;
  renter: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  trailer: {
    id: string;
    title: string;
    pricePerDay?: number;
    images?: { url: string }[];
  };
};

export type BlockedPeriod = {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  reason?: string;
  trailerId?: string;
};

export type WeekAvailability = Record<string, any>;

export type WeeklyAvailabilityItem = {
  id: string;
  day: string;
  available: boolean;
  timeSlot1Start?: string;
  timeSlot1End?: string;
  timeSlot2Start?: string;
  timeSlot2End?: string;
  timeSlot3Start?: string;
  timeSlot3End?: string;
  trailerId: string;
};

export type CalendarData = {
  trailers: Trailer[];
  rentals: Rental[];
  blockedPeriods: BlockedPeriod[];
  weeklyAvailability: WeekAvailability;
  weeklyAvailabilityByTrailer: Record<string, WeekAvailability>;
  weeklyAvailabilityData: WeeklyAvailabilityItem[];
  availabilityExceptions: any[];
};

export const LESSOR_CALENDAR_KEYS = {
  all: ['lessorCalendar'] as const,
  data: () => [...LESSOR_CALENDAR_KEYS.all, 'data'] as const,
  trailers: () => [...LESSOR_CALENDAR_KEYS.all, 'trailers'] as const,
  rentals: () => [...LESSOR_CALENDAR_KEYS.all, 'rentals'] as const,
  blocked: () => [...LESSOR_CALENDAR_KEYS.all, 'blockedPeriods'] as const,
  availability: () => [...LESSOR_CALENDAR_KEYS.all, 'weeklyAvailability'] as const,
};

function formatCalendarData(data: any): CalendarData {
  try {
    const rawRentals = Array.isArray(data.rentals) ? data.rentals : [];
    const rawBlockedPeriods = Array.isArray(data.blockedPeriods) ? data.blockedPeriods : [];
    const rawTrailers = Array.isArray(data.trailers) ? data.trailers : [];
    const rawWeeklyAvailability = typeof data.weeklyAvailability === 'object' ? data.weeklyAvailability : {};
    
    const rawWeeklyAvailabilityByTrailer = typeof data.weeklyAvailabilityByTrailer === 'object' ? data.weeklyAvailabilityByTrailer : {};
    const rawWeeklyAvailabilityData = Array.isArray(data.weeklyAvailabilityData) ? data.weeklyAvailabilityData : [];
    const rawAvailabilityExceptions = Array.isArray(data.availabilityExceptions) ? data.availabilityExceptions : [];

    const formattedRentals = rawRentals
      .filter((rental: any) => !!rental && typeof rental === 'object' && rental?.trailer)
      .map((rental: any) => {
        try {
          return {
            id: rental.id || `temp_${Math.random().toString(36).substring(2, 11)}`,
            startDate: rental.startDate ? new Date(rental.startDate) : new Date(),
            endDate: rental.endDate ? new Date(rental.endDate) : new Date(),
            status: rental.status || "PENDING",
            renter: {
              id: rental?.renter?.id || "",
              firstName: rental?.renter?.firstName || "Onbekend",
              lastName: rental?.renter?.lastName || "",
              profilePicture: rental?.renter?.profilePicture,
            },
            trailer: {
              id: rental?.trailer?.id || "",
              title: rental?.trailer?.title || "Onbekende aanhanger",
              pricePerDay: rental?.trailer?.pricePerDay || 0,
              images: Array.isArray(rental?.trailer?.images) ? rental.trailer.images : [],
            },
          };
        } catch (e) {
          console.error("Error formatting rental:", e);
          return {
            id: `error_${Math.random().toString(36).substring(2, 11)}`,
            startDate: new Date(),
            endDate: new Date(),
            status: "ERROR",
            renter: { id: "", firstName: "Error", lastName: "", profilePicture: null },
            trailer: { id: "", title: "Error", pricePerDay: 0, images: [] },
          };
        }
      });

    const formattedBlockedPeriods = rawBlockedPeriods
      .filter((period: any) => !!period && typeof period === 'object')
      .map((period: any) => {
        try {
          return {
            id: period.id || `temp_${Math.random().toString(36).substring(2, 11)}`,
            startDate: period.startDate ? new Date(period.startDate) : new Date(),
            endDate: period.endDate ? new Date(period.endDate) : new Date(),
            reason: period.reason || "",
            trailerId: period.trailerId || undefined,
          };
        } catch (e) {
          console.error("Error formatting blocked period:", e);
          return {
            id: `error_${Math.random().toString(36).substring(2, 11)}`,
            startDate: new Date(),
            endDate: new Date(),
            reason: "Error",
            trailerId: undefined,
          };
        }
      });

    const formattedTrailers = rawTrailers
      .filter((trailer: any) => !!trailer && typeof trailer === 'object')
      .map((trailer: any) => ({
        id: trailer.id || `temp_${Math.random().toString(36).substring(2, 11)}`,
        title: trailer.title || "Unnamed Trailer",
        pricePerDay: trailer.pricePerDay || 0,
        images: Array.isArray(trailer.images) ? trailer.images : [],
        available: typeof trailer.available === 'boolean' ? trailer.available : true,
      }));

    const formattedAvailabilityExceptions = rawAvailabilityExceptions
      .filter((exception: any) => !!exception && typeof exception === 'object')
      .map((exception: any) => ({
        ...exception,
        date: exception.date ? new Date(exception.date) : new Date(),
      }));

    return {
      trailers: formattedTrailers,
      rentals: formattedRentals,
      blockedPeriods: formattedBlockedPeriods,
      weeklyAvailability: rawWeeklyAvailability,
      weeklyAvailabilityByTrailer: rawWeeklyAvailabilityByTrailer,
      weeklyAvailabilityData: rawWeeklyAvailabilityData,
      availabilityExceptions: formattedAvailabilityExceptions,
    };
  } catch (error) {
    console.error("Failed to format calendar data:", error);
    return {
      trailers: [],
      rentals: [],
      blockedPeriods: [],
      weeklyAvailability: {},
      weeklyAvailabilityByTrailer: {},
      weeklyAvailabilityData: [],
      availabilityExceptions: [],
    };
  }
}

export function useLessorCalendarData(options = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: LESSOR_CALENDAR_KEYS.data(),
    queryFn: async () => {
      try {
        const data = await ApiClient.get('/api/user/profile/lessor-calendar', {
          credentials: 'include',
          cache: 'default',
        });
        
        if (data.error) {
          console.error("Error fetching lessor calendar data:", data.error);
          return {
            trailers: [],
            rentals: [],
            blockedPeriods: [],
            weeklyAvailability: {},
            weeklyAvailabilityByTrailer: {},
            weeklyAvailabilityData: [],
            availabilityExceptions: [],
          };
        }
        
        return formatCalendarData(data);
      } catch (error) {
        console.error("Failed to fetch lessor calendar data:", error);
        return {
          trailers: [],
          rentals: [],
          blockedPeriods: [],
          weeklyAvailability: {},
          weeklyAvailabilityByTrailer: {},
          weeklyAvailabilityData: [],
          availabilityExceptions: [],
        };
      }
    },
    staleTime: 60 * 1000,
    retry: 1,
    useErrorBoundary: false,
    ...options,
  });

  const addBlockedPeriod = async (period: Omit<BlockedPeriod, "id">) => {
    console.log('called')
    try {
      const requestData = {
        startDate: period.startDate instanceof Date 
          ? period.startDate.toISOString() 
          : new Date(period.startDate).toISOString(),
        endDate: period.endDate instanceof Date 
          ? period.endDate.toISOString() 
          : new Date(period.endDate).toISOString(),
        reason: period.reason || undefined,
        trailerId: period.trailerId || undefined,
        allDay: true,
        morning: false,
        afternoon: false,
        evening: false,
      };

      // Make the API call first
      const result = await ApiClient.post('/api/user/profile/lessor-calendar/blocked-periods', requestData);
      
      if (result.error) {
        console.error("API Error adding blocked period:", result.error);
        throw new Error(result.error);
      }
      
      // Format the new period from the API response
      const newPeriod = {
        ...result.blockedPeriod,
        id: result.blockedPeriod.id,
        startDate: new Date(result.blockedPeriod.startDate),
        endDate: new Date(result.blockedPeriod.endDate),
        reason: result.blockedPeriod.reason,
        trailerId: result.blockedPeriod.trailerId,
      };
      
      // Update the cache immediately with the new data
      queryClient.setQueryData(
        LESSOR_CALENDAR_KEYS.data(),
        (oldData: CalendarData | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            blockedPeriods: [...oldData.blockedPeriods, newPeriod],
          };
        }
      );
      
      // Clear any cached availability data
      if (period.trailerId && typeof window !== 'undefined' && window.__TRAILER_DATA) {
        delete window.__TRAILER_DATA[period.trailerId]?._availabilityData;
      }
      
      // Don't invalidate immediately - let the optimistic update show
      // Invalidate after a short delay to ensure fresh data
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: LESSOR_CALENDAR_KEYS.data(),
          refetchType: 'none' // Don't refetch immediately, just mark as stale
        });
      }, 100);
      
      return newPeriod;
    } catch (error) {
      // On error, invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: LESSOR_CALENDAR_KEYS.data() });
      console.error("Failed to add blocked period:", error);
      throw error;
    }
  };

  const removeBlockedPeriod = async (id: string) => {
    try {
      // Optimistically update the cache first
      const previousData = queryClient.getQueryData<CalendarData>(LESSOR_CALENDAR_KEYS.data());
      
      queryClient.setQueryData(
        LESSOR_CALENDAR_KEYS.data(),
        (oldData: CalendarData | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            blockedPeriods: oldData.blockedPeriods.filter(period => period.id !== id),
          };
        }
      );
      
      // Make the API call - handle different response formats
      try {
        const result = await ApiClient.delete(`/api/user/profile/lessor-calendar/blocked-periods/${id}`);
        
        // Check if there's an error in the response
        if (result && result.error) {
          throw new Error(result.error);
        }
        
        // Success - the delete worked
        console.log("Successfully removed blocked period:", id);
        
      } catch (deleteError: any) {
        // If it's a 404, the period might already be deleted
        if (deleteError.status === 404) {
          console.log("Blocked period already deleted:", id);
          // Don't revert - it's already gone
        } else {
          // Revert on other errors
          if (previousData) {
            queryClient.setQueryData(LESSOR_CALENDAR_KEYS.data(), previousData);
          }
          console.error("API Error removing blocked period:", deleteError);
          throw deleteError;
        }
      }
      
      // Clear cached availability data
      if (typeof window !== 'undefined' && window.__TRAILER_DATA) {
        Object.keys(window.__TRAILER_DATA).forEach(trailerId => {
          delete window.__TRAILER_DATA[trailerId]?._availabilityData;
        });
      }
      
      // Invalidate after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: LESSOR_CALENDAR_KEYS.data(),
          refetchType: 'none'
        });
      }, 100);
      
    } catch (error) {
      // On error, force refetch to get correct data
      queryClient.invalidateQueries({ queryKey: LESSOR_CALENDAR_KEYS.data() });
      console.error("Failed to remove blocked period:", error);
      throw error;
    }
  };

  const updateAvailability = async (availability: WeekAvailability) => {
    try {
      queryClient.setQueryData(
        LESSOR_CALENDAR_KEYS.data(),
        (oldData: CalendarData | undefined) => {
          if (!oldData) return undefined;
          
          return {
            ...oldData,
            weeklyAvailability: availability,
          };
        }
      );
      
      const result = await ApiClient.put('/api/user/profile/lessor-calendar/availability', availability);
      
      if (result.error) {
        console.error("API Error updating availability:", result.error);
      }
    } catch (error) {
      console.error("Failed to update availability:", error);
    }
  };

  const prefetchCalendarData = async () => {
    await queryClient.prefetchQuery({
      queryKey: LESSOR_CALENDAR_KEYS.data(),
      queryFn: async () => {
        const data = await ApiClient.get('/api/user/profile/lessor-calendar', {
          credentials: 'include',
          cache: 'default',
        });
        
        return formatCalendarData(data);
      },
    });
  };

  return {
    ...query,
    addBlockedPeriod,
    removeBlockedPeriod,
    updateAvailability,
    prefetchCalendarData,
  };
}

export function prefetchLessorCalendarData(queryClient: any) {
  return queryClient.prefetchQuery({
    queryKey: LESSOR_CALENDAR_KEYS.data(),
    queryFn: async () => {
      try {
        const data = await ApiClient.get('/api/user/profile/lessor-calendar', {
          credentials: 'include',
          cache: 'default',
        });
        
        if (data.error) {
          console.error("Error prefetching lessor calendar data:", data.error);
          return {
            trailers: [],
            rentals: [],
            blockedPeriods: [],
            weeklyAvailability: {},
            weeklyAvailabilityByTrailer: {},
            weeklyAvailabilityData: [],
            availabilityExceptions: [],
          };
        }
        
        return formatCalendarData(data);
      } catch (error) {
        console.error("Failed to prefetch lessor calendar data:", error);
        return {
          trailers: [],
          rentals: [],
          blockedPeriods: [],
          weeklyAvailability: {},
          weeklyAvailabilityByTrailer: {},
          weeklyAvailabilityData: [],
          availabilityExceptions: [],
        };
      }
    },
    retry: 1,
  });
}