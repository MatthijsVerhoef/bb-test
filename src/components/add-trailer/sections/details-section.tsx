"use client";

import { Ruler } from "lucide-react";
import { FormSection } from "../components/form-section";
import { SectionId, TrailerFormData } from "../types";
import { handleCompleteSection } from "../utils/form-utils";
import { useTranslation } from "@/lib/i18n/client";
import {
  TrailerCapacity,
  TrailerHeight,
  TrailerLengthBottom,
  TrailerWeight,
  TrailerWidth2,
} from "@/lib/icons/trailer-icons";

interface DetailsSectionProps {
  formData: TrailerFormData;
  isExpanded: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  updateFormData: <T>(field: keyof TrailerFormData, value: T) => void;
  setCompletedSections: (callback: (prev: any) => any) => void;
  setExpandedSections: (callback: (prev: any) => any) => void;
}

export const DetailsSection: React.FC<DetailsSectionProps> = ({
  formData,
  isExpanded,
  isCompleted,
  onToggle,
  updateFormData,
  setCompletedSections,
  setExpandedSections,
}) => {
  const { t } = useTranslation("addTrailer");
  // Get summary text based on dimensions
  const getSummary = () => {
    if (!formData.length || !formData.width) return undefined;

    return `${formData.length} × ${formData.width} ${
      formData.height ? `× ${formData.height}` : ""
    } cm`;
  };

  return (
    <FormSection
      id={SectionId.DETAILS}
      title={t("sections.details.title")}
      icon={<Ruler size={18} />}
      isExpanded={isExpanded}
      isCompleted={isCompleted}
      summary={getSummary()}
      onToggle={onToggle}
    >
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          {t("sections.details.description")}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="flex items-center">
              <TrailerLengthBottom size={20} strokeWidth={1.8} />
              <label className="block text-sm font-medium mb-1 ms-2">
                {t("sections.details.length")}{" "}
                <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="number"
              value={formData.length}
              onChange={(e) => updateFormData("length", e.target.value)}
              placeholder="250"
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg outline-none focus:right-1 focus:ring-black"
            />
          </div>

          <div>
            <div className="flex items-center">
              <TrailerWidth2 size={20} strokeWidth={1.8} />
              <label className="block text-sm font-medium mb-1 ms-2">
                {t("sections.details.width")}{" "}
                <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="number"
              value={formData.width}
              onChange={(e) => updateFormData("width", e.target.value)}
              placeholder="150"
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="flex items-center">
              <TrailerHeight size={20} strokeWidth={1.8} />
              <label className="block text-sm font-medium mb-1 ms-2">
                {t("sections.details.height")}
              </label>
            </div>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => updateFormData("height", e.target.value)}
              placeholder="120"
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg outline-none focus:right-1 focus:ring-black"
            />
          </div>

          <div>
            <div className="flex items-center">
              <TrailerWeight size={20} strokeWidth={1.8} />
              <label className="block text-sm font-medium mb-1 ms-2">
                {t("sections.details.weight")}
              </label>
            </div>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => updateFormData("weight", e.target.value)}
              placeholder="750"
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg outline-none focus:right-1 focus:ring-black"
            />
          </div>

          <div>
            <div className="flex items-center">
              <TrailerCapacity size={20} strokeWidth={1.8} />
              <label className="block text-sm font-medium mb-1 ms-2">
                {t("sections.details.capacity")}
              </label>
            </div>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => updateFormData("capacity", e.target.value)}
              placeholder="600"
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg outline-none focus:right-1 focus:ring-black"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            handleCompleteSection(
              SectionId.DETAILS,
              formData,
              setCompletedSections,
              setExpandedSections
            )
          }
          disabled={!formData.length || !formData.width}
          className={`w-full py-3 px-6 text-sm rounded-xl font-medium transition-all duration-200 ${
            formData.length && formData.width
              ? "bg-primary text-white hover:bg-primary/80"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {t("common.saveAndContinue")}
        </button>
      </div>
    </FormSection>
  );
};
