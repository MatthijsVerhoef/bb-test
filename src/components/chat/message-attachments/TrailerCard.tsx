// src/components/chat/message-attachments/TrailerCard.tsx
import React from "react";
import { motion } from "framer-motion";
import { MapPin, Euro } from "lucide-react";
import Image from "next/image";

interface TrailerData {
  id: string;
  title: string;
  pricePerDay: number;
  type?: string;
  description?: string;
  imageUrl?: string;
  location?: string;
}

interface TrailerCardProps {
  trailer: TrailerData;
  onClick?: () => void;
}

export function TrailerCard({ trailer, onClick }: TrailerCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white border rounded-lg overflow-hidden max-w-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      {trailer.imageUrl && (
        <div className="relative h-40 w-full">
          <Image
            src={trailer.imageUrl}
            alt={trailer.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1">{trailer.title}</h3>

        {trailer.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {trailer.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            <Euro className="w-3 h-3" />
            <span className="font-medium text-gray-900">
              {trailer.pricePerDay}/dag
            </span>
          </div>

          {trailer.location && (
            <div className="flex items-center gap-1 text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>{trailer.location}</span>
            </div>
          )}
        </div>

        {trailer.type && (
          <div className="mt-2">
            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {trailer.type}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
