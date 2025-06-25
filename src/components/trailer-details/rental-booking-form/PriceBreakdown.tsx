import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/client";
import { PricingService } from "@/services/pricing.service";

interface PriceBreakdownProps {
  basePrice: number;
  totalPrice: number;
  rentalDays: number;
  pricePerDay: number;
  needsDelivery: boolean;
  deliveryFee?: number | null;
  securityDeposit?: number | null;
  insuranceFee?: number | null;
  discountAmount?: number | null;
  serviceFee?: number;
}

export default function PriceBreakdown({
  basePrice,
  totalPrice,
  rentalDays,
  pricePerDay,
  needsDelivery,
  deliveryFee,
  securityDeposit,
  insuranceFee,
  discountAmount,
  serviceFee,
}: PriceBreakdownProps) {
  const { t } = useTranslation("trailer");

  const renterServiceFee =
    serviceFee ?? PricingService.calculateRenterServiceFee(basePrice);

  return (
    <>
      <Separator className="my-2" />
      <div className="space-y-3">
        <div className="space-y-2 mt-4 mb-4 text-sm">
          <div className="flex justify-between">
            <span>
              {t("booking.pricing.perDay", {
                price: pricePerDay.toFixed(2),
                days: rentalDays,
              })}
            </span>
            <span>€{basePrice.toFixed(2)}</span>
          </div>

          {/* Service fee - 5% for renters */}
          <div className="flex justify-between">
            <span>{t("booking.pricing.serviceFee")} (5%)</span>
            <span>€{renterServiceFee.toFixed(2)}</span>
          </div>

          {/* Delivery fee */}
          {needsDelivery && deliveryFee && (
            <div className="flex justify-between">
              <span>{t("booking.pricing.deliveryCosts")}</span>
              <span>€{deliveryFee.toFixed(2)}</span>
            </div>
          )}

          {/* Insurance fee */}
          {insuranceFee && insuranceFee > 0 && (
            <div className="flex justify-between">
              <span>{t("booking.pricing.insurance")}</span>
              <span>€{insuranceFee.toFixed(2)}</span>
            </div>
          )}

          {/* Discount */}
          {discountAmount && discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>{t("booking.pricing.discount")}</span>
              <span>-€{discountAmount.toFixed(2)}</span>
            </div>
          )}

          {/* Security deposit - shown separately as it's refundable */}
          {securityDeposit && securityDeposit > 0 && (
            <>
              {/* <Separator className="my-2" /> */}
              <div className="flex justify-between text-gray-600">
                <div className="flex items-center gap-2">
                  <span>{t("booking.pricing.deposit")}</span>
                </div>
                <span>€{securityDeposit.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        <Separator className="mt-2 mb-3" />

        <div className="flex justify-between font-semibold">
          <span>{t("booking.pricing.total")}</span>
          <span>€{totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </>
  );
}
