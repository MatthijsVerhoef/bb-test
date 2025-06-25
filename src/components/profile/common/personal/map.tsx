"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

// Natural color style for map
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

interface UserLocationMapProps {
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  editMode: boolean;
}

function UserLocationMapClient({
  address,
  city,
  postalCode,
  country,
  editMode,
}: UserLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Format address for geocoding
  const formattedAddress = [address, city, postalCode, country]
    .filter(Boolean)
    .join(", ");

  /**
   * LOAD GOOGLE MAPS SCRIPT
   */
  useEffect(() => {
    if (typeof window === "undefined" || editMode) return;

    // Already loaded?
    if (window.google && window.google.maps) {
      setMapInitialized(true);
      setIsMapLoaded(true);
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

      // Use onload
      script.onload = () => {
        setMapInitialized(true);
        setIsMapLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load Google Maps script");
      };

      document.head.appendChild(script);
    } else {
      // Script is already in DOM, see if it's loaded
      if (window.google && window.google.maps) {
        setMapInitialized(true);
        setIsMapLoaded(true);
      }
    }
  }, [editMode]);

  // Geocode the address to get coordinates
  useEffect(() => {
    if (!mapInitialized || !formattedAddress) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: formattedAddress }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        setCoordinates({
          lat: location.lat(),
          lng: location.lng(),
        });
      } else {
        console.error("Geocoding failed:", status);
        // Default to Amsterdam if geocoding fails
        setCoordinates({ lat: 52.370216, lng: 4.895168 });
      }
    });
  }, [mapInitialized, formattedAddress]);

  // Initialize map and add marker
  useEffect(() => {
    if (!mapInitialized || !mapRef.current || !coordinates) return;

    const map = new google.maps.Map(mapRef.current, {
      center: coordinates,
      zoom: 15,
      mapTypeControl: false,
      disableDefaultUI: true,
      zoomControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: NATURAL_MAP_STYLE,
    });

    // Create a custom marker with a blue circle and white home icon
    const customMarker = new google.maps.Marker({
      position: coordinates,
      map,
      title: formattedAddress,
      icon: {
        url: `data:image/svg+xml;utf-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="#3b82f6" stroke="#2563eb" stroke-width="1"/>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house-icon lucide-house"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20),
      },
    });

    // Add subtle highlight circle around the marker
    const circle = new google.maps.Circle({
      map,
      center: coordinates,
      radius: 150, // 150m radius
      strokeColor: "#3b82f6",
      strokeOpacity: 0.3,
      strokeWeight: 1,
      fillColor: "#3b82f6",
      fillOpacity: 0.1,
    });
  }, [mapInitialized, coordinates, formattedAddress]);

  // If in edit mode or no address, don't show the map
  if (editMode || !formattedAddress) {
    return null;
  }

  return (
    <div className="mt-4">
      <div
        className="w-full h-[350px] relative rounded-lg overflow-hidden"
        ref={mapRef}
      >
        {/* Loading overlay while Google Maps script is still loading */}
        {!isMapLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
            <div className="mb-3">
              <div className="h-10 w-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Dynamic import with SSR disabled, plus placeholder
const UserLocationMap = dynamic(() => Promise.resolve(UserLocationMapClient), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[200px] flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-gray-200">
      <div className="text-center p-4">
        <div className="h-10 w-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

export default UserLocationMap;
