"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronRight, Camera, Bell } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PaymentSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentSuccessDialog({
  isOpen,
  onClose,
}: PaymentSuccessDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rentalDetails, setRentalDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickupCode, setPickupCode] = useState<string | null>(null);
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationShownRef = useRef(false);

  // Extract params from either our redirect or Stripe's redirect
  const paymentIntent =
    searchParams.get("payment_intent") ||
    searchParams.get("payment_intent_client_secret")?.split("_secret_")[0];
  const redirectStatus = searchParams.get("redirect_status");
  const rentalId = searchParams.get("rentalId");

  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Show notification after a short delay when data is loaded
  useEffect(() => {
    if (rentalDetails && !notificationShownRef.current) {
      notificationTimeoutRef.current = setTimeout(() => {
        setShowNotification(true);
        notificationShownRef.current = true;

        // Auto-hide notification after 10 seconds
        notificationTimeoutRef.current = setTimeout(() => {
          setShowNotification(false);
        }, 10000);
      }, 2000);
    }

    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [rentalDetails]);

  useEffect(() => {
    // Only fetch if dialog is open
    if (!isOpen) return;

    // Reset notification state when dialog opens
    setShowNotification(false);
    notificationShownRef.current = false;

    async function fetchRentalDetails() {
      if (!rentalId && !paymentIntent) {
        setError("Geen boekingsreferentie gevonden.");
        setIsLoading(false);
        return;
      }

      try {
        // Use rentalId if available, otherwise use payment_intent
        const queryParam = rentalId
          ? `rentalId=${rentalId}`
          : `paymentIntent=${paymentIntent}`;

        const startTime = performance.now();
        const response = await fetch(`/api/rentals/details?${queryParam}`);
        const endTime = performance.now();
        console.log(`Rental details fetch took ${endTime - startTime}ms`);

        if (!response.ok) {
          throw new Error("Kon geen boekingsgegevens ophalen.");
        }

        const data = await response.json();
        setRentalDetails(data);

        // Generate a pickup code (in production this would come from the backend)
        const mockPickupCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        setPickupCode(mockPickupCode);
      } catch (err) {
        console.error("Error fetching rental details:", err);
        setError("Er is een fout opgetreden bij het ophalen van je boeking.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRentalDetails();
  }, [isOpen, rentalId, paymentIntent]);

  useEffect(() => {
    const updateRentalStatus = async () => {
      const rentalId = searchParams.get("rentalId");
      const paymentIntent = searchParams.get("payment_intent");

      if (rentalId && paymentIntent) {
        try {
          const response = await fetch("/api/rentals/confirm-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              rentalId,
              paymentIntentId: paymentIntent,
            }),
          });

          if (!response.ok) {
            console.error("Failed to update rental status");
          }
        } catch (error) {
          console.error("Error updating rental status:", error);
        }
      }
    };

    updateRentalStatus();
  }, [searchParams]);

  // Generate QR code value with rental ID and pickup code
  const getQrValue = () => {
    if (!rentalDetails?.id) return "";
    return pickupCode
      ? `https://trailerrental.com/rental/verify/${rentalDetails.id}?code=${pickupCode}`
      : `https://trailerrental.com/rental/verify/${rentalDetails.id}`;
  };

  // Handle copying of verification URL
  const handleCopyLink = () => {
    const qrValue = getQrValue();
    navigator.clipboard
      .writeText(qrValue)
      .then(() => toast.success("Link gekopieerd"))
      .catch(() => toast.error("Kon link niet kopiëren"));
  };

  // Handle download of QR code as PNG
  const handleDownload = () => {
    if (!rentalDetails?.id) return;

    setDownloadingQR(true);

    try {
      // Get SVG element and convert to canvas
      const svg = document.getElementById("rental-qr-code");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!svg || !ctx) {
        throw new Error("Could not create canvas");
      }

      // Set canvas size
      canvas.width = 200;
      canvas.height = 200;

      // Create image from SVG
      const image = new Image();
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      image.onload = () => {
        // Fill white background and draw image
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Create download link
        const link = document.createElement("a");
        link.download = `rental-qr-${rentalDetails.id}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        // Clean up
        URL.revokeObjectURL(url);
        setDownloadingQR(false);
        setShowNotification(false); // Hide notification after successful download
        toast.success("QR code gedownload");
      };

      image.src = url;
    } catch (error) {
      console.error("Error downloading QR code:", error);
      setDownloadingQR(false);
      toast.error("Kon QR code niet downloaden");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6 overflow-hidden rounded-xl">
        <DialogHeader className="">
          <DialogTitle
            className="font-semibold text-lg"
            onClick={() => console.log(rentalDetails)}
          >
            Reservering successvol
          </DialogTitle>
          <DialogDescription className="-mt-1">
            Bedankt voor het reserveren van deze aanhanger, een bevestigingsmail
            wordt verstuurd.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-0 relative">
          {/* QR Code Notification */}
          {showNotification && (
            <div className="absolute -top-20 left-0 right-0 z-10 transform -translate-y-1">
              <Alert variant="info" className="bg-white shadow-xl p-4">
                <Bell className="h-4 w-4 text-primary" />
                <AlertTitle className="text-dark -mt-0.5 text-sm">
                  Bewaar de QR code
                </AlertTitle>
                <AlertDescription className="text-dark text-xs">
                  Je hebt deze QR code nodig bij het ophalen van de aanhanger.
                  Maak een screenshot of download hem.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center text-amber-600 py-4">
              <p className="font-medium">{error}</p>
              <p className="text-sm text-gray-600 mt-2">
                Als je zeker weet dat je betaling geslaagd is, controleer dan je
                reserveringen in je account.
              </p>
            </div>
          ) : rentalDetails ? (
            <div className="space-y-4">
              {/* Trailer details */}
              <div className="bg-[#f6f8f9] p-2.5 rounded-xl">
                <div className="text-sm">
                  <div className="flex items-center">
                    {rentalDetails.trailer.images &&
                      rentalDetails.trailer.images[0] && (
                        <img
                          alt={rentalDetails.trailer.title ?? "Aanhanger"}
                          src={rentalDetails.trailer.images[0].url}
                          className="w-18 h-16 rounded-lg object-cover object-center"
                        />
                      )}
                    <div className="ms-3">
                      <p className="font-medium">
                        {rentalDetails.trailer?.title || "Aanhangwagen"}
                      </p>
                      <p className="text-xs mt-1 font-medium">
                        {rentalDetails.startDate && rentalDetails.endDate ? (
                          <>
                            {format(
                              new Date(rentalDetails.startDate),
                              "d MMMM yyyy",
                              { locale: nl }
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(rentalDetails.endDate),
                              "d MMMM yyyy",
                              { locale: nl }
                            )}
                          </>
                        ) : (
                          "Datum niet beschikbaar"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-[#f6f8f9] p-3 rounded-xl">
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg border">
                    <QRCode
                      id="rental-qr-code"
                      value={getQrValue()}
                      size={150}
                      level="H"
                      className="mx-auto"
                    />
                  </div>

                  {pickupCode && (
                    <div className="mt-2 py-2 px-3 bg-white rounded-lg border text-center w-full">
                      <p className="text-xs text-gray-500">Ophaalcode:</p>
                      <p className="text-base font-mono font-semibold tracking-wider">
                        {pickupCode}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2 mt-3 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 shadow-none h-8 text-xs"
                      onClick={handleCopyLink}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Kopiëren
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs shadow-none"
                      onClick={handleDownload}
                      disabled={downloadingQR}
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Downloaden
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Geen details beschikbaar
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-0">
          <Button className="w-full" onClick={() => router.push("/rentals")}>
            Bekijk mijn reserveringen
            <ChevronRight className="ml-0 h-4 w-4" />
          </Button>
        </DialogFooter>
        <Button className="w-full" variant="outline" onClick={onClose}>
          Sluiten
        </Button>
      </DialogContent>
    </Dialog>
  );
}
