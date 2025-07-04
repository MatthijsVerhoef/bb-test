// components/calendar/TrailerSelector.tsx

import React from "react";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import type { Trailer } from "@/types/Calendar";

interface TrailerSelectorProps {
  trailers: Trailer[];
  selectedTrailer: string | null;
  onSelectTrailer: (id: string) => void;
  isMobile?: boolean;
}

export const TrailerSelector: React.FC<TrailerSelectorProps> = ({
  trailers,
  selectedTrailer,
  onSelectTrailer,
  isMobile = false,
}) => {
  const { t } = useTranslation("profile");

  if (isMobile) {
    return (
      <div className="bg-gray-50 px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("lessorCalendar.trailerSelection.title")}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {t("lessorCalendar.trailerSelection.description")}
          </p>
        </div>

        <div className="space-y-3">
          {trailers.map((trailer) => (
            <Card
              key={trailer.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectTrailer(trailer.id)}
            >
              <div className="flex items-center gap-4">
                {trailer.images?.[0]?.url && (
                  <img
                    src={trailer.images[0].url}
                    alt={trailer.title}
                    className="w-16 h-16 rounded-lg object-cover"
                    loading="lazy"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {trailer.title}
                  </h3>
                  <span className="text-sm text-gray-500">
                    ID: {trailer.id.slice(0, 8)}
                  </span>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400 rotate-180" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="p-6 bg-[#f7f7f7] border-0">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          {t("lessorCalendar.trailerSelection.title")}
        </h3>
        <p className="text-sm text-gray-600">
          {t("lessorCalendar.trailerSelection.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {trailers.map((trailer) => (
          <button
            key={trailer.id}
            onClick={() => onSelectTrailer(trailer.id)}
            className={cn(
              "p-4 rounded-lg border transition-all text-left",
              selectedTrailer === trailer.id
                ? "border-primary bg-primary/50"
                : "border-gray-200 bg-white hover:border-gray-300"
            )}
          >
            <div className="flex items-center gap-3">
              {trailer.images?.[0]?.url && (
                <img
                  src={trailer.images[0].url}
                  alt={trailer.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <h4 className="font-medium text-sm">{trailer.title}</h4>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
};
