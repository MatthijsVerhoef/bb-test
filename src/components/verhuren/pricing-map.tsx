"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

// Natural color style from the main trailer map
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

interface Trailer {
  id: string;
  title: string;
  pricePerDay: number;
  latitude: number;
  longitude: number;
  city: string;
  type: string;
}

function PricingMapClient() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  }>({ lat: 52.3676, lng: 4.9041 });
  const [mapInitialized, setMapInitialized] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // If location is denied, use default location (Netherlands center)
          setUserLocation({ lat: 52.3676, lng: 4.9041 });
        }
      );
    }
  }, []);

  useEffect(() => {
    // Fetch trailers from API
    const fetchTrailers = async () => {
      try {
        const response = await fetch(`/api/trailers?limit=20`);
        const data = await response.json();

        if (data.trailers) {
          // Filter trailers that have location data
          const trailersWithLocation = data.trailers
            .filter((trailer: any) => trailer.latitude && trailer.longitude)
            .slice(0, 12) // Show max 12 trailers
            .map((trailer: any) => ({
              id: trailer.id,
              title: trailer.title,
              pricePerDay:
                trailer.pricePerDay || Math.floor(Math.random() * 40) + 20,
              latitude: trailer.latitude,
              longitude: trailer.longitude,
              city: trailer.city,
              type: trailer.type,
            }));

          setTrailers(trailersWithLocation);
        }
      } catch (error) {
        console.error("Error fetching trailers:", error);
        // Use sample data for demo
        setSampleTrailers();
      }
    };

    fetchTrailers();
  }, []);

  const setSampleTrailers = () => {
    const sampleTrailers: Trailer[] = [
      {
        id: "1",
        title: "Gesloten aanhanger",
        pricePerDay: 35,
        latitude: 52.3702,
        longitude: 4.8952,
        city: "Amsterdam",
        type: "CLOSED",
      },
      {
        id: "2",
        title: "Open aanhanger",
        pricePerDay: 25,
        latitude: 52.3676,
        longitude: 4.9041,
        city: "Amsterdam",
        type: "OPEN",
      },
      {
        id: "3",
        title: "Boottrailer",
        pricePerDay: 45,
        latitude: 52.3645,
        longitude: 4.912,
        city: "Amsterdam",
        type: "BOAT",
      },
      {
        id: "4",
        title: "Autotransporter",
        pricePerDay: 60,
        latitude: 52.3588,
        longitude: 4.874,
        city: "Amsterdam",
        type: "CAR",
      },
      {
        id: "5",
        title: "Gesloten aanhanger",
        pricePerDay: 30,
        latitude: 52.3751,
        longitude: 4.8982,
        city: "Amsterdam",
        type: "CLOSED",
      },
      {
        id: "6",
        title: "Open aanhanger",
        pricePerDay: 22,
        latitude: 52.3625,
        longitude: 4.889,
        city: "Amsterdam",
        type: "OPEN",
      },
    ];
    setTrailers(sampleTrailers);
  };

  useEffect(() => {
    // Load Google Maps script if not already loaded
    if (typeof window !== "undefined") {
      if (window.google?.maps) {
        setMapInitialized(true);
        setIsMapLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initPricingMap`;
      script.async = true;
      script.defer = true;

      (window as any).initPricingMap = () => {
        setMapInitialized(true);
        setIsMapLoaded(true);
      };

      if (!document.getElementById("google-maps-script")) {
        document.head.appendChild(script);
      }

      return () => {
        delete (window as any).initPricingMap;
      };
    }
  }, []);

  useEffect(() => {
    if (!mapInitialized || !mapRef.current || trailers.length === 0) return;

    const map = new google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 15,
      mapTypeControl: false,
      disableDefaultUI: true,
      zoomControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: NATURAL_MAP_STYLE,
    });

    const bounds = new google.maps.LatLngBounds();

    // Add user location marker
    new google.maps.Marker({
      position: userLocation,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#f97316",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
      title: "Jouw locatie",
    });

    bounds.extend(userLocation);

    // Add trailer markers
    trailers.forEach((trailer) => {
      const position = {
        lat: trailer.latitude,
        lng: trailer.longitude,
      };
      bounds.extend(position);

      const marker = new google.maps.Marker({
        position,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#ffffff",
          fillOpacity: 1,
          strokeColor: "#d1d5db",
          strokeWeight: 1,
        },
        label: {
          text: `€${Math.round(trailer.pricePerDay)}`,
          color: "#374151",
          fontWeight: "600",
          fontSize: "12px",
        },
        title: trailer.title,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family:sans-serif; padding:4px; min-width:140px;">
            <h4 style="margin:0 0 4px; font-weight:600; font-size:14px;">
              ${trailer.title}
            </h4>
            <div style="color:#f97316; font-weight:600; font-size:14px;">
              €${trailer.pricePerDay}/dag
            </div>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });

    map.fitBounds(bounds);

    // Don't zoom too close if we have many markers
    const listener = google.maps.event.addListenerOnce(
      map,
      "bounds_changed",
      () => {
        if (map.getZoom()! > 15) {
          map.setZoom(15);
        }
      }
    );
  }, [mapInitialized, trailers, userLocation]);

  const averagePrice =
    trailers.length > 0
      ? Math.round(
          trailers.reduce((sum, t) => sum + t.pricePerDay, 0) / trailers.length
        )
      : 35;

  const priceRange =
    trailers.length > 0
      ? `€${Math.min(...trailers.map((t) => t.pricePerDay))}-${Math.max(
          ...trailers.map((t) => t.pricePerDay)
        )}`
      : "€22-60";

  return (
    <div className="w-full">
      {/* Real Google Map */}
      <div className="relative w-full h-120 rounded-2xl overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />

        {/* Loading overlay */}
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg px-3 py-2 shadow-lg border border-gray-200">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Jouw locatie</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 bg-white border border-gray-300 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-semibold">€</span>
              </div>
              <span>Aanhangers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PricingMap = dynamic(() => Promise.resolve(PricingMapClient), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-gray-100 rounded-2xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
    </div>
  ),
});

export default PricingMap;
