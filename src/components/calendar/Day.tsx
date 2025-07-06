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
    // When selected, use darker versions of the colors
    switch (status) {
      case "available":
        backgroundClasses = "bg-[#222222] text-white border-[#222222]";
        break;
      case "blocked":
        backgroundClasses = "bg-red-400 text-white border-red-400";
        break;
      case "unavailable":
        backgroundClasses = "bg-gray-400 text-white border-gray-400";
        break;
      case "rented":
        backgroundClasses = "bg-primary text-white border-primary";
        break;
    }
  } else {
    // When not selected, use the colors that match your legend
    switch (status) {
      case "available":
        backgroundClasses = "bg-white border-gray-200 hover:bg-gray-50";
        break;
      case "unavailable":
        backgroundClasses = "bg-gray-50 border-gray-200";
        break;
      case "blocked":
        backgroundClasses = "bg-red-50 border-red-200 hover:bg-red-100";
        break;
      case "rented":
        backgroundClasses = "bg-primary/20 border-primary";
        break;
    }
  }

  // Add today's border if applicable
  const todayClasses = isToday(date) ? "border-2 border-primary" : "";

  const baseClasses = isMobile
    ? "h-[70px] p-1 border rounded-md text-xs"
    : "aspect-square p-2 border rounded-lg";

  return (
    <div
      onClick={disabled || isPast ? undefined : onSelect}
      className={cn(
        baseClasses,
        "relative cursor-pointer transition-all",
        !isCurrentMonth && "opacity-40",
        backgroundClasses,
        todayClasses,
        isPast && !hasRentals && "opacity-50 cursor-not-allowed",
        (isPast || disabled) && !hasRentals && "cursor-not-allowed",
        hasRentals && "cursor-pointer hover:shadow-md" // Allow clicking on rentals
      )}
    >
      <div className="flex flex-col h-full">
        <span
          className={cn(
            "font-medium",
            isMobile ? "mx-auto mt-2" : "text-sm",
            isSelected && "text-current", // Use current text color from parent
            isToday(date) && !isSelected && "font-bold" // Make today's date bold
          )}
        >
          {format(date, "d")}
        </span>

        {hasRentals && (
          <div
            className={cn(
              "truncate mt-auto",
              isMobile ? "text-[9px]" : "text-[10px]",
              isSelected ? "text-current" : "font-medium"
            )}
          >
            {rentals[0].renter.firstName}
          </div>
        )}

        {!isMobile && !hasRentals && status !== "available" && (
          <div className="mt-auto">
            <div
              className={cn(
                "text-[10px] truncate",
                isSelected ? "text-current" : "text-gray-500"
              )}
            >
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
