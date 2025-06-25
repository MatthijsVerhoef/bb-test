import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Heart,
  MessageSquare,
  Search,
  Star,
  PiggyBank,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  CalendarClock,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { useProfileTabs } from "@/hooks/useProfileTabs";

interface DashboardData {
  activeRentals: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    trailerTitle: string;
    trailerImage: string | null;
    ownerName: string;
    ownerResponseTime: number | null;
    totalPrice: number;
  }[];
  favoriteTrailers: {
    id: string;
    title: string;
    pricePerDay: number;
    image: string | null;
    isAvailable: boolean;
    nextAvailableDate: string | null;
  }[];
  recommendedTrailers: {
    id: string;
    title: string;
    pricePerDay: number;
    image: string | null;
    type: string | null;
    ownerName: string;
    ownerRating: number | null;
    ownerResponseRate: number | null;
  }[];
  messages: {
    id: string;
    senderName: string;
    senderImage: string | null;
    message: string;
    createdAt: string;
  }[];
  stats: {
    totalRentals: number;
    totalSavings: number;
    unreadMessages: number;
    favoriteCount: number;
  };
}

export default function RenterDashboard() {
  // Use a ref to track if we've already done the initial data fetch
  const initialFetchDone = useMemo(() => ({ done: false }), []);
  
  // Get the tab data hook values only once
  const { getTabData, refreshTabData } = useProfileTabs();
  
  // Store our fetch state in a ref to avoid re-renders
  const dataRef = useMemo(() => {
    const tabData = getTabData("overview");
    return { data: tabData };
  }, [getTabData]);
  
  // Use local state for UI values
  const [dashboardState, setDashboardState] = useState({
    isLoading: true,
    hasError: false,
    data: null as DashboardData | null,
  });
  
  // Handle the actual data fetching with a stable callback
  const updateDashboardData = useCallback(() => {
    const { data: tabData } = dataRef;
    
    if (tabData.error) {
      setDashboardState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
      }));
      return;
    }
    
    // Create safe version of dashboard data with defaults
    const safeData: DashboardData = {
      activeRentals: Array.isArray(tabData.data?.activeRentals) ? tabData.data.activeRentals : [],
      favoriteTrailers: Array.isArray(tabData.data?.favoriteTrailers) ? tabData.data.favoriteTrailers : [],
      recommendedTrailers: Array.isArray(tabData.data?.recommendedTrailers) ? tabData.data.recommendedTrailers : [],
      messages: Array.isArray(tabData.data?.messages) ? tabData.data.messages : [],
      stats: {
        totalRentals: typeof tabData.data?.stats?.totalRentals === 'number' ? tabData.data.stats.totalRentals : 0,
        totalSavings: typeof tabData.data?.stats?.totalSavings === 'number' ? tabData.data.stats.totalSavings : 0,
        unreadMessages: typeof tabData.data?.stats?.unreadMessages === 'number' ? tabData.data.stats.unreadMessages : 0,
        favoriteCount: typeof tabData.data?.stats?.favoriteCount === 'number' ? tabData.data.stats.favoriteCount : 0
      }
    };
    
    setDashboardState({
      isLoading: false,
      hasError: false,
      data: safeData,
    });
  }, [dataRef]);

  // Fetch data once on mount
  useEffect(() => {
    if (!initialFetchDone.done) {
      initialFetchDone.done = true;
      updateDashboardData();
    }
  }, [initialFetchDone, updateDashboardData]);

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) return "€0,00";
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Intl.DateTimeFormat("nl-NL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateStr;
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "CONFIRMED":
        return "outline";
      case "PENDING":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getDaysUntil = (date: string) => {
    if (!date) return 0;
    try {
      const now = new Date();
      const targetDate = new Date(date);
      const diffTime = targetDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      console.error("Error calculating days:", e);
      return 0;
    }
  };

  // In the RenterDashboard component, we'll always render at least the headers
  const renderHeader = () => (
    <div>
      <h2 className="text-2xl font-semibold text-[#222222] tracking-tight">
        Mijn huuroverzicht
      </h2>
      <p className="text-muted-foreground text-sm mt-1">
        Beheer je huidige reserveringen en vind nieuwe aanhangers
      </p>
    </div>
  );
  
  // If loading, still render the basic page structure
  if (dashboardState.isLoading) {
    return (
      <div className="space-y-6">
        {renderHeader()}
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (dashboardState.hasError) {
    return (
      <div className="space-y-6">
        {renderHeader()}
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-destructive">
            Er ging iets mis bij het laden van je dashboard
          </p>
        </div>
      </div>
    );
  }

  if (!dashboardState.data) {
    return (
      <div className="space-y-6">
        {renderHeader()}
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Geen gegevens beschikbaar</p>
        </div>
      </div>
    );
  }

  // Destructure data for easier access
  const { activeRentals, favoriteTrailers, recommendedTrailers, messages, stats } = dashboardState.data;

  return (
    <div className="space-y-6">
      {renderHeader()}

      {/* Important Information Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Active/Upcoming Rentals */}
        <Card className="p-0 bg-[#f6f8f9] border-0 shadow-none rounded-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Aankomend</h3>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-semibold">
                {activeRentals.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {
                  activeRentals.filter(
                    (r) => r.status === "ACTIVE"
                  ).length
                }{" "}
                nu actief,{" "}
                {
                  activeRentals.filter(
                    (r) => r.status === "CONFIRMED"
                  ).length
                }{" "}
                binnenkort
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Unread Messages */}
        <Card className="p-0 bg-[#f6f8f9] border-0 shadow-none rounded-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Ongelezen berichten</h3>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-semibold">
                {stats.unreadMessages}
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                Nieuwe berichten
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Savings */}
        <Card className="p-0 bg-[#f6f8f9] border-0 shadow-none rounded-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Totale besparing</h3>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-semibold">
                {formatCurrency(stats.totalSavings)}
              </div>
              <p className="text-xs text-muted-foreground">
                T.o.v. gem. marktprijzen
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Rentals */}
      {activeRentals.length > 0 && (
        <Card className="shadow-none border rounded-lg p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Huidige en aankomende huren
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 -mt-6">
            <div className="space-y-4">
              {activeRentals.map((rental) => (
                <div
                  key={rental.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    {rental.trailerImage ? (
                      <img
                        className="w-16 h-16 rounded-full object-cover"
                        alt={rental.trailerTitle}
                        src={rental.trailerImage}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <CalendarDays className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {rental.trailerTitle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Verhuurder: {rental.ownerName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getBadgeVariant(rental.status)}>
                          {rental.status === "ACTIVE" ? "Actief" : "Aankomend"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(rental.startDate)} -{" "}
                          {formatDate(rental.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {formatCurrency(rental.totalPrice)}
                    </p>
                    {rental.status === "CONFIRMED" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Over {getDaysUntil(rental.startDate)} dagen
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="my-8" />

      {/* Recommended Trailers */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Aanbevolen voor jou
          </CardTitle>
        </CardHeader>
        <CardContent className="-mt-3">
          <div className="space-y-4">
            {recommendedTrailers.slice(0, 3).map((trailer) => (
              <div
                key={trailer.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {trailer.image ? (
                    <img
                      className="w-10 h-10 rounded-full object-cover"
                      alt={trailer.title}
                      src={trailer.image}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{trailer.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatCurrency(trailer.pricePerDay)}/dag</span>
                      {trailer.ownerRating && (
                        <>
                          <span>•</span>
                          <span className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 mr-1" />
                            {trailer.ownerRating.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Link href={`/trailers/${trailer.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[13px] rounded-full"
                  >
                    Bekijk
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Favorite Trailers & Recommendations */}
      <div className="grid gap-6 md:grid-cols-1">
        {/* Favorite Trailers */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Favoriete aanhangers
            </CardTitle>
          </CardHeader>
          <CardContent className="-mt-3">
            {favoriteTrailers.length > 0 ? (
              <div className="space-y-4">
                {favoriteTrailers.map((trailer) => (
                  <div
                    key={trailer.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {trailer.image ? (
                        <img
                          className="w-10 h-10 rounded-full object-cover"
                          alt={trailer.title}
                          src={trailer.image}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Heart className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium mb-0.5">
                          {trailer.title}
                        </p>
                        <div className="flex items-center gap-1">
                          {trailer.isAvailable ? (
                            <div className="flex items-center text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Beschikbaar
                            </div>
                          ) : (
                            <div className="flex items-center text-xs text-red-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Vanaf {formatDate(trailer.nextAvailableDate!)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link href={`/trailers/${trailer.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[13px] rounded-full"
                      >
                        Huur nu
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Heart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Je hebt nog geen favoriete aanhangers
                </p>
                <Link href="/trailers">
                  <Button variant="outline" size="sm" className="mt-4">
                    Zoek aanhangers
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      {messages.length > 0 && (
        <Card className="shadow-none border rounded-lg p-6 mt-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recente berichten
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="flex items-start gap-3 border-b pb-4 last:border-0 last:pb-0"
                >
                  {message.senderImage ? (
                    <img
                      className="w-8 h-8 rounded-full object-cover"
                      alt={message.senderName}
                      src={message.senderImage}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {message.senderName?.[0] || ""}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">
                        {message.senderName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}