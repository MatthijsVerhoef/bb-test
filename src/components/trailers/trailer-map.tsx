"use client";

import { useEffect, useState, useRef } from "react";
import { Minimize2 } from "lucide-react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";

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
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  view: string;
}

// Function to create the CustomInfoWindow class - only called after Google Maps is loaded
function createCustomInfoWindowClass() {
  class CustomInfoWindow extends google.maps.OverlayView {
    private position: google.maps.LatLng;
    private marker: MapMarker;
    private div: HTMLDivElement | null = null;

    constructor(position: google.maps.LatLng, marker: MapMarker) {
      super();
      this.position = position;
      this.marker = marker;
    }

    onAdd() {
      this.div = document.createElement("div");
      this.div.style.position = "absolute";
      this.div.style.transform = "translate(-50%, -100%)";
      this.div.style.marginBottom = "20px";
      this.div.style.zIndex = "9999";

      // Create the info window content
      this.div.innerHTML = `
        <div class="custom-info-window" style="
          position: relative;
          width: 280px;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <!-- Close button -->
          <button onclick="this.closest('.custom-info-window').parentElement.remove()" style="
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 10;
            background: rgba(0, 0, 0, 0.5);
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
          " onmouseover="this.style.backgroundColor='rgba(0,0,0,0.7)'" onmouseout="this.style.backgroundColor='rgba(0,0,0,0.5)'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <!-- Image -->
          <div style="
            width: 100%;
            height: 140px;
            background: #f3f4f6;
            position: relative;
            overflow: hidden;
          ">
            ${
              this.marker.image
                ? `
              <img src="${this.marker.image}" alt="${this.marker.title}" style="
                width: 100%;
                height: 100%;
                object-fit: cover;
              " onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div style="
                display: none;
                width: 100%;
                height: 100%;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              ">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1">
                  <path d="M3 17h18v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2Z"/>
                  <circle cx="7" cy="17" r="2"/>
                  <circle cx="17" cy="17" r="2"/>
                  <path d="M5 9V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/>
                </svg>
              </div>
            `
                : `
              <div style="
                display: flex;
                width: 100%;
                height: 100%;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              ">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1">
                  <path d="M3 17h18v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2Z"/>
                  <circle cx="7" cy="17" r="2"/>
                  <circle cx="17" cy="17" r="2"/>
                  <path d="M5 9V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/>
                </svg>
              </div>
            `
            }
          </div>
          
          <!-- Content -->
          <div style="padding: 15px; display: flex; flex-direction: column;">
            <!-- Price and Title -->
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
              <h3 style="
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #111827;
                flex: 1;
                padding-right: 12px;
              ">${this.marker.title}</h3>
            </div>

                        <div style="
                color: black;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                white-space: nowrap;
                margin-bottom: 12px;
              ">€${this.marker.price}/dag</div>
            
            ${
              this.marker.location
                ? `
              <div style="
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 12px;
                color: #6b7280;
                font-size: 14px;
              ">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                ${this.marker.location}
              </div>
            `
                : ""
            }
            
            <a href="/aanbod/${this.marker.id}" style="
              display: block;
              width: 100%;
              background: #f97316;
              color: white;
              text-align: center;
              padding: 8px 20px;
              border-radius: 10px;
              font-size: 13px;
              font-weight: 600;
              text-decoration: none;
              transition: all 0.2s ease;
            " 
              onmouseout="this.style.backgroundColor='#f97316'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(249, 115, 22, 0.3)'">
              Bekijk details →
            </a>
          </div>
          
          <!-- Arrow pointing down -->
          <div style="
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
            border-top: 12px solid white;
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
          "></div>
        </div>
      `;

      const panes = this.getPanes();
      panes?.overlayMouseTarget.appendChild(this.div);
    }

    draw() {
      const overlayProjection = this.getProjection();
      const position = overlayProjection.fromLatLngToDivPixel(this.position);

      if (position && this.div) {
        this.div.style.left = position.x + "px";
        this.div.style.top = position.y + "px";
      }
    }

    onRemove() {
      if (this.div) {
        this.div.parentNode?.removeChild(this.div);
        this.div = null;
      }
    }

    getDiv() {
      return this.div;
    }
  }

  return CustomInfoWindow;
}

function TrailerMapClient({
  markers,
  initialCenter = { lat: 52.3676, lng: 4.9041 },
  initialZoom = 10,
  view,
}: TrailerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const fullscreenMapRef = useRef<HTMLDivElement>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<any>(null);
  const CustomInfoWindowClassRef = useRef<any>(null);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const validMarkers = markers.filter((m) => m.latitude && m.longitude);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        google.maps.event.trigger(mapInstanceRef.current, "resize");
      }
    }, 100);
  };

  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        setShouldLoadMap(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShouldLoadMap(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (typeof window !== "undefined" && shouldLoadMap) {
      if (window.google?.maps) {
        setMapInitialized(true);
        setIsMapLoaded(true);
        return;
      }

      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        const checkGoogleMaps = () => {
          if (window.google?.maps) {
            setMapInitialized(true);
            setIsMapLoaded(true);
          } else {
            setTimeout(checkGoogleMaps, 100);
          }
        };
        checkGoogleMaps();
        return;
      }

      const callbackName = `initMap_${Date.now()}`;
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=${callbackName}`;
      script.async = true;
      script.defer = true;

      (window as any)[callbackName] = () => {
        setMapInitialized(true);
        setIsMapLoaded(true);
        delete (window as any)[callbackName];
      };

      script.onerror = (error) => {
        console.error("Failed to load Google Maps script:", error);
        setHasError(true);
        setIsMapLoaded(true);
        delete (window as any)[callbackName];
      };

      document.head.appendChild(script);

      const timeout = setTimeout(() => {
        if (!mapInitialized) {
          console.warn("Google Maps took too long to load");
          setHasError(true);
          setIsMapLoaded(true);
          delete (window as any)[callbackName];
        }
      }, 20000);

      return () => {
        clearTimeout(timeout);
        delete (window as any)[callbackName];
      };
    }
  }, [mapInitialized, shouldLoadMap]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!mapInitialized || !mapRef.current || !window.google?.maps) return;

    // Create the CustomInfoWindow class if it hasn't been created yet
    if (!CustomInfoWindowClassRef.current) {
      CustomInfoWindowClassRef.current = createCustomInfoWindowClass();
    }

    markersRef.current.forEach((marker) => {
      if (marker) marker.setMap(null);
    });
    markersRef.current = [];

    if (infoWindowRef.current) {
      infoWindowRef.current.setMap(null);
      infoWindowRef.current = null;
    }

    const map = new google.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      mapTypeControl: false,
      disableDefaultUI: true,
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      styles: NATURAL_MAP_STYLE,
      clickableIcons: false,
    });

    mapInstanceRef.current = map;

    map.addListener("click", () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.setMap(null);
        infoWindowRef.current = null;
      }
    });

    const bounds = new google.maps.LatLngBounds();

    validMarkers.forEach((marker) => {
      const position = {
        lat: marker.latitude!,
        lng: marker.longitude!,
      };
      bounds.extend(position);

      const mapMarker = new google.maps.Marker({
        position,
        map,
        title: marker.title,
        label: {
          text: `€${Math.round(marker.price)}`,
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "bold",
        },
        icon: {
          path: "M 0,-16 A 16,16 0 1,1 0,16 A 16,16 0 1,1 0,-16 Z",
          fillColor: "#f97316",
          fillOpacity: 1,
          strokeColor: "#f97316",
          strokeWeight: 1,
          scale: 0.8,
          anchor: new google.maps.Point(0, 0),
          labelOrigin: new google.maps.Point(0, 0),
        },
        clickable: true,
        zIndex: 1000,
      });

      mapMarker.addListener("click", () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setMap(null);
        }

        const CustomInfoWindow = CustomInfoWindowClassRef.current;
        infoWindowRef.current = new CustomInfoWindow(position, marker);
        infoWindowRef.current.setMap(map);
      });

      markersRef.current.push(mapMarker);
    });

    if (validMarkers.length === 1) {
      map.setCenter(bounds.getCenter());
      map.setZoom(Math.max(initialZoom, 12));
    } else if (validMarkers.length > 0) {
      map.fitBounds(bounds);
      const padding = { top: 50, right: 50, bottom: 50, left: 50 };
      map.fitBounds(bounds, padding);
    }
  }, [mapInitialized, validMarkers, initialCenter, initialZoom]);

  useEffect(() => {
    if (
      !isFullscreen ||
      !fullscreenMapRef.current ||
      !mapInitialized ||
      !window.google?.maps
    )
      return;

    // Create the CustomInfoWindow class if it hasn't been created yet
    if (!CustomInfoWindowClassRef.current) {
      CustomInfoWindowClassRef.current = createCustomInfoWindowClass();
    }

    const fullscreenInfoWindowRef = { current: null as any };

    const fullscreenMap = new google.maps.Map(fullscreenMapRef.current, {
      center: mapInstanceRef.current?.getCenter() || initialCenter,
      zoom: mapInstanceRef.current?.getZoom() || initialZoom,
      mapTypeControl: true,
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: true,
      fullscreenControl: false,
      styles: NATURAL_MAP_STYLE,
      clickableIcons: false,
    });

    fullscreenMap.addListener("click", () => {
      if (fullscreenInfoWindowRef.current) {
        fullscreenInfoWindowRef.current.setMap(null);
        fullscreenInfoWindowRef.current = null;
      }
    });

    const bounds = new google.maps.LatLngBounds();

    validMarkers.forEach((marker) => {
      const position = {
        lat: marker.latitude!,
        lng: marker.longitude!,
      };
      bounds.extend(position);

      const mapMarker = new google.maps.Marker({
        position,
        map: fullscreenMap,
        title: marker.title,
        label: {
          text: `€${Math.round(marker.price)}`,
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "bold",
        },
        icon: {
          path: "M -12,-12 L 12,-12 Q 20,-12 20,-4 L 20,4 Q 20,12 12,12 L -12,12 Q -20,12 -20,4 L -20,-4 Q -20,-12 -12,-12 Z",
          fillColor: "#f97316",
          fillOpacity: 1,
          strokeColor: "#ea580c",
          strokeWeight: 1,
          scale: 0.8,
          anchor: new google.maps.Point(0, 0),
          labelOrigin: new google.maps.Point(0, 0),
        },
        clickable: true,
        zIndex: 1000,
      });

      mapMarker.addListener("click", () => {
        // Close existing info window
        if (fullscreenInfoWindowRef.current) {
          fullscreenInfoWindowRef.current.setMap(null);
        }

        // Create new custom info window
        const CustomInfoWindow = CustomInfoWindowClassRef.current;
        fullscreenInfoWindowRef.current = new CustomInfoWindow(
          position,
          marker
        );
        fullscreenInfoWindowRef.current.setMap(fullscreenMap);
      });
    });

    if (validMarkers.length === 1) {
      fullscreenMap.setCenter(bounds.getCenter());
      fullscreenMap.setZoom(Math.max(initialZoom, 14));
    } else if (validMarkers.length > 0) {
      fullscreenMap.fitBounds(bounds);
      const padding = { top: 50, right: 50, bottom: 50, left: 50 };
      fullscreenMap.fitBounds(bounds, padding);
    }
  }, [isFullscreen, mapInitialized, validMarkers, initialCenter, initialZoom]);

  const renderFullscreenMap = () => {
    if (typeof document === "undefined") return null;
    return createPortal(
      <div className="fixed inset-0 z-50 bg-white">
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
    <div
      className={`w-full relative rounded-lg overflow-hidden ${
        view === "map" ? "min-h-screen" : "hidden md:block md:h-[300px]"
      }`}
      ref={mapRef}
    >
      {/* Loading states */}
      {!shouldLoadMap && isMobile ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setShouldLoadMap(true)}
        >
          <div className="mb-3">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600 text-center font-medium">
            Tik om kaart te laden
          </p>
        </div>
      ) : !isMapLoaded && !hasError && shouldLoadMap ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
          <div className="h-10 w-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 mt-3">Kaart laden...</p>
        </div>
      ) : null}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-500 mb-3">
            Kaart kon niet worden geladen
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setIsMapLoaded(false);
              setMapInitialized(false);
              setShouldLoadMap(true);
            }}
            className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      )}

      {/* Fullscreen map */}
      {isFullscreen && renderFullscreenMap()}
    </div>
  );
}

const TrailerMap = dynamic(() => Promise.resolve(TrailerMapClient), {
  ssr: false,
  loading: () => (
    <div className="w-full hidden md:flex md:h-[300px] h-[300px] items-center justify-center overflow-hidden rounded-lg bg-gray-100">
      <div className="text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-sm">Kaart wordt geladen...</p>
      </div>
    </div>
  ),
});

export default TrailerMap;
