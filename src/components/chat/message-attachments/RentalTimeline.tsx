// src/components/chat/message-attachments/RentalTimeline.tsx
import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { nl } from "date-fns/locale";

interface RentalData {
  id: string;
  trailerId: string;
  startDate: string | Date;
  endDate: string | Date;
  status: "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  pickupLocation?: string;
  returnLocation?: string;
}

interface RentalTimelineProps {
  rental: RentalData;
  onClick?: () => void;
}

export function RentalTimeline({ rental, onClick }: RentalTimelineProps) {
  const startDate =
    typeof rental.startDate === "string"
      ? new Date(rental.startDate)
      : rental.startDate;
  const endDate =
    typeof rental.endDate === "string"
      ? new Date(rental.endDate)
      : rental.endDate;
  const duration = differenceInDays(endDate, startDate) + 1;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          icon: Loader,
          color: "text-yellow-600 bg-yellow-50",
          label: "In afwachting",
        };
      case "CONFIRMED":
        return {
          icon: CheckCircle,
          color: "text-green-600 bg-green-50",
          label: "Bevestigd",
        };
      case "ACTIVE":
        return {
          icon: Clock,
          color: "text-blue-600 bg-blue-50",
          label: "Actief",
        };
      case "COMPLETED":
        return {
          icon: CheckCircle,
          color: "text-gray-600 bg-gray-50",
          label: "Voltooid",
        };
      case "CANCELLED":
        return {
          icon: XCircle,
          color: "text-red-600 bg-red-50",
          label: "Geannuleerd",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-gray-600 bg-gray-50",
          label: "Onbekend",
        };
    }
  };

  const statusConfig = getStatusConfig(rental.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white border rounded-lg p-4 max-w-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          <h4 className="font-semibold text-sm">Huurperiode</h4>
        </div>

        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {/* Start date */}
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-300" />
          </div>

          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">
              {format(startDate, "EEEE d MMMM yyyy", { locale: nl })}
            </p>
            <p className="text-xs text-gray-500">Ophalen</p>
            {rental.pickupLocation && (
              <p className="text-xs text-gray-400 mt-0.5">
                {rental.pickupLocation}
              </p>
            )}
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3 ml-8">
          <div className="bg-gray-100 rounded px-2 py-1 text-xs text-gray-600">
            {duration} {duration === 1 ? "dag" : "dagen"}
          </div>
        </div>

        {/* End date */}
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />

          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">
              {format(endDate, "EEEE d MMMM yyyy", { locale: nl })}
            </p>
            <p className="text-xs text-gray-500">Inleveren</p>
            {rental.returnLocation && (
              <p className="text-xs text-gray-400 mt-0.5">
                {rental.returnLocation}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
