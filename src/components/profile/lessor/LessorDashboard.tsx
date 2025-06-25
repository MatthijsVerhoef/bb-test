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
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";

// Create a simple StatCard component to reduce duplication
const StatCard = ({ icon: Icon, title, value, subtitle }) => (
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
);

// Skeleton version of the stat card
const StatCardSkeleton = () => (
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
);

// Create empty data structure to avoid null checks
const emptyData = {
  stats: {
    totalRentals: 0,
    totalIncome: 0,
    completedRentals: 0,
    cancelledRentals: 0,
    averageRating: null,
    responseRate: null,
    responseTime: null,
    acceptanceRate: null,
  },
  trailerStats: {
    totalTrailers: 0,
    activeTrailers: 0,
    utilizationRate: 0,
    averagePrice: 0,
    trailersNeedingMaintenance: 0,
    overdueMaintenanceTrailers: 0,
  },
  revenueStats: {
    currentMonthRevenue: 0,
    lastMonthRevenue: 0,
    revenueChange: 0,
    currentMonthRentals: 0,
    lastMonthRentals: 0,
  },
  topPerformingTrailers: [],
  mostViewedTrailers: [],
  upcomingRentals: [],
};

export default function LessorDashboard() {
  const { t } = useTranslation("profile");

  // Use a ref to store data from the API
  const dataRef = useRef(emptyData);

  // State for UI control
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for component rendering
  const [renderCount, setRenderCount] = useState(0);

  // Format helpers
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const getChangeIndicator = (value = 0, isGood = true) => {
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
          {Math.abs(value || 0).toFixed(0)}%
        </span>
      </div>
    );
  };

  // Fetch data function
  useEffect(() => {
    // Check if we need to fetch data (first render or error recovery)
    if (isLoading || error) {
      let isMounted = true;
      let controller;

      const fetchData = async () => {
        // Reset error state if retrying
        if (error) setError(null);

        controller = new AbortController();

        try {
          const response = await fetch("/api/user/profile/lessor-dashboard", {
            signal: controller.signal,
            cache: "no-store", // Prevent caching to always get fresh data
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const result = await response.json();

          // Only update if component is still mounted
          if (isMounted) {
            // Make sure we have default values for all fields
            const safeData = {
              stats: {
                totalRentals: result.stats?.totalRentals || 0,
                totalIncome: result.stats?.totalIncome || 0,
                completedRentals: result.stats?.completedRentals || 0,
                cancelledRentals: result.stats?.cancelledRentals || 0,
                averageRating: result.stats?.averageRating || null,
                responseRate: result.stats?.responseRate || null,
                responseTime: result.stats?.responseTime || null,
                acceptanceRate: result.stats?.acceptanceRate || null,
              },
              trailerStats: {
                totalTrailers: result.trailerStats?.totalTrailers || 0,
                activeTrailers: result.trailerStats?.activeTrailers || 0,
                utilizationRate: result.trailerStats?.utilizationRate || 0,
                averagePrice: result.trailerStats?.averagePrice || 0,
                trailersNeedingMaintenance:
                  result.trailerStats?.trailersNeedingMaintenance || 0,
                overdueMaintenanceTrailers:
                  result.trailerStats?.overdueMaintenanceTrailers || 0,
              },
              revenueStats: {
                currentMonthRevenue:
                  result.revenueStats?.currentMonthRevenue || 0,
                lastMonthRevenue: result.revenueStats?.lastMonthRevenue || 0,
                revenueChange: result.revenueStats?.revenueChange || 0,
                currentMonthRentals:
                  result.revenueStats?.currentMonthRentals || 0,
                lastMonthRentals: result.revenueStats?.lastMonthRentals || 0,
              },
              topPerformingTrailers: result.topPerformingTrailers || [],
              mostViewedTrailers: result.mostViewedTrailers || [],
              upcomingRentals: result.upcomingRentals || [],
            };

            // Store data in ref to avoid re-renders
            dataRef.current = safeData;

            // Force a single render update
            setRenderCount((count) => count + 1);
            setIsLoading(false);
          }
        } catch (err) {
          if (err.name !== "AbortError" && isMounted) {
            console.error("Error fetching dashboard data:", err);
            setError(err.message || "Failed to load dashboard data");
            setIsLoading(false);
          }
        }
      };

      fetchData();

      // Cleanup function
      return () => {
        isMounted = false;
        if (controller) controller.abort();
      };
    }
  }, [isLoading, error]);

  // Use the data from the ref
  const data = dataRef.current;

  // Determine if we should show the loading skeleton
  const shouldShowSkeleton = isLoading && renderCount === 0;

  // Show loading state only on first render
  if (shouldShowSkeleton) {
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

  if (error) {
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
          <Button onClick={() => setIsLoading(true)}>
            {t("lessorDashboard.error.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1 font-semibold text-[#222222] tracking-tight">
          {t("lessorDashboard.title")}
        </h2>
        <p className="text-muted-foreground text-base">
          {t("lessorDashboard.description")}
        </p>
      </div>

      {/* Trailer Status and Performance */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard
          icon={Truck}
          title={t("lessorDashboard.trailerOverview.title")}
          value={data.trailerStats.totalTrailers}
          subtitle={t("lessorDashboard.trailerOverview.subtitle")}
        />

        <StatCard
          icon={Euro}
          title={t("lessorDashboard.avgDailyPrice.title")}
          value={formatCurrency(data.trailerStats.averagePrice)}
          subtitle={t("lessorDashboard.avgDailyPrice.subtitle")}
        />

        <StatCard
          icon={BarChart3}
          title={t("lessorDashboard.rentalStats.title")}
          value={data.stats.totalRentals}
          subtitle={t("lessorDashboard.rentalStats.subtitle")}
        />
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-3 flex-1 border rounded-lg">
        <div className="border-r p-4">
          <p className="text-[13px] font-medium">
            {t("lessorDashboard.acceptanceRate.title")}
          </p>
          <div className="flex items-center mt-7">
            <p className="text-xl font-medium">
              {data.stats.acceptanceRate?.toFixed(0) || 0}%
            </p>
            {getChangeIndicator(10, true)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("lessorDashboard.acceptanceRate.subtitle")}
          </p>
        </div>

        <div className="border-r p-4">
          <p className="text-[13px] font-medium">
            {t("lessorDashboard.responseRate.title")}
          </p>
          <div className="flex items-center mt-7">
            <p className="text-xl font-medium">
              {data.stats.responseRate?.toFixed(0) || 0}%
            </p>
            {getChangeIndicator(15, true)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("lessorDashboard.responseRate.subtitle")}
          </p>
        </div>

        <div className="p-4">
          <p className="text-[13px] font-medium">
            {t("lessorDashboard.responseTime.title")}
          </p>
          <div className="flex items-center mt-7">
            <p className="text-xl font-medium">
              {data.stats.responseTime
                ? `${data.stats.responseTime} min`
                : "N/A"}
            </p>
            {getChangeIndicator(-12, true)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t("lessorDashboard.responseTime.subtitle")}
          </p>
        </div>

        {/* Second row of metrics */}
        <Card className="h-fit shadow-none rounded-bl-lg rounded-br-none rounded-t-none border-t border-l-0 border-b-0 p-4">
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="flex items-center">
              <p className="text-[13px] me-auto font-medium text-[#222222]">
                {t("lessorDashboard.monthlyRevenue.title")}
              </p>
            </div>
            <div className="text-xl font-medium flex items-center text-[#222222] mt-5">
              {formatCurrency(data.revenueStats.currentMonthRevenue)}
              {getChangeIndicator(data.revenueStats.revenueChange, true)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("lessorDashboard.monthlyRevenue.subtitle", {
                amount: formatCurrency(data.revenueStats.lastMonthRevenue),
              })}
            </p>
          </CardContent>
        </Card>

        <Card className="h-fit shadow-none rounded-none border-t border-l-0 border-b-0 p-4">
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="flex items-center">
              <p className="text-[13px] me-auto font-medium text-[#222222]">
                {t("lessorDashboard.utilizationRate.title")}
              </p>
            </div>
            <div className="text-xl font-medium text-[#222222] mt-5">
              {(data.trailerStats.utilizationRate || 0).toFixed(1)}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("lessorDashboard.utilizationRate.subtitle")}
            </p>
          </CardContent>
        </Card>

        <Card className="h-fit shadow-none rounded-none border-t border-l-0 border-b-0 border-r-0 rounded-br-lg p-4">
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="flex items-center">
              <p className="text-[13px] me-auto font-medium text-[#222222]">
                {t("lessorDashboard.averageRating.title")}
              </p>
            </div>
            <div className="text-xl flex items-center font-medium text-[#222222] mt-5">
              {data.stats.averageRating ? (
                <>
                  <Star className="size-5 mr-1" />
                  {data.stats.averageRating.toFixed(1)}
                </>
              ) : (
                "N/A"
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("lessorDashboard.averageRating.subtitle")}
            </p>
          </CardContent>
        </Card>
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
              {(data.topPerformingTrailers || []).map((trailer, index) => (
                <div
                  key={trailer.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 min-w-6 rounded-full bg-white flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm max-w-[160px] truncate font-medium">
                        {trailer.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trailer.totalRentals}{" "}
                        {t("lessorDashboard.topPerformingTrailers.rentals")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ms-auto bg-[#222222] text-white text-xs rounded-full px-2 py-1 font-medium">
                    {formatCurrency(trailer.totalRevenue)}
                  </div>
                </div>
              ))}

              {(!data.topPerformingTrailers ||
                data.topPerformingTrailers.length === 0) && (
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
              {(data.mostViewedTrailers || []).map((trailer, index) => (
                <div
                  key={trailer.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 min-w-6 rounded-full bg-white flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm max-w-[160px] truncate font-medium">
                        {trailer.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "lessorDashboard.mostViewedTrailers.clicksFavorites"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ms-auto bg-[#222222] text-white text-xs rounded-full px-2 py-1">
                    <EyeIcon strokeWidth={1.5} className="size-3 text-white" />
                    <span className="font-medium">{trailer.views}</span>
                  </div>
                </div>
              ))}

              {(!data.mostViewedTrailers ||
                data.mostViewedTrailers.length === 0) && (
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
            {(data.upcomingRentals || []).length > 0 ? (
              data.upcomingRentals.map((rental) => (
                <div
                  key={rental.id}
                  className="flex items-center justify-start border-b pb-3 last:border-0"
                >
                  <img
                    className="size-12 rounded-full object-cover me-4"
                    alt={rental.trailerTitle}
                    src={rental?.images?.[0]?.url || "/images/placeholder.jpg"}
                    onError={(e) => {
                      e.currentTarget.src = "/images/placeholder.jpg";
                    }}
                  />
                  <div className="me-auto">
                    <p className="text-sm font-medium">{rental.trailerTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("lessorDashboard.upcomingRentals.renter", {
                        name: rental.renterName,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(rental.startDate)} -{" "}
                      {formatDate(rental.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(rental.totalPrice)}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {new Date(rental.startDate) > new Date()
                        ? t("lessorDashboard.upcomingRentals.status.pending")
                        : t("lessorDashboard.upcomingRentals.status.active")}
                    </Badge>
                  </div>
                </div>
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
