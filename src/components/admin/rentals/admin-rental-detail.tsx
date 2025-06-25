"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  CreditCard,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  CircleIcon,
  Mail,
  Phone,
  Euro,
  CalendarDays,
  Navigation,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Rental {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: number;
  serviceFee?: number;
  insuranceFee?: number;
  deliveryFee?: number;
  securityDeposit?: number;
  pickupLocation?: string;
  returnLocation?: string;
  pickupTime?: string;
  returnTime?: string;
  actualReturnDate?: string;
  cancellationReason?: string;
  cancellationDate?: string;
  specialNotes?: string;
  trailer: {
    id: string;
    title: string;
    type: string;
    pricePerDay: number;
    images: { url: string; title?: string; id: string }[];
    owner: {
      id: string;
      firstName?: string;
      lastName?: string;
      email: string;
      phone?: string;
      profilePicture?: string;
    };
  };
  renter: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    profilePicture?: string;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
    paymentMethod?: string;
    paymentDate?: string;
    refundAmount?: number;
    refundDate?: string;
    refundReason?: string;
  };
}

interface AdminRentalDetailProps {
  rentalId: string;
}

export function AdminRentalDetail({ rentalId }: AdminRentalDetailProps) {
  const router = useRouter();
  const [rental, setRental] = useState<Rental | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Cancellation state
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  // Fetch rental details
  useEffect(() => {
    const fetchRentalDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/rentals/${rentalId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch rental details");
        }

        const data = await response.json();
        setRental(data.rental);
        setNewStatus(data.rental.status);
      } catch (err) {
        console.error("Error fetching rental details:", err);
        setError(
          "Er is een fout opgetreden bij het ophalen van de verhuring details."
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (rentalId) {
      fetchRentalDetails();
    }
  }, [rentalId]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format date with time
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    const statusMap = {
      PENDING: { label: "In afwachting", color: "text-amber-600 bg-amber-50" },
      CONFIRMED: { label: "Bevestigd", color: "text-blue-600 bg-blue-50" },
      ACTIVE: { label: "Actief", color: "text-green-600 bg-green-50" },
      COMPLETED: { label: "Voltooid", color: "text-gray-600 bg-gray-50" },
      CANCELLED: { label: "Geannuleerd", color: "text-red-600 bg-red-50" },
      LATE_RETURN: { label: "Verlaat", color: "text-orange-600 bg-orange-50" },
      DISPUTED: { label: "Geschil", color: "text-purple-600 bg-purple-50" },
    };
    return (
      statusMap[status] || { label: status, color: "text-gray-600 bg-gray-50" }
    );
  };

  // Get payment status info
  const getPaymentStatusInfo = (status: string) => {
    const statusMap = {
      PENDING: { label: "In afwachting", icon: Clock, color: "text-amber-600" },
      COMPLETED: {
        label: "Betaald",
        icon: CheckCircle,
        color: "text-green-600",
      },
      FAILED: { label: "Mislukt", icon: XCircle, color: "text-red-600" },
      REFUNDED: {
        label: "Terugbetaald",
        icon: RefreshCw,
        color: "text-blue-600",
      },
      PARTIALLY_REFUNDED: {
        label: "Deels terugbetaald",
        icon: RefreshCw,
        color: "text-blue-600",
      },
    };
    return (
      statusMap[status] || {
        label: status,
        icon: CircleIcon,
        color: "text-gray-600",
      }
    );
  };

  // Get available next statuses
  const getAvailableStatuses = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["ACTIVE", "CANCELLED"],
      ACTIVE: ["COMPLETED", "LATE_RETURN", "DISPUTED"],
      LATE_RETURN: ["COMPLETED", "DISPUTED"],
      DISPUTED: ["COMPLETED", "CANCELLED"],
      CANCELLED: [],
      COMPLETED: ["DISPUTED"],
    };

    return transitions[currentStatus] || [];
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!rental || !newStatus || newStatus === rental.status) return;

    setIsUpdatingStatus(true);

    try {
      const response = await fetch(`/api/admin/rentals/${rentalId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update rental status");
      }

      const updatedResponse = await fetch(`/api/rentals/${rentalId}`);
      const updatedData = await updatedResponse.json();
      setRental(updatedData.rental);
      setStatusNote("");

      alert("Status succesvol bijgewerkt!");
    } catch (err: any) {
      console.error("Error updating rental status:", err);
      alert(`Fout bij bijwerken van status: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle rental cancellation
  const handleCancelRental = async () => {
    if (!rental || !cancellationReason) return;

    setIsCancelling(true);

    try {
      const response = await fetch(`/api/admin/rentals/${rentalId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: cancellationReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel rental");
      }

      const updatedResponse = await fetch(`/api/rentals/${rentalId}`);
      const updatedData = await updatedResponse.json();
      setRental(updatedData.rental);
      setCancellationReason("");

      alert("Verhuring succesvol geannuleerd!");
    } catch (err: any) {
      console.error("Error cancelling rental:", err);
      alert(`Fout bij annuleren van verhuring: ${err.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-100 p-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Fout bij laden
        </h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <Button
          onClick={() => router.push("/admin/rentals")}
          variant="outline"
          className="rounded-lg"
        >
          Terug naar overzicht
        </Button>
      </div>
    );
  }

  // Not found state
  if (!rental) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <MoreHorizontal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Verhuring niet gevonden
        </h3>
        <p className="text-gray-500 mb-6">
          De opgegeven verhuring bestaat niet of is verwijderd.
        </p>
        <Button
          onClick={() => router.push("/admin/rentals")}
          className="rounded-lg"
        >
          Terug naar overzicht
        </Button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(rental.status);
  const availableStatuses = getAvailableStatuses(rental.status);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin/rentals")}
              className="rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {rental.trailer.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Verhuring #{rental.id.slice(-8)}
              </p>
            </div>
          </div>
          <Badge
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-full",
              statusInfo.color
            )}
          >
            <CircleIcon className="h-2.5 w-2.5 mr-1.5 fill-current" />
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-2">
          {/* Rental Period */}
          <Card className="border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                Verhuurperiode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Startdatum</Label>
                  <p className="text-sm font-medium">
                    {formatDate(rental.startDate)}
                  </p>
                  {rental.pickupTime && (
                    <p className="text-xs text-gray-500 mt-1">
                      Ophalen om {rental.pickupTime}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Einddatum</Label>
                  <p className="text-sm font-medium">
                    {formatDate(rental.endDate)}
                  </p>
                  {rental.returnTime && (
                    <p className="text-xs text-gray-500 mt-1">
                      Inleveren om {rental.returnTime}
                    </p>
                  )}
                </div>
              </div>

              {rental.actualReturnDate && (
                <div className="pt-3 border-t border-gray-100">
                  <Label className="text-xs text-gray-500">
                    Werkelijke retourdatum
                  </Label>
                  <p className="text-sm font-medium">
                    {formatDateTime(rental.actualReturnDate)}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Ophaallocatie
                  </Label>
                  <p className="text-sm">
                    {rental.pickupLocation || "Niet opgegeven"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    Inleverlocatie
                  </Label>
                  <p className="text-sm">
                    {rental.returnLocation || "Niet opgegeven"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card className="border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Euro className="h-4 w-4 text-gray-400" />
                Financiële details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Huurprijs per dag</span>
                <span className="font-medium">
                  {formatCurrency(rental.trailer.pricePerDay)}
                </span>
              </div>
              {rental.serviceFee !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Servicekosten</span>
                  <span>{formatCurrency(rental.serviceFee)}</span>
                </div>
              )}
              {rental.insuranceFee !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Verzekering</span>
                  <span>{formatCurrency(rental.insuranceFee)}</span>
                </div>
              )}
              {rental.deliveryFee !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bezorgkosten</span>
                  <span>{formatCurrency(rental.deliveryFee)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between">
                <span className="font-medium">Totaalbedrag</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(rental.totalPrice)}
                </span>
              </div>

              {rental.securityDeposit !== undefined && (
                <div className="flex justify-between text-sm text-gray-500 pt-2">
                  <span>Borg (apart)</span>
                  <span>{formatCurrency(rental.securityDeposit)}</span>
                </div>
              )}

              {/* Payment Status */}
              {rental.payment && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Betalingsstatus
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const paymentInfo = getPaymentStatusInfo(
                            rental.payment.status
                          );
                          const Icon = paymentInfo.icon;
                          return (
                            <>
                              <Icon
                                className={cn("h-4 w-4", paymentInfo.color)}
                              />
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  paymentInfo.color
                                )}
                              >
                                {paymentInfo.label}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {rental.payment.paymentMethod && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Betaalmethode</span>
                        <span>{rental.payment.paymentMethod}</span>
                      </div>
                    )}

                    {rental.payment.paymentDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Betaaldatum</span>
                        <span>
                          {formatDateTime(rental.payment.paymentDate)}
                        </span>
                      </div>
                    )}

                    {rental.payment.refundAmount && (
                      <div className="bg-blue-50 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Terugbetaling
                        </p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-700">Bedrag</span>
                            <span className="font-medium text-blue-900">
                              {formatCurrency(rental.payment.refundAmount)}
                            </span>
                          </div>
                          {rental.payment.refundDate && (
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-700">Datum</span>
                              <span className="text-blue-900">
                                {formatDateTime(rental.payment.refundDate)}
                              </span>
                            </div>
                          )}
                          {rental.payment.refundReason && (
                            <p className="text-sm text-blue-700 mt-2">
                              {rental.payment.refundReason}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes & Additional Info */}
          {(rental.specialNotes || rental.cancellationReason) && (
            <Card className="border-gray-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Aanvullende informatie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {rental.cancellationReason && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <Label className="text-xs text-red-700 font-medium">
                      Annuleringsreden
                    </Label>
                    <p className="text-sm text-red-900 mt-1">
                      {rental.cancellationReason}
                    </p>
                    {rental.cancellationDate && (
                      <p className="text-xs text-red-600 mt-2">
                        Geannuleerd op {formatDateTime(rental.cancellationDate)}
                      </p>
                    )}
                  </div>
                )}

                {rental.specialNotes && (
                  <div>
                    <Label className="text-xs text-gray-500">Notities</Label>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                      {rental.specialNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-2">
          {/* People Involved */}
          <Card className="border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">
                Betrokken personen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Renter */}
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">
                  Huurder
                </Label>
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 border border-gray-100">
                    <AvatarImage
                      src={rental?.renter?.profilePicture ?? "Unknown"}
                    />
                    <AvatarFallback className="bg-gray-50 text-xs">
                      {`${rental?.renter?.firstName?.[0] || ""}${
                        rental?.renter?.lastName?.[0] || ""
                      }`.toUpperCase() || "H"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {`${rental?.renter?.firstName || ""} ${
                        rental?.renter?.lastName || ""
                      }`.trim() || "Onbekend"}
                    </p>
                    <div className="space-y-1 mt-1">
                      <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3" />
                        {rental?.renter?.email}
                      </p>
                      {rental?.renter?.phone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {rental?.renter?.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Lessor */}
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">
                  Verhuurder
                </Label>
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 border border-gray-100">
                    <AvatarImage src={rental.trailer.owner.profilePicture} />
                    <AvatarFallback className="bg-gray-50 text-xs">
                      {`${rental.trailer.owner.firstName?.[0] || ""}${
                        rental.trailer.owner.lastName?.[0] || ""
                      }`.toUpperCase() || "V"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {`${rental.trailer.owner.firstName || ""} ${
                        rental.trailer.owner.lastName || ""
                      }`.trim() || "Onbekend"}
                    </p>
                    <div className="space-y-1 mt-1">
                      <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3" />
                        {rental.trailer.owner.email}
                      </p>
                      {rental.trailer.owner.phone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {rental.trailer.owner.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trailer Info */}
          <Card className="border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">
                Trailer informatie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rental.trailer.images && rental.trailer.images.length > 0 ? (
                  <img
                    src={rental.trailer.images[0].url}
                    alt={rental.trailer.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                <div>
                  <p className="font-medium text-sm">{rental.trailer.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {rental.trailer.type}
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg"
                    onClick={() =>
                      window.open(`/aanbod/${rental.trailer.id}`, "_blank")
                    }
                  >
                    Bekijk trailer details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card className="border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                Tijdstempels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-xs text-gray-500">Aangemaakt</Label>
                <p className="text-sm">{formatDateTime(rental.createdAt)}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">
                  Laatst bijgewerkt
                </Label>
                <p className="text-sm">{formatDateTime(rental.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Status Update */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Status bijwerken
            </CardTitle>
            <CardDescription className="text-xs">
              Wijzig de status van deze verhuring
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableStatuses.length > 0 ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStatusUpdate();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm">
                    Nieuwe status
                  </Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={rental.status}>
                        {getStatusInfo(rental.status).label} (huidig)
                      </SelectItem>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {getStatusInfo(status).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note" className="text-sm">
                    Notitie (optioneel)
                  </Label>
                  <Textarea
                    id="note"
                    placeholder="Voeg een notitie toe..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="min-h-[80px] rounded-lg resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isUpdatingStatus || newStatus === rental.status}
                  className="w-full rounded-lg"
                >
                  {isUpdatingStatus
                    ? "Bezig met bijwerken..."
                    : "Status bijwerken"}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-gray-500">
                Er zijn geen statusovergangen beschikbaar voor deze verhuring.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cancel Rental */}
        <Card className="border-gray-100">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Verhuring annuleren
            </CardTitle>
            <CardDescription className="text-xs">
              Annuleer deze verhuring met een reden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rental.status !== "CANCELLED" &&
            ["PENDING", "CONFIRMED"].includes(rental.status) ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCancelRental();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm">
                    Reden voor annulering
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Geef een reden op..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="min-h-[80px] rounded-lg resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isCancelling || !cancellationReason}
                  className="w-full rounded-lg"
                >
                  {isCancelling
                    ? "Bezig met annuleren..."
                    : "Verhuring annuleren"}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-gray-500">
                {rental.status === "CANCELLED"
                  ? "Deze verhuring is al geannuleerd."
                  : "Deze verhuring kan niet meer worden geannuleerd."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
