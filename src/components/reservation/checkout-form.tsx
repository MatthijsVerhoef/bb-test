"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { PaymentMethod } from "@prisma/client";
import { PricingService } from "@/services/pricing.service";

interface BookingData {
  trailerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  driversLicense: string;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  rentalDays: number;
  totalPrice: number;
  needsDelivery?: boolean;
  message?: string;
}

interface TrailerData {
  id: string;
  title: string;
  pricePerDay: number;
  pricePerWeek?: number | null;
  pricePerMonth?: number | null;
  securityDeposit?: number;
  deliveryFee?: number;
  category?: {
    name: string;
  };
  images?: Array<{
    url: string;
  }>;
}

interface CheckoutFormProps {
  totalPrice: number;
  bookingData: BookingData;
  trailerData: TrailerData;
  onPaymentComplete: (rentalId: string) => void;
}

export default function CheckoutForm({
  totalPrice,
  bookingData,
  trailerData,
  onPaymentComplete,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const pricingCalculation = PricingService.calculatePricing({
        startDate: new Date(bookingData.startDate),
        endDate: new Date(bookingData.endDate),
        pricePerDay: trailerData.pricePerDay,
        pricePerWeek: trailerData.pricePerWeek,
        pricePerMonth: trailerData.pricePerMonth,
        needsDelivery: bookingData.needsDelivery,
        deliveryFee: trailerData.deliveryFee,
        securityDeposit: trailerData.securityDeposit,
      });

      if (
        !PricingService.validatePricing(
          {
            startDate: new Date(bookingData.startDate),
            endDate: new Date(bookingData.endDate),
            pricePerDay: trailerData.pricePerDay,
            pricePerWeek: trailerData.pricePerWeek,
            pricePerMonth: trailerData.pricePerMonth,
            needsDelivery: bookingData.needsDelivery,
            deliveryFee: trailerData.deliveryFee,
            securityDeposit: trailerData.securityDeposit,
          },
          totalPrice
        )
      ) {
        throw new Error(
          "Prijsberekening komt niet overeen. Probeer het opnieuw."
        );
      }

      const createReservationResponse = await fetch("/api/reservation/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trailerId: bookingData.trailerId,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          pickupTime: bookingData.pickupTime,
          returnTime: bookingData.returnTime,
          totalPrice: pricingCalculation.totalRenterPrice,
          serviceFee: pricingCalculation.renterServiceFee,
          securityDeposit: pricingCalculation.securityDeposit,
          deliveryFee: pricingCalculation.deliveryFee,
          needsDelivery: !!bookingData.needsDelivery,
          specialNotes: bookingData.message,
          paymentMethod: PaymentMethod.CARD,
          paymentIntentId: "pending",
          termsAccepted: true,
          pricingBreakdown: {
            basePrice: pricingCalculation.basePrice,
            rentalDays: pricingCalculation.rentalDays,
            lessorEarnings: pricingCalculation.lessorEarnings,
            platformFee: pricingCalculation.lessorPlatformFee,
          },
        }),
      });

      if (!createReservationResponse.ok) {
        const errorData = await createReservationResponse.json();
        throw new Error(
          errorData.error ||
            "Er is een fout opgetreden bij het maken van je reservering"
        );
      }

      const reservationData = await createReservationResponse.json();
      const rentalId = reservationData.reservation.id;

      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/reservering/succesvol?rentalId=${rentalId}`,
        },
      });

      if (stripeError) {
        throw new Error(
          stripeError.message ||
            "Er is een fout opgetreden bij het verwerken van je betaling"
        );
      }

      localStorage.removeItem("rentalBookingData");

      onPaymentComplete(rentalId);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Er is een fout opgetreden bij het verwerken van je betaling."
      );
      console.error("Payment/reservation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <PaymentElement
          options={{
            layout: {
              type: "tabs",
              defaultCollapsed: false,
            },
            style: {
              base: {
                fontSize: "16px",
                fontFamily: "system-ui, sans-serif",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
            },
          }}
        />
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full rounded-full h-11 mt-4"
        disabled={!stripe || isLoading}
      >
        {isLoading ? "Bezig met verwerken..." : "Reservering bevestigen"}
      </Button>
    </form>
  );
}
