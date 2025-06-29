// components/profile/renter/RentalHistory.tsx - Optimized version
import { useState, useCallback, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/client";
import { ApiClient } from "@/lib/api-client";
import {
  RentalDetailsDialog,
  RentalCancellationDialog,
  RentalExtensionDialog,
  DamageReportDialog,
} from "@/components/profile/dialogs";
import SendMessageDialog from "./SendMessageDialog";
import TrailerReviewDialog from "./TrailerReviewDialog";

// Types
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
    id?: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    email?: string;
    profilePicture?: string;
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
  renterId: string;
  lessorId: string;
}

interface RenterHistoryProps {
  userId: string;
}

// Query key factory
const rentalKeys = {
  all: ["rentals"] as const,
  renter: (userId: string) => [...rentalKeys.all, "renter", userId] as const,
  detail: (rentalId: string) =>
    [...rentalKeys.all, "detail", rentalId] as const,
};

// Memoized subcomponents
const RentalCard = memo(
  ({
    rental,
    onAction,
    userId,
    isLastItem,
  }: {
    rental: RentalData;
    onAction: (action: string, rental: RentalData) => void;
    userId: string;
    isLastItem: boolean;
  }) => {
    const { t } = useTranslation("profile");

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

    const getDaysUntil = useCallback((date: Date) => {
      const now = new Date();
      const targetDate = new Date(date);
      const diffTime = targetDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }, []);

    const getBadgeVariant = (status: string) => {
      const variants: Record<
        string,
        "secondary" | "default" | "outline" | "destructive" | "warning"
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
    };

    const getDisplayStatus = (status: string) => {
      return t(`rentalHistory.status.${status}`, { defaultValue: status });
    };

    return (
      <Card className="p-0 border-0 shadow-none">
        <CardContent className="p-0">
          <div
            className={`flex flex-col ${
              !isLastItem ? "border-b pb-4" : ""
            } md:flex-row md:items-start relative`}
          >
            {/* Image */}
            <div className="relative w-full md:w-42 h-30 mb-4 md:mb-0 md:mr-4 rounded-lg overflow-hidden">
              {rental.trailerImage ? (
                <Image
                  src={rental.trailerImage}
                  alt={rental.trailerTitle}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 168px"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Content */}
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
                  {(rental.status === RentalStatus.CONFIRMED ||
                    rental.status === RentalStatus.PENDING) && (
                    <Button
                      className="text-xs bg-[#222222] hover:bg-black/80"
                      variant="destructive"
                      size="sm"
                      onClick={() => onAction("cancel", rental)}
                    >
                      {t("rentalHistory.rentalDetails.actions.cancel")}
                    </Button>
                  )}
                  <Button
                    className="text-xs"
                    variant="outline"
                    size="sm"
                    onClick={() => onAction("details", rental)}
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
                        onClick={() => onAction("review", rental)}
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
                        onClick={() => onAction("damage", rental)}
                      >
                        {t("rentalHistory.rentalDetails.actions.reportDamage")}
                      </Button>
                      <Button
                        className="text-xs"
                        variant="default"
                        size="sm"
                        onClick={() => onAction("extend", rental)}
                      >
                        {t("rentalHistory.rentalDetails.actions.extend")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Status and price */}
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
  }
);

RentalCard.displayName = "RentalCard";

// Main component
export default function RenterHistory({ userId }: RenterHistoryProps) {
  const { t } = useTranslation("profile");
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedRental, setSelectedRental] = useState<RentalData | null>(null);
  const [dialogState, setDialogState] = useState({
    details: false,
    cancel: false,
    extend: false,
    damage: false,
    review: false,
  });

  // Fetch rentals using React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: rentalKeys.renter(userId),
    queryFn: () =>
      ApiClient.get<{ rentals: RentalData[] }>(
        "/api/user/profile/renter-history"
      ),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const rentals = data?.rentals || [];

  // Cancel rental mutation
  const cancelMutation = useMutation({
    mutationFn: ({ rentalId, reason }: { rentalId: string; reason: string }) =>
      ApiClient.post("/api/reservation/cancel", { rentalId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.renter(userId) });
      setDialogState((prev) => ({ ...prev, cancel: false }));
    },
  });

  // Submit review mutation
  const reviewMutation = useMutation({
    mutationFn: (reviewData: any) =>
      ApiClient.post("/api/trailers/review", reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.renter(userId) });
      setDialogState((prev) => ({ ...prev, review: false }));
    },
  });

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

  // Handle dialog actions
  const handleAction = useCallback((action: string, rental: RentalData) => {
    setSelectedRental(rental);
    setDialogState((prev) => ({ ...prev, [action]: true }));
  }, []);

  // Empty state component
  const EmptyState = memo(
    ({ type }: { type: "upcoming" | "active" | "past" }) => (
      <Card className="border-0 shadow-none bg-[#f6f8f9]">
        <CardContent className="flex flex-col items-center justify-center h-[350px]">
          <CalendarDays className="h-10 w-10 mb-4" strokeWidth={1.5} />
          <h3 className="font-medium text-lg">
            {t(`rentalHistory.emptyStates.${type}.title`)}
          </h3>
          <p className="text-muted-foreground text-center max-w-sm mt-1">
            {t(`rentalHistory.emptyStates.${type}.message`)}
          </p>
        </CardContent>
      </Card>
    )
  );

  EmptyState.displayName = "EmptyState";

  // Loading state
  if (isLoading) {
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

  // Error state
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
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => refetch()}
            >
              {t("rentalHistory.error.tryAgain")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabContent = {
    upcoming: upcomingRentals,
    active: activeRentals,
    past: pastRentals,
  };

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
            {t("rentalHistory.tabs.upcoming")}{" "}
            {upcomingRentals.length > 0 && `(${upcomingRentals.length})`}
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
          >
            {t("rentalHistory.tabs.active")}{" "}
            {activeRentals.length > 0 && `(${activeRentals.length})`}
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="data-[state=active]:bg-[#222222] data-[state=active]:text-white shadow-none py-4 text-xs max-w-fit px-7 rounded-full data-[state=inactive]:border data-[state=inactive]:border-gray-200"
          >
            {t("rentalHistory.tabs.past")}{" "}
            {pastRentals.length > 0 && `(${pastRentals.length})`}
          </TabsTrigger>
        </TabsList>

        {Object.entries(tabContent).map(([key, items]) => (
          <TabsContent key={key} value={key} className="mt-4">
            {items.length > 0 ? (
              <div className="space-y-4">
                {items.map((rental, index) => (
                  <RentalCard
                    key={rental.id}
                    rental={rental}
                    onAction={handleAction}
                    userId={userId}
                    isLastItem={index === items.length - 1}
                  />
                ))}
              </div>
            ) : (
              <EmptyState type={key as "upcoming" | "active" | "past"} />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialogs */}
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
              role="USER"
              onClose={() =>
                setDialogState((prev) => ({ ...prev, details: false }))
              }
            />
          </Dialog>

          <AlertDialog
            open={dialogState.cancel}
            onOpenChange={(open) =>
              setDialogState((prev) => ({ ...prev, cancel: open }))
            }
          >
            <RentalCancellationDialog
              rental={selectedRental}
              role="USER"
              onClose={() =>
                setDialogState((prev) => ({ ...prev, cancel: false }))
              }
              onCancel={(rentalId, reason) =>
                cancelMutation.mutate({ rentalId, reason })
              }
            />
          </AlertDialog>

          <Dialog
            open={dialogState.extend}
            onOpenChange={(open) =>
              setDialogState((prev) => ({ ...prev, extend: open }))
            }
          >
            <RentalExtensionDialog
              rental={selectedRental}
              role="USER"
              onClose={() =>
                setDialogState((prev) => ({ ...prev, extend: false }))
              }
              onExtend={async () => {}} // Implement extension mutation
            />
          </Dialog>

          <Dialog
            open={dialogState.damage}
            onOpenChange={(open) =>
              setDialogState((prev) => ({ ...prev, damage: open }))
            }
          >
            <DamageReportDialog
              rental={selectedRental}
              role="USER"
              onClose={() =>
                setDialogState((prev) => ({ ...prev, damage: false }))
              }
              onSubmitDamage={async () => {}} // Implement damage report mutation
            />
          </Dialog>

          <TrailerReviewDialog
            rental={selectedRental}
            open={dialogState.review}
            onOpenChange={(open) =>
              setDialogState((prev) => ({ ...prev, review: open }))
            }
            onSubmitReview={(data) => reviewMutation.mutate(data)}
          />
        </>
      )}
    </div>
  );
}
