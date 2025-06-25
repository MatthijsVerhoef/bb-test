"use client";

import { Check, Plus, Star, Euro } from "lucide-react";
import { useState } from "react";
import { FormSection } from "../components/form-section";
import { SectionId, TrailerFormData, Accessoire } from "../types";
import { AccessoireItems } from "@/lib/trailer-categories";
import {
  handleCompleteSection,
  isAccessorySelected,
  getAccessoryPrice,
  toggleAccessory,
  updateAccessoryPrice,
} from "../utils/form-utils";
import { useTranslation } from "@/lib/i18n/client";

interface AccessoriesSectionProps {
  formData: TrailerFormData;
  isExpanded: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  updateFormData: <T>(field: keyof TrailerFormData, value: T) => void;
  setCompletedSections: (callback: (prev: any) => any) => void;
  setExpandedSections: (callback: (prev: any) => any) => void;
}

export const AccessoriesSection: React.FC<AccessoriesSectionProps> = ({
  formData,
  isExpanded,
  isCompleted,
  onToggle,
  updateFormData,
  setCompletedSections,
  setExpandedSections,
}) => {
  const { t } = useTranslation("addTrailer");
  // Accessories state
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Get summary text based on accessories
  const getSummary = () => {
    if (
      !Array.isArray(formData.accessories) ||
      formData.accessories.length === 0
    )
      return undefined;

    const count = formData.accessories.filter((a) => a.selected).length;
    if (count === 0) return undefined;
    return `${count} ${
      count === 1
        ? t("sections.accessories.accessorySingular")
        : t("sections.accessories.accessoryPlural")
    }`;
  };

  // Handle accessory toggle
  const handleToggleAccessory = (name: string) => {
    updateFormData(
      "accessories",
      toggleAccessory(
        Array.isArray(formData.accessories) ? formData.accessories : [],
        name
      )
    );

    // Check and update completed status
    setTimeout(() => {
      const accessories = Array.isArray(formData.accessories)
        ? formData.accessories
        : [];
      const hasSelectedAccessories = accessories.some(
        (acc) => acc && acc.selected === true
      );

      setCompletedSections((prev) => ({
        ...prev,
        accessories: hasSelectedAccessories,
      }));
    }, 50);
  };

  // Handle accessory price update
  const handleUpdateAccessoryPrice = (name: string, price: number) => {
    updateFormData(
      "accessories",
      updateAccessoryPrice(
        Array.isArray(formData.accessories) ? formData.accessories : [],
        name,
        price
      )
    );
  };

  // Handle add custom accessory
  const handleAddCustomAccessory = () => {
    if (customName && customName.trim()) {
      let price = undefined;
      if (customPrice && customPrice.trim()) {
        const parsedPrice = parseFloat(customPrice);
        if (!isNaN(parsedPrice)) {
          price = parsedPrice;
        }
      }

      updateFormData("accessories", (prev: Accessoire[]) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return [
          ...prevArray,
          { name: customName.trim(), price, selected: true },
        ];
      });

      // Reset form inputs
      setCustomName("");
      setCustomPrice("");
      setShowCustomForm(false);

      // Mark accessories section as completed
      setCompletedSections((prev) => ({
        ...prev,
        accessories: true,
      }));
    }
  };

  return (
    <FormSection
      id={SectionId.ACCESSORIES}
      title={t("sections.accessories.title")}
      icon={<Star size={18} />}
      isExpanded={isExpanded}
      isCompleted={isCompleted}
      summary={getSummary()}
      onToggle={onToggle}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="text-start">
          <p className="text-gray-600 text-sm">
            {t("sections.accessories.description")}
          </p>
        </div>

        {/* Accessories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AccessoireItems.map((item) => {
            const selected = isAccessorySelected(
              Array.isArray(formData.accessories) ? formData.accessories : [],
              item.accessoire
            );
            const price = getAccessoryPrice(
              Array.isArray(formData.accessories) ? formData.accessories : [],
              item.accessoire
            );

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggleAccessory(item.accessoire)}
                className={`
                  relative p-4 rounded-2xl border transition-all duration-200 text-left group
                  ${
                    selected
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-black"
                  }
                `}
              >
                {/* Selection indicator */}
                <div
                  className={`
                  absolute top-3 right-3 size-5 rounded-full border flex items-center justify-center transition-all duration-200
                  ${
                    selected
                      ? "border-gray-900 bg-gray-900"
                      : "border-gray-300 group-hover:border-gray-400"
                  }
                `}
                >
                  {selected && <Check size={14} className="text-white" />}
                </div>

                {/* Content */}
                <div className="flex items-start space-x-4">
                  <div
                    className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors duration-200
                    ${
                      selected
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 group-hover:bg-gray-200"
                    }
                  `}
                  >
                    {selected ? (
                      <span className="filter invert brightness-0">
                        {item.icon}
                      </span>
                    ) : (
                      item.icon
                    )}
                  </div>

                  <div className="flex-1 mt-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {item.accessoire}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {selected
                        ? t("sections.accessories.addedToTrailer")
                        : t("sections.accessories.addToTrailer")}
                    </p>

                    {/* Price input */}
                    {selected && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {t("sections.accessories.price")}
                        </label>
                        <div className="relative">
                          <Euro
                            size={16}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="number"
                            value={price || ""}
                            onChange={(e) => {
                              e.stopPropagation();
                              const value = e.target.value;
                              if (value) {
                                handleUpdateAccessoryPrice(
                                  item.accessoire,
                                  parseFloat(value)
                                );
                              } else {
                                handleUpdateAccessoryPrice(item.accessoire, 0);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="0.00"
                            className="w-full outline-0 bg-white pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Add Custom Accessory Button */}
          <button
            type="button"
            onClick={() => setShowCustomForm(true)}
            className="relative p-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-200 text-left group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors duration-200">
                <Plus size={24} className="text-gray-600" />
              </div>

              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm">
                  {t("sections.accessories.customAccessory")}
                </h4>
                <p className="text-sm text-gray-500">
                  {t("sections.accessories.addCustom")}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Custom Accessory Card - Only show when button is clicked */}
        {showCustomForm && (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 transition-all duration-200">
            <div className="text-start sm:text-center">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-lg mx-auto font-semibold text-gray-900">
                  {t("sections.accessories.addCustomTitle")}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomForm(false);
                    setCustomName("");
                    setCustomPrice("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mx-auto text-center text-sm mb-6">
                {t("sections.accessories.addCustomDescription")}
              </p>

              <div className="max-w-md mx-auto space-y-4">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t(
                    "sections.accessories.customAccessoryPlaceholder"
                  )}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-0 text-sm transition-colors"
                />

                <div className="relative">
                  <Euro
                    size={18}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder={t("sections.accessories.pricePlaceholder")}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl outline-0 text-sm transition-colors"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomForm(false);
                      setCustomName("");
                      setCustomPrice("");
                    }}
                    className="flex-1 py-3 px-6 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all text-sm duration-200"
                  >
                    {t("sections.accessories.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomAccessory}
                    disabled={!customName.trim()}
                    className={`
                      flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200
                      ${
                        customName.trim()
                          ? "bg-gray-900 text-white hover:bg-gray-800 transform text-sm"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }
                    `}
                  >
                    {t("sections.accessories.add")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-0">
          <button
            type="button"
            onClick={() =>
              handleCompleteSection(
                SectionId.ACCESSORIES,
                formData,
                setCompletedSections,
                setExpandedSections
              )
            }
            className="w-full py-3 px-8 bg-primary text-white rounded-2xl font-semibold text-sm hover:bg-primary/80 transition-all duration-200 transform"
          >
            {Array.isArray(formData.accessories) &&
            formData.accessories.filter((a) => a && a.selected === true)
              .length > 0
              ? t("sections.accessories.saveAccessories")
              : t("sections.accessories.noAccessories")}
          </button>
        </div>
      </div>
    </FormSection>
  );
};
