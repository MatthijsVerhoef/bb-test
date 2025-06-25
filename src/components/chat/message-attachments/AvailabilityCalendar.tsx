// src/components/chat/message-attachments/AvailabilityCalendar.tsx
import React from "react";
import { motion } from "framer-motion";
import { Calendar, Check, X } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { nl } from "date-fns/locale";

interface AvailabilityCalendarProps {
  availableDates: Date[] | string[];
  unavailableDates: Date[] | string[];
  onClick?: () => void;
}

export function AvailabilityCalendar({
  availableDates,
  unavailableDates,
  onClick,
}: AvailabilityCalendarProps) {
  // Convert string dates to Date objects if needed
  const available = availableDates.map((d) =>
    typeof d === "string" ? new Date(d) : d
  );
  const unavailable = unavailableDates.map((d) =>
    typeof d === "string" ? new Date(d) : d
  );

  // Sort dates
  const sortedAvailable = available.sort((a, b) => a.getTime() - b.getTime());
  const sortedUnavailable = unavailable.sort(
    (a, b) => a.getTime() - b.getTime()
  );

  // Get the next few dates to display
  const displayDates = [
    ...sortedAvailable.slice(0, 3),
    ...sortedUnavailable.slice(0, 2),
  ]
    .sort((a, b) => a.getTime() - b.getTime())
    .slice(0, 5);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white border rounded-lg p-4 max-w-sm"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-gray-600" />
        <h4 className="font-semibold text-sm">Beschikbaarheid</h4>
      </div>

      <div className="space-y-2">
        {displayDates.map((date, index) => {
          const isAvailable = available.some((d) => isSameDay(d, date));

          return (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded-md text-xs ${
                isAvailable ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <span className="font-medium">
                {format(date, "EEEE d MMMM", { locale: nl })}
              </span>

              <div className="flex items-center gap-1">
                {isAvailable ? (
                  <>
                    <Check className="w-3 h-3 text-green-600" />
                    <span className="text-green-700">Beschikbaar</span>
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3 text-red-600" />
                    <span className="text-red-700">Bezet</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(available.length > 3 || unavailable.length > 2) && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          +{Math.max(0, available.length - 3 + unavailable.length - 2)} meer
          datums
        </p>
      )}
    </motion.div>
  );
}
