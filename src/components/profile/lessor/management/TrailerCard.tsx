// components/TrailerCard.tsx
import React, { useState, useCallback, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Truck,
  Edit,
  Eye,
  Loader2,
  Trash,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { TrailerData } from "@/types/trailer";
import { checkTrailerCompleteness } from "@/lib/utils/trailer-utils";
import { useTranslation } from "@/lib/i18n/client";

interface TrailerCardProps {
  trailer: TrailerData;
  getStatusBadge: (status: string) => JSX.Element;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onStatusChange: (id: string, newStatus: string) => void;
  onHover?: () => void;
}

const TrailerCard = memo(function TrailerCard({
  trailer,
  getStatusBadge,
  onEdit,
  onDelete,
  onStatusChange,
  onHover,
}: TrailerCardProps) {
  const { t } = useTranslation("profile");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [isCheckingRentals, setIsCheckingRentals] = useState(false);
  const [hasActiveRentals, setHasActiveRentals] = useState(false);
  const { toast } = useToast();

  const completeness = checkTrailerCompleteness(trailer);

  // Check active rentals with caching
  const checkActiveRentals = useCallback(async () => {
    const cacheKey = `rentals-check-${trailer.id}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      const { hasRentals, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return hasRentals;
      }
    }

    try {
      setIsCheckingRentals(true);
      const response = await fetch(`/api/trailers/${trailer.id}/availability`);

      if (!response.ok) return false;

      const data = await response.json();
      const hasActiveRentals =
        data.rentals?.some(
          (rental: any) =>
            rental.status === "ACTIVE" || rental.status === "CONFIRMED"
        ) || false;

      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ hasRentals: hasActiveRentals, timestamp: Date.now() })
      );

      return hasActiveRentals;
    } catch {
      return false;
    } finally {
      setIsCheckingRentals(false);
    }
  }, [trailer.id]);

  const handleStatusToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (trailer.status === "ACTIVE") {
        const activeRentals = await checkActiveRentals();
        setHasActiveRentals(activeRentals);
        setConfirmDeactivateOpen(true);
      } else {
        onStatusChange(trailer.id, "ACTIVE");
      }
    },
    [trailer.status, trailer.id, checkActiveRentals, onStatusChange, toast]
  );

  const handleConfirmDeactivate = useCallback(() => {
    onStatusChange(trailer.id, "DEACTIVATED");
    setConfirmDeactivateOpen(false);
  }, [trailer.id, onStatusChange, toast]);

  const handleActionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  // Handle card hover for prefetching
  const handleMouseEnter = useCallback(() => {
    onHover?.();
  }, [onHover]);

  return (
    <>
      <Card
        className="rounded-none border-0 w-full shadow-none p-0 cursor-pointer transition-colors"
        onClick={() => setDialogOpen(true)}
        onMouseEnter={handleMouseEnter}
      >
        <CardContent className="p-0 pb-2 flex flex-col items-start w-full">
          <div className="flex relative flex-col items-center sm:flex-row gap-6 w-full">
            {/* Trailer image */}
            <div className="relative w-full sm:w-28 h-46 sm:h-18 rounded-md overflow-hidden bg-gray-100">
              {trailer.mainImage ? (
                <Image
                  src={trailer.mainImage}
                  alt={trailer.title}
                  fill
                  className="object-cover"
                  sizes="112px"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YxZjFmMSIvPjwvc3ZnPg=="
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Truck className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Trailer information */}
            <div className="flex-1 flex flex-col w-full relative">
              <div className="flex flex-col items-start mb-0.5 w-full">
                <h3 className="font-medium">{trailer.title}</h3>
                <p className="text-[13px] text-gray-500">
                  {trailer.type || t("trailerManagement.card.generalTrailer")}
                  {trailer.location && ` • ${trailer.location}`}
                </p>
              </div>

              {completeness.isComplete && trailer.rentalCount !== undefined && (
                <div className="flex items-center text-[13px] text-gray-500 mt-2">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  <span>
                    {trailer.rentalCount}{" "}
                    {trailer.rentalCount === 1
                      ? t("trailerManagement.card.rental")
                      : t("trailerManagement.card.rentals")}
                  </span>
                </div>
              )}

              <div className="block md:hidden">
                {!trailer.isDraft && completeness.isComplete && (
                  <div
                    className="flex absolute top-0 right-0 items-center gap-2"
                    onClick={handleActionClick}
                  >
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {t("trailerManagement.card.active")}
                    </span>
                    {isCheckingRentals ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : (
                      <Switch
                        checked={trailer.status === "ACTIVE"}
                        onCheckedChange={() => {}}
                        onClick={handleStatusToggle}
                        disabled={isCheckingRentals}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {trailer.status === "DRAFT" && (
              <div className="flex absolute top-0 left-0 mt-4 ml-3 md:mt-0 md:ml-3 md:relative flex-col gap-1">
                {getStatusBadge(trailer.status)}
              </div>
            )}

            {/* Status toggle */}
            {!trailer.isDraft && completeness.isComplete && (
              <div
                className="hidden md:flex items-center gap-2"
                onClick={handleActionClick}
              >
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {t("trailerManagement.card.active")}
                </span>
                {isCheckingRentals ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : (
                  <Switch
                    checked={trailer.status === "ACTIVE"}
                    onCheckedChange={() => {}}
                    onClick={handleStatusToggle}
                    disabled={isCheckingRentals}
                  />
                )}
              </div>
            )}

            <Button
              variant="outline"
              className="size-10 absolute top-0 right-0 mt-2 mr-2 md:mr-0 md:mt-0 md:relative rounded-full"
              onClick={onEdit}
            >
              <Edit size={20} strokeWidth={1.5} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[350px] shadow-xl flex flex-col items-center justify-center rounded-3xl m-0 pt-8 pb-8">
          <DialogTitle className="sr-only">Trailer acties</DialogTitle>

          <div className="relative w-36 h-32 rounded-xl overflow-hidden mb-4">
            {trailer.mainImage ? (
              <Image
                src={trailer.mainImage}
                alt={trailer.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          <p className="text-md font-medium text-center">{trailer.title}</p>
          {trailer.location && (
            <span className="text-center text-sm text-gray-500 -mt-4 mb-2">
              {trailer.location}
            </span>
          )}

          {!completeness.isComplete && (
            <div className="mb-0 px-3 py-2 w-full bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700 text-sm">
                <AlertTriangle className="h-4 w-4" />
                {t("trailerManagement.card.incompleteWarning")}
              </div>
            </div>
          )}

          <div className="space-y-2 w-full">
            <Button
              className={`rounded-full h-12 w-full ${
                (!completeness.isComplete || trailer.isDraft) &&
                "bg-primary hover:bg-primary/80"
              }`}
              onClick={onEdit}
            >
              <Edit className="mr-2 h-4 w-4" />
              {trailer.isDraft
                ? t("trailerManagement.card.completeDraft")
                : !completeness.isComplete
                ? t("trailerManagement.card.completeListing")
                : t("trailerManagement.card.editListing")}
            </Button>

            {!trailer.isDraft && (
              <Link href={`/aanbod/${trailer.id}`} passHref>
                <Button
                  variant="outline"
                  className="rounded-full h-12 w-full"
                  onClick={handleActionClick}
                  disabled={!completeness.isComplete}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {t("trailerManagement.card.viewListing")}
                </Button>
              </Link>
            )}

            <Button
              variant="outline"
              className="rounded-full mt-2 h-12 w-full text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash className="mr-2 h-4 w-4" />
              {t("trailerManagement.card.deleteListing")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivation Confirmation Dialog */}
      <Dialog
        open={confirmDeactivateOpen}
        onOpenChange={setConfirmDeactivateOpen}
      >
        <DialogContent className="max-w-md rounded-2xl p-8">
          <DialogTitle>
            {t("trailerManagement.deactivateDialog.title")}
          </DialogTitle>
          <p>{t("trailerManagement.deactivateDialog.confirmation")}</p>

          {hasActiveRentals && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700 mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">
                  {t("trailerManagement.deactivateDialog.activeRentalsWarning")}
                </span>
              </div>
              <p className="text-sm text-orange-600">
                {t("trailerManagement.deactivateDialog.activeRentalsMessage")}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDeactivateOpen(false)}
            >
              {t("trailerManagement.deactivateDialog.cancel")}
            </Button>
            <Button variant="default" onClick={handleConfirmDeactivate}>
              {t("trailerManagement.deactivateDialog.deactivate")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default TrailerCard;
