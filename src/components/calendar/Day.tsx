// components/calendar/Day.tsx

import React from "react";
import { format, isToday, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import type { DateStatus, Rental } from "@/types/Calendar";

interface DayProps {
  date: Date;
  monthDate: Date;
  status: DateStatus;
  rentals: Rental[];
  isSelected: boolean;
  isPast: boolean;
  onSelect: () => void;
  disabled?: boolean;
  isMobile?: boolean;
}

export const Day: React.FC<DayProps> = ({
  date,
  monthDate,
  status,
  rentals,
  isSelected,
  isPast,
  onSelect,
  disabled = false,
  isMobile = false,
}) => {
  const { t } = useTranslation("profile");
  const isCurrentMonth = isSameMonth(date, monthDate);
  const hasRentals = rentals.length > 0;

  // Determine background colors
  let backgroundClasses = "";
  if (isSelected) {
    switch (status) {
      case "available":
        backgroundClasses = "bg-[#222222]";
        break;
      case "blocked":
        backgroundClasses = "bg-red-300";
        break;
      case "unavailable":
        backgroundClasses = "bg-gray-400";
        break;
      case "rented":
        backgroundClasses = "bg-blue-600";
        break;
    }
  } else {
    switch (status) {
      case "available":
        backgroundClasses = "bg-white border-gray-200 hover:bg-gray-50";
        break;
      case "unavailable":
        backgroundClasses = "bg-gray-100 border-gray-200 line-through";
        break;
      case "blocked":
        backgroundClasses = "bg-red-50 border-red-200 hover:bg-red-100";
        break;
      case "rented":
        backgroundClasses = "bg-primary/20 border-primary";
        break;
    }
  }

  const baseClasses = isMobile
    ? "h-[70px] p-1 border rounded-md text-xs"
    : "aspect-square p-2 border rounded-lg";

  return (
    <div
      onClick={disabled ? undefined : onSelect}
      className={cn(
        baseClasses,
        "relative cursor-pointer transition-all",
        !isCurrentMonth && "opacity-40",
        backgroundClasses,
        isPast && "opacity-50 cursor-not-allowed",
        isToday(date) && "",
        (hasRentals || isPast || disabled) && "cursor-not-allowed"
      )}
    >
      <div className="flex flex-col h-full">
        <span
          className={cn(
            "font-medium",
            isMobile ? "mx-auto mt-2" : "text-sm",
            isSelected &&
              (status === "available" || status === "blocked") &&
              "text-white",
            isToday(date) &&
              "bg-primary text-white rounded-full size-5 flex items-center justify-center"
          )}
        >
          {format(date, "d")}
        </span>

        {hasRentals && (
          <div
            className={cn(
              "truncate mt-auto",
              isMobile ? "text-[9px]" : "text-[10px]",
              "text-primary"
            )}
          >
            {rentals[0].renter.firstName}
          </div>
        )}

        {!isMobile && !hasRentals && status !== "available" && (
          <div className="mt-auto">
            <div className="text-[10px] text-gray-500 truncate">
              {status === "unavailable" &&
                t("lessorCalendar.calendar.dayStatus.unavailable")}
              {status === "blocked" &&
                t("lessorCalendar.calendar.dayStatus.blocked")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
