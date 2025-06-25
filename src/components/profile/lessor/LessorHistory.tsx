"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import {
  Truck,
  CalendarDays,
  Star,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";
import Image from "next/image";
import {
  RentalDetailsDialog,
  RentalManagementDialog,
} from "@/components/profile/dialogs";

// Using enums from your Prisma schema
enum RentalStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  LATE_RETURN = "LATE_RETURN",
  DISPUTED = "DISPUTED",
}

// Type Definitions
interface RentalData {
  id: string;
  startDate: Date;
  endDate: Date;
  status: RentalStatus | string;
  totalPrice: number;
  trailerId: string;
  trailerTitle: string;
  trailerImage: string | null;
  pickupLocation?: string;
  dropoffLocation?: string;
  renter?: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    email?: string;
    id: string;
  };
  lessor?: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    email?: string;
    id: string;
  };
  serviceFee?: number;
  insuranceFee?: number;
  deliveryFee?: number;
  securityDeposit?: number;
  actualReturnDate?: Date;
  needsDelivery?: boolean;
  specialNotes?: string;
  cancellationReason?: string;
  cancellationDate?: Date;
  payment?: any;
  damageReports?: any[];
  insuranceClaims?: any[];
  pickupChecklist?: any[];
  returnChecklist?: any[];
  rentalExtensions?: any[];
  insurancePolicy?: any;
  trailer?: any;
  renterId: string;
  lessorId: string;
}

interface LessorHistoryProps {
  userId: string;
  initialRentals?: RentalData[];
  initialCounts?: {
    upcoming: number;
    current: number;
    past: number;
  };
  isLoading?: boolean; // Allow parent to control loading state
  onStatusUpdate?: (
    rentalId: string,
    newStatus: string,
    note?: string
  ) => Promise<void>;
  onAddDamageReport?: (rentalId: string, damageReport: any) => Promise<void>;
  onViewDetails?: (rental: RentalData) => void;
  onManageBooking?: (rental: RentalData) => void;
}

export default function LessorHistory({
  userId,
  initialRentals = [],
  initialCounts = { upcoming: 0, current: 0, past: 0 },
  isLoading: parentIsLoading = false, // Use parent's loading state
  onStatusUpdate = async () => {},
  onAddDamageReport = async () => {},
  onViewDetails,
  onManageBooking,
}: LessorHistoryProps) {
  // State management
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedRental, setSelectedRental] = useState<RentalData | null>(null);
  const [dialogState, setDialogState] = useState({
    details: false,
    manage: false,
  });
  const [rentals, setRentals] = useState<RentalData[]>(initialRentals);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState(initialCounts);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { t } = useTranslation("profile");

  const locale =
    t("common:locale") === "nl"
      ? "nl-NL"
      : t("common:locale") === "de"
      ? "de-DE"
      : "en-US";

  const formatters = useMemo(
    () => ({
      currency: new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
      }),
      date: new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    }),
    [locale]
  );

  // OPTIMIZATION 2: Only fetch data for refresh, not initial load
  const fetchCounts = useCallback(async () => {
    try {
      const response = await fetch("/api/user/profile/lessor-history/counts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCounts({
          upcoming: data.upcoming ?? 0,
          current: data.current ?? 0,
          past: data.past ?? 0,
        });
      }
    } catch (err) {
      console.error("Error fetching counts:", err);
    }
  }, []);

  const fetchRentals = useCallback(
    async (isRefresh = false) => {
      // OPTIMIZATION 3: Don't set loading state if this is initial data or we have data
      if (isRefresh || rentals.length === 0) {
        setIsRefreshing(true);
        setError(null);

        try {
          const response = await fetch("/api/user/profile/lessor-history", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch rentals: ${response.statusText}`);
          }

          const data = await response.json();
          if (Array.isArray(data.rentals)) {
            setRentals(data.rentals);
          }

          // Always fetch counts as they may have changed
          await fetchCounts();
        } catch (err) {
          console.error("Error fetching rentals:", err);
          setError(
            err instanceof Error ? err.message : "Failed to fetch rentals"
          );
        } finally {
          setIsRefreshing(false);
        }
      }
    },
    [rentals.length, fetchCounts]
  );

  // OPTIMIZATION 4: Only fetch data if we don't have initial data
  useEffect(() => {
    // Only fetch if we don't have initial data
    if (initialRentals.length === 0 && !parentIsLoading) {
      fetchRentals();
    }

    // Set up a refresh timer for all tabs (every 2 minutes)
    const refreshInterval = setInterval(() => {
      fetchRentals(true);
    }, 2 * 60 * 1000);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [fetchRentals, initialRentals.length, parentIsLoading]);

  useEffect(() => {
    if (initialRentals.length > 0) {
      setRentals(initialRentals);
    }
  }, [initialRentals]);

  useEffect(() => {
    setCounts(initialCounts);
  }, [initialCounts]);

  // Helper functions
  const formatCurrency = useCallback(
    (amount: number) => {
      return formatters.currency.format(amount);
    },
    [formatters]
  );

  const formatDate = useCallback(
    (date: Date) => {
      return formatters.date.format(new Date(date));
    },
    [formatters]
  );

  // Get badge variant based on status
  const getBadgeVariant = useCallback((status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline" | "warning"
    > = {
      [RentalStatus.COMPLETED]: "secondary",
      [RentalStatus.ACTIVE]: "default",
      [RentalStatus.CONFIRMED]: "outline",
      [RentalStatus.PENDING]: "outline",
      [RentalStatus.CANCELLED]: "destructive",
      [RentalStatus.LATE_RETURN]: "destructive",
      [RentalStatus.DISPUTED]: "warning",
    };
    return variants[status] || "outline";
  }, []);

  // Format status for display with translations
  const getDisplayStatus = useCallback(
    (status: string) => {
      return t(`lessorHistory.status.${status}`) || status.replace("_", " ");
    },
    [t]
  );

  // Memoized filtered rentals to avoid recalculation on every render
  const filteredRentals = useMemo(() => {
    return {
      upcoming: rentals.filter(
        (r) =>
          r.status === RentalStatus.CONFIRMED ||
          r.status === RentalStatus.PENDING
      ),
      active: rentals.filter(
        (r) =>
          r.status === RentalStatus.ACTIVE ||
          r.status === RentalStatus.LATE_RETURN ||
          r.status === RentalStatus.DISPUTED
      ),
      past: rentals.filter(
        (r) =>
          r.status === RentalStatus.COMPLETED ||
          r.status === RentalStatus.CANCELLED
      ),
    };
  }, [rentals]);

  // Event handlers
  const handleViewDetails = useCallback(
    (rental: RentalData) => {
      if (onViewDetails) {
        onViewDetails(rental);
        return;
      }
      setSelectedRental(rental);
      setDialogState((prev) => ({ ...prev, details: true }));
    },
    [onViewDetails]
  );

  const handleManageBooking = useCallback(
    (rental: RentalData) => {
      if (onManageBooking) {
        onManageBooking(rental);
        return;
      }
      setSelectedRental(rental);
      setDialogState((prev) => ({ ...prev, manage: true }));
    },
    [onManageBooking]
  );

  const handleStatusUpdateComplete = useCallback(
    async (rentalId: string, newStatus: string, note?: string) => {
      try {
        // Use our new API endpoint to update the rental status
        const response = await fetch(`/api/rentals/${rentalId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus, note }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update rental status");
        }

        // Call the callback if provided
        if (onStatusUpdate) {
          await onStatusUpdate(rentalId, newStatus, note);
        }

        // Refresh data after successful update
        fetchRentals(true);
      } catch (err) {
        console.error("Error updating rental status:", err);
      }
    },
    [onStatusUpdate, fetchRentals]
  );

  const handleAddDamageReportComplete = useCallback(
    async (rentalId: string, damageReport: any) => {
      try {
        await onAddDamageReport(rentalId, damageReport);
        // Refresh data after successful update
        fetchRentals(true);
      } catch (err) {
        console.error("Error adding damage report:", err);
      }
    },
    [onAddDamageReport, fetchRentals]
  );

  // UI rendering functions
  const renderRentalCard = useCallback(
    (rental: RentalData, isLastItem: boolean = false) => (
      <Card key={rental.id} className="p-0 border-0 shadow-none">
        <CardContent className="p-0">
          <div
            className={`flex flex-col ${
              !isLastItem ? "border-b pb-4" : ""
            } md:flex-row md:items-start relative`}
          >
            <div className="relative w-full md:w-42 h-30 mb-4 md:mb-0 md:mr-4 rounded-lg overflow-hidden">
              {rental.trailerImage ? (
                <Image
                  src={rental.trailerImage}
                  alt={rental.trailerTitle}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YxZjFmMSIvPjwvc3ZnPg=="
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Truck className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold">{rental.trailerTitle}</h3>
              {rental.renter && (
                <span className="text-[13px] text-gray-500">
                  {t("lessorHistory.rentalInfo.rentedTo")}:{" "}
                  {rental.renter.firstName} {rental.renter.lastName}
                </span>
              )}

              <div className="flex flex-wrap mt-6">
                <span className="font-medium text-xs">
                  {t("lessorHistory.rentalInfo.rentalPeriod")}:
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">{formatDate(rental.startDate)}</Badge>
                <span className="text-xs">-</span>
                <Badge variant="outline">{formatDate(rental.endDate)}</Badge>
              </div>

              {rental.status === RentalStatus.LATE_RETURN && (
                <div className="flex items-center gap-1 mt-3 text-amber-600 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{t("lessorHistory.rentalInfo.lateReturnWarning")}</span>
                </div>
              )}

              <div className="flex flex-wrap mt-2 pb-0">
                <div className="flex items-center justify-end ms-auto gap-2">
                  <Button
                    variant="outline"
                    className="text-[13px]"
                    size="sm"
                    onClick={() => handleViewDetails(rental)}
                  >
                    {t("lessorHistory.buttons.viewDetails")}
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className="text-[13px]"
                    onClick={() => handleManageBooking(rental)}
                  >
                    {t("lessorHistory.buttons.manageRental")}
                  </Button>

                  {rental.status === RentalStatus.COMPLETED && (
                    <Button variant="outline" size="sm" className="text-[13px]">
                      <Star className="size-4" strokeWidth={1.5} />
                      {t("lessorHistory.buttons.reviewRental")}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-0 md:ml-4 flex flex-col items-end justify-between absolute h-fit top-0 end-0">
              <Badge variant={getBadgeVariant(rental.status)}>
                {getDisplayStatus(rental.status)}
              </Badge>
              <div className="font-medium text-sm mt-2">
                {formatCurrency(rental.totalPrice)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    [
      formatDate,
      formatCurrency,
      getBadgeVariant,
      getDisplayStatus,
      handleViewDetails,
      handleManageBooking,
    ]
  );

  const renderEmptyState = useCallback(
    (type: keyof typeof filteredRentals) => {
      return (
        <Card className="border-0 shadow-none bg-[#f6f8f9]">
          <CardContent className="flex flex-col items-center justify-center h-[350px]">
            <CalendarDays className="h-10 w-10 mb-4" strokeWidth={1.5} />
            <h3 className="font-medium text-lg">
              {t(`lessorHistory.emptyStates.${type}.title`)}
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {t(`lessorHistory.emptyStates.${type}.message`)}
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => fetchRentals(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("lessorHistory.loading")}
                </>
              ) : (
                t("lessorHistory.buttons.refresh")
              )}
            </Button>
          </CardContent>
        </Card>
      );
    },
    [fetchRentals, isRefreshing, t]
  );

  if (parentIsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#222222] tracking-tight">
            {t("lessorHistory.title")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t("lessorHistory.description")}
          </p>
        </div>

        <Card className="border-0 shadow-none bg-[#f6f8f9]">
          <CardContent className="flex flex-col items-center justify-center h-[350px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h3 className="font-medium text-lg">
              {t("lessorHistory.loading")}
            </h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#222222] tracking-tight">
            {t("lessorHistory.title")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t("lessorHistory.description")}
          </p>
        </div>

        <Card className="border-0 shadow-none bg-[#f8f6f6]">
          <CardContent className="flex flex-col items-center justify-center h-[350px]">
            <div className="text-destructive mb-4 text-3xl">!</div>
            <h3 className="font-medium text-lg">
              {t("lessorHistory.error.title")}
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {error}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchRentals()}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("lessorHistory.error.retrying")}
                </>
              ) : (
                t("lessorHistory.error.tryAgain")
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentRentals =
    filteredRentals[activeTab as keyof typeof filteredRentals] || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-[#222222] tracking-tight">
            {t("lessorHistory.title")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t("lessorHistory.description")}
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="upcoming"
        className="w-full mt-9"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="w-full bg-white gap-x-2 pb-[25px] rounded-0 flex items-center justify-start rounded-none">
          <TabsTrigger
            className="data-[state=active]:bg-[#222222] data-[state=active]:shadow-none data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
            value="upcoming"
          >
            {t("lessorHistory.tabs.upcoming")}{" "}
            {counts.upcoming > 0 && `(${counts.upcoming})`}
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
          >
            {t("lessorHistory.tabs.active")}{" "}
            {counts.current > 0 && `(${counts.current})`}
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
          >
            {t("lessorHistory.tabs.past")}{" "}
            {counts.past > 0 && `(${counts.past})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {currentRentals.length > 0 ? (
            <div className="space-y-4">
              {currentRentals.map((rental, index) =>
                renderRentalCard(rental, index === currentRentals.length - 1)
              )}
            </div>
          ) : (
            renderEmptyState("upcoming")
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {currentRentals.length > 0 ? (
            <div className="space-y-4">
              {currentRentals.map((rental, index) =>
                renderRentalCard(rental, index === currentRentals.length - 1)
              )}
            </div>
          ) : (
            renderEmptyState("active")
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {currentRentals.length > 0 ? (
            <div className="space-y-4">
              {currentRentals.map((rental, index) =>
                renderRentalCard(rental, index === currentRentals.length - 1)
              )}
            </div>
          ) : (
            renderEmptyState("past")
          )}
        </TabsContent>
      </Tabs>

      {selectedRental && (
        <>
          <Dialog
            open={dialogState.details}
            onOpenChange={(open) =>
              setDialogState((prev) => ({ ...prev, details: open }))
            }
          >
            <RentalDetailsDialog
              rental={selectedRental}
              role="LESSOR"
              onClose={() =>
                setDialogState((prev) => ({ ...prev, details: false }))
              }
            />
          </Dialog>

          <Dialog
            open={dialogState.manage}
            onOpenChange={(open) =>
              setDialogState((prev) => ({ ...prev, manage: open }))
            }
          >
            <RentalManagementDialog
              rental={selectedRental}
              role="LESSOR"
              onClose={() =>
                setDialogState((prev) => ({ ...prev, manage: false }))
              }
              onStatusUpdate={handleStatusUpdateComplete}
              onAddDamageReport={handleAddDamageReportComplete}
            />
          </Dialog>
        </>
      )}
    </div>
  );
}
