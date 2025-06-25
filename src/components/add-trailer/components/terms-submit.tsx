"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SectionsState, TrailerFormData } from "../types";

interface TermsSubmitProps {
  formData: TrailerFormData;
  isSubmitting: boolean;
  completedSections: SectionsState;
  updateFormData: <T>(field: keyof TrailerFormData, value: T) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isEditMode?: boolean;
}

export const TermsSubmit: React.FC<TermsSubmitProps> = ({
  formData,
  isSubmitting,
  completedSections,
  updateFormData,
  onSubmit,
  isEditMode = false,
}) => {
  const { t } = useTranslation("addTrailer");
  const isFormValid =
    Object.values(completedSections).filter(Boolean).length >= 4;

  return (
    <div className="pt-8">
      <div className="space-y-6">
        {/* Terms checkbox - only show in create mode */}
        {!isEditMode && (
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) =>
                updateFormData("agreeToTerms", checked === true)
              }
              className="mt-0.5"
            />
            <Label
              htmlFor="terms"
              className="text-sm flex-wrap text-gray-700 leading-5 cursor-pointer"
            >
              {t("termsSubmit.agreeText")}{" "}
              <a
                href="/terms"
                className="underline hover:text-gray-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("termsSubmit.termsLink")}
              </a>{" "}
              {t("termsSubmit.andText")}{" "}
              <a
                href="/privacy"
                className="underline hover:text-gray-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("termsSubmit.privacyLink")}
              </a>
            </Label>
          </div>
        )}

        <button
          type="submit"
          onClick={onSubmit}
          disabled={
            isSubmitting || 
            !isFormValid || 
            (!isEditMode && !formData.agreeToTerms)
          }
          className={`
            w-full py-3 text-sm rounded-xl font-medium transition-colors
            ${
              isSubmitting || 
              !isFormValid || 
              (!isEditMode && !formData.agreeToTerms)
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }
          `}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              {isEditMode ? "Wijzigingen opslaan..." : t("termsSubmit.submitting")}
            </span>
          ) : (
            isEditMode ? "Wijzigingen opslaan" : t("termsSubmit.submitButton")
          )}
        </button>

        {!isFormValid && (
          <p className="text-center text-sm text-gray-500">
            {isEditMode 
              ? "Vul alle verplichte velden in om te kunnen opslaan."
              : t("termsSubmit.formIncomplete")
            }
          </p>
        )}
      </div>
    </div>
  );
};
