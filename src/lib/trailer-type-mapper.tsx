// Utility function to map UI-friendly trailer types to schema enum values

/**
 * Maps user-facing trailer type names to database enum values
 * @param {string} uiTrailerType - The trailer type selected in the UI
 * @returns {string} - The corresponding enum value for the database
 */
const mapTrailerTypeToEnum = (uiTrailerType) => {
  // Define mapping from UI-friendly names to schema enum values
  const typeMapping = {
    // Perfect 1:1 mapping with suggested enum updates
    "Open aanhanger": "OPEN_AANHANGER",
    "Gesloten aanhanger": "GESLOTEN_AANHANGER",
    Autotransporter: "AUTOTRANSPORTER",
    Paardentrailer: "PAARDENTRAILER",
    Boottrailer: "BOOTTRAILER",
    Kipper: "KIPPER",
    "Motorfiets aanhanger": "MOTORFIETS_AANHANGER",
    "Flatbed aanhanger": "FLATBED_AANHANGER",
    "Bagage aanhanger": "BAGAGE_AANHANGER",
    Verkoopwagen: "VERKOOPWAGEN",
    "Fietsen aanhanger": "FIETSEN_AANHANGER",
    "Schamel aanhangers": "SCHAMEL_AANHANGERS",
    Plateauwagens: "PLATEAUWAGENS",
    Overig: "OVERIG",

    // Fallback mappings for potential older types in the system
    "Plateauwagen enkelasser": "PLATEAUWAGENS",
    "Plateauwagen dubbelasser": "PLATEAUWAGENS",
    "Ongeremd enkelasser": "OPEN_AANHANGER",
    "Ongeremd dubbelasser": "OPEN_AANHANGER",
    "Schamel aanhanger": "SCHAMEL_AANHANGERS",
    "Kipper enkelasser": "KIPPER",
    "Kipper dubbelasser": "KIPPER",
    "Transporter enkelasser": "AUTOTRANSPORTER",
    "Transporter dubbelasser": "AUTOTRANSPORTER",
    "Gesloten enkelasser": "GESLOTEN_AANHANGER",
    "Gesloten dubbelasser": "GESLOTEN_AANHANGER",
    "Boot aanhanger": "BOOTTRAILER",
    "Auto aanhanger": "AUTOTRANSPORTER",
  };

  // Return the mapped enum value, or default to "OVERIG" if no mapping exists
  return typeMapping[uiTrailerType] || "OVERIG";
};

/**
 * Maps database enum values to user-friendly trailer type names
 * @param {string} enumValue - The enum value from the database
 * @returns {string} - The user-friendly name for the UI
 */
const mapEnumToTrailerType = (enumValue) => {
  // Define reverse mapping from schema enum values to UI-friendly names
  const reverseMapping = {
    OPEN_AANHANGER: "Open aanhanger",
    GESLOTEN_AANHANGER: "Gesloten aanhanger",
    AUTOTRANSPORTER: "Autotransporter",
    PAARDENTRAILER: "Paardentrailer",
    BOOTTRAILER: "Boottrailer",
    KIPPER: "Kipper",
    MOTORFIETS_AANHANGER: "Motorfiets aanhanger",
    FLATBED_AANHANGER: "Flatbed aanhanger",
    BAGAGE_AANHANGER: "Bagage aanhanger",
    VERKOOPWAGEN: "Verkoopwagen",
    FIETSEN_AANHANGER: "Fietsen aanhanger",
    SCHAMEL_AANHANGERS: "Schamel aanhangers",
    PLATEAUWAGENS: "Plateauwagens",
    OVERIG: "Overig",
  };

  // Return the mapped UI-friendly name, or default to "Overig" if no mapping exists
  return reverseMapping[enumValue] || "Overig";
};

export { mapTrailerTypeToEnum, mapEnumToTrailerType };
