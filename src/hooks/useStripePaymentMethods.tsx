// hooks/useStripePaymentMethods.ts
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
).catch((error) => {
  console.error("Error loading Stripe:", error);
  return null;
});

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billing_details?: {
    name: string;
    email: string;
  };
  created: number;
  isDefault: boolean;
}

interface UseStripePaymentMethodsResult {
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  error: string | null;
  addPaymentMethod: () => void;
  removePaymentMethod: (paymentMethodId: string) => Promise<void>;
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  showAddPaymentMethodForm: boolean;
  setShowAddPaymentMethodForm: (show: boolean) => void;
  clientSecret: string | null;
  refreshPaymentMethods: () => void;
  currentLocale: string; // Add current language to the interface
}

// Helper function to get client locale directly from cookies/localStorage
function getClientLocale(): string {
  if (typeof window === "undefined") {
    return "en";
  }

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
}

export function useStripePaymentMethods(): UseStripePaymentMethodsResult {
  const { i18n } = useTranslation("profile");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPaymentMethodForm, setShowAddPaymentMethodForm] =
    useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Get current locale directly from cookies/localStorage
  const initialLocale = getClientLocale();
  const [currentLocale, setCurrentLocale] = useState(initialLocale);

  // Update currentLocale when i18n.language changes
  useEffect(() => {
    if (i18n?.language) {
      setCurrentLocale(i18n.language);
    }
  }, [i18n?.language]);

  // Fetch payment methods on component mount
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // Fetch client secret when showing the add payment method form
  useEffect(() => {
    if (showAddPaymentMethodForm) {
      createSetupIntent();
    }
  }, [showAddPaymentMethodForm]);

  const fetchPaymentMethods = async (forceFresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Add cache-busting parameter when we need to force a fresh fetch
      // This is important after adding a new payment method
      const url = forceFresh
        ? `/api/payments/methods?_cb=${Date.now()}`
        : "/api/payments/methods";

      // Fetch payment methods from the API
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch payment methods");
      }

      const data = await response.json();
      setPaymentMethods(data.paymentMethods);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Er is een fout opgetreden bij het ophalen van betaalmethoden"
      );
      console.error("Error fetching payment methods:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createSetupIntent = async () => {
    try {
      // Make a real API call to create a setup intent
      const response = await fetch("/api/payments/setup-intent", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create setup intent");
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Er is een fout opgetreden bij het aanmaken van een betaalmethode"
      );
      console.error("Error creating setup intent:", err);
      // Close the payment form if there's an error
      setShowAddPaymentMethodForm(false);
    }
  };

  const addPaymentMethod = () => {
    setShowAddPaymentMethodForm(true);
  };

  // Expose a method to refresh payment methods
  // forceFresh=true will bypass cache and get the latest data
  const refreshPaymentMethods = (forceFresh = true) => {
    fetchPaymentMethods(forceFresh);
  };

  const removePaymentMethod = async (paymentMethodId: string) => {
    try {
      const response = await fetch(`/api/payments/methods/${paymentMethodId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove payment method");
      }

      // Update the UI by removing the deleted payment method
      setPaymentMethods((prevMethods) =>
        prevMethods.filter((method) => method.id !== paymentMethodId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error removing payment method:", err);
    }
  };

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      const response = await fetch(`/api/payments/methods/default`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (!response.ok) {
        throw new Error("Failed to set default payment method");
      }

      // Update the UI by setting the new default payment method
      setPaymentMethods((prevMethods) =>
        prevMethods.map((method) => ({
          ...method,
          isDefault: method.id === paymentMethodId,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error setting default payment method:", err);
    }
  };

  return {
    paymentMethods,
    isLoading,
    error,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    showAddPaymentMethodForm,
    setShowAddPaymentMethodForm,
    clientSecret,
    refreshPaymentMethods,
    currentLocale, // Pass direct locale from cookies/localStorage
  };
}

// Components for Stripe integration
export interface AddPaymentMethodFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddPaymentMethodForm = ({
  clientSecret,
  onSuccess,
  onCancel,
}: AddPaymentMethodFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation("profile");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error("Stripe or Elements not loaded", { stripe, elements });
      setError(t("paymentMethod.errors.notLoaded"));
      return;
    }

    // Make sure the Payment Element is fully mounted
    const paymentElement = elements.getElement("payment");
    if (!paymentElement) {
      console.error("Payment Element not found in the DOM");
      setError(t("paymentMethod.errors.formNotLoaded"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate the payment form first
      const { error: validationError } = await elements.submit();
      if (validationError) {
        throw new Error(
          validationError.message || t("paymentMethod.errors.invalidDetails")
        );
      }

      // Short timeout to ensure the element is completely ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/profiel?success=payment_method_added`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(
          result.error.message || t("paymentMethod.errors.addFailed")
        );
      }

      // Successfully added the payment method
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("paymentMethod.errors.generalError")
      );
      console.error("Error adding payment method:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: {
            type: "accordion",
            defaultCollapsed: false,
          },
          fields: {
            billingDetails: {
              address: "auto",
            },
          },
          // More user-friendly validation messages
          business: {
            name: "Buurbak",
          },
        }}
        id="payment-element"
        className="stripe-payment-element"
      />

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          {t("paymentMethod.addDialog.cancel")}
        </Button>
        <Button type="submit" disabled={!stripe || isLoading}>
          {isLoading
            ? t("paymentMethod.addDialog.processing")
            : t("paymentMethod.addDialog.addMethod")}
        </Button>
      </div>
    </form>
  );
};

// Wrapper component with Stripe Elements provider
export const StripePaymentMethodsProvider = ({
  children,
  clientSecret,
  locale = "en",
}: {
  children: React.ReactNode;
  clientSecret: string;
  locale?: string;
}) => {
  const { t } = useTranslation("profile");

  // Map i18n language codes to Stripe locale codes
  const getStripeLocale = (langCode: string | undefined) => {
    if (!langCode) return "en";

    const localeMap: Record<string, string> = {
      nl: "nl",
      en: "en",
      de: "de",
    };
    return localeMap[langCode] || "en";
  };

  // Use explicitly passed locale
  const stripeLocale = getStripeLocale(locale);

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#0A2540",
        colorBackground: "#ffffff",
        colorText: "#1A1A1A",
        colorDanger: "#df1b41",
        fontFamily: "system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "8px",
      },
    },
    locale: stripeLocale,
    loader: "always", // Always show the loader to ensure elements are properly initialized
  };

  // Only render if stripePromise is available
  if (!stripePromise) {
    return (
      <div className="p-4 text-center">
        {t("paymentMethod.addDialog.systemLoading")}
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};
