"use client";

import { useEffect, useState, useRef } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useTranslation } from "@/lib/i18n/client";

/**
 * Natural color style for map - light greens and neutral tones
 */
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

interface TrailerDetailMapProps {
  latitude: number;
  longitude: number;
  title: string;
  price: number;
  city: string;
  initialZoom?: number;
  image: any;
}

function TrailerDetailMapClient({
  latitude,
  longitude,
  title,
  price,
  image,
  city,
  initialZoom = 12, // Less zoomed in to hide exact location
}: TrailerDetailMapProps) {
  const { t } = useTranslation("trailer");
  const mapRef = useRef<HTMLDivElement>(null);
  const fullscreenMapRef = useRef<HTMLDivElement>(null);

  const [mapInitialized, setMapInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  const getApproximateLocation = () => {
    // Create a seed based on the coordinates to ensure consistency
    const seed = (latitude * 1000 + longitude * 1000) % 1000;

    // Generate offsets using the seed (approximately 500m-1km)
    const latOffset = (Math.sin(seed) * 0.009) % 0.009;
    const lngOffset = (Math.cos(seed) * 0.011) % 0.011;

    return {
      lat: latitude + latOffset,
      lng: longitude + lngOffset,
    };
  };

  // Get approximate location
  const approximateLocation = getApproximateLocation();

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Resize after DOM updates so the map can recenter
    setTimeout(() => {
      if (mapInstanceRef.current) {
        google.maps.event.trigger(mapInstanceRef.current, "resize");
      }
    }, 100);
  };

  /**
   * LOAD GOOGLE MAPS SCRIPT
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

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
  }, []);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Control body scroll while fullscreen
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  /**
   * Initialize the standard (non-fullscreen) map
   */
  useEffect(() => {
    if (!mapInitialized || !mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: approximateLocation,
      zoom: initialZoom,
      mapTypeControl: false,
      disableDefaultUI: true,
      zoomControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: NATURAL_MAP_STYLE,
    });

    mapInstanceRef.current = map;

    // Add marker at approximate location
    const mapMarker = new google.maps.Marker({
      position: approximateLocation,
      map,
      title: `${title} - ${city}`,
      icon: {
        // Custom SVG icon - orange circle with no border
        path: google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: "#f97316", // Orange
        fillOpacity: 0.9,
        strokeColor: "#f97316", // Same as fill color (no visible border)
        strokeWeight: 1,
      },
      label: {
        text: `€${Math.round(price)}`,
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: "13px",
      },
    });

    const outerCircle = new google.maps.Circle({
      map,
      center: approximateLocation,
      radius: 1500, // 1.5km radius
      strokeColor: "#f97316",
      strokeOpacity: 0.2,
      strokeWeight: 1,
      fillColor: "#f97316",
      fillOpacity: 0.05,
    });

    // Create an inner circle with more opacity
    const circle = new google.maps.Circle({
      map,
      center: approximateLocation,
      radius: 800, // 800m radius
      strokeColor: "#f97316",
      strokeOpacity: 0.3,
      strokeWeight: 1,
      fillColor: "#f97316",
      fillOpacity: 0.15,
    });

    circleRef.current = circle;
  }, [mapInitialized, approximateLocation, title, city, price, initialZoom]);

  /**
   * Initialize the fullscreen map
   */
  useEffect(() => {
    if (!isFullscreen || !fullscreenMapRef.current || !mapInitialized) return;

    const fullscreenMap = new google.maps.Map(fullscreenMapRef.current, {
      center: approximateLocation,
      zoom: initialZoom - 1,
      mapTypeControl: false,
      disableDefaultUI: true,
      zoomControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: NATURAL_MAP_STYLE,
    });

    // Add marker
    const mapMarker = new google.maps.Marker({
      position: approximateLocation,
      map: fullscreenMap,
      title: `${title} - ${city}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 16, // Larger in fullscreen
        fillColor: "#f97316",
        fillOpacity: 0.9,
        strokeColor: "#f97316", // Same as fill color (no visible border)
        strokeWeight: 1,
      },
      label: {
        text: `€${Math.round(price)}`,
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: "14px",
      },
    });

    // Add circle with larger radius in fullscreen - with gradient effect
    // Create a larger outer circle with less opacity
    const outerCircle = new google.maps.Circle({
      map: fullscreenMap,
      center: approximateLocation,
      radius: 2000, // 2km radius for fullscreen view
      strokeColor: "#f97316",
      strokeOpacity: 0.2,
      strokeWeight: 1,
      fillColor: "#f97316",
      fillOpacity: 0.05,
    });

    // Create an inner circle with more opacity
    const circle = new google.maps.Circle({
      map: fullscreenMap,
      center: approximateLocation,
      radius: 1000, // 1km radius
      strokeColor: "#f97316",
      strokeOpacity: 0.3,
      strokeWeight: 1,
      fillColor: "#f97316",
      fillOpacity: 0.15,
    });
  }, [
    isFullscreen,
    mapInitialized,
    approximateLocation,
    title,
    city,
    price,
    initialZoom,
  ]);

  /**
   * Render the fullscreen map via React Portal
   */
  const renderFullscreenMap = () => {
    if (typeof document === "undefined") return null;
    return createPortal(
      <div className="fixed inset-0 z-50 bg-white p-0 m-0">
        <div ref={fullscreenMapRef} className="w-full h-full" />
        <button
          onClick={toggleFullscreen}
          className="absolute z-50 top-4 right-4 bg-white p-2 rounded-md shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Exit fullscreen"
        >
          <Minimize2 size={24} className="text-gray-700" />
        </button>
      </div>,
      document.body
    );
  };

  return (
    <div className="flex flex-col pb-9 border-b">
      <div
        className="w-full h-[250px] sm:h-[400px] relative rounded-lg overflow-hidden"
        ref={mapRef}
      >
        {/* Fullscreen toggle button */}
        <button
          onClick={toggleFullscreen}
          className="absolute z-10 top-3 right-3 bg-white p-2 rounded-md shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Expand to fullscreen"
        >
          <Maximize2 size={20} className="text-gray-700" />
        </button>

        {/* Loading overlay while Google Maps script is still loading */}
        {!isMapLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
            <div className="mb-3">
              <div className="h-10 w-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-gray-500">{t("map.loadingMap")}</p>
          </div>
        )}

        {/* Approximate location notice */}
        <div className="absolute z-10 bottom-3 left-3 right-16 bg-white bg-opacity-90 px-3 py-2 text-xs text-gray-600 rounded-md shadow">
          <p className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1 text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            {t("map.approximateLocation")}
          </p>
        </div>

        {/* Fullscreen map portal */}
        {isFullscreen && renderFullscreenMap()}
      </div>
    </div>
  );
}

// Loading component that can use translation
function MapLoadingComponent() {
  const { t } = useTranslation("trailer");
  return (
    <div className="w-full h-[300px] flex items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-gray-200">
      <div className="text-center p-4">
        <div className="h-10 w-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">{t("map.loadingLocationMap")}</p>
      </div>
    </div>
  );
}

// Dynamic import with SSR disabled, plus placeholder
const TrailerDetailMap = dynamic(
  () => Promise.resolve(TrailerDetailMapClient),
  {
    ssr: false,
    loading: () => <MapLoadingComponent />,
  }
);

export default TrailerDetailMap;
