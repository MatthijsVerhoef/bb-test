import React, { useState } from "react";
import { useTranslation } from "@/lib/i18n/client";
import { TrailerSelector } from "@/components/calendar/TrailerSelector";
import { MobileCalendarView } from "@/components/calendar/MobileCalendarView";
import type { CalendarProps } from "@/types/Calendar";

export const MobileLessorCalendar: React.FC<CalendarProps> = (props) => {
  const { t } = useTranslation("profile");
  const [selectedTrailer, setSelectedTrailer] = useState<string | null>(null);

  if (!selectedTrailer && props.trailers.length > 0) {
    return (
      <TrailerSelector
        trailers={props.trailers}
        selectedTrailer={selectedTrailer}
        onSelectTrailer={setSelectedTrailer}
        isMobile
      />
    );
  }

  if (props.trailers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t("lessorCalendar.calendar.noTrailersFound.title")}
          </h2>
          <p className="text-gray-600">
            {t("lessorCalendar.calendar.noTrailersFound.description")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <MobileCalendarView
      {...props}
      selectedTrailer={selectedTrailer!}
      onBack={() => setSelectedTrailer(null)}
    />
  );
};
