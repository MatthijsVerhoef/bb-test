"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/client";
import dynamic from "next/dynamic";
import { useAuth } from "@/stores/auth.store";

// Types
import { SectionId, TrailerFormData } from "./types";

// Utilities
import {
  initialFormData,
  initialExpandedSections,
  initialCompletedSections,
  updateFormField,
  updateNestedFormData,
  validateSection,
} from "./utils/form-utils";
import { formatTrailerDataForApi } from "./utils/api-utils";

// Draft services
import { draftService } from "@/services/draft.service";
import {
  generateDraftAutoName,
  shouldTriggerAutoSave,
} from "@/lib/utils/draft-naming";

// Light form sections (always loaded)
import { TypeSection } from "./sections/type-section";
import { DetailsSection } from "./sections/details-section";
import { PricingSection } from "./sections/pricing-section";

// Heavy sections (lazy loaded) - only the content, not the wrapper
const LocationSection = dynamic(
  () =>
    import("./sections/location-section").then((mod) => ({
      default: mod.LocationSection,
    })),
  {
    ssr: false,
  }
);

const AvailabilitySection = dynamic(
  () =>
    import("./sections/availability-section-working").then((mod) => ({
      default: mod.AvailabilitySection,
    })),
  {
    ssr: false,
  }
);

const AccessoriesSection = dynamic(
  () =>
    import("./sections/accessories-section-minimal").then((mod) => ({
      default: mod.AccessoriesSection,
    })),
  {
    ssr: false,
  }
);

const PhotosSection = dynamic(
  () =>
    import("./sections/photos-section").then((mod) => ({
      default: mod.PhotosSection,
    })),
  {
    ssr: false,
  }
);

const ExtraSection = dynamic(
  () =>
    import("./sections/extra-section").then((mod) => ({
      default: mod.ExtraSection,
    })),
  {
    ssr: false,
  }
);

// Components
import { TermsSubmit } from "./components/terms-submit";

interface OnePageTrailerFormProps {
  trailerId?: string; // If provided, form is in edit mode
}

export default function OnePageTrailerForm({
  trailerId,
}: OnePageTrailerFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("addTrailer");
  const { updateProfile } = useAuth();

  // Determine if we're in edit mode
  const isEditMode = Boolean(trailerId);

  // State
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode); // Loading for edit mode
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState(
    initialExpandedSections
  );
  const [completedSections, setCompletedSections] = useState(
    initialCompletedSections
  );
  const [formData, setFormData] = useState<TrailerFormData>(initialFormData);

  // Draft-related state (disabled in edit mode)
  const [currentDraft, setCurrentDraft] = useState<TrailerDraft | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [lessorSettings, setLessorSettings] = useState<{
    defaultMinRentalDuration: number;
    defaultMaxRentalDuration: number;
    defaultSecurityDeposit: number;
    cancellationPolicy: string;
  } | null>(null);

  // Fetch lessor settings
  useEffect(() => {
    const fetchLessorSettings = async () => {
      try {
        const response = await fetch("/api/user/lessor-settings");
        if (response.ok) {
          const data = await response.json();

          const settings = {
            defaultMinRentalDuration: data.rentalSettings.minRentalDuration,
            defaultMaxRentalDuration: data.rentalSettings.maxRentalDuration,
            defaultSecurityDeposit:
              data.rentalSettings.securityDepositPercentage,
            cancellationPolicy: data.cancellationPolicy,
          };

          setLessorSettings(settings);

          // Apply settings to form data ONLY if not in edit mode and no draft
          if (!isEditMode && !currentDraft) {
            setFormData((prev) => ({
              ...prev,
              minRentalDuration: settings.defaultMinRentalDuration.toString(),
              maxRentalDuration: settings.defaultMaxRentalDuration.toString(),
              cancellationPolicy: settings.cancellationPolicy,
              // Don't set security deposit here - it will be calculated based on price
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch lessor settings:", error);
      }
    };

    // Only fetch if user is authenticated
    if (!isEditMode) {
      fetchLessorSettings();
    }
  }, [isEditMode, currentDraft]);

  // Auto-save function (works in both create and edit mode)
  const performAutoSave = useCallback(
    (data: TrailerFormData) => {
      if (!shouldTriggerAutoSave(data) || !draftService.isDraftSupported()) {
        return;
      }

      setAutoSaveStatus("saving");

      try {
        let autoGeneratedName = generateDraftAutoName(data);

        // In edit mode, prefix with "Bewerken: " and append trailer ID for identification
        if (isEditMode) {
          autoGeneratedName = `Bewerken: ${autoGeneratedName} [${trailerId}]`;
        }

        if (currentDraft) {
          const updatedDraft = draftService.updateDraft(currentDraft.id, {
            autoGeneratedName,
            formData: data,
          });
          setCurrentDraft(updatedDraft);
        } else {
          const newDraft = draftService.createDraft(autoGeneratedName, data);
          setCurrentDraft(newDraft);
        }

        setAutoSaveStatus("saved");
        setHasUnsavedChanges(false);

        // Reset status after a delay
        setTimeout(() => {
          setAutoSaveStatus("idle");
        }, 2000);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setAutoSaveStatus("error");

        // Reset status after a delay
        setTimeout(() => {
          setAutoSaveStatus("idle");
        }, 3000);
      }
    },
    [currentDraft, isEditMode, trailerId]
  );

  // Debounced auto-save
  const scheduleAutoSave = useCallback(
    (data: TrailerFormData) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        performAutoSave(data);
      }, 3000); // Auto-save after 3 seconds of inactivity
    },
    [performAutoSave]
  );

  // Update form data handler (supports both direct values and functions)
  const updateFormData = <T,>(
    field: keyof TrailerFormData,
    value: T | ((prev: T) => T)
  ): void => {
    let newFormData: TrailerFormData;

    if (typeof value === "function") {
      setFormData((prev) => {
        newFormData = {
          ...prev,
          [field]: (value as (prev: T) => T)(prev[field] as T),
        };
        return newFormData;
      });
    } else {
      setFormData((prev) => {
        newFormData = { ...prev, [field]: value };
        return newFormData;
      });
    }

    // Trigger auto-save (in both create and edit mode)
    setHasUnsavedChanges(true);
    setTimeout(() => {
      if (newFormData) {
        scheduleAutoSave(newFormData);
      }
    }, 0);
  };

  // Function to load trailer data for edit mode
  const loadTrailerData = useCallback(async () => {
    if (!isEditMode || !trailerId) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/trailers/${trailerId}`);

      if (!response.ok) {
        throw new Error("Trailer niet gevonden");
      }

      const trailerData = await response.json();

      // Convert trailer data to form format
      const convertedFormData: TrailerFormData = {
        // Basic info
        trailerType: trailerData.type || "",
        customType: trailerData.customType || "",

        // Details (flat structure matching TrailerFormData)
        length: trailerData.length ? String(trailerData.length) : "",
        width: trailerData.width ? String(trailerData.width) : "",
        height: trailerData.height ? String(trailerData.height) : "",
        weight: trailerData.weight ? String(trailerData.weight) : "",
        capacity: trailerData.capacity ? String(trailerData.capacity) : "",

        // Location (flat structure)
        address: trailerData.address || "",
        city: trailerData.city || "",
        postalCode: trailerData.postalCode || "",
        latitude: trailerData.latitude || undefined,
        longitude: trailerData.longitude || undefined,

        // Availability (flat structure)
        availableDays: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: true,
        },
        timeSlots: {
          monday: [{ active: true, from: "08:00", to: "20:00" }],
          tuesday: [{ active: true, from: "08:00", to: "20:00" }],
          wednesday: [{ active: true, from: "08:00", to: "20:00" }],
          thursday: [{ active: true, from: "08:00", to: "20:00" }],
          friday: [{ active: true, from: "08:00", to: "20:00" }],
          saturday: [{ active: true, from: "08:00", to: "20:00" }],
          sunday: [{ active: true, from: "08:00", to: "20:00" }],
        },
        timeFrom: "08:00",
        timeTo: "20:00",

        // Pricing (flat structure)
        pricePerDay: trailerData.pricePerDay
          ? String(trailerData.pricePerDay)
          : "",
        securityDeposit: trailerData.securityDeposit
          ? String(trailerData.securityDeposit)
          : "",

        // Extra information
        requiresDriversLicense: trailerData.requiresDriversLicense || false,
        licenseType: trailerData.licenseType || "none",
        includesInsurance: trailerData.includesInsurance || false,
        homeDelivery: trailerData.homeDelivery || false,
        deliveryFee: trailerData.deliveryFee
          ? String(trailerData.deliveryFee)
          : "",
        maxDeliveryDistance: trailerData.maxDeliveryDistance
          ? String(trailerData.maxDeliveryDistance)
          : "",
        cancellationPolicy: trailerData.cancellationPolicy || "flexible",
        minRentalDuration: trailerData.minRentalDuration
          ? String(trailerData.minRentalDuration)
          : "1",
        maxRentalDuration: trailerData.maxRentalDuration
          ? String(trailerData.maxRentalDuration)
          : "14",
        instructions: trailerData.instructions || "",

        // Arrays
        accessories: trailerData.accessories || [],
        images: trailerData.images
          ? trailerData.images.map((img) => ({
              id: img.id || Math.random().toString(36).substr(2, 9),
              name: img.title || "Uploaded image",
              preview: img.url, // Use url as preview for existing images
              url: img.url,
              uploaded: true, // Mark as already uploaded
              size: "0", // Size not available for existing images
            }))
          : [],

        // Terms (already agreed when creating)
        agreeToTerms: true,
      };

      setFormData(convertedFormData);

      // Validate each section to determine completion status
      setCompletedSections({
        type: validateSection(SectionId.TYPE, convertedFormData),
        details: validateSection(SectionId.DETAILS, convertedFormData),
        location: validateSection(SectionId.LOCATION, convertedFormData),
        pricing: validateSection(SectionId.PRICING, convertedFormData),
        availability: validateSection(
          SectionId.AVAILABILITY,
          convertedFormData
        ),
        accessories: validateSection(SectionId.ACCESSORIES, convertedFormData),
        photos: validateSection(SectionId.PHOTOS, convertedFormData),
        extra: validateSection(SectionId.EXTRA, convertedFormData),
      });
    } catch (error: any) {
      console.error("Error loading trailer data:", error);
      setError(error.message || "Kon trailer gegevens niet laden");
    } finally {
      setIsLoading(false);
    }
  }, [isEditMode, trailerId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation
    let isValid = true;
    const requiredSections = [
      SectionId.TYPE,
      SectionId.DETAILS,
      SectionId.LOCATION,
      SectionId.PRICING,
    ];

    for (const section of requiredSections) {
      if (!validateSection(section, formData)) {
        isValid = false;

        setExpandedSections((prev) => ({
          ...prev,
          [section]: true,
        }));

        setTimeout(() => {
          const sectionEl = document.getElementById(`section-${section}`);
          if (sectionEl) {
            sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 200);

        break;
      }
    }

    if (!isValid) {
      setError(t("errors.requiredFields"));
      return;
    }

    if (!formData.agreeToTerms) {
      setError(t("errors.acceptTerms"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Format data for API
      const trailerData = formatTrailerDataForApi(formData);

      // Send to API
      const url = isEditMode
        ? `/api/trailers/${trailerId}`
        : "/api/trailers/add";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trailerData),
      });

      // Handle response
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("errors.defaultError"));
      }

      // Delete draft after successful submission (only in create mode)
      if (!isEditMode && currentDraft) {
        try {
          draftService.deleteDraft(currentDraft.id);
        } catch (error) {
          console.warn("Failed to delete draft after submission:", error);
        }
      }

      if (!isEditMode) {
        try {
          await updateProfile({});
        } catch (error) {
          console.warn("Failed to refresh user profile:", error);
          // Continue with redirect even if profile refresh fails
        }
      }

      // Redirect based on mode
      if (isEditMode) {
        router.push(`/aanbod/${trailerId}`); // Go to trailer detail page
      } else {
        router.push("/"); // Go to success page
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      setError(error?.message || t("errors.submissionError"));
      setIsSubmitting(false);
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Load trailer data for edit mode or draft for create mode
  useEffect(() => {
    if (isEditMode) {
      // First check if there's an existing edit draft for this trailer
      const checkForEditDraft = () => {
        if (draftService.isDraftSupported() && trailerId) {
          const allDrafts = draftService.getDrafts();

          const editDraft = allDrafts.find(
            (draft) =>
              draft.autoGeneratedName.startsWith("Bewerken:") &&
              // Check if this draft is for the current trailer by looking for the trailer ID in brackets
              draft.autoGeneratedName.includes(`[${trailerId}]`)
          );

          if (editDraft) {
            setCurrentDraft(editDraft);
            setFormData(editDraft.formData);
            setHasUnsavedChanges(false);
            setIsLoading(false);

            setCompletedSections({
              type: validateSection(SectionId.TYPE, editDraft.formData),
              details: validateSection(SectionId.DETAILS, editDraft.formData),
              location: validateSection(SectionId.LOCATION, editDraft.formData),
              pricing: validateSection(SectionId.PRICING, editDraft.formData),
              availability: validateSection(
                SectionId.AVAILABILITY,
                editDraft.formData
              ),
              accessories: validateSection(
                SectionId.ACCESSORIES,
                editDraft.formData
              ),
              photos: validateSection(SectionId.PHOTOS, editDraft.formData),
            });
            return true;
          }
        }
        return false;
      };

      if (!checkForEditDraft()) {
        loadTrailerData();
      }
    } else {
      // Load draft from URL parameter (if resuming editing)
      const urlParams = new URLSearchParams(window.location.search);
      const draftId = urlParams.get("draft");

      if (draftId && draftService.isDraftSupported()) {
        try {
          const draft = draftService.getDraft(draftId);
          if (draft) {
            setCurrentDraft(draft);
            setFormData(draft.formData);
            setHasUnsavedChanges(false);
          }
        } catch (error) {
          console.error("Failed to load draft:", error);
        }
      }
    }
  }, [isEditMode, loadTrailerData, trailerId]);

  // Toggle section wrapper - ensure one section is always open
  const handleToggleSection = (section: SectionId) => {
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
        {} as typeof prev
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
          const offset = 200;
          const scrollToPosition = elementTop - offset;

          window.scrollTo({
            top: Math.max(0, scrollToPosition),
            behavior: "smooth",
          });
        }
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div
        className={`max-w-2xl mx-auto px-4 ${
          isEditMode ? "pt-28 pb-20" : "py-12"
        }`}
        ref={formRef}
      >
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-semibold text-gray-900">
              {isEditMode ? "Trailer bewerken" : t("title")}
            </h1>

            {/* Auto-save status indicator */}
            {draftService.isDraftSupported() && (
              <div className="flex items-center gap-2 text-sm">
                {autoSaveStatus === "saving" && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Opslaan...
                  </span>
                )}
                {autoSaveStatus === "saved" && (
                  <span className="text-green-600">✓ Concept opgeslagen</span>
                )}
                {autoSaveStatus === "error" && (
                  <span className="text-red-600">⚠ Opslaan mislukt</span>
                )}
              </div>
            )}
          </div>
          <p className="text-gray-600">
            {isEditMode
              ? "Bewerk de gegevens van je trailer en sla de wijzigingen op."
              : t("description")}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 rounded-md text-red-800">
            {error}
          </div>
        )}

        {/* Loading state for edit mode */}
        {isLoading && isEditMode && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-600">
              Trailer gegevens laden...
            </span>
          </div>
        )}

        {(!isLoading || !isEditMode) && (
          <form onSubmit={handleSubmit} className="space-y-0">
            {/* Trailer Type Section - Always rendered */}
            <TypeSection
              formData={formData}
              isExpanded={expandedSections.type}
              isCompleted={completedSections.type}
              onToggle={() => handleToggleSection(SectionId.TYPE)}
              updateFormData={updateFormData}
              setCompletedSections={setCompletedSections}
              setExpandedSections={setExpandedSections}
            />

            {/* Details Section - Always rendered (lightweight) */}
            <DetailsSection
              formData={formData}
              isExpanded={expandedSections.details}
              isCompleted={completedSections.details}
              onToggle={() => handleToggleSection(SectionId.DETAILS)}
              updateFormData={updateFormData}
              setCompletedSections={setCompletedSections}
              setExpandedSections={setExpandedSections}
            />

            {/* Location Section - Lazy loaded component, always rendered */}
            <LocationSection
              formData={formData}
              isExpanded={expandedSections.location}
              isCompleted={completedSections.location}
              onToggle={() => handleToggleSection(SectionId.LOCATION)}
              updateFormData={updateFormData}
              setCompletedSections={setCompletedSections}
              setExpandedSections={setExpandedSections}
            />

            {/* Availability Section - Lazy loaded component, always rendered */}
            <AvailabilitySection
              formData={formData}
              isExpanded={expandedSections.availability}
              isCompleted={completedSections.availability}
              onToggle={() => handleToggleSection(SectionId.AVAILABILITY)}
              updateFormData={updateFormData}
              updateNestedFormData={(parent, key, value) =>
                updateNestedFormData(setFormData, parent, key, value)
              }
              setCompletedSections={setCompletedSections}
              setExpandedSections={setExpandedSections}
            />

            {/* Pricing Section - Always rendered (lightweight) */}
            <PricingSection
              formData={formData}
              isExpanded={expandedSections.pricing}
              isCompleted={completedSections.pricing}
              onToggle={() => handleToggleSection(SectionId.PRICING)}
              updateFormData={updateFormData}
              setCompletedSections={setCompletedSections}
              setExpandedSections={setExpandedSections}
              lessorSettings={lessorSettings}
            />

            {/* Accessories Section - Lazy loaded component, always rendered */}
            <AccessoriesSection
              formData={formData}
              isExpanded={expandedSections.accessories}
              isCompleted={completedSections.accessories}
              onToggle={() => handleToggleSection(SectionId.ACCESSORIES)}
              updateFormData={updateFormData}
              setCompletedSections={setCompletedSections}
              setExpandedSections={setExpandedSections}
            />

            {/* Photos Section - Lazy loaded component, always rendered */}
            <PhotosSection
              formData={formData}
              isExpanded={expandedSections.photos}
              isCompleted={completedSections.photos}
              onToggle={() => handleToggleSection(SectionId.PHOTOS)}
              updateFormData={updateFormData}
              setCompletedSections={setCompletedSections}
              setExpandedSections={setExpandedSections}
            />

            {isEditMode && (
              <ExtraSection
                formData={formData}
                isExpanded={expandedSections.extra}
                isCompleted={completedSections.extra}
                onToggle={() => handleToggleSection(SectionId.EXTRA)}
                updateFormData={updateFormData}
                setCompletedSections={setCompletedSections}
                setExpandedSections={setExpandedSections}
              />
            )}

            {/* Terms and Submit */}
            <TermsSubmit
              formData={formData}
              isSubmitting={isSubmitting}
              completedSections={completedSections}
              updateFormData={updateFormData}
              onSubmit={handleSubmit}
              isEditMode={isEditMode}
            />
          </form>
        )}
      </div>
    </div>
  );
}
