"use client";

import { 
  Users, 
  Package, 
  CreditCard, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Star,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: number;
  suffix?: string;
}

function MetricCard({ title, value, description, icon, trend, suffix }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}{suffix}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend !== undefined && (
          <div className="flex items-center mt-2">
            <Badge variant={trend > 0 ? "default" : "destructive"} className="text-xs">
              {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(trend).toFixed(1)}%
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricsGridProps {
  metrics: any;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  if (!metrics) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(metrics.overview?.totalRevenue || 0),
      description: "Platform service fees",
      icon: <CreditCard className="h-4 w-4" />,
      trend: metrics.overview?.monthlyRevenue > 0 ? 12.5 : -5.2,
    },
    {
      title: "Active Users",
      value: metrics.users?.activeDaily || 0,
      description: "Active in last 24 hours",
      icon: <Activity className="h-4 w-4" />,
      trend: parseFloat(metrics.overview?.userGrowthRate || 0),
    },
    {
      title: "Total Users",
      value: metrics.users?.total || 0,
      description: `${metrics.users?.verified || 0} verified`,
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "Active Rentals",
      value: metrics.rentals?.active || 0,
      description: `${metrics.rentals?.today || 0} started today`,
      icon: <Package className="h-4 w-4" />,
    },
    {
      title: "Completion Rate",
      value: metrics.rentals?.completionRate || 0,
      suffix: "%",
      description: "Successfully completed",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      title: "Total Trailers",
      value: metrics.trailers?.active || 0,
      description: `${metrics.trailers?.featured || 0} featured`,
      icon: <Package className="h-4 w-4" />,
    },
    {
      title: "Total Views",
      value: (metrics.trailers?.totalViews || 0).toLocaleString(),
      description: `Avg ${metrics.trailers?.averageViewsPerTrailer || 0} per trailer`,
      icon: <Eye className="h-4 w-4" />,
    },
    {
      title: "Average Rating",
      value: metrics.engagement?.averageRating || 0,
      suffix: "/5",
      description: `${metrics.engagement?.totalReviews || 0} reviews`,
      icon: <Star className="h-4 w-4" />,
    },
    {
      title: "Support Tickets",
      value: metrics.support?.openTickets || 0,
      description: `${metrics.support?.avgResponseTimeHours || 0}h avg response`,
      icon: <AlertCircle className="h-4 w-4" />,
    },
    {
      title: "Payment Success",
      value: metrics.financials?.paymentSuccessRate || 100,
      suffix: "%",
      description: `${metrics.financials?.failedPayments || 0} failed`,
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      title: "Monthly Searches",
      value: (metrics.engagement?.monthlySearches || 0).toLocaleString(),
      description: "User search activity",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      title: "New Lessors",
      value: metrics.users?.newThisMonth || 0,
      description: "This month",
      icon: <Users className="h-4 w-4" />,
      trend: 8.3,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card, index) => (
        <MetricCard key={index} {...card} />
      ))}
    </div>
  );
}