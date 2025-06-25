import { useEffect, useRef, useState, useCallback } from "react";
import { Truck, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/client";
import { getTrailerTypeDetails } from "@/lib/utils/trailer-type-utils";

interface DeliveryOptionsProps {
  needsDelivery: boolean;
  deliveryAddress: string;
  onDeliveryChange: (needsDelivery: boolean) => void;
  onAddressChange: (address: string) => void;
  deliveryFee?: number | null;
  maxDeliveryDistance?: number | null;
  validationError?: string;
  available: boolean;
  isLoading: boolean;
  trailerType: string;
  // New props for distance calculation
  trailerLocation?: {
    lat: number;
    lng: number;
  };
}

export default function DeliveryOptions({
  needsDelivery,
  deliveryAddress,
  onDeliveryChange,
  onAddressChange,
  deliveryFee,
  maxDeliveryDistance,
  validationError,
  available,
  isLoading,
  trailerType,
  trailerLocation,
}: DeliveryOptionsProps) {
  const { t } = useTranslation("trailer");
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(
    null
  );
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const distanceServiceRef = useRef<google.maps.DistanceMatrixService | null>(
    null
  );

  // Add autocomplete custom styles
  useEffect(() => {
    // Create a style element for the autocomplete dropdown
    if (!document.getElementById("google-autocomplete-styles")) {
      const styleElement = document.createElement("style");
      styleElement.id = "google-autocomplete-styles";

      // Define custom styles for Google Places autocomplete
      styleElement.innerHTML = `
        .pac-container {
          border-radius: 12px;
          margin-top: 4px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          font-family: inherit;
          overflow: hidden;
        }
        .pac-item {
          padding: 10px 12px;
          cursor: pointer;
          font-size: 14px;
          border-top: 1px solid #f3f4f6;
        }
        .pac-item:first-child {
          border-top: none;
        }
        .pac-item:hover {
          background-color: #f9fafb;
        }
        .pac-item-selected, .pac-item-selected:hover {
          background-color: #f97316;
          color: white;
        }
        .pac-icon {
          display: none;
        }
        .pac-item-query {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }
        .pac-item-selected .pac-item-query, .pac-item-selected:hover .pac-item-query {
          color: white;
        }
        .pac-matched {
          color: #f97316;
          font-weight: 600;
        }
        .pac-item-selected .pac-matched, .pac-item-selected:hover .pac-matched {
          color: white;
        }
      `;

      document.head.appendChild(styleElement);
    }
  }, []);

  // Load Google Maps script when delivery is needed
  useEffect(() => {
    if (!needsDelivery || typeof window === "undefined") return;

    // Check if Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setMapsLoaded(true);
      return;
    }

    const scriptId = "google-maps-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setMapsLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load Google Maps script");
      };

      document.head.appendChild(script);
    } else {
      // Script exists, check if loaded
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setMapsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
    }
  }, [needsDelivery]);

  // Initialize autocomplete
  useEffect(() => {
    if (!mapsLoaded || !needsDelivery || !addressInputRef.current) return;

    // Initialize services
    if (!geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
    if (!distanceServiceRef.current) {
      distanceServiceRef.current = new google.maps.DistanceMatrixService();
    }

    // Initialize autocomplete
    if (!autocompleteRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          componentRestrictions: { country: "nl" },
          fields: ["address_components", "formatted_address", "geometry"],
          types: ["address"],
        }
      );

      // Add place_changed listener
      autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
    }

    // Set initial value if exists
    if (deliveryAddress && addressInputRef.current) {
      addressInputRef.current.value = deliveryAddress;
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [mapsLoaded, needsDelivery, deliveryAddress]);

  // Calculate distance between two points
  const calculateDistance = useCallback(
    async (deliveryLat: number, deliveryLng: number) => {
      if (!trailerLocation || !distanceServiceRef.current) return;

      const origin = new google.maps.LatLng(
        trailerLocation.lat,
        trailerLocation.lng
      );
      const destination = new google.maps.LatLng(deliveryLat, deliveryLng);

      try {
        const response = await new Promise<google.maps.DistanceMatrixResponse>(
          (resolve, reject) => {
            distanceServiceRef.current!.getDistanceMatrix(
              {
                origins: [origin],
                destinations: [destination],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false,
              },
              (response, status) => {
                if (
                  status === google.maps.DistanceMatrixStatus.OK &&
                  response
                ) {
                  resolve(response);
                } else {
                  reject(new Error(`Distance calculation failed: ${status}`));
                }
              }
            );
          }
        );

        if (response.rows[0] && response.rows[0].elements[0]) {
          const element = response.rows[0].elements[0];

          if (element.status === "OK" && element.distance) {
            const distanceInKm = element.distance.value / 1000;
            setCalculatedDistance(distanceInKm);

            // Check if within delivery range
            if (maxDeliveryDistance && distanceInKm > maxDeliveryDistance) {
              setDistanceError(
                t("booking.delivery.outsideDeliveryRange", {
                  distance: distanceInKm.toFixed(1),
                  maxDistance: maxDeliveryDistance,
                })
              );
            } else {
              setDistanceError(null);
            }
          } else {
            setDistanceError(t("booking.delivery.cannotCalculateDistance"));
          }
        }
      } catch (error) {
        console.error("Error calculating distance:", error);
        setDistanceError(t("booking.delivery.distanceCalculationError"));
      }
    },
    [trailerLocation, maxDeliveryDistance, t]
  );

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback(() => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();

    if (!place.geometry || !place.geometry.location) {
      console.error("No details available for selected place");
      return;
    }

    // Get the formatted address
    const formattedAddress = place.formatted_address || "";

    // Update the address
    onAddressChange(formattedAddress);

    // Calculate distance if trailer location is available
    if (trailerLocation && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      calculateDistance(lat, lng);
    }
  }, [onAddressChange, trailerLocation, calculateDistance]);

  // Handle manual input changes
  const handleManualAddressChange = (value: string) => {
    onAddressChange(value);
    // Clear distance calculations when manually typing
    setCalculatedDistance(null);
    setDistanceError(null);
  };

  // Handle delivery checkbox change
  const handleDeliveryChange = (checked: boolean) => {
    onDeliveryChange(checked);
    if (!checked) {
      // Clear distance error when unchecking delivery
      setDistanceError(null);
      setCalculatedDistance(null);
    }
  };

  return (
    <div className="space-y-3 pt-1 my-6">
      <div className="flex items-start space-x-2">
        <Checkbox
          id="delivery"
          checked={needsDelivery}
          onCheckedChange={handleDeliveryChange}
          disabled={!available || isLoading}
          className="bg-white mt-0.5 shadow-none"
        />
        <div className="ms-1">
          <Label
            htmlFor="delivery"
            className="cursor-pointer flex items-center gap-2 font-normal text-[13px]"
          >
            {t("booking.delivery.homeDelivery")}
            {deliveryFee ? (
              <span className="text-sm text-gray-600 font-normal">
                {t("booking.delivery.fee", { fee: deliveryFee.toFixed(2) })}
              </span>
            ) : null}
          </Label>
          {maxDeliveryDistance && (
            <p className="text-xs text-gray-500 mt-1">
              {t("booking.delivery.availableWithin", {
                distance: maxDeliveryDistance,
              })}
            </p>
          )}
        </div>
      </div>

      {needsDelivery && (
        <div className="space-y-2">
          <div className="relative">
            <Input
              ref={addressInputRef}
              id="delivery-address"
              placeholder={t("booking.delivery.addressPlaceholder")}
              value={deliveryAddress}
              onChange={(e) => handleManualAddressChange(e.target.value)}
              disabled={!available || isLoading}
              className={`mt-2 bg-white h-10 rounded-lg shadow-none ${
                validationError || distanceError ? "border-red-500" : ""
              }`}
              autoComplete="off"
            />
            {!mapsLoaded && needsDelivery && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Distance information */}
          {calculatedDistance !== null && !distanceError && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Truck className="h-3 w-3" />
              {t("booking.delivery.distanceFromTrailer", {
                distance: calculatedDistance.toFixed(1),
              })}
            </p>
          )}

          {/* Validation errors */}
          {validationError && (
            <p className="text-xs text-red-500">{validationError}</p>
          )}

          {/* Distance error */}
          {distanceError && (
            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600">{distanceError}</p>
            </div>
          )}

          {/* Loading message */}
          {!mapsLoaded && (
            <p className="text-xs text-gray-500 italic">
              {t("booking.delivery.loadingAutocomplete")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
