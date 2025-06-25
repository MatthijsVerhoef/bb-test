import { useState, useCallback } from "react";
import { getDay } from "date-fns";
import { useTranslation } from "@/lib/i18n/client";
import { isDateInBlockedPeriod, DAY_MAP } from "@/lib/utils/date-availability";
import type { BookingFormData, ValidationErrors } from "@/app/types/booking.types";
import type {
  ExistingRental,
  WeeklyAvailability,
  BlockedPeriod,
} from "@/lib/utils/date-availability";

interface UseBookingValidationProps {
  formData: BookingFormData;
  rentalDays: number;
  minRentalDuration?: number | null;
  maxRentalDuration?: number | null;
  existingRentals: ExistingRental[];
  blockedPeriodsData: BlockedPeriod[];
  weeklyAvailabilityData: WeeklyAvailability[];
  trailerId: string;
  pickupTimeOptions: string[];
  returnTimeOptions: string[];
}

export function useBookingValidation({
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
}: UseBookingValidationProps) {
  const { t } = useTranslation("trailer");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  const validateBookingForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    // Date validation
    if (!formData.startDate || !formData.endDate) {
      errors.dateRange = t("booking.errors.selectValidPeriod");
    } else {
      if (minRentalDuration && rentalDays < minRentalDuration) {
        errors.dateRange = t("booking.errors.minRentalDuration", {
          days: minRentalDuration,
        });
      }
      if (maxRentalDuration && rentalDays > maxRentalDuration) {
        errors.dateRange = t("booking.errors.maxRentalDuration", {
          days: maxRentalDuration,
        });
      }

      // Check for conflicting rentals
      const invalidDate = existingRentals.some((rental) => {
        if (!["CONFIRMED", "ACTIVE"].includes(rental.status)) return false;

        const rentalStart = new Date(rental.startDate);
        const rentalEnd = new Date(rental.endDate);

        return (
          formData.startDate! <= rentalEnd && formData.endDate! >= rentalStart
        );
      });

      if (invalidDate) {
        errors.dateRange = t("booking.errors.datesNotAvailable");
      }

      // Check blocked periods and weekly availability
      let currentDate = new Date(formData.startDate.getTime());
      currentDate.setHours(0, 0, 0, 0);

      const endDateNormalized = new Date(formData.endDate.getTime());
      endDateNormalized.setHours(0, 0, 0, 0);

      let isBlocked = false;
      let blockedReason = "";

      while (currentDate <= endDateNormalized && !isBlocked) {
        if (isDateInBlockedPeriod(currentDate, blockedPeriodsData, trailerId)) {
          isBlocked = true;
          blockedReason = "blockedPeriod";
          break;
        }

        const dayOfWeek = getDay(currentDate);
        const day = DAY_MAP[dayOfWeek as keyof typeof DAY_MAP];
        const dayAvailability = weeklyAvailabilityData.find(
          (a) => a.day === day
        );

        if (dayAvailability && !dayAvailability.available) {
          isBlocked = true;
          blockedReason = "dayUnavailable";
          break;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (isBlocked) {
        if (blockedReason === "blockedPeriod") {
          errors.dateRange = t("booking.errors.datesBlocked");
        } else if (blockedReason === "dayUnavailable") {
          errors.dateRange = t("booking.errors.dayNotAvailable");
        } else {
          errors.dateRange = t("booking.errors.datesNotAvailable");
        }
      }
    }

    // Time validation
    if (
      formData.startDate &&
      !pickupTimeOptions.includes(formData.pickupTime)
    ) {
      errors.time = t("booking.errors.pickupTimeNotAvailable");
    }

    if (formData.endDate && !returnTimeOptions.includes(formData.returnTime)) {
      errors.time = t("booking.errors.returnTimeNotAvailable");
    }

    // Delivery validation
    if (formData.needsDelivery && !formData.deliveryAddress.trim()) {
      errors.deliveryAddress = t("booking.errors.deliveryAddressRequired");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [
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
    t,
  ]);

  const validateUserInfo = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.firstName.trim())
      errors.firstName = t("booking.errors.firstNameRequired");
    if (!formData.lastName.trim())
      errors.lastName = t("booking.errors.lastNameRequired");

    if (!formData.email.trim()) {
      errors.email = t("booking.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t("booking.errors.emailInvalid");
    }

    if (!formData.phone.trim()) {
      errors.phone = t("booking.errors.phoneRequired");
    } else if (!/^\+?[0-9\s\-\(\)]{8,}$/.test(formData.phone)) {
      errors.phone = t("booking.errors.phoneInvalid");
    }

    if (!formData.driversLicense.trim()) {
      errors.driversLicense = t("booking.errors.driversLicenseRequired");
    }

    if (!formData.termsAccepted) {
      errors.terms = t("booking.errors.termsRequired");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, t]);

  return {
    validationErrors,
    validateBookingForm,
    validateUserInfo,
  };
}
