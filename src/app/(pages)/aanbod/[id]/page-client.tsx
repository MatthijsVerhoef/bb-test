"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, ChevronLeft, Ellipsis, Flag, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";
import TrailerGallery from "@/components/trailer-details/trailer-gallery";
import TrailerInfo from "@/components/trailer-details/trailer-info";
import TrailerSpecs from "@/components/trailer-details/trailer-specs";
import TrailerDescription from "@/components/trailer-details/trailer-description";
import TrailerReviews from "@/components/trailer-details/trailer-reviews";
import TrailerOwner from "@/components/trailer-details/trailer-owner";
import ShareDialog from "@/components/trailer-details/share-dialog";
import FavoriteButton from "@/components/trailer-details/favorite-button";
import RentalBookingForm from "@/components/trailer-details/rental-booking-form";
import TrailerLocationMap from "@/components/trailer-details/trailer-details-map";

interface TrailerDetailClientProps {
  trailer: any;
  trailerData: any;
  avgRating: number | null;
  features: any;
  shareData: any;
  availabilityData: any;
}

export default function TrailerDetailClient({
  trailer,
  trailerData,
  avgRating,
  features,
  shareData,
  availabilityData,
}: TrailerDetailClientProps) {
  const { t } = useTranslation("trailer");
  const [mobileBookingOpen, setMobileBookingOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFixedHeader, setShowFixedHeader] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 300;
      const currentScrollY = window.scrollY;

      if (currentScrollY > scrollThreshold) {
        setShowFixedHeader(true);
      } else {
        setShowFixedHeader(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Check initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const openBookingModal = () => {
    setMobileBookingOpen(true);
    setTimeout(() => setIsAnimating(true), 10);
  };

  const closeBookingModal = () => {
    setIsAnimating(false);
    setTimeout(() => setMobileBookingOpen(false), 300);
  };

  return (
    <div className="pb-0 lg:pb-0">
      {/* Back Button */}
      <div className="mb-6 hidden md:flex -ml-4">
        <Link href="/" prefetch={false}>
          <Button
            variant="ghost"
            className="pl-0 flex items-center text-primary hover:text-primary/90"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("backToListing")}
          </Button>
        </Link>
      </div>

      {/* Fixed Header with Fade Effect */}
      <div
        className={`
          fixed w-screen top-0 left-0 ps-2 pe-4 py-1.5 z-50 bg-white border-b
          transition-all duration-300 ease-in-out
          ${
            showFixedHeader
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-full pointer-events-none"
          }
        `}
      >
        <Link href="/" prefetch={false}>
          <Button variant={"ghost"} className="p-4 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex md:hidden">
        <Link href="/" prefetch={false}>
          <Button
            variant="ghost"
            className="pl-0 bg-[#f7f7f7] flex items-center rounded-full w-12 h-12 hover:text-primary/90"
          >
            <ChevronLeft className="size-6 mr-1" strokeWidth={1.5} />
          </Button>
        </Link>
      </div>

      {/* Title and Location */}
      <div className="flex flex-col sm:flex-row sm:items-start w-full">
        <div className="flex flex-col flex-1">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {trailer?.title}
            </h1>

            {trailer.city && (
              <div className="flex items-center mt-2 text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm sm:text-base">
                  {trailer.city}, {trailer.country || "Netherlands"}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-x-3 mb-6 sm:mb-0 sm:ml-auto">
          <FavoriteButton trailerId={trailer.id} trailerData={trailer} />
          <ShareDialog trailer={shareData} />
          <DropdownMenu>
            <DropdownMenuTrigger className="size-9 outline-none hover:bg-gray-100 cursor-pointer border rounded-full flex items-center justify-center">
              <Ellipsis className="size-5" strokeWidth={1.5} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Flag className="me-2" strokeWidth={1.5} />
                {t("reportAd")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        {/* Left Column: Gallery and Details */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {/* Gallery */}
          <TrailerGallery
            images={trailerData.imageUrls}
            title={trailer.title}
            trailer={trailer}
          />
          <div className="space-y-6 lg:space-y-8 max-w-full lg:max-w-[96%]">
            {/* Specifications */}
            <TrailerSpecs
              type={trailer.type}
              category={trailer.category}
              manufacturer={trailer.manufacturer}
              model={trailer.model}
              year={trailer.year}
              dimensions={{
                length: trailer.length,
                width: trailer.width,
                height: trailer.height,
              }}
              weight={trailer.weight}
              capacity={trailer.capacity}
              axles={trailer.axles}
              brakes={trailer.brakes}
              maxSpeed={trailer.maxSpeed}
              requiresDriversLicense={trailer.requiresDriversLicense}
            />

            {/* Accessories */}
            {trailer.accessories.length > 0 && (
              <TrailerInfo
                title={t("accessories")}
                items={trailer.accessories.map((acc: any) => ({
                  label: acc.name,
                  value: acc.price
                    ? `€${acc.price.toFixed(2)} ${t("perDay")}`
                    : t("included"),
                  description: acc.description || undefined,
                }))}
              />
            )}
            <TrailerOwner
              owner={trailer.owner}
              responseRate={trailer.owner.responseRate}
              responseTime={trailer.owner.responseTime}
              joinDate={trailer.owner.memberSince}
            />
            {/* Description */}
            <TrailerDescription
              type={trailer.type}
              customDescription={trailer.description}
              features={features}
              weight={trailer.weight}
              capacity={trailer.capacity}
              dimensions={{
                length: trailer.length,
                width: trailer.width,
                height: trailer.height,
              }}
              brakes={trailer.brakes}
              manufacturer={trailer.manufacturer}
              year={trailer.year}
            />
            <TrailerLocationMap
              latitude={trailer.latitude ?? 0}
              longitude={trailer.longitude ?? 0}
              title={trailer.title}
              price={trailer.pricePerDay}
              city={trailer.city ?? ""}
              initialZoom={12}
              image={trailerData?.imageUrls?.[0]}
            />
            {/* Reviews */}
            <TrailerReviews reviews={trailer.reviews} avgRating={avgRating} />
          </div>
        </div>

        {/* Right Column: Booking Form (Desktop Only) */}
        <div className="hidden lg:block space-y-8">
          <RentalBookingForm
            trailerId={trailer.id}
            category={trailer.category}
            type={trailer.type}
            pricePerDay={trailer.pricePerDay}
            pricePerWeek={trailer.pricePerWeek}
            pricePerMonth={trailer.pricePerMonth}
            securityDeposit={trailer.securityDeposit}
            includesInsurance={trailer.includesInsurance}
            deliveryFee={trailer.deliveryFee}
            homeDelivery={trailer.homeDelivery}
            maxDeliveryDistance={trailer.maxDeliveryDistance}
            minRentalDuration={trailer.minRentalDuration}
            maxRentalDuration={trailer.maxRentalDuration}
            availabilityData={availabilityData}
            trailerLatitude={trailer.latitude ?? 0}
            trailerLongitude={trailer.longitude ?? 0}
          />
        </div>
      </div>

      {/* Mobile Booking Bar (Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2.5 z-90 lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-gray-900">
              € {trailer.pricePerDay}
              <span className="text-xs font-normal text-gray-600 ml-1">
                {t("perDay")}
              </span>
            </div>
          </div>
          <Button
            className="px-6 py-6 rounded-lg bg-primary hover:bg-primary/90"
            onClick={openBookingModal}
          >
            {t("reserve")}
          </Button>
        </div>
      </div>

      {/* Mobile Bottom Sheet Modal */}
      {mobileBookingOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
              isAnimating ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeBookingModal}
          />

          {/* Bottom Sheet */}
          <div
            className={`
            absolute bottom-0 left-0 right-0 bg-white 
            transform transition-transform duration-300 ease-out
            ${isAnimating ? "translate-y-0" : "translate-y-full"}
            rounded-t-3xl shadow-2xl
            max-h-[90vh] overflow-hidden
          `}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {t("reserve")} {trailer.title}
              </h2>
              <button
                onClick={closeBookingModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-6 py-4">
              <RentalBookingForm
                trailerId={trailer.id}
                category={trailer.category}
                type={trailer.type}
                pricePerDay={trailer.pricePerDay}
                pricePerWeek={trailer.pricePerWeek}
                pricePerMonth={trailer.pricePerMonth}
                securityDeposit={trailer.securityDeposit}
                includesInsurance={trailer.includesInsurance}
                deliveryFee={trailer.deliveryFee}
                homeDelivery={trailer.homeDelivery}
                maxDeliveryDistance={trailer.maxDeliveryDistance}
                minRentalDuration={trailer.minRentalDuration}
                maxRentalDuration={trailer.maxRentalDuration}
                isMobile={true}
                availabilityData={availabilityData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
