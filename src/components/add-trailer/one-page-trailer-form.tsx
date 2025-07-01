"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/client";
import dynamic from "next/dynamic";
import { useAuth } from "@/stores/auth.store";

// Types
import { SectionId, TrailerFormData, SectionsState } from "./types";

// Utilities
import {
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

// Components
import { TermsSubmit } from "./components/terms-submit";

// Define default states as constants outside component
const DEFAULT_EXPANDED_SECTIONS: SectionsState = {
  type: true, // First section open by default
  details: false,
  location: false,
  availability: false,
  pricing: false,
  accessories: false,
  photos: false,
  extra: false,
};

const DEFAULT_COMPLETED_SECTIONS: SectionsState = {
  type: false,
  details: false,
  location: false,
  availability: false,
  pricing: false,
  accessories: false,
  photos: false,
  extra: false,
};

const DEFAULT_FORM_DATA: TrailerFormData = {
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
  // Pricing
  pricePerDay: "",
  securityDeposit: "",
  // Extra information
  requiresDriversLicense: false,
  licenseType: "none",
  includesInsurance: false,
  homeDelivery: false,
  deliveryFee: "",
  maxDeliveryDistance: "",
  cancellationPolicy: "flexible",
  minRentalDuration: "1",
  maxRentalDuration: "14",
  instructions: "",
  // Arrays
  accessories: [],
  images: [],
  // Terms
  agreeToTerms: false,
};

// Lazy load heavy sections with loading states
const LazyLocationSection = dynamic(
  () =>
    import("./sections/location-section").then((mod) => ({
      default: mod.LocationSection,
    })),
  {
    loading: () => <SectionSkeleton />,
    ssr: true, // Enable SSR to prevent hydration issues
  }
);

const LazyAvailabilitySection = dynamic(
  () =>
    import("./sections/availability-section-working").then((mod) => ({
      default: mod.AvailabilitySection,
    })),
  {
    loading: () => <SectionSkeleton />,
    ssr: true,
  }
);

const LazyAccessoriesSection = dynamic(
  () =>
    import("./sections/accessories-section-minimal").then((mod) => ({
      default: mod.AccessoriesSection,
    })),
  {
    loading: () => <SectionSkeleton />,
    ssr: true,
  }
);

const LazyPhotosSection = dynamic(
  () =>
    import("./sections/photos-section").then((mod) => ({
      default: mod.PhotosSection,
    })),
  {
    loading: () => <SectionSkeleton />,
    ssr: true,
  }
);

const LazyExtraSection = dynamic(
  () =>
    import("./sections/extra-section").then((mod) => ({
      default: mod.ExtraSection,
    })),
  {
    loading: () => <SectionSkeleton />,
    ssr: true,
  }
);

// Loading skeleton for sections
function SectionSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-16 bg-gray-100 rounded-lg mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>
  );
}

interface OnePageTrailerFormProps {
  trailerId?: string;
}

interface LessorSettings {
  defaultMinRentalDuration: number;
  defaultMaxRentalDuration: number;
  defaultSecurityDeposit: number;
  cancellationPolicy: string;
}

type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

export default function OnePageTrailerForm({
  trailerId,
}: OnePageTrailerFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation("addTrailer");
  const { updateProfile } = useAuth();

  // Memoized values
  const isEditMode = Boolean(trailerId);

  // Initialize state with functions to ensure consistency
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Track if we're on client side
  const [isClient, setIsClient] = useState(false);

  // Track if the form has been initialized
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Use functions for initial state to prevent hydration issues
  const [expandedSections, setExpandedSections] = useState<SectionsState>(
    () => ({ ...DEFAULT_EXPANDED_SECTIONS })
  );
  const [completedSections, setCompletedSections] = useState<SectionsState>(
    () => ({ ...DEFAULT_COMPLETED_SECTIONS })
  );
  const [formData, setFormData] = useState<TrailerFormData>(() => ({
    ...DEFAULT_FORM_DATA,
  }));

  // Draft-related state
  const [currentDraft, setCurrentDraft] = useState<any | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [lessorSettings, setLessorSettings] = useState<LessorSettings | null>(
    null
  );

  // Fetch lessor settings
  useEffect(() => {
    const fetchLessorSettings = async () => {
      try {
        const response = await fetch("/api/user/lessor-settings");
        if (response.ok) {
          const data = await response.json();

          const settings: LessorSettings = {
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
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch lessor settings:", error);
      }
    };

    if (!isEditMode) {
      fetchLessorSettings();
    }
  }, [isEditMode, currentDraft]);

  // Auto-save function
  const performAutoSave = useCallback(
    (data: TrailerFormData) => {
      if (!shouldTriggerAutoSave(data) || !draftService.isDraftSupported()) {
        return;
      }

      setAutoSaveStatus("saving");

      try {
        let autoGeneratedName = generateDraftAutoName(data);

        if (isEditMode && trailerId) {
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

        setTimeout(() => {
          setAutoSaveStatus("idle");
        }, 2000);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setAutoSaveStatus("error");
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
      }, 3000);
    },
    [performAutoSave]
  );

  // Update form data handler
  const updateFormData = useCallback(
    <T extends any>(
      field: keyof TrailerFormData,
      value: T | ((prev: T) => T)
    ): void => {
      setFormData((prev) => {
        const newValue =
          typeof value === "function" ? value(prev[field] as T) : value;
        const newFormData = { ...prev, [field]: newValue };

        // Schedule auto-save
        setHasUnsavedChanges(true);
        scheduleAutoSave(newFormData);

        return newFormData;
      });
    },
    [scheduleAutoSave]
  );

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
        // Details
        length: trailerData.length ? String(trailerData.length) : "",
        width: trailerData.width ? String(trailerData.width) : "",
        height: trailerData.height ? String(trailerData.height) : "",
        weight: trailerData.weight ? String(trailerData.weight) : "",
        capacity: trailerData.capacity ? String(trailerData.capacity) : "",
        // Location
        address: trailerData.address || "",
        city: trailerData.city || "",
        postalCode: trailerData.postalCode || "",
        latitude: trailerData.latitude || undefined,
        longitude: trailerData.longitude || undefined,
        // Availability
        availableDays: trailerData.availableDays || {
          ...DEFAULT_FORM_DATA.availableDays,
        },
        timeSlots: trailerData.timeSlots || { ...DEFAULT_FORM_DATA.timeSlots },
        timeFrom: trailerData.timeFrom || "08:00",
        timeTo: trailerData.timeTo || "20:00",
        // Pricing
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
          ? trailerData.images.map((img: any) => ({
              id: img.id || Math.random().toString(36).substr(2, 9),
              name: img.title || "Uploaded image",
              preview: img.url,
              url: img.url,
              uploaded: true,
              size: "0",
            }))
          : [],
        // Terms
        agreeToTerms: true,
      };

      setFormData(convertedFormData);

      // Validate sections
      const newCompletedSections = {
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
      };

      setCompletedSections(newCompletedSections);

      // Keep the default expanded state (first section open)
      setExpandedSections(DEFAULT_EXPANDED_SECTIONS);
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
      const trailerData = formatTrailerDataForApi(formData);

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
        }
      }

      // Redirect based on mode
      if (isEditMode) {
        router.push(`/aanbod/${trailerId}`);
      } else {
        router.push("/");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      setError(error?.message || t("errors.submissionError"));
      setIsSubmitting(false);
    }
  };

  // Effect to handle initial render and client-side detection
  useEffect(() => {
    setIsClient(true);
    // Use requestAnimationFrame to ensure DOM has been painted
    requestAnimationFrame(() => {
      setIsFormInitialized(true);
    });
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Load trailer data or draft
  useEffect(() => {
    if (isEditMode) {
      const checkForEditDraft = () => {
        if (draftService.isDraftSupported() && trailerId) {
          const allDrafts = draftService.getDrafts();

          const editDraft = allDrafts.find(
            (draft: any) =>
              draft.autoGeneratedName.startsWith("Bewerken:") &&
              draft.autoGeneratedName.includes(`[${trailerId}]`)
          );

          if (editDraft) {
            setCurrentDraft(editDraft);
            setFormData(editDraft.formData);
            setHasUnsavedChanges(false);
            setIsLoading(false);

            const newCompletedSections = {
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
              extra: validateSection(SectionId.EXTRA, editDraft.formData),
            };

            setCompletedSections(newCompletedSections);

            // Keep the default expanded state (first section open)
            setExpandedSections(DEFAULT_EXPANDED_SECTIONS);
            return true;
          }
        }
        return false;
      };

      if (!checkForEditDraft()) {
        loadTrailerData();
      }
    } else {
      // Check for draft in URL (create mode)
      if (typeof window !== "undefined") {
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
    }
  }, [isEditMode, loadTrailerData, trailerId]);

  // Toggle section handler
  const handleToggleSection = useCallback((section: SectionId) => {
    setExpandedSections((prev) => {
      // If the clicked section is already open, keep it open
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

      newState[section] = true;

      // Scroll to section after state update
      setTimeout(() => {
        const sectionEl = document.getElementById(`section-${section}`);
        if (sectionEl) {
          const elementTop = sectionEl.offsetTop;
          const offset = 200;
          const scrollToPosition = elementTop - offset;

          window.scrollTo({
            top: Math.max(0, scrollToPosition),
            behavior: "smooth",
          });
        }
      }, 300);

      return newState;
    });
  }, []);

  // Memoized auto-save status component
  const autoSaveStatusIndicator = useMemo(() => {
    // Only render on client side to prevent hydration mismatch
    if (typeof window === "undefined") return null;

    if (!draftService.isDraftSupported()) return null;

    return (
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
    );
  }, [autoSaveStatus]);

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
            {isClient && draftService.isDraftSupported() && (
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

        {isLoading && isEditMode && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-600">
              Trailer gegevens laden...
            </span>
          </div>
        )}

        {(!isLoading || !isEditMode) && (
          <form
            onSubmit={handleSubmit}
            className={`space-y-0 ${
              !isFormInitialized ? "form-initial-load" : "form-loaded"
            }`}
          >
            {/* Always rendered sections */}
            <TypeSection
              formData={formData}
              isExpanded={expandedSections.type}
              isCompleted={completedSections.type}
              onToggle={() => handleToggleSection(SectionId.TYPE)}
              updateFormData={updateFormData}
              setCompletedSections={setCompletedSections}
              setExpandedSections={setExpandedSections}
            />

            <DetailsSection
              formData={formData}
              isExpanded={expandedSections.details}
              isCompleted={completedSections.details}
              onToggle={() => handleToggleSection(SectionId.DETAILS)}
              updateFormData={updateFormData}
              setCompletedSections={setCompletedSections}
              setExpandedSections={setExpandedSections}
            />

            {/* Lazy loaded sections */}
            <LazyLocationSection
              formData={formData}
              isExpanded={expandedSections.location}
              isCompleted={completedSections.location}
              onToggle={() => handleToggleSection(SectionId.LOCATION)}
              updateFormData={updateFormData}
              setCompletedSections={setCompletedSections}
              setExpandedSections={setExpandedSections}
            />

            <LazyAvailabilitySection
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

            <LazyAccessoriesSection
              formData={formData}
              isExpanded={expandedSections.accessories}
              isCompleted={completedSections.accessories}
              onToggle={() => handleToggleSection(SectionId.ACCESSORIES)}
              updateFormData={updateFormData}
              setCompletedSections={setCompletedSections}
              setExpandedSections={setExpandedSections}
            />

            <LazyPhotosSection
              formData={formData}
              isExpanded={expandedSections.photos}
              isCompleted={completedSections.photos}
              onToggle={() => handleToggleSection(SectionId.PHOTOS)}
              updateFormData={updateFormData}
              setCompletedSections={setCompletedSections}
              setExpandedSections={setExpandedSections}
            />

            {isEditMode && (
              <LazyExtraSection
                formData={formData}
                isExpanded={expandedSections.extra}
                isCompleted={completedSections.extra}
                onToggle={() => handleToggleSection(SectionId.EXTRA)}
                updateFormData={updateFormData}
                setCompletedSections={setCompletedSections}
                setExpandedSections={setExpandedSections}
              />
            )}

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
