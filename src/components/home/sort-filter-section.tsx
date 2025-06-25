'use client';

import { useTranslation } from "@/lib/i18n/client";
import FilterWrapper from "@/components/trailers/filter-sidebar";

interface SortFilterSectionProps {
  currentFilters: any;
  activeFilterCount: number;
  selectedCity?: string;
}

export default function SortFilterSection({ 
  currentFilters, 
  activeFilterCount,
  selectedCity 
}: SortFilterSectionProps) {
  const { t } = useTranslation('home');

  return (
    <>
      <div className="w-[320px] me-10 flex flex-col">
        <span className="text-sm text-[#6B798B]">{t('sortBy.label')}</span>
        <select
          className="bg-[#F6F8F9] mt-2 text-sm rounded-md py-3 px-3"
          defaultValue="Standaard"
        >
          <option value="default">{t('sortBy.options.default')}</option>
          <option value="priceLowToHigh">{t('sortBy.options.priceLowToHigh')}</option>
          <option value="priceHighToLow">{t('sortBy.options.priceHighToLow')}</option>
          <option value="rating">{t('sortBy.options.rating')}</option>
          <option value="distance">{t('sortBy.options.distance')}</option>
        </select>

        {/* Client-side Filter */}
        <FilterWrapper currentFilters={currentFilters} />
      </div>
      
      <div className="flex flex-col flex-1">
        <AnimatedCityTitle selectedCity={selectedCity} />

        <span className="text-[#8997AA] mt-5.5 mb-8 text-sm">
          {activeFilterCount === 0
            ? t('activeFilters.none')
            : activeFilterCount === 1 
              ? t('activeFilters.single')
              : `${activeFilterCount} ${t('activeFilters.multiple')}`
          }
        </span>
      </div>
    </>
  );
}