// src/components/chat/message-attachments/LocationMap.tsx
import React from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation } from "lucide-react";

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  name?: string;
}

interface LocationMapProps {
  location: LocationData;
  onClick?: () => void;
}

export function LocationMap({ location, onClick }: LocationMapProps) {
  // Generate Google Maps URL
  const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

  // Static map image URL (using Google Static Maps API)
  // Note: You'll need to add your Google Maps API key
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${location.latitude},${location.longitude}&zoom=15&size=300x150&markers=color:red%7C${location.latitude},${location.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`;

  const handleOpenMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(mapsUrl, "_blank");
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white border rounded-lg overflow-hidden max-w-sm"
      onClick={onClick}
    >
      {/* Map Preview */}
      <div className="relative h-36 w-full bg-gray-100">
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ? (
          <img
            src={staticMapUrl}
            alt="Location map"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      <div className="p-4">
        {location.name && (
          <h4 className="font-semibold text-sm mb-1">{location.name}</h4>
        )}

        <p className="text-xs text-gray-600 mb-3">{location.address}</p>

        <button
          onClick={handleOpenMaps}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
        >
          <Navigation className="w-3 h-3" />
          Open in Maps
        </button>
      </div>
    </motion.div>
  );
}
