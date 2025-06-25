"use client";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import PaymentSuccessDialog from "../payment/payment-success";

// Define the availability data type
export interface AvailabilityData {
  rentals: any[];
  availabilityExceptions: any[];
  weeklyAvailability: any[];
}

// Create the context
interface TrailerDataContextType {
  availabilityData: AvailabilityData | null;
  trailerId: string;
}

const TrailerDataContext = createContext<TrailerDataContextType>({
  availabilityData: null,
  trailerId: "",
});

// Export a hook to access the data
export const useTrailerData = () => useContext(TrailerDataContext);

// Props type for the wrapper
interface TrailerDetailClientWrapperProps {
  children: ReactNode;
  trailerId: string;
  availabilityData?: AvailabilityData;
}

export default function TrailerDetailClientWrapper({
  children,
  trailerId,
  availabilityData,
}: TrailerDetailClientWrapperProps) {
  const searchParams = useSearchParams();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Check for payment success parameters in URL
  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent");
    const redirectStatus = searchParams.get("redirect_status");

    // If URL has payment success parameters, show the success dialog
    if (paymentIntent && redirectStatus === "succeeded") {
      setShowSuccessDialog(true);
    }
  }, [searchParams]);

  // Prepare context value with server-provided data
  const contextValue = {
    availabilityData,
    trailerId,
  };

  return (
    <TrailerDataContext.Provider value={contextValue}>
      {children}

      {/* Payment Success Dialog */}
      <PaymentSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
      />
    </TrailerDataContext.Provider>
  );
}
