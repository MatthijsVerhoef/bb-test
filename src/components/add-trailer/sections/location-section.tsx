"use client";

import { MapPin, MapPinIcon, Navigation } from "lucide-react";
import { FormSection } from "../components/form-section";
import { SectionId, TrailerFormData } from "../types";
import { handleCompleteSection } from "../utils/form-utils";
import { useTranslation } from "@/lib/i18n/client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// Google Map Style - matches existing maps
const NATURAL_MAP_STYLE = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f5f5f0" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#555555" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f0" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c9c9c9" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry.fill",
    stylers: [{ color: "#DFF1C8" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [{ color: "#F9F4E2" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#d8e5c8" }],
  },
  {
    featureType: "road",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway",
    stylers: [{ color: "#f7f3d8" }],
  },
  {
    featureType: "road.local",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "transit.line",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#D3F0FC" }],
  },
];

interface LocationSectionProps {
  formData: TrailerFormData;
  isExpanded: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  updateFormData: <T>(field: keyof TrailerFormData, value: T) => void;
  setCompletedSections: (callback: (prev: any) => any) => void;
  setExpandedSections: (callback: (prev: any) => any) => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  formData,
  isExpanded,
  isCompleted,
  onToggle,
  updateFormData,
  setCompletedSections,
  setExpandedSections,
}) => {
  const { t } = useTranslation("addTrailer");
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Get summary text based on location
  const getSummary = () => {
    if (!formData.city || !formData.postalCode) return undefined;
    return `${formData.city}, ${formData.postalCode}`;
  };

  // Check if location is selected
  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      setLocationSelected(true);
    }
  }, [formData.latitude, formData.longitude]);

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

  // Load Google Maps script
  useEffect(() => {
    // Only load maps when section is expanded AND maps aren't loaded yet
    if (!isExpanded || typeof window === "undefined") return;

    // Check if Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setMapsLoaded(true);
      return;
    }

    const scriptId = "google-maps-script";
    if (!document.getElementById(scriptId)) {
      // Create script
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
    }
  }, [isExpanded]);

  // Initialize map and autocomplete
  useEffect(() => {
    if (!mapsLoaded || !isExpanded) return;

    // Initialize map if it's not already initialized
    if (!isMapInitialized && mapRef.current) {
      // Create geocoder
      geocoderRef.current = new google.maps.Geocoder();

      // Initialize map
      const mapOptions = {
        center:
          formData.latitude && formData.longitude
            ? { lat: formData.latitude, lng: formData.longitude }
            : { lat: 52.1326, lng: 5.2913 }, // Netherlands center
        zoom: formData.latitude && formData.longitude ? 15 : 7,
        mapTypeControl: false,
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        styles: NATURAL_MAP_STYLE,
      };

      const map = new google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      // Create marker if coordinates exist
      if (formData.latitude && formData.longitude) {
        markerRef.current = new google.maps.Marker({
          position: { lat: formData.latitude, lng: formData.longitude },
          map,
          draggable: true,
          animation: google.maps.Animation.DROP,
          title: formData.address || t('sections.location.trailerLocation'),
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#f97316", // Primary orange color
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: "#ffffff",
            scale: 10,
          },
        });

        // Add listener for drag events
        google.maps.event.addListener(
          markerRef.current,
          "dragend",
          function () {
            const position = markerRef.current?.getPosition();
            if (position) {
              updateFormData("latitude", position.lat());
              updateFormData("longitude", position.lng());
              reverseGeocode(position.lat(), position.lng());
              setLocationSelected(true);
            }
          }
        );

        // Add approximate circle for visual consistency with rest of app
        new google.maps.Circle({
          strokeColor: "#f97316",
          strokeOpacity: 0.3,
          strokeWeight: 1,
          fillColor: "#f97316",
          fillOpacity: 0.1,
          map,
          center: { lat: formData.latitude, lng: formData.longitude },
          radius: 50, // Radius in meters
        });
      }

      // Add click listener to map
      google.maps.event.addListener(map, "click", function (event) {
        const location = event.latLng;

        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setPosition(location);
        } else {
          markerRef.current = new google.maps.Marker({
            position: location,
            map,
            draggable: true,
            animation: google.maps.Animation.DROP,
            title: t('sections.location.trailerLocation'),
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#f97316", // Primary orange color
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: "#ffffff",
              scale: 10,
            },
          });

          // Add listener for newly created marker
          google.maps.event.addListener(
            markerRef.current,
            "dragend",
            function () {
              const position = markerRef.current?.getPosition();
              if (position) {
                updateFormData("latitude", position.lat());
                updateFormData("longitude", position.lng());
                reverseGeocode(position.lat(), position.lng());
                setLocationSelected(true);
              }
            }
          );

          // Add approximate circle for visual consistency with rest of app
          new google.maps.Circle({
            strokeColor: "#f97316",
            strokeOpacity: 0.3,
            strokeWeight: 1,
            fillColor: "#f97316",
            fillOpacity: 0.1,
            map,
            center: location,
            radius: 50, // Radius in meters
          });
        }

        // Update form data
        updateFormData("latitude", location.lat());
        updateFormData("longitude", location.lng());
        reverseGeocode(location.lat(), location.lng());
        setLocationSelected(true);
      });

      // Initialize autocomplete
      if (searchInputRef.current) {
        autocompleteRef.current = new google.maps.places.Autocomplete(
          searchInputRef.current,
          {
            componentRestrictions: { country: "nl" },
            fields: [
              "address_components",
              "formatted_address",
              "geometry",
              "name",
            ],
            types: ["address"],
          }
        );

        // Add place_changed listener
        autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
      }

      setIsMapInitialized(true);
    }
  }, [mapsLoaded, isExpanded, formData.latitude, formData.longitude]);

  // Handle place selection from autocomplete
  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();

    if (!place.geometry || !place.geometry.location) {
      console.error("No details available for input: " + place.name);
      return;
    }

    // Get latitude and longitude
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    // Update map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(place.geometry.location);
      mapInstanceRef.current.setZoom(15);

      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setPosition(place.geometry.location);
      } else {
        // Create marker with primary color icon to match app style
        markerRef.current = new google.maps.Marker({
          position: place.geometry.location,
          map: mapInstanceRef.current,
          draggable: true,
          animation: google.maps.Animation.DROP,
          title: place.formatted_address || t('sections.location.trailerLocation'),
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#f97316", // Primary orange color
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: "#ffffff",
            scale: 10,
          },
        });

        // Add listener for newly created marker
        google.maps.event.addListener(
          markerRef.current,
          "dragend",
          function () {
            const position = markerRef.current?.getPosition();
            if (position) {
              updateFormData("latitude", position.lat());
              updateFormData("longitude", position.lng());
              reverseGeocode(position.lat(), position.lng());
            }
          }
        );
      }
    }

    // Extract address components
    let streetNumber = "";
    let route = "";
    let city = "";
    let postalCode = "";
    let country = "Netherlands";

    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;

        // More complete address component extraction
        if (types.includes("street_number")) {
          streetNumber = component.long_name;
        } else if (types.includes("route")) {
          route = component.long_name;
        } else if (types.includes("locality")) {
          city = component.long_name;
        } else if (types.includes("postal_code")) {
          postalCode = component.long_name;
        } else if (types.includes("postal_town") && !city) {
          // Use postal_town as fallback if locality is not found
          city = component.long_name;
        } else if (types.includes("administrative_area_level_1") && !city) {
          // Use admin level 1 as fallback for city
          city = component.long_name;
        } else if (types.includes("country")) {
          country = component.long_name;
        }
      }
    }

    // Format address correctly with street and number
    const formattedAddress =
      route && streetNumber
        ? `${route} ${streetNumber}`
        : route || place.formatted_address || "";

    // Update form data - convert to searchable case
    updateFormData("address", formattedAddress);
    updateFormData("city", city);
    updateFormData("postalCode", postalCode);
    updateFormData("latitude", lat);
    updateFormData("longitude", lng);
    setLocationSelected(true);

    // Clear the search input to show it worked and allow new searches
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          // Extract address components
          let streetNumber = "";
          let route = "";
          let city = "";
          let postalCode = "";

          if (results[0].address_components) {
            for (const component of results[0].address_components) {
              const types = component.types;

              // More thorough address component parsing
              if (types.includes("street_number")) {
                streetNumber = component.long_name;
              } else if (types.includes("route")) {
                route = component.long_name;
              } else if (types.includes("locality")) {
                city = component.long_name;
              } else if (types.includes("postal_code")) {
                postalCode = component.long_name;
              } else if (types.includes("postal_town") && !city) {
                // Fallback if locality isn't found
                city = component.long_name;
              } else if (
                types.includes("administrative_area_level_1") &&
                !city
              ) {
                // Second fallback for city
                city = component.long_name;
              }
            }
          }

          // Format address correctly
          const formattedAddress =
            route && streetNumber
              ? `${route} ${streetNumber}`
              : route || results[0].formatted_address?.split(",")[0] || "";

          // Update form data with parsed components
          updateFormData("address", formattedAddress);
          updateFormData("city", city);
          updateFormData("postalCode", postalCode);
        } else {
          console.error("Geocoder failed due to: " + status);
        }
      }
    );
  };

  // Use browser geolocation
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('sections.location.geolocationNotSupported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Update map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
          mapInstanceRef.current.setZoom(15);

          // Update or create marker
          if (markerRef.current) {
            markerRef.current.setPosition({ lat: latitude, lng: longitude });
          } else {
            markerRef.current = new google.maps.Marker({
              position: { lat: latitude, lng: longitude },
              map: mapInstanceRef.current,
              draggable: true,
              animation: google.maps.Animation.DROP,
              title: t('sections.location.currentLocationTitle'),
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: "#f97316", // Primary orange color
                fillOpacity: 1,
                strokeWeight: 1,
                strokeColor: "#ffffff",
                scale: 10,
              },
            });

            // Add listener for newly created marker
            google.maps.event.addListener(
              markerRef.current,
              "dragend",
              function () {
                const position = markerRef.current?.getPosition();
                if (position) {
                  updateFormData("latitude", position.lat());
                  updateFormData("longitude", position.lng());
                  reverseGeocode(position.lat(), position.lng());
                }
              }
            );

            // Add approximate circle
            new google.maps.Circle({
              strokeColor: "#f97316",
              strokeOpacity: 0.3,
              strokeWeight: 1,
              fillColor: "#f97316",
              fillOpacity: 0.1,
              map: mapInstanceRef.current,
              center: { lat: latitude, lng: longitude },
              radius: 50, // Radius in meters
            });
          }
        }

        // Update form data
        updateFormData("latitude", latitude);
        updateFormData("longitude", longitude);
        reverseGeocode(latitude, longitude);
        setLocationSelected(true);
      },
      (error) => {
        console.error("Error getting current location:", error);
        alert(t('sections.location.geolocationError'));
      }
    );
  };

  // Reset location selection
  const resetLocation = () => {
    updateFormData("latitude", undefined);
    updateFormData("longitude", undefined);
    updateFormData("address", "");
    updateFormData("city", "");
    updateFormData("postalCode", "");
    setLocationSelected(false);

    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;

      // Reset map to Netherlands center
      mapInstanceRef.current.setCenter({ lat: 52.1326, lng: 5.2913 });
      mapInstanceRef.current.setZoom(7);
    }
  };

  return (
    <FormSection
      id={SectionId.LOCATION}
      title={t("sections.location.title")}
      icon={<MapPin size={18} />}
      isExpanded={isExpanded}
      isCompleted={isCompleted}
      summary={getSummary()}
      onToggle={onToggle}
    >
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          {t("sections.location.description")}
        </p>
      </div>

      <div className="space-y-4 bg-[#f6f8f9] rounded-xl p-4">
        {/* Step 1: Select location */}
        <div className="bg-white p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-2 flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            {locationSelected ? t('sections.location.locationSelected') : t('sections.location.searchYourLocation')}
          </h3>

          {!locationSelected ? (
            <>
              <p className="text-xs text-gray-600 mb-3">
                {t('sections.location.searchInstruction')}
              </p>
              <div className="relative flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t("sections.location.searchPlaceholder")}
                  className="w-full outline-0 p-3 sm:pr-24 border text-sm rounded-lg"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="hidden sm:flex absolute right-[7px] text-white bg-[#222222] border-none hover:bg-black/80 hover:text-white top-[7px] text-xs"
                  onClick={useCurrentLocation}
                >
                  <Navigation className="size-2 min-h-3 min-w-3" />
                  {t('sections.location.currentLocation')}
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-white bg-[#222222] sm:hidden border-none hover:bg-black/80 hover:text-white mt-2 text-xs"
                onClick={useCurrentLocation}
              >
                <Navigation className="size-2 min-h-3 min-w-3" />
                {t('sections.location.currentLocation')}
              </Button>
            </>
          ) : (
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm">
                  <span className="font-medium">{formData.address}</span>
                  {formData.city && formData.postalCode && (
                    <span className="text-xs text-gray-500 ml-1">
                      {formData.postalCode}, {formData.city}
                    </span>
                  )}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs hidden sm:flex border-primary text-primary hover:bg-primary/10"
                  onClick={resetLocation}
                >
                  {t('sections.location.otherLocation')}
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                {t('sections.location.adjustAddressNote')}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-xs flex sm:hidden mt-3 border-primary text-primary hover:bg-primary/10"
                onClick={resetLocation}
              >
                {t('sections.location.otherLocation')}
              </Button>
            </div>
          )}
        </div>

        {/* Map (always visible) */}
        <div className="w-full h-[300px] relative rounded-lg overflow-hidden">
          <div ref={mapRef} className="w-full h-full"></div>

          {/* Loading overlay */}
          {!mapsLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
              <div className="mb-3">
                <div className="h-10 w-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
              </div>
              <p className="text-sm text-gray-500">{t('sections.location.mapLoading')}</p>
            </div>
          )}
        </div>

        {/* Step 2: Address details (visible only after location selection) */}
        {locationSelected && (
          <div className="bg-white pt-4 px-4 pb-4 rounded-lg">
            <h3 className="text-sm font-semibold mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
              {t('sections.location.addressDetails')}
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              {t('sections.location.addressDetailsNote')}
            </p>

            {/* Address field */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                {t("sections.location.address")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder={t("sections.location.addressPlaceholder")}
                className="w-full p-3 outline-0 text-sm border border-gray-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("sections.location.postalCode")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => updateFormData("postalCode", e.target.value)}
                  placeholder={t("sections.location.postalCodePlaceholder")}
                  className="w-full p-3 outline-0 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("sections.location.city")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                  placeholder={t("sections.location.cityPlaceholder")}
                  className="w-full p-3 outline-0 text-sm border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4 bg-orange-50 p-3 rounded-lg border border-primary/20">
          {t("sections.location.privacy")}
        </p>

        <button
          type="button"
          onClick={() =>
            handleCompleteSection(
              SectionId.LOCATION,
              formData,
              setCompletedSections,
              setExpandedSections
            )
          }
          disabled={
            !formData.address ||
            !formData.city ||
            !formData.postalCode ||
            formData.latitude === undefined ||
            formData.longitude === undefined
          }
          className={`text-sm w-full px-4 py-2 rounded-lg transition-colors ${
            formData.address &&
            formData.city &&
            formData.postalCode &&
            formData.latitude !== undefined &&
            formData.longitude !== undefined
              ? "bg-primary text-white hover:bg-primary/80"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {t("common.saveAndContinue")}
        </button>
      </div>
    </FormSection>
  );
};
