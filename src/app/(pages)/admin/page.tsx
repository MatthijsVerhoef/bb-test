"use client";

import { useEffect, useState } from "react";
import { ChartAreaInteractive } from "./components/chart-area-interactive";
import { RentalStatusChart } from "./components/rental-status-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TrendingUp,
  Users,
  CreditCard,
  Package,
  Activity,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/statistics");
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics?.overview?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform service fees
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="default" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                12.5%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.users?.activeDaily || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active in last 24 hours
            </p>
            <div className="flex items-center mt-2">
              <Badge variant="default" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                {parseFloat(metrics?.overview?.userGrowthRate || 0).toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Rentals
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.rentals?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
            <div className="flex items-center mt-2">
              <span className="text-xs text-muted-foreground">
                {metrics?.rentals?.today || 0} started today
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.users?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.users?.verified || 0} verified
            </p>
            <div className="flex items-center mt-2">
              <span className="text-xs text-muted-foreground">
                {metrics?.users?.newThisMonth || 0} new this month
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 py-0 border-0">
          <ChartAreaInteractive data={metrics?.visitorData} />
        </Card>
        <Card className="md:col-span-3 py-0 border-0">
          <RentalStatusChart
            data={{
              active: metrics?.rentals?.active || 0,
              completed: metrics?.rentals?.completed || 0,
              cancelled: metrics?.rentals?.cancelled || 0,
              pending: Math.max(
                0,
                (metrics?.rentals?.total || 0) -
                  ((metrics?.rentals?.active || 0) +
                    (metrics?.rentals?.completed || 0) +
                    (metrics?.rentals?.cancelled || 0) +
                    (metrics?.rentals?.disputed || 0))
              ),
              disputed: metrics?.rentals?.disputed || 0,
            }}
          />
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Completion Rate</span>
              <span className="font-medium">
                {metrics?.rentals?.completionRate || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Payment Success</span>
              <span className="font-medium">
                {metrics?.financials?.paymentSuccessRate || 100}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Support Tickets</span>
              <span className="font-medium">
                {metrics?.support?.openTickets || 0} open
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              User Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Renters</span>
              <span className="font-medium">
                {metrics?.users?.renters || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Lessors</span>
              <span className="font-medium">
                {metrics?.users?.lessors || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Weekly Active</span>
              <span className="font-medium">
                {metrics?.users?.activeWeekly || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics?.locationStats
              ?.slice(0, 3)
              .map((location: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{location.city}</span>
                  <span className="font-medium">{location.count}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
