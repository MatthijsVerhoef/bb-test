import { useState } from "react";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CancellationProps, RentalStatus } from "./types";
import { formatDate, formatCurrency } from "./utils";

export function RentalCancellationDialog({
  rental,
  role,
  onClose,
  onCancel,
}: CancellationProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (
      rental.status !== RentalStatus.CONFIRMED &&
      rental.status !== RentalStatus.PENDING
    ) {
      return;
    }

    setLoading(true);
    try {
      // Call the onCancel function passed from parent
      const result = await onCancel(rental.id, reason);
      console.log("Rental successfully cancelled:", result);
      onClose();
    } catch (error) {
      console.error("Error cancelling rental:", error);
      alert(
        "Er is een fout opgetreden bij het annuleren van je reservering. Probeer het later opnieuw."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialogContent className="rounded-2xl p-8">
      <AlertDialogHeader>
        <AlertDialogTitle onClick={() => console.log(rental)}>
          Annuleer reservering
        </AlertDialogTitle>
        <AlertDialogDescription>
          Weet u zeker dat u uw reservering wilt annuleren? Na annulering kan
          deze niet meer hersteld worden.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="pb-4 pt-2 space-y-4">
        <div className="bg-muted flex items-center p-2 rounded-lg">
          <img
            alt={rental.trailerTitle}
            src={rental.trailerImage || undefined}
            className="w-26 h-18 rounded-md"
          />
          <div className="flex flex-col ms-3">
            <h3 className="font-medium text-sm">{rental.trailerTitle}</h3>
            <p className="text-sm mt-1">
              {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
            </p>
            <p className="font-medium text-sm mt-1">
              Huurprijs: {formatCurrency(rental.totalPrice)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cancellation-reason">Geef een reden op</Label>
          <Textarea
            id="cancellation-reason"
            className="shadow-none resize-none h-[140px] rounded-lg p-4"
            placeholder="Geef een reden voor annulering op..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {rental?.trailer?.cancellationPolicy && (
            <div className="bg-[#F7F7F7] p-3 rounded-lg font-medium text-[13px]">
              {rental.trailer.cancellationPolicy === "flexible" ? (
                <span>
                  Flexibele annuleringsvoorwaarden, volledige terugbetaling tot
                  24 uur van te voren
                </span>
              ) : rental.trailer.cancellationPolicy === "moderate" ? (
                <span>
                  Gemiddelde annuleringsvoorwaarden, volledige terugbetaling tot
                  3 dagen van te voren
                </span>
              ) : (
                <span>
                  Strikte annuleringsvoorwaarden, 50% terug tot 7 dagen van te
                  voren.
                </span>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Houd er rekening mee dat onze annuleringsvoorwaarden van toepassing
            kunnen zijn. Raadpleeg de algemene voorwaarden voor meer informatie.
          </p>
        </div>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel onClick={onClose} disabled={loading}>
          Behoud reservering
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={handleCancel}
          disabled={loading || !reason.trim()}
          className="bg-[#222222] text-white"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Bezig met annuleren...
            </>
          ) : (
            "Annuleer reservering"
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
