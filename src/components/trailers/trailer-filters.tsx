// components/trailers/trailer-filters.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Filter,
  Calendar as CalendarIcon,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { nl, enUS, de } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

// Import hooks and components
import { useFilterState } from "@/hooks/useFilterState";
import { FilterSection } from "@/components/filters/FilterSection";
import { PriceFilter } from "@/components/filters/PriceFilter";
import { CategoryFilter } from "@/components/filters/CategoryFilter";
import { DimensionFilter } from "@/components/filters/DimensionFilter";
import { MobileFilterDrawer } from "@/components/filters/MobileFilterDrawer";

// Import icons and data
import {
  TrailerWidthTop,
  TrailerWidthBottom,
  TrailerHeight,
  TrailerWeight,
  TrailerCapacity,
} from "@/lib/icons/trailer-icons";
import { AccessoireItems } from "@/lib/trailer-categories";
import useTrailerTypes from "@/hooks/useTrailerTypes";
import { mapTrailerTypeToEnum } from "@/lib/trailer-type-mapper";

interface FilterSidebarProps {
  currentFilters: any;
  onFilterChange: (filters: any) => void;
  isMobileSheet?: boolean;
}

export default function FilterSidebar({
  currentFilters,
  onFilterChange,
  isMobileSheet = false,
}: FilterSidebarProps) {
  const { t, locale } = useTranslation("home");
  const dateLocale = locale === "nl" ? nl : locale === "de" ? de : enUS;

  const {
    trailerTypes,
    mainCategories: hookMainCategories,
    getIconForType,
    loading: loadingTrailerTypes,
  } = useTrailerTypes(locale);

  const { filterState, updateFilter, resetFilters, getActiveFiltersCount } =
    useFilterState(currentFilters, onFilterChange);

  // License options with translations
  const LICENSE_OPTIONS = [
    { id: "none", label: t("filters.licenseOptions.none") },
    { id: "B", label: t("filters.licenseOptions.B") },
    { id: "BE", label: t("filters.licenseOptions.BE") },
  ];

  // Filter categories by selected main category
  const filteredCategories = filterState.mainCategory
    ? trailerTypes.filter(
        (cat) => cat.mainCategory?.name === filterState.mainCategory
      )
    : trailerTypes;

  // Main categories
  const mainCategories =
    hookMainCategories.length > 0
      ? hookMainCategories
      : [
          { key: "klein", value: "Klein" },
          { key: "gemiddeld", value: "Gemiddeld" },
          { key: "groot", value: "Groot" },
        ];

  // Handler functions
  const handleMainCategorySelect = (category: string) => {
    if (filterState.mainCategory === category) {
      updateFilter("mainCategory", "");
      updateFilter("category", "");
      updateFilter("type", "");
    } else {
      updateFilter("mainCategory", category);
      updateFilter("category", "");
      updateFilter("type", "");
    }
  };

  const handleCategorySelect = (category: string) => {
    if (filterState.category === category) {
      updateFilter("category", "");
      updateFilter("type", "");
    } else {
      updateFilter("category", category);
      const mappedType = mapTrailerTypeToEnum(category);
      updateFilter("type", mappedType);
    }
  };

  const handleAccessoryToggle = (accessoryId: string) => {
    const newAccessories = filterState.accessories.includes(accessoryId)
      ? filterState.accessories.filter((id) => id !== accessoryId)
      : [...filterState.accessories, accessoryId];
    updateFilter("accessories", newAccessories);
  };

  const handleDateChange = (range: { from?: Date; to?: Date }) => {
    updateFilter("startDate", range.from);
    updateFilter("endDate", range.to);
  };

  const formatDateRange = () => {
    if (filterState.startDate && filterState.endDate) {
      return `${format(filterState.startDate, "d MMM", {
        locale: dateLocale,
      })} - ${format(filterState.endDate, "d MMM", { locale: dateLocale })}`;
    }
    if (filterState.startDate) {
      return format(filterState.startDate, "d MMM", { locale: dateLocale });
    }
    return t("filters.dateRange.selectDates");
  };

  return (
    <>
      {/* Mobile filter button */}
      {!isMobileSheet && (
        <MobileFilterDrawer
          filterState={filterState}
          updateFilter={updateFilter}
          resetFilters={resetFilters}
          getActiveFiltersCount={getActiveFiltersCount}
          mainCategories={mainCategories}
          filteredCategories={filteredCategories}
          handleMainCategorySelect={handleMainCategorySelect}
          handleCategorySelect={handleCategorySelect}
          handleAccessoryToggle={handleAccessoryToggle}
          getIconForType={getIconForType}
          loadingTrailerTypes={loadingTrailerTypes}
          LICENSE_OPTIONS={LICENSE_OPTIONS}
        />
      )}

      {/* Desktop Filters */}
      <div
        className={cn(
          "mt-4 space-y-2",
          isMobileSheet ? "block" : "hidden lg:block"
        )}
      >
        {getActiveFiltersCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center text-xs text-gray-600 mb-2 hover:bg-gray-100"
            onClick={resetFilters}
          >
            <X size={14} className="mr-1" /> {t("filters.clearAll")}
          </Button>
        )}

        {/* Date Filter (mobile sheet only) */}
        {isMobileSheet && (
          <FilterSection
            title={t("filters.availability")}
            sectionId="availability"
          >
            <div className="mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-sm"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: filterState.startDate,
                      to: filterState.endDate,
                    }}
                    onSelect={handleDateChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {(filterState.startDate || filterState.endDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs mt-2 font-normal"
                  onClick={() => {
                    updateFilter("startDate", undefined);
                    updateFilter("endDate", undefined);
                  }}
                >
                  <X size={12} className="mr-1" />
                  {t("filters.dateRange.clearDates")}
                </Button>
              )}
            </div>
          </FilterSection>
        )}

        {/* Price Filter */}
        <FilterSection title={t("filters.pricePerDay")} sectionId="price">
          <PriceFilter
            minPrice={filterState.minPrice}
            maxPrice={filterState.maxPrice}
            onChange={(values) => {
              updateFilter("minPrice", values[0]);
              updateFilter("maxPrice", values[1]);
            }}
          />
        </FilterSection>

        {/* Main Category Filter */}
        <FilterSection title={t("filters.trailerSize")} sectionId="size">
          <div className="flex flex-wrap gap-2 mt-2">
            {loadingTrailerTypes ? (
              <div className="w-full py-2 text-center text-gray-500">
                {t("loading")}...
              </div>
            ) : (
              mainCategories.map((category) => (
                <motion.button
                  key={category.key}
                  onClick={() => handleMainCategorySelect(category.value)}
                  className={cn(
                    "flex items-center justify-center py-1.5 px-3 rounded-md transition-all text-sm",
                    filterState.mainCategory === category.value
                      ? "bg-orange-50 text-orange-700 border border-orange-200"
                      : "text-gray-700 hover:bg-gray-50 border border-gray-100 cursor-pointer"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {category.value}
                </motion.button>
              ))
            )}
          </div>
        </FilterSection>

        {/* Sub-Category Filter */}
        <FilterSection title={t("filters.trailerType")} sectionId="type">
          <CategoryFilter
            categories={filteredCategories}
            selectedCategory={filterState.category}
            onCategorySelect={handleCategorySelect}
            getIconForType={getIconForType}
            loading={loadingTrailerTypes}
          />
        </FilterSection>

        {/* Accessories Filter */}
        <FilterSection title={t("filters.accessories")} sectionId="accessories">
          <AccessoriesFilter
            selectedAccessories={filterState.accessories}
            onToggle={handleAccessoryToggle}
          />
        </FilterSection>

        {/* License Filter */}
        <FilterSection title={t("filters.license")} sectionId="license">
          <div className="space-y-2 mt-2">
            {LICENSE_OPTIONS.map((option) => (
              <motion.div
                key={option.id}
                className="flex items-center space-x-3"
                whileHover={{ x: 2 }}
              >
                <Checkbox
                  id={`license-${option.id}`}
                  checked={filterState.driverLicense === option.id}
                  onCheckedChange={() =>
                    updateFilter("driverLicense", option.id)
                  }
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor={`license-${option.id}`}
                  className="cursor-pointer text-sm text-gray-700 font-normal"
                >
                  {option.label}
                </Label>
              </motion.div>
            ))}
          </div>
        </FilterSection>

        {/* Dimensions Filter */}
        <FilterSection title={t("filters.dimensions")} sectionId="dimensions">
          <div className="space-y-5 mt-2">
            <DimensionFilter
              id="length"
              value={filterState.length}
              onChange={(val) => updateFilter("length", val)}
              label={t("filters.dimensionLabels.length")}
              icon={<TrailerWidthTop size={16} strokeWidth={1.4} />}
              unit={t("filters.dimensionLabels.cm")}
            />
            <DimensionFilter
              id="width"
              value={filterState.width}
              onChange={(val) => updateFilter("width", val)}
              label={t("filters.dimensionLabels.width")}
              icon={<TrailerWidthBottom size={16} strokeWidth={1.4} />}
              unit={t("filters.dimensionLabels.cm")}
            />
            <DimensionFilter
              id="height"
              value={filterState.height}
              onChange={(val) => updateFilter("height", val)}
              label={t("filters.dimensionLabels.height")}
              icon={<TrailerHeight size={16} strokeWidth={1.4} />}
              unit={t("filters.dimensionLabels.cm")}
            />
            <DimensionFilter
              id="weight"
              value={filterState.weight}
              onChange={(val) => updateFilter("weight", val)}
              label={t("filters.dimensionLabels.weight")}
              icon={<TrailerWeight size={16} strokeWidth={1.4} />}
              unit={t("filters.dimensionLabels.kg")}
            />
            <DimensionFilter
              id="capacity"
              value={filterState.capacity}
              onChange={(val) => updateFilter("capacity", val)}
              label={t("filters.dimensionLabels.capacity")}
              icon={<TrailerCapacity size={16} strokeWidth={1.4} />}
              unit={t("filters.dimensionLabels.kg")}
            />
          </div>
        </FilterSection>

        {/* Delivery Options */}
        <FilterSection
          title={t("filters.deliveryOptions")}
          sectionId="delivery"
        >
          <div className="space-y-4 mt-2">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ x: 2 }}
            >
              <Checkbox
                id="home-delivery"
                checked={filterState.homeDelivery}
                onCheckedChange={(checked) =>
                  updateFilter("homeDelivery", checked === true)
                }
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor="home-delivery"
                className="cursor-pointer text-sm text-gray-700 font-normal"
              >
                {t("filters.homeDelivery")}
              </Label>
            </motion.div>
          </div>
        </FilterSection>
      </div>
    </>
  );
}

// Accessories Filter Component
const AccessoriesFilter: React.FC<{
  selectedAccessories: string[];
  onToggle: (id: string) => void;
}> = ({ selectedAccessories, onToggle }) => {
  const { t } = useTranslation("home");
  const [showAll, setShowAll] = useState(false);
  const visibleAccessories = showAll
    ? AccessoireItems
    : AccessoireItems.slice(0, 6);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {visibleAccessories.map((accessory) => (
          <motion.button
            key={accessory.id}
            onClick={() => onToggle(accessory.id.toString())}
            className={cn(
              "flex flex-col items-center justify-center h-20 py-2 px-2 rounded-md transition-all",
              selectedAccessories.includes(accessory.id.toString())
                ? "bg-orange-50 text-orange-700 border border-orange-200"
                : "text-gray-700 hover:bg-gray-50 border border-gray-100 cursor-pointer"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              {React.cloneElement(accessory.icon as React.ReactElement, {
                size: 22,
                strokeWidth: 1.5,
                color: selectedAccessories.includes(accessory.id.toString())
                  ? "#c2410c"
                  : "#374151",
              })}
            </div>
            <span className="text-xs text-center truncate w-full mt-1">
              {accessory.accessoire}
            </span>
          </motion.button>
        ))}
      </div>
      {AccessoireItems.length > 6 && (
        <motion.button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center bg-[#f6f8f9] justify-center text-[13px] text-gray-600 w-full mt-3 py-3 rounded-full hover:bg-gray-50 transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {showAll ? (
            <>
              <ChevronUp size={14} className="mr-1" /> {t("filters.showLess")}
            </>
          ) : (
            <>
              <ChevronDown size={14} className="mr-1" /> {t("filters.showMore")}{" "}
              ({AccessoireItems.length - 6} {t("filters.more")})
            </>
          )}
        </motion.button>
      )}
    </>
  );
};
