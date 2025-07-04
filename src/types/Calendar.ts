// types/calendar.ts

export const DAY_NUMBER_TO_ENUM = {
    0: "SUNDAY",
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
  } as const;
  
  export interface WeeklyAvailability {
    id: string;
    day: keyof typeof DAY_NUMBER_TO_ENUM;
    available: boolean;
    trailerId: string;
    timeSlot1Start?: string | null;
    timeSlot1End?: string | null;
    timeSlot2Start?: string | null;
    timeSlot2End?: string | null;
    timeSlot3Start?: string | null;
    timeSlot3End?: string | null;
  }
  
  export interface BlockedPeriod {
    id: string;
    startDate: Date | string;
    endDate: Date | string;
    reason?: string;
    trailerId?: string | null;
    userId: string;
  }
  
  export interface Rental {
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
  
  export interface Trailer {
    id: string;
    title: string;
    images?: { url: string }[];
  }
  
  export type DateStatus = "available" | "unavailable" | "blocked" | "rented";
  
  export interface CalendarProps {
    userId: string;
    trailers: Trailer[];
    rentals: Rental[];
    blockedPeriods: BlockedPeriod[];
    weeklyAvailability: WeeklyAvailability[];
    onAddBlockedPeriod: (period: Omit<BlockedPeriod, "id">) => Promise<void>;
    onRemoveBlockedPeriod: (id: string) => Promise<void>;
  }