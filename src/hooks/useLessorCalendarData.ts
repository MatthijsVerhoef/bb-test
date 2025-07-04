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
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    console.log(`[${requestId}] ADD_BLOCKED_PERIOD - Start`, {
      period,
      timestamp: new Date().toISOString(),
    });

    try {
      // Step 1: Prepare request data
      console.log(`[${requestId}] Step 1: Preparing request data...`);
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
      
      console.log(`[${requestId}] Request data prepared:`, requestData);

      // Step 2: Make the API call
      console.log(`[${requestId}] Step 2: Making API call to /api/user/profile/lessor-calendar/blocked-periods`);
      const apiStartTime = Date.now();
      
      const result = await ApiClient.post('/api/user/profile/lessor-calendar/blocked-periods', requestData, {
        timeout: 30000, // 30 second timeout
      });
      
      const apiDuration = Date.now() - apiStartTime;
      console.log(`[${requestId}] API call completed in ${apiDuration}ms`, {
        hasError: !!result.error,
        result: result.error ? { error: result.error } : { success: true, id: result.blockedPeriod?.id },
      });
      
      if (result.error) {
        console.error(`[${requestId}] API Error:`, result.error);
        throw new Error(result.error);
      }
      
      // Step 3: Format the response
      console.log(`[${requestId}] Step 3: Formatting response...`);
      const newPeriod = {
        ...result.blockedPeriod,
        id: result.blockedPeriod.id,
        startDate: new Date(result.blockedPeriod.startDate),
        endDate: new Date(result.blockedPeriod.endDate),
        reason: result.blockedPeriod.reason,
        trailerId: result.blockedPeriod.trailerId,
      };
      
      console.log(`[${requestId}] New period formatted:`, {
        id: newPeriod.id,
        startDate: newPeriod.startDate.toISOString(),
        endDate: newPeriod.endDate.toISOString(),
      });
      
      // Step 4: Update cache
      console.log(`[${requestId}] Step 4: Updating cache...`);
      queryClient.setQueryData(
        LESSOR_CALENDAR_KEYS.data(),
        (oldData: CalendarData | undefined) => {
          if (!oldData) return oldData;
          
          const updated = {
            ...oldData,
            blockedPeriods: [...oldData.blockedPeriods, newPeriod],
          };
          
          console.log(`[${requestId}] Cache updated. Total blocked periods: ${updated.blockedPeriods.length}`);
          return updated;
        }
      );
      
      // Clear any cached availability data
      if (period.trailerId && typeof window !== 'undefined' && window.__TRAILER_DATA) {
        delete window.__TRAILER_DATA[period.trailerId]?._availabilityData;
      }
      
      // Invalidate after a short delay
      setTimeout(() => {
        console.log(`[${requestId}] Invalidating queries...`);
        queryClient.invalidateQueries({ 
          queryKey: LESSOR_CALENDAR_KEYS.data(),
          refetchType: 'none'
        });
      }, 100);
      
      const totalDuration = Date.now() - startTime;
      console.log(`[${requestId}] ADD_BLOCKED_PERIOD - Success in ${totalDuration}ms`);
      
      return newPeriod;
    } catch (error: any) {
      const totalDuration = Date.now() - startTime;
      console.error(`[${requestId}] ADD_BLOCKED_PERIOD - Failed after ${totalDuration}ms`, {
        error: error.message,
        stack: error.stack,
        details: error.details,
      });
      
      // On error, invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: LESSOR_CALENDAR_KEYS.data() });
      throw error;
    }
  };

  const removeBlockedPeriod = async (id: string) => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    console.log(`[${requestId}] REMOVE_BLOCKED_PERIOD - Start`, {
      id,
      timestamp: new Date().toISOString(),
    });

    try {
      // Step 1: Optimistic update
      console.log(`[${requestId}] Step 1: Performing optimistic update...`);
      const previousData = queryClient.getQueryData<CalendarData>(LESSOR_CALENDAR_KEYS.data());
      
      if (previousData) {
        console.log(`[${requestId}] Current blocked periods count: ${previousData.blockedPeriods.length}`);
      }
      
      queryClient.setQueryData(
        LESSOR_CALENDAR_KEYS.data(),
        (oldData: CalendarData | undefined) => {
          if (!oldData) return oldData;
          
          const updated = {
            ...oldData,
            blockedPeriods: oldData.blockedPeriods.filter(period => period.id !== id),
          };
          
          console.log(`[${requestId}] Optimistic update: ${oldData.blockedPeriods.length} -> ${updated.blockedPeriods.length} periods`);
          return updated;
        }
      );
      
      // Step 2: Make the API call
      const url = `/api/user/profile/lessor-calendar/blocked-periods/${id}`;
      console.log(`[${requestId}] Step 2: Making DELETE request to ${url}`);
      
      try {
        const apiStartTime = Date.now();
        
        const result = await ApiClient.delete(url, {
          timeout: 30000, // 30 second timeout
        });
        
        const apiDuration = Date.now() - apiStartTime;
        console.log(`[${requestId}] DELETE request completed in ${apiDuration}ms`, {
          hasError: !!result?.error,
          result: result?.error ? { error: result.error } : { success: true },
        });
        
        if (result && result.error) {
          throw new Error(result.error);
        }
        
        console.log(`[${requestId}] Successfully removed blocked period: ${id}`);
        
      } catch (deleteError: any) {
        console.error(`[${requestId}] DELETE request failed:`, {
          message: deleteError.message,
          status: deleteError.status,
          details: deleteError.details,
        });
        
        // If it's a 404, the period might already be deleted
        if (deleteError.status === 404 || deleteError.message?.includes('not found')) {
          console.log(`[${requestId}] Blocked period already deleted or not found: ${id}`);
          // Don't revert - it's already gone
        } else {
          // Revert on other errors
          console.log(`[${requestId}] Reverting optimistic update due to error`);
          if (previousData) {
            queryClient.setQueryData(LESSOR_CALENDAR_KEYS.data(), previousData);
          }
          throw deleteError;
        }
      }
      
      // Step 3: Clear cached availability data
      console.log(`[${requestId}] Step 3: Clearing cached availability data...`);
      if (typeof window !== 'undefined' && window.__TRAILER_DATA) {
        Object.keys(window.__TRAILER_DATA).forEach(trailerId => {
          delete window.__TRAILER_DATA[trailerId]?._availabilityData;
        });
      }
      
      // Step 4: Invalidate after a short delay
      setTimeout(() => {
        console.log(`[${requestId}] Invalidating queries...`);
        queryClient.invalidateQueries({ 
          queryKey: LESSOR_CALENDAR_KEYS.data(),
          refetchType: 'none'
        });
      }, 100);
      
      const totalDuration = Date.now() - startTime;
      console.log(`[${requestId}] REMOVE_BLOCKED_PERIOD - Success in ${totalDuration}ms`);
      
    } catch (error: any) {
      const totalDuration = Date.now() - startTime;
      console.error(`[${requestId}] REMOVE_BLOCKED_PERIOD - Failed after ${totalDuration}ms`, {
        error: error.message,
        stack: error.stack,
        name: error.name,
        status: error.status,
      });
      
      // On error, force refetch to get correct data
      queryClient.invalidateQueries({ queryKey: LESSOR_CALENDAR_KEYS.data() });
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