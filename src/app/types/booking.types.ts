import type { ExistingRental, WeeklyAvailability, BlockedPeriod } from "@/lib/utils/date-availability";

export interface RentalBookingFormProps {
  trailerId: string;
  ownerId?: string;
  trailerTitle?: string;
  pricePerDay: number;
  pricePerWeek?: number | null;
  pricePerMonth?: number | null;
  securityDeposit?: number | null;
  includesInsurance: boolean;
  deliveryFee?: number | null;
  homeDelivery: boolean;
  maxDeliveryDistance?: number | null;
  minRentalDuration?: number | null;
  maxRentalDuration?: number | null;
  available?: boolean;
  weeklyAvailability?: Array<WeeklyAvailability>;
  category: any;
  type: string;
  isMobile?: boolean;
  availabilityData?: {
    rentals: ExistingRental[];
    availabilityExceptions: any[];
    weeklyAvailability: WeeklyAvailability[];
    blockedPeriods: BlockedPeriod[];
  };
  trailerLatitude?: number;
  trailerLongitude?: number;
}

export interface BookingFormData {
  startDate?: Date;
  endDate?: Date;
  pickupTime: string;
  returnTime: string;
  needsDelivery: boolean;
  deliveryAddress: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  driversLicense: string;
  termsAccepted: boolean;
}

export interface ValidationErrors {
  dateRange?: string;
  deliveryAddress?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  driversLicense?: string;
  terms?: string;
  time?: string;
}