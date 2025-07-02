"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

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

let isScriptLoading = false;
let isScriptLoaded = false;
const loadCallbacks: (() => void)[] = [];

function TrailerMapComponent({ markers, zoom = 10, view }: TrailerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const updateDebounceRef = useRef<NodeJS.Timeout>();

  const validMarkers = useMemo(
    () => markers.filter((m) => m.latitude && m.longitude),
    [markers]
  );

  const initializeMap = useCallback(() => {
    if (
      !mapContainerRef.current ||
      !mapDivRef.current ||
      mapInstanceRef.current ||
      !window.google?.maps?.Map ||
      mapInitialized
    ) {
      return;
    }

    try {
      const mapOptions = {
        center: { lat: 52.3676, lng: 4.9041 },
        zoom: zoom,
        styles: NATURAL_MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
        gestureHandling: "greedy",
      };

      mapInstanceRef.current = new window.google.maps.Map(
        mapDivRef.current,
        mapOptions
      );

      mapInstanceRef.current.addListener("click", () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close();
          infoWindowRef.current = null;
        }
      });

      setMapInitialized(true);
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }
  }, [zoom, mapInitialized]);

  const updateMarkers = useCallback(() => {
    if (updateDebounceRef.current) {
      clearTimeout(updateDebounceRef.current);
    }

    updateDebounceRef.current = setTimeout(() => {
      if (!mapInstanceRef.current || !window.google?.maps) return;

      const currentMarkerIds = new Set(validMarkers.map((m) => m.id));

      const markersToRemove: string[] = [];
      markersRef.current.forEach((marker, id) => {
        if (!currentMarkerIds.has(id)) {
          markersToRemove.push(id);
        }
      });

      markersToRemove.forEach((id) => {
        const marker = markersRef.current.get(id);
        if (marker) {
          try {
            google.maps.event.clearInstanceListeners(marker);
            marker.setMap(null);
            markersRef.current.delete(id);
          } catch (e) {
            console.warn("Error removing marker:", e);
          }
        }
      });

      validMarkers.forEach((markerData) => {
        const existingMarker = markersRef.current.get(markerData.id);

        if (!existingMarker) {
          const position = {
            lat: markerData.latitude!,
            lng: markerData.longitude!,
          };

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
            optimized: false,
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

          markersRef.current.set(markerData.id, marker);
        } else {
          const newLabel = `€${Math.round(markerData.price)}`;
          const currentLabel = existingMarker.getLabel();
          if (
            typeof currentLabel === "object" &&
            currentLabel.text !== newLabel
          ) {
            existingMarker.setLabel({
              text: newLabel,
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: "bold",
            });
          }
        }
      });

      if (validMarkers.length > 0 && mapInstanceRef.current) {
        const bounds = new window.google.maps.LatLngBounds();
        validMarkers.forEach((markerData) => {
          bounds.extend({
            lat: markerData.latitude!,
            lng: markerData.longitude!,
          });
        });

        try {
          mapInstanceRef.current.fitBounds(bounds, {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50,
          });
        } catch (e) {
          console.warn("Error fitting bounds:", e);
        }
      }
    }, 200);
  }, [validMarkers]);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (isScriptLoaded && window.google?.maps?.Map) {
        setIsReady(true);
        return;
      }

      if (isScriptLoading) {
        loadCallbacks.push(() => setIsReady(true));
        return;
      }

      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        if (window.google?.maps?.Map) {
          isScriptLoaded = true;
          setIsReady(true);
        } else {
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

          setTimeout(() => {
            clearInterval(checkInterval);
            isScriptLoading = false;
            console.error("Google Maps script loading timeout");
          }, 10000);
        }
        return;
      }

      isScriptLoading = true;
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setTimeout(() => {
          isScriptLoaded = true;
          isScriptLoading = false;
          setIsReady(true);
          loadCallbacks.forEach((cb) => cb());
          loadCallbacks.length = 0;
        }, 100);
      };

      script.onerror = () => {
        console.error("Failed to load Google Maps script");
        isScriptLoading = false;
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  useEffect(() => {
    if (isReady && !mapInitialized && mapDivRef.current) {
      requestAnimationFrame(() => {
        initializeMap();
      });
    }
  }, [isReady, mapInitialized, initializeMap]);

  useEffect(() => {
    if (mapInitialized) {
      updateMarkers();
    }
  }, [validMarkers, mapInitialized, updateMarkers]);

  useEffect(() => {
    return () => {
      if (updateDebounceRef.current) {
        clearTimeout(updateDebounceRef.current);
      }

      markersRef.current.forEach((marker) => {
        try {
          if (window.google?.maps?.event) {
            google.maps.event.clearInstanceListeners(marker);
          }
          marker.setMap(null);
        } catch (e) {}
      });
      markersRef.current.clear();

      if (infoWindowRef.current) {
        try {
          infoWindowRef.current.close();
        } catch (e) {}
        infoWindowRef.current = null;
      }

      if (mapInstanceRef.current && window.google?.maps?.event) {
        try {
          google.maps.event.clearInstanceListeners(mapInstanceRef.current);
        } catch (e) {}
      }
      mapInstanceRef.current = null;
    };
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const shouldHideMap = view === "list" && isMobile;

  return (
    <div
      className={`w-full relative rounded-lg overflow-hidden transition-all duration-300 ${
        view === "map"
          ? "h-screen fixed inset-0 z-10 rounded-none"
          : "h-0 md:h-[300px]"
      }`}
      style={{
        opacity: shouldHideMap ? 0 : 1,
        pointerEvents: shouldHideMap ? "none" : "auto",
      }}
    >
      <div
        ref={mapContainerRef}
        className="w-full h-full relative"
        style={{ isolation: "isolate" }}
      >
        <div
          ref={mapDivRef}
          className="w-full h-full absolute inset-0"
          style={{ zIndex: 1 }}
        />

        {!mapInitialized && !shouldHideMap && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="h-8 w-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

const TrailerMap = dynamic(() => Promise.resolve(TrailerMapComponent), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] hidden md:flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="h-8 w-8 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});

export default TrailerMap;
