"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ChevronLeft, Shield } from "lucide-react";
import { useAuth } from "@/stores/auth.store";
import { useTranslation } from "@/lib/i18n/client";
import { StripePaymentFormWrapper } from "@/components/payment/StripePaymentForm";
import QuickMessage from "./quick-message";

// Sub-components
import PriceHeader from "@/components/trailer-details/rental-booking-form/PriceHeader";
import DateRangePicker from "@/components/trailer-details/rental-booking-form//DateRangePicker";
import TimeSelectors from "@/components/trailer-details/rental-booking-form//TimeSelectors";
import DeliveryOptions from "@/components/trailer-details/rental-booking-form//DeliveryOptions";
import PriceBreakdown from "@/components/trailer-details/rental-booking-form//PriceBreakdown";
import BookingConfirmationDialog from "@/components/trailer-details/rental-booking-form//BookingConfirmationDialog";
import AvailabilityAlert from "@/components/trailer-details/rental-booking-form//AvailabilityAlert";

// Hooks
import { useAvailabilityData } from "@/hooks/useAvailabilityData";
import { useBookingCalculations } from "@/hooks/useBookingCalculations";
import { useBookingValidation } from "@/hooks/useBookingValidation";
import { getAvailableTimeOptions } from "@/lib/utils/date-availability";

// Types
import type {
  RentalBookingFormProps,
  BookingFormData,
} from "@/app/types/booking.types";

// Extend the interface to include mobile-specific props
interface ExtendedRentalBookingFormProps extends RentalBookingFormProps {
  onMobileConfirmation?: () => void;
  currentMobileContent?: "booking" | "confirmation";
  onBackToBooking?: () => void;
}

export default function RentalBookingForm({
  trailerId,
  pricePerDay,
  pricePerWeek,
  pricePerMonth,
  securityDeposit,
  deliveryFee,
  ownerId,
  trailerTitle,
  homeDelivery,
  maxDeliveryDistance,
  minRentalDuration = 1,
  maxRentalDuration,
  available = true,
  weeklyAvailability = [],
  type,
  isMobile = false,
  availabilityData,
  trailerLatitude,
  trailerLongitude,
  onMobileConfirmation,
  currentMobileContent = "booking",
  onBackToBooking,
}: ExtendedRentalBookingFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { t, locale } = useTranslation("trailer");

  // Form state
  const [formData, setFormData] = useState<BookingFormData>({
    startDate: undefined,
    endDate: undefined,
    pickupTime: "",
    returnTime: "",
    needsDelivery: false,
    deliveryAddress: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    driversLicense: "",
    termsAccepted: false,
  });

  // UI state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isQuickMessageOpen, setIsQuickMessageOpen] = useState(false);

  // Hooks
  const {
    existingRentals,
    weeklyAvailabilityData,
    availabilityExceptions,
    blockedPeriodsData,
    isLoading,
    loadingError,
    fetchFullAvailability,
  } = useAvailabilityData({
    trailerId,
    initialWeeklyAvailability: weeklyAvailability,
    availabilityData,
  });

  const { rentalDays, basePrice, totalPrice } = useBookingCalculations({
    startDate: formData.startDate,
    endDate: formData.endDate,
    pricePerDay,
    pricePerWeek,
    pricePerMonth,
    needsDelivery: formData.needsDelivery,
    deliveryFee,
  });

  const pickupTimeOptions = formData.startDate
    ? getAvailableTimeOptions(
        formData.startDate,
        weeklyAvailabilityData,
        availabilityExceptions
      )
    : [];

  const returnTimeOptions = formData.endDate
    ? getAvailableTimeOptions(
        formData.endDate,
        weeklyAvailabilityData,
        availabilityExceptions
      )
    : [];

  const { validationErrors, validateBookingForm, validateUserInfo } =
    useBookingValidation({
      formData,
      rentalDays,
      minRentalDuration,
      maxRentalDuration,
      existingRentals,
      blockedPeriodsData,
      weeklyAvailabilityData,
      trailerId,
      pickupTimeOptions,
      returnTimeOptions,
    });

  // Initialize user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  const updateFormData = (updates: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleBookingSubmit = () => {
    if (!validateBookingForm()) return;

    // On mobile, trigger the content switch instead of opening dialog
    if (isMobile && onMobileConfirmation) {
      onMobileConfirmation();
    } else {
      // On desktop, open the dialog
      setIsConfirmDialogOpen(true);
    }
  };

  const handleConfirmBooking = () => {
    if (!validateUserInfo()) return;

    const bookingData = {
      trailerId,
      trailerTitle,
      startDate: formData.startDate?.toISOString(),
      endDate: formData.endDate?.toISOString(),
      pickupTime: formData.pickupTime,
      returnTime: formData.returnTime,
      rentalDays,
      basePrice,
      totalPrice,
      securityDeposit,
      needsDelivery: formData.needsDelivery,
      deliveryAddress: formData.needsDelivery ? formData.deliveryAddress : null,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      driversLicense: formData.driversLicense,
      termsAccepted: formData.termsAccepted,
    };

    localStorage.setItem("rentalBookingData", JSON.stringify(bookingData));

    // Close dialog on desktop
    if (!isMobile) {
      setIsConfirmDialogOpen(false);
    }

    router.push(`/reserveren/${trailerId}`);
  };

  const handlePaymentSuccess = (paymentIntentId: string, rentalId: string) => {
    router.push(
      `/booking/confirm?rentalId=${rentalId}&paymentIntent=${paymentIntentId}`
    );
  };

  // Mobile confirmation form rendering
  if (isMobile && currentMobileContent === "confirmation") {
    return (
      <div className="space-y-4">
        {/* Back button */}
        {/* <Button
          variant="ghost"
          className="mb-4 -ml-2"
          onClick={onBackToBooking}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button> */}

        {/* Form fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2.5">
              <Label htmlFor="first-name">{t("booking.form.firstName")}</Label>
              <Input
                id="first-name"
                className={`shadow-none h-10 rounded-lg ${
                  validationErrors.firstName ? "border-red-500" : ""
                }`}
                value={formData.firstName}
                onChange={(e) => updateFormData({ firstName: e.target.value })}
                required
              />
              {validationErrors.firstName && (
                <p className="text-xs text-red-500">
                  {validationErrors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="last-name">{t("booking.form.lastName")}</Label>
              <Input
                id="last-name"
                className={`shadow-none h-10 rounded-lg ${
                  validationErrors.lastName ? "border-red-500" : ""
                }`}
                value={formData.lastName}
                onChange={(e) => updateFormData({ lastName: e.target.value })}
                required
              />
              {validationErrors.lastName && (
                <p className="text-xs text-red-500">
                  {validationErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="email">{t("booking.form.email")}</Label>
            <Input
              id="email"
              type="email"
              className={`shadow-none h-10 rounded-lg ${
                validationErrors.email ? "border-red-500" : ""
              }`}
              value={formData.email}
              onChange={(e) => updateFormData({ email: e.target.value })}
              required
            />
            {validationErrors.email && (
              <p className="text-xs text-red-500">{validationErrors.email}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="phone">{t("booking.form.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              className={`shadow-none h-10 rounded-lg ${
                validationErrors.phone ? "border-red-500" : ""
              }`}
              value={formData.phone}
              onChange={(e) => updateFormData({ phone: e.target.value })}
              required
            />
            {validationErrors.phone && (
              <p className="text-xs text-red-500">{validationErrors.phone}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="drivers-license"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4 text-primary" />
              {t("booking.form.driversLicense")}
            </Label>
            <Input
              id="drivers-license"
              value={formData.driversLicense}
              className={`shadow-none h-10 rounded-lg ${
                validationErrors.driversLicense ? "border-red-500" : ""
              }`}
              onChange={(e) =>
                updateFormData({ driversLicense: e.target.value })
              }
              required
            />
            {validationErrors.driversLicense && (
              <p className="text-xs text-red-500">
                {validationErrors.driversLicense}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {t("booking.form.driversLicenseInfo")}
            </p>
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="terms"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) =>
                updateFormData({ termsAccepted: checked as boolean })
              }
              required
            />
            <div className="ms-1">
              <Label
                htmlFor="terms"
                className="cursor-pointer text-[13px] -mt-[1px]"
              >
                {t("booking.terms.agree")}
              </Label>
              <p className="text-xs mt-0.5 text-gray-500">
                {t("booking.terms.details")}
              </p>
              {validationErrors.terms && (
                <p className="text-xs text-red-500">{validationErrors.terms}</p>
              )}
            </div>
          </div>
        </div>

        <Button
          className="w-full mt-6"
          disabled={
            !formData.firstName ||
            !formData.lastName ||
            !formData.email ||
            !formData.driversLicense ||
            !formData.termsAccepted
          }
          onClick={handleConfirmBooking}
        >
          {t("booking.submit.toPayment")}
        </Button>
        <Button
          variant={"outline"}
          className="w-full mt-0"
          onClick={onBackToBooking}
        >
          Terug naar overzicht
        </Button>
      </div>
    );
  }

  // Regular booking form content (both desktop and mobile booking view)
  return (
    <>
      <Card
        className={`${
          isMobile
            ? "bg-white shadow-none border-none p-0"
            : "sticky top-24 bg-[#f6f8f9] shadow-none py-7 px-3 border-none"
        } overflow-visible`}
      >
        <CardHeader
          className={`${isMobile ? "p-0 pb-4" : ""} overflow-visible`}
        >
          <CardTitle className="flex justify-between items-center overflow-visible">
            <PriceHeader
              pricePerDay={pricePerDay}
              pricePerWeek={pricePerWeek}
              pricePerMonth={pricePerMonth}
              available={available}
            />
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 px-0 -mt-4 md:mt-0 md:px-6">
          {loadingError && <AvailabilityAlert error={loadingError} />}

          <DateRangePicker
            startDate={formData.startDate}
            endDate={formData.endDate}
            onDateChange={(startDate, endDate) =>
              updateFormData({ startDate, endDate })
            }
            existingRentals={existingRentals}
            weeklyAvailabilityData={weeklyAvailabilityData}
            availabilityExceptions={availabilityExceptions}
            blockedPeriodsData={blockedPeriodsData}
            minRentalDuration={minRentalDuration}
            maxRentalDuration={maxRentalDuration}
            validationError={validationErrors.dateRange}
            available={available}
            isLoading={isLoading}
            onOpenDatePicker={fetchFullAvailability}
            trailerId={trailerId}
          />

          <TimeSelectors
            startDate={formData.startDate}
            endDate={formData.endDate}
            pickupTime={formData.pickupTime}
            returnTime={formData.returnTime}
            onPickupTimeChange={(time) => updateFormData({ pickupTime: time })}
            onReturnTimeChange={(time) => updateFormData({ returnTime: time })}
            weeklyAvailabilityData={weeklyAvailabilityData}
            availabilityExceptions={availabilityExceptions}
            validationError={validationErrors.time}
            available={available}
            isLoading={isLoading}
          />

          {homeDelivery && (
            <DeliveryOptions
              needsDelivery={formData.needsDelivery}
              deliveryAddress={formData.deliveryAddress}
              onDeliveryChange={(needsDelivery) =>
                updateFormData({ needsDelivery })
              }
              onAddressChange={(address) =>
                updateFormData({ deliveryAddress: address })
              }
              deliveryFee={deliveryFee}
              maxDeliveryDistance={maxDeliveryDistance}
              validationError={validationErrors.deliveryAddress}
              available={available}
              isLoading={isLoading}
              trailerType={type}
              trailerLocation={
                trailerLatitude && trailerLongitude
                  ? { lat: trailerLatitude, lng: trailerLongitude }
                  : undefined
              }
            />
          )}

          <PriceBreakdown
            basePrice={basePrice}
            totalPrice={totalPrice}
            rentalDays={rentalDays}
            pricePerDay={pricePerDay}
            needsDelivery={formData.needsDelivery}
            deliveryFee={deliveryFee}
            securityDeposit={securityDeposit}
          />

          <Button
            onClick={handleBookingSubmit}
            className="w-full mt-4"
            disabled={
              !available ||
              !formData.startDate ||
              !formData.endDate ||
              !formData.pickupTime ||
              !formData.returnTime ||
              isLoading
            }
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("booking.button.loading")}
              </span>
            ) : (
              t("booking.button.reserve")
            )}
          </Button>

          {user && (
            <QuickMessage
              isQuickMessageOpen={isQuickMessageOpen}
              setIsQuickMessageOpen={setIsQuickMessageOpen}
              trailerId={trailerId}
              ownerId={ownerId ?? ""}
              trailerTitle={trailerTitle}
            />
          )}
        </CardContent>
      </Card>

      {/* Desktop Booking Confirmation Dialog - Only rendered on desktop */}
      <BookingConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmBooking}
        formData={formData}
        onUpdateFormData={updateFormData}
        validationErrors={validationErrors}
        trailerTitle={trailerTitle}
        rentalDays={rentalDays}
      />

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <StripePaymentFormWrapper
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          rentalDetails={{
            trailerId,
            trailerTitle,
            startDate: formData.startDate?.toISOString() || "",
            endDate: formData.endDate?.toISOString() || "",
            pickupTime: formData.pickupTime,
            returnTime: formData.returnTime,
            totalPrice,
            securityDeposit: securityDeposit || undefined,
            needsDelivery: formData.needsDelivery,
            deliveryAddress: formData.needsDelivery
              ? formData.deliveryAddress
              : undefined,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
