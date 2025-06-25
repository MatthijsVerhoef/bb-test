"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
  ArrowUpDown,
  CircleIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Rental {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  totalPrice: number;
  paymentStatus: string;
  trailer: {
    id: string;
    title: string;
    type: string;
    imageUrl?: string;
  };
  lessor: {
    id: string;
    name: string;
    email: string;
  };
  renter: {
    id: string;
    name: string;
    email: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface AdminRentalListProps {
  filters: {
    status?: string;
    lessorId?: string;
    renterId?: string;
    page: number;
    limit: number;
    sort: string;
    order: string;
  };
  onPageChange: (page: number) => void;
}

export function AdminRentalList({
  filters,
  onPageChange,
}: AdminRentalListProps) {
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch rentals when filters change
  useEffect(() => {
    const fetchRentals = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.set("status", filters.status);
        if (filters.lessorId) queryParams.set("lessorId", filters.lessorId);
        if (filters.renterId) queryParams.set("renterId", filters.renterId);
        queryParams.set("page", String(filters.page));
        queryParams.set("limit", String(filters.limit));
        queryParams.set("sort", filters.sort);
        queryParams.set("order", filters.order);

        const response = await fetch(
          `/api/admin/rentals?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch rentals");
        }

        const data = await response.json();
        setRentals(data.rentals);
        setPagination(data.pagination);
      } catch (err) {
        console.error("Error fetching rentals:", err);
        setError(
          "Er is een fout opgetreden bij het ophalen van de verhuringen."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRentals();
  }, [filters]);

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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
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
      PENDING: { label: "In afwachting", color: "text-amber-600" },
      COMPLETED: { label: "Betaald", color: "text-green-600" },
      FAILED: { label: "Mislukt", color: "text-red-600" },
      REFUNDED: { label: "Terugbetaald", color: "text-blue-600" },
      PARTIALLY_REFUNDED: {
        label: "Deels terugbetaald",
        color: "text-blue-600",
      },
      NO_PAYMENT: { label: "Geen betaling", color: "text-gray-500" },
    };
    return statusMap[status] || { label: status, color: "text-gray-600" };
  };

  // Handle rental click
  const handleRentalClick = (rentalId: string) => {
    router.push(`/admin/rentals/${rentalId}`);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    onPageChange(1);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-gray-100">
              <TableHead className="text-xs font-medium text-gray-600">
                Aanhanger
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Periode
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Huurder
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Verhuurder
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Status
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600 text-right">
                Prijs
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <TableRow key={i} className="border-gray-100">
                  <TableCell className="py-4">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <MoreHorizontal className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Fout bij laden
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{error}</p>
        <Button
          onClick={() => onPageChange(1)}
          variant="outline"
          className="rounded-lg"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Probeer opnieuw
        </Button>
      </div>
    );
  }

  // Empty state
  if (rentals.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Calendar className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Geen verhuringen gevonden
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Er zijn geen verhuringen die voldoen aan de opgegeven filtercriteria.
        </p>
        <Button
          onClick={handleResetFilters}
          variant="outline"
          className="rounded-lg"
        >
          Reset filters
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-gray-100">
              <TableHead className="text-xs font-medium text-gray-600 h-12">
                Aanhanger
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Periode
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Huurder
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Verhuurder
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600">
                Status
              </TableHead>
              <TableHead className="text-xs font-medium text-gray-600 text-right">
                Prijs
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rentals.map((rental) => {
              const statusInfo = getStatusInfo(rental.status);
              const paymentStatusInfo = getPaymentStatusInfo(
                rental.paymentStatus
              );

              return (
                <TableRow
                  key={rental.id}
                  className={cn(
                    "cursor-pointer hover:bg-gray-100/50 transition-colors border-gray-100",
                    rentals.indexOf(rental) % 2 === 0
                      ? "bg-white"
                      : "bg-[#F7F7F7]"
                  )}
                  onClick={() => handleRentalClick(rental.id)}
                >
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-lg border border-gray-100">
                        {rental.trailer.imageUrl ? (
                          <AvatarImage
                            src={rental.trailer.imageUrl}
                            alt={rental.trailer.title}
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-gray-50 rounded-lg">
                            <Calendar className="h-5 w-5 text-gray-400" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {rental.trailer.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {rental.trailer.type}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-gray-700">
                      <div>{formatDate(rental.startDate)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatDate(rental.endDate)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border border-gray-100">
                              <AvatarImage
                                src="/placeholder-avatar.png"
                                alt={rental.renter.name}
                              />
                              <AvatarFallback className="bg-gray-50 text-xs text-gray-600">
                                {rental.renter.name
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm text-gray-900">
                                {rental.renter.name.split(" ")[0]}
                              </div>
                              <div className="text-xs text-gray-500">
                                {rental.renter.email.split("@")[0]}
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-gray-900 text-white text-xs"
                        >
                          <p>{rental.renter.email}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border border-gray-100">
                              <AvatarImage
                                src="/placeholder-avatar.png"
                                alt={rental.lessor.name}
                              />
                              <AvatarFallback className="bg-gray-50 text-xs text-gray-600">
                                {rental.lessor.name
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm text-gray-900">
                                {rental.lessor.name.split(" ")[0]}
                              </div>
                              <div className="text-xs text-gray-500">
                                {rental.lessor.email.split("@")[0]}
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-gray-900 text-white text-xs"
                        >
                          <p>{rental.lessor.email}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                          statusInfo.color
                        )}
                      >
                        <CircleIcon className="h-2 w-2 mr-1.5 fill-current" />
                        {statusInfo.label}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {formatCurrency(rental.totalPrice)}
                      </div>
                      <div
                        className={cn(
                          "text-xs mt-0.5",
                          paymentStatusInfo.color
                        )}
                      >
                        {paymentStatusInfo.label}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-500">
            {pagination.totalItems} verhuringen gevonden
          </p>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className="h-8 w-8 rounded-lg border-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1 px-3">
                {Array.from(
                  { length: Math.min(7, pagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 4) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 3) {
                      pageNum = pagination.totalPages - 6 + i;
                    } else {
                      pageNum = pagination.page - 3 + i;
                    }

                    if (pageNum > pagination.totalPages) return null;

                    return (
                      <Button
                        key={i}
                        variant={
                          pageNum === pagination.page ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        className={cn(
                          "h-8 w-8 rounded-lg",
                          pageNum === pagination.page
                            ? "bg-gray-900 text-white hover:bg-gray-800"
                            : "hover:bg-gray-100"
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  onPageChange(
                    Math.min(pagination.totalPages, pagination.page + 1)
                  )
                }
                disabled={pagination.page === pagination.totalPages}
                className="h-8 w-8 rounded-lg border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              Pagina {pagination.page} van {pagination.totalPages}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
