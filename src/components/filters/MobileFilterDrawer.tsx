// components/filters/MobileFilterDrawer.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n/client";
import { format } from "date-fns";
import { nl, enUS, de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AccessoireItems } from "@/lib/trailer-categories";
import { Hitch } from "@/lib/icons/trailer-icons";
import {
  TrailerWidthTop,
  TrailerWidthBottom,
  TrailerHeight,
  TrailerWeight,
  TrailerCapacity,
} from "@/lib/icons/trailer-icons";

interface MobileFilterDrawerProps {
  filterState: any;
  updateFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  getActiveFiltersCount: () => number;
  mainCategories: any[];
  filteredCategories: any[];
  handleMainCategorySelect: (category: string) => void;
  handleCategorySelect: (category: string) => void;
  handleAccessoryToggle: (id: string) => void;
  getIconForType: (typeId: string) => React.ReactElement | null;
  loadingTrailerTypes: boolean;
  LICENSE_OPTIONS: any[];
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  filterState,
  updateFilter,
  resetFilters,
  getActiveFiltersCount,
  mainCategories,
  filteredCategories,
  handleMainCategorySelect,
  handleCategorySelect,
  handleAccessoryToggle,
  getIconForType,
  loadingTrailerTypes,
  LICENSE_OPTIONS,
}) => {
  const { t, locale } = useTranslation("home");
  const [isOpen, setIsOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllAccessories, setShowAllAccessories] = useState(false);

  const dateLocale = locale === "nl" ? nl : locale === "de" ? de : enUS;

  const visibleCategories = showAllCategories
    ? filteredCategories
    : filteredCategories.slice(0, 6);
  const visibleAccessories = showAllAccessories
    ? AccessoireItems
    : AccessoireItems.slice(0, 6);

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

  const handlePriceChange = (values: number[]) => {
    updateFilter("minPrice", values[0]);
    updateFilter("maxPrice", values[1]);
  };

  const handleDimensionChange = (
    dimension: "length" | "width" | "height" | "weight" | "capacity",
    value: string
  ) => {
    updateFilter(dimension, value);
  };

  return (
    <>
      <div className="lg:hidden w-full mb-4 mt-2">
        <Button
          className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800"
          onClick={() => setIsOpen(true)}
        >
          <Filter size={16} /> {t("filters.title")} ({getActiveFiltersCount()})
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="fixed inset-y-0 right-0 w-4/5 max-w-md bg-white p-4 overflow-y-auto"
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{t("filters.title")}</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Date Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">
                  {t("filters.availability")}
                </h3>
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

              {/* All Mobile Filters */}
              <div className="space-y-6">
                {/* Mobile Price Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">
                    {t("filters.pricePerDay")}
                  </h3>
                  <Slider
                    value={[filterState.minPrice, filterState.maxPrice]}
                    min={0}
                    max={1000}
                    step={5}
                    onValueChange={handlePriceChange}
                    className="mb-4"
                  />
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>€{filterState.minPrice}</span>
                    <span>€{filterState.maxPrice}</span>
                  </div>
                </div>

                {/* Mobile Size Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">
                    {t("filters.trailerSize")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {mainCategories.map((category) => (
                      <motion.button
                        key={category.key}
                        onClick={() => handleMainCategorySelect(category.value)}
                        className={cn(
                          "py-1.5 px-3 rounded-md text-sm transition-all",
                          filterState.mainCategory === category.value
                            ? "bg-orange-50 text-orange-700 border border-orange-200"
                            : "text-gray-700 border border-gray-100"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {category.value}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Mobile Trailer Type Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">
                    {t("filters.trailerType")}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {loadingTrailerTypes ? (
                      <div className="col-span-2 py-4 text-center text-gray-500">
                        {t("loading")}...
                      </div>
                    ) : (
                      visibleCategories.map((category) => (
                        <motion.button
                          key={category.id}
                          onClick={() => handleCategorySelect(category.name)}
                          className={cn(
                            "flex h-20 flex-col items-center justify-center py-2 px-3 rounded-md transition-all",
                            filterState.category === category.name
                              ? "bg-orange-50 text-orange-700 border border-orange-200"
                              : "text-gray-700 hover:bg-gray-50 border border-gray-100"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-8 h-8 flex items-center justify-center">
                            {React.cloneElement(
                              getIconForType(category.id) || <Hitch />,
                              {
                                size: 22,
                                strokeWidth: 1.5,
                                color:
                                  filterState.category === category.name
                                    ? "#c2410c"
                                    : "#374151",
                              }
                            )}
                          </div>
                          <span className="text-xs text-center w-full">
                            {category.name}
                          </span>
                        </motion.button>
                      ))
                    )}
                  </div>
                  {filteredCategories.length > 6 && (
                    <motion.button
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="flex items-center justify-center bg-[#f6f8f9] text-[13px] text-gray-600 w-full mt-3 py-3 rounded-full hover:bg-gray-50 transition-colors"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {showAllCategories ? (
                        <>
                          <ChevronUp size={14} className="mr-1" />{" "}
                          {t("filters.showLess")}
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} className="mr-1" />{" "}
                          {t("filters.showMore")} (
                          {filteredCategories.length - 6} {t("filters.more")})
                        </>
                      )}
                    </motion.button>
                  )}
                </div>

                {/* Mobile Accessories Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">
                    {t("filters.accessories")}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleAccessories.map((accessory) => (
                      <motion.button
                        key={accessory.id}
                        onClick={() =>
                          handleAccessoryToggle(accessory.id.toString())
                        }
                        className={cn(
                          "flex flex-col items-center justify-center h-20 py-2 px-2 rounded-md transition-all",
                          filterState.accessories.includes(
                            accessory.id.toString()
                          )
                            ? "bg-orange-50 text-orange-700 border border-orange-200"
                            : "text-gray-700 hover:bg-gray-50 border border-gray-100"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-8 h-8 flex items-center justify-center">
                          {React.cloneElement(
                            accessory.icon as React.ReactElement,
                            {
                              size: 22,
                              strokeWidth: 1.5,
                              color: filterState.accessories.includes(
                                accessory.id.toString()
                              )
                                ? "#c2410c"
                                : "#374151",
                            }
                          )}
                        </div>
                        <span className="text-xs text-center truncate w-full mt-1">
                          {accessory.accessoire}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                  {AccessoireItems.length > 6 && (
                    <motion.button
                      onClick={() => setShowAllAccessories(!showAllAccessories)}
                      className="flex items-center bg-[#f6f8f9] justify-center text-[13px] text-gray-600 w-full mt-3 py-3 rounded-full hover:bg-gray-50 transition-colors"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      {showAllAccessories ? (
                        <>
                          <ChevronUp size={14} className="mr-1" />{" "}
                          {t("filters.showLess")}
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} className="mr-1" />{" "}
                          {t("filters.showMore")} ({AccessoireItems.length - 6}{" "}
                          {t("filters.more")})
                        </>
                      )}
                    </motion.button>
                  )}
                </div>

                {/* Mobile License Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">
                    {t("filters.license")}
                  </h3>
                  <div className="space-y-2">
                    {LICENSE_OPTIONS.map((option) => (
                      <motion.div
                        key={option.id}
                        className="flex items-center space-x-3"
                        whileHover={{ x: 2 }}
                      >
                        <Checkbox
                          id={`mobile-license-${option.id}`}
                          checked={filterState.driverLicense === option.id}
                          onCheckedChange={() =>
                            updateFilter("driverLicense", option.id)
                          }
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label
                          htmlFor={`mobile-license-${option.id}`}
                          className="cursor-pointer text-sm text-gray-700 font-normal"
                        >
                          {option.label}
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Mobile Dimensions Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">
                    {t("filters.dimensions")}
                  </h3>
                  <div className="space-y-4">
                    {/* Length */}
                    <div>
                      <label
                        htmlFor="mobile-length"
                        className="flex items-center mb-2 text-xs text-gray-700"
                      >
                        <TrailerWidthTop size={16} strokeWidth={1.4} />
                        <span className="ms-2.5">
                          {t("filters.dimensionLabels.length")}
                        </span>
                        <span className="ms-auto text-gray-500">
                          {t("filters.dimensionLabels.cm")}
                        </span>
                      </label>
                      <div className="relative">
                        <Input
                          id="mobile-length"
                          type="number"
                          min="0"
                          step="10"
                          placeholder={t("filters.dimensionLabels.cm")}
                          value={filterState.length}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (
                              val === "" ||
                              (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)
                            ) {
                              handleDimensionChange("length", val);
                            }
                          }}
                          className="w-full shadow-none focus:border-orange-300 transition-all pr-8"
                        />
                        {filterState.length && (
                          <button
                            onClick={() => handleDimensionChange("length", "")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label="Clear length"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Width */}
                    <div>
                      <label
                        htmlFor="mobile-width"
                        className="flex items-center mb-2 text-xs text-gray-700"
                      >
                        <TrailerWidthBottom size={16} strokeWidth={1.4} />
                        <span className="ms-2.5">
                          {t("filters.dimensionLabels.width")}
                        </span>
                        <span className="ms-auto text-gray-500">
                          {t("filters.dimensionLabels.cm")}
                        </span>
                      </label>
                      <div className="relative">
                        <Input
                          id="mobile-width"
                          type="number"
                          min="0"
                          step="10"
                          placeholder={t("filters.dimensionLabels.cm")}
                          value={filterState.width}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (
                              val === "" ||
                              (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)
                            ) {
                              handleDimensionChange("width", val);
                            }
                          }}
                          className="w-full shadow-none focus:border-orange-300 transition-all pr-8"
                        />
                        {filterState.width && (
                          <button
                            onClick={() => handleDimensionChange("width", "")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label="Clear width"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Height */}
                    <div>
                      <label
                        htmlFor="mobile-height"
                        className="flex items-center mb-2 text-xs text-gray-700"
                      >
                        <TrailerHeight size={16} strokeWidth={1.4} />
                        <span className="ms-2.5">
                          {t("filters.dimensionLabels.height")}
                        </span>
                        <span className="ms-auto text-gray-500">
                          {t("filters.dimensionLabels.cm")}
                        </span>
                      </label>
                      <div className="relative">
                        <Input
                          id="mobile-height"
                          type="number"
                          min="0"
                          step="10"
                          placeholder={t("filters.dimensionLabels.cm")}
                          value={filterState.height}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (
                              val === "" ||
                              (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)
                            ) {
                              handleDimensionChange("height", val);
                            }
                          }}
                          className="w-full shadow-none focus:border-orange-300 transition-all pr-8"
                        />
                        {filterState.height && (
                          <button
                            onClick={() => handleDimensionChange("height", "")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label="Clear height"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Weight */}
                    <div>
                      <label
                        htmlFor="mobile-weight"
                        className="flex items-center mb-2 text-xs text-gray-700"
                      >
                        <TrailerWeight size={16} strokeWidth={1.4} />
                        <span className="ms-2.5">
                          {t("filters.dimensionLabels.weight")}
                        </span>
                        <span className="ms-auto text-gray-500">
                          {t("filters.dimensionLabels.kg")}
                        </span>
                      </label>
                      <div className="relative">
                        <Input
                          id="mobile-weight"
                          type="number"
                          min="0"
                          step="10"
                          placeholder={t("filters.dimensionLabels.kg")}
                          value={filterState.weight}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (
                              val === "" ||
                              (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)
                            ) {
                              handleDimensionChange("weight", val);
                            }
                          }}
                          className="w-full shadow-none focus:border-orange-300 transition-all pr-8"
                        />
                        {filterState.weight && (
                          <button
                            onClick={() => handleDimensionChange("weight", "")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label="Clear weight"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Capacity */}
                    <div>
                      <label
                        htmlFor="mobile-capacity"
                        className="flex items-center mb-2 text-xs text-gray-700"
                      >
                        <TrailerCapacity size={16} strokeWidth={1.4} />
                        <span className="ms-2.5">
                          {t("filters.dimensionLabels.capacity")}
                        </span>
                        <span className="ms-auto text-gray-500">
                          {t("filters.dimensionLabels.kg")}
                        </span>
                      </label>
                      <div className="relative">
                        <Input
                          id="mobile-capacity"
                          type="number"
                          min="0"
                          step="10"
                          placeholder={t("filters.dimensionLabels.kg")}
                          value={filterState.capacity}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (
                              val === "" ||
                              (!isNaN(parseFloat(val)) && parseFloat(val) >= 0)
                            ) {
                              handleDimensionChange("capacity", val);
                            }
                          }}
                          className="w-full shadow-none focus:border-orange-300 transition-all pr-8"
                        />
                        {filterState.capacity && (
                          <button
                            onClick={() =>
                              handleDimensionChange("capacity", "")
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label="Clear capacity"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Delivery Options and Extra Features Filter */}
                <div>
                  <h3 className="text-sm font-medium mb-3">
                    {t("filters.deliveryOptions")}
                  </h3>
                  <div className="space-y-4">
                    {/* Home Delivery */}
                    <div>
                      <motion.div
                        className="flex items-center space-x-3"
                        whileHover={{ x: 2 }}
                      >
                        <Checkbox
                          id="mobile-home-delivery"
                          checked={filterState.homeDelivery}
                          onCheckedChange={(checked) =>
                            updateFilter("homeDelivery", checked === true)
                          }
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label
                          htmlFor="mobile-home-delivery"
                          className="cursor-pointer text-sm text-gray-700 font-normal"
                        >
                          {t("filters.homeDelivery")}
                        </Label>
                      </motion.div>
                    </div>

                    {/* Insurance */}
                    <div>
                      <motion.div
                        className="flex items-center space-x-3"
                        whileHover={{ x: 2 }}
                      >
                        <Checkbox
                          id="mobile-includes-insurance"
                          checked={filterState.includesInsurance}
                          onCheckedChange={(checked) =>
                            updateFilter("includesInsurance", checked === true)
                          }
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label
                          htmlFor="mobile-includes-insurance"
                          className="cursor-pointer text-sm text-gray-700 font-normal"
                        >
                          {t("filters.insurance")}
                        </Label>
                      </motion.div>
                    </div>

                    {/* Rental Duration */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        {t("filters.rentalDuration")}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Min Duration */}
                        <div>
                          <label
                            htmlFor="mobile-min-rental-duration"
                            className="block text-xs text-gray-600 mb-1"
                          >
                            {t("filters.minDuration")}
                          </label>
                          <Input
                            id="mobile-min-rental-duration"
                            type="number"
                            min="1"
                            placeholder={t("filters.minDays")}
                            value={filterState.minRentalDuration}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (
                                val === "" ||
                                (!isNaN(parseFloat(val)) &&
                                  parseFloat(val) >= 1)
                              ) {
                                updateFilter("minRentalDuration", val);
                              }
                            }}
                            className="w-full shadow-none focus:border-orange-300 transition-all"
                          />
                        </div>

                        {/* Max Duration */}
                        <div>
                          <label
                            htmlFor="mobile-max-rental-duration"
                            className="block text-xs text-gray-600 mb-1"
                          >
                            {t("filters.maxDuration")}
                          </label>
                          <Input
                            id="mobile-max-rental-duration"
                            type="number"
                            min={filterState.minRentalDuration || "1"}
                            placeholder={t("filters.maxDays")}
                            value={filterState.maxRentalDuration}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (
                                val === "" ||
                                (!isNaN(parseFloat(val)) &&
                                  parseFloat(val) >=
                                    (filterState.minRentalDuration
                                      ? parseFloat(
                                          filterState.minRentalDuration
                                        )
                                      : 1))
                              ) {
                                updateFilter("maxRentalDuration", val);
                              }
                            }}
                            className="w-full shadow-none focus:border-orange-300 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 pt-4 pb-2 bg-white border-t mt-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={resetFilters}
                  >
                    {t("filters.mobileDrawer.reset")}
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => {
                      setIsOpen(false);
                    }}
                  >
                    {t("filters.mobileDrawer.apply")}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
