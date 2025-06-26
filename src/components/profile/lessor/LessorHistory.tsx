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
  isLoading?: boolean;
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
  isLoading: parentIsLoading = false,
  onStatusUpdate = async () => {},
  onAddDamageReport = async () => {},
  onViewDetails,
  onManageBooking,
}: LessorHistoryProps) {
  const { t } = useTranslation("profile");

  // State management - following RentalHistory pattern
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedRental, setSelectedRental] = useState<RentalData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  // Optimized state management
  const [rentals, setRentals] = useState<RentalData[]>(initialRentals);
  const [counts, setCounts] = useState(initialCounts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(
    initialRentals.length > 0
  );

  // Memoized filtered rentals
  const { upcomingRentals, activeRentals, pastRentals } = useMemo(() => {
    const upcoming = rentals.filter(
      (r) =>
        r.status === RentalStatus.CONFIRMED || r.status === RentalStatus.PENDING
    );
    const active = rentals.filter(
      (r) =>
        r.status === RentalStatus.ACTIVE ||
        r.status === RentalStatus.LATE_RETURN ||
        r.status === RentalStatus.DISPUTED
    );
    const past = rentals.filter(
      (r) =>
        r.status === RentalStatus.COMPLETED ||
        r.status === RentalStatus.CANCELLED
    );

    return {
      upcomingRentals: upcoming,
      activeRentals: active,
      pastRentals: past,
    };
  }, [rentals]);

  // Optimized fetch function - similar to RentalHistory
  const fetchRentals = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsRefreshing(true);
      setError(null);

      const response = await fetch("/api/user/profile/lessor-history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch rental history");
      }

      const data = await response.json();
      setRentals(data.rentals || []);
      setCounts(data.counts || { upcoming: 0, current: 0, past: 0 });
      setHasInitiallyLoaded(true);
    } catch (err) {
      console.error("Error fetching lessor history:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch rental history"
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Quick counts update (lighter API call)
  const fetchCounts = useCallback(async () => {
    try {
      const response = await fetch("/api/user/profile/lessor-history/counts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCounts({
          upcoming: data.upcoming || 0,
          current: data.current || 0,
          past: data.past || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching counts:", err);
    }
  }, []);

  // Only fetch if we don't have initial data
  useEffect(() => {
    if (!hasInitiallyLoaded && !parentIsLoading) {
      fetchRentals(true);
    } else if (hasInitiallyLoaded) {
      // Background refresh after a delay
      const timer = setTimeout(() => {
        fetchCounts(); // Just update counts in background
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasInitiallyLoaded, parentIsLoading, fetchRentals, fetchCounts]);

  // Refresh data periodically (every 2 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCounts();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Optimized handlers
  const handleStatusUpdateComplete = useCallback(
    async (rentalId: string, newStatus: string, note?: string) => {
      try {
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

        // Optimistically update the UI
        setRentals((prev) =>
          prev.map((rental) =>
            rental.id === rentalId ? { ...rental, status: newStatus } : rental
          )
        );

        // Call parent callback
        await onStatusUpdate(rentalId, newStatus, note);

        // Background refresh
        setTimeout(() => fetchRentals(false), 500);
      } catch (err) {
        console.error("Error updating rental status:", err);
        throw err;
      }
    },
    [onStatusUpdate, fetchRentals]
  );

  const handleAddDamageReportComplete = useCallback(
    async (rentalId: string, damageReport: any) => {
      try {
        await onAddDamageReport(rentalId, damageReport);
        // Background refresh
        setTimeout(() => fetchRentals(false), 500);
      } catch (err) {
        console.error("Error adding damage report:", err);
        throw err;
      }
    },
    [onAddDamageReport, fetchRentals]
  );

  // Memoized utility functions
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }, []);

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  }, []);

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

  const getDisplayStatus = useCallback(
    (status: string) => {
      return t(`lessorHistory.status.${status}`, { defaultValue: status });
    },
    [t]
  );

  const renderRentalCard = useCallback(
    (rental: RentalData, index?: number, isLastItem?: boolean) => (
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
                  sizes="(max-width: 768px) 100vw, 168px"
                  priority={index === 0}
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
                    onClick={() => {
                      setSelectedRental(rental);
                      setDetailsOpen(true);
                    }}
                  >
                    {t("lessorHistory.buttons.viewDetails")}
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className="text-[13px]"
                    onClick={() => {
                      setSelectedRental(rental);
                      setManageOpen(true);
                    }}
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
    [formatDate, formatCurrency, getBadgeVariant, getDisplayStatus, t]
  );

  const renderEmptyState = useCallback(
    (type: "upcoming" | "active" | "past") => {
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

  // Show loading state only if no initial data
  if (!hasInitiallyLoaded && (isRefreshing || parentIsLoading)) {
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
        <div className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && rentals.length === 0) {
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
          <CardContent className="flex flex-col items-center justify-center h-[200px]">
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
              onClick={() => fetchRentals(true)}
            >
              {t("lessorHistory.error.tryAgain")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentRentals =
    activeTab === "upcoming"
      ? upcomingRentals
      : activeTab === "active"
      ? activeRentals
      : pastRentals;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#222222] tracking-tight">
            {t("lessorHistory.title")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t("lessorHistory.description")}
          </p>
        </div>
        {isRefreshing && rentals.length > 0 && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {t("lessorHistory.updating")}
          </div>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full mt-9"
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
                renderRentalCard(
                  rental,
                  index,
                  index === currentRentals.length - 1
                )
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
                renderRentalCard(
                  rental,
                  index,
                  index === currentRentals.length - 1
                )
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
                renderRentalCard(
                  rental,
                  index,
                  index === currentRentals.length - 1
                )
              )}
            </div>
          ) : (
            renderEmptyState("past")
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {selectedRental && (
        <>
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <RentalDetailsDialog
              rental={selectedRental}
              role="LESSOR"
              onClose={() => setDetailsOpen(false)}
            />
          </Dialog>

          <Dialog open={manageOpen} onOpenChange={setManageOpen}>
            <RentalManagementDialog
              rental={selectedRental}
              role="LESSOR"
              onClose={() => setManageOpen(false)}
              onStatusUpdate={handleStatusUpdateComplete}
              onAddDamageReport={handleAddDamageReportComplete}
            />
          </Dialog>
        </>
      )}
    </div>
  );
}
