import { 
  AvailabilityTimeSlot, 
  TrailerFormData, 
  Accessoire,
  TrailerApiData
} from '../types';
import { mapTrailerTypeToEnum } from "@/lib/trailer-type-mapper";

/**
 * Format availability slots for API submission
 */
export const formatAvailabilityForAPI = (formData: TrailerFormData): any[] => {
  // First, check if we have the new weeklyAvailability format
  if (formData.weeklyAvailability && Array.isArray(formData.weeklyAvailability) && formData.weeklyAvailability.length > 0) {
    console.log("Using new weeklyAvailability format:", formData.weeklyAvailability);
    
    // Map to the format expected by the API
    return formData.weeklyAvailability.map(dayData => {
      // Get start and end times for morning, afternoon, evening periods
      const morningStart = dayData.timeSlot1Start || "08:00";
      const morningEnd = dayData.timeSlot1End || "12:00";
      const afternoonStart = dayData.timeSlot2Start || "12:00";
      const afternoonEnd = dayData.timeSlot2End || "17:00";
      const eveningStart = dayData.timeSlot3Start || "17:00";
      const eveningEnd = dayData.timeSlot3End || "20:00";
      
      // Determine if periods are active based on available flag and timeslot data
      const isAvailable = dayData.available === true;
      const morning = isAvailable && dayData.timeSlot1Start !== null;
      const afternoon = isAvailable && dayData.timeSlot2Start !== null;
      const evening = isAvailable && dayData.timeSlot3Start !== null;
      
      return {
        day: dayData.day,
        available: isAvailable,
        morning,
        afternoon, 
        evening,
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        eveningStart,
        eveningEnd
      };
    });
  }
  
  // Fallback to legacy format
  // The API expects WeeklyAvailability model format
  const weeklyAvailability: any[] = [];

  // Map day keys to proper formats expected by the API
  const dayMapping: Record<string, string> = {
    monday: "MONDAY",
    tuesday: "TUESDAY",
    wednesday: "WEDNESDAY",
    thursday: "THURSDAY",
    friday: "FRIDAY",
    saturday: "SATURDAY",
    sunday: "SUNDAY",
  };

  try {
    // Ensure availableDays is an object before processing
    const availableDays = typeof formData.availableDays === 'object' && formData.availableDays !== null 
      ? formData.availableDays 
      : {};
    
    // Ensure timeSlots is an object before processing
    const timeSlots = typeof formData.timeSlots === 'object' && formData.timeSlots !== null 
      ? formData.timeSlots 
      : {};
      
    // Process all days (API expects data for all 7 days)
    Object.keys(dayMapping).forEach((day) => {
      const isAvailable = availableDays[day] === true;
      const daySlots = Array.isArray(timeSlots[day]) ? timeSlots[day] : [];
      
      // Default time slots
      const defaultMorning = { start: "08:00", end: "12:00" };
      const defaultAfternoon = { start: "12:00", end: "17:00" };
      const defaultEvening = { start: "17:00", end: "22:00" };
      
      // Initialize availability flags
      let morning = false;
      let afternoon = false;
      let evening = false;
      let morningStart = defaultMorning.start;
      let morningEnd = defaultMorning.end;
      let afternoonStart = defaultAfternoon.start;
      let afternoonEnd = defaultAfternoon.end;
      let eveningStart = defaultEvening.start;
      let eveningEnd = defaultEvening.end;
      
      if (isAvailable && daySlots.length > 0) {
        // Determine which time periods are active based on active slots
        daySlots.forEach(slot => {
          if (slot && slot.active) {
            const slotStart = parseInt(slot.from ? slot.from.split(':')[0] : "0");
            const slotEnd = parseInt(slot.to ? slot.to.split(':')[0] : "0");
            
            // Check which periods this slot covers
            if (slotStart < 12) {
              morning = true;
              morningStart = slot.from || defaultMorning.start;
              if (slotEnd <= 12) morningEnd = slot.to || defaultMorning.end;
            }
            if (slotStart < 17 && slotEnd > 12) {
              afternoon = true;
              if (slotStart >= 12) afternoonStart = slot.from || defaultAfternoon.start;
              if (slotEnd <= 17) afternoonEnd = slot.to || defaultAfternoon.end;
            }
            if (slotEnd > 17) {
              evening = true;
              if (slotStart >= 17) eveningStart = slot.from || defaultEvening.start;
              eveningEnd = slot.to || defaultEvening.end;
            }
          }
        });
      } else if (isAvailable) {
        // If the day is available but no specific slots, make all periods available
        morning = true;
        afternoon = true;
        evening = true;
      }
      
      // Create the availability record for this day
      const dayAvailability = {
        day: dayMapping[day],
        available: isAvailable,
        morning,
        afternoon,
        evening,
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        eveningStart,
        eveningEnd
      };
      
      weeklyAvailability.push(dayAvailability);
    });
    return weeklyAvailability;
  } catch (error) {
    console.error("Error formatting availability:", error);
    // If there's an error, return default availability for all days
    return Object.keys(dayMapping).map(day => ({
      day: dayMapping[day],
      morning: true,
      afternoon: true,
      evening: true,
      morningStart: "08:00",
      morningEnd: "12:00",
      afternoonStart: "12:00",
      afternoonEnd: "17:00",
      eveningStart: "17:00",
      eveningEnd: "22:00"
    }));
  }
};

/**
 * Format form data for API submission
 */
export const formatTrailerDataForApi = (formData: TrailerFormData): TrailerApiData => {
  const actualTrailerType =
    formData.trailerType === "Overig"
      ? formData.customType
      : formData.trailerType;

  // Ensure accessories is an array before filtering
  const accessories = Array.isArray(formData.accessories)
    ? formData.accessories
    : [];
    
  // Safely map selected accessories, protecting against null/undefined values
  const selectedAccessories = accessories
    .filter((acc) => acc && acc.selected)
    .map((acc) => ({
      name: acc?.name || "",
      price: typeof acc?.price === 'number' ? acc.price : 0,
    }));

  // Prepare data for API
  return {
    // Basic data
    type: mapTrailerTypeToEnum(actualTrailerType),
    title: actualTrailerType,
    description: `Een ${actualTrailerType.toLowerCase()} te huur in ${
      formData.city
    }. Afmetingen: ${formData.length} x ${formData.width} ${
      formData.height ? `x ${formData.height}` : ""
    } cm.`,

    // Location
    address: formData.address,
    city: formData.city,
    postalCode: formData.postalCode,
    country: "Netherlands",
    latitude: formData.latitude,
    longitude: formData.longitude,

    // Dimensions - Use parseFloat and fallback to null for missing values
    length: parseFloat(formData.length) || 0,
    width: parseFloat(formData.width) || 0,
    height: formData.height ? parseFloat(formData.height) || null : null,
    weight: formData.weight ? parseFloat(formData.weight) || null : null,
    capacity: formData.capacity ? parseFloat(formData.capacity) || null : null,

    // Pricing - Protect against NaN values
    pricePerDay: parseFloat(formData.pricePerDay) || 0,
    securityDeposit: formData.securityDeposit
      ? parseFloat(formData.securityDeposit) || null
      : null,

    // Features and accessories - Use a try/catch for JSON stringify to be safe
    features: JSON.stringify({ accessories: selectedAccessories }),
    
    // Extra information fields
    requiresDriversLicense: formData.requiresDriversLicense || false,
    includesInsurance: formData.includesInsurance || false,
    homeDelivery: formData.homeDelivery || false,
    deliveryFee: formData.deliveryFee && formData.homeDelivery ? parseFloat(formData.deliveryFee) || 0 : 0,
    maxDeliveryDistance: formData.maxDeliveryDistance && formData.homeDelivery ? parseInt(formData.maxDeliveryDistance) || 0 : 0,
    instructions: formData.instructions || "",
    cancellationPolicy: formData.cancellationPolicy || "flexible",
    minRentalDuration: formData.minRentalDuration ? parseInt(formData.minRentalDuration) || 1 : 1,
    maxRentalDuration: formData.maxRentalDuration ? parseInt(formData.maxRentalDuration) || 14 : 14,

    // Images - Use uploaded URLs, not preview URLs
    images: Array.isArray(formData.images) 
      ? formData.images
          .filter((img) => img?.uploaded && img?.url) // Only include successfully uploaded images
          .map((img) => ({ url: img.url }))
      : [],

    // Availability
    availability: formatAvailabilityForAPI(formData),
    weeklyAvailability: formData.weeklyAvailability,
  };
};