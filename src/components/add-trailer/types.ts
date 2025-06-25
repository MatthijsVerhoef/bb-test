export interface TimeSlot {
  active: boolean;
  from: string;
  to: string;
}

export interface DailyTimeSlots {
  [key: string]: TimeSlot[];
}

export interface AvailableDays {
  [key: string]: boolean;
}

export interface Accessoire {
  name: string;
  price?: number;
  selected?: boolean;
}

export interface ImageItem {
  id: string;
  name: string;
  preview: string;
  size: string;
  file?: File;
  url?: string;
  uploading?: boolean;
  uploaded?: boolean;
}

export interface TrailerFormData {
  // Basic info
  trailerType: string;
  customType: string;

  // Details
  length: string;
  width: string;
  height: string;
  weight: string;
  capacity: string;

  // Location
  address: string;
  city: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;

  // Availability
  availableDays: AvailableDays;
  timeSlots: DailyTimeSlots;
  timeFrom: string;
  timeTo: string;
  weeklyAvailability?: any[]; // New format that stores directly what the UI collects

  // Pricing
  pricePerDay: string;
  securityDeposit: string;

  // Accessories
  accessories: Accessoire[];

  // Photos
  images: ImageItem[];

  // Extra information
  requiresDriversLicense: boolean;
  licenseType: string; // 'none', 'B', 'BE', etc.
  includesInsurance: boolean;
  homeDelivery: boolean;
  deliveryFee: string;
  maxDeliveryDistance: string;
  instructions: string;
  cancellationPolicy: string;
  minRentalDuration: string;
  maxRentalDuration: string;
  
  // Terms
  agreeToTerms: boolean;
}

export interface SectionsState {
  type: boolean;
  details: boolean;
  location: boolean;
  availability: boolean;
  pricing: boolean;
  accessories: boolean;
  photos: boolean;
  extra: boolean;
}

export interface TrailerFormState {
  expandedSections: SectionsState;
  completedSections: SectionsState;
  formData: TrailerFormData;
  isSubmitting: boolean;
  error: string;
  editingPriceFor: string | null;
  customName: string;
  priceInput: string;
  showCustomInput: boolean;
}

export interface FormSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  isExpanded: boolean;
  summary?: string;
  onToggle: () => void;
  onComplete?: () => void;
  children: React.ReactNode;
  paddingTop?: boolean;
}

export interface DayConfig {
  key: string;
  label: string;
}

export interface AvailabilityTimeSlot {
  day: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  eveningStart: string;
  eveningEnd: string;
}

export interface TrailerApiData {
  type: string;
  title: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  length: number;
  width: number;
  height: number | null;
  weight: number | null;
  capacity: number | null;
  pricePerDay: number;
  securityDeposit: number | null;
  cancellationPolicy: string;
  minRentalDuration: number;
  maxRentalDuration: number;
  features: string;
  requiresDriversLicense: boolean;
  includesInsurance: boolean;
  homeDelivery: boolean;
  images: { url: string }[];
  availability: AvailabilityTimeSlot[];
}

export enum SectionId {
  TYPE = "type",
  DETAILS = "details",
  LOCATION = "location",
  AVAILABILITY = "availability",
  PRICING = "pricing",
  ACCESSORIES = "accessories",
  PHOTOS = "photos",
  EXTRA = "extra"
}

export type SectionKeys = keyof typeof SectionId;