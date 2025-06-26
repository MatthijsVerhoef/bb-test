import {
  Truck,
  Star,
  ArrowUp,
  ArrowDown,
  Euro,
  BarChart3,
  Loader2,
  TrendingUp,
  Calendar,
  EyeIcon,
  BadgeEuro,
  BadgeDollarSign,
  BadgePoundSterling,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";

// Memoized StatCard component to prevent unnecessary re-renders
const StatCard = memo(({ icon: Icon, title, value, subtitle }) => (
  <Card className="p-0 bg-[#f6f8f9] border-0 shadow-none rounded-lg">
    <CardContent className="p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-medium">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </CardContent>
  </Card>
));
StatCard.displayName = "StatCard";

// Memoized skeleton component
const StatCardSkeleton = memo(() => (
  <Card className="p-0 bg-[#f6f8f9] border-0 shadow-none rounded-lg">
    <CardContent className="p-4">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="mt-4">
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    </CardContent>
  </Card>
));
StatCardSkeleton.displayName = "StatCardSkeleton";

// Memoized change indicator component
const ChangeIndicator = memo(({ value = 0, isGood = true }) => {
  const isPositive = value >= 0;
  const showGreen = (isPositive && isGood) || (!isPositive && !isGood);

  return (
    <div className="flex items-center">
      <div
        className={`size-5 mx-2 rounded-full flex items-center justify-center ${
          showGreen ? "bg-[#CEFAC2]" : "bg-[#FDECD9]"
        }`}
      >
        {isPositive ? (
          <ArrowUp
            className={showGreen ? "text-[#428C28]" : "text-[#EF8333]"}
            size={13}
          />
        ) : (
          <ArrowDown
            className={showGreen ? "text-[#428C28]" : "text-[#EF8333]"}
            size={13}
          />
        )}
      </div>
      <span
        className={`${
          showGreen ? "text-[#428C28]" : "text-[#EF8333]"
        } font-medium text-sm`}
      >
        {Math.abs(value).toFixed(0)}%
      </span>
    </div>
  );
});
ChangeIndicator.displayName = "ChangeIndicator";

// Memoized metric card component
const MetricCard = memo(
  ({ title, value, change, subtitle, isLast = false, isBottomRow = false }) => {
    const borderClasses = isBottomRow
      ? isLast
        ? "shadow-none rounded-none border-t border-l-0 border-b-0 border-r-0 rounded-br-lg"
        : "shadow-none rounded-none border-t border-l-0 border-b-0"
      : isLast
      ? "border-r-0"
      : "border-r";

    const roundedClasses =
      isBottomRow && !isLast
        ? "rounded-bl-lg rounded-br-none rounded-t-none"
        : "";

    return (
      <div className={`${isBottomRow ? "" : borderClasses}`}>
        {isBottomRow ? (
          <Card className={`h-fit ${borderClasses} ${roundedClasses} p-4`}>
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="flex items-center">
                <p className="text-[13px] me-auto font-medium text-[#222222]">
                  {title}
                </p>
              </div>
              <div className="text-xl font-medium flex items-center text-[#222222] mt-5">
                {value}
                {change !== undefined && (
                  <ChangeIndicator value={change} isGood={true} />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {subtitle}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="p-4">
            <p className="text-[13px] font-medium">{title}</p>
            <div className="flex items-center mt-7">
              <p className="text-xl font-medium">{value}</p>
              {change !== undefined && (
                <ChangeIndicator value={change} isGood={true} />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
          </div>
        )}
      </div>
    );
  }
);
MetricCard.displayName = "MetricCard";

// Memoized trailer list item
const TrailerListItem = memo(
  ({ trailer, index, formatCurrency, type = "performance" }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 min-w-6 rounded-full bg-white flex items-center justify-center text-sm font-medium">
          {index + 1}
        </div>
        <div>
          <p className="text-sm max-w-[160px] truncate font-medium">
            {trailer.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {type === "performance"
              ? `${trailer.totalRentals} verhuringen`
              : "Weergaven & favorieten"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 ms-auto bg-[#222222] text-white text-xs rounded-full px-2 py-1 font-medium">
        {type === "performance" ? (
          formatCurrency(trailer.totalRevenue)
        ) : (
          <>
            <EyeIcon strokeWidth={1.5} className="size-3 text-white" />
            <span className="font-medium">{trailer.views}</span>
          </>
        )}
      </div>
    </div>
  )
);
TrailerListItem.displayName = "TrailerListItem";

// Memoized rental item
const RentalItem = memo(({ rental, formatDate, formatCurrency, t }) => (
  <div className="flex items-center justify-start border-b pb-3 last:border-0">
    <img
      className="size-12 rounded-full object-cover me-4"
      alt={rental.trailerTitle}
      src={rental?.images?.[0]?.url || "/images/placeholder.jpg"}
      onError={(e) => {
        e.currentTarget.src = "/images/placeholder.jpg";
      }}
      loading="lazy"
    />
    <div className="me-auto">
      <p className="text-sm font-medium">{rental.trailerTitle}</p>
      <p className="text-xs text-muted-foreground">
        {t("lessorDashboard.upcomingRentals.renter", {
          name: rental.renterName,
        })}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
      </p>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium">{formatCurrency(rental.totalPrice)}</p>
      <Badge variant="outline" className="mt-1">
        {new Date(rental.startDate) > new Date()
          ? t("lessorDashboard.upcomingRentals.status.pending")
          : t("lessorDashboard.upcomingRentals.status.active")}
      </Badge>
    </div>
  </div>
));
RentalItem.displayName = "RentalItem";

// Initial data prop type
interface LessorDashboardProps {
  initialData?: any;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Global cache for dashboard data
let dataCache: { data: any; timestamp: number } | null = null;

export default function LessorDashboard({ initialData }: LessorDashboardProps) {
  const { t } = useTranslation("profile");

  // State management
  const [data, setData] = useState(() => {
    // If we have initial data, use it
    if (initialData) {
      dataCache = { data: initialData, timestamp: Date.now() };
      return initialData;
    }
    // Otherwise check cache
    if (dataCache && Date.now() - dataCache.timestamp < CACHE_DURATION) {
      return dataCache.data;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);

  // Memoized format functions
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  }, []);

  const formatDate = useCallback((date: string | Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  }, []);

  // Fetch function that respects cache
  const fetchDashboardData = useCallback(async () => {
    // Check if cache is still valid
    if (dataCache && Date.now() - dataCache.timestamp < CACHE_DURATION) {
      setData(dataCache.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/profile/lessor-dashboard", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      // Update cache
      dataCache = { data: result, timestamp: Date.now() };

      setData(result);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Only fetch if we don't have data
  useEffect(() => {
    if (!data) {
      fetchDashboardData();
    }
  }, [data, fetchDashboardData]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    // Clear cache to force fresh fetch
    dataCache = null;
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Memoized computed values
  const stats = useMemo(() => data?.stats || {}, [data?.stats]);
  const trailerStats = useMemo(
    () => data?.trailerStats || {},
    [data?.trailerStats]
  );
  const revenueStats = useMemo(
    () => data?.revenueStats || {},
    [data?.revenueStats]
  );
  const topPerformingTrailers = useMemo(
    () => data?.topPerformingTrailers || [],
    [data?.topPerformingTrailers]
  );
  const mostViewedTrailers = useMemo(
    () => data?.mostViewedTrailers || [],
    [data?.mostViewedTrailers]
  );
  const upcomingRentals = useMemo(
    () => data?.upcomingRentals || [],
    [data?.upcomingRentals]
  );

  // Show loading state only if no data
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#222222] tracking-tight">
            {t("lessorDashboard.title")}
          </h2>
          <p className="text-muted-foreground text-base">
            {t("lessorDashboard.description")}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#222222] tracking-tight">
            {t("lessorDashboard.title")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t("lessorDashboard.description")}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-[300px]">
          <p className="text-destructive mb-4">
            {t("lessorDashboard.error.message", { message: error })}
          </p>
          <Button onClick={handleRefresh}>
            {t("lessorDashboard.error.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1 font-semibold text-[#222222] tracking-tight">
            {t("lessorDashboard.title")}
          </h2>
          <p className="text-muted-foreground text-base">
            {t("lessorDashboard.description")}
          </p>
        </div>
      </div>

      {/* Trailer Status and Performance */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard
          icon={Truck}
          title={t("lessorDashboard.trailerOverview.title")}
          value={trailerStats.totalTrailers || 0}
          subtitle={t("lessorDashboard.trailerOverview.subtitle")}
        />

        <StatCard
          icon={Euro}
          title={t("lessorDashboard.avgDailyPrice.title")}
          value={formatCurrency(trailerStats.averagePrice || 0)}
          subtitle={t("lessorDashboard.avgDailyPrice.subtitle")}
        />

        <StatCard
          icon={BarChart3}
          title={t("lessorDashboard.rentalStats.title")}
          value={stats.totalRentals || 0}
          subtitle={t("lessorDashboard.rentalStats.subtitle")}
        />
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-3 flex-1 border rounded-lg">
        <MetricCard
          title={t("lessorDashboard.acceptanceRate.title")}
          value={`${stats.acceptanceRate?.toFixed(0) || 0}%`}
          change={10}
          subtitle={t("lessorDashboard.acceptanceRate.subtitle")}
        />

        <MetricCard
          title={t("lessorDashboard.responseRate.title")}
          value={`${stats.responseRate?.toFixed(0) || 0}%`}
          change={15}
          subtitle={t("lessorDashboard.responseRate.subtitle")}
        />

        <MetricCard
          title={t("lessorDashboard.responseTime.title")}
          value={stats.responseTime ? `${stats.responseTime} min` : "N/A"}
          change={-12}
          subtitle={t("lessorDashboard.responseTime.subtitle")}
          isLast={true}
        />

        {/* Second row of metrics */}
        <MetricCard
          title={t("lessorDashboard.monthlyRevenue.title")}
          value={formatCurrency(revenueStats.currentMonthRevenue || 0)}
          change={revenueStats.revenueChange || 0}
          subtitle={t("lessorDashboard.monthlyRevenue.subtitle", {
            amount: formatCurrency(revenueStats.lastMonthRevenue || 0),
          })}
          isBottomRow={true}
        />

        <MetricCard
          title={t("lessorDashboard.utilizationRate.title")}
          value={`${(trailerStats.utilizationRate || 0).toFixed(1)}%`}
          subtitle={t("lessorDashboard.utilizationRate.subtitle")}
          isBottomRow={true}
        />

        <MetricCard
          title={t("lessorDashboard.averageRating.title")}
          value={
            stats.averageRating ? (
              <>
                <Star className="size-5 mr-1 inline" />
                {stats.averageRating.toFixed(1)}
              </>
            ) : (
              "N/A"
            )
          }
          subtitle={t("lessorDashboard.averageRating.subtitle")}
          isBottomRow={true}
          isLast={true}
        />
      </div>

      <Separator className="mt-8 mb-8" />

      {/* Top Performing and Most Viewed Trailers */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Performing Trailers */}
        <Card className="shadow-none bg-[#f6f8f9] border-0">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("lessorDashboard.topPerformingTrailers.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center -mt-3 mb-7">
              <BadgeDollarSign
                className="size-12 mt-4 -me-1"
                strokeWidth={1.2}
              />
              <BadgeEuro className="size-14" strokeWidth={1.2} />
              <BadgePoundSterling
                className="size-12 mt-4 -ms-1"
                strokeWidth={1.2}
              />
            </div>
            <div className="space-y-4">
              {topPerformingTrailers.length > 0 ? (
                topPerformingTrailers.map((trailer, index) => (
                  <TrailerListItem
                    key={trailer.id}
                    trailer={trailer}
                    index={index}
                    formatCurrency={formatCurrency}
                    type="performance"
                  />
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  {t("lessorDashboard.topPerformingTrailers.noData")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Most Viewed Trailers */}
        <Card className="shadow-none border-0 bg-[#f6f8f9]">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <EyeIcon className="h-4 w-4" />
              {t("lessorDashboard.mostViewedTrailers.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center -mt-3 mb-7">
              <BadgeDollarSign
                className="size-12 mt-4 -me-1"
                strokeWidth={1.2}
              />
              <BadgeEuro className="size-14" strokeWidth={1.2} />
              <BadgePoundSterling
                className="size-12 mt-4 -ms-1"
                strokeWidth={1.2}
              />
            </div>
            <div className="space-y-4">
              {mostViewedTrailers.length > 0 ? (
                mostViewedTrailers.map((trailer, index) => (
                  <TrailerListItem
                    key={trailer.id}
                    trailer={trailer}
                    index={index}
                    formatCurrency={formatCurrency}
                    type="views"
                  />
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  {t("lessorDashboard.mostViewedTrailers.noData")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="mt-8 mb-8" />

      {/* Upcoming Rentals */}
      <Card className="shadow-none border-0 py-0">
        <CardHeader className="p-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t("lessorDashboard.upcomingRentals.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4">
            {upcomingRentals.length > 0 ? (
              upcomingRentals.map((rental) => (
                <RentalItem
                  key={rental.id}
                  rental={rental}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  t={t}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground bg-[#f6f8f9] text-center py-12 rounded-xl">
                {t("lessorDashboard.upcomingRentals.noRentals")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
