"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "../components/app-sidebar";
import { RevenueChart } from "../components/revenue-chart";
import { UserGrowthChart } from "../components/user-growth-chart";
import { LocationStatsChart } from "../components/location-stats-chart";
import { SiteHeader } from "../components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [metricsRes, revenueRes, userGrowthRes] = await Promise.all([
          fetch("/api/admin/statistics"),
          fetch(`/api/admin/statistics/revenue-trends?period=${period}`),
          fetch(`/api/admin/statistics/user-growth?period=${period}`),
        ]);

        if (!metricsRes.ok || !revenueRes.ok || !userGrowthRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const [metricsData, revenueResult, userGrowthResult] = await Promise.all([
          metricsRes.json(),
          revenueRes.json(),
          userGrowthRes.json(),
        ]);

        setMetrics(metricsData);
        setRevenueData(revenueResult.data || []);
        setUserGrowthData(userGrowthResult.data || []);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col overscroll-none">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overscroll-none">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
                <p className="text-muted-foreground">Detailed platform analytics and insights</p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue (Period)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      revenueData.reduce((sum, item) => sum + item.revenue, 0)
                    )}
                  </div>
                  <Badge variant="default" className="mt-2">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Platform fees
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    New Users (Period)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userGrowthData.reduce((sum, item) => sum + item.newUsers, 0)}
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    {userGrowthData.reduce((sum, item) => sum + item.newLessors, 0)} lessors
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Daily Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      revenueData.length > 0 
                        ? revenueData.reduce((sum, item) => sum + item.revenue, 0) / revenueData.length
                        : 0
                    )}
                  </div>
                  <Badge variant="outline" className="mt-2">
                    Per day
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Growth Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {parseFloat(metrics?.overview?.userGrowthRate || 0).toFixed(1)}%
                  </div>
                  <Badge variant="default" className="mt-2">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Monthly
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics Tabs */}
            <Tabs defaultValue="revenue" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="location">Geography</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="revenue" className="space-y-6">
                <RevenueChart data={revenueData} period={period} />
                
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Breakdown</CardTitle>
                      <CardDescription>Platform revenue sources</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Service Fees</span>
                        <span className="font-medium">
                          {formatCurrency(metrics?.financials?.totalRevenue || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Transaction Volume</span>
                        <span className="font-medium">
                          {formatCurrency(metrics?.financials?.totalTransactionVolume || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Monthly Revenue</span>
                        <span className="font-medium">
                          {formatCurrency(metrics?.financials?.monthlyRevenue || 0)}
                        </span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Payment Success Rate</span>
                          <Badge variant="default">
                            {metrics?.financials?.paymentSuccessRate || 100}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Trends</CardTitle>
                      <CardDescription>Key performance indicators</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Daily Average</span>
                        <span className="font-medium">
                          {formatCurrency(
                            revenueData.length > 0 
                              ? revenueData.reduce((sum, item) => sum + item.revenue, 0) / revenueData.length
                              : 0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Best Day</span>
                        <span className="font-medium">
                          {formatCurrency(
                            Math.max(...revenueData.map(item => item.revenue), 0)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Rentals</span>
                        <span className="font-medium">
                          {revenueData.reduce((sum, item) => sum + item.rentalCount, 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <UserGrowthChart data={userGrowthData} period={period} />
                
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Users</span>
                        <span className="font-medium">{metrics?.users?.total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Renters</span>
                        <span className="font-medium">{metrics?.users?.renters || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Lessors</span>
                        <span className="font-medium">{metrics?.users?.lessors || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Verified</span>
                        <span className="font-medium">{metrics?.users?.verified || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Activity Levels</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Daily Active</span>
                        <span className="font-medium">{metrics?.users?.activeDaily || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Weekly Active</span>
                        <span className="font-medium">{metrics?.users?.activeWeekly || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Monthly Active</span>
                        <span className="font-medium">{metrics?.users?.activeMonthly || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Growth Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">New Today</span>
                        <span className="font-medium">{metrics?.users?.newToday || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">New This Month</span>
                        <span className="font-medium">{metrics?.users?.newThisMonth || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Growth Rate</span>
                        <Badge variant="default">
                          {parseFloat(metrics?.overview?.userGrowthRate || 0).toFixed(1)}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="location" className="space-y-6">
                <LocationStatsChart data={metrics?.locationStats || []} />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                    <CardDescription>Rental activity by location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics?.locationStats?.slice(0, 10).map((location: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-primary rounded text-white text-xs flex items-center justify-center">
                              {index + 1}
                            </div>
                            <span className="font-medium">{location.city}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {location.count} rentals
                            </span>
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${Math.min(100, (location.count / (metrics?.locationStats?.[0]?.count || 1)) * 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Platform Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Completion Rate</span>
                        <Badge variant="default">
                          {metrics?.rentals?.completionRate || 0}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Cancellation Rate</span>
                        <Badge variant="secondary">
                          {metrics?.rentals?.cancellationRate || 0}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Payment Success</span>
                        <Badge variant="default">
                          {metrics?.financials?.paymentSuccessRate || 100}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Average Rating</span>
                        <span className="font-medium">
                          {metrics?.engagement?.averageRating || 0}/5
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Support & Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Open Tickets</span>
                        <span className="font-medium">{metrics?.support?.openTickets || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Response Time</span>
                        <span className="font-medium">{metrics?.support?.avgResponseTimeHours || 0}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Reviews</span>
                        <span className="font-medium">{metrics?.engagement?.totalReviews || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Monthly Searches</span>
                        <span className="font-medium">{(metrics?.engagement?.monthlySearches || 0).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Trailer Performance</CardTitle>
                    <CardDescription>Trailer metrics and utilization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{metrics?.trailers?.total || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Trailers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{metrics?.trailers?.active || 0}</div>
                        <div className="text-sm text-muted-foreground">Active Listings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{(metrics?.trailers?.totalViews || 0).toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Total Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{metrics?.trailers?.totalFavorites || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Favorites</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}