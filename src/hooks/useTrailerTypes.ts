import { useState, useMemo } from 'react';
import { mapTrailerTypeToEnum, mapEnumToTrailerType } from '@/lib/trailer-type-mapper';
import { trailerTypes } from '@/lib/utils/trailerTypes';

export interface TrailerCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  mainCategoryId: string;
  mainCategory: {
    id: string;
    name: string;
  };
}

interface TrailerTypesResponse {
  trailerTypes: TrailerCategory[];
  success: boolean;
}

// Map for main category by trailer type
// Since we now use string IDs, let's create a more flexible mapping
const getMainCategoryForTrailer = (trailerTypeName: string): string => {
  // Special case for "Overig" - include it in results
  if (trailerTypeName === 'Overig' || trailerTypeName === 'Other' || trailerTypeName === 'Sonstige') {
    return 'Overig';
  }
  
  // Klein
  if (['Open aanhanger', 'Bagage aanhanger', 'Fietsen aanhanger'].includes(trailerTypeName)) {
    return 'Klein';
  }
  
  // Gemiddeld
  if (['Gesloten aanhanger', 'Kipper', 'Motorfiets aanhanger'].includes(trailerTypeName)) {
    return 'Gemiddeld';
  }
  
  // Groot
  if (['Autotransporter', 'Paardentrailer', 'Boottrailer', 'Flatbed aanhanger', 
       'Verkoopwagen', 'Schamel aanhanger', 'Plateauwagen'].includes(trailerTypeName)) {
    return 'Groot';
  }
  
  // Default to "Other" category if not found
  return 'Gemiddeld';
};

/**
 * Custom hook to fetch trailer types from the database
 * 
 * @returns {Object} Trailer types data and loading state
 */
/**
 * Convert trailer types from utils file to our TrailerCategory format
 */
export default function useTrailerTypes(locale: string = 'nl') {
  // No loading state since we're using local data
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // Transform trailerTypes into the format expected by the component
  const formattedTrailerTypes = useMemo(() => {
    // Use all trailer types
    return trailerTypes.map(type => {
      // Get the appropriate translation based on locale (with fallback to nl)
      const translation = type.translations[locale] || type.translations.nl;
      const typeName = translation.type;
      
      // Get main category name based on translated trailer type name
      const mainCategoryName = getMainCategoryForTrailer(typeName);
      const mainCategoryId = mainCategoryName.toLowerCase();
      
      // Create a TrailerCategory object
      return {
        id: type.id,
        name: typeName, // Use the translated type name directly
        description: translation.description,
        icon: null, // We'll use the icon from the original data
        rawData: type, // Store the original data for direct access
        mainCategoryId,
        mainCategory: {
          id: mainCategoryId,
          name: mainCategoryName
        }
      };
    });
  }, [locale]);

  // Group trailer types by main category
  const groupedTrailerTypes = useMemo(() => {
    return formattedTrailerTypes.reduce((groups, type) => {
      const categoryName = type.mainCategory?.name || 'Other';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(type);
      return groups;
    }, {} as Record<string, TrailerCategory[]>);
  }, [formattedTrailerTypes]);

  // Get all main categories
  const mainCategories = useMemo(() => {
    return ['Klein', 'Gemiddeld', 'Groot', 'Overig'].map(name => ({
      key: name.toLowerCase(),
      value: name
    }));
  }, []);

  // Helper function to map trailer type name to enum value
  const getTrailerTypeEnum = (typeName: string) => {
    // Use the trailer-type-mapper utility for consistent mapping
    return mapTrailerTypeToEnum(typeName);
  };

  // Get icon component for a trailer type
  const getIconForType = (typeId: string) => {
    const originalType = trailerTypes.find(type => type.id === typeId);
    return originalType ? originalType.icon : null;
  };

  return {
    trailerTypes: formattedTrailerTypes,
    groupedTrailerTypes,
    mainCategories,
    getTrailerTypeEnum,
    getIconForType,
    loading,
    error
  };
}