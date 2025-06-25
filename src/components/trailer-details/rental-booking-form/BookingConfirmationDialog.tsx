import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/client";
import type {
  BookingFormData,
  ValidationErrors,
} from "@/app/types/booking.types";

interface BookingConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: BookingFormData;
  onUpdateFormData: (updates: Partial<BookingFormData>) => void;
  validationErrors: ValidationErrors;
  trailerTitle?: string;
  rentalDays: number;
}

export default function BookingConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  formData,
  onUpdateFormData,
  validationErrors,
  trailerTitle,
  rentalDays,
}: BookingConfirmationDialogProps) {
  const { t } = useTranslation("trailer");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-8 rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("booking.confirmation.title")}</DialogTitle>
          <DialogDescription>
            {t("booking.confirmation.description", {
              trailerTitle,
              days: rentalDays,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <Label htmlFor="first-name">{t("booking.form.firstName")}</Label>
              <Input
                id="first-name"
                className={`shadow-none h-10 rounded-lg ${
                  validationErrors.firstName ? "border-red-500" : ""
                }`}
                value={formData.firstName}
                onChange={(e) =>
                  onUpdateFormData({ firstName: e.target.value })
                }
                required
              />
              {validationErrors.firstName && (
                <p className="text-xs text-red-500">
                  {validationErrors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="last-name">{t("booking.form.lastName")}</Label>
              <Input
                id="last-name"
                className={`shadow-none h-10 rounded-lg ${
                  validationErrors.lastName ? "border-red-500" : ""
                }`}
                value={formData.lastName}
                onChange={(e) => onUpdateFormData({ lastName: e.target.value })}
                required
              />
              {validationErrors.lastName && (
                <p className="text-xs text-red-500">
                  {validationErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="email">{t("booking.form.email")}</Label>
            <Input
              id="email"
              type="email"
              className={`shadow-none h-10 rounded-lg ${
                validationErrors.email ? "border-red-500" : ""
              }`}
              value={formData.email}
              onChange={(e) => onUpdateFormData({ email: e.target.value })}
              required
            />
            {validationErrors.email && (
              <p className="text-xs text-red-500">{validationErrors.email}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="phone">{t("booking.form.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              className={`shadow-none h-10 rounded-lg ${
                validationErrors.phone ? "border-red-500" : ""
              }`}
              value={formData.phone}
              onChange={(e) => onUpdateFormData({ phone: e.target.value })}
              required
            />
            {validationErrors.phone && (
              <p className="text-xs text-red-500">{validationErrors.phone}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label
              htmlFor="drivers-license"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4 text-primary" />
              {t("booking.form.driversLicense")}
            </Label>
            <Input
              id="drivers-license"
              value={formData.driversLicense}
              className={`shadow-none h-10 rounded-lg ${
                validationErrors.driversLicense ? "border-red-500" : ""
              }`}
              onChange={(e) =>
                onUpdateFormData({ driversLicense: e.target.value })
              }
              required
            />
            {validationErrors.driversLicense && (
              <p className="text-xs text-red-500">
                {validationErrors.driversLicense}
              </p>
            )}
            <p className="text-xs text-gray-500">
              {t("booking.form.driversLicenseInfo")}
            </p>
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="terms"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) =>
                onUpdateFormData({ termsAccepted: checked as boolean })
              }
              required
            />
            <div className="ms-1">
              <Label
                htmlFor="terms"
                className="cursor-pointer text-[13px] -mt-[1px]"
              >
                {t("booking.terms.agree")}
              </Label>
              <p className="text-xs mt-0.5 text-gray-500">
                {t("booking.terms.details")}
              </p>
              {validationErrors.terms && (
                <p className="text-xs text-red-500">{validationErrors.terms}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="justify-end">
          <Button
            type="submit"
            disabled={
              !formData.firstName ||
              !formData.lastName ||
              !formData.email ||
              !formData.driversLicense ||
              !formData.termsAccepted
            }
            onClick={onConfirm}
          >
            {t("booking.submit.toPayment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
