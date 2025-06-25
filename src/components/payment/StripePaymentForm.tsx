"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useStripe,
  useElements,
  Elements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, ArrowLeft, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/client";

// Initialize Stripe outside of the component
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

// Rental details interface
interface RentalDetails {
  trailerId: string;
  trailerTitle?: string;
  startDate?: string;
  endDate?: string;
  pickupTime: string;
  returnTime: string;
  totalPrice: number;
  needsDelivery: boolean;
  deliveryAddress?: string;
  securityDeposit?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  driversLicense?: string;
}

interface StripePaymentFormWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  rentalDetails: RentalDetails;
  onSuccess: (paymentIntentId: string, rentalId: string) => void;
  existingRentalId?: string;
}

// Helper function to map i18n language codes to Stripe locale codes
const getStripeLocale = (langCode: string | undefined) => {
  if (!langCode) return "en";

  const localeMap: Record<string, string> = {
    nl: "nl",
    en: "en",
    de: "de",
  };
  return localeMap[langCode] || "en";
};

// Component that wraps Stripe Elements
export function StripePaymentFormWrapper({
  isOpen,
  onClose,
  rentalDetails,
  onSuccess,
  existingRentalId,
}: StripePaymentFormWrapperProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation("profile");
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rentalId, setRentalId] = useState<string | null>(
    existingRentalId || null
  );
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const amount = rentalDetails.totalPrice;
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);

  // Get current language for Stripe directly from cookies/localStorage
  const [currentLocale, setCurrentLocale] = useState(() => {
    if (typeof window === "undefined") return "en";

    // Try to get from cookie first
    const cookieMatch = document.cookie.match(/preferred-locale=([^;]+)/);
    if (cookieMatch && ["nl", "en", "de"].includes(cookieMatch[1])) {
      return cookieMatch[1];
    }

    // Fallback to localStorage
    const storedLocale = localStorage.getItem("preferred-locale");
    if (storedLocale && ["nl", "en", "de"].includes(storedLocale)) {
      return storedLocale;
    }

    return "en";
  });

  // Also update if i18n changes
  useEffect(() => {
    if (i18n?.language) {
      setCurrentLocale(i18n.language);
    }
  }, [i18n?.language]);

  const paymentInitialized = useRef(false);
  const cleanupCalled = useRef(false);

  useEffect(() => {
    if (isOpen) {
      paymentInitialized.current = false;
      cleanupCalled.current = false;
      setError(null);
      setPaymentSuccessful(false);
      initializePayment();
    }
  }, [isOpen]);

  const initializePayment = async () => {
    if (paymentInitialized.current) return;

    setIsLoading(true);
    try {
      paymentInitialized.current = true;

      const endpoint = existingRentalId
        ? "/api/payments/retry"
        : "/api/create-payment-intent";

      const requestBody = existingRentalId
        ? { rentalId: existingRentalId }
        : {
            amount: amount,
            rentalDetails,
            paymentSessionId: paymentIntentId,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);

      // Set rental ID if returned
      if (data.rental && data.rental.id) {
        setRentalId(data.rental.id);
      }
    } catch (err) {
      console.error("Error initializing payment:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to initialize payment. Please try again.";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cleanup separately from component unmount
  const handleCleanup = async () => {
    if (paymentIntentId && !cleanupCalled.current && !paymentSuccessful) {
      cleanupCalled.current = true;

      try {
        // We prioritize rentalId over paymentIntentId for cancellation
        // But always include paymentIntentId if available for proper block cleanup
        const payload = rentalId
          ? { rentalId, paymentIntentId }
          : { paymentIntentId };

        await fetch("/api/payments/cancel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error("Error during payment cleanup:", err);
      }
    }
  };

  // Modified onClose handler that ensures cleanup happens before closing
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Dialog is closing
      handleCleanup();
      onClose();
    }
  };

  // Add beforeunload event to handle page navigation
  useEffect(() => {
    // Only add the listener if we have a payment to clean up
    if (paymentIntentId && !paymentSuccessful) {
      // Define the handler function
      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        // Only try to clean up if not already done
        if (!cleanupCalled.current) {
          // Use the synchronous fetch API for beforeunload
          // This won't guarantee completion but gives it a better chance
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/cancel-payment-intent/emergency", false); // synchronous request
          xhr.setRequestHeader("Content-Type", "application/json");

          // Use a minimal payload with just the payment intent ID
          const payload = JSON.stringify({ paymentIntentId });

          try {
            xhr.send(payload);
            if (xhr.status === 200) {
              cleanupCalled.current = true;
            }
          } catch (e) {
            console.error("Error in emergency cleanup:", e);
          }

          // Also attempt to use sendBeacon as a backup method (more reliable in some browsers)
          if (navigator.sendBeacon) {
            try {
              const blob = new Blob([payload], { type: "application/json" });
              const success = navigator.sendBeacon(
                "/api/cancel-payment-intent/emergency",
                blob
              );
              if (success) {
              } else {
                console.warn("Beacon cleanup request failed to queue");
              }
            } catch (beaconError) {
              console.error("Error sending beacon:", beaconError);
            }
          }
        }

        // Standard beforeunload message (browser will show its own dialog)
        event.returnValue =
          "Er is nog een betaling in behandeling. Weet je zeker dat je deze pagina wilt verlaten?";
        return event.returnValue;
      };

      // Add the event listener
      window.addEventListener("beforeunload", handleBeforeUnload);

      // Return cleanup function
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }

    return undefined;
  }, [paymentIntentId, paymentSuccessful]);

  // Memoize the cleanup function to prevent unnecessary rerenders
  const memoizedCleanup = useCallback(() => {
    if (!cleanupCalled.current && paymentIntentId && !paymentSuccessful) {
      handleCleanup();
    }
  }, [paymentIntentId, paymentSuccessful]);

  // Component unmount cleanup (for normal component unmount without page navigation)
  useEffect(() => {
    return () => {
      memoizedCleanup();
    };
  }, [memoizedCleanup]);

  const handleRetry = () => {
    setError(null);
    paymentInitialized.current = false;
    initializePayment();
  };

  const handleBack = () => {
    onClose();
  };

  const handleError = (message: string) => {
    setError(message);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogHeader className="hidden">
        <DialogTitle>Betaling</DialogTitle>
      </DialogHeader>
      <DialogContent className="sm:max-w-md p-8 rounded-2xl">
        {paymentSuccessful ? (
          <div className="text-center p-4">
            <div className="mb-4 flex justify-center">
              <div className="bg-green-100 p-4 rounded-full">
                <Check className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Betaling gelukt!</h2>
            <p className="text-gray-600 mb-6">
              Je reservering is bevestigd. Je ontvangt binnenkort een
              bevestigingsmail.
            </p>
            <Button className="w-full" onClick={() => router.push("/rentals")}>
              Bekijk mijn reserveringen
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-gray-500">Betaling voorbereiden...</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fout bij betalen</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Terug
              </Button>
              <Button onClick={handleRetry}>Opnieuw proberen</Button>
            </div>
          </div>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#0f172a",
                  colorBackground: "#ffffff",
                  colorText: "#333333",
                  colorDanger: "#ef4444",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  borderRadius: "8px",
                },
              },
              locale: getStripeLocale(currentLocale), // Use current language
            }}
          >
            <PaymentForm
              amount={amount}
              onSuccess={(paymentIntentId) => {
                // Prevent cleanup when the payment is successful
                cleanupCalled.current = true;

                if (rentalId) {
                  router.push(
                    `/rentalDetails.trailerId?rentalId=${rentalId}&payment_intent=${paymentIntentId}&redirect_status=succeeded`
                  );
                } else {
                  console.error("Payment successful but rental ID is missing");
                  handleError("Rental ID missing after successful payment");
                }
              }}
              onError={handleError}
              onBack={handleBack}
              rentalDetails={rentalDetails}
            />
          </Elements>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface PaymentFormProps {
  amount: number;
  rentalDetails: RentalDetails;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  onBack: () => void;
}

// The actual payment form
function PaymentForm({
  amount,
  rentalDetails,
  onSuccess,
  onError,
  onBack,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // When the component loads, pre-fill billing details
  useEffect(() => {
    if (!elements) return;

    elements.update({
      defaultValues: {
        billingDetails: {
          name: `${rentalDetails.firstName} ${rentalDetails.lastName}`,
          email: rentalDetails.email,
          phone: rentalDetails.phone,
        },
      },
    });
  }, [elements, rentalDetails]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPaymentError(null);

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Confirm the payment with the PaymentElement
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Update the return URL to point to our success page
          return_url: `${window.location.origin}/aanbod/${rentalDetails.trailerId}`,
          payment_method_data: {
            billing_details: {
              name: `${rentalDetails.firstName} ${rentalDetails.lastName}`,
              email: rentalDetails.email,
              phone: rentalDetails.phone,
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment confirmation error:", error);
        setPaymentError(error.message || "Payment failed");
        onError(error.message || "Payment failed");
      } else if (
        paymentIntent &&
        (paymentIntent.status === "succeeded" ||
          paymentIntent.status === "processing" ||
          paymentIntent.status === "requires_capture")
      ) {
        onSuccess(paymentIntent.id);
      } else {
        throw new Error(`Unexpected payment status: ${paymentIntent?.status}`);
      }
    } catch (err) {
      console.error("Payment error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";

      setPaymentError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Betaalgegevens</h3>
          <Badge variant="outline" className="font-normal">
            Beveiligde betaling
          </Badge>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Veilig betalen via Stripe. Je gegevens worden versleuteld verzonden.
        </p>

        <div className="p-4 border rounded-md">
          <PaymentElement
            options={{
              layout: { type: "tabs", defaultCollapsed: false },
              paymentMethodOrder: ["ideal", "card", "bancontact", "sofort"],
              defaultValues: {
                billingDetails: {
                  name: `${rentalDetails.firstName} ${rentalDetails.lastName}`,
                  email: rentalDetails.email,
                  phone: rentalDetails.phone,
                },
              },
            }}
            onChange={() => {
              if (paymentError) {
                setPaymentError(null);
              }
            }}
          />
        </div>
      </div>

      {/* Error message */}
      {paymentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Betaling mislukt</AlertTitle>
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Payment summary */}
      <div className="py-2">
        <div className="flex justify-between font-semibold">
          <span>Totaal:</span>
          <span>€{amount.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Na succesvol afronden van de betaling wordt je reservering direct
          bevestigd.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="min-w-[120px]"
        >
          {isProcessing ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verwerken...
            </span>
          ) : (
            `Betaal €${amount.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}
