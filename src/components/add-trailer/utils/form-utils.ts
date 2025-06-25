import { 
  SectionId, 
  TrailerFormData, 
  SectionsState,
  DailyTimeSlots,
  Accessoire
} from "../types";

/**
 * Updates form data for a specific field
 */
export const updateFormField = <T>(
  setFormData: React.Dispatch<React.SetStateAction<TrailerFormData>>,
  field: keyof TrailerFormData,
  value: T
): void => {
  setFormData((prev) => ({
    ...prev,
    [field]: value,
  }));
};

/**
 * Updates nested form data like availableDays or timeSlots
 */
export const updateNestedFormData = <T>(
  setFormData: React.Dispatch<React.SetStateAction<TrailerFormData>>,
  parent: keyof TrailerFormData,
  key: string,
  value: T
): void => {
  setFormData((prev) => ({
    ...prev,
    [parent]: {
      ...prev[parent],
      [key]: value,
    },
  }));
};

/**
 * Check if an accessory is selected
 */
export const isAccessorySelected = (
  accessories: Accessoire[],
  name: string
): boolean => {
  // Make sure accessories is an array before calling .some()
  return accessories.some(
    (acc) => 
      acc && 
      acc.name && 
      acc.name.toLowerCase() === name.toLowerCase() && 
      acc.selected === true
  );
};

/**
 * Get the price of an accessory
 */
export const getAccessoryPrice = (
  accessories: Accessoire[],
  name: string
): number | undefined => {
  const accessory = accessories.find(
    (acc) => 
      acc && 
      acc.name && 
      acc.name.toLowerCase() === name.toLowerCase()
  );
  return typeof accessory?.price === 'number' ? accessory.price : undefined;
};

/**
 * Toggle an accessory selection
 */
export const toggleAccessory = (
  accessories: Accessoire[],
  name: string
): Accessoire[] => {
  const existingIndex = accessories.findIndex(
    (acc) => 
      acc && 
      acc.name && 
      acc.name.toLowerCase() === name.toLowerCase()
  );

  if (existingIndex !== -1) {
    // Toggle selection status if it exists
    const updatedAccessories = [...accessories];
    const currentSelected = updatedAccessories[existingIndex]?.selected === true;
    
    updatedAccessories[existingIndex] = {
      ...updatedAccessories[existingIndex],
      selected: !currentSelected,
    };
    return updatedAccessories;
  } else {
    // Add new accessory as selected
    return [...accessories, { name, selected: true }];
  }
};

/**
 * Update accessory price
 */
export const updateAccessoryPrice = (
  accessories: Accessoire[],
  name: string,
  price: number
): Accessoire[] => {
  if (typeof price !== 'number' || isNaN(price)) {
    price = 0;
  }
  
  const existingIndex = accessories.findIndex(
    (acc) => 
      acc && 
      acc.name && 
      acc.name.toLowerCase() === name.toLowerCase()
  );

  if (existingIndex !== -1) {
    // If accessory exists, update its price
    const updatedAccessories = [...accessories];
    updatedAccessories[existingIndex] = {
      ...updatedAccessories[existingIndex],
      price,
    };
    return updatedAccessories;
  } else {
    // Add new accessory with price
    return [...accessories, { name, price, selected: true }];
  }
};

/**
 * Add a custom accessory
 */
export const addCustomAccessory = (
  accessories: Accessoire[],
  name: string,
  price?: string
): Accessoire[] => {
  if (!name || !name.trim()) return accessories;
  
  // Safely parse price input
  let parsedPrice = undefined;
  if (price && price.trim()) {
    const priceNum = parseFloat(price);
    if (!isNaN(priceNum)) {
      parsedPrice = priceNum;
    }
  }
  
  return [...accessories, { name: name.trim(), price: parsedPrice, selected: true }];
};

/**
 * Toggle section expansion - ensure one section is always open
 */
export const toggleSection = (
  section: SectionId,
  expandedSections: SectionsState,
  setExpandedSections: React.Dispatch<React.SetStateAction<SectionsState>>,
  formRef: React.RefObject<HTMLDivElement>
): void => {
  const wasAlreadyExpanded = expandedSections[section];

  setExpandedSections((prev) => {
    // If the clicked section is already open, keep it open (don't allow closing)
    if (prev[section]) {
      return prev;
    }

    // Close all sections and open the clicked one
    const newState = Object.keys(prev).reduce(
      (acc, key) => ({
        ...acc,
        [key]: false,
      }),
      {} as SectionsState
    );

    // Open the clicked section
    newState[section] = true;

    return newState;
  });

  // Only scroll if we're opening a new section (not if it was already open)
  if (!wasAlreadyExpanded) {
    // Wait for the animation to start before scrolling
    setTimeout(() => {
      const sectionEl = document.getElementById(`section-${section}`);
      if (sectionEl) {
        // Calculate offset to show section header with some breathing room
        const elementTop = sectionEl.offsetTop;
        const offset = 80; // Adjust this value to control how much space above the section
        const scrollToPosition = elementTop - offset;
        
        window.scrollTo({
          top: Math.max(0, scrollToPosition), // Ensure we don't scroll above the page
          behavior: "smooth"
        });
      }
    }, 150); // Delay to let the content start expanding
  }
};

/**
 * Expand next section after completing current one
 */
export const expandNextSection = (
  currentSection: SectionId,
  setExpandedSections: React.Dispatch<React.SetStateAction<SectionsState>>
): void => {
  const sections = Object.values(SectionId);
  const currentIndex = sections.indexOf(currentSection);

  if (currentIndex >= 0 && currentIndex < sections.length - 1) {
    const nextSection = sections[currentIndex + 1];

    // Close all sections and open only the next one
    setExpandedSections(() => {
      const newState = Object.keys(SectionId).reduce((acc, key) => ({
        ...acc,
        [key]: false
      }), {} as SectionsState);
      
      newState[nextSection] = true;
      return newState;
    });

    // Wait for the animation to start before scrolling
    setTimeout(() => {
      const sectionEl = document.getElementById(`section-${nextSection}`);
      if (sectionEl) {
        // Calculate offset to show section header with some breathing room
        const elementTop = sectionEl.offsetTop;
        const offset = 80; // Adjust this value to control how much space above the section
        const scrollToPosition = elementTop - offset;
        
        window.scrollTo({
          top: Math.max(0, scrollToPosition), // Ensure we don't scroll above the page
          behavior: "smooth"
        });
      }
    }, 150); // Delay to let the content start expanding
  }
};

/**
 * Validate a section
 */
export const validateSection = (
  section: SectionId, 
  formData: TrailerFormData
): boolean => {
  let isValid = true;

  switch (section) {
    case SectionId.TYPE:
      if (!formData.trailerType) {
        isValid = false;
      } else if (formData.trailerType === "Overig" && !formData.customType) {
        isValid = false;
      }
      break;

    case SectionId.DETAILS:
      if (!formData.length || !formData.width) {
        isValid = false;
      }
      break;

    case SectionId.LOCATION:
      if (!formData.address || !formData.city || !formData.postalCode || formData.latitude === undefined || formData.longitude === undefined) {
        isValid = false;
      }
      break;

    case SectionId.AVAILABILITY:
      // At least one day must be selected
      if (!Object.values(formData.availableDays).some((v) => v)) {
        isValid = false;
        break;
      }
      
      // Check if selected days have at least one active time slot
      let hasActiveTimeSlot = false;
      
      // Safely check if any selected day has at least one active time slot
      try {
        const availableDays = Object.entries(formData.availableDays)
          .filter(([_, isAvailable]) => isAvailable)
          .map(([day]) => day);
          
        // For each available day, check if it has at least one active time slot
        for (const day of availableDays) {
          if (formData.timeSlots && 
              Array.isArray(formData.timeSlots[day]) && 
              formData.timeSlots[day].some(slot => slot && slot.active === true)) {
            hasActiveTimeSlot = true;
            break;
          }
        }
      } catch (error) {
        console.error("Error validating time slots:", error);
      }
      
      if (!hasActiveTimeSlot) {
        isValid = false;
      }
      break;

    case SectionId.PRICING:
      if (!formData.pricePerDay) {
        isValid = false;
      }
      break;

    case SectionId.ACCESSORIES:
      // Accessories are optional
      isValid = true;
      break;

    case SectionId.PHOTOS:
      // Require exactly 3 images
      if (!Array.isArray(formData.images) || formData.images.filter(img => img && img.uploaded).length < 3) {
        isValid = false;
      }
      break;
      
    case SectionId.EXTRA:
      // Basic validation for the extra section
      isValid = true; // This section is optional, so it's always valid
      
      // Additional validation for specific fields when certain options are enabled
      if (formData.homeDelivery) {
        // If home delivery is enabled, maxDeliveryDistance should be specified
        if (!formData.maxDeliveryDistance) {
          isValid = false;
        }
      }
      
      if (formData.requiresDriversLicense) {
        // If license required, licenseType should be specified
        if (!formData.licenseType || formData.licenseType === "none") {
          isValid = false;
        }
      }
      
      // Validate that minRentalDuration is a positive number
      if (formData.minRentalDuration) {
        const minDuration = parseInt(formData.minRentalDuration);
        if (isNaN(minDuration) || minDuration < 1) {
          isValid = false;
        }
      }
      
      // If maxRentalDuration is specified, it should be >= minRentalDuration
      if (formData.maxRentalDuration && formData.minRentalDuration) {
        const minDuration = parseInt(formData.minRentalDuration);
        const maxDuration = parseInt(formData.maxRentalDuration);
        if (isNaN(maxDuration) || maxDuration < minDuration) {
          isValid = false;
        }
      }
      break;
  }

  return isValid;
};

/**
 * Handle section completion
 */
export const handleCompleteSection = (
  section: SectionId, 
  formData: TrailerFormData,
  setCompletedSections: React.Dispatch<React.SetStateAction<SectionsState>>,
  setExpandedSections: React.Dispatch<React.SetStateAction<SectionsState>>
): void => {
  const isValid = validateSection(section, formData);
  
  setCompletedSections((prev) => ({
    ...prev,
    [section]: isValid,
  }));

  if (isValid) {
    // Close current section
    setExpandedSections((prev) => ({
      ...prev,
      [section]: false,
    }));
    
    // Open next section after a brief delay
    setTimeout(() => {
      expandNextSection(section, setExpandedSections);
    }, 300);
  }
};

/**
 * Initial form data
 */
export const initialFormData: TrailerFormData = {
  // Basic info
  trailerType: "",
  customType: "",

  // Details
  length: "",
  width: "",
  height: "",
  weight: "",
  capacity: "",

  // Location
  address: "",
  city: "",
  postalCode: "",
  latitude: undefined,
  longitude: undefined,

  // Availability
  availableDays: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true,
  },
  // New timeslot structure - up to 3 slots per day
  timeSlots: {
    monday: [{ active: true, from: "08:00", to: "20:00" }],
    tuesday: [{ active: true, from: "08:00", to: "20:00" }],
    wednesday: [{ active: true, from: "08:00", to: "20:00" }],
    thursday: [{ active: true, from: "08:00", to: "20:00" }],
    friday: [{ active: true, from: "08:00", to: "20:00" }],
    saturday: [{ active: true, from: "08:00", to: "20:00" }],
    sunday: [{ active: true, from: "08:00", to: "20:00" }],
  },
  // Keep these for backward compatibility
  timeFrom: "08:00",
  timeTo: "20:00",

  // Pricing
  pricePerDay: "",
  securityDeposit: "",

  // Accessories
  accessories: [],

  // Photos
  images: [],

  // Extra information
  requiresDriversLicense: false,
  licenseType: "none",
  includesInsurance: false,
  homeDelivery: false,
  deliveryFee: "",
  maxDeliveryDistance: "",
  instructions: "",
  cancellationPolicy: "moderate", // Default to moderate, will be overridden
  minRentalDuration: "1", // Will be overridden by lessor settings
  maxRentalDuration: "30",

  // Terms
  agreeToTerms: false,
};

/**
 * Initial expanded sections state
 */
export const initialExpandedSections: SectionsState = {
  type: true,
  details: false,
  location: false,
  availability: false,
  pricing: false,
  accessories: false,
  photos: false,
  extra: false,
};

/**
 * Initial completed sections state
 */
export const initialCompletedSections: SectionsState = {
  type: false,
  details: false,
  location: false,
  availability: false,
  pricing: false,
  accessories: false,
  photos: false,
  extra: false,
};

/**
 * Days of week with labels
 */
export const daysOfWeek = [
  { key: "monday", label: "Ma" },
  { key: "tuesday", label: "Di" },
  { key: "wednesday", label: "Wo" },
  { key: "thursday", label: "Do" },
  { key: "friday", label: "Vr" },
  { key: "saturday", label: "Za" },
  { key: "sunday", label: "Zo" },
];