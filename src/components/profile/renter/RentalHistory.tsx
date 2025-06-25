// Optimized RenterHistory component - Complete version
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  Star,
  AlertTriangle,
  MapPin,
  Clock,
  Loader2,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/client";
import {
  RentalDetailsDialog,
  RentalCancellationDialog,
  RentalExtensionDialog,
  DamageReportDialog,
} from "@/components/profile/dialogs";
import SendMessageDialog from "./SendMessageDialog";
import TrailerReviewDialog from "./TrailerReviewDialog";

enum RentalStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  ACTIVE = "ACTIVE",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  LATE_RETURN = "LATE_RETURN",
  DISPUTED = "DISPUTED",
}

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
  lessor?: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    email?: string;
  };
  // Other optional fields based on your schema
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
  renterId: string;
  lessorId: string;
}

interface RenterHistoryProps {
  userId: string;
  initialRentals?: RentalData[];
  onCancel?: (rentalId: string, reason: string) => Promise<void>;
  onExtendRental?: (
    rentalId: string,
    newEndDate: Date,
    note?: string
  ) => Promise<void>;
  onReportDamage?: (rentalId: string, damageReport: any) => Promise<void>;
  onSubmitReview?: (reviewData: any) => Promise<void>;
}

export default function RenterHistory({
  userId,
  initialRentals = [],
  onCancel = async () => {},
  onExtendRental = async () => {},
  onReportDamage = async () => {},
  onSubmitReview = async () => {}, // Default empty function, we'll override this below
}: RenterHistoryProps) {
  const { t } = useTranslation("profile");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedRental, setSelectedRental] = useState<RentalData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [damageReportOpen, setDamageReportOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // OPTIMIZED: Start with initial data immediately, then fetch in background
  const [rentals, setRentals] = useState<RentalData[]>(initialRentals);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OPTIMIZED: Background fetch that doesn't show loading state
  const fetchRentals = async (showLoading = false) => {
    try {
      if (showLoading) setIsRefreshing(true);
      setError(null);

      const response = await fetch("/api/user/profile/renter-history", {
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
      setRentals(data.rentals);
    } catch (err) {
      console.error("Error fetching rental history:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch rental history"
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Implement the rental cancellation functionality
  const handleCancelRental = async (rentalId: string, reason: string) => {
    try {
      setIsCancelling(true);

      const response = await fetch("/api/reservation/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rentalId,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel rental");
      }

      // Refresh rentals data to update the UI after a brief delay
      // to allow the database operations to complete
      setTimeout(() => fetchRentals(false), 500);

      return await response.json();
    } catch (error) {
      console.error("Error cancelling rental:", error);
      throw error;
    } finally {
      setIsCancelling(false);
    }
  };

  // Custom review submission handler that properly accesses the component's fetchRentals function
  const handleSubmitReview = async (reviewData: any) => {
    try {
      const response = await fetch("/api/trailers/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit review");
      }

      // Refresh rentals data to update the UI after a brief delay
      // to allow the database operations to complete
      setTimeout(() => fetchRentals(false), 500);
      return await response.json();
    } catch (error) {
      console.error("Error submitting review:", error);
      throw error;
    }
  };

  // OPTIMIZED: Always fetch on mount, but don't show loading if we have initial data
  useEffect(() => {
    // If we have initial data, fetch in background without loading state
    // If no initial data, show loading state
    fetchRentals(initialRentals.length === 0);
  }, []); // Empty dependency array so it only runs once on mount

  // Separate effect for event listener that depends on rentals
  useEffect(() => {
    // Listen for custom event to open the cancellation dialog from the details dialog
    const handleOpenCancellationDialog = (event: any) => {
      const rentalId = event.detail.rentalId;
      const rentalToCancel = rentals.find((r) => r.id === rentalId);
      if (rentalToCancel) {
        setSelectedRental(rentalToCancel);
        setCancelOpen(true);
      }
    };

    document.addEventListener(
      "openCancellationDialog",
      handleOpenCancellationDialog
    );

    // Cleanup listener on unmount
    return () => {
      document.removeEventListener(
        "openCancellationDialog",
        handleOpenCancellationDialog
      );
    };
  }, [rentals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  // Calculate days until rental starts
  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filter rentals based on active tab
  const upcomingRentals = rentals.filter(
    (r) =>
      r.status === RentalStatus.CONFIRMED || r.status === RentalStatus.PENDING
  );
  const activeRentals = rentals.filter(
    (r) =>
      r.status === RentalStatus.ACTIVE ||
      r.status === RentalStatus.LATE_RETURN ||
      r.status === RentalStatus.DISPUTED
  );
  const pastRentals = rentals.filter(
    (r) =>
      r.status === RentalStatus.COMPLETED || r.status === RentalStatus.CANCELLED
  );

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case RentalStatus.COMPLETED:
        return "secondary";
      case RentalStatus.ACTIVE:
        return "default";
      case RentalStatus.CONFIRMED:
        return "outline";
      case RentalStatus.PENDING:
        return "outline";
      case RentalStatus.CANCELLED:
        return "destructive";
      case RentalStatus.LATE_RETURN:
        return "destructive";
      case RentalStatus.DISPUTED:
        return "warning";
      default:
        return "outline";
    }
  };

  const getDisplayStatus = (status: string) => {
    return t(`rentalHistory.status.${status}`, { defaultValue: status });
  };

  const renderRentalCard = (
    rental: RentalData,
    index?: number,
    isLastItem?: boolean
  ) => (
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
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-semibold">{rental.trailerTitle}</h3>
            {rental.lessor && (
              <span className="text-[13px] text-gray-500">
                {t("rentalHistory.rentalDetails.lessor")}:{" "}
                {rental.lessor.firstName} {rental.lessor.lastName}
              </span>
            )}

            <div className="flex flex-wrap mt-2">
              <span className="font-medium text-xs">
                {t("rentalHistory.rentalDetails.period")}:
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{formatDate(rental.startDate)}</Badge>
              <span className="text-xs">-</span>
              <Badge variant="outline">{formatDate(rental.endDate)}</Badge>
            </div>

            <div className="flex items-center mt-2">
              {rental.pickupLocation && (
                <div className="flex items-center gap-1 text-gray-600 text-xs">
                  <MapPin className="h-3 w-3" />
                  <span>{rental.pickupLocation}</span>
                </div>
              )}
              {rental.status && rental.pickupLocation && (
                <span className="mx-3">•</span>
              )}
              {rental.status === RentalStatus.CONFIRMED &&
                getDaysUntil(rental.startDate) > 0 && (
                  <div className="flex items-center gap-1 text-amber-600 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>
                      {t("rentalHistory.rentalDetails.startingIn", {
                        days: getDaysUntil(rental.startDate),
                      })}
                    </span>
                  </div>
                )}

              {rental.status === RentalStatus.LATE_RETURN && (
                <div className="flex items-center gap-1 text-amber-600 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  <span>
                    {t("rentalHistory.rentalDetails.lateReturnWarning")}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap mt-2 pb-0">
              <div className="flex items-center justify-end ms-auto gap-2">
                {/* Show appropriate actions based on status */}
                {(rental.status === RentalStatus.CONFIRMED ||
                  rental.status === RentalStatus.PENDING) && (
                  <Button
                    className="text-xs bg-[#222222] hover:bg-black/80"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setSelectedRental(rental);
                      setCancelOpen(true);
                    }}
                  >
                    {t("rentalHistory.rentalDetails.actions.cancel")}
                  </Button>
                )}
                <Button
                  className="text-xs"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRental(rental);
                    setDetailsOpen(true);
                  }}
                >
                  {t("rentalHistory.rentalDetails.actions.details")}
                </Button>

                {rental.status === RentalStatus.COMPLETED &&
                  !rental.damageReports?.some(
                    (report) => report.reviewerId === userId
                  ) && (
                    <Button
                      variant="default"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setSelectedRental(rental);
                        setReviewOpen(true);
                      }}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {t("rentalHistory.rentalDetails.actions.review")}
                    </Button>
                  )}

                {rental.lessor && <SendMessageDialog rental={rental} />}

                {rental.status === RentalStatus.ACTIVE && (
                  <>
                    <Button
                      className="text-xs"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRental(rental);
                        setDamageReportOpen(true);
                      }}
                    >
                      {t("rentalHistory.rentalDetails.actions.reportDamage")}
                    </Button>
                    <Button
                      className="text-xs"
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedRental(rental);
                        setExtendOpen(true);
                      }}
                    >
                      {t("rentalHistory.rentalDetails.actions.extend")}
                    </Button>
                  </>
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
  );

  const renderEmptyState = (type: "upcoming" | "active" | "past") => {
    return (
      <Card className="border-0 shadow-none bg-[#f6f8f9]">
        <CardContent className="flex flex-col items-center justify-center h-[350px]">
          <CalendarDays className="h-10 w-10 mb-4" strokeWidth={1.5} />
          <h3 className="font-medium text-lg">
            {t(`rentalHistory.emptyStates.${type}.title`)}
          </h3>
          <p className="text-muted-foreground text-center max-w-sm mt-1">
            {t(`rentalHistory.emptyStates.${type}.message`)}
          </p>
          {t(`rentalHistory.emptyStates.${type}.action`, {
            defaultValue: "",
          }) !== "" && (
            <Button className="mt-4">
              {t(`rentalHistory.emptyStates.${type}.action`)}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  // OPTIMIZED: Show immediate content, only show loading for empty state
  if (rentals.length === 0 && isRefreshing) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#222222] tracking-tight">
            {t("rentalHistory.title")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t("rentalHistory.description")}
          </p>
        </div>

        <div className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#222222] tracking-tight">
            {t("rentalHistory.title")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t("rentalHistory.description")}
          </p>
        </div>

        <Card className="border-0 shadow-none bg-[#f8f6f6]">
          <CardContent className="flex flex-col items-center justify-center h-[200px]">
            <div className="text-destructive mb-4 text-3xl">!</div>
            <h3 className="font-medium text-lg">
              {t("rentalHistory.error.title")}
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {error}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchRentals(true)}
            >
              {t("rentalHistory.error.tryAgain")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#222222] tracking-tight">
            {t("rentalHistory.title")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t("rentalHistory.description")}
          </p>
        </div>
        {/* OPTIMIZED: Show subtle refresh indicator when updating in background */}
        {isRefreshing && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {t("rentalHistory.updating")}
          </div>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="w-full mt-9">
        <TabsList className="w-full bg-white gap-x-2 pb-[25px] rounded-0 flex items-center justify-start rounded-none">
          <TabsTrigger
            className="data-[state=active]:bg-[#222222] data-[state=active]:shadow-none data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
            value="upcoming"
            onClick={() => setActiveTab("upcoming")}
          >
            {t("rentalHistory.tabs.upcoming")}{" "}
            {upcomingRentals.length > 0 && `(${upcomingRentals.length})`}
          </TabsTrigger>
          <TabsTrigger
            value="active"
            onClick={() => setActiveTab("active")}
            className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
          >
            {t("rentalHistory.tabs.active")}{" "}
            {activeRentals.length > 0 && `(${activeRentals.length})`}
          </TabsTrigger>
          <TabsTrigger
            value="past"
            onClick={() => setActiveTab("past")}
            className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
          >
            {t("rentalHistory.tabs.past")}{" "}
            {pastRentals.length > 0 && `(${pastRentals.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcomingRentals.length > 0 ? (
            <div className="space-y-4">
              {upcomingRentals.map((rental, index) =>
                renderRentalCard(
                  rental,
                  index,
                  index === upcomingRentals.length - 1
                )
              )}
            </div>
          ) : (
            renderEmptyState("upcoming")
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {activeRentals.length > 0 ? (
            <div className="space-y-4">
              {activeRentals.map((rental, index) =>
                renderRentalCard(
                  rental,
                  index,
                  index === activeRentals.length - 1
                )
              )}
            </div>
          ) : (
            renderEmptyState("active")
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {pastRentals.length > 0 ? (
            <div className="space-y-4">
              {pastRentals.map((rental, index) =>
                renderRentalCard(
                  rental,
                  index,
                  index === pastRentals.length - 1
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
              role="USER"
              onClose={() => setDetailsOpen(false)}
            />
          </Dialog>

          <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <RentalCancellationDialog
              rental={selectedRental}
              role="USER"
              onClose={() => setCancelOpen(false)}
              onCancel={handleCancelRental}
            />
          </AlertDialog>

          <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
            <RentalExtensionDialog
              rental={selectedRental}
              role="USER"
              onClose={() => setExtendOpen(false)}
              onExtend={onExtendRental}
            />
          </Dialog>

          <Dialog open={damageReportOpen} onOpenChange={setDamageReportOpen}>
            <DamageReportDialog
              rental={selectedRental}
              role="USER"
              onClose={() => setDamageReportOpen(false)}
              onSubmitDamage={onReportDamage}
            />
          </Dialog>

          <TrailerReviewDialog
            rental={selectedRental}
            open={reviewOpen}
            onOpenChange={setReviewOpen}
            onSubmitReview={handleSubmitReview}
          />
        </>
      )}
    </div>
  );
}
