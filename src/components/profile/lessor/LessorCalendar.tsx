import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";
import { TrailerSelector } from "@/components/calendar/TrailerSelector";
import { DesktopCalendarView } from "@/components/calendar/DesktopCalendarView";
import type { CalendarProps } from "@/types/Calendar";

export const LessorCalendar: React.FC<CalendarProps> = (props) => {
  const { t } = useTranslation("profile");
  const [selectedTrailer, setSelectedTrailer] = useState<string | null>(
    props.trailers.length > 0 ? props.trailers[0].id : null
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <TrailerSelector
        trailers={props.trailers}
        selectedTrailer={selectedTrailer}
        onSelectTrailer={setSelectedTrailer}
      />

      {selectedTrailer && (
        <DesktopCalendarView {...props} selectedTrailer={selectedTrailer} />
      )}

      {!selectedTrailer && props.trailers.length > 0 && (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {t("lessorCalendar.calendar.noTrailerSelected.title")}
          </h3>
          <p className="text-sm text-gray-500">
            {t("lessorCalendar.calendar.noTrailerSelected.description")}
          </p>
        </Card>
      )}
    </div>
  );
};
