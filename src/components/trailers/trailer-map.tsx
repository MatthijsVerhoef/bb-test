"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Minimize2 } from "lucide-react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";

// Declare google maps types
declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

// Natural color style
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

interface MapMarker {
  id: string;
  title: string;
  latitude: number | null;
  longitude: number | null;
  price: number;
  image?: string;
  rating?: number;
  location?: string;
}

interface TrailerMapProps {
  markers: MapMarker[];
  zoom?: number;
  view: string;
}

// Global state to track script loading
let isScriptLoading = false;
let isScriptLoaded = false;
const loadCallbacks: (() => void)[] = [];

function TrailerMapComponent({ markers, zoom = 10, view }: TrailerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isReady, setIsReady] = useState(false);
  const initAttempted = useRef(false);

  // Filter valid markers
  const validMarkers = markers.filter((m) => m.latitude && m.longitude);

  // Initialize map when ready
  const initializeMap = useCallback(() => {
    if (
      !mapRef.current ||
      mapInstanceRef.current ||
      !window.google?.maps?.Map
    ) {
      return;
    }

    try {
      const mapOptions = {
        center: { lat: 52.3676, lng: 4.9041 }, // Netherlands center
        zoom: zoom,
        styles: NATURAL_MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: "greedy",
      };

      mapInstanceRef.current = new window.google.maps.Map(
        mapRef.current,
        mapOptions
      );

      // Add click listener to close info windows
      mapInstanceRef.current.addListener("click", () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }
      });

      // Update markers
      updateMarkers();
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }
  }, [zoom]);

  // Update markers on the map
  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Close existing info window
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    if (validMarkers.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();

    validMarkers.forEach((markerData) => {
      const position = {
        lat: markerData.latitude!,
        lng: markerData.longitude!,
      };
      bounds.extend(position);

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current!,
        title: markerData.title,
        label: {
          text: `€${Math.round(markerData.price)}`,
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "bold",
        },
        icon: {
          path: "M 0,-16 A 16,16 0 1,1 0,16 A 16,16 0 1,1 0,-16 Z",
          fillColor: "#f97316",
          fillOpacity: 1,
          strokeColor: "#ea580c",
          strokeWeight: 2,
          scale: 0.9,
          anchor: new window.google.maps.Point(0, 0),
          labelOrigin: new window.google.maps.Point(0, 0),
        },
      });

      marker.addListener("click", () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
        }

        const content = `
          <div style="padding: 16px; min-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">
              ${markerData.title}
            </h3>
            <p style="margin: 0 0 12px 0; font-size: 16px; color: #374151; font-weight: 500;">
              €${markerData.price}/dag
            </p>
            ${
              markerData.location
                ? `
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: text-bottom; margin-right: 4px;">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                ${markerData.location}
              </p>
            `
                : ""
            }
            <a href="/aanbod/${markerData.id}" style="
              display: inline-block;
              background: #f97316;
              color: white;
              padding: 8px 16px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 500;
              font-size: 14px;
              transition: background 0.2s;
            " onmouseover="this.style.background='#ea580c'" onmouseout="this.style.background='#f97316'">
              Bekijk details →
            </a>
          </div>
        `;

        infoWindowRef.current = new window.google.maps.InfoWindow({
          content,
          pixelOffset: new window.google.maps.Size(0, -10),
        });

        infoWindowRef.current.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (validMarkers.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });
    }
  }, [validMarkers]);

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      // If already loaded, just mark as ready
      if (isScriptLoaded && window.google?.maps?.Map) {
        setIsReady(true);
        return;
      }

      // If currently loading, add to callbacks
      if (isScriptLoading) {
        loadCallbacks.push(() => setIsReady(true));
        return;
      }

      // Check if script exists
      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        // Script exists, wait for it to load
        if (window.google?.maps?.Map) {
          isScriptLoaded = true;
          setIsReady(true);
        } else {
          // Wait for existing script to load
          isScriptLoading = true;
          loadCallbacks.push(() => setIsReady(true));

          const checkInterval = setInterval(() => {
            if (window.google?.maps?.Map) {
              clearInterval(checkInterval);
              isScriptLoaded = true;
              isScriptLoading = false;
              loadCallbacks.forEach((cb) => cb());
              loadCallbacks.length = 0;
            }
          }, 100);
        }
        return;
      }

      // Load new script
      isScriptLoading = true;
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        isScriptLoaded = true;
        isScriptLoading = false;
        loadCallbacks.forEach((cb) => cb());
        loadCallbacks.length = 0;
      };

      script.onerror = () => {
        console.error("Failed to load Google Maps script");
        isScriptLoading = false;
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  // Initialize map when ready
  useEffect(() => {
    if (isReady && !initAttempted.current) {
      initAttempted.current = true;
      initializeMap();
    }
  }, [isReady, initializeMap]);

  // Update markers when they change
  useEffect(() => {
    if (isReady && mapInstanceRef.current) {
      updateMarkers();
    }
  }, [validMarkers, isReady, updateMarkers]);

  return (
    <div
      className={`w-full relative rounded-lg overflow-hidden transition-all duration-300 ${
        view === "map" ? "h-screen" : "h-0 md:h-[300px]"
      }`}
    >
      <div ref={mapRef} className="w-full h-full">
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="h-8 w-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

// Export with dynamic import to prevent SSR issues
const TrailerMap = dynamic(() => Promise.resolve(TrailerMapComponent), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="h-8 w-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});

export default TrailerMap;
