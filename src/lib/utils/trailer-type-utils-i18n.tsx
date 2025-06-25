/**
 * Comprehensive Trailer Type Utilities with i18n Support
 * 
 * This file consolidates all trailer-related static information including:
 * - Type definitions and mappings
 * - Icons and standardized styling
 * - Descriptions and specifications (via i18n)
 * - Pricing information
 * - Feature lists and characteristics
 * - Validation and formatting utilities
 */

import { ReactNode } from "react";
import { TrailerType } from "@prisma/client";

// Icon imports
import {
  BoatTrailerDouble,
  BicycleTrailer,
  BicycleTrailerDouble,
  BikeTrailer,
  CarTrailer,
  ClosedTrailer,
  ClosedTrailerDouble,
  FlatTrailer,
  FlatTrailerClosed,
  FlatTrailerClosedDouble,
  HorseTrailer,
  PlateauTrailer,
  PlateauTrailerDouble,
  TransportTrailer,
  TransportTrailerDouble,
  UnbrakedTrailer,
  UnbrakedTrailerDouble,
  Hitch,
  TipperTrailer,
  TipperTrailerDouble,
  BagageTrailer,
  DrawBarTrailer,
  FoodTrailer,
  CampingTrailer,
  Ramps,
  Net,
  Pilon2,
  Wheelbarrow,
  LongLoad,
  PlugLeft,
  PlugRight,
} from "@/lib/icons/trailer-icons";
import { 
  Car, 
  Truck, 
  Package, 
  Shield, 
  Wrench, 
  Heart, 
  ArrowUp, 
  Lock, 
  Link, 
  Zap, 
  Eye, 
  Camera,
  MapPin,
  CornerUpLeft,
  Anchor
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TrailerTypeDetails {
  icon: JSX.Element;
  name: string;
  description: string;
  features: string[];
  specifications: TrailerSpecifications;
  category: TrailerCategory;
  averagePrice: number;
}

export interface TrailerSpecifications {
  minLength: number;
  maxLength: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minWeight: number;
  maxWeight: number;
  minCapacity: number;
  maxCapacity: number;
  averagePrice: number;
}

export interface AccessoryItem {
  id: string;
  name: string;
  icon: JSX.Element;
  description: string;
  averagePrice?: number;
}

export enum TrailerCategory {
  OPEN = "open",
  CLOSED = "closed", 
  SPECIALIZED = "specialized",
  VEHICLE_TRANSPORT = "vehicle_transport",
  RECREATIONAL = "recreational",
  COMMERCIAL = "commercial"
}

// ============================================================================
// TRAILER TYPE DATA WITH i18n SUPPORT
// ============================================================================

/**
 * Get trailer type data with translations
 * @param t - Translation function from i18n
 * @returns Object with all trailer type details
 */
export const getTrailerTypeData = (t: (key: string) => string): Record<string, TrailerTypeDetails> => {
  // Create a safe translation function that returns the key if translation fails
  const safeT = (key: string): any => {
    try {
      const result = t(key);
      return result === key ? [] : result; // If translation returns key, it means translation failed
    } catch {
      return key;
    }
  };

  return {
    OPEN: {
      icon: <UnbrakedTrailer size={24} strokeWidth="1.5" />,
      name: safeT('types.OPEN.name') || 'Open trailer',
      category: TrailerCategory.OPEN,
      averagePrice: 35,
      description: safeT('types.OPEN.description') || 'Open trailer for versatile transport',
      features: Array.isArray(safeT('types.OPEN.featuresList')) ? safeT('types.OPEN.featuresList') : [],
      specifications: {
        minLength: 150,
        maxLength: 450,
        minWidth: 80,
        maxWidth: 250,
        minHeight: 0,
        maxHeight: 1000,
        minWeight: 100,
        maxWeight: 600,
        minCapacity: 150,
        maxCapacity: 1400,
        averagePrice: 35,
      }
    },

    CLOSED: {
      icon: <ClosedTrailer size={24} strokeWidth="1.5" />,
      name: safeT('types.CLOSED.name') || 'Enclosed trailer',
      category: TrailerCategory.CLOSED,
      averagePrice: 60,
      description: safeT('types.CLOSED.description') || 'Enclosed trailer for protected transport',
      features: Array.isArray(safeT('types.CLOSED.featuresList')) ? safeT('types.CLOSED.featuresList') : [],
      specifications: {
        minLength: 200,
        maxLength: 600,
        minWidth: 100,
        maxWidth: 300,
        minHeight: 130,
        maxHeight: 200,
        minWeight: 200,
        maxWeight: 1000,
        minCapacity: 300,
        maxCapacity: 2000,
        averagePrice: 60,
      }
    },

    PICKUP: {
      icon: <TransportTrailer size={24} strokeWidth="1.5" />,
      name: safeT('types.PICKUP.name') || 'Car transporter',
      category: TrailerCategory.VEHICLE_TRANSPORT,
      averagePrice: 85,
      description: safeT('types.PICKUP.description') || 'Heavy duty trailer for pickup loads',
      features: Array.isArray(safeT('types.PICKUP.featuresList')) ? safeT('types.PICKUP.featuresList') : [],
      specifications: {
        minLength: 350,
        maxLength: 750,
        minWidth: 150,
        maxWidth: 300,
        minHeight: 20,
        maxHeight: 50,
        minWeight: 400,
        maxWeight: 1200,
        minCapacity: 1000,
        maxCapacity: 3500,
        averagePrice: 85,
      }
    },

    BOAT: {
      icon: <BoatTrailerDouble size={24} strokeWidth="1.5" />,
      name: safeT('types.BOAT.name') || 'Boat trailer',
      category: TrailerCategory.RECREATIONAL,
      averagePrice: 75,
      description: safeT('types.BOAT.description') || 'Specialized trailer for boat transport',
      features: Array.isArray(safeT('types.BOAT.featuresList')) ? safeT('types.BOAT.featuresList') : [],
      specifications: {
        minLength: 400,
        maxLength: 800,
        minWidth: 180,
        maxWidth: 300,
        minHeight: 60,
        maxHeight: 120,
        minWeight: 300,
        maxWeight: 800,
        minCapacity: 800,
        maxCapacity: 2500,
        averagePrice: 75,
      }
    },

    MOTORCYCLE: {
      icon: <BikeTrailer size={24} strokeWidth="1.5" />,
      name: safeT('types.MOTORCYCLE.name') || 'Motorcycle trailer',
      category: TrailerCategory.VEHICLE_TRANSPORT,
      averagePrice: 45,
      description: safeT('types.MOTORCYCLE.description') || 'Specialized trailer for motorcycle transport',
      features: Array.isArray(safeT('types.MOTORCYCLE.featuresList')) ? safeT('types.MOTORCYCLE.featuresList') : [],
      specifications: {
        minLength: 200,
        maxLength: 400,
        minWidth: 120,
        maxWidth: 200,
        minHeight: 15,
        maxHeight: 40,
        minWeight: 150,
        maxWeight: 400,
        minCapacity: 300,
        maxCapacity: 1000,
        averagePrice: 45,
      }
    },

    CAR: {
      icon: <CarTrailer size={24} strokeWidth="1.5" />,
      name: safeT('types.CAR.name') || 'Car trailer',
      category: TrailerCategory.VEHICLE_TRANSPORT,
      averagePrice: 120,
      description: safeT('types.CAR.description') || 'Professional trailer for vehicle transport',
      features: Array.isArray(safeT('types.CAR.featuresList')) ? safeT('types.CAR.featuresList') : [],
      specifications: {
        minLength: 450,
        maxLength: 850,
        minWidth: 180,
        maxWidth: 300,
        minHeight: 25,
        maxHeight: 60,
        minWeight: 600,
        maxWeight: 1500,
        minCapacity: 1500,
        maxCapacity: 3500,
        averagePrice: 120,
      }
    },

    FURNITURE: {
      icon: <BagageTrailer size={24} strokeWidth="1.5" />,
      name: safeT('types.FURNITURE.name') || 'Furniture trailer',
      category: TrailerCategory.SPECIALIZED,
      averagePrice: 70,
      description: safeT('types.FURNITURE.description') || 'Specialized trailer for furniture transport',
      features: Array.isArray(safeT('types.FURNITURE.featuresList')) ? safeT('types.FURNITURE.featuresList') : [],
      specifications: {
        minLength: 300,
        maxLength: 600,
        minWidth: 150,
        maxWidth: 250,
        minHeight: 150,
        maxHeight: 250,
        minWeight: 300,
        maxWeight: 800,
        minCapacity: 500,
        maxCapacity: 2000,
        averagePrice: 70,
      }
    },

    LIVESTOCK: {
      icon: <HorseTrailer size={24} strokeWidth="1.5" />,
      name: safeT('types.LIVESTOCK.name') || 'Livestock trailer',
      category: TrailerCategory.SPECIALIZED,
      averagePrice: 95,
      description: safeT('types.LIVESTOCK.description') || 'Specialized trailer for animal transport',
      features: Array.isArray(safeT('types.LIVESTOCK.featuresList')) ? safeT('types.LIVESTOCK.featuresList') : [],
      specifications: {
        minLength: 300,
        maxLength: 700,
        minWidth: 150,
        maxWidth: 250,
        minHeight: 180,
        maxHeight: 250,
        minWeight: 400,
        maxWeight: 1200,
        minCapacity: 800,
        maxCapacity: 2500,
        averagePrice: 95,
      }
    },

    REFRIGERATED: {
      icon: <ClosedTrailerDouble size={24} strokeWidth="1.5" />,
      name: safeT('types.REFRIGERATED.name') || 'Refrigerated trailer',
      category: TrailerCategory.COMMERCIAL,
      averagePrice: 150,
      description: safeT('types.REFRIGERATED.description') || 'Temperature controlled trailer',
      features: Array.isArray(safeT('types.REFRIGERATED.featuresList')) ? safeT('types.REFRIGERATED.featuresList') : [],
      specifications: {
        minLength: 300,
        maxLength: 800,
        minWidth: 180,
        maxWidth: 300,
        minHeight: 180,
        maxHeight: 280,
        minWeight: 500,
        maxWeight: 1500,
        minCapacity: 1000,
        maxCapacity: 3000,
        averagePrice: 150,
      }
    },

    FLATBED: {
      icon: <PlateauTrailer size={24} strokeWidth="1.5" />,
      name: safeT('types.FLATBED.name') || 'Flatbed trailer',
      category: TrailerCategory.COMMERCIAL,
      averagePrice: 110,
      description: safeT('types.FLATBED.description') || 'Low platform trailer for heavy machinery',
      features: Array.isArray(safeT('types.FLATBED.featuresList')) ? safeT('types.FLATBED.featuresList') : [],
      specifications: {
        minLength: 400,
        maxLength: 1200,
        minWidth: 200,
        maxWidth: 350,
        minHeight: 20,
        maxHeight: 60,
        minWeight: 600,
        maxWeight: 2000,
        minCapacity: 2000,
        maxCapacity: 5000,
        averagePrice: 110,
      }
    },

    OTHER: {
      icon: <DrawBarTrailer size={24} strokeWidth="1.5" />,
      name: safeT('types.OTHER.name') || 'Special trailer',
      category: TrailerCategory.SPECIALIZED,
      averagePrice: 80,
      description: safeT('types.OTHER.description') || 'Specialized trailer for special requirements',
      features: Array.isArray(safeT('types.OTHER.featuresList')) ? safeT('types.OTHER.featuresList') : [],
      specifications: {
        minLength: 150,
        maxLength: 800,
        minWidth: 80,
        maxWidth: 300,
        minHeight: 0,
        maxHeight: 300,
        minWeight: 100,
        maxWeight: 1500,
        minCapacity: 200,
        maxCapacity: 3000,
        averagePrice: 80,
      }
    }
  };
};

// ============================================================================
// ACCESSORY DATA WITH i18n SUPPORT
// ============================================================================

/**
 * Get accessory data with translations
 * @param t - Translation function from i18n
 * @returns Array of accessory items
 */
export const getAccessoryData = (t: (key: string) => string): AccessoryItem[] => {
  const safeT = (key: string): string => {
    try {
      const result = t(key);
      return result === key ? key.split('.').pop() || key : result;
    } catch {
      return key.split('.').pop() || key;
    }
  };

  return [
    {
      id: 'SPARE_WHEEL',
      name: safeT('accessories.SPARE_WHEEL.name') || 'Spare wheel',
      icon: <Package size={20} />,
      description: safeT('accessories.SPARE_WHEEL.description') || 'Emergency spare wheel',
      averagePrice: 75
    },
    {
      id: 'SPARE_TIRE',
      name: safeT('accessories.SPARE_TIRE.name') || 'Spare tire',
      icon: <Package size={20} />,
      description: safeT('accessories.SPARE_TIRE.description') || 'Additional tire as replacement',
      averagePrice: 50
    },
    {
      id: 'TOOL_KIT',
      name: safeT('accessories.TOOL_KIT.name') || 'Tool kit',
      icon: <Wrench size={20} />,
      description: safeT('accessories.TOOL_KIT.description') || 'Basic tools for repairs',
      averagePrice: 25
    },
    {
      id: 'FIRST_AID_KIT',
      name: safeT('accessories.FIRST_AID_KIT.name') || 'First aid kit',
      icon: <Heart size={20} />,
      description: safeT('accessories.FIRST_AID_KIT.description') || 'Emergency kit for accidents',
      averagePrice: 15
    },
    {
      id: 'RAMPS',
      name: safeT('accessories.RAMPS.name') || 'Ramps',
      icon: <ArrowUp size={20} />,
      description: safeT('accessories.RAMPS.description') || 'Loading ramps for easy loading',
      averagePrice: 100
    },
    {
      id: 'TIE_DOWN_STRAPS',
      name: safeT('accessories.TIE_DOWN_STRAPS.name') || 'Tie-down straps',
      icon: <Link size={20} />,
      description: safeT('accessories.TIE_DOWN_STRAPS.description') || 'Straps to secure cargo',
      averagePrice: 30
    },
    {
      id: 'CARGO_NET',
      name: safeT('accessories.CARGO_NET.name') || 'Cargo net',
      icon: <Net size={20} />,
      description: safeT('accessories.CARGO_NET.description') || 'Net to secure loose items',
      averagePrice: 40
    },
    {
      id: 'TRAILER_LOCK',
      name: safeT('accessories.TRAILER_LOCK.name') || 'Trailer lock',
      icon: <Lock size={20} />,
      description: safeT('accessories.TRAILER_LOCK.description') || 'Security lock against theft',
      averagePrice: 35
    },
    {
      id: 'WINCH',
      name: safeT('accessories.WINCH.name') || 'Winch',
      icon: <Anchor size={20} />,
      description: safeT('accessories.WINCH.description') || 'Electric or manual winch for loading',
      averagePrice: 200
    },
    {
      id: 'JACK',
      name: safeT('accessories.JACK.name') || 'Jack',
      icon: <ArrowUp size={20} />,
      description: safeT('accessories.JACK.description') || 'Hydraulic jack for repairs',
      averagePrice: 60
    },
    {
      id: 'WHEEL_CHOCKS',
      name: safeT('accessories.WHEEL_CHOCKS.name') || 'Wheel chocks',
      icon: <Package size={20} />,
      description: safeT('accessories.WHEEL_CHOCKS.description') || 'Chocks to secure trailer',
      averagePrice: 20
    },
    {
      id: 'SAFETY_CHAINS',
      name: safeT('accessories.SAFETY_CHAINS.name') || 'Safety chains',
      icon: <Link size={20} />,
      description: safeT('accessories.SAFETY_CHAINS.description') || 'Additional safety chains',
      averagePrice: 45
    },
    {
      id: 'ELECTRICAL_ADAPTER',
      name: safeT('accessories.ELECTRICAL_ADAPTER.name') || 'Electrical adapter',
      icon: <Zap size={20} />,
      description: safeT('accessories.ELECTRICAL_ADAPTER.description') || 'Adapter for different connections',
      averagePrice: 25
    },
    {
      id: 'BRAKE_CONTROLLER',
      name: safeT('accessories.BRAKE_CONTROLLER.name') || 'Brake controller',
      icon: <Zap size={20} />,
      description: safeT('accessories.BRAKE_CONTROLLER.description') || 'Electronic brake controller for towing vehicle',
      averagePrice: 150
    },
    {
      id: 'SIDE_MIRRORS',
      name: safeT('accessories.SIDE_MIRRORS.name') || 'Side mirrors',
      icon: <Eye size={20} />,
      description: safeT('accessories.SIDE_MIRRORS.description') || 'Additional mirrors for better visibility',
      averagePrice: 80
    },
    {
      id: 'TRAILER_HITCH',
      name: safeT('accessories.TRAILER_HITCH.name') || 'Trailer hitch',
      icon: <Hitch size={20} />,
      description: safeT('accessories.TRAILER_HITCH.description') || 'Coupling system for different vehicles',
      averagePrice: 120
    },
    {
      id: 'GPS_TRACKER',
      name: safeT('accessories.GPS_TRACKER.name') || 'GPS tracker',
      icon: <MapPin size={20} />,
      description: safeT('accessories.GPS_TRACKER.description') || 'Tracking device for theft protection',
      averagePrice: 90
    },
    {
      id: 'BACKUP_CAMERA',
      name: safeT('accessories.BACKUP_CAMERA.name') || 'Backup camera',
      icon: <Camera size={20} />,
      description: safeT('accessories.BACKUP_CAMERA.description') || 'Camera for safe reversing',
      averagePrice: 180
    },
    {
      id: 'LOADING_DOCK',
      name: safeT('accessories.LOADING_DOCK.name') || 'Loading dock',
      icon: <Ramps size={20} />,
      description: safeT('accessories.LOADING_DOCK.description') || 'Adjustable ramp for easy loading',
      averagePrice: 250
    },
    {
      id: 'CORNER_PROTECTORS',
      name: safeT('accessories.CORNER_PROTECTORS.name') || 'Corner protectors',
      icon: <Shield size={20} />,
      description: safeT('accessories.CORNER_PROTECTORS.description') || 'Protection for fragile cargo at corners',
      averagePrice: 35
    }
  ];
};

// ============================================================================
// ENUM MAPPINGS (Language-agnostic)
// ============================================================================

/**
 * Maps database enum values to user-friendly trailer type names (with translation support)
 * @param t - Translation function from i18n
 * @returns Object mapping enum values to translated names
 */
export const getEnumToUIMapping = (t: (key: string, namespace?: string) => string): Record<string, string> => ({
  OPEN: t('types.OPEN.name', 'trailerTypes'),
  CLOSED: t('types.CLOSED.name', 'trailerTypes'),
  PICKUP: t('types.PICKUP.name', 'trailerTypes'),
  BOAT: t('types.BOAT.name', 'trailerTypes'),
  MOTORCYCLE: t('types.MOTORCYCLE.name', 'trailerTypes'),
  CAR: t('types.CAR.name', 'trailerTypes'),
  FURNITURE: t('types.FURNITURE.name', 'trailerTypes'),
  LIVESTOCK: t('types.LIVESTOCK.name', 'trailerTypes'),
  REFRIGERATED: t('types.REFRIGERATED.name', 'trailerTypes'),
  FLATBED: t('types.FLATBED.name', 'trailerTypes'),
  OTHER: t('types.OTHER.name', 'trailerTypes'),
});

/**
 * Maps user-facing trailer type names to database enum values (reverse mapping)
 * @param t - Translation function from i18n
 * @returns Object mapping translated names to enum values
 */
export const getUIToEnumMapping = (t: (key: string, namespace?: string) => string): Record<string, string> => {
  const mapping: Record<string, string> = {};
  const enumToUI = getEnumToUIMapping(t);
  
  // Create reverse mapping
  Object.entries(enumToUI).forEach(([enumValue, uiName]) => {
    mapping[uiName] = enumValue;
  });
  
  return mapping;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates if a trailer type is supported
 */
export const isValidTrailerType = (type: string): boolean => {
  const validTypes = ['OPEN', 'CLOSED', 'PICKUP', 'BOAT', 'MOTORCYCLE', 'CAR', 'FURNITURE', 'LIVESTOCK', 'REFRIGERATED', 'FLATBED', 'OTHER'];
  return validTypes.includes(type.toUpperCase());
};

/**
 * Gets the icon for a specific trailer type
 */
export const getTrailerIcon = (type: string): JSX.Element => {
  const icons: Record<string, JSX.Element> = {
    OPEN: <UnbrakedTrailer size={24} strokeWidth="1.5" />,
    CLOSED: <ClosedTrailer size={24} strokeWidth="1.5" />,
    PICKUP: <TransportTrailer size={24} strokeWidth="1.5" />,
    BOAT: <BoatTrailerDouble size={24} strokeWidth="1.5" />,
    MOTORCYCLE: <BikeTrailer size={24} strokeWidth="1.5" />,
    CAR: <CarTrailer size={24} strokeWidth="1.5" />,
    FURNITURE: <BagageTrailer size={24} strokeWidth="1.5" />,
    LIVESTOCK: <HorseTrailer size={24} strokeWidth="1.5" />,
    REFRIGERATED: <ClosedTrailerDouble size={24} strokeWidth="1.5" />,
    FLATBED: <PlateauTrailer size={24} strokeWidth="1.5" />,
    OTHER: <DrawBarTrailer size={24} strokeWidth="1.5" />
  };
  
  return icons[type.toUpperCase()] || icons.OTHER;
};

/**
 * Formats specifications for display
 */
export const formatSpecifications = (specs: TrailerSpecifications, t: (key: string, namespace?: string) => string) => {
  return {
    dimensions: `${specs.minLength}-${specs.maxLength} x ${specs.minWidth}-${specs.maxWidth} x ${specs.minHeight}-${specs.maxHeight} cm`,
    weight: `${specs.minWeight}-${specs.maxWeight} kg`,
    capacity: `${specs.minCapacity}-${specs.maxCapacity} kg`,
    price: `€${specs.averagePrice}/dag`
  };
};

/**
 * Gets trailer type by database enum value with translations
 */
export const getTrailerTypeByEnum = (enumValue: string, t: (key: string, namespace?: string) => string): TrailerTypeDetails | null => {
  const trailerData = getTrailerTypeData(t);
  return trailerData[enumValue.toUpperCase()] || null;
};

/**
 * Gets all trailer categories with translations
 */
export const getTrailerCategories = (t: (key: string, namespace?: string) => string) => {
  return Object.values(TrailerCategory).map(category => ({
    value: category,
    label: t(`categories.${category}`, 'trailerTypes') || category
  }));
};

/**
 * Filters trailers by category
 */
export const getTrailersByCategory = (category: TrailerCategory, t: (key: string, namespace?: string) => string): TrailerTypeDetails[] => {
  const trailerData = getTrailerTypeData(t);
  return Object.values(trailerData).filter(trailer => trailer.category === category);
};

/**
 * Gets trailer types for dropdown/select components
 */
export const getTrailerTypeOptions = (t: (key: string, namespace?: string) => string) => {
  const trailerData = getTrailerTypeData(t);
  return Object.entries(trailerData).map(([key, data]) => ({
    value: key,
    label: data.name,
    icon: data.icon
  }));
};

export default {
  getTrailerTypeData,
  getAccessoryData,
  getEnumToUIMapping,
  getUIToEnumMapping,
  isValidTrailerType,
  getTrailerIcon,
  formatSpecifications,
  getTrailerTypeByEnum,
  getTrailerCategories,
  getTrailersByCategory,
  getTrailerTypeOptions
};