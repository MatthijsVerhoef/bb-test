import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { RentalManagementProps, RentalStatus, DamageStatus } from "./types";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getPaymentStatusColor,
  truncateDescription,
} from "./utils";
import { StatusBadge } from "./components/StatusBadge";
import { useEffect, useState } from "react";

export function RentalManagementDialog({
  rental,
  role,
  onClose,
  onStatusUpdate,
  onExtendRental,
  onAddDamageReport,
}: RentalManagementProps) {
  const [activeTab, setActiveTab] = useState<"status" | "damage">("status");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState<RentalStatus | string>(
    rental.status
  );

  // Debug status change
  useEffect(() => {
    console.log("Current status:", rental.status);
    console.log("Selected status:", newStatus);
  }, [rental.status, newStatus]);

  // Damage report state
  const [damageDescription, setDamageDescription] = useState("");
  const [damageStatus, setDamageStatus] = useState<DamageStatus>(
    DamageStatus.MINOR
  );
  const [repairCost, setRepairCost] = useState<string>("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleStatusUpdate = async () => {
    if (
      !newStatus ||
      newStatus === rental.status ||
      (role !== "LESSOR" && role !== "ADMIN" && role !== "SUPPORT")
    ) {
      return;
    }

    setLoading(true);
    try {
      await onStatusUpdate(rental.id, newStatus, notes);
      onClose();
    } catch (error) {
      console.error("Error updating rental status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create previews for selected files before uploading
  const createPreviewsAndUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0) return;

    // Reset error state
    setUploadError(null);

    // Check number of files
    const selectedFiles = Array.from(event.target.files);
    const remainingSlots = 3 - photoUrls.length;
    const filesToProcess = selectedFiles.slice(0, remainingSlots);

    if (selectedFiles.length > remainingSlots) {
      setUploadError(
        `Maximaal 3 foto's toegestaan. Alleen de eerste ${remainingSlots} worden geüpload.`
      );
    }

    // Check file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = filesToProcess.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      setUploadError(`Bestand(en) te groot. Maximale bestandsgrootte is 5MB.`);
      return;
    }

    // Create object URLs for previews
    const newPreviewUrls = filesToProcess.map((file) =>
      URL.createObjectURL(file)
    );
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

    // Start upload
    await handleFileUpload(filesToProcess, event);
  };

  // Cleanup previews when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all object URLs to avoid memory leaks
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleFileUpload = async (
    files: File[],
    event: React.ChangeEvent<HTMLInputElement> | null = null
  ) => {
    if (files.length === 0) return;

    setLoading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Add the rental ID for organization in the cloud
      formData.append("rentalId", rental.id);

      setUploadProgress(30);

      console.log(
        "Uploading files to /api/upload/damage-photos:",
        files.map((f) => `${f.name} (${Math.round(f.size / 1024)}KB)`)
      );

      const response = await fetch("/api/upload/damage-photos", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload images");
      }

      const data = await response.json();
      console.log("Upload response:", data);

      setUploadProgress(100);

      // Add the new photo URLs to the existing ones
      const newUrls = data.images
        .filter((img: any) => !img.error)
        .map((img: any) => img.url);

      // Clear previews after successful upload
      setPreviewUrls([]);
      setPhotoUrls((prev) => [...prev, ...newUrls]);

      // Reset the file input
      if (event) event.target.value = "";

      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error("Error uploading photos:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload images"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddDamageReport = async () => {
    if (!damageDescription) {
      return;
    }

    setLoading(true);
    try {
      // Truncate the description if it's too long
      const shortenedDescription = truncateDescription(damageDescription);

      console.log("Submitting damage report with data:", {
        description: `${shortenedDescription.substring(0, 50)}... (${
          shortenedDescription.length
        } chars)`,
        damageStatus,
        photoCount: photoUrls.length,
        repairCost: repairCost ? parseFloat(repairCost) : undefined,
      });

      // First submit to our API
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
      console.log("Damage report submission successful:", result);

      // If we have a callback function from the parent, call it
      if (onAddDamageReport) {
        await onAddDamageReport(rental.id, {
          description: shortenedDescription,
          damageStatus,
          repairCost: repairCost ? parseFloat(repairCost) : undefined,
          date: new Date(),
          resolved: false,
          photoUrls,
        });
      }

      // Reset form
      setDamageDescription("");
      setDamageStatus(DamageStatus.MINOR);
      setRepairCost("");
      setPhotoUrls([]);
      setPreviewUrls([]);
      setActiveTab("status");

      // Close dialog
      onClose();
    } catch (error) {
      console.error("Error adding damage report:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Failed to submit damage report"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-md md:max-w-lg max-h-[90vh] p-0 flex flex-col rounded-2xl overflow-hidden">
      <DialogHeader className="p-8 pb-2">
        <DialogTitle>Beheer verhuring</DialogTitle>
        <DialogDescription>
          Update de status of beheer deze boeking
        </DialogDescription>
      </DialogHeader>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
        className="w-full flex flex-col flex-1 overflow-hidden"
      >
        <TabsList className="grid mb-2 grid-cols-2 mx-8 gap-x-2 bg-white shrink-0 h-[43px]">
          <TabsTrigger
            className="data-[state=active]:bg-[#222222] data-[state=active]:text-white rounded-full bg-gray-100 px-4 shadow-none text-[13px] cursor-pointer hover:bg-[#222222] hover:text-white data-[state=active]:cursor-default transition"
            value="status"
          >
            Status
          </TabsTrigger>
          <TabsTrigger
            value="damage"
            className="data-[state=active]:bg-[#222222] data-[state=active]:text-white py-2 rounded-full bg-gray-100 px-4 shadow-none text-[13px] cursor-pointer hover:bg-[#222222] hover:text-white data-[state=active]:cursor-default transition"
          >
            Schade opgeven
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="status"
          className="space-y-4 overflow-y-auto flex-1 px-8 pb-8"
        >
          <div className="flex items-center justify-between bg-gray-100 py-2 px-3 rounded-md">
            <div>
              <h3 className="font-medium text-sm">{rental.trailerTitle}</h3>
              <p className="text-sm text-muted-foreground">
                Reservering: #{rental.id.substring(0, 8)}
              </p>
            </div>
            <StatusBadge status={rental.status} className="bg-white" />
          </div>

          <div className="space-y-2 px-3 py-3 border rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Huurder:</span>
              <span className="font-medium">
                {rental.renter?.firstName} {rental.renter?.lastName}
              </span>
            </div>
            <div className="flex justify-between text-sm pb-4 border-b">
              <span className="font-medium">Huurperiode:</span>
              <span className="font-medium">
                {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-4">
              <span>Totale kosten:</span>
              <span className="font-medium">
                {formatCurrency(rental.totalPrice)}
              </span>
            </div>
            {rental.payment && (
              <div className="flex justify-between text-sm">
                <span>Betaal status:</span>
                <Badge
                  variant={getPaymentStatusColor(rental.payment.status) as any}
                  className="text-xs"
                >
                  {String(rental.payment.status).replace("_", " ")}
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Update status</Label>
            <div className="mt-3 mb-6">
              <select
                value={newStatus}
                onChange={(e) => {
                  console.log("Selected new value:", e.target.value);
                  setNewStatus(e.target.value as RentalStatus);
                }}
                className="w-full rounded-lg shadow-none min-h-11 border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {/* Dutch translations for statuses */}
                {(() => {
                  const dutchStatusMap: Record<string, string> = {
                    PENDING: "In afwachting",
                    CONFIRMED: "Bevestigd",
                    ACTIVE: "Actief",
                    CANCELLED: "Geannuleerd",
                    COMPLETED: "Voltooid",
                    LATE_RETURN: "Verlate teruggave",
                    DISPUTED: "In geschil",
                  };

                  /* Current status */
                  return (
                    <>
                      <option value={rental.status}>
                        {dutchStatusMap[rental.status] ||
                          rental.status.replace("_", " ")}{" "}
                        (Huidige status)
                      </option>

                      {/* Status transitions based on current status */}
                      {rental.status === RentalStatus.PENDING && (
                        <>
                          <option value={RentalStatus.CONFIRMED}>
                            Bevestigen
                          </option>
                          <option value={RentalStatus.CANCELLED}>
                            Annuleren
                          </option>
                        </>
                      )}
                      {rental.status === RentalStatus.CONFIRMED && (
                        <>
                          <option value={RentalStatus.ACTIVE}>
                            Markeren als Actief
                          </option>
                          <option value={RentalStatus.CANCELLED}>
                            Annuleren
                          </option>
                        </>
                      )}
                      {rental.status === RentalStatus.ACTIVE && (
                        <>
                          <option value={RentalStatus.COMPLETED}>
                            Markeren als Voltooid
                          </option>
                          <option value={RentalStatus.LATE_RETURN}>
                            Markeren als Verlate teruggave
                          </option>
                          <option value={RentalStatus.DISPUTED}>
                            Markeren als In geschil
                          </option>
                        </>
                      )}
                      {rental.status === RentalStatus.LATE_RETURN && (
                        <>
                          <option value={RentalStatus.COMPLETED}>
                            Markeren als Voltooid
                          </option>
                          <option value={RentalStatus.DISPUTED}>
                            Markeren als In geschil
                          </option>
                        </>
                      )}
                      {rental.status === RentalStatus.DISPUTED && (
                        <>
                          <option value={RentalStatus.COMPLETED}>
                            Oplossen & Voltooien
                          </option>
                        </>
                      )}
                      {rental.status === RentalStatus.CANCELLED && (
                        <>
                          <option value={RentalStatus.PENDING}>
                            Heractiveren (In afwachting)
                          </option>
                          <option value={RentalStatus.CONFIRMED}>
                            Heractiveren & Bevestigen
                          </option>
                        </>
                      )}
                    </>
                  );
                })()}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notities (optioneel)</Label>
              <Textarea
                id="notes"
                className="bg-gray-100 h-[120px] resize-none mt-4 border-0 px-4 py-3"
                placeholder="Voeg een notitie voor deze verhuring toe..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              className="w-full mt-2"
              onClick={handleStatusUpdate}
              disabled={loading || !newStatus || newStatus === rental.status}
            >
              Update Status
            </Button>
          </div>
        </TabsContent>

        <TabsContent
          value="damage"
          className="space-y-4 overflow-y-auto flex-1 px-8 pb-8"
        >
          <div className="space-y-4">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="damage-photos">
                  Afbeeldingen (Optioneel, max 3)
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {/* Display already uploaded images */}
                  {photoUrls.map((url, index) => (
                    <div
                      key={`uploaded-${index}`}
                      className="relative h-32 rounded-md overflow-hidden"
                    >
                      <Image
                        src={url}
                        alt={`Damage photo ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                        onClick={() => {
                          const newUrls = [...photoUrls];
                          newUrls.splice(index, 1);
                          setPhotoUrls(newUrls);
                        }}
                      >
                        &times;
                      </Button>
                    </div>
                  ))}

                  {/* Display preview images that are being uploaded */}
                  {previewUrls.map((url, index) => (
                    <div
                      key={`preview-${index}`}
                      className="relative h-32 rounded-md overflow-hidden"
                    >
                      <Image
                        src={url}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </div>
                  ))}

                  {/* Upload button (shown if we have less than 3 total images) */}
                  {photoUrls.length + previewUrls.length < 3 && (
                    <label
                      className="border border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                      htmlFor="damage-photos-upload"
                    >
                      <ImageIcon strokeWidth={1.5} />
                      <span className="mt-1.5 text-sm font-medium">
                        Foto's uploaden
                      </span>
                    </label>
                  )}
                </div>
                <input
                  type="file"
                  id="damage-photos-upload"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  multiple={photoUrls.length + previewUrls.length < 2}
                  onChange={createPreviewsAndUpload}
                />
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300 ease-in-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                {uploadError && (
                  <div className="text-xs text-red-500 mt-1">{uploadError}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="damage-description">Omschrijving</Label>
                <Textarea
                  id="damage-description"
                  className="h-[130px] resize-none shadow-none rounded-lg mt-3"
                  placeholder="Omschrijf de schade..."
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="damage-status">Ernst</Label>
                <Select
                  value={damageStatus}
                  onValueChange={(value) =>
                    setDamageStatus(value as DamageStatus)
                  }
                >
                  <SelectTrigger
                    id="damage-status"
                    className="min-h-11 shadow-none rounded-lg mt-3 w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DamageStatus.MINOR}>Minimaal</SelectItem>
                    <SelectItem value={DamageStatus.MODERATE}>
                      Gemiddeld
                    </SelectItem>
                    <SelectItem value={DamageStatus.SEVERE}>Ernstig</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repair-cost">Reparatiekosten (optioneel)</Label>
                <Input
                  id="repair-cost"
                  placeholder="0.00"
                  type="number"
                  min="0"
                  step="0.01"
                  value={repairCost}
                  className="h-11 shadow-none rounded-lg mt-3"
                  onChange={(e) => setRepairCost(e.target.value)}
                />
              </div>

              <Button
                className="w-full mt-2"
                onClick={handleAddDamageReport}
                disabled={loading || !damageDescription}
              >
                Verstuur schade rapport
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter className="px-8 pt-0 pb-4 shrink-0">
        <Button variant="outline" onClick={onClose}>
          Sluiten
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
