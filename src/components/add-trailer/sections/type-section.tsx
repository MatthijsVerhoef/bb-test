"use client";

import { FormSection } from "../components/form-section";
import { SectionId, TrailerFormData } from "../types";
import { TrailerCategories } from "@/lib/trailer-categories";
import { handleCompleteSection } from "../utils/form-utils";
import { useTranslation } from "@/lib/i18n/client";
import { ClosedTrailerDouble } from "@/lib/icons/trailer-icons";

interface TypeSectionProps {
  formData: TrailerFormData;
  isExpanded: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  updateFormData: <T>(field: keyof TrailerFormData, value: T) => void;
  setCompletedSections: (callback: (prev: any) => any) => void;
  setExpandedSections: (callback: (prev: any) => any) => void;
}

export const TypeSection: React.FC<TypeSectionProps> = ({
  formData,
  isExpanded,
  isCompleted,
  onToggle,
  updateFormData,
  setCompletedSections,
  setExpandedSections,
}) => {
  const { t } = useTranslation("addTrailer");
  const handleSelectTrailerType = (type: string) => {
    updateFormData("trailerType", type);

    // If not custom, mark section as completed and open next
    if (type !== "Overig") {
      // Create updated form data with the new trailer type for validation
      const updatedFormData = { ...formData, trailerType: type };

      setTimeout(() => {
        handleCompleteSection(
          SectionId.TYPE,
          updatedFormData,
          setCompletedSections,
          setExpandedSections
        );
      }, 300);
    }
  };

  // Get summary text based on selected type
  const getSummary = () => {
    if (!formData.trailerType) return undefined;

    return formData.trailerType === "Overig"
      ? formData.customType
      : formData.trailerType;
  };

  return (
    <FormSection
      id={SectionId.TYPE}
      title={t("sections.type.title")}
      icon={<ClosedTrailerDouble size={22} />}
      isExpanded={isExpanded}
      isCompleted={isCompleted}
      summary={getSummary()}
      onToggle={onToggle}
      paddingTop={false}
    >
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          {t("sections.type.description")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TrailerCategories.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => handleSelectTrailerType(type.trailerType)}
            className={`p-4 rounded-lg transition-all flex min-h-[110px] flex-col items-center justify-center ${
              formData.trailerType === type.trailerType
                ? "bg-primary/20 border-2 border-primary"
                : "bg-gray-50 border border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="text-gray-800 mb-2">{type.icon}</span>
            <span className="text-sm text-center">{type.trailerType}</span>
          </button>
        ))}
      </div>

      {formData.trailerType === "Overig" && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">
            {t("sections.type.customType")}
          </label>
          <input
            type="text"
            value={formData.customType}
            onChange={(e) => updateFormData("customType", e.target.value)}
            placeholder={t("sections.type.customTypePlaceholder")}
            className="w-full p-3 text-sm mt-2 border border-gray-300 outline-0 rounded-lg"
          />

          <button
            type="button"
            onClick={() => {
              // Use current formData since custom type is already set
              handleCompleteSection(
                SectionId.TYPE,
                formData,
                setCompletedSections,
                setExpandedSections
              );
            }}
            disabled={!formData.customType}
            className={`mt-3 px-4 py-2 text-sm rounded-lg transition-colors ${
              formData.customType
                ? "bg-primary text-white hover:bg-primary/80"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Bevestigen
          </button>
        </div>
      )}
    </FormSection>
  );
};
