import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getPaymentStatusColor } from "../utils";
import { RentalData } from "../types";

interface PaymentSummaryProps {
  rental: RentalData;
  showStatus?: boolean;
  className?: string;
}

export function PaymentSummary({
  rental,
  showStatus = true,
  className = "",
}: PaymentSummaryProps) {
  const durationDays = Math.ceil(
    (new Date(rental.endDate).getTime() -
      new Date(rental.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const basePrice =
    rental.totalPrice -
    (rental.serviceFee || 0) -
    (rental.insuranceFee || 0) -
    (rental.deliveryFee || 0) +
    (rental.discountAmount || 0);

  return (
    <div className={`bg-muted p-4 rounded-lg ${className}`}>
      <h4 className="font-semibold mb-2 text-sm">Betalingsoverzicht</h4>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            Huurkosten ({durationDays} {durationDays === 1 ? "dag" : "dagen"})
          </span>
          <span>{formatCurrency(basePrice)}</span>
        </div>

        {rental.serviceFee && rental.serviceFee > 0 && (
          <div className="flex justify-between text-sm">
            <span>Servicekosten</span>
            <span>{formatCurrency(rental.serviceFee)}</span>
          </div>
        )}

        {rental.insuranceFee && rental.insuranceFee > 0 && (
          <div className="flex justify-between text-sm">
            <span>Verzekering</span>
            <span>{formatCurrency(rental.insuranceFee)}</span>
          </div>
        )}

        {rental.deliveryFee && rental.deliveryFee > 0 && (
          <div className="flex justify-between text-sm">
            <span>Aflever kosten</span>
            <span>{formatCurrency(rental.deliveryFee)}</span>
          </div>
        )}

        {rental.discountAmount && rental.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Korting</span>
            <span>-{formatCurrency(rental.discountAmount)}</span>
          </div>
        )}

        {rental.securityDeposit && rental.securityDeposit > 0 && (
          <div className="flex justify-between text-sm">
            <span>Borg</span>
            <span>{formatCurrency(rental.securityDeposit)}</span>
          </div>
        )}

        <Separator />
        <div className="flex justify-between font-semibold text-sm">
          <span>Totaal</span>
          <span>{formatCurrency(rental.totalPrice)}</span>
        </div>

        {showStatus && rental.payment && (
          <div className="mt-2 flex justify-between items-center text-sm">
            <span>Status</span>
            <Badge
              variant={getPaymentStatusColor(rental.payment.status) as any}
              className="bg-white"
            >
              {String(rental.payment.status).replace("_", " ")}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
