import { useState } from "react";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ImageUploadField } from "@/components/constants/imageUploadField";
import { DamageReportDialogProps, DamageStatus } from "./types";
import { truncateDescription } from "./utils";

export function DamageReportDialog({
  rental,
  role,
  onClose,
  onSubmitDamage,
}: DamageReportDialogProps) {
  const [description, setDescription] = useState("");
  const [damageStatus, setDamageStatus] = useState<DamageStatus>(
    DamageStatus.MINOR
  );
  const [loading, setLoading] = useState(false);
  const [repairCost, setRepairCost] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ id: string; url?: string; preview: string }>
  >([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleImageUpload = async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    // Add the rental ID for organization in the cloud
    formData.append("rentalId", rental.id);

    const response = await fetch("/api/upload/damage-photos", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload images");
    }

    const data = await response.json();

    return data;
  };

  const handleSubmit = async () => {
    if (!description) return;

    setLoading(true);
    setSubmitError(null);

    try {
      // Truncate the description if it's too long
      const shortenedDescription = truncateDescription(description);

      // Get the uploaded photo URLs
      const photoUrls = uploadedImages
        .filter((img) => img.url)
        .map((img) => img.url!);

      // Submit the damage report to our API
      const response = await fetch(`/api/rentals/${rental.id}/damage-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: shortenedDescription,
          damageStatus,
          photoUrls,
          repairCost: repairCost ? parseFloat(repairCost) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from damage report API:", errorData);
        throw new Error(errorData.error || "Failed to submit damage report");
      }

      const result = await response.json();

      // If we have a callback function, call it
      if (onSubmitDamage) {
        await onSubmitDamage(rental.id, {
          description,
          damageStatus,
          date: new Date(),
          photoUrls,
          resolved: false,
        });
      }

      onClose();
    } catch (error) {
      console.error("Error submitting damage report:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to submit damage report"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-md max-h-[90vh] p-0 flex flex-col rounded-2xl overflow-hidden">
      <DialogHeader className="p-8 pb-2">
        <DialogTitle>Schade melden</DialogTitle>
        <DialogDescription>
          Dien een schaderapport in voor deze aanhanger huur.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4 overflow-y-auto px-8 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{rental.trailerTitle}</h3>
            <p className="text-sm text-muted-foreground">
              Reservering #{rental.id.substring(0, 8)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="damage-description">Schade omschrijving*</Label>
          <Textarea
            id="damage-description"
            placeholder="Geef een gedetailleerde omschrijving op..."
            className="h-[140px] shadow-none rounded-lg resize-none p-4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="damage-severity">Ernst van de schade*</Label>
          <Select
            value={damageStatus}
            onValueChange={(value) => setDamageStatus(value as DamageStatus)}
          >
            <SelectTrigger
              id="damage-severity"
              className="shadow-none w-[140px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DamageStatus.MINOR}>Minimaal</SelectItem>
              <SelectItem value={DamageStatus.MODERATE}>Gematigd</SelectItem>
              <SelectItem value={DamageStatus.SEVERE}>Ernstig</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Using the reusable ImageUploadField component */}
        <ImageUploadField
          label="Foto's (optioneel, max 3)"
          description="Upload tot 3 schade foto's (JPEG, PNG of WebP, max. 5MB per foto)"
          maxFiles={3}
          maxSizeInMB={5}
          acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
          onUpload={handleImageUpload}
          onImagesChange={setUploadedImages}
          gridCols={3}
          imageSize="md"
          showProgress={true}
        />

        {/* Display any submit errors */}
        {submitError && (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
            {submitError}
          </div>
        )}
      </div>

      <DialogFooter className="px-8 py-4 border-t shrink-0">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Annuleren
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !description}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Versturen...
            </>
          ) : (
            "Verstuur rapport"
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
