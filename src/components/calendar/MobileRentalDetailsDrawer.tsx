import React from "react";
import { format } from "date-fns";
import { nl, de, enUS } from "date-fns/locale";
import { Calendar, User, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useTranslation } from "@/lib/i18n/client";
import { useRouter } from "next/navigation";
import type { Rental } from "@/types/Calendar";

interface MobileRentalDetailsDrawerProps {
  rental: Rental | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MobileRentalDetailsDrawer: React.FC<
  MobileRentalDetailsDrawerProps
> = ({ rental, isOpen, onClose }) => {
  const { t } = useTranslation("profile");
  const { t: tCommon } = useTranslation("common");
  const router = useRouter();

  if (!rental) return null;

  const locale =
    tCommon("locale") === "nl" ? nl : tCommon("locale") === "de" ? de : enUS;

  const handleViewRental = () => {
    router.push("/profiel?mode=lessor&tab=lessor-rentals");
    onClose();
  };

  const startDate = new Date(rental.startDate);
  const endDate = new Date(rental.endDate);
  const numberOfDays =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
  const totalPrice = (rental.trailer.pricePerDay || 0) * numberOfDays;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>{t("lessorCalendar.rentalDetails.title")}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 py-4 space-y-4 overflow-y-auto">
          {/* Trailer Info */}
          <div className="flex items-center gap-3">
            {rental.trailer.images?.[0] && (
              <img
                src={rental.trailer.images[0].url}
                alt={rental.trailer.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="font-semibold">{rental.trailer.title}</h3>
              <p className="text-sm text-gray-600">
                €{rental.trailer.pricePerDay}{" "}
                {t("lessorCalendar.rentalDetails.perDay")}
              </p>
            </div>
          </div>

          {/* Renter Info */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">
                {t("lessorCalendar.rentalDetails.renter")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {rental.renter.profilePicture ? (
                <img
                  src={rental.renter.profilePicture}
                  alt={rental.renter.firstName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
              )}
              <span className="font-medium">
                {rental.renter.firstName} {rental.renter.lastName}
              </span>
            </div>
          </div>

          {/* Rental Period */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">
                {t("lessorCalendar.rentalDetails.period")}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="text-gray-600">
                  {t("lessorCalendar.rentalDetails.from")}:
                </span>{" "}
                {format(startDate, "PPP", { locale })}
              </p>
              <p className="text-sm">
                <span className="text-gray-600">
                  {t("lessorCalendar.rentalDetails.to")}:
                </span>{" "}
                {format(endDate, "PPP", { locale })}
              </p>
              <p className="text-sm font-medium">
                {numberOfDays}{" "}
                {numberOfDays === 1
                  ? t("lessorCalendar.rentalDetails.day")
                  : t("lessorCalendar.rentalDetails.days")}
              </p>
            </div>
          </div>

          {/* Total Price */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {t("lessorCalendar.rentalDetails.totalPrice")}
                </span>
              </div>
              <span className="font-semibold text-lg">€{totalPrice}</span>
            </div>
          </div>

          {/* Status */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t("lessorCalendar.rentalDetails.status")}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  rental.status === "CONFIRMED"
                    ? "bg-green-100 text-green-700"
                    : rental.status === "ACTIVE"
                    ? "bg-blue-100 text-blue-700"
                    : rental.status === "COMPLETED"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {t(`lessorCalendar.rentalDetails.statuses.${rental.status}`)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-4 pb-2">
            <Button onClick={handleViewRental} className="w-full">
              {t("lessorCalendar.rentalDetails.viewAllRentals")}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};