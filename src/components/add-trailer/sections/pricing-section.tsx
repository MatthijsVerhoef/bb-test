"use client";

import { Euro } from "lucide-react";
import { FormSection } from "../components/form-section";
import { SectionId, TrailerFormData } from "../types";
import { handleCompleteSection } from "../utils/form-utils";
import { useTranslation } from "@/lib/i18n/client";
import { useEffect } from "react";
import { PricingService } from "@/services/pricing.service";

interface PricingSectionProps {
  formData: TrailerFormData;
  isExpanded: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  updateFormData: <T>(field: keyof TrailerFormData, value: T) => void;
  setCompletedSections: (callback: (prev: any) => any) => void;
  setExpandedSections: (callback: (prev: any) => any) => void;
  lessorSettings?: {
    defaultSecurityDeposit: number;
  } | null;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  formData,
  isExpanded,
  isCompleted,
  onToggle,
  updateFormData,
  setCompletedSections,
  setExpandedSections,
  lessorSettings,
}) => {
  const { t } = useTranslation("addTrailer");

  useEffect(() => {
    if (formData.pricePerDay && lessorSettings?.defaultSecurityDeposit) {
      const price = parseFloat(formData.pricePerDay);
      if (!isNaN(price) && price > 0) {
        const calculatedDeposit =
          (price * lessorSettings.defaultSecurityDeposit) / 100;
        const roundedDeposit = Math.round(calculatedDeposit / 5) * 5;

        if (!formData.securityDeposit || formData.securityDeposit === "") {
          updateFormData("securityDeposit", roundedDeposit.toString());
        }
      }
    }
  }, [formData.pricePerDay, lessorSettings, updateFormData]);

  const calculateEarnings = () => {
    const price = parseFloat(formData.pricePerDay);
    if (isNaN(price) || price <= 0) return null;

    return PricingService.calculateLessorEarnings(price);
  };

  const earnings = calculateEarnings();

  const getSummary = () => {
    if (!formData.pricePerDay) return undefined;
    return `€${formData.pricePerDay}/${t("sections.pricing.perDay")}`;
  };

  return (
    <FormSection
      id={SectionId.PRICING}
      title={t("sections.pricing.title")}
      icon={<Euro size={18} />}
      isExpanded={isExpanded}
      isCompleted={isCompleted}
      summary={getSummary()}
      onToggle={onToggle}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <p className="text-gray-600 text-sm">
            {t("sections.pricing.description")}
          </p>
        </div>

        {/* Clean Input Grid */}
        <div className="space-y-4">
          {/* Daily Price */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {t("sections.pricing.pricePerDay")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-500 font-medium">€</span>
              </div>
              <input
                type="number"
                value={formData.pricePerDay}
                onChange={(e) => updateFormData("pricePerDay", e.target.value)}
                placeholder="25.00"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg transition-all duration-200 outline-0 text-sm"
              />
            </div>
            {formData.pricePerDay && parseInt(formData.pricePerDay) > 0 && (
              <p className="mt-2 text-sm text-green-600">
                ✓ {t("sections.pricing.goodPrice")}
              </p>
            )}
          </div>

          {/* Security Deposit */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {t("sections.pricing.securityDeposit")}
              {lessorSettings?.defaultSecurityDeposit && (
                <span className="text-xs text-gray-500 ml-2">
                  (Standaard: {lessorSettings.defaultSecurityDeposit}% van
                  dagprijs)
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-500 font-medium">€</span>
              </div>
              <input
                type="number"
                value={formData.securityDeposit}
                onChange={(e) =>
                  updateFormData("securityDeposit", e.target.value)
                }
                placeholder={
                  lessorSettings?.defaultSecurityDeposit && formData.pricePerDay
                    ? Math.round(
                        (parseFloat(formData.pricePerDay) *
                          lessorSettings.defaultSecurityDeposit) /
                          100 /
                          5
                      ) *
                        5 +
                      ".00"
                    : "100.00"
                }
                className="w-full pl-8 outline-0 text-sm pr-4 py-3 border border-gray-300 rounded-lg transition-all duration-200"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {t("sections.pricing.securityDepositDescription")}
            </p>
          </div>
        </div>

        {/* Earnings Summary */}
        {earnings !== null && (
          <div className="bg-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-black font-medium">
                  {t("sections.pricing.yourEarnings")}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Na 15% platform kosten
                </p>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                €{earnings.toFixed(2)}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Dagprijs:</span>
                <span>€{parseFloat(formData.pricePerDay).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Platform kosten (15%):</span>
                <span>
                  -€{(parseFloat(formData.pricePerDay) * 0.15).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={() =>
            handleCompleteSection(
              SectionId.PRICING,
              formData,
              setCompletedSections,
              setExpandedSections
            )
          }
          disabled={!formData.pricePerDay}
          className={`
            w-full py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-200
            ${
              formData.pricePerDay
                ? "bg-primary text-white hover:bg-primary/80"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {t("sections.pricing.savePricing")}
        </button>
      </div>
    </FormSection>
  );
};
