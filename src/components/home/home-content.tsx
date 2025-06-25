'use client';

import { Suspense } from 'react';
import { useTranslation } from '@/lib/i18n/client';
import TrailerMap from '@/components/trailers/trailer-map';
import LoadingSpinner from '@/components/trailers/loading-spinnter';
import { TrailersPaginationList } from '@/components/trailers/infinite-list';
import FilterWrapper from '@/components/trailers/filter-sidebar';
import AnimatedCityTitle from '@/components/trailers/animated-city-title';
import { EmailVerificationModal } from '@/components/constants/auth/email-verified-dialog';
import FAQSection from '@/components/seo/home-faq';
import TrailerSeoContent from '@/components/seo/trailer-seo-content';

interface HomeContentProps {
  processedTrailers: any[];
  mapMarkers: any[];
  currentFilters: any;
  activeFilterCount: number;
  city: string | null;
  startDate: string | null;
  page: number;
  limit: number;
  totalPages: number;
}

export default function HomeContent({
  processedTrailers,
  mapMarkers,
  currentFilters,
  activeFilterCount,
  city,
  startDate,
  page,
  limit,
  totalPages,
}: HomeContentProps) {
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');

  return (
    <div className="mt-50 pb-20">
      <EmailVerificationModal />
      <div className="flex items-start container mx-auto relative w-[1200px] mt-16">
        <div className="w-[320px] me-10 flex flex-col">
          <span className="text-sm text-[#6B798B]">{tCommon('general.sort')}</span>
          <select
            className="bg-[#F6F8F9] mt-2 text-sm rounded-md py-3 px-3"
            defaultValue="standard"
          >
            <option value="standard">Standard</option>
            <option value="price-asc">Prijs: laag naar hoog</option>
            <option value="price-desc">Prijs: hoog naar laag</option>
            <option value="rating">Beoordeling</option>
            <option value="distance">Afstand</option>
          </select>

          {/* Client-side Filter */}
          <FilterWrapper currentFilters={currentFilters} />
        </div>
        <div className="flex flex-col flex-1">
          <AnimatedCityTitle selectedCity={city} />

          <span className="text-[#8997AA] mt-5.5 mb-8 text-sm">
            {activeFilterCount === 0
              ? "0 Actieve filters"
              : `${activeFilterCount} Actieve filter${
                  activeFilterCount > 1 ? "s" : ""
                }`}
          </span>

          <Suspense
            key={`map-${city || "all"}-${startDate || ""}`}
            fallback={<LoadingSpinner />}
          >
            <TrailerMap markers={mapMarkers} zoom={16} />
          </Suspense>

          <div className="mt-10">
            <TrailersPaginationList
              initialTrailers={processedTrailers}
              initialPage={page}
              limit={limit}
              totalPages={totalPages}
            />
          </div>
        </div>
      </div>
      <TrailerSeoContent />
      <FAQSection />
    </div>
  );
}