"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Info, X, Plus } from "lucide-react";
import { TrailerCategories } from "@/lib/trailer-categories";

interface TrailerCategory {
  id: string;
  trailerType: string;
  description: string;
  icon: React.ReactNode;
  image: string;
}

interface TrailerTypeProps {
  trailerType: string;
  setTrailerType: (type: string) => void;
}

export default function TrailerType({
  trailerType,
  setTrailerType,
}: TrailerTypeProps) {
  const [types, setTypes] = useState<TrailerCategory[]>([]);
  const [trailerInfo, setTrailerInfo] = useState(false);
  const [customTrailer, setCustomTrailer] = useState(false);
  const [customTrailerTitle, setCustomTrailerTitle] = useState("");
  const [selectedTrailerInfo, setSelectedTrailerInfo] =
    useState<TrailerCategory | null>(null);

  useEffect(() => {
    // Load trailer categories
    setTypes(TrailerCategories);
  }, []);

  // Handle trailer info click
  const handleInfoClick = (e: React.MouseEvent, trailer: TrailerCategory) => {
    e.stopPropagation();
    setSelectedTrailerInfo(trailer);
    setTrailerInfo(true);
  };

  // Handle custom trailer save
  const handleCustomTrailerSave = () => {
    if (customTrailerTitle.trim()) {
      setTrailerType(customTrailerTitle);
      setCustomTrailer(false);
    }
  };

  // Handle key press for custom trailer input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCustomTrailerSave();
    }
  };

  return (
    <div className="mx-auto relative">
      <h2 className="text-3xl font-medium text-gray-900 mb-3">
        Selecteer jouw aanhanger type
      </h2>
      <p className="text-gray-600 mb-8">
        Selecteer het type aanhanger dat je wilt verhuren, staat jouw aanhanger
        hier niet tussen? Klik dan op overig.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {types.map((type) => (
          <div
            key={type.id}
            onClick={() => {
              setTrailerType(type.trailerType);
              setCustomTrailerTitle("");
            }}
            className={`bg-white flex flex-col justify-between rounded-md border transition-all duration-200 p-4 h-28 cursor-pointer relative ${
              trailerType === type.trailerType
                ? "border-2 border-gray-900"
                : "border border-gray-200 hover:border-gray-400"
            }`}
          >
            <div className="text-gray-700">{type.icon}</div>
            <p className="text-left text-sm font-medium mt-2 text-gray-800">
              {type.trailerType}
            </p>
            <button
              onClick={(e) => handleInfoClick(e, type)}
              className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-900 transition-colors"
              aria-label={`Meer informatie over ${type.trailerType}`}
            >
              <Info className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      {/* Custom trailer modal */}
      {customTrailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setCustomTrailer(false)}
            aria-hidden="true"
          />
          <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-md mx-4 z-10 transform transition-all">
            <div className="relative">
              <Image
                className="w-full h-48 object-cover"
                alt="Custom trailer illustration"
                src="/customTrailer.svg"
                width={500}
                height={300}
                priority
              />
              <button
                onClick={() => setCustomTrailer(false)}
                className="absolute top-3 right-3 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
                aria-label="Sluiten"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Ander aanhanger type
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Staat jouw aanhanger type er niet tussen? Geef de titel van jouw
                aanhanger op.
              </p>
              <div className="mt-2">
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Aanhanger type"
                  onChange={(e) => setCustomTrailerTitle(e.target.value)}
                  value={customTrailerTitle}
                  maxLength={22}
                  onKeyDown={handleKeyPress}
                  autoFocus
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {customTrailerTitle.length}/22
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setCustomTrailer(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleCustomTrailerSave}
                  disabled={!customTrailerTitle.trim()}
                  className={`px-4 py-2 rounded-md text-white transition-colors ${
                    customTrailerTitle.trim()
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-400 cursor-not-allowed"
                  }`}
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trailer info modal */}
      {trailerInfo && selectedTrailerInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setTrailerInfo(false)}
            aria-hidden="true"
          />
          <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-md mx-4 z-10">
            <div className="relative p-4 border-b border-gray-200">
              <h3 className="text-center font-semibold">
                {selectedTrailerInfo.trailerType}
              </h3>
              <button
                onClick={() => setTrailerInfo(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label="Sluiten"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="relative w-64 h-48 mb-4">
                <Image
                  className="rounded-md object-cover"
                  alt={selectedTrailerInfo.trailerType}
                  src={selectedTrailerInfo.image}
                  fill
                />
              </div>
              <p className="text-gray-700 text-center text-sm leading-relaxed">
                {selectedTrailerInfo.description}
              </p>
              <button
                onClick={() => {
                  setTrailerType(selectedTrailerInfo.trailerType);
                  setTrailerInfo(false);
                }}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Selecteer dit type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
