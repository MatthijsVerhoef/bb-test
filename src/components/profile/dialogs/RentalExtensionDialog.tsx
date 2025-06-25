import { useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExtensionDialogProps } from "./types";
import { formatDate, getStatusColor } from "./utils";
import { StatusBadge } from "./components/StatusBadge";

export function RentalExtensionDialog({
  rental,
  role,
  onClose,
  onExtend,
}: ExtensionDialogProps) {
  const [newEndDate, setNewEndDate] = useState<Date | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExtend = async () => {
    if (!newEndDate || newEndDate <= new Date(rental.endDate)) {
      return;
    }

    setLoading(true);
    try {
      await onExtend(rental.id, newEndDate, note);
      onClose();
    } catch (error) {
      console.error("Error extending rental:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Extend Rental Period</DialogTitle>
        <DialogDescription>
          Request to extend your current rental period
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{rental.trailerTitle}</h3>
            <p className="text-sm text-muted-foreground">
              Current end date: {formatDate(rental.endDate)}
            </p>
          </div>
          <StatusBadge status={rental.status} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-end-date">New End Date</Label>
          <div className="flex space-x-2">
            <Input
              id="new-end-date"
              type="date"
              min={new Date(rental.endDate).toISOString().split("T")[0]}
              onChange={(e) => {
                if (e.target.value) {
                  setNewEndDate(new Date(e.target.value));
                } else {
                  setNewEndDate(null);
                }
              }}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            New end date must be after the current end date
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="extension-note">
            Reason for Extension (Optional)
          </Label>
          <Textarea
            id="extension-note"
            placeholder="Please provide a reason for the extension..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Extension Fee Estimate</h4>
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              The extension fee will be calculated based on the daily rate and
              the number of additional days. You will be notified of the exact
              amount after your request is reviewed.
            </p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleExtend}
          disabled={
            loading || !newEndDate || newEndDate <= new Date(rental.endDate)
          }
        >
          Request Extension
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
