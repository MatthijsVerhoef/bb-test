"use client";

import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { format } from "date-fns";
import { nl, de, enUS } from "date-fns/locale";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Textarea } from "../ui/textarea";
import ReservationSkeleton from "./check-reservation-skeleton";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useBookingCalculations } from "@/hooks/useBookingCalculations";
import { useTranslation } from "@/lib/i18n/client";

// Lazy load the checkout form
const CheckoutForm = lazy(() => import("./checkout-form"));

// Lazy load Stripe - only when needed
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
    );
  }
  return stripePromise;
};

// Define booking data interface
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
  basePrice: number;
  needsDelivery?: boolean;
  deliveryAddress?: string;
  message?: string;
  securityDeposit?: number;
}

// Define trailer data interface
interface TrailerData {
  id: string;
  title: string;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  securityDeposit?: number;
  deliveryFee?: number;
  category?: {
    name: string;
  };
  images?: Array<{
    url: string;
  }>;
}

interface ReservationClientProps {
  trailerId: string | null;
  trailerData: TrailerData;
}

export default function ReservationClient({
  trailerId,
  trailerData,
}: ReservationClientProps) {
  const { t, locale } = useTranslation("reservation");
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoadingPayment, setIsLoadingPayment] = useState<boolean>(false);
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);

  const paymentIntentId = useRef<string | null>(null);

  // Use the booking calculations hook
  const { rentalDays, basePrice, serviceFee, totalPrice } =
    useBookingCalculations({
      startDate: bookingData?.startDate
        ? new Date(bookingData.startDate)
        : undefined,
      endDate: bookingData?.endDate ? new Date(bookingData.endDate) : undefined,
      pricePerDay: trailerData.pricePerDay,
      pricePerWeek: trailerData.pricePerWeek || null,
      pricePerMonth: trailerData.pricePerMonth || null,
      needsDelivery: bookingData?.needsDelivery || false,
      deliveryFee: trailerData.deliveryFee || null,
      securityDeposit: trailerData.securityDeposit || null,
    });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedBookingData = localStorage.getItem("rentalBookingData");

        if (storedBookingData) {
          const parsedData = JSON.parse(storedBookingData) as BookingData;

          // Make sure this is the right booking data for this trailer
          if (parsedData.trailerId === trailerId) {
            setBookingData(parsedData);
            setMessage(parsedData.message || "");
            // Don't create payment intent here - wait for user action
          } else {
            setError(t("checkReservation.errors.wrongBookingData"));
          }
        } else {
          setError(t("checkReservation.errors.noBookingData"));
        }
      } catch (e) {
        console.error("Error parsing booking data:", e);
        setError(t("checkReservation.errors.loadingError"));
      } finally {
        setIsLoading(false);
      }
    }

    return () => {
      if (paymentIntentId.current) {
        cancelPaymentIntent(paymentIntentId.current);
      }
    };
  }, [trailerId, t]);

  // Create payment intent only when user is ready to pay
  const handleProceedToPayment = async () => {
    if (!bookingData || !trailerData) return;

    setIsLoadingPayment(true);
    setError(null);

    try {
      await createPaymentIntent(bookingData, trailerData);
      setShowPaymentForm(true);
    } catch (err) {
      console.error("Error creating payment intent:", err);
      setError(t("checkReservation.errors.paymentError"));
    } finally {
      setIsLoadingPayment(false);
    }
  };

  // Create a payment intent on the server
  const createPaymentIntent = async (
    bookingData: BookingData,
    trailerData: TrailerData
  ) => {
    // Use the total from the hook which includes all fees
    const amount = totalPrice || bookingData.totalPrice;

    const response = await fetch("/api/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to cents for Stripe
        currency: "eur",
        isGuestCheckout: true,
        metadata: {
          trailerId: bookingData.trailerId,
          rentalDays: bookingData.rentalDays,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
        },
        reservationData: {
          trailerId: bookingData.trailerId,
          startDate: bookingData.startDate,
          endDate: bookingData.endDate,
          firstName: bookingData.firstName,
          lastName: bookingData.lastName,
          email: bookingData.email,
          phone: bookingData.phone,
          driversLicense: bookingData.driversLicense,
          pickupTime: bookingData.pickupTime,
          returnTime: bookingData.returnTime,
          needsDelivery: bookingData.needsDelivery || false,
          deliveryAddress: bookingData.deliveryAddress,
          message: bookingData.message || "",
        },
      }),
    });

    const data = await response.json();

    if (response.status === 400) {
      if (
        data.error &&
        data?.error?.includes("dates are no longer available")
      ) {
        setError(t("checkReservation.errors.datesUnavailable"));
        return;
      }
      setError(data.error || t("checkReservation.errors.genericError"));
      return;
    }

    if (!response.ok && response.status !== 401) {
      throw new Error(data.error || "Failed to create payment intent");
    }

    if (data.clientSecret) {
      setClientSecret(data.clientSecret);
      paymentIntentId.current = data.paymentIntentId;
    } else {
      setError(data.error || t("checkReservation.errors.paymentError"));
    }
  };

  // Cancel payment intent if user leaves page without completing payment
  const cancelPaymentIntent = async (intentId: string) => {
    try {
      await fetch("/api/cancel-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIntentId: intentId,
        }),
      });
    } catch (err) {
      console.error("Error canceling payment intent:", err);
    }
  };

  const formatDateRange = (): string => {
    if (!bookingData?.startDate || !bookingData?.endDate)
      return t("checkReservation.errors.unknownPeriod");

    const startDate = new Date(bookingData.startDate);
    const endDate = new Date(bookingData.endDate);

    const dateLocale = locale === "nl" ? nl : locale === "de" ? de : enUS;

    return `${format(startDate, "d MMMM yyyy", {
      locale: dateLocale,
    })} - ${format(endDate, "d MMMM yyyy", { locale: dateLocale })}`;
  };

  const handleGoBack = () => {
    router.back();
  };

  const handlePaymentComplete = (rentalId: string) => {
    router.push(`/reservation/success?id=${rentalId}`);
  };

  const handleEditRentalPeriod = () => {
    router.push(`/aanbod/${trailerId}/`);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    if (bookingData) {
      const updatedBookingData = {
        ...bookingData,
        message: e.target.value,
      };

      setBookingData(updatedBookingData);
      localStorage.setItem(
        "rentalBookingData",
        JSON.stringify(updatedBookingData)
      );
    }
  };

  if (isLoading) {
    return <ReservationSkeleton />;
  }

  if (error) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.push(`/trailers/${trailerId}`)}
        >
          {t("checkReservation.actions.backToTrailer")}
        </Button>
      </div>
    );
  }

  // Configure Stripe Elements options with current locale
  const stripeOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#0A2540",
        colorText: "#1A1A1A",
        borderRadius: "12px",
      },
    },
    locale: locale as any,
  };

  // Price summary card component
  const PriceSummaryCard = () => (
    <Card className="border w-full lg:min-w-[350px] shadow-none lg:sticky lg:top-[100px] rounded-xl">
      <CardContent className="space-y-4">
        {trailerData && (
          <>
            <div className="flex items-center gap-x-4">
              <div className="relative h-16 w-16 sm:h-22 sm:w-22 min-w-16 sm:min-w-22 rounded-lg flex-shrink-0">
                {trailerData.images && trailerData.images.length > 0 ? (
                  <Image
                    src={trailerData.images[0].url}
                    alt={trailerData.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                    <p className="text-gray-500 text-xs text-center px-1">
                      {t("checkReservation.errors.noImageAvailable")}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold truncate">
                  {trailerData.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1 truncate">
                  {trailerData.category?.name}
                </p>
              </div>
            </div>
          </>
        )}
        <div className="flex flex-col mt-6">
          <p className="font-semibold text-[13px]">
            {t("checkReservation.priceBreakdown.rentalPeriod")}
          </p>
          <p className="text-[13px] text-gray-500 mt-2">{formatDateRange()}</p>
          <div className="text-[13px] flex flex-col sm:flex-row sm:items-center mt-1.5 text-gray-500 gap-1 sm:gap-0">
            <p>
              {t("checkReservation.priceBreakdown.pickup")}:{" "}
              {bookingData?.pickupTime || "12:00"}
            </p>
            <span className="hidden sm:inline mx-2">-</span>
            <p>
              {t("checkReservation.priceBreakdown.return")}:{" "}
              {bookingData?.returnTime || "12:00"}
            </p>
          </div>
        </div>
        <Separator />
        {bookingData && (
          <>
            <div className="space-y-2">
              <div className="flex flex-col justify-between text-[13px]">
                <span className="font-semibold">
                  {t("checkReservation.priceBreakdown.price")}
                </span>
                <div className="flex items-center w-full justify-between">
                  <span className="mt-2.5">
                    €{trailerData?.pricePerDay?.toFixed(2) || "0.00"} ×{" "}
                    {rentalDays || "0"}{" "}
                    {t("checkReservation.priceBreakdown.days")}
                  </span>
                  <span className="">€{basePrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-[13px]">
                <span>{t("checkReservation.priceBreakdown.serviceFee")}</span>
                <span>€{serviceFee.toFixed(2)}</span>
              </div>

              {bookingData.needsDelivery && trailerData?.deliveryFee && (
                <div className="flex justify-between text-[13px]">
                  <span>
                    {t("checkReservation.priceBreakdown.deliveryCost")}
                  </span>
                  <span>€{trailerData.deliveryFee.toFixed(2)}</span>
                </div>
              )}

              {trailerData?.securityDeposit && (
                <div className="flex justify-between text-[13px]">
                  <span>
                    {t("checkReservation.priceBreakdown.securityDeposit")}
                  </span>
                  <span>€{trailerData.securityDeposit.toFixed(2)}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>{t("checkReservation.priceBreakdown.total")}</span>
              <span>€{totalPrice.toFixed(2)}</span>
            </div>
          </>
        )}
        <Button
          type="button"
          className="w-full rounded-full h-11 mt-2"
          variant="outline"
          onClick={handleEditRentalPeriod}
        >
          {t("checkReservation.actions.changeRentalPeriod")}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="container max-w-5xl mx-auto px-4 pt-8 pb-8 md:pt-20 md:pb-24">
      <div className="flex flex-col lg:flex-row lg:items-start gap-x-6">
        <Button
          variant="ghost"
          className="flex items-center bg-[#f6f8f9] mb-6 lg:-ml-2 size-12 rounded-full"
          onClick={handleGoBack}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="w-full">
          <h1 className="text-xl lg:text-2xl font-semibold mb-6 mt-2 lg:hidden">
            {t("checkReservation.title")}
          </h1>

          {/* Mobile: Price summary first */}
          <div className="block lg:hidden mb-6">
            <PriceSummaryCard />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-6 w-full">
            {/* Left Column: Trailer and Booking Details */}
            <div className="lg:col-span-3 space-y-3 md:space-y-6">
              <h1 className="text-xl lg:text-2xl font-semibold mb-6 mt-2 hidden lg:block">
                {t("checkReservation.title")}
              </h1>

              {bookingData && (
                <Card className="border shadow-none rounded-xl">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-base font-medium">
                      {t("checkReservation.personalInfo.title")}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500 text-sm">
                          {t("checkReservation.personalInfo.firstName")}
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {bookingData.firstName ||
                            t("checkReservation.personalInfo.notProvided")}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-sm">
                          {t("checkReservation.personalInfo.lastName")}
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {bookingData.lastName ||
                            t("checkReservation.personalInfo.notProvided")}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500 text-sm">
                          {t("checkReservation.personalInfo.email")}
                        </Label>
                        <p className="text-sm font-medium mt-1 break-words max-w-full">
                          {bookingData.email ||
                            t("checkReservation.personalInfo.notProvided")}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500 text-sm">
                          {t("checkReservation.personalInfo.phone")}
                        </Label>
                        <p className="text-sm font-medium mt-1">
                          {bookingData.phone ||
                            t("checkReservation.personalInfo.notProvided")}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <Label className="text-gray-500 text-sm">
                          {t("checkReservation.personalInfo.driversLicense")}
                        </Label>
                      </div>
                      <p className="text-sm font-medium mt-1">
                        {bookingData.driversLicense ||
                          t("checkReservation.personalInfo.notProvided")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border shadow-none rounded-xl">
                <CardHeader className="pb-0">
                  <CardTitle className="text-base font-medium">
                    {t("checkReservation.messageToLessor.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("checkReservation.messageToLessor.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder={t(
                      "checkReservation.messageToLessor.placeholder"
                    )}
                    className="rounded-xl border-none shadow-none h-[140px] resize-none px-4 py-3.5 bg-[#f6f8f9]"
                    value={message}
                    onChange={handleMessageChange}
                  />
                </CardContent>
              </Card>

              {!showPaymentForm ? (
                <Card className="border shadow-none rounded-xl">
                  <CardHeader>
                    <CardTitle className="text-base font-medium">
                      {t("checkReservation.readyToPay.title")}
                    </CardTitle>
                    <CardDescription>
                      {t("checkReservation.readyToPay.description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full rounded-full h-11"
                      onClick={handleProceedToPayment}
                      disabled={isLoadingPayment}
                    >
                      {isLoadingPayment
                        ? t("checkReservation.actions.loading")
                        : t("checkReservation.actions.proceedToPayment")}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border shadow-none rounded-xl">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-base font-medium">
                      {t("checkReservation.paymentMethod.title")}
                    </CardTitle>
                    <CardDescription>
                      {t("checkReservation.paymentMethod.description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {clientSecret && bookingData ? (
                      <Suspense
                        fallback={
                          <div className="py-4 flex justify-center">
                            <Skeleton className="h-32 w-full rounded-xl" />
                          </div>
                        }
                      >
                        <Elements stripe={getStripe()} options={stripeOptions}>
                          <CheckoutForm
                            totalPrice={totalPrice}
                            bookingData={bookingData}
                            trailerData={trailerData}
                            onPaymentComplete={handlePaymentComplete}
                          />
                        </Elements>
                      </Suspense>
                    ) : (
                      <div className="py-4 flex justify-center">
                        <Skeleton className="h-32 w-full rounded-xl" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Price Summary (Desktop only) */}
            <div className="lg:col-span-2 lg:mt-16 hidden lg:block">
              <PriceSummaryCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
