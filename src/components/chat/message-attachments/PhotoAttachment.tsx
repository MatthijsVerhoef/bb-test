// src/components/chat/message-attachments/PhotoAttachment.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Expand, Download } from "lucide-react";
import Image from "next/image";

interface PhotoAttachmentProps {
  imageUrl: string;
  caption?: string;
  onClick?: () => void;
}

export function PhotoAttachment({
  imageUrl,
  caption,
  onClick,
}: PhotoAttachmentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = caption || "photo";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      // Open in new tab as fallback
      window.open(imageUrl, "_blank");
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative group max-w-sm rounded-lg overflow-hidden bg-gray-100"
    >
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}

        {error ? (
          <div className="w-full h-48 flex items-center justify-center text-gray-500 text-sm">
            Failed to load image
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={caption || "Shared photo"}
            className="w-full h-auto max-h-96 object-contain"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError(true);
            }}
          />
        )}

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
          <button
            onClick={handleExpand}
            className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            title="Expand"
          >
            <Expand className="w-4 h-4 text-gray-700" />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            title="Download"
          >
            <Download className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      {caption && (
        <div className="p-3 bg-white border-t">
          <p className="text-xs text-gray-600">{caption}</p>
        </div>
      )}
    </motion.div>
  );
}
