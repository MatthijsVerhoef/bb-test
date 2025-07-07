import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/client";
import { getAvailableTimeOptions } from "@/lib/utils/date-availability";
import type {
  WeeklyAvailability,
  AvailabilityException,
} from "@/lib/utils/date-availability";

interface TimeSelectorsProps {
  startDate?: Date;
  endDate?: Date;
  pickupTime: string;
  returnTime: string;
  onPickupTimeChange: (time: string) => void;
  onReturnTimeChange: (time: string) => void;
  weeklyAvailabilityData: WeeklyAvailability[];
  availabilityExceptions: AvailabilityException[];
  validationError?: string;
  available: boolean;
  isLoading: boolean;
}

export default function TimeSelectors({
  startDate,
  endDate,
  pickupTime,
  returnTime,
  onPickupTimeChange,
  onReturnTimeChange,
  weeklyAvailabilityData,
  availabilityExceptions,
  validationError,
  available,
  isLoading,
}: TimeSelectorsProps) {
  const { t } = useTranslation("trailer");

  const pickupTimeOptions = startDate
    ? getAvailableTimeOptions(
        startDate,
        weeklyAvailabilityData,
        availabilityExceptions
      )
    : [];

  const returnTimeOptions = endDate
    ? getAvailableTimeOptions(
        endDate,
        weeklyAvailabilityData,
        availabilityExceptions
      )
    : [];

  return (
    <>
      <div
        className="grid grid-cols-2 gap-4 w-full"
        onClick={() =>
          console.log(available, startDate, pickupTimeOptions, isLoading)
        }
      >
        <div className="space-y-2 flex-1">
          <Label
            htmlFor="pickup-time"
            className="flex text-[13px] items-center gap-2"
          >
            {t("booking.time.pickup")}
          </Label>
          <Select
            value={pickupTime}
            onValueChange={onPickupTimeChange}
            disabled={
              !available ||
              !startDate ||
              pickupTimeOptions.length === 0 ||
              isLoading
            }
          >
            <SelectTrigger
              id="pickup-time"
              className={`bg-white w-full min-h-10 rounded-lg shadow-none ${
                validationError ? "border-red-500" : ""
              }`}
              onClick={() => console.log("triggered")}
            >
              <SelectValue placeholder={t("booking.time.selectTime")} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {pickupTimeOptions.map((time) => (
                <SelectItem key={`pickup-${time}`} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pickupTimeOptions.length === 0 && startDate && !isLoading && (
            <p className="text-xs text-amber-600">
              {t("booking.time.noAvailability")}
            </p>
          )}
        </div>

        <div className="space-y-2 flex-1">
          <Label
            htmlFor="return-time"
            className="flex text-[13px] items-center gap-2"
          >
            {t("booking.time.return")}
          </Label>
          <Select
            value={returnTime}
            onValueChange={onReturnTimeChange}
            disabled={
              !available ||
              !endDate ||
              returnTimeOptions.length === 0 ||
              isLoading
            }
          >
            <SelectTrigger
              id="return-time"
              className={`bg-white w-full min-h-10 rounded-lg shadow-none ${
                validationError ? "border-red-500" : ""
              }`}
            >
              <SelectValue placeholder={t("booking.time.selectTime")} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {returnTimeOptions.map((time) => (
                <SelectItem key={`return-${time}`} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {returnTimeOptions.length === 0 && endDate && !isLoading && (
            <p className="text-xs text-amber-600">
              {t("booking.time.noAvailability")}
            </p>
          )}
        </div>
      </div>
      {validationError && (
        <p className="text-xs text-red-500 -mt-2">{validationError}</p>
      )}
    </>
  );
}
