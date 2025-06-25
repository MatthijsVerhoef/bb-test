import { TrailerDraft } from "@/types/drafts";
import { TrailerData, TrailerCompletenessResult } from "@/types/trailer";

export const convertDraftToTrailerData = (draft: TrailerDraft): TrailerData => {
  const formData = draft.formData;

  return {
    id: draft.id,
    title:
      formData.trailerType || formData.customType || "Onbenoemde aanhanger",
    description: "",
    pricePerDay: parseFloat(formData.pricePerDay) || 0,
    views: 0,
    status: "DRAFT",
    available: false,
    type: formData.trailerType || formData.customType || null,
    mainImage: formData.images?.[0]?.url || null,
    location: formData.city
      ? `${formData.city}${
          formData.postalCode ? `, ${formData.postalCode}` : ""
        }`
      : undefined,
    address: formData.address,
    city: formData.city,
    postalCode: formData.postalCode,
    length: parseFloat(formData.length) || undefined,
    width: parseFloat(formData.width) || undefined,
    height: parseFloat(formData.height) || undefined,
    weight: parseFloat(formData.weight) || undefined,
    capacity: parseFloat(formData.capacity) || undefined,
    rentalCount: 0,
    lastRented: null,
    lastMaintenance: null,
    isDraft: true,
    draftId: draft.id,
    lastModified: new Date(draft.updatedAt),
  };
};

export const checkTrailerCompleteness = (
  trailer: TrailerData
): TrailerCompletenessResult => {
  const requiredFields = [
    { field: "title", value: trailer.title },
    { field: "description", value: trailer.description },
    { field: "pricePerDay", value: trailer.pricePerDay },
    { field: "type", value: trailer.type },
    { field: "city", value: trailer.city },
    { field: "address", value: trailer.address },
    { field: "postalCode", value: trailer.postalCode },
  ];

  const missingFields = requiredFields.filter(
    ({ value }) =>
      value === null || value === undefined || value === "" || value === 0
  );

  const isComplete = missingFields.length === 0 && !!trailer.mainImage;
  const missingCount = missingFields.length + (!trailer.mainImage ? 1 : 0);

  return {
    isComplete,
    missingFields: missingFields.map(({ field }) => field),
    missingImage: !trailer.mainImage,
    completionPercentage: Math.round(
      ((requiredFields.length -
        missingFields.length +
        (trailer.mainImage ? 1 : 0)) /
        (requiredFields.length + 1)) *
        100
    ),
    missingCount,
  };
};

export const getFieldDisplayName = (field: string): string => {
  const fieldNames: Record<string, string> = {
    title: "titel",
    description: "beschrijving",
    pricePerDay: "prijs",
    type: "type",
    city: "stad",
    address: "adres",
    postalCode: "postcode",
  };
  return fieldNames[field] || field;
};
